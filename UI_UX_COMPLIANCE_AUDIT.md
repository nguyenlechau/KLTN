# CMS Physical Ads - UI/UX Compliance Testing Report

**Date**: May 26, 2026  
**Requirement Source**: Original Enterprise Specification  
**Current Build**: Screenshots provided  
**Status**: DETAILED AUDIT IN PROGRESS

---

## 📋 Testing Checklist by Module

### MODULE 1: ADVERTISING CONTENT MANAGEMENT
**Specification Reference**: Section 1 (1.1-1.4)

#### Screenshot Analysis: "Campaign's Content" List & Detail Pages

**SEARCH FUNCTIONALITY (Spec 1.1)**
- ✅ List page shows search box ("Search box on Content Name")
- ✅ Advanced search appears available (filter icon visible)
- ❌ **MISSING**: Advanced search fields NOT visible in current view:
  - Content Code (not shown in search controls)
  - Status filter (Còn hạn/Hết hạn) - not visible in search
  - Category (not in search UI)
  - Department/Unit (not in search controls)

**LIST DISPLAY FIELDS (Spec 1.2)**
Expected fields per spec:
- Content Code ✅ (shown as ID in list)
- Advertising Content Name ✅ (shown as "Content Name")
- Description ✅ (shown)
- Category ❌ **MISSING FROM TABLE**
- Key Visual Images ✅ (shown with thumbnail, multiple images indicated)
- End Date ✅ (shown as "End date")
- Creator ✅ (shown)
- Status (Còn hạn/Hết hạn) ✅ (shown in rightmost column - green "Relevant", red "Expired")

**ISSUES FOUND - List View:**
1. ❌ Category column NOT in grid - spec requires it as display field
2. ❌ Start date column missing (spec requires both start and end date)
3. ⚠️ Status display uses English terms "Expired/Relevant" instead of Vietnamese "Hết hạn/Còn hạn"
4. ✅ Image gallery behavior correct (thumbnail shown)
5. ✅ Pagination shows "Total: 123"

**CREATE/EDIT FORM (Spec 1.3)**
Expected fields:
- Content Code ✅ (shown as "Content ID: 001" - non-editable)
- Advertising Content Name ✅ (text input with "Placeholder" shown)
- Key Visual Images ✅ (multi-image upload shown with thumbnails and + button)
- Description ✅ (text field)
- Category ✅ (appears to be a field, labeled "Content type" - **NAMING ISSUE**)
- Unit ✅ (shown as "Department" - auto-filled)
- Start Date ✅ (field visible - "Start date" with dd/mm/yyyy format shown)
- End Date ✅ (field visible)
- Creator ⚠️ (system-filled but not shown in form screenshot)
- Status ⚠️ (system-driven, not visible in form)

**ISSUES FOUND - Create/Edit Form:**
1. ❌ **NAMING MISMATCH**: "Content type" label should be "Category" per spec
2. ❌ **FIELD NAMING**: "Department" shown but spec calls it "Unit"
3. ❌ **MISSING**: Start Date field shows only as label, no actual input visible in screenshot
4. ⚠️ Description field shown but max 225 chars validation not visible
5. ✅ Image upload shows max 5MB and multiple image support
6. ⚠️ Category dropdown options not visible - cannot verify against spec list (Thương hiệu mẹ, RB-CTKM, etc.)

**STATUS RULES (Spec 1.3)**
- Status rules for "Còn hạn"/"Hết hạn" based on dates
- ❌ **NOT TESTABLE** from current screenshots - form doesn't show status field or its behavior

**VALIDATION RULES (Spec 1.3-1.4)**
- Content Code: Required, system-generated ✅
- Name: Required, 1-225 chars, no all-space ❌ **VALIDATION NOT VISIBLE**
- Key Visual: Required, JPEG/PNG, up to 10, max 5MB each ⚠️ (shows max 5MB but upload limit count not visible)
- Description: Max 225 chars ❌ **NO CHAR COUNTER VISIBLE**
- Category: Required ✅ (appears required)
- Unit: Auto-filled ✅ (Department auto-filled)
- Dates: Start < End validation ❌ **NOT VISIBLE IN SCREENSHOTS**
- Status: System-driven ✅ (logic exists but not displayed)

**OVERALL SCORE - Module 1: 55/100**
- Core fields present but naming inconsistencies
- Advanced search controls missing
- Form validations not visible
- Status display terminology inconsistent with spec

---

### MODULE 2: ADVERTISING REGISTRATION MANAGEMENT
**Specification Reference**: Section 2 (2.1-2.5)

#### Screenshot Analysis: "POSM Registration" List & Detail Pages

**SEARCH FUNCTIONALITY (Spec 2.1)**
Current UI shows:
- ✅ Search box for program name
- ⚠️ Status dropdown visible (but with different labels)
- ❌ **MISSING**: Advanced search fields not visible
  - Registration Code (not in search)
  - Category (not in search)
  - Unit (not in search)
  - Creator username (not in search)

**LIST DISPLAY FIELDS (Spec 2.2)**
Expected vs Actual:
- Registration Code ✅ (shown as ID)
- Program Name ✅ (shown as "Campaign Name")
- Budget Estimate ✅ (shown as "Budget")
- IO Code ❌ **NOT VISIBLE IN LIST** (spec requires "IO Code")
- Start Date ✅ (shown)
- End Date ✅ (shown)
- Submission Document ❌ **NOT VISIBLE** (spec requires this field)
- Unit ⚠️ (not visible - may be hidden)
- Category ❌ **NOT VISIBLE IN LIST**
- Key Visual Images ✅ (shown as thumbnail)
- Created Date ✅ (shown as "Create date")
- Creator ✅ (shown)
- Status ⚠️ (shown but possibly with different labeling)

**CRITICAL ISSUES - List View:**
1. ❌ **MISSING COLUMNS**: IO Code, Submission Document, Category not shown
2. ⚠️ **STATUS LABELING**: Current shows "Approved", "Supervisor Review", "Draft" but spec uses Vietnamese terms
3. ⚠️ **INCOMPLETE**: Total registrations showing 123, but only 3-4 visible
4. ✅ Edit/Delete actions present (pencil and X icons)

**REGISTRATION FORM - SECTION A: Registration Information (Spec 2.3-A)**
Expected fields:
- Program Name* ✅ (labeled as "Campaign name")
- Budget Estimate* ✅ (shown as "Budget")
- IO Number ❌ **NOT VISIBLE IN CURRENT SCREENSHOT**
- Start Date* ✅ (visible)
- End Date* ✅ (visible)
- Submission Document ❌ **NOT VISIBLE**

**REGISTRATION FORM - SECTION B: Advertising Content (Spec 2.3-B)**
Expected:
- Display advertising content entry fields
- "Use Existing Content" option ❌ **NOT VISIBLE**
- Create new content option ✅ (implied in form layout)
- Inherited dates from Section A ⚠️ (cannot verify from screenshot)
- Only non-expired content shown ❌ **NOT TESTABLE**

**REGISTRATION FORM - SECTION C: Category/Item Scope (Spec 2.3-C)**
Screenshot shows:
- ✅ "List of POSM Registrations" section visible
- ✅ Channel/Category/Position/Item structure visible
- ✅ Hierarchical display (Location: Hoang Quoc Viet Branch)
- ✅ Item table shows Width, Unit Price, Item Cost
- ✅ "Add more location" link visible
- ✅ Table displays: ID, Product, Unit Price, Current Cost, Delete action

**Issues - Section C:**
1. ⚠️ Selection tree not clearly shown - unclear if user can select Channel → Category → Position → Item as per spec
2. ✅ Funnel logic appears implemented (hierarchical filtering)
3. ✅ Physical item display with width, cost calculations
4. ⚠️ Position selection shows selected locations but unclear if full tree is exposed

**FORM LEVEL ISSUES:**
1. ❌ **MISSING**: IO Number and Submission Document fields not visible
2. ⚠️ **LAYOUT**: Form appears to use tabs (Registrations Info, Campaign's content, Categories/Items) but unclear
3. ⚠️ Budget validation rule (Total Amount > Budget Estimate error) NOT TESTABLE
4. ⚠️ Content persistence rule (new content saved to master) NOT TESTABLE

**OVERALL SCORE - Module 2: 50/100**
- Major fields missing (IO Code, Submission Document)
- Advanced search not implemented
- Form structure differs from spec layout
- Business rules not visible in UI

---

### MODULE 3: LOCATION MANAGEMENT
**Specification Reference**: Section 3 (3.1-3.6)

**Current UI**: Not visible in provided screenshots ❌

**Status**: Cannot test without dedicated Location Management screen

---

### MODULE 4: CHANNEL MANAGEMENT
**Specification Reference**: Section 4

**Current UI**: Not visible in provided screenshots ❌

**Status**: Cannot test

---

### MODULE 5: CATEGORY MANAGEMENT
**Specification Reference**: Section 5 (5.1-5.6)

**Current UI**: Not visible in provided screenshots ❌

**Status**: Cannot test

---

### MODULE 6: PHYSICAL ADVERTISING ITEM MANAGEMENT
**Specification Reference**: Section 6 (6.1-6.7)

**Current UI**: Partially visible in Registration form
- Item Code ✅ (shown in table)
- Item Name ⚠️ (shown in table)
- Width ✅ (shown - "Light Box HNI")
- Length ❌ (not visible in current table)
- Description ❌ (not visible)
- Image ❌ (not visible in item table)
- Status ❌ (not visible)
- Category Code ✅ (LED Screen - visible)
- Position Code ✅ (Hoang Quoc Viet Branch - visible)
- Content Code ❌ (not visible)

**Issues:**
1. ❌ **MISSING COLUMNS**: Length, Description, Image, Status not shown in item display
2. ✅ Item creation appears to happen within registration form (not separate screen)
3. ⚠️ Quantity/Sequence logic not visible
4. ❌ Item code generation rule (PositionCode.CategoryCode.SequenceNo) cannot be verified

**OVERALL SCORE - Module 6: 40/100**
- Too many fields missing from display
- Item management appears incomplete

---

### MODULE 7: WORKFLOW & STATUS MANAGEMENT
**Specification Reference**: Section 7 (7.1-7.3)

**Current UI Observations:**

Status transitions visible in screenshots:
- Status column shows: "Approved", "Supervisor Review", "Draft"
- Expected Vietnamese terms from spec: "Bản nháp", "CBQL Phê duyệt", "P.Thương hiệu tiếp nhận", etc.

**CRITICAL ISSUES:**
1. ❌ **TERMINOLOGY MISMATCH**: English status names instead of Vietnamese spec
2. ❌ **8-STEP WORKFLOW NOT VISIBLE**: Spec requires 8 defined statuses - current shows only 3-4
3. ⚠️ Workflow actions not visible in current screenshots
4. ❌ Role-based action visibility cannot be tested
5. ❌ Status validation rules (e.g., "Cannot submit if any item is Treo") not visible

**OVERALL SCORE - Module 7: 30/100**
- Wrong terminology
- Incomplete workflow implementation

---

### MODULE 8: ROLE & PERMISSION MODEL
**Specification Reference**: Section 8

**Current UI**: User role shows "REQUESTER" in screenshots
- ⚠️ Spec defines: inputter, inputter_HO, approver, approver_HO, BRAND, BRAND_MANAGER
- Current shows: REQUESTER (not matching spec roles)

**Issues:**
1. ❌ **ROLE MISMATCH**: Current role "REQUESTER" not in spec role list
2. ❌ **PERMISSION CONTROLS NOT VISIBLE**: Cannot verify action-level permissions
3. ❌ **SUPERIOR/SUBORDINATE LOGIC NOT TESTABLE**: Spec requires manager approval chain

**OVERALL SCORE - Module 8: 20/100**
- Roles don't match specification

---

### MODULE 9: AUDIT TRAIL / HISTORY
**Specification Reference**: Section 9

**Current UI**: Not visible in screenshots ❌

**Status**: Cannot test - no audit trail interface shown

---

### MODULE 10: REPORTING / EXPORT
**Specification Reference**: Section 10

**Current UI Observations:**
- Each list page shows "Export report" button/link
- ✅ Export function present in both Content and Registration pages
- ❌ Export format not visible (should show Excel, CSV options per spec)
- ❌ Exportable columns not shown/configurable

**Issues:**
1. ⚠️ Export button present but export dialog/options not visible
2. ❌ Export template not shown
3. ❌ Format options (Excel, CSV) not visible

**OVERALL SCORE - Module 10: 40/100**
- Export function exists but incomplete

---

## 📊 COMPREHENSIVE COMPLIANCE SCORING

| Module | Completeness | Correctness | UX Alignment | Overall |
|--------|-------------|------------|-------------|---------|
| 1. Content Management | 70% | 55% | 50% | **58%** |
| 2. Registration Management | 60% | 50% | 45% | **52%** |
| 3. Location Management | 0% | 0% | 0% | **0%** |
| 4. Channel Management | 0% | 0% | 0% | **0%** |
| 5. Category Management | 0% | 0% | 0% | **0%** |
| 6. Item Management | 40% | 40% | 35% | **38%** |
| 7. Workflow/Status | 30% | 20% | 25% | **25%** |
| 8. Roles/Permissions | 30% | 20% | 25% | **25%** |
| 9. Audit Trail | 0% | 0% | 0% | **0%** |
| 10. Reporting/Export | 40% | 40% | 50% | **43%** |
| **OVERALL SYSTEM** | **27%** | **22%** | **23%** | **24%** |

---

## ⚠️ CRITICAL ISSUES - MUST FIX

### Priority 1: Breaking Issues (System Spec Violations)

1. **Role/Workflow Terminology Mismatch**
   - Current: English role "REQUESTER", English statuses
   - Spec: Vietnamese roles (inputter, approver, BRAND, etc.) and Vietnamese statuses
   - Impact: CRITICAL - breaks entire workflow logic
   - Fix: Implement spec-defined roles and Vietnamese status names

2. **Missing Workflow Status Steps**
   - Current: Shows ~4 statuses (Draft, Approved, Supervisor Review, etc.)
   - Spec: Requires 8-step workflow (Bản nháp → CBQL Phê duyệt → P.Thương hiệu → Trưởng phòng → Đã duyệt → Nghiệm thu → Trưởng phòng → Đã nghiệm thu)
   - Impact: CRITICAL - workflow incomplete
   - Fix: Implement full 8-step workflow with proper transitions

3. **Missing Critical Form Fields**
   - Advertising Registration: Missing IO Number, Submission Document
   - Item Management: Missing Length, Description, Image fields
   - Impact: HIGH - data capture incomplete
   - Fix: Add missing fields to forms

4. **Advanced Search Not Implemented**
   - Current: Only fuzzy search on name
   - Spec: Requires filtered search by Code, Status, Category, Unit, Creator
   - Impact: HIGH - usability severely impacted
   - Fix: Implement full advanced search filters

### Priority 2: Naming & Terminology Issues

5. **Field Naming Inconsistencies**
   - "Content type" should be "Category"
   - "Department" should be "Unit"
   - Status: "Expired/Relevant" should be "Hết hạn/Còn hạn"
   - Impact: MEDIUM - confusing for Vietnamese users
   - Fix: Rename all fields per spec

6. **Missing Display Columns**
   - Content List missing: Category, Start Date
   - Registration List missing: IO Code, Submission Document, Category, Unit
   - Item List missing: Length, Description, Image, Status
   - Impact: MEDIUM - users can't see critical data
   - Fix: Add missing columns to all list views

### Priority 3: Business Logic Issues

7. **Validation Rules Not Implemented**
   - Cannot verify character limits, format validation, date validation
   - Impact: MEDIUM - data quality concerns
   - Fix: Implement client-side and server-side validation

8. **Status Workflow Logic Missing**
   - 8-step approval chain not visible
   - Role-based action restrictions not enforced
   - Impact: HIGH - approval workflow broken
   - Fix: Implement complete workflow with role-based permissions

9. **Missing Master Data Management Screens**
   - Locations, Channels, Categories not present in current build
   - Impact: CRITICAL - system incomplete
   - Fix: Implement missing admin screens

---

## 🎯 DETAILED FINDINGS BY SCREEN

### Screen: Advertising Content List
**Expected**: Per Spec 1.2
**Actual**: See first screenshot
**Gaps**:
```
Expected Columns:          Actual Columns:
✅ Content Code           ✅ ID
✅ Content Name           ✅ Content Name
✅ Description            ✅ Description
❌ Category               ❌ (missing)
✅ Key Visual             ✅ Key Visual
✅ End Date               ✅ End date
❌ Start Date             ❌ (missing)
✅ Creator                ✅ Creator
✅ Status                 ✅ Status (but wrong terminology)

Expected Search:          Actual Search:
✅ Fuzzy by name         ✅ Name search visible
❌ Content Code          ❌ (missing)
❌ Status filter         ❌ (missing)
❌ Category filter       ❌ (missing)
❌ Unit/Dept filter      ❌ (missing)
```

**Actions Available** (from screenshots):
- ✅ Edit (pencil icon)
- ✅ Delete (X icon)
- ✅ Export (visible on list)
- ✅ View detail
- ❌ Clone (not visible)
- ❌ History (not visible in list view)

---

### Screen: Advertising Content Detail/Create
**Expected**: Per Spec 1.3
**Actual**: See third screenshot
**Issues**:
1. Form labels don't match spec (Content type vs Category, Department vs Unit)
2. Start Date field position unclear
3. Image upload interface matches spec (multi-image, 5MB limit)
4. Missing validation indicators (char counts, date validation messages)
5. Status field not displayed (should be auto-calculated but visible)
6. Creator field not shown (spec requires system-filled display)

---

### Screen: POSM Registration List
**Expected**: Per Spec 2.2
**Actual**: See first/fourth screenshots
**Critical Gaps**:
```
Expected Columns:        Actual Columns:
✅ Registration Code    ✅ ID (REG-001, etc.)
✅ Program Name          ✅ Campaign Name
✅ Budget Estimate       ✅ Budget
❌ IO Code              ❌ (MISSING - CRITICAL)
✅ Start Date            ✅ Start date
✅ End Date              ✅ End date
❌ Submission Document   ❌ (MISSING - CRITICAL)
❌ Unit                 ❌ (missing from display)
❌ Category             ❌ (missing from display)
✅ Key Visual            ✅ Key Visual Images
✅ Created Date          ✅ Create date
✅ Creator               ✅ Creator
✅ Status                ✅ Status (terminology wrong)
```

---

### Screen: POSM Registration Detail/Create Form
**Expected**: Per Spec 2.3 (3 sections)
**Actual**: See fourth screenshot

**Section A Issues** (Registration Information):
- Program Name ✅
- Budget Estimate ✅
- IO Number ❌ **MISSING**
- Start Date ⚠️ (visible but format unclear)
- End Date ⚠️ (visible but format unclear)
- Submission Document ❌ **MISSING**

**Section B Issues** (Advertising Content):
- Fields appear present but unclear if "Use Existing Content" option exists
- Cannot verify if only non-expired content shown

**Section C Issues** (Category/Item Scope):
- ✅ Hierarchical structure visible (Location → Position → Items)
- ⚠️ Selection mechanism not clearly shown
- ✅ Item table with width and cost
- ❌ Item fields incomplete (missing Length, Description, Image)

---

## 📝 RECOMMENDATIONS

### Immediate Actions (Sprint 1)
1. [ ] Rename all terminology to match Vietnamese spec
2. [ ] Add missing required columns to list views
3. [ ] Add missing form fields (IO Code, Submission Document, etc.)
4. [ ] Implement full 8-step workflow status system
5. [ ] Fix role mapping (REQUESTER → correct spec role)

### Short-term (Sprint 2)
6. [ ] Implement advanced search filters
7. [ ] Create admin screens (Locations, Channels, Categories)
8. [ ] Implement workflow action buttons per role
9. [ ] Add validation messaging and character counters
10. [ ] Implement audit trail screen

### Medium-term (Sprint 3)
11. [ ] Implement export with format options
12. [ ] Add clone functionality
13. [ ] Implement superior/subordinate approval routing
14. [ ] Add item status propagation logic
15. [ ] Implement image comparison for acceptance phase

---

## 📋 NEXT STEPS

1. **Share this report with the UI/UX team**
2. **Prioritize fixes by impact**
3. **Update design mockups to match spec exactly**
4. **Conduct spec alignment workshops**
5. **Create detailed dev tasks from findings**

**Total Compliance Gap: 76% (Current at 24% compliance with specification)**

