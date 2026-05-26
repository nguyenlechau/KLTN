import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { EditableGridView, GridColumn } from '../../components/EditableGridView';
import '../../styles/screen.css';

interface MenuItem {
  id: string;
  code: string;
  name: string;
  label?: string;
  icon?: string;
  order_position: number;
  parent_id?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export function MenuScreen() {
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState('order_position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load menus
  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<MenuItem[]>('/master/menus');
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load menus');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Handle cell edit
  const handleEdit = async (rowId: string, columnKey: string, newValue: any, oldRow: MenuItem) => {
    if (newValue === oldRow[columnKey as keyof MenuItem]) {
      return; // No change
    }

    setSaving(true);
    try {
      const payload: any = { [columnKey]: newValue };

      // Validate specific fields
      if (columnKey === 'code') {
        if (!newValue || newValue.length === 0) {
          throw new Error('Code cannot be empty');
        }
        if (newValue.length > 50) {
          throw new Error('Code must be 50 characters or less');
        }
      }

      if (columnKey === 'name') {
        if (!newValue || newValue.length === 0) {
          throw new Error('Name cannot be empty');
        }
        if (newValue.length > 100) {
          throw new Error('Name must be 100 characters or less');
        }
      }

      if (columnKey === 'order_position') {
        const num = parseInt(newValue, 10);
        if (isNaN(num) || num < 0) {
          throw new Error('Order position must be a positive number');
        }
        payload.order_position = num;
      }

      await apiFetch(`/master/menus/${rowId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setSuccess('Menu item updated successfully');
      await load();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (rowId: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This cannot be undone.')) {
      return;
    }

    try {
      await apiFetch(`/master/menus/${rowId}`, {
        method: 'DELETE',
      });
      setSuccess('Menu item deleted successfully');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete menu');
    }
  };

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  // Get sorted rows
  const sortedRows = [...rows].sort((a, b) => {
    const aVal = a[sortBy as keyof MenuItem];
    const bVal = b[sortBy as keyof MenuItem];

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? result : -result;
  });

  // Define columns
  const columns: GridColumn[] = [
    {
      key: 'code',
      header: 'Code',
      editable: true,
      type: 'text',
      width: '10%',
      validate: (value: string) => {
        if (!value || value.length === 0) return 'Code is required';
        if (value.length > 50) return 'Code must be 50 characters or less';
        return null;
      },
    },
    {
      key: 'name',
      header: 'Name',
      editable: true,
      type: 'text',
      width: '20%',
      sortable: true,
      validate: (value: string) => {
        if (!value || value.length === 0) return 'Name is required';
        if (value.length > 100) return 'Name must be 100 characters or less';
        return null;
      },
    },
    {
      key: 'label',
      header: 'Label',
      editable: true,
      type: 'text',
      width: '15%',
    },
    {
      key: 'icon',
      header: 'Icon',
      editable: true,
      type: 'text',
      width: '12%',
      render: (value: string) => (
        <span title={value}>
          {value ? `${value} ${value}` : '—'}
        </span>
      ),
    },
    {
      key: 'order_position',
      header: 'Order',
      editable: true,
      type: 'number',
      width: '10%',
      sortable: true,
      validate: (value: any) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return 'Must be a number';
        if (num < 0) return 'Must be 0 or greater';
        return null;
      },
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      type: 'select',
      width: '10%',
      sortable: true,
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
      render: (value: string) => (
        <span className={`badge badge-${value.toLowerCase()}`}>{value}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      editable: false,
      type: 'date',
      width: '15%',
    },
  ];

  return (
    <div className="screen">
      <h2>📋 Menu Management</h2>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Card
        title="Menu Items"
        subtitle={`Total: ${rows.length} | Editing mode: Click on any cell to edit | Press Enter to save or Esc to cancel`}
      >
        {loading ? (
          <Spinner />
        ) : (
          <>
            <EditableGridView<MenuItem>
              columns={columns}
              rows={sortedRows}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              loading={saving}
              showActions={true}
              actionWidth="60px"
            />
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                <strong>💡 Tips:</strong> Click any cell to edit inline • Press Enter to save • Press Esc to cancel •
                Sort by clicking column headers • Click delete icon to remove menu items
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
