import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/screen.css';

interface LocationRow {
  id: string;
  code: string;
  name: string;
  classification?: string | null;
  province?: string | null;
  sub_district?: string | null;
  address_line?: string | null;
  latitude: number | null;
  longitude: number | null;
  channels?: string[];
  csm_name?: string | null;
  csm_email?: string | null;
  csm_phone?: string | null;
  note?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export function LocationsScreen() {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    address_line: '',
    latitude: '',
    longitude: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<LocationRow[]>('/master/locations');
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load locations');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editingId && !form.code) newErrors.code = 'Code is required';
    if (!editingId && form.code.length !== 3) newErrors.code = 'Code must be 3 characters';
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (form.latitude) {
      const lat = parseFloat(form.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) newErrors.latitude = 'Latitude must be -90 to 90';
    }
    if (form.longitude) {
      const lng = parseFloat(form.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) newErrors.longitude = 'Longitude must be -180 to 180';
    }
    return newErrors;
  };

  const resetForm = () => {
    setForm({ code: '', name: '', address_line: '', latitude: '', longitude: '' });
    setErrors({});
    setEditingId(null);
  };

  const onEdit = (row: LocationRow) => {
    setError('');
    setSuccess('');
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      address_line: row.address_line || '',
      latitude: row.latitude?.toString() || '',
      longitude: row.longitude?.toString() || '',
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
        await apiFetch(`/master/locations/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            address_line: form.address_line || null,
            latitude: form.latitude ? parseFloat(form.latitude) : null,
            longitude: form.longitude ? parseFloat(form.longitude) : null,
          }),
        });
        setSuccess('Location updated successfully');
      } else {
        await apiFetch('/master/locations', {
          method: 'POST',
          body: JSON.stringify({
            code: form.code.toUpperCase(),
            name: form.name,
            address_line: form.address_line || null,
            latitude: form.latitude ? parseFloat(form.latitude) : null,
            longitude: form.longitude ? parseFloat(form.longitude) : null,
          }),
        });
        setSuccess('Location created successfully');
      }
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    }
    setCreating(false);
  };

  return (
    <div className="screen">
      <h2>Location Management</h2>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Card title={editingId ? 'Update Location' : 'Add New Location'}>
        <form onSubmit={onSubmit} className="form-grid">
          <Input
            label="Location Code"
            value={form.code}
            onChange={(val) => setForm((s) => ({ ...s, code: val.toUpperCase() }))}
            placeholder="3 chars (e.g., DHK)"
            maxLength={3}
            required
            error={errors.code}
            disabled={!!editingId}
          />
          <Input
            label="Location Name"
            value={form.name}
            onChange={(val) => setForm((s) => ({ ...s, name: val }))}
            placeholder="Location name"
            required
            error={errors.name}
          />
          <Input
            label="Address"
            value={form.address_line}
            onChange={(val) => setForm((s) => ({ ...s, address_line: val }))}
            placeholder="Street address (optional)"
          />
          <Input
            label="Latitude"
            value={form.latitude}
            onChange={(val) => setForm((s) => ({ ...s, latitude: val }))}
            type="number"
            step="0.000001"
            placeholder="-90 to 90 (optional)"
            error={errors.latitude}
          />
          <Input
            label="Longitude"
            value={form.longitude}
            onChange={(val) => setForm((s) => ({ ...s, longitude: val }))}
            type="number"
            step="0.000001"
            placeholder="-180 to 180 (optional)"
            error={errors.longitude}
          />
          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <Button type="submit" loading={creating}>{editingId ? 'Update Location' : 'Create Location'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card title="Location List">
        {loading ? <Spinner /> : (
          <Table
            headers={['Code', 'Name', 'Classification', 'Province', 'Sub-district', 'Address', 'Channels', 'CSM', 'Latitude', 'Longitude', 'Status', 'Actions']}
            rows={rows.map((row) => [
              row.code,
              row.name,
              row.classification || '—',
              row.province || '—',
              row.sub_district || '—',
              row.address_line || '—',
              row.channels?.length ? row.channels.join(', ') : '—',
              row.csm_name ? `${row.csm_name}${row.csm_email ? ` | ${row.csm_email}` : ''}${row.csm_phone ? ` | ${row.csm_phone}` : ''}` : '—',
              row.latitude?.toFixed(4) || '—',
              row.longitude?.toFixed(4) || '—',
              <span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span>,
              <Button onClick={() => onEdit(row)} variant="secondary" className="btn-sm">Edit</Button>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}
