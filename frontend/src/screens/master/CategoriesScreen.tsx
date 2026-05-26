import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/screen.css';

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit_price: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export function CategoriesScreen() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ code: '', name: '', description: '', unit_price: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Category[]>('/v1/categories');
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editingId && !form.code) newErrors.code = 'Code is required';
    if (!editingId && form.code.length !== 2) newErrors.code = 'Code must be 2 characters';
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (form.unit_price && (isNaN(parseFloat(form.unit_price)) || parseFloat(form.unit_price) < 0)) {
      newErrors.unit_price = 'Price must be a valid number ≥ 0';
    }
    return newErrors;
  };

  const resetForm = () => {
    setForm({ code: '', name: '', description: '', unit_price: '' });
    setErrors({});
    setEditingId(null);
  };

  const onEdit = (row: Category) => {
    setError('');
    setSuccess('');
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description || '',
      unit_price: row.unit_price.toString(),
    });
  };

  const onSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault?.();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCreating(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/v1/categories/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            unit_price: form.unit_price ? parseFloat(form.unit_price) : 0,
          }),
        });
        setSuccess('Category updated successfully');
      } else {
        await apiFetch('/v1/categories', {
          method: 'POST',
          body: JSON.stringify({
            code: form.code.toUpperCase(),
            name: form.name,
            description: form.description || null,
            unit_price: form.unit_price ? parseFloat(form.unit_price) : 0,
          }),
        });
        setSuccess('Category created successfully');
      }
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
    setCreating(false);
  };

  return (
    <div className="screen">
      <h2>Category Management</h2>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Card title={editingId ? 'Update Category' : 'Add New Category'}>
        <form onSubmit={onSubmit} className="form-grid">
          <Input
            label="Category Code"
            value={form.code}
            onChange={(val) => setForm((s) => ({ ...s, code: val.toUpperCase() }))}
            placeholder="2 chars (e.g., EL)"
            maxLength={2}
            required
            error={errors.code}
            disabled={!!editingId}
          />
          <Input
            label="Category Name"
            value={form.name}
            onChange={(val) => setForm((s) => ({ ...s, name: val }))}
            placeholder="Category name"
            required
            error={errors.name}
          />
          <Input
            label="Unit Price"
            value={form.unit_price}
            onChange={(val) => setForm((s) => ({ ...s, unit_price: val }))}
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            error={errors.unit_price}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(val) => setForm((s) => ({ ...s, description: val }))}
            placeholder="Optional description"
          />
          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <Button type="submit" loading={creating}>{editingId ? 'Update Category' : 'Create Category'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card title="Categories List">
        {loading ? <Spinner /> : (
          <Table
            headers={['Code', 'Name', 'Description', 'Price', 'Status', 'Actions']}
            rows={rows.map((row) => [
              row.code,
              row.name,
              row.description || '—',
              `$${parseFloat(row.unit_price.toString()).toFixed(2)}`,
              <span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span>,
              <Button onClick={() => onEdit(row)} variant="secondary" className="btn-sm">Edit</Button>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}
