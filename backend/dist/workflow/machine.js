import { evaluateGuards } from './guards.js';
export const registrationTransitions = [
    {
        from: ['DRAFT', 'REVISION_REQUIRED'],
        action: 'SAVE_DRAFT',
        to: 'DRAFT',
        rolesAllowed: ['REQUESTER', 'CENTRAL_REQUESTER'],
        guards: ['REGISTRATION_TOTAL_WITHIN_BUDGET', 'LOCK_PRICE_AFTER_MANAGER_APPROVAL'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['DRAFT', 'REVISION_REQUIRED'],
        action: 'SUBMIT',
        to: 'SUPERVISOR_REVIEW',
        rolesAllowed: ['REQUESTER', 'CENTRAL_REQUESTER'],
        guards: ['ALL_ITEMS_ACTIONABLE', 'REGISTRATION_TOTAL_WITHIN_BUDGET'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['SUPERVISOR_REVIEW'],
        action: 'REQUEST_REVISION',
        to: 'REVISION_REQUIRED',
        rolesAllowed: ['SUPERVISOR', 'CENTRAL_SUPERVISOR'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['REVISION_REQUIRED'],
        action: 'RESUBMIT',
        to: 'SUPERVISOR_REVIEW',
        rolesAllowed: ['REQUESTER', 'CENTRAL_REQUESTER'],
        guards: ['ALL_ITEMS_ACTIONABLE', 'REGISTRATION_TOTAL_WITHIN_BUDGET'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['SUPERVISOR_REVIEW'],
        action: 'REVIEW_PASS',
        to: 'CENTRAL_OPS_REVIEW',
        rolesAllowed: ['SUPERVISOR', 'CENTRAL_SUPERVISOR'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['CENTRAL_OPS_REVIEW'],
        action: 'REQUEST_REVISION',
        to: 'REVISION_REQUIRED',
        rolesAllowed: ['OPERATIONS_SPECIALIST'],
        guards: [],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['CENTRAL_OPS_REVIEW'],
        action: 'REVIEW_PASS',
        to: 'MANAGER_APPROVAL',
        rolesAllowed: ['OPERATIONS_SPECIALIST'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['MANAGER_APPROVAL'],
        action: 'APPROVE',
        to: 'APPROVED',
        rolesAllowed: ['OPERATIONS_MANAGER'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['LOCK_UNIT_PRICE_AND_TOTAL', 'SET_APPROVED_AT', 'CREATE_AUDIT_LOG'],
    },
    {
        from: ['APPROVED'],
        action: 'PREPARE_DEPLOYMENT',
        to: 'DEPLOYMENT_PREP',
        rolesAllowed: ['OPERATIONS_SPECIALIST'],
        guards: [
            'ALL_ACTIVE_ITEMS_HAVE_DEPLOYMENT_IMAGE',
            'ALL_INACTIVE_ITEMS_HAVE_NOTE',
            'ALL_ITEMS_ACTIONABLE',
        ],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['DEPLOYMENT_PREP'],
        action: 'SUBMIT_FINAL_ACCEPTANCE',
        to: 'FINAL_ACCEPTANCE',
        rolesAllowed: ['OPERATIONS_SPECIALIST'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['CREATE_AUDIT_LOG'],
    },
    {
        from: ['FINAL_ACCEPTANCE'],
        action: 'COMPLETE',
        to: 'COMPLETED',
        rolesAllowed: ['OPERATIONS_MANAGER'],
        guards: ['ALL_ITEMS_ACTIONABLE'],
        sideEffects: ['SET_COMPLETED_AT', 'CREATE_AUDIT_LOG'],
    },
];
export const workflowOpenQuestions = [
    {
        id: 'STEP6_CENTRAL_BYPASS',
        title: 'Central role bypass behavior in approvals',
        interpretationA: 'Central Supervisor and Operations Manager may bypass intermediate review states when acting on registrations created by non-central requesters.',
        interpretationB: 'Central roles cannot bypass workflow states; they only gain broader row access across all channels/locations.',
        implemented: false,
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
