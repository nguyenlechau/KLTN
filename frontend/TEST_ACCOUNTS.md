# Test Accounts - Quick Reference

## How to Use Test Accounts

All test accounts are automatically seeded in the database with **password: `password`**

Simply log in using any of the accounts below:

---

## 👑 ADMIN (User Management)
**Email:** admin@example.com  
**Password:** password  
**Permissions:** All permissions (user management, audit logs, full system access)  
**Use Case:** System administrators managing users and system configuration  
**Access:** Use this to go to **Menu → Admin → Users** to create/edit/delete users

---

## 1️⃣ INPUTTER (Branch)
**Email:** inputter@example.com  
**Password:** password  
**Permissions:** Create/edit content, create/submit registrations, view master data  
**Use Case:** Branch-level staff who creates and submits campaign registration forms  
**Workflow step:** Creates Draft → submits to CBQL approval

---

## 2️⃣ INPUTTER_HO (Head Office)
**Email:** inputter-ho@example.com  
**Password:** password  
**Permissions:** Same as INPUTTER (head-office scope)  
**Use Case:** Head-office staff who creates and submits campaign registrations  
**Note:** If creator is INPUTTER_HO (role BRAND or HO), supervisor step may be skipped

---

## 3️⃣ APPROVER (Branch Management / CBQL)
**Email:** approver@example.com  
**Password:** password  
**Permissions:** Review and approve registrations from branch inputters, view audit logs  
**Use Case:** Branch management approving submitted drafts (Step 2: CBQL Phê duyệt)  
**Workflow step:** Approves Draft → moves to Brand Intake, or sends back for revision

---

## 4️⃣ APPROVER_HO (HO Management)
**Email:** approver-ho@example.com  
**Password:** password  
**Permissions:** Same as APPROVER (head-office scope)  
**Use Case:** HO management approving HO-submitted registrations

---

## 5️⃣ BRAND (Brand Team)
**Email:** brand@example.com  
**Password:** password  
**Permissions:** Full master data management (channels, locations, categories, items, content) + brand intake step for registrations  
**Use Case:** Brand team who manages all master data AND handles the brand intake step in the registration workflow  
**Workflow step:** Handles Step 3 (P.Thương hiệu tiếp nhận) — can edit items, content, and approve to Brand Manager

---

## 6️⃣ BRAND_MANAGER (Brand Manager)
**Email:** brand-manager@example.com  
**Password:** password  
**Permissions:** View-only for master data + final registration approval (locks pricing)  
**Use Case:** Brand manager who gives the final sign-off before campaign is approved  
**Workflow step:** Handles Step 4 (Trưởng phòng thương hiệu phê duyệt) — locks unit price and total amount

---

## Workflow Summary

| Step | State | Handled by |
|------|-------|-----------|
| 1 | DRAFT | INPUTTER / INPUTTER_HO |
| 2 | SUPERVISOR_REVIEW | APPROVER / APPROVER_HO |
| 3 | BRAND_ACCEPTANCE | BRAND |
| 4 | BRAND_MANAGER_APPROVAL | BRAND_MANAGER |
| 5 | APPROVED | BRAND |
| 6 | ACCEPTANCE | BRAND |
| 7 | ACCEPTANCE_REVIEW | BRAND_MANAGER |
| — | COMPLETED | system |

---

## Permission Matrix

| Role | Master Data (Channels/Locations/Categories/Items/Content) | Registrations |
|------|------|------|
| **ADMIN** | Create, Edit, View | All workflow steps |
| **INPUTTER** | View only | Create, Edit own drafts, Submit |
| **INPUTTER_HO** | View only | Create, Edit own drafts, Submit |
| **APPROVER** | View only | Review/approve at Step 2 |
| **APPROVER_HO** | View only | Review/approve at Step 2 |
| **BRAND** | **Create + Edit + View** | Brand intake (Step 3), Acceptance (Steps 5–6) |
| **BRAND_MANAGER** | View only | Brand manager approval (Step 4), Acceptance review (Step 7) |

