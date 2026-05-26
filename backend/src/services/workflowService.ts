/**
 * Workflow Service
 * Manages registration state machine and transitions
 */

import { queryOne, queryAll, query, transaction } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import * as registrationService from './registrationService.js';

export interface WorkflowTransition {
  id: string;
  registration_id: string;
  from_state: string;
  to_state: string;
  executed_by: string;
  reason?: string;
  created_at: string;
}

export interface WorkflowApproval {
  id: string;
  registration_id: string;
  approver_id: string;
  state: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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
export function getAvailableTransitions(currentState: string): string[] {
  return STATE_MACHINE[currentState as keyof typeof STATE_MACHINE]?.transitions || [];
}

/**
 * Check if transition is allowed
 */
export function isTransitionAllowed(fromState: string, toState: string): boolean {
  return getAvailableTransitions(fromState).includes(toState);
}

/**
 * Evaluate guard conditions
 */
export async function evaluateGuardConditions(
  registrationId: string,
  toState: string
): Promise<{ passed: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (toState === 'BRAND_MANAGER_APPROVAL') {
    // Guard: REGISTRATION_TOTAL_WITHIN_BUDGET
    const budgetCheck = await registrationService.validateBudget(registrationId);
    if (!budgetCheck.valid) {
      errors.push(budgetCheck.message || 'Budget exceeded');
    }

    // Guard: ALL_ITEMS_ACTIONABLE
    const itemsCheck = await registrationService.validateAllItemsActionable(registrationId);
    if (!itemsCheck.valid) {
      errors.push(`${itemsCheck.inactiveCount} vật phẩm không khả dụng (phải là ACTIVE)`);
    }
  }

  if (toState === 'FINAL_ACCEPTANCE') {
    // Verify registration has content and items
    const details = await registrationService.getRegistrationDetails(registrationId);
    if (!details) throw new Error('Registration not found');

    if (details.content.length === 0) {
      errors.push('Phải chọn ít nhất một nội dung quảng cáo');
    }

    if (details.items.length === 0) {
      errors.push('Phải chọn ít nhất một vị trí/hạng mục');
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
export async function executeSideEffects(
  registrationId: string,
  toState: string
): Promise<void> {
  if (toState === 'BRAND_MANAGER_APPROVAL') {
    // Lock unit prices and totals
    await registrationService.lockPrices(registrationId);
  }

  if (toState === 'APPROVED') {
    // Set approved_at timestamp
    const now = new Date().toISOString();
    await query(
      `UPDATE registrations SET approved_at = $1 WHERE id = $2`,
      [now, registrationId]
    );
  }
}

/**
 * Transition registration to new state
 */
export async function transitionState(
  registrationId: string,
  toState: string,
  executedBy: string,
  reason?: string
): Promise<WorkflowTransition> {
  return transaction(async () => {
    const registration = await registrationService.getRegistrationById(registrationId);
    if (!registration) throw new Error('Registration not found');

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
    await query(
      `UPDATE registrations SET workflow_state = $1, updated_at = $2 WHERE id = $3`,
      [toState, now, registrationId]
    );

    // Record transition
    const transitionId = uuidv4();
    await query(
      `INSERT INTO registration_approvals (id, registration_id, approver_id, state, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [transitionId, registrationId, executedBy, toState, 'COMPLETED', reason || null, now, now]
    );

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
export async function getWorkflowHistory(registrationId: string): Promise<WorkflowApproval[]> {
  return queryAll<WorkflowApproval>(
    `SELECT * FROM registration_approvals WHERE registration_id = $1 ORDER BY created_at ASC`,
    [registrationId]
  );
}

/**
 * Get state info
 */
export interface StateInfo {
  state: string;
  label: string;
  description: string;
  possibleTransitions: Array<{ to: string; label: string }>;
  requiredRoles: string[];
}

export function getStateInfo(state: string): StateInfo {
  const stateLabels: Record<string, string> = {
    DRAFT: 'Nháp',
    SUPERVISOR_REVIEW: 'Phê duyệt giám sát',
    CBNV_REVISION: 'Chỉnh sửa',
    BRAND_ACCEPTANCE: 'Chấp nhận thương hiệu',
    BRAND_MANAGER_APPROVAL: 'Phê duyệt quản lý thương hiệu',
    APPROVED: 'Đã phê duyệt',
    DEPLOYMENT_PREP: 'Chuẩn bị triển khai',
    FINAL_ACCEPTANCE: 'Xác nhận cuối cùng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Hủy bỏ',
  };

  const stateDescriptions: Record<string, string> = {
    DRAFT: 'Đơn đang được soạn thảo',
    SUPERVISOR_REVIEW: 'Chờ phê duyệt từ giám sát',
    CBNV_REVISION: 'Đơn cần chỉnh sửa lại',
    BRAND_ACCEPTANCE: 'Chờ xác nhận từ thương hiệu',
    BRAND_MANAGER_APPROVAL: 'Chờ phê duyệt từ quản lý thương hiệu',
    APPROVED: 'Đã được phê duyệt, sẵn sàng triển khai',
    DEPLOYMENT_PREP: 'Đang chuẩn bị triển khai',
    FINAL_ACCEPTANCE: 'Chờ xác nhận cuối cùng',
    COMPLETED: 'Triển khai hoàn thành',
    CANCELLED: 'Đơn đã bị hủy',
  };

  const transitions = getAvailableTransitions(state);
  const transitionLabels: Record<string, string> = {
    DRAFT: 'Soạn thảo',
    SUPERVISOR_REVIEW: 'Gửi phê duyệt',
    CBNV_REVISION: 'Yêu cầu chỉnh sửa',
    BRAND_ACCEPTANCE: 'Gửi cho thương hiệu',
    BRAND_MANAGER_APPROVAL: 'Gửi quản lý thương hiệu',
    APPROVED: 'Phê duyệt',
    DEPLOYMENT_PREP: 'Chuẩn bị triển khai',
    FINAL_ACCEPTANCE: 'Xác nhận cuối cùng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Hủy bỏ',
  };

  const roles = STATE_MACHINE[state as keyof typeof STATE_MACHINE]?.roles || [];

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
export function getAllStatesInfo(): StateInfo[] {
  return Object.keys(STATE_MACHINE).map((state) => getStateInfo(state));
}

/**
 * Check role permission for transition
 */
export function canUserTransition(userRole: string, fromState: string, toState: string): boolean {
  const stateConfig = STATE_MACHINE[toState as keyof typeof STATE_MACHINE];
  const allowedRoles = (stateConfig?.roles || []) as string[];
  return allowedRoles.includes(userRole);
}
