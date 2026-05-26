# Product Specification
## Centralized AI-Integrated Management System for Physical Advertising Assets in Multi-Branch Retail Enterprises

**Version:** 1.0  
**Date:** May 24, 2026  
**Status:** DRAFT - Implementation Ready  
**Audience:** Development Team, Product Managers, Business Stakeholders

---

## TABLE OF CONTENTS

1. [A. Product Overview](#a-product-overview)
2. [B. Requirement Normalization Summary](#b-requirement-normalization-summary)
3. [C. Open Questions / Ambiguities / Conflicts](#c-open-questions--ambiguities--conflicts)
4. [D. Functional Module Breakdown](#d-functional-module-breakdown)
5. [E. User Roles and Permissions Matrix](#e-user-roles-and-permissions-matrix)
6. [F. End-to-End Workflow and Status Transition Table](#f-end-to-end-workflow-and-status-transition-table)
7. [G. Screen List and Screen-Level Functional Specs](#g-screen-list-and-screen-level-functional-specs)
8. [H. Entity Model / Database Schema](#h-entity-model--database-schema)
9. [I. Business Rules and Validations](#i-business-rules-and-validations)
10. [J. Audit Trail Design](#j-audit-trail-design)
11. [K. Reporting / Export Design](#k-reporting--export-design)
12. [L. Suggested API Design](#l-suggested-api-design)
13. [M. Recommended MVP Scope](#m-recommended-mvp-scope)
14. [N. Phase 2 AI Enhancement Roadmap](#n-phase-2-ai-enhancement-roadmap)
15. [O. Risks / Edge Cases / Technical Concerns](#o-risks--edge-cases--technical-concerns)

---

## A. PRODUCT OVERVIEW

### 1.1 System Purpose

The **Centralized AI-Integrated Management System for Physical Advertising Assets** is an enterprise-grade platform designed to manage the complete lifecycle of advertising operations across multiple retail branches. The system enables centralized control of:

- Advertising content master data (images, metadata, validity periods)
- Advertising registration/request workflows from creation through approval and deployment
- Location and channel management (physical positions where ads are deployed)
- Physical advertising items (specific ad placements with dimensions, images, status)
- Multi-step approval workflows with role-based authorization
- Deployment acceptance and validation processes
- Comprehensive audit trails and reporting
- Future AI-driven automation for image recognition, validation, and quality assurance

### 1.2 Business Context

**Stakeholders:**
- **Head Office (HO):** Central admin users, policy enforcers, final approvers
- **Branch / Department Users:** Requester/inputter role
- **Brand Team:** Content and campaign managers
- **Supervisors:** Approval gatekeepers
- **Operations Teams:** Deployment and acceptance specialists

**Key Business Processes:**
1. Content creators submit advertising content with images and validity periods
2. Requesters initiate advertising registration campaigns (e.g., promotional campaigns)
3. Registrations flow through multi-level approvals (supervisor → brand → manager)
4. Brand operations teams mark items for deployment and validate with photos
5. System tracks all changes and maintains audit trail
6. Reports and exports support operational visibility and compliance

### 1.3 Success Criteria

- **Transparency:** All workflow steps and status changes are visible and auditable
- **Compliance:** Business rules prevent invalid state transitions
- **Efficiency:** Inline editing, bulk operations, and clear next-action indicators
- **Scalability:** Support 50+ branches and 10,000+ physical items
- **Data Integrity:** Real-time validation, audit trail, no orphaned data
- **User Experience:** Intuitive UI matching provided design mockups

---

## B. REQUIREMENT NORMALIZATION SUMMARY

### 2.1 Key Normalizations Performed

#### 2.1.1 Channel vs. Category vs. Location Hierarchy
**Raw Requirements Conflict:**
- Requirements mention both "Channel" and "Category" but their relationship was unclear
- "Channel" appeared in item scoping, category management, and location assignment
- "Category" appeared as both a dimension and as item classification

**Resolution:**
- **Channel** = Parent organizing dimension (e.g., "Indoor", "Outdoor", "Digital Display")
  - Channels are used for initial filtering and aggregation
  - Channels have no pricing
  - Channels organize Locations and Physical Items hierarchically
  
- **Category** = Advertising format/type (e.g., "LED Screen", "Light Box", "Banner")
  - Categories have unit price and unit of measure
  - Categories are used for costing and item type classification
  - Categories organize Physical Items
  
- **Location** = Physical position where an item can be deployed
  - Location = Channel + Position Code + Province/City + Address
  - Each Location can have multiple Physical Items
  - Location has contact representatives and GPS coordinates

- **Physical Item** = Specific ad placement
  - Item Code = PositionCode + CategoryCode + SequenceNo
  - Item belongs to 1 Channel, 1 Category, 1 Location
  - Item has dimensions, images, and status
  - Item status depends on parent Category and Location status

#### 2.1.2 Advertising Content vs. Registration Content
**Raw Requirements Had:**
- Advertising Content (master table)
- Content fields within Registration (nested)

**Resolution:**
- **Advertising Content Master Table:**
  - System-wide repository of reusable content
  - Has validity periods (Start Date, End Date)
  - Status calculated automatically (Còn hạn / Hết hạn)
  - Can be cloned, edited, and searched
  - Created once, reused across multiple registrations

- **Registration Content Section:**
  - Either references existing content (if not expired)
  - Or creates new content inline (which is also saved to master table)
  - Start/End dates inherited from Registration Information tab
  - When editing registration, content can be swapped or updated

#### 2.1.3 Item Status vs. Workflow Status
**Raw Requirements Had:**
- Workflow status: Bản nháp → CBQL Phê duyệt → ... → Đã nghiệm thu
- Item status: Hoạt động / Không hoạt động / Treo

**Resolution:**
- **Workflow Status** = Registration form status (state machine)
- **Item Status** = Individual physical item operational status
  - Hoạt động = Active, can be selected for registration
  - Không hoạt động = Inactive, cannot be selected
  - Treo = On hold, typically during deployment (cannot be used or edited)
  
- **Parent Propagation Rules:**
  - If Category becomes "Không hoạt động" → all items in that category become inactive
  - If Location becomes "Không hoạt động" → all items at that location become inactive
  - Items can only be "Hoạt động" if ALL parents are active

#### 2.1.4 Approval vs. Acceptance Phases
**Raw Requirements:**
- Steps 1-5 = Approval phase (supervisory/brand/manager decisions)
- Steps 6-8 = Acceptance phase (deployment validation with photos)

**Resolution:**
- **Approval Phase (Steps 1-5):**
  - Focus on form completeness and budget alignment
  - Item lists can be modified (add/remove items)
  - Multiple rounds of revision possible
  - Ends when BRAND_MANAGER approves (prices locked)

- **Acceptance Phase (Steps 6-8):**
  - Focus on deployment validation
  - Item lists are LOCKED (cannot add/remove)
  - Each item must have: new deployment photo (if active) or note (if inactive)
  - Deployment images replace original item images
  - Ends when final acceptance is complete

---

## C. OPEN QUESTIONS / AMBIGUITIES / CONFLICTS

### 3.1 CRITICAL - Workflow Bypass for BRAND Requesters

**Issue:** Requirement states:
> "If the registration creator has role BRAND, after submitting from draft the workflow directly skips step 3"

But Step 3 **is already the BRAND step** (P.Thương hiệu tiếp nhận = Brand Acceptance).

**Interpretation A (Likely):**
- BRAND requesters skip the supervisor review (Step 2: CBQL Phê duyệt)
- They go directly from Draft → Brand Acceptance (Step 3)
- Rationale: BRAND is high-trust role, no supervision needed

**Interpretation B (Alternative):**
- BRAND requesters skip to final manager approval (Step 4)
- They never enter the Brand Acceptance step
- Rationale: BRAND role is so senior they only need manager final check

**RECOMMENDATION:** Implement Interpretation A (more conservative, maintains visibility)
**ACTION ITEM:** Confirm with stakeholders which interpretation is intended

---

### 3.2 OPEN - Category Unit Price Update Impact Scope

**Issue:** Requirement states unit price update should apply to:
> "registration forms not yet past 'Trưởng phòng thương hiệu phê duyệt'"

**Ambiguity:** Does this mean:
- Only registrations **currently at or before** this step?
- Or registrations that have **never passed** this step (including rejected ones)?
- What about registrations in "Chỉnh Sửa" (revision) state?

**RECOMMENDATION:** Interpret as "registration where status is still in approval phase (Steps 1-4)"
**CLARIFICATION NEEDED:** How do revised registrations impact pricing?

---

### 3.3 OPEN - Position Status Change with Hanging Items

**Issue:** Requirement:
> "Cannot change position to inactive if items are 'Treo' or in-progress"

**Ambiguity:** Does "Treo" mean:
- Only items explicitly marked "Treo"?
- Or any item in a registration currently being processed?

**RECOMMENDATION:** Interpret as only items explicitly marked `status = "Treo"`
**ACTION ITEM:** Define when items transition to/from "Treo" state

---

### 3.4 OPEN - Content "Hết hạn" (Expired) Status Update

**Issue:** Once a content's end date passes, can it ever revert to "Còn hạn"?

**Current Behavior:** End date is editable, so yes, it can revert

**Question:** Should expired content be shown in registration content selection?
- Current spec: "popup must show only non-expired content"
- But what if user edits end date after registration was created?

**RECOMMENDATION:** 
- Expired content shows in read-only mode in existing registrations
- Cannot be added to new registrations while expired
- Can be un-expired by editing end date, then re-added

---

### 3.5 OPEN - Image Gallery Behavior and Limits

**Issue:** Requirements mention:
- Content: up to 10 images, max 5MB each
- Submission Document: max 20MB
- Item: 1 image (during acceptance: old + new image)

**Question:** 
- Are these hard limits or guideline?
- Should we compress/resize on upload?
- What happens if user uploads > limit?

**RECOMMENDATION:** 
- Enforce hard limits with client + server validation
- Return clear error messages
- Consider client-side image resizing option

---

### 3.6 OPEN - Item Status During Acceptance Phase

**Issue:** During acceptance step, items can change from Active → Inactive

**Question:** Can an item change back from Inactive → Active?
**RECOMMENDATION:** No - acceptance is one-way. Once marked inactive in acceptance, it stays inactive.

---

### 3.7 OPEN - Note Field Visibility and Scope

**Issue:** Requirements state notes entered during "Nghiệm thu" are "displayed only within registration form"

**Question:** 
- Does this mean notes are registration-specific, not item-specific?
- Can notes be seen by subsequent steps (manager review)?
- Are notes editable or append-only?

**RECOMMENDATION:** 
- Notes are item-specific within the registration context
- Read-only in downstream steps
- Append-only (cannot edit previous notes)

---

## D. FUNCTIONAL MODULE BREAKDOWN

### 4.1 Module Dependencies and Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    USER & PERMISSIONS                   │
│  (Auth, Roles, Access Control, Approval Chain)          │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
    ┌─────────┐    ┌──────────┐      ┌─────────────┐
    │ CONTENT │    │ LOCATION │      │  CHANNEL &  │
    │ MASTER  │    │ MASTER   │      │  CATEGORY   │
    └─────────┘    └──────────┘      │   MASTER    │
        ↓                 ↓            └─────────────┘
        │                 │                    ↓
        └─────────────────┼────────────────────┘
                          ↓
           ┌──────────────────────────┐
           │  PHYSICAL ITEM MASTER    │
           │  (Inventory of ads)      │
           └──────────────────────────┘
                          ↑
                          │
           ┌──────────────────────────┐
           │ REGISTRATION WORKFLOW    │
           │ (Campaign Requests)      │
           └──────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
  ┌──────────┐      ┌──────────┐    ┌─────────────┐
  │ APPROVAL │      │ACCEPTANCE│    │AUDIT TRAIL  │
  │  STATE   │      │  STATE   │    │  & HISTORY  │
  └──────────┘      └──────────┘    └─────────────┘
        │                 │
        └─────────────────┼────────────────┐
                          ↓                ↓
                    ┌──────────┐    ┌────────────┐
                    │REPORTING │    │ EXPORT API │
                    └──────────┘    └────────────┘
```

### 4.2 Module Responsibilities

#### Module 1: User & Authentication
- **Owner:** Platform (auth service)
- **Responsibility:** User login, role assignment, permission checking
- **Key Entities:** Users, Roles, Permissions
- **Interfaces:** Login API, Auth middleware, Permission guards
- **Key Rules:** 
  - Users have exactly 1 role
  - Roles define available actions and accessible screens
  - Superior/subordinate relationships for approval chains

#### Module 2: Advertising Content Master
- **Owner:** Brand team
- **Responsibility:** Create, edit, clone, and manage reusable advertising content
- **Key Entities:** AdvertisingContent, ContentImage
- **Interfaces:** Create, Read, Update, Delete, Clone, Search, History
- **Key Rules:**
  - Content Code auto-generated and immutable
  - Status auto-calculated based on End Date
  - Up to 10 images per content
  - Cannot delete if referenced in active registrations

#### Module 3: Location Management
- **Owner:** Operations
- **Responsibility:** Manage physical positions where ads can be deployed
- **Key Entities:** Location, Representative
- **Interfaces:** CRUD, Search, Status transition (with validation), History
- **Key Rules:**
  - Position Code unique within same Channel
  - Cannot set to inactive if items are "Treo"
  - Setting to inactive affects child items

#### Module 4: Channel & Category Master
- **Owner:** Master data team
- **Responsibility:** Define advertising channels and item categories
- **Key Entities:** Channel, Category, CategoryPricing
- **Interfaces:** CRUD, Search, Price update (with impact analysis), History
- **Key Rules:**
  - Category pricing updates affect registrations in approval phase only
  - Cannot deactivate if items in progress
  - Categories have unit of measure for costing

#### Module 5: Physical Advertising Item Master
- **Owner:** Operations
- **Responsibility:** Inventory of actual advertising items/placements
- **Key Entities:** PhysicalItem, ItemImage
- **Interfaces:** Batch create, Edit (selective), Search, Status transition, History
- **Key Rules:**
  - Item Code auto-generated from Position + Category + Sequence
  - Status depends on parent Category and Location status
  - Cannot edit if status is "Treo"
  - Supports bulk creation

#### Module 6: Advertising Registration
- **Owner:** Requester (varies by role)
- **Responsibility:** Manage advertising campaign requests from creation to completion
- **Key Entities:** Registration, RegistrationContent, RegistrationItem
- **Interfaces:** CRUD, Search, Workflow actions, History, Export
- **Key Rules:**
  - Multi-step workflow with state machine
  - Budget enforcement
  - Content can be new or existing (non-expired only)
  - Item scope organized by Channel → Category → Position

#### Module 7: Workflow & Approval
- **Owner:** Platform
- **Responsibility:** State machine, transition validation, guard enforcement
- **Key Entities:** RegistrationWorkflow, WorkflowTransition, WorkflowGuard
- **Interfaces:** Evaluate transition, Execute transition, Get available actions
- **Key Rules:**
  - 8-step workflow with role-based authorization
  - Multiple guard conditions per transition
  - Prices lock after manager approval
  - Acceptance phase is locked (no item changes)

#### Module 8: Deployment Acceptance
- **Owner:** Brand operations
- **Responsibility:** Validate deployment with photos and status changes
- **Key Entities:** DeploymentAcceptance, DeploymentImage, AcceptanceItem
- **Interfaces:** Upload images, Mark status, Enter notes, Complete acceptance
- **Key Rules:**
  - Active items must have deployment image
  - Inactive items must have note
  - Images replace original item images
  - Cannot revert to active once marked inactive

#### Module 9: Audit Trail & History
- **Owner:** Platform
- **Responsibility:** Track all changes for compliance and transparency
- **Key Entities:** AuditLog, OperationHistory
- **Interfaces:** View history per entity, View workflow transitions, Export audit trail
- **Key Rules:**
  - All entity changes logged
  - Workflow transitions logged with actor and reason
  - Immutable audit trail
  - Support filtering by date, user, entity type

#### Module 10: Reporting & Export
- **Owner:** Platform
- **Responsibility:** Generate reports and export data in required formats
- **Key Entities:** ReportTemplate, ExportJob
- **Interfaces:** Generate report, Export to Excel/PDF/CSV
- **Key Rules:**
  - Column selection configurable per report
  - Date filtering support
  - Respects user permissions
  - Support scheduled exports

---

## E. USER ROLES AND PERMISSIONS MATRIX

### 5.1 Role Definitions

| Role | Full Title (Vietnamese) | Responsibility | Approval Authority | Scope |
|------|---|---|---|---|
| ADMIN | Admin hệ thống | System administration, user management, master data | N/A | All data |
| INPUTTER | Nhân viên nhập liệu | Create registration requests and advertising content | None | Own registrations |
| INPUTTER_HO | Nhân viên nhập liệu HO | Create registration requests at HO level | None | HO registrations |
| APPROVER | Quản lý phê duyệt (CBQL) | First-level approval of registrations | Approve or request revision | Own department |
| APPROVER_HO | Quản lý phê duyệt HO | First-level approval at HO | Approve or request revision | HO registrations |
| BRAND | Trưởng phòng thương hiệu | Content management, brand campaign decisions | Approve/reject/request revision | Brand campaigns |
| BRAND_MANAGER | Giám đốc phòng thương hiệu | Final approval of campaigns and budget | Final authority to approve | All campaigns |

### 5.2 Screen-Level Permission Matrix

| Screen | ADMIN | INPUTTER | INPUTTER_HO | APPROVER | APPROVER_HO | BRAND | BRAND_MANAGER |
|--------|-------|----------|-------------|----------|-------------|-------|----------------|
| **Advertising Content** | CRUD | CR* | CR* | RO | RO | CRUD | RO |
| **Registration List** | RO | RW** | RW** | RW*** | RW*** | RW*** | RO |
| **Registration Detail** | RO | RW** | RW** | RW*** | RW*** | RW*** | RO |
| **Location Management** | CRUD | None | None | RO | RO | CRUD | RO |
| **Channel Management** | CRUD | None | None | None | None | CRUD | RO |
| **Category Management** | CRUD | None | None | None | None | CRUD | RO |
| **Physical Item Master** | CRUD | CRUD* | CRUD* | RO | RO | CRUD | RO |
| **Registration Approval** | RO | None | None | RW | RW | None | None |
| **Brand Acceptance** | RO | None | None | None | None | RW | None |
| **Audit Trail** | RW | RO | RO | RO | RO | RO | RO |
| **Reports & Export** | RW | RO | RO | RO | RO | RO | RW |

**Legend:**
- `RO` = Read Only (view access)
- `RW` = Read + Write (full edit access)
- `CR` = Create + Read (can create new)
- `CRUD` = Create + Read + Update + Delete (full admin)
- `RW*` = Read + Write with restrictions (e.g., only own items)
- `RW**` = Read + Write draft only (cannot edit submitted forms)
- `RW***` = State-machine driven write (can only edit per workflow rules)

### 5.3 Action-Level Permission Matrix

| Action | INPUTTER | INPUTTER_HO | APPROVER | BRAND | BRAND_MANAGER |
|--------|----------|-------------|----------|-------|----------------|
| **Content:** Create | Yes | Yes | No | Yes | No |
| **Content:** Edit | Yes (own) | Yes (own) | No | Yes | No |
| **Content:** Clone | Yes | Yes | No | Yes | No |
| **Content:** Delete | Yes (own) | Yes (own) | No | Yes (own) | No |
| **Registration:** Create | Yes | Yes | No | No | No |
| **Registration:** Submit (Draft→Review) | Yes (own) | Yes (own) | No | No | No |
| **Registration:** Approve (Step 2) | No | No | Yes (own) | No | No |
| **Registration:** Accept (Step 3) | No | No | No | Yes | No |
| **Registration:** Approve Final (Step 4) | No | No | No | No | Yes |
| **Registration:** Accept Deployment (Step 6) | No | No | No | Yes | No |
| **Registration:** Approve Acceptance (Step 7) | No | No | No | No | Yes |
| **Item:** Create | Yes | Yes | No | Yes | No |
| **Item:** Edit | Yes | Yes | No | Yes (certain fields) | No |
| **Item:** Set Inactive (during Acceptance) | No | No | No | Yes | No |
| **Location:** Create | No | No | No | Yes | No |
| **Location:** Edit | No | No | No | Yes (certain fields) | No |
| **Location:** Deactivate | No | No | No | Yes | No |
| **Category:** Update Price | No | No | No | Yes | No |

### 5.4 Workflow State-Based Permissions

Permissions vary based on registration workflow state:

#### At "Bản nháp" (Draft)
- **INPUTTER:** Full edit, can add/remove items, can submit
- **APPROVER:** Can view only (cannot edit)

#### At "CBQL Phê duyệt" (Supervisor Review)
- **INPUTTER:** Cannot edit (locked)
- **APPROVER:** Can edit certain fields, can approve/request revision

#### At "P.Thương hiệu tiếp nhận" (Brand Acceptance)
- **BRAND:** Can edit content and item scope, can submit/request revision
- **INPUTTER:** Cannot edit (locked)

#### At "Trưởng phòng thương hiệu phê duyệt" (Manager Approval)
- **BRAND_MANAGER:** Can approve or request revision
- **All others:** Cannot edit (locked)

#### At "Nghiệm thu" (Deployment Acceptance)
- **BRAND:** Can upload images, mark status, enter notes
- **BRAND_MANAGER:** Can review and approve
- **All others:** Cannot edit (locked)

---

## F. END-TO-END WORKFLOW AND STATUS TRANSITION TABLE

### 6.1 Workflow Overview

The registration workflow has **8 steps** organized into two phases:

**APPROVAL PHASE (Steps 1-5):** Form completeness, budget, and authorization  
**ACCEPTANCE PHASE (Steps 6-8):** Deployment validation with photos

### 6.2 Detailed Status Transitions

| Step | Status Code | Vietnamese Name | Actor Role | Responsibility | Entry Conditions | Exit Actions | Next Step | Alternative Actions |
|------|-------------|-----------------|------------|-----------------|------------------|--------------|-----------|----------------------|
| **1** | `DRAFT` | Bản nháp | INPUTTER/ INPUTTER_HO | Create form, populate content, select items, validate budget | N/A (starting state) | Validate all items actionable | Step 2 | Save (remain in draft) |
| **2** | `SUPERVISOR_REVIEW` | CBQL Phê duyệt | APPROVER/ APPROVER_HO | Review form completeness, budget, and item selection | From DRAFT via Submit action | Lock prices (if approving) | Step 3 | Request revision (→ CBNV Điều Chỉnh) |
| **3** | `BRAND_ACCEPTANCE` | P.Thương hiệu tiếp nhận | BRAND | Provide procurement proposals, review/modify content and items | From SUPERVISOR_REVIEW via Approve action | Lock item list (after approval) | Step 4 | Request revision (→ CBNV Điều Chỉnh); Cancel request |
| **4** | `BRAND_MANAGER_APPROVAL` | Trưởng phòng thương hiệu phê duyệt | BRAND_MANAGER | Final approval, lock unit prices and totals | From BRAND_ACCEPTANCE via Approve action | Lock all prices and totals immutably | Step 5 | Request revision (→ BRAND_ACCEPTANCE) |
| **5** | `APPROVED` | Đã duyệt | BRAND | Signal ready for deployment | From BRAND_MANAGER_APPROVAL via Approve action | Mark as approved, ready for deployment | Step 6 | Hold (remain in APPROVED) |
| **6** | `DEPLOYMENT_PREP` | Nghiệm thu | BRAND | Upload deployment photos, mark status (active/inactive), enter notes | From APPROVED via Deployment Acceptance action | Validate images and notes per rules | Step 7 | Request revision (→ DEPLOYMENT_PREP) |
| **7** | `FINAL_ACCEPTANCE` | Trưởng phòng nghiệm thu | BRAND_MANAGER | Review deployment photos, validate quality, approve completion | From DEPLOYMENT_PREP via Final Review action | Validate all items have required documentation | Step 8 | Request revision (→ DEPLOYMENT_PREP) |
| **8** | `COMPLETED` | Đã nghiệm thu | BRAND (tracker) | Complete, close registration | From FINAL_ACCEPTANCE via Complete action | Archive, mark as historical | **(End)** | N/A |
| **R** | `CBNV_REVISION` | CBNV Điều Chỉnh | INPUTTER | Revise per feedback | From any approval step via Request Revision action | Similar to DRAFT—can edit | Step 2 (when resubmitted) | Save (remain in revision) |
| **X** | `CANCELLED` | Hủy | Any (at step 3+) | Cancelled request | From BRAND_ACCEPTANCE via Cancel action | Mark as cancelled, no further editing | **(End)** | N/A |

### 6.3 Workflow Action Mapping

| Action Button | From State | To State | Actor | Guard Conditions | Side Effects |
|---|---|---|---|---|---|
| **Save Draft** | DRAFT / CBNV_REVISION | DRAFT / CBNV_REVISION | INPUTTER | None (auto-validate form structure) | Create audit log |
| **Submit** | DRAFT | SUPERVISOR_REVIEW | INPUTTER | ALL_ITEMS_ACTIONABLE | Create audit log |
| **Approve** (Step 2) | SUPERVISOR_REVIEW | BRAND_ACCEPTANCE | APPROVER | ALL_ITEMS_ACTIONABLE, REGISTRATION_TOTAL_WITHIN_BUDGET | Create audit log |
| **Request Revision** (Step 2) | SUPERVISOR_REVIEW | CBNV_REVISION | APPROVER | None | Create audit log with revision reason |
| **Accept Content** (Step 3) | BRAND_ACCEPTANCE | BRAND_MANAGER_APPROVAL | BRAND | None (can add/remove items before submit) | Create audit log |
| **Request Revision** (Step 3) | BRAND_ACCEPTANCE | CBNV_REVISION | BRAND | None | Create audit log with reason |
| **Cancel Request** (Step 3) | BRAND_ACCEPTANCE | CANCELLED | BRAND | None | Create audit log, mark as cancelled |
| **Approve** (Step 4) | BRAND_MANAGER_APPROVAL | APPROVED | BRAND_MANAGER | None | LOCK_UNIT_PRICE_AND_TOTAL, create audit log |
| **Request Revision** (Step 4) | BRAND_MANAGER_APPROVAL | BRAND_ACCEPTANCE | BRAND_MANAGER | None | Create audit log |
| **Begin Deployment** (Step 5) | APPROVED | DEPLOYMENT_PREP | BRAND | None | Create audit log |
| **Submit Acceptance** (Step 6) | DEPLOYMENT_PREP | FINAL_ACCEPTANCE | BRAND | ALL_ACTIVE_ITEMS_HAVE_DEPLOYMENT_IMAGE, ALL_INACTIVE_ITEMS_HAVE_NOTE | Create audit log |
| **Request Revision** (Step 6) | DEPLOYMENT_PREP | DEPLOYMENT_PREP | BRAND | None | Create audit log (minor revision) |
| **Approve Acceptance** (Step 7) | FINAL_ACCEPTANCE | COMPLETED | BRAND_MANAGER | None | SET_COMPLETED_AT, create audit log |
| **Request Revision** (Step 7) | FINAL_ACCEPTANCE | DEPLOYMENT_PREP | BRAND_MANAGER | None | Create audit log |
| **Complete** (Step 8) | COMPLETED | COMPLETED | BRAND (auto or manual) | None | Final audit log |

### 6.4 Guard Conditions Definition

**`ALL_ITEMS_ACTIONABLE`**
- All items in registration have status = ACTIVE or INACTIVE (not PENDING, ON_HOLD, TREO)
- Prevents submission if items have uncertain status

**`REGISTRATION_TOTAL_WITHIN_BUDGET`**
- Total amount (sum of all item quantities × category unit price) ≤ Budget Estimate
- Prevents approval if budget exceeded

**`ALL_ACTIVE_ITEMS_HAVE_DEPLOYMENT_IMAGE`**
- All items with status = ACTIVE in deployment phase have uploaded image
- Prevents submission of deployment until photos collected

**`ALL_INACTIVE_ITEMS_HAVE_NOTE`**
- All items with status = INACTIVE in deployment phase have note entered
- Prevents submission of deployment until notes captured

**`LOCK_PRICE_AFTER_MANAGER_APPROVAL`**
- After BRAND_MANAGER approves (Step 4), unit prices cannot be updated
- Prevents category price changes from affecting this registration
- Immutable once locked

---

## G. SCREEN LIST AND SCREEN-LEVEL FUNCTIONAL SPECS

### 7.1 Screen Inventory

#### Master Data Screens
1. **Advertising Content Master** (List + Create/Edit)
2. **Location Management** (List + Create/Edit)
3. **Channel Management** (List + Create/Edit)
4. **Category Management** (List + Create/Edit)
5. **Physical Item Master** (List + Batch Create/Edit)

#### Transaction Screens
6. **Registration List** (Dashboard)
7. **Registration Create / Edit** (Multi-step form)
8. **Registration Detail** (Read-only or state-based edit)

#### Workflow Screens
9. **Approval Review** (State 2: Supervisor Review)
10. **Brand Acceptance** (State 3: Brand Decision)
11. **Manager Approval** (State 4: Manager Decision)
12. **Deployment Acceptance** (State 6: Photo Validation)

#### Support Screens
13. **Audit Trail / History**
14. **Reports & Export**
15. **User Management** (Admin)

### 7.2 Screen-Level Specifications

---

### **Screen 1: Advertising Content Master**

#### **Purpose**
Manage reusable advertising content master records with images and validity periods.

#### **1.1 List View**

**Grid Columns:**
- Content Code (non-editable, auto-generated)
- Advertising Content Name
- Category
- Key Visual (thumbnail, click for gallery)
- End Date
- Status (Còn hạn / Hết hạn)
- Creator
- Created Date
- Actions (View, Edit, Clone, Delete, History)

**Search Features:**
- Fuzzy search by Content Name
- Advanced search:
  - Content Code (exact match)
  - Status filter
  - Category filter
  - Creator filter
  - Date range (Created Date)

**Sorting:**
- All columns sortable
- Default sort: Created Date DESC

**Pagination:**
- 25 rows per page, configurable
- Show total count

#### **1.2 Create/Edit Form**

**Section: Content Information**

| Field | Type | Validation | Required | Default | Notes |
|-------|------|-----------|----------|---------|-------|
| Content Code | Read-only text | N/A | Yes | Auto-generated | Immutable, shown after save |
| Content Name | Text input | Min 1, Max 225; not all-spaces | Yes | Empty | Free text |
| Description | Textarea | Max 225 | No | Empty | Optional description |
| Category | Dropdown | Must select from predefined list | Yes | Empty | Single select only |
| Unit | Read-only text | N/A | Yes | Creator's department | Auto-filled from user's department |
| Start Date | Date picker | dd/mm/yyyy format, today default | Yes | Today | User can change |
| End Date | Date picker | dd/mm/yyyy format, must > Start Date | Yes | Empty | Show error if invalid |
| Creator | Read-only text | N/A | Yes | Logged-in user | Auto-filled, immutable |
| Status | Read-only badge | Auto-calculated | Yes | "Còn hạn" | Computed: if today ≤ End Date → "Còn hạn", else "Hết hạn" |

**Section: Key Visual Images**

| Field | Type | Validation | Required | Default | Notes |
|-------|------|-----------|----------|---------|-------|
| Images | File upload | JPEG/PNG only, max 5MB each, max 10 images total | Yes | None | Multiple file selection; show upload progress |

**Image Gallery Display:**
- Show thumbnails (120x120px)
- If more than 1 image: display "+N" overlay on first thumbnail
- Click thumbnail to open full-screen gallery
- Gallery allows: next/prev, close, download

#### **1.3 Actions**

| Action | Condition | Behavior |
|--------|-----------|----------|
| **Create** | New record | Open blank form, generate ID on save |
| **Edit** | Any existing | Open form with populated data; all fields editable except Code, Creator, Status |
| **Clone** | Existing, non-expired | Create new with same data, new Code, reset Creator to current user |
| **Delete** | Not referenced in active registrations | Show confirmation, mark as deleted (soft delete recommended) |
| **History** | Any existing | Open audit trail modal showing user, timestamp, action type |
| **Export** | List view | Generate Excel with all grid columns |

#### **1.4 Business Rules**

- Status auto-calculated; cannot be manually set
- Cannot delete if referenced in active registration
- Once created, Code is immutable
- Unit is always creator's department (not editable)
- Up to 10 images enforced; show error if exceeding

---

### **Screen 2: Location Management**

#### **Purpose**
Define physical positions where advertising items can be deployed.

#### **2.1 List View**

**Grid Columns:**
- Position Code
- Position Name
- Province/City
- Address (truncated with ellipsis; full text on hover)
- Channel
- Zone
- Status (Hoạt động / Không hoạt động)
- Representative 1 Name
- Representative 1 Phone
- Actions (View, Edit, History)

**Search:**
- Fuzzy by Position Name
- Advanced: Province/City, Channel, Status

**Sorting:**
- All columns sortable
- Default: Position Code ASC

#### **2.2 Create/Edit Form**

| Field | Type | Validation | Required | Editable (Create) | Editable (Edit) | Notes |
|-------|------|-----------|----------|---|---|---|
| Position Code | Text | 3 chars, unique within Channel, alphanumeric | Yes | Yes | No | Immutable after create |
| Position Name | Text | Max 255 | Yes | Yes | Yes | |
| Channel | Dropdown | Must select from Channel master | Yes | Yes | No | Immutable after create |
| Province/City | Dropdown | Valid province from reference data | Yes | Yes | Yes | |
| Zone | Dropdown | Nội thành / Ngoại thành / Vùng nông thôn / Khu vực khác | Yes | Yes | Yes | Single select |
| Address | Text | Max 255 | Yes | Yes | Yes | |
| Classification | Text | Max 50 | No | Yes | Yes | Optional, e.g., "Indoor Billboard" |
| Longitude | Number | -180 to 180, decimal | No | Yes | Yes | Optional GPS coordinate |
| Latitude | Number | -90 to 90, decimal | No | Yes | Yes | Optional GPS coordinate |
| Status | Dropdown | Hoạt động / Không hoạt động | Yes | Yes | Yes | See status change rules |
| Representative 1 Name | Text | Max 100 | No | Yes | Yes | |
| Representative 1 Email | Email | Valid email format | No | Yes | Yes | |
| Representative 1 Phone | Text | 10 digits only | No | Yes | Yes | |
| Representative 2 Name | Text | Max 100 | No | Yes | Yes | |
| Representative 2 Email | Email | Valid email format | No | Yes | Yes | |
| Representative 2 Phone | Text | 10 digits only | No | Yes | Yes | |
| Note | Textarea | Max 255 | No | Yes | Yes | |

#### **2.3 Status Transition Rules**

**When changing Location to "Không hoạt động":**

1. Query all Physical Items at this Location with status != "Không hoạt động"
2. Filter for items with status "Treo" or items in active registrations
3. If any found:
   - Show error: "Bạn không thể thay đổi trạng thái vị trí này vì có vật phẩm thuộc vị trí đang trong quá trình thi công"
   - Cancel the status change
4. If none found:
   - Show confirmation dialog: "Bạn có chắc chắn muốn chuyển [number of items] vật phẩm của vị trí [position name] về không hoạt động?"
   - If confirmed: update all "Hoạt động" items to "Không hoạt động"
   - Log the change in audit trail

#### **2.4 Actions**

- Create, Edit, History, Export
- Status change (with validation)

---

### **Screen 3: Channel Management**

#### **Purpose**
Define advertising channels (organizing dimensions for locations and items).

#### **3.1 List View & Form**

| Field | Type | Validation | Required | Notes |
|-------|------|-----------|----------|-------|
| Channel Code | Text | 3 chars, unique | Yes | Immutable after create |
| Channel Name | Text | Max 100, unique | Yes | |
| Description | Textarea | Max 500 | No | |
| Status | Dropdown | Hoạt động / Không hoạt động | Yes | |

**Actions:** Create, Edit, History, Export

---

### **Screen 4: Category Management**

#### **Purpose**
Define advertising item types/formats with pricing.

#### **4.1 List View**

**Grid Columns:**
- Category Code
- Category Name
- Format (Online / Offline)
- Unit of Measure
- Unit Price
- Status (Hoạt động / Không hoạt động)
- Created Date
- Creator
- Actions (View, Edit, History)

**Search:**
- Fuzzy by Category Name
- Advanced: Format, Status

#### **4.2 Create/Edit Form**

| Field | Type | Validation | Required | Editable | Notes |
|-------|------|-----------|----------|----------|-------|
| Category Code | Text | 2 chars, unique | Yes | No (after create) | Immutable |
| Category Name | Text | Max 225, unique | Yes | No (after create) | Immutable |
| Format | Dropdown | Online / Offline | Yes | Yes | Single select |
| Description | Textarea | Max 1000 | No | Yes | |
| Unit of Measure | Dropdown | cái / m2 / m3 / m / bộ / khác | Yes | Yes | Single select |
| Unit Price | Number | Max 10 billion | No | Yes | See price update rules |
| Status | Dropdown | Hoạt động / Không hoạt động | Yes | Yes | See status change rules |

#### **4.3 Unit Price Update Rules**

**When editing Unit Price:**

1. Show confirmation: "Đơn giá [new price] sẽ bắt đầu áp dụng cho hạng mục [category name] ngay sau khi bạn xác nhận. Bạn có chắc chắn muốn cập nhật?"
2. If confirmed:
   - Update price
   - Query all registrations in approval phase (Steps 1-4) referencing this category
   - Recalculate Total Amount for each affected registration
   - Update registration if affected
   - Log change in audit trail
3. If cancelled: no change

#### **4.4 Status Transition Rules**

**When changing Category to "Không hoạt động":**

1. Query all Physical Items in this category with status != "Không hoạt động"
2. Filter for items with status "Treo" or in active registrations
3. If any found:
   - Show error: "Bạn không thể thay đổi trạng thái hạng mục này vì có vật phẩm thuộc hạng mục đang trong quá trình thi công"
   - Cancel the status change
4. If none found:
   - Show confirmation: "Bạn có chắc chắn muốn chuyển [number of items] vật phẩm của hạng mục [category name] về không hoạt động?"
   - If confirmed: update all "Hoạt động" items to "Không hoạt động"
   - Log the change

---

### **Screen 5: Physical Item Master**

#### **Purpose**
Manage inventory of physical advertising items/placements with bulk creation support.

#### **5.1 List View**

**Grid Columns:**
- Item Code (non-editable)
- Item Name (non-editable)
- Category Code (non-editable)
- Position Code (non-editable)
- Channel (non-editable)
- Province/City (non-editable)
- Width (m)
- Length (m)
- Dimension Image
- Status (Hoạt động / Không hoạt động / Treo)
- Creator
- Created Date
- Actions (View, Edit, History)

**Search:**
- Fuzzy by Item Name
- Advanced:
  - Category
  - Channel
  - Province/City
  - Position
  - Content Status (Còn hạn / Hết hạn)
  - Content Name

**Sorting:**
- All columns sortable
- Default: Item Code ASC

#### **5.2 Bulk Create Flow**

**Step 1: Configuration**

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Channel | Dropdown | Required, must select from Channel master | Single select |
| Category | Dropdown | Required, filtered by Channel | Single select |
| Position | Dropdown | Required, filtered by Channel + Category | Single select |
| Quantity | Number | Min 1, Max 99 | Enter number of items to create |

**Step 2: Item Table Generation**

After clicking "Generate", system creates:
- Item Code = `PositionCode.CategoryCode.SequenceNo` (e.g., "P01.HL.001")
- Item Name = `CategoryName + PositionName + SequenceNo` (e.g., "Light Box Hoàng Quốc Việt 001")
- Table with editable rows

**Step 3: Fill Item Details**

**Editable Columns in Generated Table:**

| Column | Type | Validation | Required | Default | Notes |
|--------|------|-----------|----------|---------|-------|
| Width (m) | Number | Max 99.99, 2 decimal places | Yes | Empty | Float, e.g., 2.50 |
| Length (m) | Number | Max 99.99, 2 decimal places | Yes | Empty | Float, e.g., 1.75 |
| Description | Text | Max 400 | No | Empty | Item-specific notes |
| Image | File upload | JPEG/PNG, max 5MB | No | None | Click to upload |
| Select Content | Dropdown | References non-expired Content | No | Empty | Can select existing or skip |

**Step 4: Actions**

| Action | Behavior |
|--------|----------|
| **Cancel** | Discard all changes, reset form |
| **Save** | Validate all required fields, insert all items, show success message, reset form |

**Validation Rules:**
- If user changes Channel or Position while table has rows:
  - Show: "Bạn vui lòng hoàn thiện khởi tạo vật phẩm tại [position name] trước khi tạo vật phẩm ở vị trí khác"
  - Prevent channel/position change until saved/cancelled

#### **5.3 Edit Individual Item**

**Editable Fields:**
- Width
- Length
- Description
- Image (replace)
- Status

**Read-only Fields:**
- Item Code
- Item Name
- Category Code
- Position Code
- Channel

**Edit Restriction:**
- Cannot edit if status = "Treo"

#### **5.4 Item Status Propagation**

**Rules:**
- Item can only be "Hoạt động" if:
  - Category is "Hoạt động" AND
  - Location is "Hoạt động"
- If either parent becomes "Không hoạt động" → Item becomes "Không hoạt động"

**Validation Matrix:**

| Category | Location | Item Status |
|----------|----------|------------|
| Hoạt động | Hoạt động | Can be Hoạt động |
| Không hoạt động | Hoạt động | Must be Không hoạt động |
| Hoạt động | Không hoạt động | Must be Không hoạt động |
| Không hoạt động | Không hoạt động | Must be Không hoạt động |

---

### **Screen 6: Registration List**

#### **Purpose**
Dashboard view of all advertising registration requests with filtering and quick actions.

#### **6.1 List View**

**Grid Columns:**
- Registration Code
- Program Name
- Status (workflow state badge)
- Budget Estimate
- Total Amount (calculated)
- Start Date
- End Date
- Unit
- Creator
- Created Date
- Current Approver (if applicable)
- Actions (View, Edit, Clone, History, Export, Delete)

**Search & Filter:**
- Fuzzy by Program Name
- Advanced:
  - Registration Code (exact)
  - Status (multi-select)
  - Budget range
  - Creator
  - Unit/Department
  - Date range (Created Date, Start Date, End Date)

**Sorting:**
- All columns sortable
- Default: Created Date DESC

**Bulk Actions:**
- Export selected rows
- Cancel selected (if draft)

#### **6.2 Status Badge Display**

Each row shows workflow status as colored badge:
- `DRAFT` → Gray
- `SUPERVISOR_REVIEW` → Blue
- `BRAND_ACCEPTANCE` → Purple
- `BRAND_MANAGER_APPROVAL` → Orange
- `APPROVED` → Green
- `DEPLOYMENT_PREP` → Gold
- `FINAL_ACCEPTANCE` → Teal
- `COMPLETED` → Black
- `CBNV_REVISION` → Yellow
- `CANCELLED` → Red

#### **6.3 Row Actions**

| Action | Condition | Destination |
|--------|-----------|------------|
| **View** | Any | Detail screen (read-only or state-based) |
| **Edit** | Draft or Revision state | Form editor with state-based permissions |
| **Clone** | Any completed | Open new form with same data, new Code |
| **History** | Any | Modal with workflow transitions + audit trail |
| **Export** | Any | Download as Excel with detail data |
| **Delete** | Draft only | Confirmation → soft delete |

---

### **Screen 7: Registration Create/Edit (Multi-Step Form)**

#### **Purpose**
Create or edit advertising registration with content and item selection.

#### **7.1 Form Structure**

**Multi-tab form with sections:**

1. **Registration Information** (Tab 1)
2. **Advertising Content** (Tab 2)
3. **Item Scope / Location Selection** (Tab 3)
4. **Proposals & Notes** (Tab 4 - appears per workflow state)
5. **Deployment Acceptance** (Tab 5 - deployment phase only)

#### **7.2 Tab 1: Registration Information**

| Field | Type | Validation | Required | Editable | Notes |
|-------|------|-----------|----------|----------|-------|
| Registration Code | Read-only | N/A | Yes | No | Auto-generated, shown after save |
| Program Name | Text | Max 225 | Yes | Yes (if draft) | Free text campaign name |
| Budget Estimate | Number | Max 10 billion | Yes | Yes (if draft) | Total budget for campaign |
| IO Code | Text | Max 50 | No | Yes (if draft) | Optional internal order code |
| Start Date | Date picker | dd/mm/yyyy | Yes | Yes (if draft) | Default today |
| End Date | Date picker | dd/mm/yyyy | Yes | Yes (if draft) | Must be > Start Date |
| Submission Document | File upload | PDF/Email formats, max 20MB | No | Yes (if draft) | Optional supporting doc |
| Unit | Read-only | N/A | Yes | No | Auto-filled from creator's dept |
| Creator | Read-only | N/A | Yes | No | Auto-filled from logged-in user |
| Status | Badge | Workflow status | Yes | No | Display current state |

#### **7.3 Tab 2: Advertising Content**

**Section: Content Selection**

| Field | Type | Validation | Required | Notes |
|-------|------|-----------|----------|-------|
| Content Option | Radio | New / Existing | Yes | Choose: create new or reuse existing |

**Sub-section A: New Content (if selected)**
- Embed full Advertising Content form (see Screen 1)
- Auto-populate Start/End dates from Registration Information
- On save: create in Content master, add reference to this registration

**Sub-section B: Existing Content (if selected)**
- Content selector: Dropdown populated with all "Còn hạn" content
- Show in selector: Content Code, Name, Category, Key Visual thumbnail
- Click "View" to preview full content details
- Click "Select" to confirm choice

#### **7.4 Tab 3: Item Scope Selection (Registration Item Scope)**

**Hierarchy Structure:**
- Channel (Level 1)
- Category (Level 2, filtered by Channel)
- Position (Level 3, filtered by Channel + Category)
- Physical Item (Level 4, filtered by all above)

**UI Pattern: Tree/Checkbox Selection**

1. **Channel Selection**
   - Show all active Channels as checkboxes
   - User can select multiple channels

2. **Category Selection (for each selected Channel)**
   - Show Categories available in selected Channel
   - User can select multiple categories per channel
   - Dynamically shows Positions matching selected categories

3. **Position Selection (for each selected Channel + Category combination)**
   - Show tree of Positions (grouped by Province/City)
   - Checkbox per position

4. **Item Selection (for each selected Position)**
   - Show Physical Items at selected Positions
   - Checkbox per item
   - Display: Item Code, Item Name, Dimensions, Status, Current Image

**Table Summary View:**
After selections, show collapsed table:
- Row per selected item
- Columns: Item Code, Item Name, Category, Position, Quantity (qty of this item), Unit Price, Total (qty × price), Status
- Editable columns: Quantity (during draft)
- Total Amount calculated at bottom

**Quantity Field Rules:**
- Default: 1
- Min: 1
- Max: 999
- Editable during draft and certain approval states
- Read-only during acceptance phase

#### **7.5 Tab 4: Proposals (appears at BRAND_ACCEPTANCE step)**

| Field | Type | Validation | Required | Notes |
|-------|------|-----------|----------|-------|
| Procurement Category Proposal | Textarea | Max 1000 | Yes (if at this step) | BRAND must provide |
| Other Category Proposal | Textarea | Max 1000, allow "Không" | Yes (if at this step) | BRAND input or "Không" placeholder |
| Other Proposal | Textarea | Max 1000, allow "Không" | Yes (if at this step) | Additional notes or "Không" |

**Visibility Rule:** Only shown when registration reaches BRAND_ACCEPTANCE step (state 3)

#### **7.6 Tab 5: Deployment Acceptance (appears at DEPLOYMENT_PREP step)**

**For each selected item:**

| Field | Type | Input | Required | Notes |
|-------|------|-------|----------|-------|
| Item Code & Name | Read-only | Display | N/A | Show item identifier |
| Current Status | Dropdown | Hoạt động / Không hoạt động | Yes | Change from current status |
| Old Image | Read-only | Display thumbnail | N/A | Original item image |
| New Image | File upload | JPEG/PNG, max 5MB | If Active | Required only if status = Active |
| Deployment Note | Textarea | Max 500 | If Inactive | Required only if status = Inactive |

**Validation Rules (before submission):**
- All active items must have New Image uploaded
- All inactive items must have Deployment Note entered
- Show error if any item missing required field

#### **7.7 Form Actions (Bottom Bar)**

**Action buttons appear per workflow state:**

| Button | From State | To State | Icon | Condition |
|--------|-----------|---------|------|-----------|
| **Lưu** (Save) | DRAFT / CBNV_REVISION | Same | Disk | Always available in draft |
| **Hủy** (Cancel) | Any | CANCELLED (if state 3+) | X | Draft: discard; State 3+: request cancellation |
| **Trình duyệt** (Submit) | DRAFT | SUPERVISOR_REVIEW | Arrow Up | All validations pass |
| **Phê duyệt** (Approve) | Various | Next | Check | Based on current state + role |
| **Bổ sung** (Request Revision) | SUPERVISOR_REVIEW / BRAND_ACCEPTANCE / DEPLOYMENT_PREP | CBNV_REVISION | Edit | Approver action to ask for changes |
| **Hủy yêu cầu** (Cancel Request) | BRAND_ACCEPTANCE | CANCELLED | X | BRAND can cancel at this step only |
| **Nghiệm thu** (Begin Deployment) | APPROVED | DEPLOYMENT_PREP | Checkmark | Trigger deployment phase |

---

### **Screen 8-12: Approval & Acceptance Workflow Screens**

These screens are specialized views of the Registration form filtered by workflow state. They differ from the generic Registration Detail by:
- Showing only relevant tabs and fields for the current state
- Presenting approval-specific actions (Approve, Request Revision)
- Displaying context about who's next to review
- Showing history of prior approvals

**Common Pattern for Approval Screens:**

```
┌─────────────────────────────────────────┐
│ Header: Program Name | Status Badge | Reg Code
├─────────────────────────────────────────┤
│ Context Bar:
│ Created by: [Creator] | Current Step: [Step Name]
│ Budget: $X | Total: $Y | Variance: $Z
├─────────────────────────────────────────┤
│ [Relevant Tabs with State-based Fields]
├─────────────────────────────────────────┤
│ Approval History:
│ [Timeline of prior approvals/revisions]
├─────────────────────────────────────────┤
│ Action Buttons: [Phê duyệt] [Bổ sung] [Chi tiết]
└─────────────────────────────────────────┘
```

**Specific screens (8-12) follow the general registration flow but with role-specific visibility and actions.**

---

### **Screen 13: Audit Trail / Operation History**

#### **Purpose**
View complete history of changes and workflow transitions for any entity.

#### **13.1 List View**

**Columns:**
- Timestamp (dd/mm/yyyy hh:mm:ss)
- User (who made the change)
- Entity Type (Registration, Content, Location, etc.)
- Entity Code/ID
- Action Type (Create, Update, Transition, Delete)
- Old Value → New Value
- Details (notes/reason)

**Filters:**
- Date range
- User
- Entity Type
- Action Type
- Entity Code

**Sorting:**
- Default: Timestamp DESC

**Export:**
- Download as Excel or PDF

#### **13.2 Workflow Transition Details**

For registration workflow transitions, show:
- From State → To State
- Actor (user who triggered)
- Timestamp
- Guard condition results (if any failed)
- Side effects applied
- Approval reason/note (if revision requested)

---

### **Screen 14: Reports & Export**

#### **Purpose**
Generate and export data for analysis and compliance.

#### **14.1 Report Templates**

| Report | Scope | Columns | Export Formats |
|--------|-------|---------|-----------------|
| **Content Summary** | All content | Code, Name, Category, Dates, Status, Creator | Excel, PDF, CSV |
| **Registration Status** | All registrations | Code, Name, Status, Budget, Total, Creator, Current Approver | Excel, PDF, CSV |
| **Item Inventory** | All physical items | Code, Name, Dimensions, Category, Position, Status | Excel, PDF, CSV |
| **Location Directory** | All locations | Code, Name, Province, Channel, Zone, Representatives | Excel, PDF, CSV |
| **Approval Workflow Report** | Registrations in workflow | Code, Status, Days in Current Step, Pending Approver | Excel, PDF |
| **Deployment Report** | Completed registrations | Code, Items Deployed, Images Uploaded, Completion Date | Excel, PDF |
| **Audit Trail Extract** | All changes | Timestamp, User, Entity, Action, Old Value, New Value | Excel, PDF, CSV |

#### **14.2 Export Wizard**

1. **Select Report Type** (dropdown)
2. **Configure Filters:**
   - Date range
   - Status filter
   - Creator filter
   - Department filter
3. **Select Columns** (checkboxes)
4. **Choose Export Format:** Excel / PDF / CSV
5. **Execute:**
   - Generate file
   - Download or email
   - Show progress

---

### **Screen 15: User Management** (Admin)

#### **Purpose**
Manage user accounts, roles, and permissions.

#### **15.1 User List**

**Columns:**
- Username
- Email
- Full Name
- Role
- Department
- Status (Active / Inactive)
- Last Login
- Actions (Edit, Reset Password, Delete)

**Search:**
- Fuzzy by name/email
- Advanced: Role, Department, Status

#### **15.2 Create/Edit User**

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Username | Text | Unique, 3-20 chars, alphanumeric+underscore | Yes |
| Email | Email | Unique, valid format | Yes |
| Full Name | Text | Max 100 | Yes |
| Role | Dropdown | Select from roles | Yes |
| Department | Dropdown | Select from department master | Yes |
| Status | Dropdown | Active / Inactive | Yes |

---

## H. ENTITY MODEL / DATABASE SCHEMA

### 8.1 Core Entities

#### **Entity Diagram**

```
┌─────────────┐
│    User     │ (1) ───many─→ (many) Registration
└─────────────┘
       │
       └─ many ─→ (1) Department

┌──────────────┐
│   Channel    │ (1) ───many─→ (many) Location
└──────────────┘
       │
       └─ many ─→ (many) Category
       │
       └─ many ─→ (many) PhysicalItem

┌──────────────┐
│   Category   │ (1) ───many─→ (many) PhysicalItem
└──────────────┘
       │
       └─ many ─→ (many) RegistrationItem

┌──────────────┐
│   Location   │ (1) ───many─→ (many) PhysicalItem
└──────────────┘

┌──────────────────────┐
│ AdvertisingContent   │ (1) ───many─→ (many) Registration
└──────────────────────┘
       │
       └─ many ─→ (many) ContentImage

┌────────────────┐
│  Registration  │ (1) ───many─→ (many) RegistrationItem
└────────────────┘
       │
       ├─ many ─→ (many) RegistrationContent
       ├─ many ─→ (many) RegistrationApproval
       ├─ many ─→ (many) DeploymentAcceptance
       └─ many ─→ (many) AuditLog
```

### 8.2 Detailed Entity Schemas

#### **TABLE: Users**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,  -- ADMIN, INPUTTER, APPROVER, BRAND, BRAND_MANAGER, etc.
  department_id UUID NOT NULL REFERENCES departments(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

#### **TABLE: Departments**

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),  -- For hierarchy
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **TABLE: Channels**

```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP  -- Soft delete
);
```

#### **TABLE: Categories**

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) UNIQUE NOT NULL,
  name VARCHAR(225) UNIQUE NOT NULL,
  format VARCHAR(20) NOT NULL,  -- ONLINE, OFFLINE
  description TEXT,
  unit_price DECIMAL(12, 2),
  unit_of_measure VARCHAR(50) NOT NULL,  -- cái, m2, m3, m, bộ, khác
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

#### **TABLE: Locations**

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code VARCHAR(3) NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id),
  position_name VARCHAR(255) NOT NULL,
  province_city VARCHAR(100) NOT NULL,
  zone VARCHAR(50) NOT NULL,  -- Nội thành, Ngoại thành, Vùng nông thôn, Khu vực khác
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
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  note TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE(position_code, channel_id)
);
```

#### **TABLE: PhysicalItems**

```sql
CREATE TABLE physical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(50) UNIQUE NOT NULL,  -- PositionCode.CategoryCode.SequenceNo
  item_name VARCHAR(255) NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  width_m DECIMAL(5, 2),
  length_m DECIMAL(5, 2),
  description TEXT,
  image_url VARCHAR(500),
  image_key VARCHAR(255),  -- S3 or storage key
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, PENDING, ON_HOLD, TREO
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

#### **TABLE: AdvertisingContent**

```sql
CREATE TABLE advertising_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_code VARCHAR(50) UNIQUE NOT NULL,
  content_name VARCHAR(225) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,  -- Còn hạn, Hết hạn (computed from dates)
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

#### **TABLE: ContentImages**

```sql
CREATE TABLE content_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES advertising_content(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_key VARCHAR(255) NOT NULL,
  sequence INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_id, sequence)
);
```

#### **TABLE: Registrations**

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_code VARCHAR(50) UNIQUE NOT NULL,
  program_name VARCHAR(225) NOT NULL,
  budget_estimate DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2),
  io_code VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submission_document_url VARCHAR(500),
  submission_document_key VARCHAR(255),
  unit_id UUID REFERENCES departments(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  current_approver_id UUID REFERENCES users(id),
  
  workflow_state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  -- DRAFT, SUPERVISOR_REVIEW, BRAND_ACCEPTANCE, BRAND_MANAGER_APPROVAL, APPROVED, DEPLOYMENT_PREP, FINAL_ACCEPTANCE, COMPLETED, CBNV_REVISION, CANCELLED
  
  prices_locked_at TIMESTAMP,  -- Locked after BRAND_MANAGER approval
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

#### **TABLE: RegistrationContent**

```sql
CREATE TABLE registration_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  advertising_content_id UUID NOT NULL REFERENCES advertising_content(id),
  is_new_content BOOLEAN DEFAULT FALSE,  -- TRUE if created within registration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(registration_id, advertising_content_id)
);
```

#### **TABLE: RegistrationItems**

```sql
CREATE TABLE registration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  physical_item_id UUID NOT NULL REFERENCES physical_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2),  -- Snapshot of price at time of registration
  total_amount DECIMAL(15, 2),  -- quantity × unit_price
  
  -- Acceptance phase fields
  deployment_status VARCHAR(20),  -- ACTIVE, INACTIVE (set during deployment)
  deployment_image_url VARCHAR(500),  -- New image uploaded during acceptance
  deployment_image_key VARCHAR(255),
  deployment_note TEXT,  -- Note if marked inactive
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(registration_id, physical_item_id)
);
```

#### **TABLE: RegistrationApprovals**

```sql
CREATE TABLE registration_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  approval_step INT NOT NULL,  -- 1, 2, 3, 4, etc.
  from_state VARCHAR(50) NOT NULL,
  to_state VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,  -- SUBMIT, APPROVE, REQUEST_REVISION, APPROVE, ACCEPT, etc.
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(50) NOT NULL,
  decision VARCHAR(20),  -- APPROVED, REJECTED, REVISION_REQUESTED
  reason TEXT,  -- Optional: reason for revision/rejection
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **TABLE: DeploymentAcceptance**

```sql
CREATE TABLE deployment_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  registration_item_id UUID NOT NULL REFERENCES registration_items(id),
  
  old_item_status VARCHAR(20),  -- Status before acceptance
  new_item_status VARCHAR(20),  -- Status after acceptance (ACTIVE or INACTIVE)
  deployment_image_url VARCHAR(500),
  deployment_image_key VARCHAR(255),
  acceptance_note TEXT,
  
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP,
  
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_status VARCHAR(20),  -- APPROVED, REJECTED
  review_note TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **TABLE: AuditLog**

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,  -- REGISTRATION, CONTENT, LOCATION, CATEGORY, ITEM, etc.
  entity_id UUID NOT NULL,
  entity_code VARCHAR(50),
  action_type VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, STATE_TRANSITION
  old_value JSONB,  -- Previous state
  new_value JSONB,  -- New state
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,  -- Optional: why the change was made
  ip_address VARCHAR(45)  -- For security audit
);
```

---

## I. BUSINESS RULES AND VALIDATIONS

### 9.1 Content Creation Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Content Name** | Not all-spaces, 1-225 chars | "Content name must be 1-225 characters and not all spaces" | Client + Server |
| **End Date > Start Date** | End date must be after start date | "End date must be after start date" | Server |
| **Images Required** | At least 1 image, max 10 images | "At least 1 image is required (max 10)" | Client |
| **Image Format** | JPEG or PNG only | "Images must be JPEG or PNG format" | Client |
| **Image Size** | Max 5MB per image | "Each image must be max 5MB" | Client |
| **Status Auto-Calculation** | If today > end_date → "Hết hạn", else "Còn hạn" | N/A | Server (automatic) |
| **Unit Auto-Fill** | Always creator's department | N/A | Server (automatic) |

### 9.2 Location Management Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Position Code Uniqueness** | Unique within same channel | "Position code already exists in this channel" | Server |
| **Position Code Format** | Exactly 3 characters | "Position code must be exactly 3 characters" | Client + Server |
| **Province/City Required** | Must select from province master | "Province/City is required" | Client |
| **Phone Format** | 10 digits only (if provided) | "Phone must be exactly 10 digits" | Client |
| **Email Format** | Valid email (if provided) | "Invalid email format" | Client |
| **GPS Coordinates Range** | Longitude -180 to 180, Latitude -90 to 90 | "Invalid GPS coordinates" | Server |
| **Inactive Status Blocked** | Cannot deactivate if items "Treo" or in-progress | "[Error message per rule]" | Server |

### 9.3 Category Management Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Category Code Uniqueness** | Exactly 2 chars, unique | "Category code must be 2 chars and unique" | Server |
| **Category Name Uniqueness** | Max 225 chars, unique | "Category name must be unique and max 225 chars" | Server |
| **Unit Price Update** | Show confirmation, recalculate affected registrations | "[Confirmation message]" | Server |
| **Unit of Measure Required** | Must select from list | "Unit of measure is required" | Client |
| **Inactive Status Blocked** | Cannot deactivate if items "Treo" or in-progress | "[Error message per rule]" | Server |

### 9.4 Physical Item Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Item Code Auto-Generation** | PositionCode.CategoryCode.SequenceNo | N/A | Server |
| **Item Name Auto-Generation** | CategoryName + PositionName + SequenceNo | N/A | Server |
| **Dimensions Format** | Max 99.99, 2 decimal places | "Dimensions must be max 99.99 with 2 decimal places" | Client |
| **Status Propagation** | Item = Active only if Category & Location both Active | N/A | Server |
| **Cannot Edit if Treo** | Block edit if status = TREO | "Cannot edit items marked 'Treo'" | Server |
| **Bulk Create Constraint** | Only 1 position per create session | "[Warning message]" | Client |
| **Image Required** | Image upload max 5MB | "[Per content rules]" | Client |

### 9.5 Registration Creation Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Registration Code Auto-Gen** | System-generated, unique | N/A | Server |
| **Program Name** | 1-225 chars, not all-spaces | "Program name required (1-225 chars)" | Client |
| **Budget Estimate** | Max 10 billion, > 0 | "Budget must be > 0 and ≤ 10 billion" | Server |
| **Content Selection** | Must select existing non-expired OR create new | "Please select content or create new" | Client |
| **Existing Content Filter** | Only show "Còn hạn" (non-expired) | N/A | Server |
| **New Content Persistence** | If created within registration, also save to master table | N/A | Server |
| **Item Scope Required** | At least 1 item selected | "Please select at least 1 item" | Client |
| **Start/End Date** | End > Start | "End date must be after start date" | Server |

### 9.6 Registration Submission Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **All Items Actionable** | No items with status PENDING, ON_HOLD, or TREO | "All items must be active or inactive (not pending/on hold/treo)" | Server (guard) |
| **Total Within Budget** | Total amount ≤ Budget estimate | "Total amount exceeds budget estimate" | Server (guard) |
| **Cannot Submit if Draft Missing** | All required fields populated | "[List missing fields]" | Client |

### 9.7 Approval Workflow Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Approver Chain** | Supervisor/Approver must be direct superior of creator | N/A | Server (role-based) |
| **State Transitions** | Only allowed transitions per state machine | "Action not available in current state" | Server |
| **Pricing Locked After Manager Approval** | Cannot change category prices for this registration | "Prices are locked and cannot be changed" | Server |
| **Item List Locked in Acceptance** | Cannot add/remove items in acceptance phase | "Cannot modify items in acceptance phase" | Server |

### 9.8 Deployment Acceptance Rules

| Rule | Validation | Error Message | Enforcement |
|------|-----------|---|---|
| **Active Items Need Image** | All items marked active must have deployment image | "Please upload image for [item name]" | Server (guard) |
| **Inactive Items Need Note** | All items marked inactive must have note | "Please enter note for [item name]" | Server (guard) |
| **Image Format** | JPEG/PNG, max 5MB | "Image must be JPEG/PNG, max 5MB" | Client |
| **One-Way Status Change** | Cannot revert from inactive to active in acceptance | "Cannot change inactive items back to active" | Server |

---

## J. AUDIT TRAIL DESIGN

### 10.1 Audit Trail Scope

**Entities that must be audited:**
- Advertising Content (create, edit, delete, status change)
- Locations (create, edit, delete, status change)
- Categories (create, edit, delete, price update, status change)
- Physical Items (create, edit, delete, status change, bulk operations)
- Registrations (create, edit, delete, state transitions, field updates)
- Users (create, edit, delete, role/status change, password reset)

**Actions to audit:**
- CREATE: Entity created with initial values
- UPDATE: Entity field(s) changed
- DELETE: Entity marked deleted or hard-deleted
- STATE_TRANSITION: Workflow status changed
- APPROVE: Approval action taken
- REQUEST_REVISION: Revision requested
- PRICE_UPDATE: Category price changed
- STATUS_CHANGE: Entity status changed (not workflows state)
- BULK_OPERATION: Batch actions (e.g., bulk item creation)

### 10.2 Audit Log Entry Structure

```json
{
  "id": "uuid",
  "timestamp": "2026-05-24T14:30:00Z",
  "entity_type": "REGISTRATION",
  "entity_id": "uuid",
  "entity_code": "REG-001",
  "action_type": "UPDATE",
  "actor": {
    "user_id": "uuid",
    "username": "john.doe",
    "full_name": "John Doe",
    "role": "INPUTTER",
    "department": "Marketing"
  },
  "old_value": {
    "program_name": "Old Campaign",
    "budget_estimate": 50000
  },
  "new_value": {
    "program_name": "Updated Campaign",
    "budget_estimate": 75000
  },
  "reason": "Budget increase approved by management",
  "ip_address": "192.168.1.100"
}
```

### 10.3 History View Implementation

**Query Interface:**

```sql
SELECT * FROM audit_log
WHERE entity_type = 'REGISTRATION'
  AND entity_id = '[registration_id]'
ORDER BY changed_at DESC;
```

**Display Format:**

| Timestamp | User | Action | Old Value | New Value | Reason |
|-----------|------|--------|-----------|-----------|--------|
| 2026-05-24 14:30 | john.doe | UPDATE | budget: $50K | budget: $75K | Budget increase |
| 2026-05-24 13:45 | jane.smith | STATE_TRANSITION | DRAFT → SUPERVISOR_REVIEW | [action] | Submitted for approval |
| 2026-05-24 12:00 | john.doe | CREATE | program_name: "Campaign X" | [initial] | New registration |

---

## K. REPORTING / EXPORT DESIGN

### 11.1 Report Types

#### **Report 1: Content Inventory Report**
- **Purpose:** Summary of all advertising content and status
- **Columns:** Content Code, Name, Category, Start Date, End Date, Status, Images (count), Creator, Created Date
- **Filters:** Date range, Status, Category, Creator
- **Export:** Excel, PDF, CSV
- **Sorting:** Any column

#### **Report 2: Registration Status Report**
- **Purpose:** Workflow visibility—which registrations are where in approval chain
- **Columns:** Reg Code, Program Name, Status, Days in Current Status, Budget, Total, Current Approver, Creator
- **Filters:** Status (multi-select), Date range, Unit/Department, Creator
- **Export:** Excel, PDF
- **Sorting:** Status, Days in Status DESC

#### **Report 3: Item Inventory Report**
- **Purpose:** Complete inventory of physical advertising items
- **Columns:** Item Code, Name, Channel, Category, Position, Dimensions (W×L), Status, Created Date
- **Filters:** Channel, Category, Position, Province, Status, Date range
- **Export:** Excel, CSV, PDF
- **Sorting:** Item Code, Status

#### **Report 4: Location Directory Report**
- **Purpose:** Master list of all advertising positions
- **Columns:** Position Code, Position Name, Channel, Province, Zone, Address, Rep 1 (name+phone), Status
- **Filters:** Channel, Province, Zone, Status
- **Export:** Excel, PDF, CSV
- **Sorting:** Position Code, Province

#### **Report 5: Approval Workflow Report**
- **Purpose:** Track registration progress through approval steps
- **Columns:** Reg Code, Program Name, Current Status, Days in Current Step, Pending With (approver), Next Step, Expected Completion
- **Filters:** Status, Days > (threshold), Pending With
- **Export:** Excel, PDF
- **Sorting:** Days DESC, Status

#### **Report 6: Deployment Completion Report**
- **Purpose:** Track deployments completed vs. pending
- **Columns:** Reg Code, Program Name, Items (count), Deployed (count), % Complete, Deployment Images (count), Completion Date
- **Filters:** Date range, Completion status, Unit/Department
- **Export:** Excel, PDF
- **Sorting:** % Complete, Completion Date DESC

#### **Report 7: Audit Trail Extract**
- **Purpose:** Full audit trail for compliance
- **Columns:** Timestamp, User, Entity Type, Entity Code, Action, Old Value, New Value, Reason
- **Filters:** Date range, Entity Type, User, Action Type, Entity Code
- **Export:** Excel, CSV (with line breaks preserved)
- **Sorting:** Timestamp DESC

#### **Report 8: Budget Analysis Report**
- **Purpose:** Budget tracking and variance analysis
- **Columns:** Reg Code, Program Name, Budget Estimate, Total Amount, Variance ($), Variance (%), Category (details), Creator
- **Filters:** Date range, Variance range (under/over), Unit/Department
- **Export:** Excel, PDF
- **Sorting:** Variance DESC

### 11.2 Export Configuration

**Supported Formats:**
- **Excel (.xlsx):** Formatted, colorized headers, auto-width columns
- **PDF (.pdf):** Print-friendly, page breaks, footer with timestamp
- **CSV (.csv):** RFC 4180 compliant, UTF-8 encoded

**Export Features:**
- Column selection (user can choose which columns to include)
- Custom header names
- Timestamp in footer: "Generated [date] by [user]"
- Page numbers (for PDF)
- Conditional formatting (e.g., highlight overdue items)

**Scheduled Exports:**
- User can schedule daily/weekly email delivery of reports
- System generates and emails in background

---

## L. SUGGESTED API DESIGN

### 12.1 API Endpoint Structure

```
BASE_URL: /api/v1

├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── POST /refresh-token
│
├── /content
│   ├── GET /content (list)
│   ├── POST /content (create)
│   ├── GET /content/:id (read)
│   ├── PUT /content/:id (update)
│   ├── DELETE /content/:id (soft delete)
│   ├── POST /content/:id/clone (clone)
│   ├── GET /content/:id/history (audit)
│   └── POST /content/search (advanced search)
│
├── /locations
│   ├── GET /locations (list)
│   ├── POST /locations (create)
│   ├── GET /locations/:id (read)
│   ├── PUT /locations/:id (update)
│   ├── DELETE /locations/:id (soft delete)
│   ├── PUT /locations/:id/status (update status with validation)
│   ├── GET /locations/:id/history (audit)
│   └── POST /locations/search (advanced search)
│
├── /channels
│   ├── GET /channels (list)
│   ├── POST /channels (create)
│   ├── PUT /channels/:id (update)
│   └── DELETE /channels/:id
│
├── /categories
│   ├── GET /categories (list)
│   ├── POST /categories (create)
│   ├── PUT /categories/:id (update)
│   ├── PUT /categories/:id/price (update price with impact analysis)
│   ├── PUT /categories/:id/status (update status with validation)
│   ├── GET /categories/:id/history (audit)
│   └── DELETE /categories/:id
│
├── /items
│   ├── GET /items (list)
│   ├── POST /items/batch-create (bulk create)
│   ├── GET /items/:id (read)
│   ├── PUT /items/:id (update)
│   ├── DELETE /items/:id
│   ├── PUT /items/:id/status (update status)
│   ├── GET /items/:id/history (audit)
│   └── POST /items/search (advanced search)
│
├── /registrations
│   ├── GET /registrations (list)
│   ├── POST /registrations (create)
│   ├── GET /registrations/:id (read)
│   ├── PUT /registrations/:id (update)
│   ├── DELETE /registrations/:id (soft delete)
│   ├── POST /registrations/:id/submit (submit for approval)
│   ├── POST /registrations/:id/clone (clone)
│   ├── GET /registrations/:id/history (workflow history)
│   ├── POST /registrations/search (advanced search)
│   └── GET /registrations/:id/export (export as Excel/PDF)
│
├── /registrations/:id/workflow
│   ├── GET / (get current state and available actions)
│   ├── POST /approve (execute approval transition)
│   ├── POST /reject (request revision)
│   ├── POST /accept-deployment (mark for deployment)
│   ├── POST /submit-acceptance (submit deployment acceptance)
│   ├── POST /approve-acceptance (final approval)
│   └── POST /complete (complete registration)
│
├── /registrations/:id/items
│   ├── GET / (list items in registration)
│   ├── POST / (add item to registration)
│   ├── PUT /:itemId (update item in registration)
│   ├── DELETE /:itemId (remove item from registration)
│   └── POST /:itemId/upload-deployment-image (acceptance phase)
│
├── /audit
│   ├── GET /logs (list audit logs)
│   ├── GET /logs/:entityType/:entityId (entity history)
│   ├── POST /logs/search (advanced audit search)
│   └── GET /logs/export (export audit trail)
│
├── /reports
│   ├── GET /reports (list available reports)
│   ├── POST /reports/:reportType/generate (generate report)
│   ├── POST /reports/:reportType/export (export report)
│   └── GET /reports/:reportType/template (get report config)
│
├── /users
│   ├── GET /users (list - admin only)
│   ├── POST /users (create - admin)
│   ├── PUT /users/:id (update - admin)
│   ├── DELETE /users/:id (delete - admin)
│   ├── POST /users/:id/reset-password (admin)
│   └── PUT /users/me/password (change own password)
│
└── /health
    └── GET / (health check)
```

### 12.2 Request/Response Patterns

#### **Standard Success Response**
```json
{
  "ok": true,
  "data": { /* payload */ },
  "timestamp": "2026-05-24T14:30:00Z"
}
```

#### **Standard Error Response**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "details": [
      {
        "field": "budget_estimate",
        "message": "Must be > 0"
      }
    ]
  },
  "timestamp": "2026-05-24T14:30:00Z"
}
```

#### **Paginated List Response**
```json
{
  "ok": true,
  "data": [ /* array */ ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 147,
    "pages": 6
  },
  "timestamp": "2026-05-24T14:30:00Z"
}
```

### 12.3 Key Endpoint Examples

#### **POST /registrations/:id/workflow/approve**
```json
Request:
{
  "action": "APPROVE",
  "reason": "Approved by supervisor",
  "guardValidation": true
}

Response (Success):
{
  "ok": true,
  "data": {
    "registration_id": "uuid",
    "from_state": "SUPERVISOR_REVIEW",
    "to_state": "BRAND_ACCEPTANCE",
    "transition_at": "2026-05-24T14:30:00Z"
  }
}

Response (Guard Failed):
{
  "ok": false,
  "error": {
    "code": "GUARD_FAILED",
    "message": "Cannot approve: total amount exceeds budget",
    "guardFailures": ["REGISTRATION_TOTAL_WITHIN_BUDGET"]
  }
}
```

#### **POST /registrations/:id/items/:itemId/upload-deployment-image**
```json
Request:
{
  "status": "ACTIVE",  // or "INACTIVE"
  "note": "Deployment completed successfully",  // required if INACTIVE
  "image": <binary file data>
}

Response:
{
  "ok": true,
  "data": {
    "item_id": "uuid",
    "deployment_image_url": "https://s3.../image.jpg",
    "status": "ACTIVE",
    "uploaded_at": "2026-05-24T14:30:00Z"
  }
}
```

---

## M. RECOMMENDED MVP SCOPE

### 13.1 MVP Feature Set (v1.0 - Minimal Viable Product)

**Core Modules Included:**
- User authentication and basic role-based access
- Advertising Content master (CRUD, search)
- Location management (CRUD, search)
- Category management (CRUD, search, price update with warning)
- Physical Item management (list, batch create, edit, search)
- Registration creation and simple editing
- 8-step workflow with state machine
- Deployment acceptance (photos + status + notes)
- Basic audit trail (log all changes)
- Export to Excel (basic reports)

**MVP Screens (13 total):**
1. Login
2. Dashboard / Home
3. Advertising Content List / Detail / Create / Edit
4. Location List / Detail / Create / Edit
5. Category List / Detail / Create / Edit
6. Physical Item List / Detail / Batch Create / Edit
7. Registration List
8. Registration Create / Edit / Detail
9. Workflow Actions (inline approval, revision, etc.)
10. Deployment Acceptance (photo upload)
11. Audit Trail
12. Export Report
13. User Profile / Settings

**MVP Database:**
- Users, Departments, Roles/Permissions
- Channels, Categories, Locations, PhysicalItems
- AdvertisingContent, ContentImages
- Registrations, RegistrationContent, RegistrationItems, RegistrationApprovals
- DeploymentAcceptance
- AuditLog

**NOT Included in MVP:**
- AI image recognition
- Advanced reporting dashboard
- Scheduled exports
- Role hierarchy management UI (scripted only)
- Mobile app (web only)
- Duplicate detection
- Advanced filtering/aggregation

### 13.2 MVP Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Backend** | 2-3 weeks | API endpoints, state machine, validations, database |
| **Phase 2: Frontend** | 2-3 weeks | UI screens matching design, form handling, workflow UI |
| **Phase 3: Integration** | 1-2 weeks | End-to-end testing, bug fixes, performance optimization |
| **Phase 4: UAT & Deploy** | 1-2 weeks | User acceptance testing, documentation, production setup |

---

## N. PHASE 2 AI ENHANCEMENT ROADMAP

### 14.1 AI Capabilities for Future Phases

#### **Phase 2A: Image-Based Recognition (Weeks 1-4 post-MVP)**

**Capability:** Auto-verify physical items from deployment photos

**Use Cases:**
1. **Item Recognition:** Upload photo → AI identifies item type (LED screen, banner, etc.)
2. **Location Verification:** Compare GPS + photo vs. location record
3. **Quality Assessment:** Detect if item damaged, missing, or misplaced

**Technical Implementation:**
- Integration with cloud vision API (Google Cloud Vision / AWS Rekognition)
- Fine-tuned model trained on advertising asset images
- Confidence threshold → flag for manual review if uncertain

**Business Impact:**
- Faster deployment acceptance
- Reduce manual verification errors
- Data quality improvement

---

#### **Phase 2B: Smart Content Classification (Weeks 5-8 post-MVP)**

**Capability:** Auto-suggest content category and tags

**Use Cases:**
1. **Category Prediction:** Upload image → suggest category (LED, light box, etc.)
2. **Auto-Tagging:** Extract text from image → auto-fill description
3. **Content Similarity:** Flag duplicate/near-duplicate content

**Technical Implementation:**
- Pre-trained CNN (ResNet50) + transfer learning
- OCR for text extraction
- Similarity scoring (cosine distance on embeddings)

**Business Impact:**
- Faster content creation
- Reduce duplicate entries
- Better searchability

---

#### **Phase 2C: Deployment Validation (Weeks 9-12 post-MVP)**

**Capability:** Validate deployment images vs. requirements

**Use Cases:**
1. **Before/After Comparison:** Compare old item image vs. deployment photo
2. **Placement Verification:** Confirm item in correct location
3. **Image Quality Scoring:** Detect blurry, dark, or incomplete photos

**Technical Implementation:**
- Image comparison algorithms (SIFT, SURF)
- YOLO for object detection and positioning
- Image quality metrics

**Business Impact:**
- Automated acceptance validation
- Reduce acceptance delays
- Data quality guarantee

---

#### **Phase 3A: Predictive Approval Insights**

**Capability:** Predict registration approval flow and flag risks

**Use Cases:**
1. **Risk Scoring:** ML model predicts likelihood of revision/rejection
2. **Bottleneck Detection:** Identify slow approval steps
3. **Timeline Prediction:** Estimate days to completion

**Technical Implementation:**
- Logistic regression / Random Forest on historical workflow data
- Feature engineering: budget deviation, item complexity, approver history
- Time-series forecasting

**Business Impact:**
- Proactive management of slow registrations
- Better resource planning
- Improved workflow efficiency

---

### 14.2 AI Architecture

```
┌────────────────────────────────────┐
│   AI Service Layer                 │
│  ┌──────────────────────────────┐  │
│  │ Model Inference Service      │  │
│  │ - Image Recognition          │  │
│  │ - Content Classification     │  │
│  │ - Deployment Validation      │  │
│  │ - Predictive Analytics       │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
           ↓
   ┌───────────────────┐
   │ Async Job Queue   │
   │ (Redis/RabbitMQ)  │
   └───────────────────┘
           ↓
┌────────────────────────────────────┐
│  External AI Services              │
│  - Google Cloud Vision             │
│  - AWS Rekognition                 │
│  - Custom ML Models (TensorFlow)   │
└────────────────────────────────────┘
```

### 14.3 AI Integration Points

| Feature | Screen | Trigger | AI Action | Output |
|---------|--------|---------|-----------|--------|
| **Item Recognition** | Deployment Acceptance | Upload photo | Call vision API | Verify item type, show confidence |
| **Content Classification** | Content Create | Upload image | Call classification model | Suggest category, tags |
| **Deployment Validation** | Deployment Acceptance | Submit images | Image comparison | Flag if image quality low or misplaced |
| **Approval Prediction** | Registration List | Filter view | Run forecast model | Show risk score, estimated days |
| **Duplicate Detection** | Content Search | List view | Compare embeddings | Show potential duplicates |
| **Auto-Tagging** | Content Create | Upload image | OCR + NLP | Extract text, populate description |

---

## O. RISKS / EDGE CASES / TECHNICAL CONCERNS

### 15.1 Risk Assessment

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|-----------|
| **Data Integrity** (orphaned registrations if item deleted) | HIGH | HIGH | Implement CASCADE delete + audit trail for recovery |
| **Performance** (slow queries with 10K+ items) | MEDIUM | MEDIUM | Index item_code, location_id, status; pagination; caching |
| **Concurrent Edits** (users editing same registration simultaneously) | HIGH | LOW | Implement optimistic locking + version control |
| **Status Propagation** (category status change affects 1000s of items) | MEDIUM | MEDIUM | Async job queue for batch updates; cache invalidation |
| **Workflow State Corruption** (invalid state transitions) | HIGH | VERY LOW | State machine validation + exhaustive testing |
| **Image Storage** (S3 quota, cost, retrieval speed) | MEDIUM | MEDIUM | CDN caching, image compression, lifecycle policies |
| **Export Performance** (generating large reports) | MEDIUM | MEDIUM | Async report generation, streaming to file |
| **Approval Chain Break** (approver deleted mid-workflow) | MEDIUM | LOW | Soft delete users; maintain audit trail of deleted approvers |

### 15.2 Edge Cases

#### **Edge Case 1: Item Added During Approval**
**Scenario:** User adds new item to registration while BRAND_ACCEPTANCE step

**Current Handling:** Not allowed—item list locked

**Alternative:** Allow adding items, but new items get "PENDING" status until validated

**Decision:** **Implement as locked** (per requirements)

---

#### **Edge Case 2: Price Update During Approval**
**Scenario:** Category price updates while registration in approval phase

**Current Handling:** Only affects registrations in Steps 1-4

**Question:** What if registration is exactly at step 4 boundary?

**Decision:** If status ≥ BRAND_MANAGER_APPROVAL → prices locked; prices not updated

---

#### **Edge Case 3: Expired Content Reused**
**Scenario:** User edits registration and changes content to an expired content

**Current Spec:** Existing content popup shows only non-expired content

**Decision:** Enforce: cannot select expired content in edit

---

#### **Edge Case 4: Item Reused in Multiple Registrations**
**Scenario:** Same physical item selected in 2 simultaneous registrations

**Issue:** If item marked "Treo" in one registration, affects both

**Decision:** Item status is global, not per-registration. During acceptance, item status changed globally (affects all registrations)

**Mitigation:** Log which registrations affected by item status change

---

#### **Edge Case 5: Revision Loop**
**Scenario:** Registration alternates between CBNV_REVISION and approvals multiple times

**Concern:** Audit trail becomes very long

**Decision:** Allow unlimited revisions; audit trail captures all (limit to 100 transitions per registration for UI display)

---

#### **Edge Case 6: Concurrent Deployment Acceptance**
**Scenario:** Two BRAND users uploading deployment images for same registration simultaneously

**Current:** Sequential saves (last write wins)

**Decision:** Implement optimistic locking; show "conflict" dialog; merge changes with user confirmation

---

#### **Edge Case 7: Category Deactivated with Active Items**
**Scenario:** Category deactivated while items still active in current registrations

**Current Handling:** Block deactivation if items "Treo"

**Question:** What about items in "ACTIVE" status but in current registration?

**Decision:** Check for "Treo" only; if no "Treo", cascade to inactive and warn user

---

#### **Edge Case 8: Location Deleted**
**Scenario:** Location record deleted while items and registrations reference it

**Mitigation:**
- Implement soft delete (mark deleted_at, don't hard delete)
- Maintain referential integrity with FK constraints
- Audit trail tracks deletion

---

#### **Edge Case 9: User Workflow Role Changed**
**Scenario:** User's role changed from APPROVER to INPUTTER mid-approval

**Current:** Role checked at action time, not at state entry time

**Decision:** Reject action if role changed; show error "Your role has changed and you no longer have permission"

---

### 15.3 Technical Concerns

#### **Concern 1: State Machine Complexity**
**Issue:** 8 states, multiple actions per state, many guard conditions

**Mitigation:**
- Centralize state machine in single service
- Comprehensive unit tests for all transitions
- Use established state machine library (xstate, etc.)
- Clear documentation of all transitions

#### **Concern 2: Database Scaling**
**Issue:** AuditLog table grows indefinitely (1 entry per change × 10K registrations)

**Mitigation:**
- Archive old audit logs (>1 year) to cold storage
- Index audit_log by entity_type + entity_id + changed_at
- Consider time-series database (InfluxDB) for metrics

#### **Concern 3: Soft Delete Complexity**
**Issue:** Soft deletes require filtering on deleted_at in all queries

**Mitigation:**
- Create database views with soft-delete filters built in
- ORM level handling (Sequelize, TypeORM soft delete feature)
- Document soft delete strategy

#### **Concern 4: Image Storage & Bandwidth**
**Issue:** 10 images per content × 10K content + deployment images

**Mitigation:**
- S3 with intelligent tiering
- CloudFront CDN for distribution
- Image compression on upload (ImageMagick)
- Lifecycle policy: 6-month retention then archive

#### **Concern 5: Concurrent Update Conflicts**
**Issue:** Multiple users editing same registration → data loss

**Mitigation:**
- Implement optimistic locking (version field)
- Or pessimistic locking (row-level locks)
- Show "form modified" warning if stale data detected
- Support merge/conflict resolution

#### **Concern 6: API Rate Limiting**
**Issue:** Bulk operations (export, batch create) could overwhelm API

**Mitigation:**
- Implement rate limiting (token bucket algorithm)
- Queue long-running operations (async jobs)
- Streaming responses for large exports
- Document API limits per endpoint

#### **Concern 7: Error Recovery**
**Issue:** Registration in invalid state due to failed transaction

**Mitigation:**
- Idempotent operations (safe to retry)
- Distributed transactions with rollback
- Explicit error handling per operation
- Manual state recovery tools (admin panel)

---

### 15.4 Open Technical Questions

**Question 1:** Should we use event sourcing for audit trail, or traditional AuditLog table?
- **Event Sourcing:** More flexible, complete history, but complex
- **AuditLog Table:** Simple, familiar, sufficient for MVP
- **Decision:** AuditLog table for MVP; revisit if immutability requirements emerge

**Question 2:** How to handle image versioning when item image replaced during deployment?
- **Option A:** Keep old image, add new_image column (recommended)
- **Option B:** Archive old image to S3, keep URL pointer
- **Decision:** Option A for MVP (simpler); Option B if storage becomes concern

**Question 3:** Should registration workflow states be stored in a separate state_history table or inline?
- **Option A:** Inline (current_state column) + separate RegistrationApprovals table
- **Option B:** Event log model (pure event sourcing)
- **Decision:** Option A for MVP (simpler to query current state)

**Question 4:** How to notify users of pending approvals?
- **Option A:** In-app notifications (polling/WebSocket)
- **Option B:** Email notifications (cron job)
- **Option C:** Both
- **Decision:** Email for MVP; WebSocket for Phase 2

**Question 5:** Should category price changes generate a new price version record?
- **Option A:** Yes, maintain pricing history per category
- **Option B:** No, just update current price in AuditLog
- **Decision:** Option A (recommended); create CategoryPricingHistory table

---

### 15.5 Security & Compliance Concerns

| Concern | Mitigation |
|---------|-----------|
| **Data Exposure** (sensitive ads, budgets visible to unauthorized users) | Implement row-level security; validate permissions on every query |
| **Audit Trail Tampering** (immutable audit log requirement) | Implement append-only audit log; consider blockchain for critical logs |
| **Session Hijacking** (role-based actions on stolen session) | Implement JWT with short expiry; optional 2FA |
| **SQL Injection** (parameterized queries) | Use ORM (TypeORM, Sequelize) + parameterized queries; validate input |
| **CSRF** (cross-site request forgery) | Implement CSRF tokens for state-changing operations |
| **Rate Limiting** (DDoS protection) | Implement per-IP and per-user rate limits |

---

## SUMMARY & RECOMMENDATIONS

### Implementation Priority

**Phase 1 (MVP - 4-6 weeks):**
1. Backend API + database schema
2. Authentication & authorization
3. Master data management (content, location, category, item)
4. Registration creation & editing
5. Workflow state machine
6. Basic deployment acceptance
7. Audit logging & export

**Phase 2 (Enhancement - 2-3 weeks post-MVP):**
1. AI image recognition
2. Advanced reporting dashboard
3. Scheduled exports / email notifications
4. Role hierarchy management UI
5. Performance optimization & caching

**Phase 3 (Scaling - After Phase 2):**
1. Mobile app
2. Advanced analytics & dashboards
3. Workflow automation (auto-approve based on rules)
4. Integration with third-party systems

### Key Success Factors

1. **Strict workflow validation** - State machine must be bulletproof
2. **Comprehensive audit trail** - Every change must be logged
3. **Clear error messaging** - Users need to understand why actions fail
4. **Performance** - Queries must complete within 2 seconds
5. **Data quality** - Prevent orphaned, inconsistent data
6. **User training** - Clear documentation of workflow and expected behaviors

---

## END OF SPECIFICATION

**Next Step:** Distribute to development team for technical design and implementation planning.

