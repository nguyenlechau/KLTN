import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { useRole, canManageMasterData } from '../../hooks/useRole';
import '../../styles/master-list.css';
import '../../styles/screen.css';

interface Channel {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  location_id?: string;
  location_name?: string;
}

export function ChannelsScreen() {
  const role = useRole();
  const canWrite = canManageMasterData(role);
  const [rows, setRows] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const unwrapList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && Array.isArray(payload.data)) return payload.data as T[];
    return [];
  };

  const load = async () => {
    setLoading(true);
    try {
      const channelPayload = await apiFetch<any>('/v1/channels').catch(() => []);
      const channelData = unwrapList<Channel>(channelPayload);
      if (channelData && channelData.length > 0) setRows(channelData);
      if (!channelData || channelData.length === 0) setRows([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editingId && !form.code.trim()) newErrors.code = 'Code is required';
    if (!form.name.trim()) newErrors.name = 'Name is required';
    return newErrors;
  };

  const resetForm = () => {
    setForm({ code: '', name: '', description: '' });
    setErrors({});
    setEditingId(null);
  };

  const onEdit = (row: Channel) => {
    setError('');
    setSuccess('');
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description || '',
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCreating(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/v1/channels/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
          }),
        });
        setSuccess('Channel updated successfully');
      } else {
        await apiFetch('/v1/channels', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setSuccess('Channel created successfully');
      }
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save channel');
    }
    setCreating(false);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-header-text">
          <h1>Channel Management</h1>
          <p className="screen-subtitle">Manage advertising channels</p>
        </div>
      </div>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {canWrite && (
        <Card title={editingId ? 'Update Channel' : 'Add New Channel'}>
          <form onSubmit={onSubmit} className="form-grid">
            <Input
              label="Channel Code"
              value={form.code}
              onChange={(val) => setForm((s) => ({ ...s, code: val }))}
              placeholder="e.g., CH001"
              required
              error={errors.code}
              disabled={!!editingId}
            />
            <Input
              label="Channel Name"
              value={form.name}
              onChange={(val) => setForm((s) => ({ ...s, name: val }))}
              placeholder="Channel name"
              required
              error={errors.name}
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(val) => setForm((s) => ({ ...s, description: val }))}
              placeholder="Optional description"
            />
            <div className="form-actions" style={{gridColumn: '1 / -1'}}>
              <Button type="submit" loading={creating}>{editingId ? 'Update Channel' : 'Create Channel'}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </Card>
      )}

      <Card title="Channel List">
        {loading ? <Spinner /> : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td>
                      <div className="cell-primary">{row.name}</div>
                      {row.description && <div className="cell-secondary">{row.description}</div>}
                    </td>
                    <td><span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span></td>
                    <td>
                      {canWrite && (
                        <Button onClick={() => onEdit(row)} variant="secondary" className="btn-sm">Edit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
