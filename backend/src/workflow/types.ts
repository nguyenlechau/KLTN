export type RegistrationState =
  | 'DRAFT'
  | 'SUPERVISOR_REVIEW'
  | 'BRAND_INTAKE'
  | 'BRAND_MANAGER_APPROVAL'
  | 'APPROVED'
  | 'ACCEPTANCE'
  | 'ACCEPTANCE_REVIEW'
  | 'COMPLETED'
  | 'REVISION_REQUIRED';

export type WorkflowRole =
  | 'ADMIN'
  | 'INPUTTER'
  | 'INPUTTER_HO'
  | 'APPROVER'
  | 'APPROVER_HO'
  | 'BRAND'
  | 'BRAND_MANAGER';

export type WorkflowAction =
  | 'SAVE_DRAFT'
  | 'SUBMIT'  // Draft → Supervisor Review
  | 'REQUEST_REVISION'  // Any approver sends back
  | 'RESUBMIT'  // Inputter after revision
  | 'APPROVE'  // Generic approval
  | 'BRAND_ACCEPT'  // Brand intake acceptance → Brand Manager Approval
  | 'BRAND_MANAGER_APPROVE'  // Lock pricing
  | 'BEGIN_ACCEPTANCE'  // Approved → Acceptance
  | 'SUBMIT_ACCEPTANCE'  // Acceptance → Acceptance Review
  | 'APPROVE_ACCEPTANCE'  // Complete workflow
  | 'CANCEL_REQUEST';  // Brand cancels request

export type GuardCode =
  | 'ALL_ITEMS_ACTIONABLE'  // No items in TREO or INACTIVE
  | 'ALL_ACTIVE_ITEMS_HAVE_NEW_IMAGE'  // Acceptance phase validation
  | 'ALL_INACTIVE_ITEMS_HAVE_NOTE'  // Acceptance phase validation
  | 'REGISTRATION_TOTAL_WITHIN_BUDGET'
  | 'APPROVER_IS_DIRECT_MANAGER'  // Supervisor must be direct manager of creator
  | 'PRICING_NOT_LOCKED'  // Cannot add items after pricing locked
  | 'CREATOR_NOT_BRAND'  // If creator is BRAND, skip Supervisor Review;

export type SideEffectCode =
  | 'LOCK_UNIT_PRICE_AND_TOTAL'  // After Brand Manager Approval
  | 'UNLOCK_ITEMS_FROM_TREO'  // When items removed from Brand Intake
  | 'CREATE_AUDIT_LOG'
  | 'SET_APPROVED_AT'
  | 'SET_COMPLETED_AT'
  | 'ASSIGN_TO_BRAND_USER'
  | 'ASSIGN_TO_BRAND_MANAGER';

export interface WorkflowActor {
  userId: string;
  role: WorkflowRole;
}

export interface WorkflowItemCheck {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ON_HOLD' | 'IN_PROGRESS';
  deploymentImageUploaded: boolean;
  inactiveNote?: string | null;
}

export interface RegistrationWorkflowContext {
  registrationId: string;
  currentState: RegistrationState;
  actor: WorkflowActor;
  budgetEstimate: number;
  totalAmount: number;
  managerApprovedAt?: string | null;
  items: WorkflowItemCheck[];
  now: Date;
}

export interface TransitionDefinition {
  from: RegistrationState[];
  action: WorkflowAction;
  to: RegistrationState;
  rolesAllowed: WorkflowRole[];
  guards: GuardCode[];
  sideEffects: SideEffectCode[];
}

export interface WorkflowEvaluationSuccess {
  ok: true;
  nextState: RegistrationState;
  transition: TransitionDefinition;
}

export interface WorkflowEvaluationFailure {
  ok: false;
  reason:
    | 'ACTION_NOT_AVAILABLE'
    | 'ROLE_NOT_ALLOWED'
    | 'GUARD_FAILED'
    | 'INVALID_STATE';
  guardFailures?: GuardCode[];
}

export type WorkflowEvaluationResult =
  | WorkflowEvaluationSuccess
  | WorkflowEvaluationFailure;

export interface WorkflowOpenQuestion {
  id: 'STEP6_CENTRAL_BYPASS';
  title: string;
  interpretationA: string;
  interpretationB: string;
  implemented: false;
}
