# Converting CSV Data to JSON Format

## Overview

You provided data in CSV/tabular format. This guide helps convert it to JSON format compatible with the seed script.

## Locations Data Conversion

### Your CSV Format (from provided data):
```
STT | MÃ vị trí | Phân loại | TÊN vị trí | TỈNH/TP | PHÂN KHU | ĐỊA CHỈ | KÊNH CN | KÊNH AF | KÊNH SME | KÊNH OOH | KÊNH HO | KÊNH Hệ sinh thái | ...
1   | HGM     | CN      | CN Sở Giao Dịch | Hà Nội | Nội thành | Tầng 1... | 1 | 1 | 1 | 0 | 1 | 0 | ...
```

### Convert to JSON:
```json
{
  "locations": [
    {
      "code": "HGM",
      "classification": "CN",
      "name": "CN Sở Giao Dịch",
      "province": "Hà Nội",
      "subDistrict": "Nội thành",
      "address": "Tầng 1 và tầng 3, tòa nhà số 34, phố Hai Bà Trưng, Phường Cửa Nam",
      "latitude": 21.0072,
      "longitude": 105.8563,
      "channels": ["CN", "AF", "SME", "HO"]
    }
  ]
}
```

### Mapping Rules:
1. **code** ← MÃ vị trí
2. **classification** ← Phân loại (CN | PGD | OOH)
3. **name** ← TÊN vị trí
4. **province** ← TỈNH/TP
5. **subDistrict** ← PHÂN KHU
6. **address** ← ĐỊA CHỈ
7. **latitude** ← kinh độ (optional)
8. **longitude** ← vĩ độ (optional)
9. **channels** ← Build array based on flags:
   - IF KÊNH CN = 1, add "CN"
   - IF KÊNH AF = 1, add "AF"
   - IF KÊNH SME = 1, add "SME"
   - IF KÊNH OOH = 1, add "OOH"
   - IF KÊNH HO = 1, add "HO"
   - IF KÊNH Hệ sinh thái = 1, add "Hệ sinh thái"

### Example Conversion (Python):
```python
import json
import csv

def convert_locations_csv_to_json(csv_file, json_file):
    locations = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')  # or delimiter=',' if comma-separated
        for row in reader:
            channels = []
            if row['KÊNH CN'] == '1':
                channels.append('CN')
            if row['KÊNH AF'] == '1':
                channels.append('AF')
            if row['KÊNH SME'] == '1':
                channels.append('SME')
            if row['KÊNH OOH'] == '1':
                channels.append('OOH')
            if row['KÊNH HO'] == '1':
                channels.append('HO')
            if row['KÊNH Hệ sinh thái'] == '1':
                channels.append('Hệ sinh thái')
            
            location = {
                'code': row['MÃ vị trí'].strip(),
                'classification': row['Phân loại'].strip(),
                'name': row['TÊN vị trí'].strip(),
                'province': row['TỈNH/TP'].strip(),
                'subDistrict': row['PHÂN KHU'].strip(),
                'address': row['ĐỊA CHỈ'].strip(),
                'channels': channels
            }
            
            # Add optional fields if present
            if row.get('kinh độ') and row['kinh độ'].strip():
                try:
                    location['latitude'] = float(row['kinh độ'])
                except:
                    pass
            
            if row.get('vĩ độ') and row['vĩ độ'].strip():
                try:
                    location['longitude'] = float(row['vĩ độ'])
                except:
                    pass
            
            locations.append(location)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({'locations': locations}, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Converted {len(locations)} locations to {json_file}")

# Usage:
convert_locations_csv_to_json('locations.csv', 'seed-locations.json')
```

## Physical Items Conversion

### Your CSV Format:
```
Mã vật phẩm | Tên vật phẩm | Rộng | Dài | Mô tả | Mã hạng mục | Mã vị trí
PMH.DL.01   | Decal lưới PGD... | 3.9 | 3.07 | sau cái cây | Decal lưới | PMH
```

### Convert to JSON:
```json
{
  "items": [
    {
      "code": "PMH.DL.01",
      "name": "Decal lưới PGD Phú Mỹ Hưng 01",
      "width": 3.9,
      "length": 3.07,
      "description": "sau cái cây",
      "category": "DL",
      "location": "PMH"
    }
  ]
}
```

### Mapping Rules:
1. **code** ← Mã vật phẩm
2. **name** ← Tên vật phẩm
3. **width** ← Rộng (optional, parse as float)
4. **length** ← Dài (optional, parse as float)
5. **description** ← Mô tả
6. **category** ← Extract from "Mã hạng mục" (last 2 chars or lookup: "Decal lưới" → "DL")
7. **location** ← Extract from "Mã vị trí" (first 3 chars: "PMH.DL.01" → "PMH")

### Example Conversion (Python):
```python
def convert_items_csv_to_json(csv_file, json_file):
    items = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            # Extract category code from item code or description
            item_code = row['Mã vật phẩm'].strip()
            parts = item_code.split('.')
            category_code = parts[1] if len(parts) > 1 else ''
            location_code = parts[0] if len(parts) > 0 else ''
            
            item = {
                'code': item_code,
                'name': row['Tên vật phẩm'].strip(),
                'category': category_code,
                'location': location_code
            }
            
            # Add optional numeric fields
            if row.get('Rộng') and row['Rộng'].strip():
                try:
                    item['width'] = float(row['Rộng'])
                except:
                    pass
            
            if row.get('Dài') and row['Dài'].strip():
                try:
                    item['length'] = float(row['Dài'])
                except:
                    pass
            
            if row.get('Mô tả') and row['Mô tả'].strip():
                item['description'] = row['Mô tả'].strip()
            
            items.append(item)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({'items': items}, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Converted {len(items)} items to {json_file}")

# Usage:
convert_items_csv_to_json('items.csv', 'seed-items.json')
```

## Categories Conversion

### Your CSV Format:
```
Mã hạng mục | Tên hạng mục | Hình thức | Đơn giá | Đơn vị tính
LB          | Light box    | Offline  | 350000  | m2
```

Note: The seed script already has the 17 categories hardcoded, so this is reference only.

### Categories Already Included:
```json
[
  { "code": "LB", "name": "Light box", "unitPrice": 350000, "unitName": "m2", "displayFormat": "Offline" },
  { "code": "DL", "name": "Decal lưới", "unitPrice": 350000, "unitName": "m2", "displayFormat": "Offline" },
  { "code": "HL", "name": "Hilex", "unitPrice": 250000, "unitName": "m2", "displayFormat": "Offline" },
  // ... 14 more
]
```

## Step-by-Step Process

### Option 1: Using Python (Recommended)

1. **Create conversion script:**
   ```python
   # convert_data.py
   import json
   import csv
   
   # [Include the conversion functions above]
   
   # Convert your data
   convert_locations_csv_to_json('your_locations.csv', 'seed-locations.json')
   convert_items_csv_to_json('your_items.csv', 'seed-items.json')
   ```

2. **Run it:**
   ```bash
   python convert_data.py
   ```

3. **Verify output:**
   ```bash
   # Check file sizes and format
   cat seed-locations.json | python -m json.tool | head -20
   cat seed-items.json | python -m json.tool | head -20
   ```

### Option 2: Manual Excel/Sheets Export

1. Open your CSV in Excel/Google Sheets
2. Create new sheet with columns: `code`, `classification`, `name`, `province`, `subDistrict`, `address`, `channels`
3. Use formulas to build channels array:
   ```
   =CONCATENATE("[", 
     IF(CN=1, """CN"",", ""),
     IF(AF=1, """AF"",", ""),
     IF(SME=1, """SME"",", ""),
     IF(OOH=1, """OOH"",", ""),
     IF(HO=1, """HO"",", ""),
     IF(HeSinhThai=1, """Hệ sinh thái"",", ""),
   "]")
   ```
4. Export as CSV, then convert to JSON

### Option 3: Online Converter

1. Use online CSV-to-JSON converter: https://www.convertcsv.com/csv-to-json.htm
2. Upload your CSV
3. Map columns to JSON keys
4. Download JSON
5. Adjust format to match expected structure

## Validation Checklist

After conversion, verify your JSON:

```python
import json

# Validate locations
with open('seed-locations.json') as f:
    data = json.load(f)
    print(f"✓ Locations: {len(data['locations'])} records")
    for loc in data['locations'][:3]:
        print(f"  - {loc['code']}: {len(loc['channels'])} channels")
        assert 'code' in loc and len(loc['code']) == 3
        assert 'classification' in loc
        assert 'channels' in loc and isinstance(loc['channels'], list)

# Validate items
with open('seed-items.json') as f:
    data = json.load(f)
    print(f"✓ Items: {len(data['items'])} records")
    for item in data['items'][:3]:
        print(f"  - {item['code']}: {item['category']} @ {item['location']}")
        assert 'code' in item
        assert 'category' in item
        assert 'location' in item
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Character encoding errors | Save CSV as UTF-8 without BOM |
| Location code not 3 chars | Pad with leading zeros or validate data |
| Channel values not 0/1 | Clean data: "1" vs 1, "yes" vs "no", etc. |
| Missing category codes | Extract from item code (split on '.') |
| Decimal numbers | Use float() instead of int() |
| Empty cells | Check for None/empty string, skip or use defaults |

## Quick Command Line

Convert CSV to JSON with awk/bash (if you have the data in proper format):

```bash
# Simple locations conversion
awk -F',' 'NR>1 {
  printf "{\"code\":\"%s\",\"name\":\"%s\",\"province\":\"%s\",\"channels\":[]},\n", 
  $2, $4, $5
}' locations.csv | sed '$ s/,$//' | sed '1s/^/{"locations":[/' | sed '$ s/$/]}/' > seed-locations.json
```

---

## Next Steps

1. ✅ Convert your locations CSV → `seed-locations.json` (289 locations)
2. ✅ Convert your items CSV → `seed-items.json` (600+ items)
3. Place the files in `backend/` directory
4. Run: `npm run ts-node -- seed-real-data.ts`
5. Verify: Check record counts in database

