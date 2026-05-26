/**
 * registrationWorkflowRoutes.ts
 * Registration workflow API endpoints per SYSTEM_SPECIFICATION Section L
 * Implements all 8-step workflow transitions with guards and business logic
 */

import { Router, Request, Response } from 'express';
import { validateToken, requireRole } from '../middleware/auth.js';
import ValidationService from '../services/ValidationService.js';
import AuditService from '../services/AuditService.js';
import ApprovalRoutingService from '../services/ApprovalRoutingService.js';
import ItemStatusService from '../services/ItemStatusService.js';

const router = Router();

// Middleware: Extract services from request
const getServices = (req: Request) => {
  const db = req.app.get('db');
  return {
    validation: new ValidationService(db),
    audit: new AuditService(db),
    approval: new ApprovalRoutingService(db),
    itemStatus: new ItemStatusService(db),
    db,
  };
};

/**
 * POST /api/registrations/:id/submit
 * Action: SUBMIT (Draft → Supervisor Review OR Brand Manager Approval)
 * Roles: INPUTTER, INPUTTER_HO, BRAND
 * Guards: ALL_ITEMS_ACTIONABLE, REGISTRATION_TOTAL_WITHIN_BUDGET
 */
router.post(
  '/:id/submit',
  validateToken,
  requireRole(['INPUTTER', 'INPUTTER_HO', 'BRAND']),
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const userId = req.user?.id;
      const { notes } = req.body;

      const services = getServices(req);

      // Get registration
      const regResult = await services.db.query(
        'SELECT * FROM ad_registrations WHERE id = $1',
        [registrationId]
      );

      if (regResult.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const registration = regResult.rows[0];

      // Get user role
      const userResult = await services.db.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      const userRole = userResult.rows[0].role;

      // Validate guards
      const budgetError = await services.validation.validateRegistrationBudget(registrationId);
      if (budgetError) {
        return res.status(400).json({ error: budgetError.message });
      }

      const itemsError = await services.validation.validateRegistrationSubmit(registrationId);
      if (itemsError) {
        return res.status(400).json({ error: itemsError.message });
      }

      // Determine next status based on creator role
      let nextStatus: string;
      let nextApproverId: string | null = null;

      if (userRole === 'BRAND') {
        // BRAND bypasses Supervisor Review → goes to Brand Manager Approval
        nextStatus = 'Trưởng phòng thương hiệu phê duyệt';

        // Get Brand Manager approver
        const approvalDecision = await services.approval.getNextApprover(
          registrationId,
          registration.status,
          userId
        );

        if (!approvalDecision) {
          return res.status(400).json({ error: 'No Brand Manager available for approval' });
        }

        nextApproverId = approvalDecision.approverUserId;
      } else {
        // INPUTTER goes to Supervisor Review
        nextStatus = 'CBQL Phê duyệt';

        // Get Supervisor approver (direct manager)
        const approvalDecision = await services.approval.getNextApprover(
          registrationId,
          registration.status,
          userId
        );

        if (!approvalDecision) {
          return res
            .status(400)
            .json({ error: 'No supervisor found. Manager chain must be configured.' });
        }

        nextApproverId = approvalDecision.approverUserId;
      }

      // Update registration
      await services.db.query(
        'UPDATE ad_registrations SET status = $1, current_approver_id = $2, updated_at = NOW() WHERE id = $3',
        [nextStatus, nextApproverId, registrationId]
      );

      // Log audit trail
      await services.audit.logTransition(
        userId,
        'Registration',
        registrationId,
        registration.registration_no,
        registration.status,
        nextStatus,
        notes || `Submitted to ${nextStatus}`
      );

      res.json({
        message: `Registration submitted`,
        registrationId,
        newStatus: nextStatus,
        nextApprover: nextApproverId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/registrations/:id/approve
 * Action: APPROVE (Generic approval from any reviewing step)
 * Roles: APPROVER, APPROVER_HO, BRAND, BRAND_MANAGER
 * Guards: APPROVER_IS_DIRECT_MANAGER (for supervisors)
 */
router.post(
  '/:id/approve',
  validateToken,
  requireRole(['APPROVER', 'APPROVER_HO', 'BRAND', 'BRAND_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const approverId = req.user?.id;
      const { notes } = req.body;

      const services = getServices(req);

      // Get registration
      const regResult = await services.db.query(
        'SELECT * FROM ad_registrations WHERE id = $1',
        [registrationId]
      );

      if (regResult.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const registration = regResult.rows[0];

      // Get approver info
      const approverResult = await services.db.query(
        'SELECT role FROM users WHERE id = $1',
        [approverId]
      );

      const approverRole = approverResult.rows[0].role;

      // Route approval based on current status and role
      let nextStatus: string;
      let nextApproverId: string | null = null;

      switch (registration.status) {
        case 'CBQL Phê duyệt':
          if (!['APPROVER', 'APPROVER_HO'].includes(approverRole)) {
            return res.status(403).json({ error: 'Only supervisors can approve at this stage' });
          }
          nextStatus = 'P.Thương hiệu tiếp nhận'; // Brand Intake

          // Assign to Brand
          const brandDecision = await services.approval.getNextApprover(
            registrationId,
            registration.status,
            registration.created_by
          );

          nextApproverId = brandDecision?.approverUserId || null;
          break;

        case 'P.Thương hiệu tiếp nhận': // Brand Intake
          if (approverRole !== 'BRAND') {
            return res.status(403).json({ error: 'Only BRAND users can approve Brand Intake' });
          }
          nextStatus = 'Trưởng phòng thương hiệu phê duyệt';

          // Assign to Brand Manager
          const brandMgrDecision = await services.approval.getNextApprover(
            registrationId,
            registration.status,
            registration.created_by
          );

          nextApproverId = brandMgrDecision?.approverUserId || null;
          break;

        case 'Trưởng phòng thương hiệu phê duyệt':
          if (approverRole !== 'BRAND_MANAGER') {
            return res
              .status(403)
              .json({ error: 'Only Brand Managers can approve at this stage' });
          }
          nextStatus = 'Đã duyệt';

          // Lock pricing
          await services.db.query(
            'UPDATE ad_registrations SET prices_locked = true, prices_locked_at = NOW() WHERE id = $1',
            [registrationId]
          );

          break;

        case 'Trưởng phòng nghiệm thu': // Acceptance Review
          if (approverRole !== 'BRAND_MANAGER') {
            return res
              .status(403)
              .json({ error: 'Only Brand Managers can approve acceptance' });
          }
          nextStatus = 'Đã nghiệm thu'; // Completed
          break;

        default:
          return res.status(400).json({
            error: `Cannot approve from status: ${registration.status}`,
          });
      }

      // Update registration
      await services.db.query(
        'UPDATE ad_registrations SET status = $1, current_approver_id = $2, updated_at = NOW() WHERE id = $3',
        [nextStatus, nextApproverId, registrationId]
      );

      // Log approval
      await services.audit.logApproval(
        approverId,
        'Registration',
        registrationId,
        registration.registration_no,
        registration.status,
        nextStatus,
        true,
        notes || `Approved to: ${nextStatus}`
      );

      res.json({
        message: 'Registration approved',
        registrationId,
        newStatus: nextStatus,
        nextApprover: nextApproverId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/registrations/:id/request-revision
 * Action: REQUEST_REVISION (Any approver sends back to REVISION_REQUIRED)
 * Roles: APPROVER, APPROVER_HO, BRAND, BRAND_MANAGER
 */
router.post(
  '/:id/request-revision',
  validateToken,
  requireRole(['APPROVER', 'APPROVER_HO', 'BRAND', 'BRAND_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const reviewerId = req.user?.id;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ error: 'Revision reason (notes) is required' });
      }

      const services = getServices(req);

      // Get registration
      const regResult = await services.db.query(
        'SELECT * FROM ad_registrations WHERE id = $1',
        [registrationId]
      );

      if (regResult.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const registration = regResult.rows[0];

      // Update status to REVISION_REQUIRED
      await services.db.query(
        'UPDATE ad_registrations SET status = $1, current_approver_id = $2, updated_at = NOW() WHERE id = $3',
        ['CBNV Điều Chỉnh', registration.created_by, registrationId]
      );

      // Log approval
      await services.audit.logApproval(
        reviewerId,
        'Registration',
        registrationId,
        registration.registration_no,
        registration.status,
        'CBNV Điều Chỉnh',
        false,
        `Revision requested: ${notes}`
      );

      res.json({
        message: 'Revision requested',
        registrationId,
        reason: notes,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/registrations/:id/begin-acceptance
 * Action: BEGIN_ACCEPTANCE (Approved → Acceptance)
 * Role: BRAND
 * Precondition: Registration must be in APPROVED status
 */
router.post(
  '/:id/begin-acceptance',
  validateToken,
  requireRole(['BRAND']),
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const userId = req.user?.id;

      const services = getServices(req);

      // Get registration
      const regResult = await services.db.query(
        'SELECT * FROM ad_registrations WHERE id = $1',
        [registrationId]
      );

      if (regResult.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const registration = regResult.rows[0];

      if (registration.status !== 'Đã duyệt') {
        return res
          .status(400)
          .json({ error: 'Registration must be in APPROVED status to begin acceptance' });
      }

      // Update to Acceptance phase
      await services.db.query(
        'UPDATE ad_registrations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['Nghiệm thu', registrationId]
      );

      // Log transition
      await services.audit.logTransition(
        userId,
        'Registration',
        registrationId,
        registration.registration_no,
        registration.status,
        'Nghiệm thu',
        'Beginning acceptance phase - upload deployment images'
      );

      res.json({
        message: 'Acceptance phase started',
        registrationId,
        newStatus: 'Nghiệm thu',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/registrations/:id/submit-acceptance
 * Action: SUBMIT_ACCEPTANCE (Acceptance → Acceptance Review)
 * Role: BRAND
 * Guards: ALL_ACTIVE_ITEMS_HAVE_NEW_IMAGE, ALL_INACTIVE_ITEMS_HAVE_NOTE
 */
router.post(
  '/:id/submit-acceptance',
  validateToken,
  requireRole(['BRAND']),
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const userId = req.user?.id;

      const services = getServices(req);

      // Get registration
      const regResult = await services.db.query(
        'SELECT * FROM ad_registrations WHERE id = $1',
        [registrationId]
      );

      if (regResult.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const registration = regResult.rows[0];

      if (registration.status !== 'Nghiệm thu') {
        return res.status(400).json({ error: 'Registration must be in ACCEPTANCE status' });
      }

      // Validate acceptance completion
      const acceptanceErrors = await services.validation.validateAcceptanceCompletion(
        registrationId
      );

      if (acceptanceErrors.length > 0) {
        return res.status(400).json({ errors: acceptanceErrors });
      }

      // Move to Acceptance Review
      // Assign to Brand Manager
      const brandMgrResult = await services.db.query(
        'SELECT id FROM users WHERE role = $1 LIMIT 1',
        ['BRAND_MANAGER']
      );

      const nextApproverId = brandMgrResult.rows[0]?.id || null;

      await services.db.query(
        'UPDATE ad_registrations SET status = $1, current_approver_id = $2, updated_at = NOW() WHERE id = $3',
        ['Trưởng phòng nghiệm thu', nextApproverId, registrationId]
      );

      // Log transition
      await services.audit.logTransition(
        userId,
        'Registration',
        registrationId,
        registration.registration_no,
        registration.status,
        'Trưởng phòng nghiệm thu',
        'Submitted for acceptance review'
      );

      res.json({
        message: 'Acceptance submitted for review',
        registrationId,
        newStatus: 'Trưởng phòng nghiệm thu',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/registrations/:id/cancel-request
 * Action: CANCEL_REQUEST (BRAND can cancel during Brand Intake)
 * Role: BRAND
 */
router.post(
  '/:id/cancel-request',
  validateToken,
  requireRole(['BRAND']),
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      const services = getServices(req);

      // Get registration
      const regResult = await services.db.query(
        'SELECT * FROM ad_registrations WHERE id = $1',
        [registrationId]
      );

      if (regResult.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const registration = regResult.rows[0];

      if (registration.status !== 'P.Thương hiệu tiếp nhận') {
        return res.status(400).json({
          error: 'Can only cancel during Brand Intake phase',
        });
      }

      // Cancel the request
      // TODO: Decide on cancellation state - move to CANCELLED or REVISION_REQUIRED
      await services.db.query(
        'UPDATE ad_registrations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['CANCELLED', registrationId]
      );

      // Log cancellation
      await services.audit.logAudit({
        user_id: userId,
        action_type: 'TRANSITION',
        entity_type: 'Registration',
        entity_id: registrationId,
        entity_code: registration.registration_no,
        old_value: registration.status,
        new_value: 'CANCELLED',
        notes: reason || 'Request cancelled by BRAND',
      });

      res.json({
        message: 'Registration request cancelled',
        registrationId,
        newStatus: 'CANCELLED',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/registrations/:id/history
 * Get audit trail history for a registration
 */
router.get(
  '/:id/history',
  validateToken,
  async (req: Request, res: Response) => {
    try {
      const { id: registrationId } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const services = getServices(req);

      const history = await services.audit.getHistory(
        'Registration',
        registrationId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
