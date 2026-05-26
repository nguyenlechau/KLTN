# Registration Workflow Engine (Step 6)

## States
- DRAFT
- SUPERVISOR_REVIEW
- CENTRAL_OPS_REVIEW
- MANAGER_APPROVAL
- APPROVED
- DEPLOYMENT_PREP
- FINAL_ACCEPTANCE
- COMPLETED
- REVISION_REQUIRED (re-entry state)

## Critical rules enforced
1. Cannot submit/approve if any item status is `PENDING`/`ON_HOLD`/`IN_PROGRESS` (`ALL_ITEMS_ACTIONABLE`).
2. Unit price + total lock after manager approval (`LOCK_UNIT_PRICE_AND_TOTAL` side effect + `LOCK_PRICE_AFTER_MANAGER_APPROVAL` guard for draft-save path).
3. Deployment prep requires:
   - all active items have new image upload
   - all inactive items have note
4. Total amount must not exceed budget estimate (`REGISTRATION_TOTAL_WITHIN_BUDGET`).

## Open question (not implemented)
- `STEP6_CENTRAL_BYPASS`
  - Interpretation A: central roles can bypass intermediate states.
  - Interpretation B: no bypass, central roles only have broader row scope.

## Integration contract
- Evaluate action via `evaluateRegistrationTransition(action, context)`.
- If `ok: true`: apply state transition and execute side effects atomically in service layer transaction.
- If `ok: false`: map `reason`/`guardFailures` to API error response.
