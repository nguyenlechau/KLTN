# Deliverable 2 — API Route Catalog (Step 2 → Step 6)

## 1) Global API conventions

- Base URL: `/api`
- Auth scheme: `Authorization: Bearer <JWT>`
- Global auth middleware: applied to `/api/master/*`, `/api/physical-items/*`, `/api/registrations/*`
- Public route: `GET /health`
- Standard error format (observed):

```json
{ "message": "<error message>" }
```

Additional error fields are used in some cases (for example `requiresConfirmation`, `code`, `guardFailures`).

---

## 2) Guard model (implemented)

### 2.1 Authentication
- `authenticate` middleware validates Bearer JWT.

### 2.2 Permission guard
- `requirePermission('<permission_code>')`
- Permission resolution source: role-permission matrix in backend config.

### 2.3 State guard utilities (available)
- `guardRegistrationState({ state, action })`
- `canEditRegistrationState(state)`

### 2.4 Row-level utility (available)
- `enforceRowOwnership(ownerField, channelField?)`

> Note: State/row-level utilities are implemented and available but not attached to every route yet in this code snapshot.

---

## 3) Role-permission matrix (used by route guards)

- REQUESTER: `channel.view`, `category.view`, `location.view`, `content.view`, `content.create`, `content.update`, `content.clone`, `physical_item.view`, `registration.view`, `registration.create`, `registration.update`, `registration.submit`
- CENTRAL_REQUESTER: same as REQUESTER
- SUPERVISOR: `channel.view`, `category.view`, `location.view`, `content.view`, `physical_item.view`, `registration.view`, `registration.review`, `audit.view`
- CENTRAL_SUPERVISOR: same as SUPERVISOR
- OPERATIONS_SPECIALIST: `channel.view`, `category.view`, `location.view`, `content.view`, `physical_item.view`, `physical_item.create`, `physical_item.update`, `registration.view`, `registration.review`, `registration.accept`, `audit.view`
- OPERATIONS_MANAGER: `channel.view`, `category.view`, `location.view`, `content.view`, `physical_item.view`, `registration.view`, `registration.approve`, `registration.complete`, `audit.view`

---

## 4) Route catalog

## 4.1 System

### `GET /health`
- Auth: none
- Guard: none
- Request body: none
- Response 200:

```json
{ "status": "ok" }
```

---

## 4.2 Master data (`/api/master`)

### A) Channels

### `GET /api/master/channels`
- Auth: required
- Guard: `channel.view`
- Request body: none
- Response 200: `Channel[]`

```ts
type Channel = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
```

### `POST /api/master/channels`
- Auth: required
- Guard: `channel.create`
- Request body:

```ts
{
  code: string;
  name: string; // non-whitespace
  description?: string;
}
```

- Response 201: `Channel`
- Errors:
  - 400 `{ message: 'Invalid channel name' }`

### `PATCH /api/master/channels/:id`
- Auth: required
- Guard: `channel.update`
- Request body (partial):

```ts
{
  name?: string;
  description?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}
```

- Response 200: `Channel`
- Errors:
  - 404 `{ message: 'Channel not found' }`

---

### B) Categories

### `GET /api/master/categories`
- Auth: required
- Guard: `category.view`
- Response 200: `Category[]`

### `POST /api/master/categories`
- Auth: required
- Guard: `category.create`
- Request body:

```ts
{
  channelId: string;
  code: string;      // length = 2
  name: string;      // non-whitespace
  description?: string;
  unitPrice: number;
}
```

- Response 201: `Category`
- Errors:
  - 400 `{ message: 'Invalid category input' }`

### `PATCH /api/master/categories/:id`
- Auth: required
- Guard: `category.update`
- Request body (partial):

```ts
{
  name?: string;
  description?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  unitPrice?: number;
  confirmPricePropagation?: boolean;
}
```

- Behavior:
  - If `unitPrice` changed and `confirmPricePropagation !== true`: block
  - If inactivated: block when child items include `PENDING | ON_HOLD | IN_PROGRESS`
  - If inactivated and allowed: cascade `ACTIVE -> INACTIVE` to child items
  - If price changed + confirmed: propagate unit price to draft/revision registration items
- Response 200: `Category`
- Errors:
  - 404 `{ message: 'Category not found' }`
  - 409 `{ message: 'Price change requires confirmation for downstream propagation', requiresConfirmation: true }`
  - 409 `{ message: 'Cannot inactivate category due to child items in blocked states' }`

---

### C) Locations

### `GET /api/master/locations`
- Auth: required
- Guard: `location.view`
- Response 200: `Location[]`

### `POST /api/master/locations`
- Auth: required
- Guard: `location.create`
- Request body:

```ts
{
  channelId: string;
  code: string;     // length = 3 (unique by channel at DB level)
  name: string;     // non-whitespace
  addressLine?: string;
  latitude?: number;   // -90..90
  longitude?: number;  // -180..180
}
```

- Response 201: `Location`
- Errors:
  - 400 `{ message: 'Invalid location input' }`

### `PATCH /api/master/locations/:id`
- Auth: required
- Guard: `location.update`
- Request body (partial):

```ts
{
  name?: string;
  addressLine?: string | null;
  latitude?: number;
  longitude?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  confirmStatusPropagation?: boolean;
}
```

- Behavior:
  - If inactivating: requires `confirmStatusPropagation === true`
  - If inactivating: block when child items include `PENDING | ON_HOLD | IN_PROGRESS`
  - If inactivating and allowed: cascade `ACTIVE -> INACTIVE` to child items
- Response 200: `Location`
- Errors:
  - 400 `{ message: 'Invalid latitude/longitude bounds' }`
  - 404 `{ message: 'Location not found' }`
  - 409 `{ message: 'Inactive cascade requires user confirmation', requiresConfirmation: true }`
  - 409 `{ message: 'Cannot inactivate location due to child items in blocked states' }`

---

### D) Advertising Contents

### `GET /api/master/contents`
- Auth: required
- Guard: `content.view`
- Response 200: `AdvertisingContent[]` with computed expiry field:

```ts
type AdvertisingContentResponse = AdvertisingContent & {
  computed_status: 'HET_HAN' | 'CON_HAN';
};
```

### `POST /api/master/contents`
- Auth: required
- Guard: `content.create`
- Request body:

```ts
{
  channelId: string;
  categoryId?: string | null;
  name: string;            // 1..225, non-whitespace
  description?: string;
  startDate: string;       // date
  endDate: string;         // endDate > startDate
  imageKeys?: string[];
}
```

- Response 201: `AdvertisingContent`
- Errors:
  - 400 `{ message: 'Invalid content input' }`

### `POST /api/master/contents/:id/clone`
- Auth: required
- Guard: `content.clone`
- Request body: none
- Behavior: clones source content with name suffix ` (Clone)`
- Response 201: `AdvertisingContent`
- Errors:
  - 404 `{ message: 'Content not found' }`

### `PATCH /api/master/contents/:id`
- Auth: required
- Guard: `content.update`
- Request body (partial):

```ts
{
  name?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  imageKeys?: string[];
}
```

- Response 200: `AdvertisingContent`
- Errors:
  - 400 `{ message: 'Invalid content name' }`
  - 400 `{ message: 'End date must be after start date' }`
  - 404 `{ message: 'Content not found' }`

---

## 4.3 Physical items (`/api/physical-items`)

### `GET /api/physical-items`
- Auth: required
- Guard: `physical_item.view`
- Response 200: `PhysicalItem[]`

### `POST /api/physical-items/wizard/preview`
- Auth: required
- Guard: `physical_item.create`
- Request body (Wizard Step 1):

```ts
{
  channelId: string;
  categoryId: string;
  locationId: string;
  quantity: number; // integer > 0
}
```

- Behavior (Wizard Step 2 generation):
  - `itemCode = LocationCode.CategoryCode.SeqNo(4-digit)`
  - `itemName = CategoryName + LocationName + SeqNo(4-digit)`
  - inherited status based on category/location active flags
- Response 200:

```ts
{
  generatedItems: Array<{
    seqNo: number;
    itemCode: string;
    itemName: string;
    inferredStatus: 'ACTIVE' | 'INACTIVE';
  }>;
}
```

- Errors:
  - 400 `{ message: 'Invalid wizard step 1 input' }`
  - 404 `{ message: 'Category or location not found' }`

### `POST /api/physical-items/wizard/commit`
- Auth: required
- Guard: `physical_item.create`
- Request body (Wizard Step 3 commit):

```ts
{
  channelId: string;
  categoryId: string;
  locationId: string;
  items: Array<{
    seqNo: number;
    itemCode: string;
    itemName: string;
    width: number;   // <= 99.99, 2-decimal expected
    length: number;  // <= 99.99, 2-decimal expected
    imageKey?: string;
    description?: string;
  }>;
}
```

- Behavior:
  - Inherited item status:
    - category active + location active => item active
    - otherwise => item inactive
- Response 201: `PhysicalItem[]`
- Errors:
  - 400 `{ message: 'No items to create' }`
  - 400 `{ message: 'Invalid width/length. Max 99.99, 2 decimals.' }`
  - 404 `{ message: 'Category/location not found' }`

### `PATCH /api/physical-items/:id`
- Auth: required
- Guard: `physical_item.update`
- Request body (partial):

```ts
{
  width?: number;
  length?: number;
  imageKey?: string;
  description?: string;
}
```

- Behavior:
  - Edit blocked when item status in `PENDING | ON_HOLD | IN_PROGRESS`
- Response 200: `PhysicalItem`
- Errors:
  - 404 `{ message: 'Item not found' }`
  - 409 `{ message: 'Item cannot be edited while status is Pending/On Hold/In Progress' }`
  - 400 `{ message: 'Invalid width/length. Max 99.99, 2 decimals.' }`

---

## 4.4 Registrations (`/api/registrations`)

### `GET /api/registrations`
- Auth: required
- Guard: `registration.view`
- Response 200: `AdvertisingRegistration[]`

### `POST /api/registrations`
- Auth: required
- Guard: `registration.create`
- Request body (3-section form):

```ts
{
  // Section A - campaign
  campaignName: string;         // non-whitespace
  campaignDescription?: string;
  budgetEstimate: number;       // <= 10,000,000,000
  startDate: string;
  endDate: string;              // > startDate
  documentKey?: string;
  representativeName?: string;
  representativePhone?: string; // exactly 10 digits

  // Section B - content
  contentMode: 'NEW' | 'EXISTING';
  contentId?: string; // for EXISTING
  newContent?: {
    channelId: string;
    categoryId?: string | null;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    imageKeys?: string[];
  }; // for NEW

  // Section C - item scope
  selectedItemIds?: string[];
}
```

- Behavior:
  - Block if computed total > budget
  - If `contentMode = NEW`: also inserts to content master
  - If `contentMode = EXISTING`: only accepts non-expired content (`CURRENT_DATE <= end_date`)
  - Writes create audit log
- Response 201: `AdvertisingRegistration`
- Errors:
  - 400 `{ message: 'Invalid campaign data' }`
  - 400 `{ message: 'Representative phone must be exactly 10 digits' }`
  - 400 `{ message: 'Invalid new content payload' }`
  - 409 `{ message: 'Selected content is expired or missing' }`
  - 409 `{ message: 'Total amount exceeds budget estimate', code: 'BUDGET_EXCEEDED' }`

### `POST /api/registrations/:id/workflow-action`
- Auth: required
- Guard: `registration.view` (current implementation)
- Request body:

```ts
{
  action:
    | 'SAVE_DRAFT'
    | 'SUBMIT'
    | 'REQUEST_REVISION'
    | 'RESUBMIT'
    | 'REVIEW_PASS'
    | 'APPROVE'
    | 'PREPARE_DEPLOYMENT'
    | 'SUBMIT_FINAL_ACCEPTANCE'
    | 'COMPLETE';
}
```

- Workflow checks performed:
  - allowed transition from current state
  - role allowed for transition
  - guard checks: actionable items, budget cap, deployment images/notes, lock-after-approval path
- Side effects:
  - status transition update
  - optional `approved_at` stamp
  - audit log insert
- Response 200: updated `AdvertisingRegistration`
- Errors:
  - 404 `{ message: 'Registration not found' }`
  - 409 workflow evaluation payload:

```ts
{
  ok: false;
  reason: 'ACTION_NOT_AVAILABLE' | 'ROLE_NOT_ALLOWED' | 'GUARD_FAILED' | 'INVALID_STATE';
  guardFailures?: string[];
}
```

### `GET /api/registrations/:id/history`
- Auth: required
- Guard: `audit.view`
- Request body: none
- Response 200: `AuditLog[]` for registration entity

---

## 5) Entity response shape references (DB-backed)

```ts
type Category = {
  id: string;
  channel_id: string;
  code: string;
  name: string;
  description: string | null;
  unit_price: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type Location = {
  id: string;
  channel_id: string;
  code: string;
  name: string;
  address_line: string | null;
  latitude: string | null;
  longitude: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type AdvertisingContent = {
  id: string;
  channel_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  image_keys: unknown[];
  is_active: boolean;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type PhysicalItem = {
  id: string;
  channel_id: string;
  category_id: string;
  location_id: string;
  seq_no: number;
  item_code: string;
  item_name: string;
  width: string;
  length: string;
  image_key: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ON_HOLD' | 'IN_PROGRESS';
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type AdvertisingRegistration = {
  id: string;
  registration_no: string;
  campaign_name: string;
  campaign_description: string | null;
  budget_estimate: string;
  start_date: string;
  end_date: string;
  document_key: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  content_id: string | null;
  status:
    | 'DRAFT'
    | 'SUPERVISOR_REVIEW'
    | 'CENTRAL_OPS_REVIEW'
    | 'MANAGER_APPROVAL'
    | 'APPROVED'
    | 'DEPLOYMENT_PREP'
    | 'FINAL_ACCEPTANCE'
    | 'COMPLETED'
    | 'REVISION_REQUIRED';
  created_by: string;
  updated_by: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type AuditLog = {
  id: number;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  action: string;
  old_value: unknown | null;
  new_value: unknown | null;
  created_at: string;
};
```

---

## 6) Implementation note for central bypass open question

- Central-role bypass behavior is intentionally **not implemented**.
- Two interpretations are documented in workflow module and remain pending business sign-off.
