# SYSTEM SPECIFICATION: Centralized AI-Integrated Management System for Physical Advertising Assets

## Product Name
**Centralized Management System for Physical Advertising Assets in Multi-Branch Retail Enterprises**

**Version:** 1.0 (MVP + Phase 2 Roadmap)  
**Status:** Implementation-Ready Specification  
**Last Updated:** May 26, 2026

---

## A. PRODUCT OVERVIEW

### A.1 Mission
Enable multi-branch retail enterprises to centrally manage advertising content, campaign registrations, physical assets, locations, and approval workflows with enterprise-grade auditability, role-based access control, and future AI-driven automation.

### A.2 Business Context
The system operates in a distributed enterprise with:
- **Multiple branches** requiring coordinated advertising management
- **Hierarchical approval workflows** spanning operational, supervisory, and brand management roles
- **Master data governance** for locations, categories, channels, and content
- **Compliance requirements** for audit trails, deployment tracking, and image verification
- **Future AI potential** for image recognition, deployment validation, and content classification

### A.3 Core Value Propositions
1. **Workflow Transparency** – Clear visibility into registration status from draft through acceptance
2. **Master Data Control** – Single source of truth for locations, categories, items, and content
3. **Audit Compliance** – Complete operation history and role-based access logging
4. **Scalability** – Support for branch-level and HO (head office) operations
5. **AI Readiness** – Structured data and image pipelines for future automation

### A.4 Key Stakeholders & User Personas
| Role | Persona | Primary Actions | Key Pain Points |
|------|---------|-----------------|-----------------|
| **INPUTTER** | Field operator or branch staff | Create registrations, upload images, manage master data | Workflow bottlenecks, unclear status |
| **INPUTTER_HO** | Head office coordinator | Consolidate branch requests, manage HO-level content | Data duplication, version control |
| **APPROVER** | Supervisor/manager | Review and approve registrations from direct reports | Missing context, unclear business rules |
| **APPROVER_HO** | HO supervisor | Approve HO-level registrations and escalations | Handling subordinate chains |
| **BRAND** | Brand/product marketing owner | Accept registrations, propose categories, validate deployment | Limited control, late involvement |
| **BRAND_MANAGER** | Senior brand leader | Final approval, pricing lock, acceptance sign-off | Accountability for errors, late discovery |

---

## B. REQUIREMENT NORMALIZATION SUMMARY

### B.1 Consolidated Functional Domains
The raw requirements were organized across 11 modules. After normalization:

| Domain | Consolidated Modules | Key Overlap Resolution |
|--------|----------------------|----------------------|
| **Master Data Governance** | Locations, Channels, Categories, Physical Items | Hierarchical 3-level tree (Channel → Category → Position); Pricing belongs to Category, not Channel |
| **Transactional Workflow** | Registration Management, Approval & Acceptance | Single 8-step workflow with role-based actions at each step |
| **Content Management** | Advertising Content | Standalone master table; reusable in registrations |
| **Access Control** | User Roles & Permissions | 6 core roles with screen-level and action-level permissions |
| **Audit & Compliance** | Audit Trail, Operation History | Unified audit table capturing all entity changes |
| **Reporting & Export** | Report generation, export templates | Standardized export format per entity type |
| **Future Enhancements** | AI Extension Opportunities | Phased roadmap (Phase 2+) |

### B.2 Key Consolidations Made

**1. Channel vs. Category Clarification**
- **Channel** = top-level master (e.g., "Retail Channel", "Outlet Channel") – groups locations
- **Category** = product/format type (e.g., "POP Display", "Billboard") – has pricing, format, UOM
- **Position** = physical location (e.g., "Store A – Entrance") – links to channel, has coordinates
- **Physical Item** = individual asset (e.g., "POP Display #1 at Store A") – links to position + category

**2. Registration Status Terminology**
Normalized Vietnamese status names to standard workflow states:

| Vietnamese | Standard | Context |
|-----------|----------|---------|
| Bản nháp | Draft | Initial creation |
| CBQL Phê duyệt | Supervisor Review | Manager-level review |
| P.Thương hiệu tiếp nhận | Brand Intake | Brand team receives and proposes additions |
| Trưởng phòng thương hiệu phê duyệt | Brand Manager Approval | Senior brand leader final approval; pricing locked |
| Đã duyệt | Approved | Ready for deployment |
| Nghiệm thu | Acceptance | In-field deployment verification |
| Trưởng phòng nghiệm thu | Acceptance Review | Senior acceptance reviewer |
| Đã nghiệm thu | Completed | Final, immutable state |

**3. Status (Content & Registration)**
- Content Status: "Còn hạn" (Valid) vs. "Hết hạn" (Expired) – system-computed based on end_date
- Registration Status: follows 8-step workflow above
- Item Status: "Hoạt động" (Active) vs. "Không hoạt động" (Inactive) vs. "Treo" (Suspended/in-progress)

**4. Editable Fields Across Lifecycle**
- **Draft phase** – all fields editable
- **After Brand Intake approval** – items locked, pricing frozen
- **After Brand Manager approval** – unit price immutable; category/pricing decisions final
- **Acceptance phase** – only images, status, and notes editable

---

## C. OPEN QUESTIONS / AMBIGUITIES / CONFLICTS

### C.1 Critical Ambiguities Requiring Clarification

#### **Q1: BRAND Role Skip Logic in Workflow**
**Conflict:**
> "If the registration creator has role BRAND, after submitting from draft the workflow directly skips step 3"

**Problem:**
- Step 3 is already the BRAND intake step ("P.Thương hiệu tiếp nhận")
- Does this mean:
  - **(Interpretation A)** If BRAND creates a registration, it starts at "Brand Manager Approval" (step 4)?
  - **(Interpretation B)** If BRAND creates, it skips to "Approved" (step 5)?

**Recommendation:**
- **Propose:** If BRAND is the creator, registration should auto-transition to "Brand Manager Approval" step, skipping supervisor review. Justification: BRAND should not review their own draft.
- **Decision Required:** Confirm with business stakeholder.

#### **Q2: Approval Chain for Supervisor Review**
**Requirement:**
> "approver role must be direct superior of the draft creator"

**Problem:**
- Unclear if "direct superior" is:
  - Organizational hierarchy in database (manager_id field)?
  - Team assignment (team_lead)?
  - Role hierarchy (role-based)?

**Recommendation:**
- Implement **role-based approval routing** initially (simplest).
- Add organizational hierarchy in Phase 2 for department-aware routing.
- **Assumption Made:** Approver and Inputter must both exist and approver must have one role-level above in hierarchy.

#### **Q3: Deactivation Impact – Items in "Treo" State**
**Requirement:**
> "If position/category status changes to inactive, block if any items are 'Treo' (in-progress)"

**Problem:**
- "Treo" is only mentioned in Physical Item context.
- Is "Treo" a transient state during registration acceptance, or a persistent item status?

**Recommendation:**
- **Define:** Item "Treo" = newly added during Brand Intake phase, awaiting deployment.
- **Rule:** Item returns to "Hoạt động" after acceptance completion.
- **Assumption Made:** "Treo" is transient; never permanently saved as inactive.

#### **Q4: Price Update Propagation Timing**
**Requirement:**
> "Updating unit price applies to registration forms not yet past 'Trưởng phòng thương hiệu phê duyệt'"

**Problem:**
- Does this mean:
  - **(A)** Update applies only to registrations still in-progress (not approved)?
  - **(B)** Update also applies retroactively to approved registrations not yet in acceptance?

**Recommendation:**
- **Implement:** New price applies ONLY to future registrations and in-progress registrations before Brand Manager approval.
- **Do NOT retroactively update** past approvals (audit trail integrity).

#### **Q5: Image Requirement in Acceptance Phase**
**Requirement:**
> "All active items must have new uploaded images; all inactive items must have notes"

**Problem:**
- What if user changes item from active → inactive without providing note, but had already uploaded image?
- Validation error or warning?

**Recommendation:**
- **Strict validation:** Block save if validation fails.
- **Error message:** "Item [code]: If inactive, note is required. If active, new image is required."

#### **Q6: "Bổ sung" (Revise) vs "CBNV Điều Chỉnh" (Adjustment)**
**Requirement:**
> Both supervisors and BRAND can send registration back with "Bổ sung" (supplement/revise)

**Problem:**
- Is status "CBNV Điều Chỉnh" a distinct workflow state, or does registration revert to "Draft"?
- Can inputter re-submit immediately, or must supervisor re-review?

**Recommendation:**
- **Implement:** "CBNV Điều Chỉnh" is a **distinct state** (like Draft, but marked as requiring changes).
- **Flow:** After CBNV Điều Chỉnh, inputter must re-submit to supervisor for re-review.
- **Assumption Made:** Treats revision requests as a separate flow from draft creation.

### C.2 Missing Requirements / Gaps

#### **G1: Export File Format**
- Requirement mentions "export" but no format specified (PDF, Excel, CSV, JSON?)
- **Recommendation:** Support Excel (XLSX) for data exports; PDF for official order documents.

#### **G2: Clone History Inheritance**
- Cloning creates new ID but what about linked data?
  - Clone content → new code, but same images?
  - Clone registration → new code, but reuse same channels/categories?
- **Recommendation:** Clone copies all data and generates new codes; user may edit before save.

#### **G3: Batch Operations**
- Can user bulk-update item statuses or bulk-upload images?
- **Recommendation:** MVP excludes bulk operations; Phase 2 adds batch updates.

#### **G4: Notification / Workflow Alerts**
- Who gets notified when registration status changes?
- **Recommendation:** Phase 2 adds email notifications; MVP uses in-app status only.

#### **G5: Concurrent Edit Conflict Handling**
- What if two users edit same registration simultaneously?
- **Recommendation:** Last-write-wins with optimistic concurrency; warn on reload if version changed.

#### **G6: Deletion Policy**
- Can users delete registrations, content, or items?
- **Recommendation:** Soft delete (mark deleted_at); no hard delete in MVP for audit compliance.

---

## D. FUNCTIONAL MODULE BREAKDOWN

### D.1 Module Dependency Graph

```
User Authentication & Authorization
  ↓
Master Data Layer
├── Channel Management
├── Category Management (depends on Channel)
├── Location Management (depends on Channel)
└── Physical Item Management (depends on Location + Category)
  ↓
Content Management
  ├── Advertising Content (master table)
  ↓
Transactional Layer
├── Registration Management (depends on Content, Items, Locations)
├── Approval & Workflow (depends on Registrations)
├── Role-Based Access Control (depends on User Roles)
  ↓
Audit & Compliance
├── Operation History (logs all changes)
├── Audit Trail (compliance)
  ↓
Reporting & Export
└── Report Generation (dependencies on all above)
```

### D.2 Module Specifications

#### **Module 1: Channel Management**

**Purpose:** Define distribution channels that group locations.

**Entities:**
- `channels` table

**Functional Requirements:**
- Search by channel name (fuzzy)
- List all channels with status
- Create new channel (BRAND role only)
- Edit channel name/description
- Set status (Hoạt động / Không hoạt động)
- Cannot deactivate if locations depend on it

**Key Fields:**
| Field | Type | Required | Editable | Notes |
|-------|------|----------|----------|-------|
| id | UUID | ✓ | ✗ | PK |
| code | VARCHAR(10) | ✓ | ✗ | Unique, system-generated or user-provided |
| name | VARCHAR(100) | ✓ | ✓ | |
| description | TEXT | ✗ | ✓ | |
| status | ENUM | ✓ | ✓ | 'ACTIVE', 'INACTIVE' |
| created_by | UUID | ✓ | ✗ | FK users |
| created_at | TIMESTAMP | ✓ | ✗ | |
| updated_at | TIMESTAMP | ✓ | ✗ | |
| deleted_at | TIMESTAMP | ✗ | ✗ | Soft delete |

**Permissions:**
- BRAND: CRUD
- BRAND_MANAGER: Read only
- Others: No access

---

#### **Module 2: Category Management**

**Purpose:** Define product/asset categories with pricing and unit of measure.

**Entities:**
- `categories` table

**Functional Requirements:**
- Search by category name (fuzzy)
- Advanced search: Format, Status
- List all categories
- Create category (BRAND)
- Edit: Format, Description, Unit Price, Unit of Measure, Status
- Unit Price change triggers confirmation popup
- Status deactivation blocks if items in-progress

**Key Fields:**
| Field | Type | Required | Editable | Notes |
|-------|------|----------|----------|-------|
| id | UUID | ✓ | ✗ | PK |
| code | VARCHAR(2) | ✓ | ✗ | Unique, system-generated |
| name | VARCHAR(225) | ✓ | ✗ | Unique |
| format | ENUM | ✓ | ✓ | 'Online', 'Offline' |
| description | TEXT | ✗ | ✓ | Max 1000 chars |
| unit_price | DECIMAL(12,2) | ✗ | ✓ | Price per unit |
| unit_of_measure | ENUM | ✓ | ✓ | 'cái', 'm2', 'm3', 'm', 'bộ', 'khác' |
| status | ENUM | ✓ | ✓ | 'ACTIVE', 'INACTIVE' |
| created_by | UUID | ✓ | ✗ | FK users |
| created_at | TIMESTAMP | ✓ | ✗ | |
| updated_at | TIMESTAMP | ✓ | ✗ | |
| deleted_at | TIMESTAMP | ✗ | ✗ | Soft delete |

**Permissions:**
- BRAND: CRUD
- BRAND_MANAGER: Read only
- Others: No access

---

#### **Module 3: Location Management**

**Purpose:** Define physical advertising locations (positions) linked to channels.

**Entities:**
- `locations` table

**Functional Requirements:**
- Search by position name, province/city, channel
- List with grid display
- Create location (BRAND)
- Edit location (BRAND)
- Cannot deactivate if items in-progress; warn if has active items
- Status deactivation cascades to child items
- Export report

**Key Fields:**
| Field | Type | Required | Editable | Notes |
|-------|------|----------|----------|-------|
| id | UUID | ✓ | ✗ | PK |
| position_code | VARCHAR(3) | ✓ | ✓ | Unique per channel |
| channel_id | UUID | ✓ | ✓ | FK channels |
| position_name | VARCHAR(255) | ✓ | ✓ | |
| province_city | VARCHAR(100) | ✓ | ✓ | Dropdown or text |
| zone | ENUM | ✓ | ✓ | 'Nội thành', 'Ngoại thành', 'Vùng nông thôn', 'Khu vực khác' |
| address | VARCHAR(255) | ✓ | ✓ | |
| classification | VARCHAR(50) | ✗ | ✓ | Optional category |
| longitude | DECIMAL(10,8) | ✗ | ✓ | -180 to 180 |
| latitude | DECIMAL(11,8) | ✗ | ✓ | -90 to 90 |
| representative_1_name | VARCHAR(100) | ✗ | ✓ | |
| representative_1_email | VARCHAR(255) | ✗ | ✓ | Email validation |
| representative_1_phone | VARCHAR(10) | ✗ | ✓ | 10 digits |
| representative_2_name | VARCHAR(100) | ✗ | ✓ | |
| representative_2_email | VARCHAR(255) | ✗ | ✓ | Email validation |
| representative_2_phone | VARCHAR(10) | ✗ | ✓ | 10 digits |
| status | ENUM | ✓ | ✓ | 'ACTIVE', 'INACTIVE' |
| note | TEXT | ✗ | ✓ | Max 255 |
| created_by | UUID | ✓ | ✗ | FK users |
| created_at | TIMESTAMP | ✓ | ✗ | |
| updated_at | TIMESTAMP | ✓ | ✗ | |
| deleted_at | TIMESTAMP | ✗ | ✗ | Soft delete |

**Permissions:**
- BRAND: CRUD
- BRAND_MANAGER: Read only
- Others: No access

---

#### **Module 4: Physical Item Management**

**Purpose:** Manage individual physical advertising assets.

**Entities:**
- `physical_items` table

**Functional Requirements:**
- Batch item creation: Select Channel → Category → Position → Quantity
- Auto-generates: Item Code (Position.Category.Seq), Item Name
- Editable fields per item: Width, Length, Image, Description, Status
- Cannot edit if status is "Treo"
- Parent status propagation (category/position status affects item)
- Search by item name, category, channel, position
- Advanced search: Content Status (Valid/Expired), Content Name

**Key Fields:**
| Field | Type | Required | Editable | Notes |
|-------|------|----------|----------|-------|
| id | UUID | ✓ | ✗ | PK |
| item_code | VARCHAR(50) | ✓ | ✗ | Auto-generated, unique |
| item_name | VARCHAR(255) | ✓ | ✗ | Auto-generated |
| position_id | UUID | ✓ | ✗ | FK locations |
| category_id | UUID | ✓ | ✗ | FK categories |
| channel_id | UUID | ✓ | ✗ | FK channels |
| width_m | DECIMAL(5,2) | ✓ | ✓ | Max 99.99 |
| length_m | DECIMAL(5,2) | ✓ | ✓ | Max 99.99 |
| volume_m3 | DECIMAL(10,4) | ✗ | ✗ | Computed (width * length) |
| description | TEXT | ✗ | ✓ | Max 400 chars |
| image_url | VARCHAR(500) | ✗ | ✓ | Max 5MB |
| content_id | UUID | ✗ | ✓ | FK advertising_content |
| status | ENUM | ✓ | ✓ (conditional) | 'ACTIVE', 'INACTIVE', 'TREO' |
| created_by | UUID | ✓ | ✗ | FK users |
| created_at | TIMESTAMP | ✓ | ✗ | |
| updated_at | TIMESTAMP | ✓ | ✗ | |
| deleted_at | TIMESTAMP | ✗ | ✗ | Soft delete |

**Permissions:**
- INPUTTER/INPUTTER_HO: Create in draft registrations
- BRAND: CRUD
- BRAND_MANAGER: Read only
- Others: No access

---

#### **Module 5: Advertising Content Management**

**Purpose:** Manage reusable advertising content (copy, images, metadata).

**Entities:**
- `advertising_content` table
- `content_images` table

**Functional Requirements:**
- Search by content name (fuzzy)
- Advanced search: Code, Status (Valid/Expired), Category, Department
- Create content
- Edit editable fields (name, description, category, dates)
- Status auto-computed (Còn hạn if end_date >= today; Hết hạn otherwise)
- Upload up to 10 images (JPEG/PNG, max 5MB each)
- Image gallery with thumbnail + count indicator
- Clone content (new code, same images)
- Operation history

**Key Fields:**
| Field | Type | Required | Editable | Notes |
|-------|------|----------|----------|-------|
| id | UUID | ✓ | ✗ | PK |
| content_code | VARCHAR(20) | ✓ | ✗ | Auto-generated, unique |
| content_name | VARCHAR(225) | ✓ | ✓ | Min 1, Max 225 |
| category | ENUM | ✓ | ✓ | Predefined list (13 categories) |
| description | TEXT | ✗ | ✓ | Max 225 chars |
| start_date | DATE | ✓ | ✓ | Default: today |
| end_date | DATE | ✓ | ✓ | Must be >= start_date |
| status | ENUM | ✓ | ✗ | 'Còn hạn', 'Hết hạn' (system-computed) |
| department_id | UUID | ✓ | ✗ | FK departments (creator's dept) |
| created_by | UUID | ✓ | ✗ | FK users |
| created_at | TIMESTAMP | ✓ | ✗ | |
| updated_at | TIMESTAMP | ✓ | ✗ | |
| deleted_at | TIMESTAMP | ✗ | ✗ | Soft delete |

**Permissions:**
- INPUTTER/INPUTTER_HO: Create, Read
- BRAND: Create, Edit, Read, Clone
- BRAND_MANAGER: Read only
- Others: No access

---

#### **Module 6: Registration Management (Approval Workflow)**

**Purpose:** Manage advertising campaign registrations through 8-step approval workflow.

**Entities:**
- `registrations` table
- `registration_items` table
- `registration_history` table

**Functional Requirements:**
- Full 8-step workflow with role-based actions at each step
- See Section F for detailed workflow

**Key Statuses:**
1. Bản nháp (Draft)
2. CBQL Phê duyệt (Supervisor Review)
3. P.Thương hiệu tiếp nhận (Brand Intake)
4. Trưởng phòng thương hiệu phê duyệt (Brand Manager Approval)
5. Đã duyệt (Approved)
6. Nghiệm thu (Acceptance)
7. Trưởng phòng nghiệm thu (Acceptance Review)
8. Đã nghiệm thu (Completed)

Plus: CBNV Điều Chỉnh (Revision Requested)

**Permissions & Roles per Status:**
- See Section E for complete RACI matrix

---

### D.3 Screens & Workflows Summary

| Screen | Create | Read | Update | Delete | Export | Notes |
|--------|--------|------|--------|--------|--------|-------|
| Channel List | BRAND | All | BRAND | ✗ | ✓ | Status-based visibility |
| Category List | BRAND | All | BRAND | ✗ | ✓ | Price change confirmation |
| Location List | BRAND | All | BRAND | ✗ | ✓ | Status cascade on deactivate |
| Physical Item List | Various | Various | BRAND | ✗ | ✓ | Batch create allowed |
| Content List | INPUTTER, BRAND | All | BRAND | ✗ | ✓ | Gallery view, clone |
| Registration List | INPUTTER | All | Role-specific | ✗ | ✓ | Status-driven visibility |
| Registration Detail | ✗ | All | Role-specific | ✗ | ✓ | Full workflow UI |
| User Management | ADMIN | ADMIN | ADMIN | ADMIN | ✓ | Not in MVP scope |
| Audit Trail | ✗ | All | ✗ | ✗ | ✓ | Immutable log |

---

## E. USER ROLES AND PERMISSIONS MATRIX

### E.1 Role Definitions

| Role | Title | Department | Key Responsibilities | Approval Authority |
|------|-------|-----------|----------------------|-------------------|
| **INPUTTER** | Branch Operator | Any | Submit registrations, manage local content, create items | None (submits for review) |
| **INPUTTER_HO** | HO Coordinator | HO | Consolidate branch requests, manage HO content | None (submits for review) |
| **APPROVER** | Supervisor/Manager | Any | Review & approve registrations from direct reports | Immediate superiors only |
| **APPROVER_HO** | HO Supervisor | HO | Approve HO-level requests and escalations | HO-level registrations |
| **BRAND** | Brand Owner/PM | Brand Dept | Intake registrations, propose categories, validate deployment | Brand level (owns category/pricing proposals) |
| **BRAND_MANAGER** | Senior Brand Leader | Brand Dept | Final approval, lock pricing, acceptance sign-off | Enterprise level (final approval) |
| **ADMIN** | System Admin | IT | User management, system config, audit access | System level |

### E.2 Screen-Level Permissions

| Screen | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR | ADMIN |
|--------|----------|-------------|----------|------------|-------|-----------|-------|
| Dashboard | Read | Read | Read | Read | Read | Read | Full |
| Channel List | Read | Read | Read | Read | Full | Read | Full |
| Category List | Read | Read | Read | Read | Full | Read | Full |
| Location List | Read | Read | Read | Read | Full | Read | Full |
| Item List | Read | Read | Read | Read | Full | Read | Full |
| Content List | Full | Full | Read | Read | Full | Read | Full |
| Registration List | Full | Full | Full (own dept) | Full (HO) | Full | Full | Full |
| Registration Detail | Status-specific | Status-specific | Status-specific | Status-specific | Status-specific | Status-specific | Full |
| Audit Trail | Read | Read | Read | Read | Read | Read | Full |
| User Mgmt | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Full |

### E.3 Action-Level Permissions by Workflow Status

#### **Status 1: Bản nháp (Draft)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Create | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Read | ✓ (own) | ✓ (own) | ✓ (direct reports) | ✓ (all HO) | ✓ | ✓ |
| Edit All Fields | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Edit Items | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Submit (Trình duyệt) | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Cancel (Hủy) | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Clone | ✓ | ✓ | ✓ (reports only) | ✓ (HO only) | ✓ | ✓ |
| View History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

#### **Status 2: CBQL Phê duyệt (Supervisor Review)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Read | ✗ | ✗ | ✓ (direct reports) | ✓ (direct reports) | ✓ | ✓ |
| Edit | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve (Phê duyệt) | ✗ | ✗ | ✓ (direct reports only) | ✓ (direct reports only) | ✗ | ✗ |
| Request Revision (Bổ sung) | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |

#### **Status 3: P.Thương hiệu tiếp nhận (Brand Intake)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Read | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Edit Content Tab | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Edit Item Scope | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Add Items | ✗ | ✗ | ✗ | ✗ | ✓ (mark 'Treo') | ✗ |
| Remove Items | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Approve (Phê duyệt) | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Request Revision | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Cancel Request (Hủy yêu cầu) | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

#### **Status 4: Trưởng phòng thương hiệu phê duyệt (Brand Manager Approval)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Read | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Edit | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve (Phê duyệt) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Request Revision | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Note:** After this step, pricing is locked. Items cannot be added/removed. | | | | | | |

#### **Status 5: Đã duyệt (Approved)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Read | ✗ | ✗ | ✗ | ✗ | ✓ (assigned only) | ✓ |
| Begin Acceptance (Nghiệm thu) | ✗ | ✗ | ✗ | ✗ | ✓ (assigned) | ✗ |

#### **Status 6: Nghiệm thu (Acceptance)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Read | ✗ | ✗ | ✗ | ✗ | ✓ (assigned) | ✓ |
| Change Item Status | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Upload New Image per Item | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Add Note per Item | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Submit Acceptance (Nghiệm thu) | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Request Revision | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

#### **Status 7: Trưởng phòng nghiệm thu (Acceptance Review)**

| Action | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MGR |
|--------|----------|-------------|----------|------------|-------|-----------|
| Read | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Override Item Status/Image/Description | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Approve Acceptance (Nghiệm thu) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Request Revision | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

#### **Status 8: Đã nghiệm thu (Completed)**

| Action | All Roles |
|--------|-----------|
| Read | ✓ |
| Edit | ✗ |
| Clone | ✓ |

---

## F. END-TO-END WORKFLOW AND STATUS TRANSITION TABLE

### F.1 Workflow State Machine

```
┌─────────────────┐
│  Bản nháp       │  (Draft)
│  [INPUTTER/     │
│   BRAND create] │
└────────┬────────┘
         │ Submit (Trình duyệt)
         ↓
┌─────────────────┐
│ CBQL Phê duyệt  │  (Supervisor Review)
│ [APPROVER       │
│  reviews]       │
└────┬──────┬─────┘
     │      │
     │      └─→ Bổ sung → CBNV Điều Chỉnh (loop back)
     │
     │ Approve
     ↓
┌──────────────────┐
│ P.Thương hiệu    │  (Brand Intake)
│ tiếp nhận        │
│ [BRAND proposes] │
└────┬──────┬──────┘
     │      │
     │      └─→ Bổ sung → CBNV Điều Chỉnh (loop back)
     │
     │ Approve
     ↓
┌──────────────────┐
│ Trưởng phòng     │  (Brand Manager Approval)
│ thương hiệu      │  [Pricing locked here]
│ phê duyệt        │
│ [BRAND_MANAGER]  │
└────┬──────┬──────┘
     │      │
     │      └─→ Bổ sung → P.Thương hiệu (loop back to Brand Intake)
     │
     │ Approve
     ↓
┌──────────────────┐
│ Đã duyệt         │  (Approved)
│ [Ready for       │
│  deployment]     │
└────────┬─────────┘
         │
         │ Begin Acceptance
         ↓
┌──────────────────┐
│ Nghiệm thu       │  (Acceptance)
│ [BRAND verifies  │
│  deployment]     │
└────┬──────┬──────┘
     │      │
     │      └─→ Bổ sung → Nghiệm thu (loop)
     │
     │ Submit Acceptance
     ↓
┌──────────────────┐
│ Trưởng phòng     │  (Acceptance Review)
│ nghiệm thu       │  [BRAND_MANAGER final check]
│ [BRAND_MANAGER]  │
└────┬──────┬──────┘
     │      │
     │      └─→ Bổ sung → Nghiệm thu (loop back)
     │
     │ Approve
     ↓
┌──────────────────┐
│ Đã nghiệm thu    │  (Completed)
│ [Immutable]      │
└──────────────────┘

Special Status: CBNV Điều Chỉnh (Revision)
- Entered when any approver requests changes
- Treated like Draft with "needs revision" flag
- After revision, must re-submit to same checkpoint
```

### F.2 Workflow Transition Rules

#### **Draft → Supervisor Review**

| Condition | Rule |
|-----------|------|
| **Validation** | All items must be "Hoạt động" (not "Treo" or "Không hoạt động") |
| **Precondition** | Registration creator must be INPUTTER or INPUTTER_HO role |
| **Special Logic** | If creator is BRAND: **skip to Brand Manager Approval** (Interpretation A of Q1) |
| **Item Status** | "Treo" status not allowed at submission |
| **Next Assignee** | Routing rule: Direct superior of creator (Approver role) |

#### **Supervisor Review → Brand Intake**

| Condition | Rule |
|-----------|------|
| **Approval** | Approver clicks "Phê duyệt" |
| **Validation** | All items still "Hoạt động" |
| **Next Assignee** | Assigned to BRAND user (configurable per category) |
| **Brand User Handling** | From this point, BRAND user name displayed in all subsequent steps |

#### **Brand Intake → Brand Manager Approval**

| Condition | Rule |
|-----------|------|
| **Required Fields** | BRAND must fill: Procurement category proposal, Other category proposal, Other proposal (or "Không") |
| **Editable Sections** | Content Tab, Item Scope Tab |
| **Item Additions** | Newly added items marked "Treo" (suspended) |
| **Item Removals** | Removed items revert to "Hoạt động" |
| **Next Assignee** | BRAND_MANAGER (direct superior of assigned BRAND user) |

#### **Brand Manager Approval → Approved**

| Condition | Rule |
|-----------|------|
| **Approval** | BRAND_MANAGER approves |
| **Locking** | Unit Price and Total Amount become immutable |
| **Item Restrictions** | Items cannot be added/removed after this point |
| **Next Step** | Registration moves to "Approved" ready for acceptance |

#### **Approved → Acceptance**

| Condition | Rule |
|-----------|------|
| **Trigger** | BRAND user (assigned) clicks "Begin Acceptance" or "Nghiệm thu" |
| **Item Status Display** | Display: Old Image, New Image, Note fields for each item |
| **Active Item Rule** | All "Hoạt động" items MUST have new uploaded image before submit |
| **Inactive Item Rule** | All "Không hoạt động" items MUST have note before submit |

#### **Acceptance → Acceptance Review**

| Condition | Rule |
|-----------|------|
| **Trigger** | BRAND user submits acceptance |
| **Validation** | All active items have images; all inactive items have notes |
| **Next Assignee** | BRAND_MANAGER (final acceptance reviewer) |

#### **Acceptance Review → Completed**

| Condition | Rule |
|-----------|------|
| **Approval** | BRAND_MANAGER approves acceptance |
| **BRAND_MANAGER Overrides** | Can change item status, image, description before final approval |
| **Final State** | Registration becomes immutable; no further edits allowed |

#### **Revision Requests (Bổ sung) → CBNV Điều Chỉnh**

| Transition | Back To | Requires | Next Submission Path |
|-----------|---------|----------|----------------------|
| Approver requests revision (Draft → Review) | CBNV Điều Chỉnh | Inputter re-submit | Back to Supervisor Review |
| BRAND requests revision (Intake) | CBNV Điều Chỉnh | Inputter re-submit | Back to Supervisor Review |
| BRAND_MANAGER requests revision (Brand Manager Approval) | P.Thương hiệu (Brand Intake) | BRAND revise & resubmit | Back to BRAND_MANAGER |
| BRAND_MANAGER requests revision (Acceptance Review) | Nghiệm thu (Acceptance) | BRAND revise & resubmit | Back to BRAND_MANAGER |

---

## G. SCREEN LIST AND SCREEN-LEVEL FUNCTIONAL SPECS

### G.1 Master Data Screens

#### **G.1.1 Channel Management Screen**

**Purpose:** Create and manage distribution channels

**Layout:** List + Detail

**List View:**
- Columns: ID, Code, Name, Description, Status, Created By, Created Date, Actions
- Search: Fuzzy by name; Advanced by status
- Actions per row: View, Edit, Delete (soft), History, Clone

**Create/Edit Form:**
- Channel Code: text (required, unique, auto-generated option)
- Channel Name: text (required, max 100)
- Description: textarea (optional)
- Status: radio (Hoạt động / Không hoạt động)
- Validation: Cannot deactivate if locations depend on it

**Permissions:**
- Create: BRAND only
- Edit: BRAND only
- View: All authenticated users
- Delete: Soft delete only

---

#### **G.1.2 Category Management Screen**

**Purpose:** Define product categories with pricing

**Layout:** List + Detail

**List View:**
- Columns: Code, Name, Format, Unit Price, Unit of Measure, Status, Created By, Created Date
- Search: Fuzzy by name; Advanced by Format, Status
- Sorting: By any column
- Actions: View, Edit, History

**Create/Edit Form:**
- Category Code: auto-generated (readonly)
- Category Name: text (required, unique, max 225)
- Format: dropdown (Online / Offline) – required
- Description: textarea (optional, max 1000)
- Unit Price: decimal (optional)
- Unit of Measure: dropdown (required) – cái, m2, m3, m, bộ, khác
- Status: radio (Hoạt động / Không hoạt động)

**Price Update Behavior:**
- On Edit of Unit Price, show confirmation: "Đơn giá [new price] sẽ bắt đầu áp dụng cho hạng mục [name]..."
- If confirm: Update applies to registrations not yet in "Trưởng phòng thương hiệu phê duyệt" or beyond
- If cancel: No change

**Status Deactivation:**
- Check: Do items exist in "Treo" or in-progress status?
- If yes: Block, show error "Bạn không thể thay đổi trạng thái hạng mục này vì có vật phẩm..."
- If no: Show confirmation warning listing affected items; on confirm, cascade status to all active items

**Permissions:**
- Create/Edit/Delete: BRAND only
- View: All authenticated users

---

#### **G.1.3 Location Management Screen**

**Purpose:** Define physical advertising positions

**Layout:** List + Detail + Map (optional Phase 2)

**List View:**
- Columns: Position Code, Position Name, Province/City, Address (ellipsis), Channel, Rep 1 Name, Rep 1 Phone, Rep 2 Name, Rep 2 Phone, Status, Note, Actions
- Search: Fuzzy by position name; Advanced by province/city, channel, status
- Sorting: By any column
- Actions: View, Edit, History, Export

**Create/Edit Form:**
- Position Code: text (required, unique per channel, 3 chars)
- Channel: dropdown (required) – links to channels table
- Position Name: text (required, max 255)
- Province/City: dropdown or text (required)
- Zone: dropdown (required) – Nội thành, Ngoại thành, Vùng nông thôn, Khu vực khác
- Address: text (required, max 255)
- Classification: text (optional, max 50)
- Longitude: decimal (optional, -180 to 180)
- Latitude: decimal (optional, -90 to 90)
- Representative 1: Name (text, max 100), Email (email), Phone (10 digits)
- Representative 2: Same as Rep 1
- Status: radio (Hoạt động / Không hoạt động)
- Note: textarea (optional, max 255)

**Status Deactivation:**
- Check: Do items exist in "Treo" (in-progress)?
- If yes: Block, show error "Bạn không thể thay đổi trạng thái vị trí này vì có vật phẩm..."
- If no: Show confirmation warning; cascade status to all active items under this position

**Permissions:**
- Create/Edit/Delete: BRAND only
- View: All authenticated users

---

#### **G.1.4 Physical Item Management Screen**

**Purpose:** Create and manage individual advertising items

**Layout:** Batch Create + List + Detail

**Batch Create Flow:**

**Step 1: Selection**
- Channel: dropdown (required)
- Category: checkbox (required) – can select 1+ categories
- Position: checkbox (required) – depends on channel; shows positions for selected channel
- Quantity: number spinner (required, min 1, max 100)
- [Generate] button

**Step 2: Item Table Display**
- Auto-generates rows: one per (position, category, sequence)
- Item Code format: {PositionCode}.{CategoryCode}.{SequenceNo}
- Item Name format: {CategoryName} {PositionName} {SequenceNo}
- Rows shown in editable table

**Step 3: Edit Per Item**
- Width (m): decimal (required, max 99.99, 2 decimals)
- Length (m): decimal (required, max 99.99, 2 decimals)
- Image: upload (optional, max 5MB)
- Description: textarea (optional, max 400)
- Content: dropdown link to advertising_content (optional)

**Actions:**
- [Cancel] – discard all, reset form
- [Save] – save all items, show success message, reset

**Important:** If user changes Channel/Position while rows exist, show warning: "Bạn vui lòng hoàn thiện khởi tạo vật phẩm tại [position name] trước khi tạo vật phẩm ở vị trí khác"

**List View:**
- Columns: Item Code, Item Name, Width (m), Length (m), Description, Image, Status, Category, Position, Content Code, Actions
- Search: Fuzzy by item name; Advanced by category, channel, province/city, position, content status
- Sorting: By any column
- Actions: Edit, History, Export

**Edit Item:**
- Editable: Width, Length, Description, Image, Status (if not "Treo")
- Non-editable: Item Code, Item Name, Category, Position

**Status Propagation:**
- If parent category or position changes status (active → inactive):
  - Child items update accordingly
  - Validation matrix:
    - Category active + Position active → Item active
    - Category inactive (any position) → Item inactive
    - Position inactive (any category) → Item inactive

**Permissions:**
- Create: INPUTTER, INPUTTER_HO (during registration draft), BRAND
- Edit: BRAND only
- View: All authenticated users
- Cannot edit if status is "Treo"

---

### G.2 Content Management Screen

#### **G.2.1 Advertising Content Management Screen**

**Purpose:** Manage reusable advertising content

**Layout:** List + Detail + Gallery

**List View:**
- Columns: Content Code, Content Name, Description, Category, Key Visual (thumbnail + count), End Date, Status, Creator, Created Date, Actions
- Search: Fuzzy by content name; Advanced by code, status, category, department
- Sorting: By any column
- Status display: Visual badge (Còn hạn = green, Hết hạn = red)
- Image gallery: Click image count to expand gallery modal
- Actions: View, Edit, Clone, History, Export

**Create/Edit Form:**

**Section: Content Details**
- Content Code: readonly, auto-generated
- Content Name: text (required, 1–225 chars)
- Category: dropdown (required) – 13 predefined categories
- Description: textarea (optional, max 225)
- Department: readonly, auto-filled from creator's dept
- Created By: readonly, system user

**Section: Valid Period**
- Start Date: date picker (required, default: today)
- End Date: date picker (required, must be >= start_date)
- Validation: Show error if end_date < start_date
- Status: readonly badge (auto-computed)

**Section: Key Visual**
- Upload images: max 10 images, JPEG/PNG, max 5MB each
- Image list: thumbnails with delete button per image
- Image gallery on list view

**Clone Function:**
- On click "Clone":
  - Auto-generate new Content Code
  - Copy all fields from original
  - Keep same images
  - Show confirmation: "Bạn có chắc chắn muốn sao chép nội dung [name]?"
  - On confirm: Create new record with same data, different code

**Status Computation:**
- Daily check (or on-demand): If current_date > end_date, status = "Hết hạn"; else "Còn hạn"
- Editable field: End Date (editing end date may flip status)

**Permissions:**
- Create: INPUTTER, INPUTTER_HO, BRAND
- Edit: BRAND only
- Clone: All authenticated users
- View: All authenticated users

---

### G.3 Registration Workflow Screens

#### **G.3.1 Registration List Screen**

**Purpose:** Display all registrations with status filtering

**Layout:** List + Filter sidebar

**List View:**
- Columns: Registration Code, Program Name, Budget Estimate, IO Code, Start Date, End Date, Unit, Category, Key Visual (gallery), Created Date, Creator, Status, Actions
- Search: Fuzzy by program name; Advanced by registration code, status, category, unit, creator
- Filters: Status (dropdown multi-select), Date range, Creator, Department
- Sorting: By any column
- Status display: Visual badge with color coding
- Image gallery: Click to expand modal
- Actions:
  - View Detail (all roles with read permission)
  - Edit (role/status specific)
  - Clone (all roles)
  - History (all roles)
  - Export (all roles)

**Visibility Rules:**
- INPUTTER: Own registrations + direct supervisor's approvals
- INPUTTER_HO: All HO registrations
- APPROVER: Own department registrations
- APPROVER_HO: All HO registrations in review
- BRAND: All assigned registrations
- BRAND_MANAGER: All registrations
- ADMIN: All registrations

**Permissions:**
- Create: INPUTTER, INPUTTER_HO, BRAND
- Edit: Role/status specific (see workflow matrix)
- Delete: Soft delete (mark deleted_at) on any role
- Clone: All authenticated users

---

#### **G.3.2 Registration Detail Screen (Full Workflow View)**

**Purpose:** Manage registration through 8-step approval workflow

**Layout:** Multi-tab form with status-driven UI

**Tabs:**

1. **Tab 1: Registration Information**
   - Program Name: text (required, max 225)
   - Budget Estimate: number (required, max 10,000,000,000)
   - IO Number: text (optional, max 50)
   - Start Date: date picker (required, default: today)
   - End Date: date picker (required, >= start_date)
   - Submission Document: file upload (optional, email/PDF, max 20MB)
   - Unit: readonly, auto-filled from creator's department
   - Status: readonly, displays current workflow state
   - History: expandable operation history log

2. **Tab 2: Advertising Content**
   - **Mode Selection (radio):**
     - Create new content (default)
     - Use created content (links to existing)
   
   - **If Create New:**
     - Content Name: text (required, max 225)
     - Category: dropdown (required) – 13 categories
     - Key Visual: upload images (required, max 10, 5MB each)
     - Description: textarea (optional, max 225)
     - Content type: text (optional)
     - Department: readonly, auto-filled
     - Account: text (optional)
     - Title: text (optional)
     - User area: text (optional)
     - **On Save:** Persist to advertising_content table with auto-generated code
   
   - **If Use Existing:**
     - Content Selector: search/dropdown showing only "Còn hạn" (valid) content
     - Content preview: shows name, images, dates
   
   - **Inherited from Registration Tab:**
     - Start Date: inherited
     - End Date: inherited

3. **Tab 3: Registration Item Scope**
   - **Selection Flow:**
     - Channel: dropdown (required)
     - Category: checkbox (required, filters based on selected channel)
     - Position: checkbox (required, shows positions for channel)
     - Item: checkbox (shows items for selected position + category)
   
   - **Table Display (after selection):**
     - Columns: Item Code, Item Name, Width, Length, Volume, Category, Position, Content, Status, Actions
     - Status in Draft: show editable fields (width, length, description)
     - Status in Acceptance: show old image, new image, note per item
   
   - **Item Management:**
     - **Draft phase (INPUTTER):** Can add/remove items from pool
     - **Brand Intake phase (BRAND):** Can add items (marked "Treo"), remove items (revert to "Hoạt động")
     - **After Brand Manager Approval:** Items locked, no add/remove

4. **Tab 4: Brand Intake Proposals** (appears only in Brand Intake status)
   - Procurement category proposal: textarea (required, max 1000)
   - Other category proposal: textarea (required, placeholder "Không" if none, max 1000)
   - Other proposal: textarea (required, placeholder "Không" if none, max 1000)

5. **Tab 5: Acceptance Details** (appears only in Acceptance/Acceptance Review status)
   - For each item, display:
     - Item Code, Item Name
     - Status: radio (Hoạt động / Không hoạt động) – editable only by BRAND
     - Old Image: display uploaded image from registration
     - New Image: upload field (required if Active)
     - Note: textarea (required if Inactive)
     - Actions: BRAND_MANAGER can override all fields

**Footer (Status-Dependent):**

| Status | Actions Available |
|--------|------------------|
| Draft | Save, Submit (Trình duyệt), Cancel (Hủy) |
| Supervisor Review | (Read-only to creator; Approver sees Approve / Request Revision buttons) |
| Brand Intake | Save, Submit (Phê duyệt), Request Revision (Bổ sung), Cancel Request (Hủy yêu cầu) |
| Brand Manager Approval | (Read-only; BRAND_MANAGER sees Approve / Request Revision buttons) |
| Approved | Begin Acceptance (Nghiệm thu) – BRAND role only |
| Acceptance | Submit Acceptance, Request Revision – BRAND role only |
| Acceptance Review | (Read-only to BRAND; BRAND_MANAGER sees Approve / Request Revision buttons) |
| Completed | View only, Clone option available |

**Validation Rules on Submit:**

1. **Draft → Submit:**
   - All required fields filled
   - All items status != "Treo" or "Không hoạt động"
   - Error: "Bạn không thể trình duyệt vì có vật phẩm ở trạng thái không hợp lệ"

2. **Total Amount Validation:**
   - Calculate: Sum of (item.width * item.length * category.unit_price * quantity)
   - If Total > Budget: Show error popup
   - "Tổng số tiền [total] vượt quá ngân sách [budget]. Vui lòng điều chỉnh."

3. **Acceptance Submit:**
   - All active items have new images
   - All inactive items have notes
   - Error: "Vật phẩm [code]: Nếu không hoạt động, ghi chú là bắt buộc. Nếu hoạt động, ảnh mới là bắt buộc."

**Permissions & Roles:**
- See Section E for action-level matrix per status

---

### G.4 Supporting Screens

#### **G.4.1 Audit Trail / Operation History Screen**

**Purpose:** Immutable log of all entity changes

**Layout:** List (timeline or table)

**Table Columns:**
- Timestamp (dd/mm/yyyy hh:mm:ss)
- User (username + full name)
- Entity Type (Registration, Content, Item, Category, etc.)
- Entity ID (code)
- Action (Create, Update, Delete, Transition, Approve, Reject)
- Field Changed (if Update)
- Old Value
- New Value
- Notes

**Filters:**
- Date range
- Entity Type
- Action Type
- User

**Sorting:** By timestamp (descending default)

**Export:** CSV, Excel

**Permissions:** All authenticated users can view own entity histories; ADMIN/BRAND_MANAGER can view all

---

#### **G.4.2 Export Report Screen**

**Purpose:** Generate and download reports per entity type

**Layout:** Report builder with template selection

**Available Reports:**

1. **Advertising Content Report**
   - Columns: Code, Name, Category, Status, Start Date, End Date, Creator, Created Date
   - Filters: Category, Status, Date range, Creator
   - Format: Excel, CSV
   - File naming: `advertising_content_[YYYYMMDD_HHMMSS].xlsx`

2. **Physical Items Report**
   - Columns: Item Code, Item Name, Channel, Category, Position, Width, Length, Volume, Status, Created Date
   - Filters: Channel, Category, Position, Status
   - Format: Excel, CSV
   - File naming: `physical_items_[YYYYMMDD_HHMMSS].xlsx`

3. **Registrations Report**
   - Columns: Registration Code, Program Name, Budget Estimate, Status, Unit, Category, Created Date, Creator
   - Filters: Status, Date range, Creator, Category, Unit
   - Format: Excel, CSV, PDF (order document)
   - File naming: `registrations_[YYYYMMDD_HHMMSS].xlsx`

4. **Locations Report**
   - Columns: Position Code, Position Name, Channel, Province/City, Zone, Address, Status, Representative 1, Created Date
   - Filters: Channel, Province/City, Status
   - Format: Excel, CSV
   - File naming: `locations_[YYYYMMDD_HHMMSS].xlsx`

5. **Categories Report**
   - Columns: Code, Name, Format, Unit Price, Unit of Measure, Status, Created Date
   - Filters: Format, Status
   - Format: Excel, CSV
   - File naming: `categories_[YYYYMMDD_HHMMSS].xlsx`

**Permissions:** All authenticated users can export

---

## H. ENTITY MODEL / DATABASE SCHEMA

### H.1 Core Tables

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  password_hash VARCHAR(500) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  deleted_at TIMESTAMP,
  -- Approval chain
  manager_id UUID REFERENCES users(id), -- For supervisor review routing
  INDEX (role, status, department_id)
);
```

#### **departments**
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **channels**
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX (status, code)
);
```

#### **categories**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) UNIQUE NOT NULL,
  name VARCHAR(225) UNIQUE NOT NULL,
  format ENUM('Online', 'Offline') NOT NULL,
  description TEXT,
  unit_price DECIMAL(12, 2),
  unit_of_measure ENUM('cái', 'm2', 'm3', 'm', 'bộ', 'khác') NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX (status, format, code)
);
```

#### **locations** (Positions)
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code VARCHAR(3) NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id),
  position_name VARCHAR(255) NOT NULL,
  province_city VARCHAR(100) NOT NULL,
  zone ENUM('Nội thành', 'Ngoại thành', 'Vùng nông thôn', 'Khu vực khác') NOT NULL,
  address VARCHAR(255) NOT NULL,
  classification VARCHAR(50),
  longitude DECIMAL(10, 8),
  latitude DECIMAL(11, 8),
  representative_1_name VARCHAR(100),
  representative_1_email VARCHAR(255),
  representative_1_phone VARCHAR(10),
  representative_2_name VARCHAR(100),
  representative_2_email VARCHAR(255),
  representative_2_phone VARCHAR(10),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  note TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(position_code, channel_id),
  INDEX (channel_id, status)
);
```

#### **advertising_content**
```sql
CREATE TABLE advertising_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_code VARCHAR(20) UNIQUE NOT NULL,
  content_name VARCHAR(225) NOT NULL,
  category ENUM(...13 categories...) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Còn hạn', 'Hết hạn') GENERATED ALWAYS AS (
    CASE WHEN CURRENT_DATE > end_date THEN 'Hết hạn' ELSE 'Còn hạn' END
  ) STORED,
  department_id UUID NOT NULL REFERENCES departments(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX (status, category, created_by)
);
```

#### **content_images**
```sql
CREATE TABLE content_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES advertising_content(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  sequence INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (content_id)
);
```

#### **physical_items**
```sql
CREATE TABLE physical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  position_id UUID NOT NULL REFERENCES locations(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  width_m DECIMAL(5, 2) NOT NULL,
  length_m DECIMAL(5, 2) NOT NULL,
  volume_m3 DECIMAL(10, 4) GENERATED ALWAYS AS (width_m * length_m) STORED,
  description TEXT,
  image_url VARCHAR(500),
  content_id UUID REFERENCES advertising_content(id),
  status ENUM('ACTIVE', 'INACTIVE', 'TREO') DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX (position_id, category_id, channel_id, status)
);
```

#### **registrations**
```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_code VARCHAR(30) UNIQUE NOT NULL,
  program_name VARCHAR(225) NOT NULL,
  budget_estimate DECIMAL(15, 2) NOT NULL,
  io_number VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submission_document_url VARCHAR(500),
  department_id UUID NOT NULL REFERENCES departments(id),
  status ENUM('Bản nháp', 'CBQL Phê duyệt', 'P.Thương hiệu tiếp nhận', 
              'Trưởng phòng thương hiệu phê duyệt', 'Đã duyệt', 'Nghiệm thu',
              'Trưởng phòng nghiệm thu', 'Đã nghiệm thu', 'CBNV Điều Chỉnh', 'Cancelled') 
          NOT NULL DEFAULT 'Bản nháp',
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to_brand_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  -- Brand Intake fields
  procurement_category_proposal TEXT,
  other_category_proposal TEXT,
  other_proposal TEXT,
  -- Content & Items references
  content_id UUID REFERENCES advertising_content(id),
  INDEX (status, created_by, assigned_to_brand_user_id, department_id)
);
```

#### **registration_items**
```sql
CREATE TABLE registration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  physical_item_id UUID NOT NULL REFERENCES physical_items(id),
  -- Acceptance phase
  item_status ENUM('ACTIVE', 'INACTIVE', 'TREO') DEFAULT 'ACTIVE',
  new_image_url VARCHAR(500), -- Acceptance phase upload
  acceptance_note TEXT, -- Acceptance phase note
  -- Calculated
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL, -- Snapshot from category at time of approval
  total_amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (registration_id, physical_item_id)
);
```

#### **audit_trail** (Immutable log)
```sql
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'TRANSITION', 'APPROVE'
  entity_type VARCHAR(50) NOT NULL, -- 'Registration', 'Content', 'Item', 'Category', etc.
  entity_id VARCHAR(100) NOT NULL,
  entity_code VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  field_name VARCHAR(100),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  INDEX (entity_id, entity_type, action_type, timestamp, user_id)
);
```

### H.2 Entity Relationships Diagram

```
users
├── department_id → departments
├── manager_id → users (self-reference, approval chain)
├── created_by → [channels, categories, locations, content, items, registrations]

departments
├── parent_department_id → departments (self-reference)

channels
├── created_by → users

categories
├── created_by → users

locations (Positions)
├── channel_id → channels
├── created_by → users

advertising_content
├── department_id → departments
├── created_by → users
├── ← content_images (1:N)
├── ← registrations (1:N, optional)
├── ← physical_items (1:N, optional)

content_images
├── content_id → advertising_content

physical_items
├── position_id → locations
├── category_id → categories
├── channel_id → channels
├── content_id → advertising_content (optional)
├── created_by → users
├── ← registration_items (1:N)

registrations
├── department_id → departments
├── created_by → users
├── assigned_to_brand_user_id → users
├── content_id → advertising_content (optional)
├── ← registration_items (1:N)
├── ← registration_history (1:N)

registration_items
├── registration_id → registrations
├── physical_item_id → physical_items

audit_trail
├── user_id → users
```

---

## I. BUSINESS RULES AND VALIDATIONS

### I.1 Master Data Rules

#### **Channel Rules**
- R1.1: Channel code must be unique and 10 chars max
- R1.2: Cannot deactivate channel if active locations exist
- R1.3: Deactivating channel cascades to all child locations (set to inactive)
- R1.4: Only BRAND role can create/edit channels

#### **Category Rules**
- R2.1: Category code auto-generated, 2 chars, unique
- R2.2: Category name unique, 1–225 chars, cannot be all-space
- R2.3: Unit price change confirmation required
- R2.4: Price updates apply only to registrations not yet in "Trưởng phòng thương hiệu phê duyệt" or beyond
- R2.5: Cannot deactivate category if items in "Treo" status exist
- R2.6: Deactivating category cascades to all active items under that category (set to inactive)
- R2.7: Only BRAND role can create/edit categories

#### **Location Rules**
- R3.1: Position code unique per channel, 3 chars
- R3.2: Province/City, Zone, Address required
- R3.3: Longitude range: -180 to 180; Latitude range: -90 to 90
- R3.4: Representative phone must be 10 digits if provided
- R3.5: Representative email must be valid format if provided
- R3.6: Cannot deactivate location if items in "Treo" status exist
- R3.7: Deactivating location cascades to all active items (set to inactive)
- R3.8: Only BRAND role can create/edit locations

#### **Physical Item Rules**
- R4.1: Item code format: {PositionCode}.{CategoryCode}.{SequenceNo} (auto-generated)
- R4.2: Item name format: {CategoryName} {PositionName} {SequenceNo} (auto-generated)
- R4.3: Width/Length: max 99.99 m, 2 decimal places
- R4.4: Volume auto-calculated: width × length
- R4.5: Cannot edit item if status is "Treo"
- R4.6: Cannot create item in batch if another batch is in-progress (within same session)
- R4.7: Parent status propagation:
  - If category inactive OR position inactive → item inactive
  - If category active AND position active → item remains active (unless explicitly set)
- R4.8: Image upload max 5MB per item

#### **Advertising Content Rules**
- R5.1: Content code auto-generated, unique, 20 chars max
- R5.2: Content name 1–225 chars, cannot be all-space
- R5.3: Start Date default = today; End Date must be >= Start Date
- R5.4: Status computed: If current_date > end_date then "Hết hạn" else "Còn hạn"
- R5.5: Up to 10 images per content, max 5MB each, JPEG/PNG only
- R5.6: Department auto-filled from creator's department
- R5.7: Cannot edit content once used in "Bản nháp" registration (only creator can)
- R5.8: Clone operation creates new code, copies all data

### I.2 Registration Workflow Rules

#### **Draft Phase (Bản nháp)**
- RW1.1: All required fields mandatory
- RW1.2: Items must not be in "Treo" or "Không hoạt động" status before submit
- RW1.3: Content required (create new or link existing)
- RW1.4: Only creator and supervisors can view

#### **Supervisor Review Phase**
- RW2.1: Approver must be direct superior of creator (via manager_id chain)
- RW2.2: Can approve or request revision
- RW2.3: If revision requested → status = CBNV Điều Chỉnh (revision state)
- RW2.4: Cannot approve if items in "Treo" or "Không hoạt động"

#### **Brand Intake Phase (P.Thương hiệu tiếp nhận)**
- RW3.1: BRAND user assigned to handle
- RW3.2: BRAND can edit Content tab and Item Scope tab
- RW3.3: Newly added items marked "Treo" (suspended)
- RW3.4: Removed items revert to "Hoạt động"
- RW3.5: Required fields: Procurement category proposal, Other category proposal, Other proposal (or "Không")
- RW3.6: BRAND can approve or request revision
- RW3.7: BRAND can cancel entire request (sets status = Cancelled, immutable thereafter)

#### **Brand Manager Approval Phase (Trưởng phòng thương hiệu phê duyệt)**
- RW4.1: BRAND_MANAGER role only
- RW4.2: On approval: Unit Price and Total Amount locked (immutable)
- RW4.3: Items cannot be added/removed after this point
- RW4.4: Can request revision back to Brand Intake (P.Thương hiệu)

#### **Approved Phase (Đã duyệt)**
- RW5.1: BRAND user assigned can begin acceptance (Nghiệm thu)
- RW5.2: No further edits allowed

#### **Acceptance Phase (Nghiệm thu)**
- RW6.1: BRAND user assigned handles field verification
- RW6.2: Per item:
  - If status = "Hoạt động": New image upload required
  - If status = "Không hoạt động": Note required
- RW6.3: Cannot submit if validations fail
- RW6.4: Can request revision within this step

#### **Acceptance Review Phase (Trưởng phòng nghiệm thu)**
- RW7.1: BRAND_MANAGER role only
- RW7.2: Can override item status, image, description
- RW7.3: Can approve or request revision back to Acceptance phase

#### **Completed Phase (Đã nghiệm thu)**
- RW8.1: Immutable, read-only
- RW8.2: Clone allowed

#### **Revision Phase (CBNV Điều Chỉnh)**
- RW9.1: Entered when any approver requests changes
- RW9.2: Treated as Draft but with "revision required" flag
- RW9.3: After revision, must re-submit to same checkpoint
- RW9.4: Revision requests from different roles loop back to different steps:
  - Supervisor revision → Back to Supervisor Review
  - BRAND revision → Back to Brand Intake
  - BRAND_MANAGER revision → Back to Brand Intake (for BRAND to revise) or Acceptance (from acceptance review)

### I.3 Financial Rules

- R6.1: Total Amount = Σ(item.quantity × category.unit_price)
- R6.2: If Total Amount > Budget Estimate: Block submission, show error
- R6.3: Unit price snapshot taken at Brand Manager approval; locked thereafter
- R6.4: Retroactive price changes do NOT apply to approved registrations

### I.4 Soft Delete & Archival

- R7.1: All entity deletions are soft (mark deleted_at)
- R7.2: Soft-deleted records excluded from list views and reports by default
- R7.3: Audit trail preserved for soft-deleted records
- R7.4: No hard delete in MVP

### I.5 Access Control & Data Isolation

- R8.1: INPUTTER can only view own registrations + supervisor's reviews
- R8.2: APPROVER can view registrations from own department + reports
- R8.3: INPUTTER_HO can view all HO-scope registrations
- R8.4: BRAND can view all assigned registrations
- R8.5: BRAND_MANAGER can view all registrations enterprise-wide
- R8.6: Row-level security: Registrations filtered by department/assignment

---

## J. AUDIT TRAIL DESIGN

### J.1 Audit Capture Strategy

**Trigger Points:**
1. Entity creation (CREATE action)
2. Field update (UPDATE action)
3. Entity deletion soft-delete (DELETE action)
4. Workflow state transition (TRANSITION action)
5. Approval decisions (APPROVE, REJECT, REVISE actions)
6. File upload/deletion (ATTACHMENT action)

**Audit Record:**
```sql
INSERT INTO audit_trail (
  user_id, action_type, entity_type, entity_id, entity_code, 
  old_value, new_value, field_name, notes, timestamp, ip_address
) VALUES (...)
```

### J.2 Immutability Guarantee

- Audit trail is **append-only**
- No UPDATE or DELETE operations on audit_trail
- Database trigger enforces immutability
- Timestamp set at DB server (not client)

### J.3 Audit Access & Visibility

| Role | View Audit For |
|------|-----------------|
| INPUTTER | Own entities only |
| APPROVER | Department entities |
| BRAND | Assigned registrations |
| BRAND_MANAGER | All entities |
| ADMIN | All entities + user actions |

### J.4 Example Audit Records

**Example 1: Registration Creation**
```
user_id: [user-123]
action_type: CREATE
entity_type: Registration
entity_id: reg-uuid-456
entity_code: REG-20260525001
old_value: NULL
new_value: {full registration JSON}
field_name: NULL
notes: "Registration created in Draft status"
timestamp: 2026-05-25 10:30:45
```

**Example 2: Unit Price Update**
```
user_id: [brand-manager-id]
action_type: UPDATE
entity_type: Category
entity_id: cat-uuid-789
entity_code: CA
old_value: "1000000"
new_value: "1200000"
field_name: unit_price
notes: "Price update for category CA; applies to registrations before Brand Manager approval"
timestamp: 2026-05-25 14:15:22
```

**Example 3: Workflow Transition**
```
user_id: [approver-id]
action_type: TRANSITION
entity_type: Registration
entity_id: reg-uuid-456
entity_code: REG-20260525001
old_value: "Bản nháp"
new_value: "CBQL Phê duyệt"
field_name: status
notes: "Submitted for supervisor review"
timestamp: 2026-05-25 11:00:00
```

**Example 4: Approval Decision**
```
user_id: [brand-id]
action_type: APPROVE
entity_type: Registration
entity_id: reg-uuid-456
entity_code: REG-20260525001
old_value: "P.Thương hiệu tiếp nhận"
new_value: "Trưởng phòng thương hiệu phê duyệt"
field_name: status
notes: "Approved with procurement proposals; items locked, pricing frozen"
timestamp: 2026-05-25 15:45:30
```

---

## K. REPORTING & EXPORT DESIGN

### K.1 Report Templates

#### **Template 1: Advertising Content Report**
**Columns:**
- Content Code
- Content Name
- Category
- Status (Còn hạn / Hết hạn)
- Start Date
- End Date
- Department
- Creator
- Created Date
- Image Count

**Filters:**
- Date range (start_date / end_date)
- Category (dropdown multi-select)
- Status
- Department
- Creator (user selector)

**Sorting:** By any column

**Export Formats:** Excel (XLSX), CSV

**Filename:** `advertising_content_[YYYYMMDD_HHMMSS].xlsx`

---

#### **Template 2: Physical Items Report**
**Columns:**
- Item Code
- Item Name
- Channel
- Category
- Position Code
- Position Name
- Width (m)
- Length (m)
- Volume (m²)
- Status
- Content Code
- Content Status
- Created Date
- Created By

**Filters:**
- Channel
- Category (multi-select)
- Position
- Status
- Date range

**Sorting:** By Channel, Position, Category, Item Code

**Export Formats:** Excel, CSV

**Filename:** `physical_items_[YYYYMMDD_HHMMSS].xlsx`

---

#### **Template 3: Registrations Report**
**Columns:**
- Registration Code
- Program Name
- Budget Estimate
- Total Amount
- IO Number
- Status
- Department
- Category
- Start Date
- End Date
- Created Date
- Created By
- Item Count
- Approval Timeline

**Filters:**
- Status (multi-select)
- Date range (created_date / end_date)
- Department
- Category
- Creator

**Sorting:** By Registration Code, Status, Created Date

**Export Formats:** Excel, CSV, PDF (order document template)

**Filename:** `registrations_[YYYYMMDD_HHMMSS].xlsx` or `.pdf`

---

#### **Template 4: Registration Order Document (PDF)**
**Layout:**
```
[COMPANY HEADER]
ADVERTISING REGISTRATION ORDER FORM

Registration Code: REG-XXX
Program Name: [name]
Created By: [user name]
Date: [created_date]
Status: [current status]

--- BUDGET SUMMARY ---
Budget Estimate: [amount]
Total Items Amount: [calculated]
Status: OK / EXCEEDED

--- ITEMS TABLE ---
Item Code | Category | Position | Width | Length | Quantity | Unit Price | Total
[rows]

--- APPROVAL SIGNATURES ---
Supervisor: __________ Date: __________
Brand Manager: __________ Date: __________
```

**Permissions:** All roles can generate

---

#### **Template 5: Locations (Positions) Report**
**Columns:**
- Position Code
- Position Name
- Channel
- Province/City
- Zone
- Address
- Classification
- Representative 1 Name
- Representative 1 Phone
- Representative 1 Email
- Representative 2 Name
- Representative 2 Phone
- Representative 2 Email
- Status
- Note
- Created Date

**Filters:**
- Channel (multi-select)
- Province/City
- Zone
- Status
- Date range

**Sorting:** By Channel, Province/City, Position Code

**Export Formats:** Excel, CSV

**Filename:** `locations_[YYYYMMDD_HHMMSS].xlsx`

---

#### **Template 6: Categories Report**
**Columns:**
- Category Code
- Category Name
- Format (Online / Offline)
- Unit Price
- Unit of Measure
- Description
- Status
- Created Date
- Created By

**Filters:**
- Format
- Status
- Date range

**Sorting:** By Category Code, Category Name

**Export Formats:** Excel, CSV

**Filename:** `categories_[YYYYMMDD_HHMMSS].xlsx`

---

### K.2 Export Implementation Approach

**Backend Service (Export Generator):**
```typescript
class ExportService {
  generateContentReport(filters): ArrayBuffer {
    // Query data with filters
    // Transform to Excel/CSV format
    // Return file buffer
  }
  
  generateRegistrationPDF(registrationId): ArrayBuffer {
    // Fetch registration + items
    // Render PDF template
    // Return PDF buffer
  }
}
```

**Frontend:**
```typescript
downloadReport(reportType, filters) {
  const response = await api.post('/reports/export', {
    report_type: reportType,
    filters: filters
  });
  
  // Trigger download
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}_${timestamp}.xlsx`;
  link.click();
}
```

---

## L. SUGGESTED API DESIGN

### L.1 RESTful Endpoints

#### **Authentication**
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
```

#### **Channels**
```
GET /api/channels?status=ACTIVE
GET /api/channels/:id
POST /api/channels
PATCH /api/channels/:id
DELETE /api/channels/:id (soft delete)
GET /api/channels/:id/history
```

#### **Categories**
```
GET /api/categories?status=ACTIVE&format=Online
GET /api/categories/:id
POST /api/categories
PATCH /api/categories/:id
DELETE /api/categories/:id
GET /api/categories/:id/history
```

#### **Locations**
```
GET /api/locations?channel_id=xxx&status=ACTIVE
GET /api/locations/:id
POST /api/locations
PATCH /api/locations/:id
DELETE /api/locations/:id
GET /api/locations/:id/history
GET /api/locations/export (export report)
```

#### **Physical Items**
```
GET /api/items?channel_id=xxx&category_id=yyy&status=ACTIVE
GET /api/items/:id
POST /api/items/batch-create (bulk create)
PATCH /api/items/:id
DELETE /api/items/:id
GET /api/items/:id/history
GET /api/items/export
```

#### **Advertising Content**
```
GET /api/content?status=Còn hạn
GET /api/content/:id
POST /api/content
PATCH /api/content/:id
DELETE /api/content/:id
GET /api/content/:id/images
POST /api/content/:id/images (upload)
DELETE /api/content/:id/images/:image_id
POST /api/content/:id/clone
GET /api/content/:id/history
GET /api/content/export
```

#### **Registrations (Workflow)**
```
GET /api/registrations?status=Bản%20nháp
GET /api/registrations/:id
POST /api/registrations
PATCH /api/registrations/:id (update specific status fields)
DELETE /api/registrations/:id (soft delete)

-- Workflow Actions
POST /api/registrations/:id/submit (Draft → Supervisor Review)
POST /api/registrations/:id/approve (Approver action)
POST /api/registrations/:id/request-revision (CBQL/BRAND/BRAND_MGR action)
POST /api/registrations/:id/brand-intake (BRAND acceptance action)
POST /api/registrations/:id/brand-manager-approve (BRAND_MANAGER action)
POST /api/registrations/:id/begin-acceptance (BRAND: Approved → Acceptance)
POST /api/registrations/:id/submit-acceptance (BRAND: Acceptance → Review)
POST /api/registrations/:id/approve-acceptance (BRAND_MANAGER: Complete)

-- Item Management within Registration
GET /api/registrations/:id/items
POST /api/registrations/:id/items
PATCH /api/registrations/:id/items/:item_id
DELETE /api/registrations/:id/items/:item_id

-- Image Upload during Acceptance
POST /api/registrations/:id/items/:item_id/upload-acceptance-image

-- History & Export
GET /api/registrations/:id/history
POST /api/registrations/:id/clone
GET /api/registrations/export
POST /api/registrations/:id/export-pdf (order document)
```

#### **Audit Trail**
```
GET /api/audit?entity_type=Registration&entity_id=xxx
GET /api/audit?user_id=xxx&action_type=CREATE
GET /api/audit/export
```

#### **Reports & Export**
```
POST /api/reports/advertising-content
POST /api/reports/physical-items
POST /api/reports/registrations
POST /api/reports/locations
POST /api/reports/categories
```

### L.2 API Request/Response Examples

#### **Example 1: Create Registration**
```http
POST /api/registrations
Content-Type: application/json
Authorization: Bearer [token]

{
  "program_name": "Summer Campaign 2026",
  "budget_estimate": 50000000,
  "io_number": "IO-2026-0541",
  "start_date": "2026-06-01",
  "end_date": "2026-08-31",
  "content_mode": "new",
  "content_data": {
    "content_name": "Summer Visual",
    "category": "RB - CTKM",
    "key_visual_images": [...],
    "description": "...",
    "content_type": "Digital",
    "department": "Marketing",
    "account": "Retail",
    "title": "Summer Promo",
    "user_area": "Store Display"
  },
  "items": [
    {
      "physical_item_id": "item-uuid-123",
      "quantity": 1
    }
  ]
}

Response: 201 Created
{
  "id": "reg-uuid-456",
  "registration_code": "REG-20260525001",
  "status": "Bản nháp",
  "created_at": "2026-05-25T10:30:45Z"
}
```

#### **Example 2: Submit Registration for Approval**
```http
POST /api/registrations/reg-uuid-456/submit
Content-Type: application/json
Authorization: Bearer [token]

{
  "notes": "Submitting for supervisor review"
}

Response: 200 OK
{
  "id": "reg-uuid-456",
  "status": "CBQL Phê duyệt",
  "updated_at": "2026-05-25T11:00:00Z",
  "next_assignee": {
    "user_id": "supervisor-uuid",
    "name": "Nguyễn Văn A"
  }
}
```

#### **Example 3: BRAND Approve & Lock Pricing**
```http
POST /api/registrations/reg-uuid-456/brand-manager-approve
Content-Type: application/json
Authorization: Bearer [token]

{}

Response: 200 OK
{
  "id": "reg-uuid-456",
  "status": "Trưởng phòng thương hiệu phê duyệt",
  "items": [
    {
      "item_code": "POS001.CA.1",
      "unit_price": 1000000,
      "unit_price_locked": true
    }
  ],
  "updated_at": "2026-05-25T15:45:30Z"
}
```

#### **Example 4: Upload Acceptance Image**
```http
POST /api/registrations/reg-uuid-456/items/item-uuid-789/upload-acceptance-image
Content-Type: multipart/form-data
Authorization: Bearer [token]

image_file: [binary image data, max 5MB]

Response: 200 OK
{
  "item_id": "item-uuid-789",
  "new_image_url": "/storage/items/item-uuid-789/acceptance-20260525-143022.jpg",
  "uploaded_at": "2026-05-25T14:30:22Z"
}
```

---

## M. RECOMMENDED MVP SCOPE

### M.1 MVP Boundaries

**Included in MVP:**
- ✅ User authentication & role-based access
- ✅ Master data CRUD: Channels, Categories, Locations, Physical Items
- ✅ Advertising Content management with image gallery
- ✅ Registration creation & 8-step workflow
- ✅ Approval routing (supervisor, BRAND, BRAND_MANAGER)
- ✅ Soft delete & audit trail (immutable log)
- ✅ Basic export to Excel/CSV
- ✅ Workflow history per registration
- ✅ Email notifications (basic in-app alerts)

**Excluded from MVP (Phase 2+):**
- ❌ Bulk operations / batch import
- ❌ Advanced search with full-text indexing
- ❌ Image OCR / AI-based validation
- ❌ Duplicate content detection
- ❌ Mobile app
- ❌ Real-time collaboration (multi-user concurrent editing)
- ❌ Notification system (email, SMS)
- ❌ Workflow designer UI (hardcoded workflow only)
- ❌ Dashboard/analytics
- ❌ Advanced reporting (charts, pivot tables)
- ❌ Integration with external systems (ERP, CRM)

### M.2 MVP Feature Priority

| Priority | Feature | Effort | Business Value |
|----------|---------|--------|-----------------|
| P0 | User authentication & authorization | 2 sprint | Required for security |
| P0 | Registration workflow (8 steps) | 4 sprints | Core business process |
| P1 | Master data CRUD (locations, categories, items) | 3 sprints | Foundation for registrations |
| P1 | Content management | 2 sprints | Reusable content library |
| P1 | Audit trail | 1 sprint | Compliance & accountability |
| P2 | Basic export (Excel) | 1 sprint | Reporting capability |
| P2 | Workflow history | 1 sprint | Transparency & debugging |
| P3 | Advanced search filters | 1 sprint | UX improvement |
| P3 | Image gallery | 0.5 sprint | UX enhancement |

**MVP Delivery Timeline:** 12–14 sprints (3–4 months)

### M.3 MVP Success Criteria

1. ✅ All 8-step workflow states functional with role-based actions
2. ✅ Master data fully CRUD-able
3. ✅ Registrations can be created, submitted, approved, and completed
4. ✅ Audit trail captures all changes
5. ✅ Users can export registrations to Excel
6. ✅ 95% of business validations enforced
7. ✅ <2 second page load time (90th percentile)
8. ✅ Zero audit trail data loss

---

## N. PHASE 2 AI ENHANCEMENT ROADMAP

### N.1 AI Opportunities Identified

#### **Phase 2a: Image Recognition & Validation** (3–4 sprints)

**Capability:** AI-powered image verification during acceptance

**Workflow Integration:**
- When BRAND uploads acceptance image:
  - AI model checks if image contains advertising material
  - Detects if position/item matches uploaded image
  - Flags low-quality images (blur, incomplete framing)
  - Auto-extracts deployment photos for comparison

**Business Benefit:**
- Prevent incorrect/fraudulent deployment evidence
- Reduce manual QA effort by 40%
- Flag suspicious submisssions for BRAND_MANAGER review

**Implementation:**
- Computer Vision API (Google Vision, AWS Rekognition)
- Pre-trained model for advertising/signage detection
- Confidence score threshold (e.g., 85%)
- Manual override allowed for edge cases

---

#### **Phase 2b: Content Classification Auto-Suggest** (2 sprints)

**Capability:** Auto-suggest category based on content metadata

**Workflow Integration:**
- When creating content, user uploads key visual
- AI analyzes image and suggests category + format
- User accepts, rejects, or modifies suggestion

**Business Benefit:**
- Faster content creation
- Consistent categorization
- Reduced classification errors

**Implementation:**
- Image classification model (trained on historical categorization)
- NLP for description-based classification
- Integration at content creation screen

---

#### **Phase 2c: Duplicate Content Detection** (2 sprints)

**Capability:** Identify similar/duplicate content across repository

**Workflow Integration:**
- On content creation: Check for near-duplicates
- On clone: Suggest similar content as template
- On registration: Warn if items/content already registered

**Business Benefit:**
- Prevent content duplication
- Suggest cost savings by reusing existing assets
- Improve data quality

**Implementation:**
- Image similarity hashing (perceptual hash, Siamese network)
- Fuzzy text matching for content names
- Scheduled batch deduplication job

---

#### **Phase 2d: Smart Deployment Validation** (3 sprints)

**Capability:** Compare old vs. new deployment images for compliance

**Workflow Integration:**
- During acceptance (Nghiệm thu):
  - AI compares old image (from item creation) vs. new image (acceptance upload)
  - Detects if item is still at same position
  - Flags if item appears damaged/modified
  - Auto-checks if deployment matches specification (dimensions, placement)

**Business Benefit:**
- Automated compliance verification
- Reduce manual acceptance review time by 50%
- Prevent non-compliant deployments
- Generate compliance report automatically

**Implementation:**
- Object detection (YOLO, Faster R-CNN) for item localization
- Image registration/alignment algorithms
- Damage detection model (trained on historical images)
- Deployment specification checker

---

#### **Phase 2e: Workflow Intelligence & Predictive Routing** (2–3 sprints)

**Capability:** Intelligent approval routing based on historical patterns

**Workflow Integration:**
- Recommend approver based on item category, budget, department
- Predict likely approval time (SLA automation)
- Suggest revisions before approval (preemptive feedback)
- Detect workflow bottlenecks

**Business Benefit:**
- Faster approvals (optimized routing)
- Reduced rework cycles
- Predictable SLA compliance

**Implementation:**
- Decision tree / random forest on historical approval data
- Time-series prediction for SLA forecasting
- Anomaly detection for bottleneck identification

---

#### **Phase 2f: Automated OCR for Documents** (1 sprint)

**Capability:** Extract data from submission documents (PO, invoice, etc.)

**Workflow Integration:**
- On document upload:
  - OCR extracts text, tables, dates, amounts
  - Auto-fill registration fields (budget, IO number, dates)
  - Flag inconsistencies

**Business Benefit:**
- Faster registration creation (auto-fill)
- Reduced data entry errors
- Audit trail of extracted data

**Implementation:**
- Tesseract OCR + AWS Textract
- Document classification (invoice, PO, specification, etc.)
- Table extraction & structuring

---

### N.2 Phase 2 AI Architecture

**Frontend:**
- Image upload with preview
- AI confidence score display
- Manual override UI
- Comparison view (old vs. new image)

**Backend Services:**
- AI Request Queue (async)
- Model Serving (inference API)
- Result Caching
- Fallback to manual review if AI fails

**External APIs:**
- Google Vision / AWS Rekognition (image analysis)
- Custom ML model deployment (Kubernetes + TensorFlow Serving)
- Document OCR service

**Data Pipeline:**
- Log AI predictions for retraining
- Feedback loop: User overrides improve model accuracy
- A/B testing framework for model versions

---

### N.3 MVP → Phase 2 Transition Strategy

**Gate Criteria for Phase 2:**
- ✅ MVP running in production with >100 registrations
- ✅ Sufficient image data collected (>500 images)
- ✅ Stakeholder agreement on AI use cases
- ✅ ROI analysis shows positive business case
- ✅ Data quality audit passed

**Technical Debt Before Phase 2:**
- Refactor image storage (add metadata indexing)
- Implement image versioning (old vs. new tracking)
- Create ML feature store (structured data for models)
- Add inference API framework

---

## O. RISKS / EDGE CASES / TECHNICAL CONCERNS

### O.1 Critical Risks

#### **Risk 1: Workflow State Machine Complexity**
**Issue:** 8-step workflow with revision loops is complex; easy to introduce bugs
**Mitigation:**
- State machine implemented as pure function (deterministic)
- Unit tests for every transition rule
- Comprehensive test coverage for edge cases (60%+ coverage minimum)
- Visual state machine diagram in code comments

#### **Risk 2: Approval Chain Routing**
**Issue:** "Direct superior" approval routing unclear; could cause approvals to get stuck
**Mitigation:**
- Explicit manager_id field in users table
- Validation on user creation that manager_id forms DAG (no cycles)
- Routing test suite with sample org hierarchies
- Admin override capability for stuck registrations

#### **Risk 3: Price Lock Timing**
**Issue:** Unit price locked after Brand Manager approval could cause disputes if prices changed between submissions
**Mitigation:**
- Snapshot unit_price in registration_items table at lock time
- Audit trail logs price change + snapshot timestamp
- Customer communication: Clear SLA on when pricing locks

#### **Risk 4: Image Upload & Storage**
**Issue:** Max 5MB/image * 10 images/content * 1000s of registrations = massive storage
**Mitigation:**
- Cloud storage (S3) with tiered storage (hot/cold)
- Image compression on upload (JPEG quality 75%)
- Versioning: Keep only latest + 1 backup per image
- Soft delete doesn't free storage immediately (archive policy)

#### **Risk 5: Concurrent Edit Conflicts**
**Issue:** Two users editing same registration simultaneously could cause data loss
**Mitigation:**
- Optimistic concurrency with version numbers
- Last-write-wins with notification to other editors
- Lock mechanism for acceptance phase (only one user at a time)
- Audit trail records conflicting edits

#### **Risk 6: Audit Trail Performance**
**Issue:** Audit trail append-only; 1000 registrations × 20 changes each = 20K audit rows; query performance degrades
**Mitigation:**
- Audit table indexed on (entity_id, entity_type, timestamp, action_type)
- Pagination for audit history views
- Archive old audit records (>1 year) to separate table
- Database query optimization required

### O.2 Edge Cases

#### **Edge Case 1: Category Deactivation While Items in-Progress**
**Scenario:** BRAND deactivates category; 3 items under that category marked "Treo" (in acceptance)
**Handling:**
- Block deactivation, show error: "3 items in-progress"
- After acceptance completes, items revert to "Hoạt động" or "Không hoạt động"
- Then category deactivation allowed

#### **Edge Case 2: Supervisor Changed Mid-Workflow**
**Scenario:** INPUTTER's manager changes; registration in Supervisor Review step
**Handling:**
- New manager can see registration (based on department)
- Old approver notification sent
- Option to reassign to new manager or keep with old approver
- Audit logged for compliance

#### **Edge Case 3: User Deleted While Registration In-Progress**
**Scenario:** BRAND user assigned to registration is deleted
**Handling:**
- User marked inactive, not hard-deleted
- Registrations reassigned to manager or flagged for admin
- Audit trail preserved
- Registration continues (brand manager can handle directly)

#### **Edge Case 4: Position Coordinates Invalid**
**Scenario:** User enters latitude 95 (invalid, must be ≤90)
**Handling:**
- Frontend validation prevents submit
- Backend validation as safety net
- Error message: "Latitude must be between -90 and 90"

#### **Edge Case 5: Item Without Content**
**Scenario:** Registration submitted with items that have no linked content
**Handling:**
- **Option A (MVP):** Content optional at item level; allow submission
- **Option B (Future):** Require content link; show error
- **Decision:** Go with Option A for MVP flexibility

#### **Edge Case 6: Acceptance Submission Without All Images**
**Scenario:** BRAND tries to submit acceptance with only 3/5 active items having new images
**Handling:**
- Validation error: "Missing new images for items [codes]"
- Block submission until all images uploaded
- Toast message with list of missing items

### O.3 Technical Concerns

#### **Concern 1: Database Design Scalability**
- Expected data volume: 10K registrations/year × 5K active items = 50K+ items
- Query patterns: Filter by channel, category, status, date range
- **Mitigation:** Proper indexing, partition by channel, archive old data

#### **Concern 2: File Storage Management**
- 5MB × 10 images × 10K registrations = 500GB+ storage
- Need S3 + lifecycle policies
- **Mitigation:** Compression, tiering, archival policy

#### **Concern 3: Real-Time Notifications**
- MVP doesn't include email/Slack; only in-app status
- Phase 2 adds notifications
- **Concern:** Email delivery failures could miss approvals
- **Mitigation:** Retry queue, audit trail as source of truth

#### **Concern 4: Password Security**
- SHA256 hashing is weak (should use bcrypt/Argon2)
- **Mitigation:** Upgrade to bcrypt in Phase 1 post-MVP
- Current implementation: SHA256 (MVP expedience); migrate on schema upgrade

#### **Concern 5: API Rate Limiting**
- No rate limiting specified; could allow DOS attacks
- **Mitigation:** Add rate limiting (100 req/min per user), CORS, API key management in Phase 1

#### **Concern 6: Search Performance**
- Fuzzy search on 100K+ records slow without full-text index
- **Mitigation:** PostgreSQL full-text search or Elasticsearch Phase 2

---

## P. IMPLEMENTATION ROADMAP (DETAILED)

### P.1 Sprint Breakdown (14 sprints, 4 months)

**Sprint 1–2: Foundation & Auth (2 weeks)**
- User authentication (login/logout, JWT tokens)
- Role & permission model enforcement
- Basic API scaffolding
- Database schema creation
- Deliverable: Working login, role-based route protection

**Sprint 3–4: Master Data Layer (2 weeks)**
- Channel CRUD
- Category CRUD
- Location CRUD
- Physical Item CRUD
- Soft delete mechanism
- Deliverable: All master data screens functional

**Sprint 5–6: Content Management (2 weeks)**
- Advertising Content CRUD
- Image upload/gallery
- Content search & filtering
- Content cloning
- Deliverable: Full content management

**Sprint 7–10: Registration Workflow (4 weeks)**
- Registration creation (all tabs)
- Status transitions (8 steps)
- Role-based action enforcement
- Approval routing
- Item management within registration
- Deliverable: End-to-end workflow functional

**Sprint 11: Audit Trail & History (1 week)**
- Audit table implementation
- Immutable logging
- History view per entity
- Deliverable: Audit trail fully functional

**Sprint 12: Export & Reporting (1 week)**
- Excel export templates
- CSV export
- Report generation service
- Deliverable: All 6 report types working

**Sprint 13–14: Polish & Testing (2 weeks)**
- Performance optimization
- Load testing (10K+ registrations)
- UI/UX refinement
- Documentation
- Deliverable: Production-ready MVP

---

## Q. CONCLUSION

This specification document covers:

1. **Product Context** – Clear business mission and stakeholder alignment
2. **Requirements Normalization** – Consolidated 11 modules into coherent domains
3. **Ambiguity & Risk Resolution** – Flagged open questions with recommendations
4. **Functional Design** – Complete screen specifications with wireframes reference
5. **Data Model** – Normalized schema with relationships & constraints
6. **Workflow Design** – 8-step state machine with role-based actions
7. **Compliance & Audit** – Immutable audit trail design
8. **AI Roadmap** – Phase 2 enhancements for automation & validation
9. **MVP Scope** – Clear boundaries for initial delivery
10. **Risk Mitigation** – Known risks with concrete mitigation strategies

**Next Steps:**
1. Stakeholder review & sign-off on this specification
2. UI mockups for 6 core screens (design phase)
3. API contract finalization (spec phase)
4. Backend development begins (Sprint 1)
5. Frontend development begins (Sprint 3, after core API ready)

---

**Document End**

