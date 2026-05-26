import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import * as api from '../../api/services';
import '../../styles/master-list.css';

export function LocationManagementScreen() {
  const [locations, setLocations] = useState<api.Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedLocation, setSelectedLocation] = useState<api.Location | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadLocations = async (pageNum = 1, searchTerm = '') => {
    setIsLoading(true);
    setError('');
    try {
      const offset = (pageNum - 1) * limit;
      const response = await api.getLocationList(limit, offset, searchTerm || undefined);
      if (response.ok && response.data) {
        setLocations(response.data);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocations(1, search);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    loadLocations(1, value);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLocation(id);
      setShowDeleteConfirm(null);
      loadLocations(page, search);
    } catch (err: any) {
      setError(err.message || 'Failed to delete location');
    }
  };

  const columns = [
    { label: 'Code', key: 'position_code', width: '12%' },
    { label: 'Name', key: 'position_name', width: '20%' },
    { label: 'Province/City', key: 'province_city', width: '15%' },
    { label: 'Zone', key: 'zone', width: '12%' },
    { label: 'Address', key: 'address', width: '25%' },
    {
      label: 'Status',
      key: 'status',
      width: '10%',
      render: (v: string) => (
        <span className={`status-badge status-${v.toLowerCase()}`}>
          {v === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
        </span>
      ),
    },
  ];

  const actions = [
    { label: 'View', onClick: (row: any) => setSelectedLocation(row) },
    { label: 'Edit', onClick: (row: any) => setSelectedLocation(row) },
    { label: 'Delete', onClick: (row: any) => setShowDeleteConfirm(row.id), variant: 'danger' },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>Location Management</h1>
        <p className="screen-subtitle">Manage advertising display locations</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="filter-bar">
        <Input
          placeholder="Search by name or location code..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Button onClick={handleCreate} variant="primary">
          + Add Location
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : locations.length === 0 ? (
        <div className="empty-state">
          <p>No locations found</p>
        </div>
      ) : (
        <>
          <Table columns={columns} data={locations} actions={actions} />
          <div className="pagination">
            <Button
              onClick={() => loadLocations(page - 1, search)}
              disabled={page === 1}
            >
              ← Previous
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              onClick={() => loadLocations(page + 1, search)}
              disabled={page >= totalPages}
            >
              Next →
            </Button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedLocation && (
        <Modal
          title={`Location Details: ${selectedLocation.position_name}`}
          onClose={() => setSelectedLocation(null)}
        >
          <div className="detail-content">
            <div className="detail-row">
              <label>Location Code:</label>
              <span>{selectedLocation.position_code}</span>
            </div>
            <div className="detail-row">
              <label>Location Name:</label>
              <span>{selectedLocation.position_name}</span>
            </div>
            <div className="detail-row">
              <label>Province/City:</label>
              <span>{selectedLocation.province_city}</span>
            </div>
            <div className="detail-row">
              <label>Zone:</label>
              <span>{selectedLocation.zone}</span>
            </div>
            <div className="detail-row">
              <label>Address:</label>
              <span>{selectedLocation.address}</span>
            </div>
            <div className="detail-row">
              <label>Status:</label>
              <span className={`status-badge status-${selectedLocation.status.toLowerCase()}`}>
                {selectedLocation.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>

            <div className="modal-actions">
              <Button
                onClick={() => setSelectedLocation(null)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          title="Confirm Delete"
          onClose={() => setShowDeleteConfirm(null)}
        >
          <div className="confirm-content">
            <p>Are you sure you want to delete this location?</p>
            <div className="modal-actions">
              <Button
                onClick={() => handleDelete(showDeleteConfirm)}
                variant="danger"
              >
                Delete
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <LocationCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadLocations(page, search);
          }}
        />
      )}
    </div>
  );
}

function LocationCreateModal({
  location,
  onClose,
  onSuccess,
}: {
  location?: api.Location;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    position_code: location?.position_code || '',
    position_name: location?.position_name || '',
    province_city: location?.province_city || '',
    zone: location?.zone || '',
    address: location?.address || '',
    status: location?.status || 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState(location?.channel_id || '');

  useEffect(() => {
    // Load channels - TODO: create API endpoint
    setChannels([
      { id: '1', name: 'Indoor' },
      { id: '2', name: 'Outdoor' },
    ]);
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!form.position_code || !form.position_name || !form.province_city || !form.zone || !form.address || !selectedChannel) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (location?.id) {
        await api.updateLocation(location.id, {
          ...form,
          channel_id: selectedChannel,
        });
      } else {
        await api.createLocation({
          ...form,
          channel_id: selectedChannel,
          created_by: 'current_user',
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={location ? 'Edit Location' : 'Add New Location'}
      onClose={onClose}
    >
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Channel *</label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="form-select"
          >
            <option value="">-- Select Channel --</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Location Code *</label>
          <Input
            value={form.position_code}
            onChange={(e) => setForm({ ...form, position_code: e.target.value })}
            placeholder="e.g. LOC"
            maxLength="3"
            disabled={!!location}
          />
        </div>

        <div className="form-group">
          <label>Location Name *</label>
          <Input
            value={form.position_name}
            onChange={(e) => setForm({ ...form, position_name: e.target.value })}
            placeholder="Enter location name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Province/City *</label>
            <Input
              value={form.province_city}
              onChange={(e) => setForm({ ...form, province_city: e.target.value })}
              placeholder="e.g. Ho Chi Minh City"
            />
          </div>
          <div className="form-group">
            <label>Zone *</label>
            <Input
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              placeholder="e.g. District 1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Address *</label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Enter full address"
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="form-select"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="modal-actions">
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
