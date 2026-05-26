import { Response, Router } from 'express';
import { db } from '../../db/pool.js';
import { requirePermission } from '../../middleware/auth.js';
import { AuthenticatedRequest } from '../../types.js';
import { isValidDimension } from '../../utils/validation.js';

export const physicalItemsRouter = Router();

physicalItemsRouter.get('/', requirePermission('physical_item.view'), async (_req: AuthenticatedRequest, res: Response) => {
  const result = await db.query('SELECT * FROM physical_items ORDER BY created_at DESC');
  res.json(result.rows);
});

physicalItemsRouter.post('/wizard/preview', requirePermission('physical_item.create'), async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId, locationId, quantity } = req.body;

  if (!categoryId || !locationId || !Number.isInteger(quantity) || quantity <= 0) {
    res.status(400).json({ message: 'Invalid wizard step 1 input' });
    return;
  }

  const [category, location, seq] = await Promise.all([
    db.query('SELECT id, code, name, status FROM categories WHERE id = $1', [categoryId]),
    db.query('SELECT id, code, name, status FROM locations WHERE id = $1', [locationId]),
    db.query(
      'SELECT COALESCE(MAX(seq_no), 0)::int AS max_seq FROM physical_items WHERE category_id = $1 AND location_id = $2',
      [categoryId, locationId],
    ),
  ]);

  if (!category.rowCount || !location.rowCount) {
    res.status(404).json({ message: 'Category or location not found' });
    return;
  }

  const categoryData = category.rows[0];
  const locationData = location.rows[0];
  const startSeq = seq.rows[0].max_seq + 1;

  const generatedItems = Array.from({ length: quantity }).map((_, index) => {
    const nextSeq = startSeq + index;
    return {
      seqNo: nextSeq,
      itemCode: `${locationData.code}.${categoryData.code}.${String(nextSeq).padStart(4, '0')}`,
      itemName: `${categoryData.name} ${locationData.name} ${String(nextSeq).padStart(4, '0')}`,
      inferredStatus:
        categoryData.status === 'ACTIVE' && locationData.status === 'ACTIVE'
          ? 'ACTIVE'
          : 'INACTIVE',
    };
  });

  res.json({ generatedItems });
});

physicalItemsRouter.post('/wizard/commit', requirePermission('physical_item.create'), async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId, locationId, items } = req.body as {
    categoryId: string;
    locationId: string;
    items: Array<{
      seqNo: number;
      itemCode: string;
      itemName: string;
      width: number;
      length: number;
      imageKey?: string;
      description?: string;
    }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'No items to create' });
    return;
  }

  for (const item of items) {
    if (!isValidDimension(item.width) || !isValidDimension(item.length)) {
      res.status(400).json({ message: 'Invalid width/length. Max 99.99, 2 decimals.' });
      return;
    }
  }

  const statusCheck = await db.query(
    `SELECT c.status AS category_status, l.status AS location_status,
            (SELECT ch.id FROM channels ch WHERE ch.location_id = l.id ORDER BY ch.created_at ASC LIMIT 1) AS channel_id
       FROM categories c
       JOIN locations l ON l.id = $2
      WHERE c.id = $1`,
    [categoryId, locationId],
  );

  if (!statusCheck.rowCount) {
    res.status(404).json({ message: 'Category/location not found' });
    return;
  }

  const inheritedStatus =
    statusCheck.rows[0].category_status === 'ACTIVE' &&
    statusCheck.rows[0].location_status === 'ACTIVE'
      ? 'ACTIVE'
      : 'INACTIVE';

  const inferredChannelId = statusCheck.rows[0].channel_id;
  if (!inferredChannelId) {
    res.status(400).json({ message: 'No channel found for selected location' });
    return;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const created = [];
    for (const item of items) {
      const result = await client.query(
        `INSERT INTO physical_items(
          channel_id, category_id, location_id, seq_no, item_code, item_name,
          width, length, image_key, description, status, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
        RETURNING *`,
        [
          inferredChannelId,
          categoryId,
          locationId,
          item.seqNo,
          item.itemCode,
          item.itemName,
          item.width,
          item.length,
          item.imageKey ?? null,
          item.description ?? null,
          inheritedStatus,
          req.user?.id,
        ],
      );
      created.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(created);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

physicalItemsRouter.patch('/:id', requirePermission('physical_item.update'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { width, length, imageKey, description } = req.body;

  const existing = await db.query('SELECT status FROM physical_items WHERE id = $1', [id]);
  if (!existing.rowCount) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  const blocked = new Set(['PENDING', 'ON_HOLD', 'IN_PROGRESS']);
  if (blocked.has(existing.rows[0].status)) {
    res.status(409).json({
      message: 'Item cannot be edited while status is Pending/On Hold/In Progress',
    });
    return;
  }

  if ((width !== undefined && !isValidDimension(width)) || (length !== undefined && !isValidDimension(length))) {
    res.status(400).json({ message: 'Invalid width/length. Max 99.99, 2 decimals.' });
    return;
  }

  const updated = await db.query(
    `UPDATE physical_items
        SET width = COALESCE($2, width),
            length = COALESCE($3, length),
            image_key = COALESCE($4, image_key),
            description = COALESCE($5, description),
            updated_by = $6,
            updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [id, width, length, imageKey, description, req.user?.id],
  );

  res.json(updated.rows[0]);
});
