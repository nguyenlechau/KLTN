import { GuardCode, RegistrationWorkflowContext, WorkflowItemCheck } from './types.js';

export interface GuardResult {
  passed: boolean;
  failed: GuardCode[];
}

const ACTION_BLOCKED_ITEM_STATES = new Set(['PENDING', 'ON_HOLD', 'IN_PROGRESS']);

function allItemsActionable(context: RegistrationWorkflowContext): boolean {
  return context.items.every(
    (item: WorkflowItemCheck) => !ACTION_BLOCKED_ITEM_STATES.has(item.status),
  );
}

function allActiveItemsHaveDeploymentImage(
  context: RegistrationWorkflowContext,
): boolean {
  return context.items
    .filter((item: WorkflowItemCheck) => item.status === 'ACTIVE')
    .every((item: WorkflowItemCheck) => item.deploymentImageUploaded);
}

function allInactiveItemsHaveNote(context: RegistrationWorkflowContext): boolean {
  return context.items
    .filter((item: WorkflowItemCheck) => item.status === 'INACTIVE')
    .every(
      (item: WorkflowItemCheck) =>
        Boolean(item.inactiveNote && item.inactiveNote.trim().length > 0),
    );
}

function registrationTotalWithinBudget(
  context: RegistrationWorkflowContext,
): boolean {
  return context.totalAmount <= context.budgetEstimate;
}

function lockPriceAfterManagerApproval(context: RegistrationWorkflowContext): boolean {
  return !context.managerApprovedAt;
}

export function evaluateGuards(
  guardCodes: GuardCode[],
  context: RegistrationWorkflowContext,
): GuardResult {
  const failed: GuardCode[] = [];

  for (const guard of guardCodes) {
    switch (guard) {
      case 'ALL_ITEMS_ACTIONABLE':
        if (!allItemsActionable(context)) {
          failed.push(guard);
        }
        break;
      case 'ALL_ACTIVE_ITEMS_HAVE_DEPLOYMENT_IMAGE':
        if (!allActiveItemsHaveDeploymentImage(context)) {
          failed.push(guard);
        }
        break;
      case 'ALL_INACTIVE_ITEMS_HAVE_NOTE':
        if (!allInactiveItemsHaveNote(context)) {
          failed.push(guard);
        }
        break;
      case 'REGISTRATION_TOTAL_WITHIN_BUDGET':
        if (!registrationTotalWithinBudget(context)) {
          failed.push(guard);
        }
        break;
      case 'LOCK_PRICE_AFTER_MANAGER_APPROVAL':
        if (!lockPriceAfterManagerApproval(context)) {
          failed.push(guard);
        }
        break;
      default:
        failed.push(guard);
    }
  }

  return {
    passed: failed.length === 0,
    failed,
  };
}
