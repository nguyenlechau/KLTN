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
## 1️⃣ REQUESTER
**Email:** requester@example.com  
**Password:** password  
**Permissions:** Create content, register campaigns, submit for review  
**Use Case:** Campaign creators submitting new campaigns

---

## 2️⃣ CENTRAL_REQUESTER
**Email:** central-requester@example.com  
**Password:** password  
**Permissions:** Same as REQUESTER (central coordination)  
**Use Case:** Central office campaign coordinators

---

## 3️⃣ SUPERVISOR
**Email:** supervisor@example.com  
**Password:** password  
**Permissions:** Review campaigns, view audit logs  
**Use Case:** Local supervisors reviewing submitted campaigns

---

## 4️⃣ CENTRAL_SUPERVISOR
**Email:** central-supervisor@example.com  
**Password:** password  
**Permissions:** Same as SUPERVISOR (central review authority)  
**Use Case:** Central office review team

---

## 5️⃣ OPERATIONS_SPECIALIST
**Email:** operations-specialist@example.com  
**Password:** password  
**Permissions:** Create physical items, accept campaigns for deployment  
**Use Case:** Field operations specialists preparing deployments

---

## 6️⃣ OPERATIONS_MANAGER
**Email:** operations-manager@example.com  
**Password:** password  
**Permissions:** Approve campaigns, complete deployments  
**Use Case:** Operations management for final campaign approvals

---

## Testing Workflow

### Step 0: ADMIN - User Management (Optional)
- Log in with admin@example.com / password
- Navigate to **Admin → Users** (👥 Users link in sidebar)
- Create new users with different roles
- Edit user details (email, name, role, status)
- Delete users and verify they're soft-deleted

### Step 1: REQUESTER
- Log in with requester@example.com / password
- Create a new campaign in "📋 New Campaign"
- Create content and select items

### Step 2: SUPERVISOR
- Log in with supervisor@example.com / password
- Navigate to "📊 Campaigns" to review submitted campaigns
- Approve or request revisions

### Step 3: OPERATIONS_SPECIALIST
- Log in with operations-specialist@example.com / password
- View approved campaigns
- Create physical items in "🔨 Create Items"

### Step 4: OPERATIONS_MANAGER
- Log in with operations-manager@example.com / password
- Approve final campaign details
- Mark campaigns as complete

---

## Permission Matrix

| Role | Permissions |
|------|------------|
| **REQUESTER** | channel.view, category.view, location.view, content.view, content.create, content.update, content.clone, physical_item.view, registration.view, registration.create, registration.update, registration.submit |
| **CENTRAL_REQUESTER** | Same as REQUESTER |
| **SUPERVISOR** | channel.view, category.view, location.view, content.view, physical_item.view, registration.view, registration.review, audit.view |
| **CENTRAL_SUPERVISOR** | Same as SUPERVISOR |
| **OPERATIONS_SPECIALIST** | channel.view, category.view, location.view, content.view, physical_item.view, physical_item.create, physical_item.update, registration.view, registration.review, registration.accept, audit.view |
| **OPERATIONS_MANAGER** | channel.view, category.view, location.view, content.view, physical_item.view, registration.view, registration.approve, registration.complete, audit.view |

