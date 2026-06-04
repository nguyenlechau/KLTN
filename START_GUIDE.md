# Start Guide & Test Accounts

## 1. Setup & Run

### Option A — Local (manual)

**Prerequisites:** Node.js 18+, PostgreSQL running on port 5432

```bash
# 1. Setup database
cd backend
bash setup-db.sh        # creates DB, applies all migrations, seeds test data

# 2. Start backend (http://localhost:4000)
npm run dev

# 3. Start frontend (http://localhost:5173)
cd ../frontend
npm run dev
```

### Option B — Docker

```bash
docker-compose up --build
```

Backend → http://localhost:4000  
Frontend → http://localhost:5173 (run separately with `npm run dev` in `/frontend`)

---

## 2. Test Accounts

All passwords are `password`.

| Role | Email | What they can do |
|------|-------|-----------------|
| **ADMIN** | admin@example.com | Full access — user management, system config |
| **INPUTTER** | inputter@example.com | Create/submit registrations (branch) |
| **INPUTTER_HO** | inputter-ho@example.com | Create/submit registrations (head office) |
| **APPROVER** | approver@example.com | Approve registrations from branch inputters |
| **APPROVER_HO** | approver-ho@example.com | Approve registrations from HO inputters |
| **BRAND** | brand@example.com | Master data management + brand intake step |
| **BRAND_MANAGER** | brand-manager@example.com | Final approval, locks pricing |

---

## 3. Common Workflows

### Create a Registration
1. Log in as `inputter@example.com`
2. Go to **Registrations** → click **Tạo đơn**
3. Fill in campaign name, brand, budget → **Tạo đơn**
4. Click the registration to open detail

### Approve a Registration (full chain)
1. Inputter submits → state becomes `SUPERVISOR_REVIEW`
2. Log in as `approver@example.com` → approve
3. Log in as `brand@example.com` → handle brand intake
4. Log in as `brand-manager@example.com` → final approval

### Manage Master Data
Log in as `brand@example.com` → go to **Master Data** (Content, Locations, Categories, Items)

---

## 4. Available Screens

| Screen | Path | Access |
|--------|------|--------|
| Registrations list | /registrations | All roles |
| Registration detail | /registrations/:id | All roles |
| Content | /master/content | BRAND+ |
| Locations | /master/locations | BRAND+ |
| Categories | /master/categories | BRAND+ |
| Items | /master/items | BRAND+ |
| Menus | /master/menus | ADMIN |
| Users | /admin/users | ADMIN |
