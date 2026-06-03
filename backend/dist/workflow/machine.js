import { evaluateGuards } from './guards.js';
export const registrationTransitions = [
    // ===== DRAFT PHASE =====
    {
        from: ['DRAFT', 'REVISION_REQUIRED'],
        action: 'SAVE_DRAFT',
        to: 'DRAFT',
        rolesAllowed: ['INPUTTER', 'INPUTTER_HO', 'BRAND'],
        guards: ['REGISTRATION_TOTAL_WITHIN_BUDGET'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['DRAFT', 'REVISION_REQUIRED'],
        action: 'SUBMIT',
        to: 'SUPERVISOR_REVIEW',
        rolesAllowed: ['INPUTTER', 'INPUTTER_HO'],
        guards: ['ALL_ITEMS_ACTIONABLE', 'REGISTRATION_TOTAL_WITHIN_BUDGET'],
        sideEffects: ['CREATE_AUDIT_LOG'],
        // Q1: If creator is BRAND, this action is NOT allowed
    },
    {
        from: ['DRAFT'],
        action: 'SUBMIT',
        to: 'BRAND_MANAGER_APPROVAL',
        rolesAllowed: ['BRAND'],
        guards: ['ALL_ITEMS_ACTIONABLE', 'REGISTRATION_TOTAL_WITHIN_BUDGET'],
        sideEffects: ['ASSIGN_TO_BRAND_MANAGER', 'CREATE_AUDIT_LOG'],
        // Q1: BRAND creator skips Supervisor Review, goes directly to Brand Manager Approval
    },
    // ===== SUPERVISOR REVIEW PHASE =====
    {
        from: ['SUPERVISOR_REVIEW'],
        action: 'APPROVE',
        to: 'BRAND_INTAKE',
        rolesAllowed: ['APPROVER', 'APPROVER_HO'],
        guards: ['ALL_ITEMS_ACTIONABLE', 'APPROVER_IS_DIRECT_MANAGER'],
        sideEffects: ['ASSIGN_TO_BRAND_USER', 'CREATE_AUDIT_LOG'],
    },
    {
        from: ['SUPERVISOR_REVIEW'],
        action: 'REQUEST_REVISION',
        to: 'REVISION_REQUIRED',
        rolesAllowed: ['APPROVER', 'APPROVER_HO'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    // ===== BRAND INTAKE PHASE =====
    {
        from: ['BRAND_INTAKE'],
        action: 'APPROVE',
        to: 'BRAND_MANAGER_APPROVAL',
        rolesAllowed: ['BRAND'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['ASSIGN_TO_BRAND_MANAGER', 'CREATE_AUDIT_LOG'],
    },
    {
        from: ['BRAND_INTAKE'],
        action: 'REQUEST_REVISION',
        to: 'REVISION_REQUIRED',
        rolesAllowed: ['BRAND'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['BRAND_INTAKE'],
        action: 'CANCEL_REQUEST',
        to: 'CANCELLED',
        rolesAllowed: ['BRAND'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    // ===== BRAND MANAGER APPROVAL PHASE =====
    {
        from: ['BRAND_MANAGER_APPROVAL'],
        action: 'APPROVE',
        to: 'APPROVED',
        rolesAllowed: ['BRAND_MANAGER'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['LOCK_UNIT_PRICE_AND_TOTAL', 'SET_APPROVED_AT', 'CREATE_AUDIT_LOG'],
    },
    {
        from: ['BRAND_MANAGER_APPROVAL'],
        action: 'REQUEST_REVISION',
        to: 'REVISION_REQUIRED',
        rolesAllowed: ['BRAND_MANAGER'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    // ===== APPROVED PHASE =====
    {
        from: ['APPROVED'],
        action: 'BEGIN_ACCEPTANCE',
        to: 'ACCEPTANCE',
        rolesAllowed: ['BRAND'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    // ===== ACCEPTANCE PHASE =====
    {
        from: ['ACCEPTANCE'],
        action: 'SUBMIT_ACCEPTANCE',
        to: 'ACCEPTANCE_REVIEW',
        rolesAllowed: ['BRAND'],
        guards: ['ALL_ACTIVE_ITEMS_HAVE_NEW_IMAGE', 'ALL_INACTIVE_ITEMS_HAVE_NOTE'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['ACCEPTANCE'],
        action: 'REQUEST_REVISION',
        to: 'ACCEPTANCE',
        rolesAllowed: ['BRAND'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    // ===== ACCEPTANCE REVIEW PHASE =====
    {
        from: ['ACCEPTANCE_REVIEW'],
        action: 'APPROVE',
        to: 'COMPLETED',
        rolesAllowed: ['BRAND_MANAGER'],
        guards: [],
        sideEffects: ['SET_COMPLETED_AT', 'CREATE_AUDIT_LOG'],
    },
    {
        from: ['ACCEPTANCE_REVIEW'],
        action: 'REQUEST_REVISION',
        to: 'ACCEPTANCE',
        rolesAllowed: ['BRAND_MANAGER'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
];
export const workflowOpenQuestions = [
    {
        id: 'Q1_BRAND_SKIP_SUPERVISOR',
        title: 'BRAND creator workflow skip (Q1 - CONFIRMED)',
        interpretationA: 'If creator has BRAND role, registration skips Supervisor Review and goes directly to Brand Manager Approval.',
        interpretationB: 'Not applicable - Q1 confirmed as Interpretation A',
        implemented: true,
    },
    {
        id: 'Q2_APPROVER_ROUTING',
        title: 'Approval chain routing (Q2 - IMPLEMENTED)',
        interpretationA: 'Approver must be direct manager of creator via manager_id field (organizational hierarchy).',
        interpretationB: 'Not applicable',
        implemented: true,
    },
];
export function evaluateRegistrationTransition(action, context) {
    const candidate = registrationTransitions.find((transition) => transition.action === action && transition.from.includes(context.currentState));
    if (!candidate) {
        const actionExistsForState = registrationTransitions.some((transition) => transition.from.includes(context.currentState));
        return {
            ok: false,
            reason: actionExistsForState ? 'ACTION_NOT_AVAILABLE' : 'INVALID_STATE',
        };
    }
    if (!candidate.rolesAllowed.includes(context.actor.role)) {
        return {
            ok: false,
            reason: 'ROLE_NOT_ALLOWED',
        };
    }
    const guardResult = evaluateGuards(candidate.guards, context);
    if (!guardResult.passed) {
        return {
            ok: false,
            reason: 'GUARD_FAILED',
            guardFailures: guardResult.failed,
        };
    }
    return {
        ok: true,
        nextState: candidate.to,
        transition: candidate,
    };
}
