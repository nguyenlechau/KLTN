# EditableGridView - Developer Quick Reference

## 🏃 30-Second Setup

```tsx
import { EditableGridView, GridColumn } from '@/components/EditableGridView';

export function MyScreen() {
  const [rows, setRows] = useState([]);
  
  const columns: GridColumn[] = [
    { key: 'name', header: 'Name', editable: true, type: 'text' },
    { key: 'status', header: 'Status', editable: true, type: 'select', 
      options: [{ label: 'Active', value: 'ACTIVE' }] },
  ];

  return <EditableGridView
    columns={columns}
    rows={rows}
    onEdit={async (id, key, val) => await api.patch(`/items/${id}`, { [key]: val })}
    onDelete={async (id) => await api.delete(`/items/${id}`)}
  />;
}
```

## 📋 Column Definition

```typescript
GridColumn {
  key: string;                                    // Required: field name
  header: string;                                 // Required: display header
  editable?: boolean;                             // Default: false
  type?: 'text' | 'number' | 'select' | 'boolean' | 'date';  // Default: 'text'
  width?: string;                                 // E.g., '150px', '25%'
  sortable?: boolean;                             // Default: false
  validate?: (value) => string | null;            // Return error or null
  render?: (value, row) => ReactNode;             // Custom cell display
  options?: { label: string; value: any }[];      // For select type
}
```

## 🎬 Handler Functions

### onEdit Handler
```typescript
async (rowId: string, columnKey: string, newValue: any, oldRow: T) => Promise<void>

// Example
const handleEdit = async (id, key, value, oldRow) => {
  const response = await api.patch(`/items/${id}`, { [key]: value });
  setRows(rows.map(r => r.id === id ? response : r));
};
```

### onDelete Handler
```typescript
async (rowId: string) => Promise<void>

// Example
const handleDelete = async (id) => {
  if (!confirm('Delete?')) return;
  await api.delete(`/items/${id}`);
  setRows(rows.filter(r => r.id !== id));
};
```

### onSort Handler
```typescript
(columnKey: string) => void

// Example
const handleSort = (columnKey) => {
  setSortBy(columnKey);
  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
};
```

## 🎨 Column Examples

### Text Input
```tsx
{
  key: 'name',
  header: 'Name',
  editable: true,
  type: 'text',
  validate: (v) => v?.length < 3 ? 'Min 3 chars' : null,
}
```

### Number Input
```tsx
{
  key: 'price',
  header: 'Price',
  editable: true,
  type: 'number',
  validate: (v) => v < 0 ? 'Must be positive' : null,
  render: (v) => `$${v.toFixed(2)}`,
}
```

### Select Dropdown
```tsx
{
  key: 'status',
  header: 'Status',
  editable: true,
  type: 'select',
  options: [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ],
  render: (v) => <span className={`badge badge-${v.toLowerCase()}`}>{v}</span>,
}
```

### Date Picker
```tsx
{
  key: 'created_at',
  header: 'Created',
  editable: false,
  type: 'date',
  render: (v) => v ? new Date(v).toLocaleDateString() : '—',
}
```

### Boolean Checkbox
```tsx
{
  key: 'is_active',
  header: 'Active',
  editable: true,
  type: 'boolean',
  render: (v) => v ? '✓' : '✗',
}
```

## 🎯 Props Reference

```typescript
interface EditableGridViewProps<T extends GridRow> {
  // Required
  columns: GridColumn[];
  rows: T[];
  
  // Optional callbacks
  onEdit?: (id, key, value, row) => Promise<void>;
  onDelete?: (id) => Promise<void>;
  
  // Optional state
  loading?: boolean;                    // Show loading state
  sortBy?: string;                      // Current sort column
  sortOrder?: 'asc' | 'desc';          // Sort direction
  onSort?: (columnKey) => void;        // Sort callback
  
  // Optional UI
  showActions?: boolean;                // Show delete column (default: true)
  actionWidth?: string;                 // Width of actions column (default: '120px')
}
```

## 🔧 Styling

### Override Colors
```css
.cell-input {
  border: 2px solid #0066cc;
}

.cell-btn-save {
  background: #28a745;
}

.editable-cell-editor {
  min-width: 200px;
}
```

### Column Widths
```tsx
columns: [
  { key: 'id', header: 'ID', width: '60px', editable: false },
  { key: 'name', header: 'Name', width: '250px', editable: true },
  { key: 'status', header: 'Status', width: '120px', editable: true },
]
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Click cell** | Start editing |
| **Enter** | Save edit |
| **Esc** | Cancel edit |
| **Click header** | Sort (if sortable) |

## ✅ Validation Patterns

### Required Field
```typescript
validate: (v) => !v ? 'This field is required' : null
```

### Min Length
```typescript
validate: (v) => v?.length < 3 ? 'Min 3 characters' : null
```

### Max Length
```typescript
validate: (v) => v?.length > 100 ? 'Max 100 characters' : null
```

### Number Range
```typescript
validate: (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return 'Must be a number';
  if (n < 0 || n > 100) return 'Must be 0-100';
  return null;
}
```

### Email
```typescript
validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email'
```

### Custom Pattern
```typescript
validate: (v) => /^[A-Z]{3}$/.test(v) ? null : 'Must be 3 uppercase letters'
```

## 🔄 Full Example - User Management

```tsx
import { EditableGridView, GridColumn } from '@/components/EditableGridView';
import { apiFetch } from '@/api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export function UserScreen() {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const columns: GridColumn[] = [
    {
      key: 'name',
      header: 'Name',
      editable: true,
      type: 'text',
      sortable: true,
      width: '200px',
      validate: (v) => !v ? 'Required' : null,
    },
    {
      key: 'email',
      header: 'Email',
      editable: true,
      type: 'text',
      width: '250px',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email',
    },
    {
      key: 'role',
      header: 'Role',
      editable: true,
      type: 'select',
      width: '120px',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'User', value: 'USER' },
      ],
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      type: 'select',
      width: '120px',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
      render: (v) => <span className={`badge badge-${v.toLowerCase()}`}>{v}</span>,
    },
  ];

  const load = async () => {
    setLoading(true);
    const data = await apiFetch<User[]>('/api/users');
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = async (id: string, key: string, value: any) => {
    try {
      await apiFetch(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value }),
      });
      await load();
    } catch (error) {
      throw new Error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    await load();
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const aVal = a[sortBy as keyof User];
    const bVal = b[sortBy as keyof User];
    const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? result : -result;
  });

  return (
    <div>
      <h2>User Management</h2>
      <EditableGridView<User>
        columns={columns}
        rows={sortedRows}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
      />
    </div>
  );
}
```

## 🐛 Debugging Tips

### Check Component Props
```tsx
console.log('Columns:', columns);
console.log('Rows:', rows);
console.log('EditableGridViewProps:', { columns, rows });
```

### Test Validation
```tsx
const column = columns.find(c => c.key === 'name');
console.log('Validate "":', column?.validate?.(''));  // Should be error
console.log('Validate "Test":', column?.validate?.('Test'));  // Should be null
```

### Monitor API Calls
```tsx
const handleEdit = async (id, key, value) => {
  console.log('Editing:', { id, key, value });
  try {
    const result = await api.patch(`/items/${id}`, { [key]: value });
    console.log('Save successful:', result);
    setRows(...);
  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
};
```

## 🚀 Performance Tips

1. **Memoize columns definition**
   ```tsx
   const columns = useMemo(() => [...], []);
   ```

2. **Memoize handlers**
   ```tsx
   const handleEdit = useCallback(async (...) => {...}, []);
   ```

3. **Pagination for large datasets**
   ```tsx
   const [page, setPage] = useState(1);
   const itemsPerPage = 50;
   const displayRows = rows.slice((page-1)*itemsPerPage, page*itemsPerPage);
   ```

4. **Virtualization for 1000+ rows**
   ```tsx
   import { FixedSizeList } from 'react-window';
   ```

---

**For detailed documentation, see:** `GRIDVIEW_COMPLETE_GUIDE.md`
