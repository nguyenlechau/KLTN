import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { useRole, canManageMasterData } from '../../hooks/useRole';
import '../../styles/master-list.css';
import * as api from '../../api/services';

export function PhysicalItemsScreen() {
  const role = useRole();
  const canWrite = canManageMasterData(role);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 10;

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [response, categoryRes, locationRes] = await Promise.all([
        api.getItemList(limit, page * limit, search),
        api.getCategoryList(1000, 0),
        api.getLocationList(1000, 0),
      ]);

      if (response.ok) {
        const rawItems = Array.isArray((response as any).data)
          ? (response as any).data
          : (response as any).data?.items || [];
        const normalizedTotal = (response as any).pagination?.total ?? (response as any).data?.total ?? rawItems.length;

        const categoryMap = new Map<string, any>((categoryRes.data || []).map((c: any) => [c.id, c]));
        const locationMap = new Map<string, any>((locationRes.data || []).map((l: any) => [l.id, l]));

        const normalizedItems = rawItems.map((item: any) => {
          const category = categoryMap.get(item.category_id);
          const location = locationMap.get(item.location_id);
          return {
            ...item,
            category_name: item.category_name || category?.name || '-',
            location_name: item.location_name || location?.name || location?.position_name || '-',
            unit_price: item.unit_price ?? category?.unit_price,
            unit_of_measure: category?.unit_of_measure,
          };
        });

        setItems(normalizedItems);
        setTotal(normalizedTotal);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteItem(id);
        loadItems();
      } catch (err: any) {
        setError(err.message || 'Failed to delete item');
      }
    }
  };

  const handleToggleStatus = async (item: any) => {
    try {
      const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.updateItem(item.id, { status: nextStatus });
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Failed to update item status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>Physical Items Management</h1>
        <p className="screen-subtitle">List of advertising locations</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="filter-section">
        <div className="search-box-wrapper">
          <Input placeholder="Search by code or name..." value={search} onChange={(value) => { setSearch(value); setPage(0); }} className="search-input" />
        </div>
        {canWrite && <Button onClick={() => setShowCreateModal(true)} variant="primary" className="btn-create">+ Add Item</Button>}
        {canWrite && <Button onClick={() => setShowBatchModal(true)} variant="secondary">+ Bulk Add</Button>}
      </div>

      {isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="empty-state"><p>No items found</p></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Size</th>
                  <th>Unit Price</th>
                  <th>Measure Unit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.item_code}</td>
                    <td>{row.item_name}</td>
                    <td>{row.category_name}</td>
                    <td>{row.location_name}</td>
                    <td>{`${Number(row.width || 0).toFixed(2)} x ${Number(row.length || 0).toFixed(2)}`}</td>
                    <td>{row.unit_price != null ? Number(row.unit_price).toLocaleString() : '-'}</td>
                    <td>{row.unit_of_measure || '-'}</td>
                    <td><span className={`status-badge ${getStatusBadgeClass(row.status)}`}>{row.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td>
                    <td>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button onClick={() => { setSelectedItem(row); setShowDetailModal(true); }} variant="secondary" className="btn-sm">View</Button>
                      {canWrite && <Button onClick={() => setEditingItem(row)} variant="secondary" className="btn-sm" style={{ marginLeft: '0.5rem' }}>Edit</Button>}
                      {canWrite && <Button onClick={() => handleToggleStatus(row)} variant={row.status === 'ACTIVE' ? 'danger' : 'primary'} className="btn-sm" style={{ marginLeft: '0.5rem' }}>
                        {row.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                      </Button>}
                      {canWrite && <Button onClick={() => handleDelete(row.id)} variant="danger" className="btn-sm" style={{ marginLeft: '0.5rem' }}>Delete</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Previous</button>
            <span>Page {page + 1} of {Math.ceil(total / limit)}</span>
            <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total}>Next →</button>
          </div>
        </>
      )}

      {showDetailModal && selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showCreateModal && (
        <CreateItemModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadItems();
          }}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            loadItems();
          }}
        />
      )}

      {showBatchModal && (
        <BatchCreateModal
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            setShowBatchModal(false);
            loadItems();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Detail Modal
// ============================================================

function DetailModal({ item, onClose }: any) {
  return (
    <Modal title="Item Details" onClose={onClose}>
      <div className="detail-content">
        <div className="detail-row">
          <label>Code</label>
          <span>{item.item_code}</span>
        </div>
        <div className="detail-row">
          <label>Name</label>
          <span>{item.item_name}</span>
        </div>
        <div className="detail-row">
          <label>Category</label>
          <span>{item.category_name}</span>
        </div>
        <div className="detail-row">
          <label>Location</label>
          <span>{item.location_name}</span>
        </div>
        <div className="detail-row">
          <label>Unit price</label>
          <span>{item.unit_price?.toLocaleString()} </span>
        </div>
        <div className="detail-row">
          <label>Unit</label>
          <span>{item.unit_of_measure}</span>
        </div>
        <div className="detail-row">
          <label>Status</label>
          <span>
            <span className={`status-badge ${item.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
              {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </span>
        </div>
        <div className="detail-row">
          <label>Created</label>
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="modal-actions">
        <Button onClick={onClose} variant="secondary">Close</Button>
      </div>
    </Modal>
  );
}

function EditItemModal({ item, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    description: item?.description || '',
    width: item?.width ? String(item.width) : '',
    length: item?.length ? String(item.length) : '',
    unit_price: item?.unit_price != null ? String(item.unit_price) : '',
    status: item?.status || 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await api.updateItem(item.id, {
        description: form.description || null,
        width: form.width ? Number(form.width) : null,
        length: form.length ? Number(form.length) : null,
        unit_price: form.unit_price !== '' ? Number(form.unit_price) : null,
        status: form.status,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title={`Edit Item: ${item.item_code}`} onClose={onClose}>
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Item Name</label>
          <Input value={item.item_name || ''} onChange={() => undefined} disabled />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Width (m)</label>
            <Input
              type="number"
              value={form.width}
              onChange={(value) => setForm((prev) => ({ ...prev, width: value }))}
              placeholder="e.g. 2.4"
            />
          </div>

          <div className="form-group">
            <label>Length (m)</label>
            <Input
              type="number"
              value={form.length}
              onChange={(value) => setForm((prev) => ({ ...prev, length: value }))}
              placeholder="e.g. 1.2"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Unit Price</label>
          <Input
            type="number"
            value={form.unit_price}
            onChange={(value) => setForm((prev) => ({ ...prev, unit_price: value }))}
            placeholder="Enter unit price"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <Input
            value={form.description}
            onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholder="Optional note"
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="form-select"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div className="modal-actions">
          <Button onClick={handleSubmit} variant="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={onClose} variant="secondary">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Create Item Modal
// ============================================================

function CreateItemModal({ onClose, onSuccess }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    location_id: '',
    channel_id: '',
    unit_price: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCategoryList(100, 0, undefined, undefined, 'ACTIVE'),
      api.getLocationList(100, 0, undefined, undefined, 'ACTIVE'),
      api.getChannelList(),
    ]).then(([catRes, locRes, chanRes]) => {
      if (catRes.ok) setCategories((catRes.data || []).filter((c: any) => String(c.status || '').toUpperCase() === 'ACTIVE'));
      const locs = (locRes.data || []).filter((l: any) => String(l.status || '').toUpperCase() === 'ACTIVE');
      setAllLocations(locs);
      setFilteredLocations(locs);
      if (chanRes.ok) setChannels(chanRes.data || []);
    });
  }, []);

  const handleChannelChange = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    const channelCode = channel?.code || '';
    const filtered = channelId
      ? allLocations.filter((l: any) => (l.channels || []).includes(channelCode))
      : allLocations;
    setForm({ ...form, channel_id: channelId, location_id: '' });
    setFilteredLocations(filtered);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setForm({ ...form, category_id: categoryId, unit_price: category?.unit_price != null ? String(category.unit_price) : '' });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.item_name || !form.category_id || !form.location_id) {
      setError('Please fill out all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const location = allLocations.find((l) => l.id === form.location_id);
      const category = categories.find((c) => c.id === form.category_id);

      await api.batchCreateItems(
        [
          {
            item_name: form.item_name,
            category_id: form.category_id,
            location_id: form.location_id,
            channel_id: form.channel_id || location?.channel_id || '',
            unit_price: form.unit_price !== '' ? Number(form.unit_price) : (category?.unit_price ?? 0),
          },
        ],
        location?.code || location?.position_code || '',
        category?.code || '',
        category?.name || '',
        location?.name || location?.position_name || ''
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Add Item" onClose={onClose}>
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Channel (optional – filters locations)</label>
          <select
            value={form.channel_id}
            onChange={(e) => handleChannelChange(e.target.value)}
            className="form-select"
          >
            <option value="">-- All channels --</option>
            {channels.map((c: any) => (
              <option key={c.id} value={c.id}>{c.code ? `${c.code} - ${c.name}` : c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Item Name *</label>
          <Input
            value={form.item_name}
            onChange={(value) => setForm({ ...form, item_name: value })}
            placeholder="Enter item name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select category --</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <select
              value={form.location_id}
              onChange={(e) => setForm({ ...form, location_id: e.target.value })}
              className="form-select"
            >
              <option value="">-- Select location --</option>
              {filteredLocations.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name || l.position_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Unit Price</label>
          <Input
            type="number"
            value={form.unit_price}
            onChange={(value) => setForm({ ...form, unit_price: value })}
            placeholder="Defaults to category price"
          />
        </div>

        <div className="modal-actions">
          <Button onClick={handleSubmit} variant="primary" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
          <Button onClick={onClose} variant="secondary">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Batch Create Modal
// ============================================================

function BatchCreateModal({ onClose, onSuccess }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [form, setForm] = useState({
    category_id: '',
    location_id: '',
    channel_id: '',
    unit_price: '',
    count: '1',
  });
  const [itemNames, setItemNames] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCategoryList(100, 0, undefined, undefined, 'ACTIVE'),
      api.getLocationList(100, 0, undefined, undefined, 'ACTIVE'),
      api.getChannelList(),
    ]).then(([catRes, locRes, chanRes]) => {
      if (catRes.ok) setCategories((catRes.data || []).filter((c: any) => String(c.status || '').toUpperCase() === 'ACTIVE'));
      const locs = (locRes.data || []).filter((l: any) => String(l.status || '').toUpperCase() === 'ACTIVE');
      setAllLocations(locs);
      setFilteredLocations(locs);
      if (chanRes.ok) setChannels(chanRes.data || []);
    });
  }, []);

  const handleChannelChange = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    const channelCode = channel?.code || '';
    const filtered = channelId
      ? allLocations.filter((l: any) => (l.channels || []).includes(channelCode))
      : allLocations;
    setForm({ ...form, channel_id: channelId, location_id: '' });
    setFilteredLocations(filtered);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setForm({ ...form, category_id: categoryId, unit_price: category?.unit_price != null ? String(category.unit_price) : '' });
  };

  const handleCountChange = (count: number) => {
    setForm({ ...form, count: count.toString() });
    setItemNames(Array(count).fill('').map((_, i) => itemNames[i] || ''));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.category_id || !form.location_id || itemNames.some((n) => !n)) {
      setError('Please fill out all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const location = allLocations.find((l) => l.id === form.location_id);
      const category = categories.find((c) => c.id === form.category_id);
      const unitPrice = form.unit_price !== '' ? Number(form.unit_price) : (category?.unit_price ?? 0);

      const batchItems = itemNames.map((name) => ({
        item_name: name,
        category_id: form.category_id,
        location_id: form.location_id,
        channel_id: form.channel_id || location?.channel_id || '',
        unit_price: unitPrice,
      }));

      await api.batchCreateItems(
        batchItems,
        location?.code || location?.position_code || '',
        category?.code || '',
        category?.name || '',
        location?.name || location?.position_name || ''
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create items');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Bulk Add Items" onClose={onClose} large={true}>
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Channel (optional – filters locations)</label>
          <select
            value={form.channel_id}
            onChange={(e) => handleChannelChange(e.target.value)}
            className="form-select"
          >
            <option value="">-- All channels --</option>
            {channels.map((c: any) => (
              <option key={c.id} value={c.id}>{c.code ? `${c.code} - ${c.name}` : c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select category --</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <select
              value={form.location_id}
              onChange={(e) => setForm({ ...form, location_id: e.target.value })}
              className="form-select"
            >
              <option value="">-- Select location --</option>
              {filteredLocations.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name || l.position_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity *</label>
            <Input
              type="number"
              value={form.count}
              onChange={(value) => handleCountChange(parseInt(value) || 1)}
              min="1"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Unit Price (applies to all)</label>
            <Input
              type="number"
              value={form.unit_price}
              onChange={(value) => setForm({ ...form, unit_price: value })}
              placeholder="Defaults to category price"
            />
          </div>
        </div>

        <div className="batch-items">
          <h4>Item Names</h4>
          <div className="batch-list">
            {itemNames.map((name, index) => (
              <div key={index} className="batch-item">
                <span className="batch-number">#{index + 1}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const newNames = [...itemNames];
                    newNames[index] = e.target.value;
                    setItemNames(newNames);
                  }}
                  placeholder={`Item name ${index + 1}`}
                  className="batch-input"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={handleSubmit} variant="primary" disabled={isLoading}>
            {isLoading ? 'Adding...' : `Add ${itemNames.length} items`}
          </Button>
          <Button onClick={onClose} variant="secondary">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
