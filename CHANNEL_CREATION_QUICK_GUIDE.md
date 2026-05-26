# Channel Creation Flow - Quick Reference

## New Channel Creation Workflow

### Step 1: Create Categories (Master Data)
Navigate to: **`/master/categories`**
- Code: 2 characters (auto-uppercase)
- Name: Category name
- Unit Price: Default 0
- Examples: `EL` (Electronics), `AP` (Appliances)

**API:** `POST /master/categories`
```json
{
  "code": "EL",
  "name": "Electronics",
  "unit_price": 0
}
```

---

### Step 2: Create Locations (Master Data)
Navigate to: **`/master/locations`**
- Code: 3 characters (auto-uppercase)
- Name: Location name
- Latitude/Longitude: Optional for mapping
- Examples: `DHK` (Dhaka), `CHT` (Chittagong)

**API:** `POST /master/locations`
```json
{
  "code": "DHK",
  "name": "Dhaka",
  "latitude": null,
  "longitude": null
}
```

---

### Step 3: Create Channel (Link Category + Location)
Navigate to: **`/master/channels`**
- Code: Channel identifier (e.g., `CH001`)
- Name: Channel name
- **Category: Select from dropdown** ⭐ REQUIRED
- **Location: Select from dropdown** ⭐ REQUIRED

**API:** `POST /master/channels`
```json
{
  "code": "CH001",
  "name": "Electronics Dhaka Channel",
  "description": "Electronics sales in Dhaka",
  "category_id": "uuid-of-electronics",
  "location_id": "uuid-of-dhaka"
}
```

---

## Key Differences from Old System

| Aspect | Old | New |
|--------|-----|-----|
| Categories | Created per channel | Independent master data |
| Locations | Created per channel | Independent master data |
| Channel Creation | Nested forms | Dropdown selection |
| Duplicate Risk | High | Prevented by unique constraint |
| Relationship | One-to-many | Many-to-one |

---

## Common Scenarios

### Scenario 1: Add Electronics to Multiple Locations
1. ✅ Already have `Electronics` category
2. Create `Chittagong` location if not exists
3. Create channel: Electronics + Chittagong

**Result:** Two channels now serve Electronics
- Channel 1: Electronics + Dhaka
- Channel 2: Electronics + Chittagong

---

### Scenario 2: Add Multiple Categories to Same Location
1. Create `Appliances` category
2. ✅ Already have `Dhaka` location
3. Create channel: Appliances + Dhaka

**Result:** Two channels now use Dhaka
- Channel 1: Electronics + Dhaka
- Channel 2: Appliances + Dhaka

---

### Scenario 3: Prevent Duplicates
Trying to create:
- Channel 1: Electronics + Dhaka ✅ Success
- Channel 2: Electronics + Dhaka ❌ Error: "Channel already exists..."

---

## Field Requirements

### Categories
| Field | Type | Length | Required | Notes |
|-------|------|--------|----------|-------|
| Code | Text | 2 chars | Yes | Auto-uppercase, unique |
| Name | Text | 1-225 chars | Yes | Human-readable name |
| Unit Price | Number | ≥ 0 | No | Defaults to 0 |
| Description | Text | Unlimited | No | Optional notes |

### Locations
| Field | Type | Length | Required | Notes |
|-------|------|--------|----------|-------|
| Code | Text | 3 chars | Yes | Auto-uppercase, unique |
| Name | Text | 1-225 chars | Yes | Human-readable name |
| Address | Text | Unlimited | No | Optional street address |
| Latitude | Decimal | -90 to 90 | No | For geolocation |
| Longitude | Decimal | -180 to 180 | No | For geolocation |

### Channels
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Code | Text | Yes | Channel identifier |
| Name | Text | Yes | Human-readable name |
| Description | Text | No | Optional notes |
| Category | Dropdown | Yes | ⭐ Select from existing |
| Location | Dropdown | Yes | ⭐ Select from existing |

---

## API Endpoints Summary

| Method | Endpoint | Body | Purpose |
|--------|----------|------|---------|
| GET | `/master/categories` | — | List all categories |
| POST | `/master/categories` | {code, name, unit_price} | Create category |
| PATCH | `/master/categories/:id` | {name, unit_price, status} | Update category |
| GET | `/master/locations` | — | List all locations |
| POST | `/master/locations` | {code, name, address_line, lat, lng} | Create location |
| PATCH | `/master/locations/:id` | {name, address_line, lat, lng, status} | Update location |
| GET | `/master/channels` | — | List all channels with category/location info |
| POST | `/master/channels` | {code, name, category_id, location_id} | **Create channel** |
| PATCH | `/master/channels/:id` | {name, category_id, location_id, status} | Update channel |
| DELETE | `/master/channels/:id` | — | Delete channel |

---

## Error Messages & Fixes

### "Category and Location are required"
**Fix:** Both dropdowns must have a selection

### "Channel already exists for this category-location combination"
**Fix:** This category-location pair is already assigned to another channel

### "Invalid category" or "Invalid location"
**Fix:** The selected category or location doesn't exist. Refresh and try again.

### "Category code already exists"
**Fix:** Use a unique 2-character code (e.g., change `EL` to `EL2`)

### "Location code already exists"
**Fix:** Use a unique 3-character code (e.g., change `DHK` to `DHK2`)

---

## Navigation

```
Main Menu
├── Categories (/master/categories)
│   └── Create, edit, view all categories
├── Locations (/master/locations)
│   └── Create, edit, view all locations
└── Channels (/master/channels)
    └── Create, edit, view all channels
        └── Select category + location for each channel
```

---

## Database Schema

```sql
-- Categories (Independent)
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  code VARCHAR(2) UNIQUE NOT NULL,
  name VARCHAR(225) NOT NULL,
  unit_price NUMERIC(14,2),
  status master_status,
  ...
);

-- Locations (Independent)
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(225) NOT NULL,
  latitude NUMERIC(8,6),
  longitude NUMERIC(9,6),
  status master_status,
  ...
);

-- Channels (Links them together)
CREATE TABLE channels (
  id UUID PRIMARY KEY,
  code VARCHAR(16),
  name VARCHAR(225),
  category_id UUID REFERENCES categories(id),
  location_id UUID REFERENCES locations(id),
  UNIQUE(category_id, location_id),  -- Prevents duplicates
  status master_status,
  ...
);
```

---

## Pre-populated Data

### Default Categories
- `EL` - Electronics
- `AP` - Appliances
- `CL` - Clothing
- `FD` - Food & Beverage
- `BK` - Books

### Default Locations
- `DHK` - Dhaka
- `CHT` - Chittagong
- `KHU` - Khulna
- `RJH` - Rajshahi
- `SYL` - Sylhet

---

## Tips & Best Practices

✅ **DO:**
- Create all categories first, then locations, then channels
- Use meaningful codes (2 chars for categories, 3 for locations)
- Keep codes uppercase and consistent
- Use "Active" status for operational channels

❌ **DON'T:**
- Try to create a channel without selecting category AND location
- Use duplicate codes (system prevents this anyway)
- Delete a category/location that's used by active channels
- Manually insert data - use the forms provided

---

## Testing Checklist

After migration and deployment:

- [ ] Navigate to `/master/categories` - see 5 defaults
- [ ] Navigate to `/master/locations` - see 5 defaults
- [ ] Navigate to `/master/channels` - form has category dropdown
- [ ] Navigate to `/master/channels` - form has location dropdown
- [ ] Create a test channel with valid category + location
- [ ] Verify channel appears in table with category and location names
- [ ] Try creating duplicate channel - expect error
- [ ] Try creating channel without category - expect error
- [ ] Try creating channel without location - expect error

---

**Status:** ✅ Ready to use
**Last Updated:** May 5, 2026
**Version:** 2.0 (Fixed Relationships)
