import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { useRole, canManageMasterData } from '../../hooks/useRole';
import * as api from '../../api/services';
import '../../styles/master-list.css';

export function LocationManagementScreen() {
  const role = useRole();
  const canWrite = canManageMasterData(role);
  const [locations, setLocations] = useState<api.Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedLocation, setSelectedLocation] = useState<api.Location | null>(null);
  const [editingLocation, setEditingLocation] = useState<api.Location | null>(null);
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

  const tableHeaders = ['Code', 'Name', 'Province', 'Channels', 'Address', 'Status', 'Actions'];
  const tableRows = locations.map((row) => [
    (row as any).code || (row as any).position_code || '-',
    (row as any).name || (row as any).position_name || '-',
    (row as any).province || (row as any).province_city || '-',
    ((row as any).channels || []).join(', ') || '-',
    (row as any).address_line || (row as any).address || '-',
    <span className={`status-badge status-${row.status.toLowerCase()}`}>
      {row.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
    </span>,
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button variant="secondary" onClick={() => setSelectedLocation(row)}>View</Button>
      {canWrite && <Button variant="secondary" onClick={() => setEditingLocation(row)}>Edit</Button>}
      {canWrite && <Button variant="danger" onClick={() => setShowDeleteConfirm((row as any).id)}>Delete</Button>}
    </div>,
  ]);

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
          onChange={handleSearch}
        />
        {canWrite && (
          <Button onClick={handleCreate} variant="primary">
            + Add Location
          </Button>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : locations.length === 0 ? (
        <div className="empty-state">
          <p>No locations found</p>
        </div>
      ) : (
        <>
          <Table headers={tableHeaders} rows={tableRows} />
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
          title={`Location Details: ${(selectedLocation as any).name || selectedLocation.position_name || 'Unknown'}`}
          onClose={() => setSelectedLocation(null)}
        >
          <div className="detail-content">
            <div className="detail-row">
              <label>Location Code:</label>
              <span>{(selectedLocation as any).code || selectedLocation.position_code}</span>
            </div>
            <div className="detail-row">
              <label>Location Name:</label>
              <span>{(selectedLocation as any).name || selectedLocation.position_name}</span>
            </div>
            <div className="detail-row">
              <label>Province:</label>
              <span>{(selectedLocation as any).province || selectedLocation.province_city || '-'}</span>
            </div>
            <div className="detail-row">
              <label>Channels:</label>
              <span>{((selectedLocation as any).channels || []).join(', ') || '-'}</span>
            </div>
            <div className="detail-row">
              <label>Address:</label>
              <span>{(selectedLocation as any).address_line || selectedLocation.address || '-'}</span>
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

      {editingLocation && (
        <LocationCreateModal
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSuccess={() => {
            setEditingLocation(null);
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
    position_code: location?.position_code || (location as any)?.code || '',
    position_name: location?.position_name || (location as any)?.name || '',
    province_city: location?.province_city || (location as any)?.province || '',
    zone: location?.zone || '',
    address: location?.address || (location as any)?.address_line || '',
    status: location?.status || 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    (location as any)?.channels || (location?.channel_id ? [location.channel_id] : [])
  );

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await api.getChannelList();
        if (response.ok) {
          setChannels(response.data || []);
        }
      } catch {
        setChannels([]);
      }
    };
    loadChannels();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!location?.id) {
      if (!form.position_code || !form.position_name || !form.province_city || !form.zone || !form.address || selectedChannels.length === 0) {
        setError('Please fill in all required fields');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (location?.id) {
        const payload: any = {
          ...form,
          channels: selectedChannels,
        };
        await api.updateLocation(location.id, payload);
      } else {
        await api.createLocation({
          ...form,
          channel_id: selectedChannels[0] || '',
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
          <label>Channels *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.25rem' }}>
            {channels.map((c) => {
              const code = c.code || c.id;
              const checked = selectedChannels.includes(code);
              return (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedChannels((prev) =>
                        e.target.checked ? [...prev, code] : prev.filter((v) => v !== code)
                      );
                    }}
                  />
                  {c.code ? `${c.code} - ${c.name}` : c.name}
                </label>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label>Location Code *</label>
          <Input
            value={form.position_code}
            onChange={(value) => setForm({ ...form, position_code: value })}
            placeholder="e.g. LOC"
            maxLength={3}
            disabled={!!location}
          />
        </div>

        <div className="form-group">
          <label>Location Name *</label>
          <Input
            value={form.position_name}
            onChange={(value) => setForm({ ...form, position_name: value })}
            placeholder="Enter location name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Province/City *</label>
            <Input
              value={form.province_city}
              onChange={(value) => setForm({ ...form, province_city: value })}
              placeholder="e.g. Ho Chi Minh City"
            />
          </div>
          <div className="form-group">
            <label>Zone *</label>
            <Input
              value={form.zone}
              onChange={(value) => setForm({ ...form, zone: value })}
              placeholder="e.g. District 1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Address *</label>
          <Input
            value={form.address}
            onChange={(value) => setForm({ ...form, address: value })}
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
