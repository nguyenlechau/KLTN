import { Router } from 'express';
import { db } from '../../db/pool.js';
import { requirePermission } from '../../middleware/auth.js';
import { AuthenticatedRequest } from '../../types.js';
import {
  isBudgetWithinLimit,
  isEndDateAfterStartDate,
  isNonWhitespaceText,
  isValidPhone10Digits,
} from '../../utils/validation.js';
import { evaluateRegistrationTransition } from '../../workflow/machine.js';
import { WorkflowAction, WorkflowItemCheck } from '../../workflow/types.js';

export const registrationsRouter = Router();

registrationsRouter.get('/', requirePermission('registration.view'), async (_req, res) => {
  const result = await db.query('SELECT * FROM advertising_registrations ORDER BY created_at DESC');
  res.json(result.rows);
});

registrationsRouter.post('/', requirePermission('registration.create'), async (req: AuthenticatedRequest, res) => {
  const {
    campaignName,
    campaignDescription,
    budgetEstimate,
    startDate,
    endDate,
    documentKey,
    representativeName,
    representativePhone,
    contentMode,
    contentId,
    newContent,
    selectedItemIds,
  } = req.body;

  if (
    !isNonWhitespaceText(campaignName) ||
    !isBudgetWithinLimit(Number(budgetEstimate)) ||
    !isEndDateAfterStartDate(startDate, endDate)
  ) {
    res.status(400).json({ message: 'Invalid campaign data' });
    return;
  }

  if (representativePhone && !isValidPhone10Digits(representativePhone)) {
    res.status(400).json({ message: 'Representative phone must be exactly 10 digits' });
    return;
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    let finalContentId = contentId;

    if (contentMode === 'NEW') {
      if (!newContent || !isNonWhitespaceText(newContent.name) || !isEndDateAfterStartDate(newContent.startDate, newContent.endDate)) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Invalid new content payload' });
        return;
      }

      const contentInsert = await client.query(
        `INSERT INTO advertising_contents(
          channel_id, category_id, name, description, start_date, end_date, image_keys, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8)
        RETURNING id`,
        [
          newContent.channelId,
          newContent.categoryId ?? null,
          newContent.name.trim(),
          newContent.description ?? null,
          newContent.startDate,
          newContent.endDate,
          JSON.stringify(newContent.imageKeys ?? []),
          req.user?.id,
        ],
      );

      finalContentId = contentInsert.rows[0].id;
    }

    if (contentMode === 'EXISTING') {
      const valid = await client.query(
        `SELECT id FROM advertising_contents
          WHERE id = $1
            AND CURRENT_DATE <= end_date`,
        [contentId],
      );

      if (!valid.rowCount) {
        await client.query('ROLLBACK');
        res.status(409).json({ message: 'Selected content is expired or missing' });
        return;
      }
    }

    const registrationNo = `REG-${Date.now()}`;

    const registrationInsert = await client.query(
      `INSERT INTO advertising_registrations(
        registration_no, campaign_name, campaign_description, budget_estimate,
        start_date, end_date, document_key, representative_name, representative_phone,
        content_id, status, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT',$11,$11)
      RETURNING *`,
      [
        registrationNo,
        campaignName.trim(),
        campaignDescription ?? null,
        budgetEstimate,
        startDate,
        endDate,
        documentKey ?? null,
        representativeName ?? null,
        representativePhone ?? null,
        finalContentId ?? null,
        req.user?.id,
      ],
    );

    const registration = registrationInsert.rows[0];

    let totalAmount = 0;

    if (Array.isArray(selectedItemIds) && selectedItemIds.length > 0) {
      const itemPrices = await client.query(
        `SELECT pi.id AS physical_item_id, c.unit_price
           FROM physical_items pi
           JOIN categories c ON c.id = pi.category_id
          WHERE pi.id = ANY($1::uuid[])`,
        [selectedItemIds],
      );

      for (const row of itemPrices.rows) {
        await client.query(
          `INSERT INTO registration_items(registration_id, physical_item_id, unit_price, quantity)
           VALUES ($1, $2, $3, 1)`,
          [registration.id, row.physical_item_id, row.unit_price],
        );
        totalAmount += Number(row.unit_price);
      }
    }

    if (totalAmount > Number(budgetEstimate)) {
      await client.query('ROLLBACK');
      res.status(409).json({
        message: 'Total amount exceeds budget estimate',
        code: 'BUDGET_EXCEEDED',
      });
      return;
    }

    await client.query(
      `INSERT INTO audit_logs(entity_type, entity_id, user_id, action, old_value, new_value)
       VALUES ('advertising_registrations', $1, $2, 'CREATE', NULL, $3::jsonb)`,
      [registration.id, req.user?.id, JSON.stringify(registration)],
    );

    await client.query('COMMIT');
    res.status(201).json(registration);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

registrationsRouter.post('/:id/workflow-action', requirePermission('registration.view'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action } = req.body as { action: WorkflowAction };

  const registrationResult = await db.query('SELECT * FROM advertising_registrations WHERE id = $1', [id]);
  if (!registrationResult.rowCount) {
    res.status(404).json({ message: 'Registration not found' });
    return;
  }

  const registration = registrationResult.rows[0];

  const itemResult = await db.query(
    `SELECT pi.id,
            pi.status,
            COALESCE(pi.image_key, '') <> '' AS deployment_image_uploaded,
            ri.note AS inactive_note
       FROM registration_items ri
       JOIN physical_items pi ON pi.id = ri.physical_item_id
      WHERE ri.registration_id = $1`,
    [id],
  );

  const workflowItems: WorkflowItemCheck[] = itemResult.rows.map((row: {
    id: string;
    status: WorkflowItemCheck['status'];
    deployment_image_uploaded: boolean;
    inactive_note?: string | null;
  }) => ({
    id: row.id,
    status: row.status,
    deploymentImageUploaded: row.deployment_image_uploaded,
    inactiveNote: row.inactive_note,
  }));

  const totalResult = await db.query(
    'SELECT COALESCE(SUM(total_amount),0)::numeric AS total FROM registration_items WHERE registration_id = $1',
    [id],
  );

  const evaluation = evaluateRegistrationTransition(action, {
    registrationId: id,
    currentState: registration.status,
    actor: {
      userId: req.user!.id,
      role: req.user!.role,
    },
    budgetEstimate: Number(registration.budget_estimate),
    totalAmount: Number(totalResult.rows[0].total),
    managerApprovedAt: registration.approved_at,
    items: workflowItems,
    now: new Date(),
  });

  if (!evaluation.ok) {
    res.status(409).json(evaluation);
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE advertising_registrations
          SET status = $2,
              approved_at = CASE WHEN $3::text = 'SET_APPROVED_AT' THEN NOW() ELSE approved_at END,
              updated_by = $4,
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [id, evaluation.nextState, evaluation.transition.sideEffects.includes('SET_APPROVED_AT') ? 'SET_APPROVED_AT' : null, req.user?.id],
    );

    await client.query(
      `INSERT INTO audit_logs(entity_type, entity_id, user_id, action, old_value, new_value)
       VALUES ('advertising_registrations', $1, $2, $3, $4::jsonb, $5::jsonb)`,
      [
        id,
        req.user?.id,
        `WORKFLOW_${action}`,
        JSON.stringify({ status: registration.status }),
        JSON.stringify({ status: evaluation.nextState }),
      ],
    );

    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

registrationsRouter.get('/:id/history', requirePermission('audit.view'), async (req, res) => {
  const result = await db.query(
    `SELECT * FROM audit_logs
      WHERE entity_type = 'advertising_registrations'
        AND entity_id = $1
      ORDER BY created_at DESC`,
    [req.params.id],
  );

  res.json(result.rows);
});
