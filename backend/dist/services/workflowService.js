/**
 * Workflow Service
 * Manages registration state machine and transitions
 */
import { queryAll, query, transaction } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import * as registrationService from './registrationService.js';
// State machine definition
const STATE_MACHINE = {
    DRAFT: {
        transitions: ['SUPERVISOR_REVIEW', 'CANCELLED'],
        roles: ['INPUTTER', 'INPUTTER_HO'],
    },
    SUPERVISOR_REVIEW: {
        transitions: ['BRAND_ACCEPTANCE', 'CBNV_REVISION', 'CANCELLED'],
        roles: ['APPROVER', 'APPROVER_HO'],
    },
    CBNV_REVISION: {
        transitions: ['SUPERVISOR_REVIEW', 'CANCELLED'],
        roles: ['INPUTTER', 'INPUTTER_HO'],
    },
    BRAND_ACCEPTANCE: {
        transitions: ['BRAND_MANAGER_APPROVAL', 'CBNV_REVISION', 'CANCELLED'],
        roles: ['BRAND'],
    },
    BRAND_MANAGER_APPROVAL: {
        transitions: ['APPROVED', 'CBNV_REVISION', 'CANCELLED'],
        roles: ['BRAND_MANAGER'],
    },
    APPROVED: {
        transitions: ['DEPLOYMENT_PREP', 'CBNV_REVISION'],
        roles: ['BRAND_MANAGER'],
    },
    DEPLOYMENT_PREP: {
        transitions: ['FINAL_ACCEPTANCE', 'CBNV_REVISION'],
        roles: ['INPUTTER', 'INPUTTER_HO'],
    },
    FINAL_ACCEPTANCE: {
        transitions: ['COMPLETED', 'CBNV_REVISION'],
        roles: ['APPROVER', 'APPROVER_HO'],
    },
    COMPLETED: {
        transitions: [],
        roles: [],
    },
    CANCELLED: {
        transitions: [],
        roles: [],
    },
};
/**
 * Get available transitions from current state
 */
export function getAvailableTransitions(currentState) {
    return STATE_MACHINE[currentState]?.transitions || [];
}
/**
 * Check if transition is allowed
 */
export function isTransitionAllowed(fromState, toState) {
    return getAvailableTransitions(fromState).includes(toState);
}
/**
 * Evaluate guard conditions
 */
export async function evaluateGuardConditions(registrationId, toState) {
    const errors = [];
    if (toState === 'BRAND_MANAGER_APPROVAL') {
        // Guard: REGISTRATION_TOTAL_WITHIN_BUDGET
        const budgetCheck = await registrationService.validateBudget(registrationId);
        if (!budgetCheck.valid) {
            errors.push(budgetCheck.message || 'Budget exceeded');
        }
        // Guard: ALL_ITEMS_ACTIONABLE
        const itemsCheck = await registrationService.validateAllItemsActionable(registrationId);
        if (!itemsCheck.valid) {
            errors.push(`${itemsCheck.inactiveCount} item(s) are not available (must be ACTIVE)`);
        }
    }
    if (toState === 'FINAL_ACCEPTANCE') {
        // Verify registration has content and items
        const details = await registrationService.getRegistrationDetails(registrationId);
        if (!details)
            throw new Error('Registration not found');
        if (details.content.length === 0) {
            errors.push('At least one advertising content must be selected');
        }
        if (details.items.length === 0) {
            errors.push('At least one location/category must be selected');
        }
    }
    return {
        passed: errors.length === 0,
        errors,
    };
}
/**
 * Execute side effects for state transition
 */
export async function executeSideEffects(registrationId, toState) {
    if (toState === 'BRAND_MANAGER_APPROVAL') {
        // Lock unit prices and totals
        await registrationService.lockPrices(registrationId);
    }
    if (toState === 'APPROVED') {
        // Set approved_at timestamp
        const now = new Date().toISOString();
        await query(`UPDATE registrations SET approved_at = $1 WHERE id = $2`, [now, registrationId]);
    }
}
/**
 * Transition registration to new state
 */
export async function transitionState(registrationId, toState, executedBy, reason) {
    return transaction(async () => {
        const registration = await registrationService.getRegistrationById(registrationId);
        if (!registration)
            throw new Error('Registration not found');
        const fromState = registration.workflow_state;
        // Check if transition is allowed
        if (!isTransitionAllowed(fromState, toState)) {
            throw new Error(`Cannot transition from ${fromState} to ${toState}`);
        }
        // Evaluate guards
        const guardCheck = await evaluateGuardConditions(registrationId, toState);
        if (!guardCheck.passed) {
            throw new Error(`Guard conditions failed: ${guardCheck.errors.join('; ')}`);
        }
        // Execute side effects
        await executeSideEffects(registrationId, toState);
        // Update registration state
        const now = new Date().toISOString();
        await query(`UPDATE registrations SET workflow_state = $1, updated_at = $2 WHERE id = $3`, [toState, now, registrationId]);
        // Record transition
        const transitionId = uuidv4();
        await query(`INSERT INTO registration_approvals (id, registration_id, approver_id, state, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [transitionId, registrationId, executedBy, toState, 'COMPLETED', reason || null, now, now]);
        return {
            id: transitionId,
            registration_id: registrationId,
            from_state: fromState,
            to_state: toState,
            executed_by: executedBy,
            reason,
            created_at: now,
        };
    });
}
/**
 * Get workflow history
 */
export async function getWorkflowHistory(registrationId) {
    return queryAll(`SELECT * FROM registration_approvals WHERE registration_id = $1 ORDER BY created_at ASC`, [registrationId]);
}
export function getStateInfo(state) {
    const stateLabels = {
        DRAFT: 'Draft',
        SUPERVISOR_REVIEW: 'Supervisor Review',
        CBNV_REVISION: 'Revision Required',
        BRAND_ACCEPTANCE: 'Brand Acceptance',
        BRAND_MANAGER_APPROVAL: 'Brand Manager Approval',
        APPROVED: 'Approved',
        DEPLOYMENT_PREP: 'Deployment Preparation',
        FINAL_ACCEPTANCE: 'Final Acceptance',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
    };
    const stateDescriptions = {
        DRAFT: 'Registration is being drafted',
        SUPERVISOR_REVIEW: 'Awaiting supervisor review',
        CBNV_REVISION: 'Registration needs revision',
        BRAND_ACCEPTANCE: 'Awaiting brand acceptance',
        BRAND_MANAGER_APPROVAL: 'Awaiting brand manager approval',
        APPROVED: 'Approved and ready for deployment',
        DEPLOYMENT_PREP: 'Preparing for deployment',
        FINAL_ACCEPTANCE: 'Awaiting final acceptance',
        COMPLETED: 'Deployment completed',
        CANCELLED: 'Registration has been cancelled',
    };
    const transitions = getAvailableTransitions(state);
    const transitionLabels = {
        DRAFT: 'Draft',
        SUPERVISOR_REVIEW: 'Submit for Supervisor Review',
        CBNV_REVISION: 'Request Revision',
        BRAND_ACCEPTANCE: 'Send to Brand',
        BRAND_MANAGER_APPROVAL: 'Send to Brand Manager',
        APPROVED: 'Approve',
        DEPLOYMENT_PREP: 'Prepare for Deployment',
        FINAL_ACCEPTANCE: 'Final Acceptance',
        COMPLETED: 'Mark Completed',
        CANCELLED: 'Cancel',
    };
    const roles = STATE_MACHINE[state]?.roles || [];
    return {
        state,
        label: stateLabels[state] || state,
        description: stateDescriptions[state] || '',
        possibleTransitions: transitions.map((t) => ({
            to: t,
            label: transitionLabels[t] || t,
        })),
        requiredRoles: roles,
    };
}
/**
 * Get all workflow states info
 */
export function getAllStatesInfo() {
    return Object.keys(STATE_MACHINE).map((state) => getStateInfo(state));
}
/**
 * Check role permission for transition
 */
export function canUserTransition(userRole, fromState, toState) {
    const stateConfig = STATE_MACHINE[toState];
    const allowedRoles = (stateConfig?.roles || []);
    return allowedRoles.includes(userRole);
}
