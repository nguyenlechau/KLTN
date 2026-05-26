import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/master-list.css';
import * as api from '../../api/services';
import '../../styles/master-list.css';

export function PhysicalItemsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 10;

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getItemList(limit, page * limit, search);
      if (response.ok) {
        setItems(response.data?.items || []);
        setTotal(response.data?.total || 0);
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
          <Input placeholder="Search by code or name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="search-input" />
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" className="btn-create">+ Add Item</Button>
        <Button onClick={() => setShowBatchModal(true)} variant="secondary">+ Bulk Add</Button>
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
                    <td><span className={`status-badge ${getStatusBadgeClass(row.status)}`}>{row.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td>
                    <td>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button onClick={() => { setSelectedItem(row); setShowDetailModal(true); }} variant="secondary" className="btn-sm">View</Button>
                      <Button onClick={() => handleDelete(row.id)} variant="danger" className="btn-sm" style={{ marginLeft: '0.5rem' }}>Delete</Button>
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

// ============================================================
// Create Item Modal
// ============================================================

function CreateItemModal({ onClose, onSuccess }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    location_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCategoryList(100),
      api.getLocationList(100),
    ]).then(([catRes, locRes]) => {
      if (catRes.ok) setCategories(catRes.data || []);
      if (locRes.ok) setLocations(locRes.data || []);
    });
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!form.item_name || !form.category_id || !form.location_id) {
      setError('Please fill out all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const location = locations.find((l) => l.id === form.location_id);
      const category = categories.find((c) => c.id === form.category_id);

      await api.batchCreateItems(
        [
          {
            item_name: form.item_name,
            category_id: form.category_id,
            location_id: form.location_id,
          },
        ],
        location?.position_code || '',
        category?.code || '',
        category?.name || '',
        location?.position_name || ''
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
          <label>Item Name *</label>
          <Input
            value={form.item_name}
            onChange={(e) => setForm({ ...form, item_name: e.target.value })}
            placeholder="Enter item name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="form-select"
            >
              <option value="">-- Select category --</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
              {locations.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.position_name}
                </option>
              ))}
            </select>
          </div>
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
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({
    category_id: '',
    location_id: '',
    count: '1',
  });
  const [itemNames, setItemNames] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCategoryList(100),
      api.getLocationList(100),
    ]).then(([catRes, locRes]) => {
      if (catRes.ok) setCategories(catRes.data || []);
      if (locRes.ok) setLocations(locRes.data || []);
    });
  }, []);

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
      const location = locations.find((l) => l.id === form.location_id);
      const category = categories.find((c) => c.id === form.category_id);

      const batchItems = itemNames.map((name) => ({
        item_name: name,
        category_id: form.category_id,
        location_id: form.location_id,
      }));

      await api.batchCreateItems(
        batchItems,
        location?.position_code || '',
        category?.code || '',
        category?.name || '',
        location?.position_name || ''
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

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="form-select"
            >
              <option value="">-- Select category --</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
              {locations.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.position_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Quantity *</label>
          <Input
            type="number"
            value={form.count}
            onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
            min="1"
            max="100"
          />
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
