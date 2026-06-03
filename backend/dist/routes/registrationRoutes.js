/**
 * Registration and Workflow Routes
 */
import { Router } from 'express';
import * as registrationService from '../services/registrationService.js';
import * as workflowService from '../services/workflowService.js';
const router = Router();
// ============================================================
// REGISTRATION ROUTES
// ============================================================
/**
 * GET /api/v1/registrations
 * List registrations
 */
router.get('/registrations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;
        const state = req.query.state;
        const departmentId = req.query.departmentId;
        const result = await registrationService.listRegistrations(limit, offset, search, state, departmentId);
        res.json({
            ok: true,
            data: result.items,
            pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/registrations/:id
 * Get single registration with all details
 */
router.get('/registrations/:id', async (req, res) => {
    try {
        const details = await registrationService.getRegistrationDetails(req.params.id);
        if (!details)
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        res.json({ ok: true, data: details });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/registrations
 * Create new registration
 */
router.post('/registrations', async (req, res) => {
    try {
        const { campaign_name, department_id, channel_id, brand_name, contact_person, phone, email, budget_total, deployment_date, notes, } = req.body;
        if (!campaign_name || !department_id || !channel_id || !brand_name || !budget_total) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const registration = await registrationService.createRegistration({
            campaign_name,
            department_id,
            channel_id,
            brand_name,
            contact_person,
            phone,
            email,
            budget_total,
            deployment_date,
            notes,
            created_by: req.user.id,
        });
        res.status(201).json({ ok: true, data: registration });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * PUT /api/v1/registrations/:id
 * Update registration
 */
router.put('/registrations/:id', async (req, res) => {
    try {
        const updated = await registrationService.updateRegistration(req.params.id, req.body);
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        const message = error.message;
        if (message === 'Registration not found') {
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        }
        res.status(500).json({ ok: false, error: message });
    }
});
/**
 * DELETE /api/v1/registrations/:id
 * Delete registration (soft delete)
 */
router.delete('/registrations/:id', async (req, res) => {
    try {
        await registrationService.deleteRegistration(req.params.id);
        res.json({ ok: true, message: 'Registration deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/registrations/:id/content
 * Add content to registration
 */
router.post('/registrations/:id/content', async (req, res) => {
    try {
        const { content_id, start_date, end_date, quantity } = req.body;
        if (!content_id || !start_date || !end_date || !quantity) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const content = await registrationService.addRegistrationContent(req.params.id, content_id, start_date, end_date, quantity);
        res.status(201).json({ ok: true, data: content });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/registrations/content/:contentId
 * Remove content from registration
 */
router.delete('/registrations/content/:contentId', async (req, res) => {
    try {
        await registrationService.removeRegistrationContent(req.params.contentId);
        res.json({ ok: true, message: 'Content removed from registration' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/registrations/:id/items
 * Add item to registration
 */
router.post('/registrations/:id/items', async (req, res) => {
    try {
        const { item_id, category_id, quantity } = req.body;
        if (!item_id || !category_id || !quantity) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const item = await registrationService.addRegistrationItem(req.params.id, item_id, category_id, quantity);
        res.status(201).json({ ok: true, data: item });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/registrations/:id/items/:itemId
 * Remove item from registration
 */
router.delete('/registrations/:id/items/:itemId', async (req, res) => {
    try {
        await registrationService.removeRegistrationItem(req.params.itemId, req.params.id);
        res.json({ ok: true, message: 'Item removed from registration' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/registrations/:id/validate
 * Validate registration
 */
router.get('/registrations/:id/validate', async (req, res) => {
    try {
        const budgetCheck = await registrationService.validateBudget(req.params.id);
        const itemsCheck = await registrationService.validateAllItemsActionable(req.params.id);
        res.json({
            ok: true,
            data: {
                budget: budgetCheck,
                items: itemsCheck,
                valid: budgetCheck.valid && itemsCheck.valid,
            },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// ============================================================
// WORKFLOW ROUTES
// ============================================================
/**
 * GET /api/v1/workflow/states
 * Get all workflow states info
 */
router.get('/workflow/states', async (req, res) => {
    try {
        const states = workflowService.getAllStatesInfo();
        res.json({ ok: true, data: states });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/registrations/:id/workflow
 * Get workflow state info for registration
 */
router.get('/registrations/:id/workflow', async (req, res) => {
    try {
        const registration = await registrationService.getRegistrationById(req.params.id);
        if (!registration)
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        const stateInfo = workflowService.getStateInfo(registration.workflow_state);
        const history = await workflowService.getWorkflowHistory(req.params.id);
        res.json({ ok: true, data: { current: stateInfo, history } });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/registrations/:id/transition
 * Transition registration to new state
 */
router.post('/registrations/:id/transition', async (req, res) => {
    try {
        const { to_state, reason } = req.body;
        if (!to_state) {
            return res.status(400).json({ ok: false, error: 'to_state required' });
        }
        const transition = await workflowService.transitionState(req.params.id, to_state, req.user.id, reason);
        res.json({ ok: true, data: transition });
    }
    catch (error) {
        const message = error.message;
        if (message === 'Registration not found') {
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        }
        res.status(500).json({ ok: false, error: message });
    }
});
/**
 * GET /api/v1/registrations/:id/available-transitions
 * Get available transitions for current state
 */
router.get('/registrations/:id/available-transitions', async (req, res) => {
    try {
        const registration = await registrationService.getRegistrationById(req.params.id);
        if (!registration)
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        const transitions = workflowService.getAvailableTransitions(registration.workflow_state);
        const stateInfos = transitions.map((t) => workflowService.getStateInfo(t));
        res.json({ ok: true, data: stateInfos });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
export default router;
