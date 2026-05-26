import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import '../../styles/screen.css';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/screen.css';

interface Category {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface Location {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface PhysicalItemRow {
  id: string;
  item_code: string;
  item_name: string;
  category_id: string;
  location_id: string;
  width: string;
  length: string;
  image_key?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
}

interface PreviewItem {
  seqNo: number;
  itemCode: string;
  itemName: string;
  inferredStatus: string;
}

interface ItemDetail {
  width: number;
  length: number;
  imageKey: string;
  description: string;
}

export function PhysicalItemsListScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rows, setRows] = useState<PhysicalItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [base, setBase] = useState({ categoryId: '', locationId: '', quantity: 1 });
  const [generated, setGenerated] = useState<PreviewItem[]>([]);
  const [details, setDetails] = useState<Record<number, ItemDetail>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ width: '', length: '', imageKey: '', description: '' });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemData, categoryData, locationData] = await Promise.all([
        apiFetch<PhysicalItemRow[]>('/physical-items').catch(() => []),
        apiFetch<Category[]>('/master/categories').catch(() => []),
        apiFetch<Location[]>('/master/locations').catch(() => []),
      ]);
      if (itemData && itemData.length > 0) setRows(itemData);
      setCategories(categoryData || []);
      setLocations(locationData || []);
      if ((!itemData || itemData.length === 0)) {
        // mock items
        setRows([
          { id: 'i1', item_code: 'ITM-001', item_name: 'LED 6x3', category_id: categoryData?.[0]?.id || 'cat1', location_id: locationData?.[0]?.id || 'loc1', width: '6.00', length: '3.00', status: 'ACTIVE', created_at: new Date().toISOString() },
          { id: 'i2', item_code: 'ITM-002', item_name: 'Lightbox 2x3', category_id: categoryData?.[0]?.id || 'cat1', location_id: locationData?.[0]?.id || 'loc1', width: '2.00', length: '3.00', status: 'ACTIVE', created_at: new Date().toISOString() },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load physical items');
    }
    setLoading(false);
  };

  const categoryLabel = (id: string) => {
    const category = categories.find((entry) => entry.id === id);
    return category ? `${category.code} - ${category.name}` : id;
  };

  const locationLabel = (id: string) => {
    const location = locations.find((entry) => entry.id === id);
    return location ? `${location.code} - ${location.name}` : id;
  };

  const resetCreate = () => {
    setBase({ categoryId: '', locationId: '', quantity: 1 });
    setGenerated([]);
    setDetails({});
  };

  const preview = async () => {
    if (!base.categoryId || !base.locationId || base.quantity < 1) {
      setError('Please select category, location and quantity');
      return;
    }
    setPreviewing(true);
    setError('');
    try {
      const data = await apiFetch<{ generatedItems: PreviewItem[] }>('/physical-items/wizard/preview', {
        method: 'POST',
        body: JSON.stringify(base),
      });
      setGenerated(data.generatedItems);
    } catch (err: any) {
      setError(err.message || 'Failed to generate items');
    }
    setPreviewing(false);
  };

  const commit = async () => {
    if (generated.length === 0) {
      setError('Please generate items first');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const items = generated.map((item) => ({
        seqNo: item.seqNo,
        itemCode: item.itemCode,
        itemName: item.itemName,
        width: parseFloat(`${details[item.seqNo]?.width ?? 0}`),
        length: parseFloat(`${details[item.seqNo]?.length ?? 0}`),
        imageKey: details[item.seqNo]?.imageKey || '',
        description: details[item.seqNo]?.description || '',
      }));

      await apiFetch('/physical-items/wizard/commit', {
        method: 'POST',
        body: JSON.stringify({ ...base, items }),
      });

      setSuccess('Items created successfully');
      resetCreate();
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to create items');
    }
    setCreating(false);
  };

  const startEdit = (row: PhysicalItemRow) => {
    setEditingId(row.id);
    setEditForm({
      width: row.width || '',
      length: row.length || '',
      imageKey: row.image_key || '',
      description: row.description || '',
    });
    setError('');
    setSuccess('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    setError('');
    try {
      await apiFetch(`/physical-items/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          width: editForm.width ? parseFloat(editForm.width) : undefined,
          length: editForm.length ? parseFloat(editForm.length) : undefined,
          imageKey: editForm.imageKey || null,
          description: editForm.description || null,
        }),
      });
      setSuccess('Item updated successfully');
      setEditingId(null);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
    }
    setSavingEdit(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="screen">
      <h2>Physical Items Management</h2>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Card title="Create New Items">
        <div className="form-grid">
          <div>
            <label>Category *</label>
            <select
              value={base.categoryId}
              onChange={(event) => setBase((state) => ({ ...state, categoryId: event.target.value }))}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.code} - {category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Location *</label>
            <select
              value={base.locationId}
              onChange={(event) => setBase((state) => ({ ...state, locationId: event.target.value }))}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">Select Location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} - {location.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={`${base.quantity}`}
            onChange={(value) => setBase((state) => ({ ...state, quantity: Math.max(1, parseInt(value) || 1) }))}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button onClick={preview} loading={previewing}>Generate Code</Button>
          {generated.length > 0 && <Button onClick={commit} loading={creating}>Create Items</Button>}
          {generated.length > 0 && <Button type="button" variant="secondary" onClick={resetCreate}>Clear</Button>}
        </div>

        {generated.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
            {generated.map((item) => (
              <div key={item.seqNo} style={{ padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                <strong>{item.itemCode}</strong> - {item.itemName}
                <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                  <Input
                    label="Width"
                    type="number"
                    step="0.01"
                    value={`${details[item.seqNo]?.width ?? ''}`}
                    onChange={(value) => setDetails((state) => ({
                      ...state,
                      [item.seqNo]: { ...(state[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), width: parseFloat(value) || 0 },
                    }))}
                  />
                  <Input
                    label="Length"
                    type="number"
                    step="0.01"
                    value={`${details[item.seqNo]?.length ?? ''}`}
                    onChange={(value) => setDetails((state) => ({
                      ...state,
                      [item.seqNo]: { ...(state[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), length: parseFloat(value) || 0 },
                    }))}
                  />
                  <Input
                    label="Image Key"
                    value={details[item.seqNo]?.imageKey ?? ''}
                    onChange={(value) => setDetails((state) => ({
                      ...state,
                      [item.seqNo]: { ...(state[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), imageKey: value },
                    }))}
                  />
                  <Input
                    label="Description"
                    value={details[item.seqNo]?.description ?? ''}
                    onChange={(value) => setDetails((state) => ({
                      ...state,
                      [item.seqNo]: { ...(state[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), description: value },
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!editingId}
        title="Edit Item"
        onConfirm={saveEdit}
        onCancel={() => {
          if (!savingEdit) {
            setEditingId(null);
          }
        }}
        confirmText={savingEdit ? 'Saving...' : 'Save'}
        cancelText="Cancel"
      >
        <div className="form-grid">
          <Input label="Width" type="number" step="0.01" value={editForm.width} onChange={(value) => setEditForm((state) => ({ ...state, width: value }))} />
          <Input label="Length" type="number" step="0.01" value={editForm.length} onChange={(value) => setEditForm((state) => ({ ...state, length: value }))} />
          <Input label="Image Key" value={editForm.imageKey} onChange={(value) => setEditForm((state) => ({ ...state, imageKey: value }))} />
          <Input label="Description" value={editForm.description} onChange={(value) => setEditForm((state) => ({ ...state, description: value }))} />
        </div>
      </Modal>

      <Card title="Items List">
        {loading ? (
          <Spinner />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Width</th>
                  <th>Length</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.item_code}</td>
                    <td>{row.item_name}</td>
                    <td>{categoryLabel(row.category_id)}</td>
                    <td>{locationLabel(row.location_id)}</td>
                    <td>{row.width}</td>
                    <td>{row.length}</td>
                    <td>{row.status}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td><Button onClick={() => startEdit(row)} variant="secondary" className="btn-sm">Edit</Button></td>
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
