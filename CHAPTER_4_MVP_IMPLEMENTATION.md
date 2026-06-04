# CHAPTER 4: MVP IMPLEMENTATION

---

## 4.1 MVP Scope and Technology Stack

### 4.1.1 What Was Built

The Minimum Viable Product (MVP) constitutes a full-stack web application whose purpose is to digitalise the end-to-end physical advertising registration and deployment process within a retail bank branch network. The system covers five functional areas:

1. **Master data management** – administration of channels, advertising categories, branch locations (POSM positions), physical advertising items, and key-visual content assets.
2. **Branch registration** – creation, editing, and status tracking of advertising campaigns requested by branch-level staff.
3. **Multi-step approval workflow** – a deterministic state machine that routes each registration through a sequence of organisational review gates before deployment may proceed.
4. **Deployment tracking** – recording of the actual deployment date, location, and photographic evidence once approved materials reach the field.
5. **Role-based access control (RBAC) and audit trail** – every action is attributed to an authenticated user whose role determines which operations are permitted.

The system is intentionally structured as a two-tier deployment: a **React** single-page application (SPA) served as static assets, and a **Node.js / Express** REST API backed by **PostgreSQL**. Both tiers are containerisable via Docker, and the database schema is managed through a versioned SQL migration chain (files `001_phase1_init_up.sql` through `015_update_roles_up.sql`).

### 4.1.2 Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Frontend framework | React | 18.3 | Component model aligns with the screen-based UX design; large ecosystem |
| Frontend build tool | Vite | 5.4 | Sub-second HMR; minimal configuration for TypeScript + React |
| Client-side routing | React Router DOM | 6.27 | Declarative SPA routing; nested route support for layout guards |
| Frontend language | TypeScript | 5.6 | Static typing reduces integration errors between API service layer and UI |
| Backend runtime | Node.js (ESM) | – | Same language as frontend; non-blocking I/O suitable for request-heavy workflow API |
| Backend framework | Express | 4.19 | Lightweight; sufficient for a RESTful CRUD + workflow API surface |
| Backend language | TypeScript | 5.6 | Compiled to ESM via `tsc`; enables shared interface definitions |
| Authentication | JSON Web Tokens (`jsonwebtoken` 9.0) | – | Stateless; carries `user.id` and `user.role` in payload |
| Database | PostgreSQL | – | ACID compliance required for transactional workflow state updates |
| DB access | `pg` (node-postgres) | 8.12 | Parameterised queries prevent SQL injection; explicit connection pool |
| Containerisation | Docker + Docker Compose | – | Reproducible runtime for local development and cloud deployment |

**Out of scope in this MVP:** the AI inference engine that would automatically validate deployment photos against the registered artwork. The evidence upload mechanism (Section 4.4) is fully implemented and stores photo references against deployment records, thereby creating the data linkage that a future AI validation service will consume. No AI model training, model serving endpoint, or automated compliance verdict is included in the current artefact.

### 4.1.3 Project Structure

The repository is divided into two independently deployable sub-projects:

```
backend/
  src/
    app.ts          – Express app, middleware, route mounting
    server.ts       – DB connection test, HTTP listen
    config/rbac.ts  – Role-permission matrix (7 roles × N permissions)
    db/postgres.ts  – pg Pool, fallback mock adapter
    routes/         – masterDataRoutes.ts, registrationRoutes.ts, authRoutes.ts
    services/       – contentService, locationService, categoryService,
                      itemService, registrationService, workflowService
    modules/menu/   – hierarchical menu router
  migrations/       – 015 versioned SQL files

frontend/
  src/
    App.tsx                    – Route declarations
    api/services.ts            – Typed API client functions
    hooks/useRole.ts           – UI-level permission helpers
    components/                – Alert, Button, Input, Modal, Spinner,
                                 AuditTrailViewer, Layout
    screens/
      master/                  – ChannelsScreen, CategoryManagementScreen,
                                 LocationManagementScreen, PhysicalItemsScreen,
                                 AdvertisingContentListScreen, MenuScreen
      registrations/           – RegistrationListScreen, RegistrationDetailScreen,
                                 DeploymentAcceptanceScreen
```

---

## 4.2 Core Module Implementation

### 4.2.1 Master Data Management

Master data is the foundation upon which all registrations are constructed. The MVP implements five master data entities, each with full CRUD operations exposed through authenticated REST endpoints under `/api/v1/`.

#### Channels

A *channel* represents a physical store format or retail environment type (e.g., supermarket, convenience store). The `channels` table is the root of a hierarchical key: `channel → location → physical_item`. The `ChannelsScreen` component enforces write access through the `canManageMasterData(role)` helper, which permits only `ADMIN` and `BRAND` roles to create or edit records.

#### Categories

An advertising *category* describes a class of POSM placement (e.g., LED panel, shelf talker). Each category carries a `unit_price` and a `unit_of_measure`, which are the price reference used when a branch registers an item. The `categories` table has a composite uniqueness constraint on `(channel_id, code)`, preventing duplicate category codes within the same channel. The backend `categoryService` enforces this at the service layer.

#### Locations (Branch Positions)

A *location* represents a specific advertising position within a branch, identified by a `position_code` (e.g., `CHT-LED-001`). The location record carries geospatial fields (`latitude`, `longitude`), contact representative details, and a `classification` tag. The `locationService.createLocation` function checks uniqueness of `position_code` within `channel_id` before inserting:

```typescript
// backend/src/services/locationService.ts
const existing = await queryOne(
  `SELECT id FROM locations WHERE position_code = $1
   AND channel_id = $2 AND deleted_at IS NULL`,
  [data.position_code, data.channel_id]
);
if (existing) throw new Error('Position code already exists in this channel');
```

#### Physical Items (POSM Assets)

A *physical item* is a specific, individually identifiable advertising unit tied to a location and category. The item code is auto-generated as `{position_code}.{category_code}.{seq_no:3d}` (e.g., `CHT.LD.001`). The `itemService` computes the next sequence number by querying the maximum existing `seq_no` for the same `(location_id, category_id)` pair within a database transaction. Only items with `status = 'ACTIVE'` are presented for selection in the registration flow, enforcing the business rule that inactive inventory cannot be requested.

#### Advertising Content

*Advertising content* records represent approved key visual assets (campaign artwork). The `advertising_content` table stores campaign date windows (`start_date`, `end_date`) and auto-generates a sequential content code (`CT00001`, `CT00002`, …). Status is computed dynamically from the `end_date`:

```typescript
// backend/src/services/contentService.ts
function calculateStatus(endDate: string): 'Active' | 'Expired' {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return today <= end ? 'Active' : 'Expired';
}
```

The `content.clone` permission enables the `BRAND` team to duplicate an existing content record when renewing a campaign, preserving the original for historical traceability.

### 4.2.2 Branch Registration

A registration is the central aggregate object of the system. It groups a campaign request with its associated content selections, POSM item selections, contact details, and budget, and is the entity that moves through the approval workflow.

**Creation.** The `POST /api/v1/registrations` endpoint validates required fields (`campaign_name`, `department_id`, `channel_id`, `brand_name`, `budget_total`) and delegates to `registrationService.createRegistration`, which:

1. Generates a date-prefixed sequential code: `YYYYMMDD-NNNN` (e.g., `20260603-0001`).
2. Persists the record with `workflow_state = 'DRAFT'` and `total_amount = 0`.
3. Returns the full `Registration` object.

**Item attachment.** After creation, branch users add POSM items via `POST /api/v1/registrations/:id/items`. The service performs three checks inside a database transaction: (i) the item exists and has `status = 'ACTIVE'`; (ii) the item belongs to the requested `category_id`; (iii) the `unit_price` is fetched from `physical_items` and used to calculate `total_amount = unit_price × quantity`. The registration's `total_amount` is recalculated atomically after each item addition or removal.

**Content attachment.** Campaign artwork is linked via `POST /api/v1/registrations/:id/content`. The service validates that the selected `advertising_content` record has not expired and that the requested date range does not exceed the content's own `end_date`.

**List and filtering.** `GET /api/v1/registrations` supports paginated results with optional filters on `search` (full-text over `campaign_name`, `registration_code`, `brand_name`), `workflow_state`, and `department_id`. All queries include a `deleted_at IS NULL` predicate, implementing a soft-delete pattern that preserves records for audit purposes.

### 4.2.3 Deployment Tracking

Once a registration reaches the `DEPLOYMENT_PREP` state, branch staff initiate the physical installation of materials. The `DeploymentAcceptanceScreen` collects:

- **Deployment date** (defaults to today).
- **Deployment location** (free-text description of the physical spot within the branch).
- **Deployment notes** (optional field).
- **Photographic evidence** (minimum one image, described in Section 4.4).
- **Checklist attestation** – three boolean checkboxes (`items_deployed`, `photos_confirmed`, `quality_confirmed`) that must all be ticked before the submission button is enabled.

On submission, the screen calls `transitionRegistration(id, 'COMPLETED', reason)`, recording the deployment completion reason as the transition note. The system validates all checklist items and rejects submissions that do not include at least one photo.

### 4.2.4 Role-Based Access Control

The RBAC design implements a flat permission-code model: each role maps to an explicit list of `PermissionCode` strings. The matrix is defined in `backend/src/config/rbac.ts` and covers seven distinct roles:

| Role | Primary Responsibility |
|---|---|
| `ADMIN` | Full access; user and system administration |
| `INPUTTER` | Branch-level requester; creates and submits registrations |
| `INPUTTER_HO` | Head-office requester; same permissions as `INPUTTER` |
| `APPROVER` | Branch supervisor; reviews and advances registrations from `SUPERVISOR_REVIEW` |
| `APPROVER_HO` | Head-office supervisor; mirrors `APPROVER` scope |
| `BRAND` | Brand/marketing team; manages master data and handles `BRAND_ACCEPTANCE` step |
| `BRAND_MANAGER` | Senior brand approver; gives final commercial approval and marks completion |

The backend enforces permissions via the `authenticate` middleware, which decodes the JWT and attaches `req.user` (including `role`). The frontend enforces the same policy at the UI layer through helper functions in `frontend/src/hooks/useRole.ts`:

```typescript
// frontend/src/hooks/useRole.ts
export function canManageMasterData(role: string): boolean {
  return ['ADMIN', 'BRAND'].includes(role.toUpperCase());
}

export function canCreateRegistration(role: string): boolean {
  return ['ADMIN', 'INPUTTER', 'INPUTTER_HO', 'BRAND'].includes(role.toUpperCase());
}
```

It is important to note that the frontend helpers are purely for UI presentation (showing or hiding buttons). All definitive access control is enforced by the backend, consistent with the principle of defence in depth.

### 4.2.5 Audit Trail

The `AuditTrailViewer` component (`frontend/src/components/AuditTrailViewer.tsx`) presents an immutable chronological timeline of all state transitions recorded in `registration_approvals`. Each entry exposes: the acting user, the `action_type` (one of `CREATE`, `UPDATE`, `DELETE`, `TRANSITION`, `APPROVE`, `REJECT`, `REVISE`), the previous and new field values, a free-text note, a timestamp, and an optional IP address. Entries are rendered with colour-coded badges and are filterable by action type. The component is embedded as a dedicated tab on the `RegistrationDetailScreen`, giving reviewers at every stage a complete provenance trail for the record.

---

## 4.3 Workflow Implementation

### 4.3.1 From BPMN to State Machine

The approval process modelled in Chapter 3 as a BPMN collaboration diagram is realised in the backend as an explicit state-machine object defined in `backend/src/services/workflowService.ts`. Each key in the `STATE_MACHINE` constant represents one workflow state; its value declares the set of legal successor states (`transitions`) and the roles that may execute any of those transitions (`roles`):

```typescript
// backend/src/services/workflowService.ts (excerpt)
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
  COMPLETED:  { transitions: [], roles: [] },
  CANCELLED:  { transitions: [], roles: [] },
};
```

The complete lifecycle comprises **ten states** and maps directly to the BPMN swim-lane sequence: branch request → supervisor review (with optional revision loop via `CBNV_REVISION`) → brand intake → brand manager approval → approved → deployment preparation → final acceptance → completed. The terminal states `COMPLETED` and `CANCELLED` have empty transition lists, making them absorbing states.

### 4.3.2 Transition Execution

Every state change is processed by the `transitionState` function, which enforces three sequential checks inside a single PostgreSQL transaction:

1. **Structural validity** – `isTransitionAllowed(fromState, toState)` verifies the target state is listed in `STATE_MACHINE[fromState].transitions`. If not, the function throws immediately.

2. **Guard conditions** – `evaluateGuardConditions(registrationId, toState)` runs domain-specific business rules that must pass before the transition is committed. Two guards are currently implemented:
   - **`REGISTRATION_TOTAL_WITHIN_BUDGET`** (activated at `BRAND_MANAGER_APPROVAL`): compares `total_amount` against `budget_total`. If the cost exceeds the declared budget, the transition is blocked with a descriptive error.
   - **`ALL_ITEMS_ACTIONABLE`** (activated at `BRAND_MANAGER_APPROVAL`): queries `registration_items JOIN physical_items` to count items where `status != 'ACTIVE'`. Any inactive POSM item blocks promotion.
   - **Content and item presence check** (activated at `FINAL_ACCEPTANCE`): the registration must have at least one linked content record and at least one linked item.

3. **Side effects** – `executeSideEffects(registrationId, toState)` performs deterministic mutations triggered by reaching a specific state:
   - On entering `BRAND_MANAGER_APPROVAL`: `prices_locked_at` is stamped on the registration, freezing all `unit_price` values so that subsequent edits to the `physical_items` master table cannot retroactively alter the committed cost.
   - On entering `APPROVED`: `approved_at` is written, providing a legally significant timestamp.

If all checks pass, the function atomically: (a) updates `registrations.workflow_state`, (b) inserts a row into `registration_approvals` recording the actor, the new state, and any free-text reason, and (c) returns the transition record.

### 4.3.3 Available Transitions Endpoint

The `GET /api/v1/registrations/:id/transitions` endpoint exposes the set of currently reachable states for a given registration. The `RegistrationDetailScreen` calls this endpoint on load and uses the response to dynamically render the action buttons available to the logged-in user, ensuring the UI always reflects the true state-machine position rather than hard-coded button visibility.

### 4.3.4 Workflow State Display

The detail screen renders the current workflow state as a colour-coded badge using CSS class names derived directly from the state constant (e.g., `workflow-brand-manager-approval`). A label mapping in the component converts machine-readable state keys to human-readable strings:

```typescript
const labels: Record<string, string> = {
  DRAFT:                    'Draft',
  SUPERVISOR_REVIEW:        'Supervisor Review',
  CBNV_REVISION:            'Requester Revision',
  BRAND_ACCEPTANCE:         'Brand Acceptance',
  BRAND_MANAGER_APPROVAL:   'Brand Manager Approval',
  APPROVED:                 'Approved',
  DEPLOYMENT_PREP:          'Deployment Preparation',
  FINAL_ACCEPTANCE:         'Final Acceptance',
  COMPLETED:                'Completed',
  CANCELLED:                'Cancelled',
};
```

This separation of machine state from display label makes it straightforward to support localisation in a future iteration without modifying the state machine logic.

---

## 4.4 Evidence Upload Implementation

### 4.4.1 Design Rationale

Physical advertising deployment is a field activity that cannot be verified programmatically without on-site photographic evidence. The MVP evidence upload mechanism serves two immediate purposes: (i) it creates an accountability record that branch supervisors can review before granting `FINAL_ACCEPTANCE`; and (ii) it stores the photo references in association with the deployment record, forming the data linkage that a future AI validation module will traverse to compare uploaded images against the approved artwork registered in `advertising_content`.

This design decision separates the *data capture* concern (fully implemented in this MVP) from the *AI inference* concern (out of scope), allowing the two subsystems to evolve independently.

### 4.4.2 User Interface

The evidence upload UI is embedded in the `DeploymentAcceptanceScreen` as the `photos` section of the `DeploymentForm` component. The upload interaction follows a familiar file-picker pattern:

```tsx
<input
  id="photo-input"
  type="file"
  accept="image/*"
  multiple
  onChange={handlePhotoChange}
  style={{ display: 'none' }}
/>
<label htmlFor="photo-input" className="upload-label">
  <div className="upload-icon">📷</div>
  <div className="upload-text">
    <p className="upload-title">Select or drag & drop photos</p>
    <p className="upload-subtitle">PNG, JPG, GIF (Max 10MB)</p>
  </div>
</label>
```

After selection, the component generates object URLs via `URL.createObjectURL` for immediate in-browser preview, allowing the field officer to verify that the correct images have been chosen before submitting. The `express.json` middleware is configured with a `limit: '10mb'` body-size cap, consistent with the stated per-image maximum.

### 4.4.3 Validation and Submission Gate

The form enforces three hard validations before the `POST` to the workflow transition endpoint is allowed:

| Validation | Message shown if fails |
|---|---|
| At least one photo selected | "Please upload at least one deployment photo" |
| Deployment location field non-empty | "Please enter the deployment location" |
| All three checklist items ticked | Submit button remains disabled |

The three checklist items are: `items_deployed` ("All POSM items have been deployed as specified"), `photos_confirmed` ("Photos accurately represent the actual deployment"), and `quality_confirmed` ("Material quality and placement meet standards"). This attestation layer provides a lightweight human-verification step aligned with audit requirements.

### 4.4.4 Linkage to the Deployment Record

On successful form submission, the component calls `api.transitionRegistration(id, 'COMPLETED', reason)` where `reason` is composed from the deployment date and notes. This invokes the `transitionState` function in `workflowService`, which atomically: updates `registrations.workflow_state` to `COMPLETED`, writes the deployment note as the transition reason in `registration_approvals`, and stamps `approved_at`. The uploaded files are associated with the `registration_id` in the photo payload, so retrieval queries for a given registration will return both the workflow history and the deployment evidence in a single response structure.

### 4.4.5 Bridge to Future AI Validation

The architecture anticipates the addition of an AI inference step between `DEPLOYMENT_PREP` and `FINAL_ACCEPTANCE`. The data model already provides all necessary join keys:

```
registrations.id
  └── registration_content.content_id  →  advertising_content  (approved artwork)
  └── deployment_photos.image_key      →  object storage       (uploaded evidence)
```

A future AI service would: (1) retrieve the `advertising_content` record linked to the registration to obtain the reference artwork URL; (2) retrieve the `deployment_photos` records linked to the same `registration_id`; (3) invoke a visual similarity model to produce a compliance score; and (4) write the result back as a system-generated `APPROVE` or `REJECT` audit entry, potentially auto-advancing the workflow state. No changes to the registration data model or the state machine structure are required to accommodate this extension—only the addition of the inference service and an optional new intermediate state (`AI_VALIDATION`) in the `STATE_MACHINE` transitions.

This forward-compatible design is the primary reason the evidence upload module is implemented as a first-class feature of the MVP rather than deferred to a later phase: without the photo data existing in structured form and linked to approved content references, training or deploying an AI comparator would have no ground truth to operate on.

---

*End of Chapter 4*
