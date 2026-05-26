import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/screen.css';

interface ContentRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  computed_status: 'HET_HAN' | 'CON_HAN';
}

export function ContentsScreen() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ channelId: '', categoryId: '', name: '', startDate: '', endDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<ContentRow[]>('/master/contents'));
    } catch (err: any) {
      setError(err.message || 'Failed to load contents');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    return newErrors;
  };

  const resetForm = () => {
    setForm({ channelId: '', categoryId: '', name: '', startDate: '', endDate: '' });
    setErrors({});
    setEditingId(null);
  };

  const toDateInputValue = (value: string) => {
    if (!value) return '';
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const onEdit = (row: ContentRow) => {
    setError('');
    setSuccess('');
    setEditingId(row.id);
    setForm({
      channelId: '',
      categoryId: '',
      name: row.name,
      startDate: toDateInputValue(row.start_date),
      endDate: toDateInputValue(row.end_date),
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
        await apiFetch(`/master/contents/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            startDate: form.startDate,
            endDate: form.endDate,
          }),
        });
        setSuccess('Content updated successfully');
      } else {
        await apiFetch('/master/contents', {
          method: 'POST',
          body: JSON.stringify({ ...form, imageKeys: [] }),
        });
        setSuccess('Content created successfully');
      }
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    }
    setCreating(false);
  };

  const onClone = async (id: string) => {
    try {
      await apiFetch(`/master/contents/${id}/clone`, { method: 'POST' });
      setSuccess('Content cloned successfully');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to clone content');
    }
  };

  const getExpiryLabel = (status: string) => {
    return status === 'HET_HAN' ? '✓ Valid' : '⏰ Expiring';
  };

  return (
    <div className="screen">
      <h2>Advertising Content</h2>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Card title={editingId ? 'Update Content' : 'Create New Content'}>
        <form onSubmit={onSubmit} className="form-row">
          <Input
            label="Channel Code"
            value={form.channelId}
            onChange={(val) => setForm((s) => ({ ...s, channelId: val }))}
            placeholder="Channel identifier"
            required
          />
          <Input
            label="Category Code"
            value={form.categoryId}
            onChange={(val) => setForm((s) => ({ ...s, categoryId: val }))}
            placeholder="Optional"
          />
          <Input
            label="Content Name"
            value={form.name}
            onChange={(val) => setForm((s) => ({ ...s, name: val }))}
            placeholder="Descriptive name"
            required
            error={errors.name}
          />
          <Input
            label="Start Date"
            value={form.startDate}
            onChange={(val) => setForm((s) => ({ ...s, startDate: val }))}
            type="date"
            required
            error={errors.startDate}
          />
          <Input
            label="End Date"
            value={form.endDate}
            onChange={(val) => setForm((s) => ({ ...s, endDate: val }))}
            type="date"
            required
            error={errors.endDate}
          />
        </form>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button onClick={() => onSubmit({} as any)} loading={creating}>{editingId ? 'Update Content' : 'Create Content'}</Button>
          {editingId && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
        </div>
      </Card>

      <Card title="Content List">
        {loading ? <Spinner /> : (
          <Table
            headers={['Name', 'Start', 'End', 'Status', 'Actions']}
            rows={rows.map((row) => [
              row.name,
              new Date(row.start_date).toLocaleDateString(),
              new Date(row.end_date).toLocaleDateString(),
              <span className={`badge badge-${row.computed_status === 'HET_HAN' ? 'approved' : 'warning'}`}>
                {getExpiryLabel(row.computed_status)}
              </span>,
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button onClick={() => onEdit(row)} variant="secondary" className="btn-sm">Edit</Button>
                <Button onClick={() => onClone(row.id)} variant="secondary" className="btn-sm">Clone</Button>
              </div>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}
