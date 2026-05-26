const ACTION_BLOCKED_ITEM_STATES = new Set(['PENDING', 'ON_HOLD', 'IN_PROGRESS']);
function allItemsActionable(context) {
    return context.items.every((item) => !ACTION_BLOCKED_ITEM_STATES.has(item.status));
}
function allActiveItemsHaveDeploymentImage(context) {
    return context.items
        .filter((item) => item.status === 'ACTIVE')
        .every((item) => item.deploymentImageUploaded);
}
function allInactiveItemsHaveNote(context) {
    return context.items
        .filter((item) => item.status === 'INACTIVE')
        .every((item) => Boolean(item.inactiveNote && item.inactiveNote.trim().length > 0));
}
function registrationTotalWithinBudget(context) {
    return context.totalAmount <= context.budgetEstimate;
}
function lockPriceAfterManagerApproval(context) {
    return !context.managerApprovedAt;
}
export function evaluateGuards(guardCodes, context) {
    const failed = [];
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
