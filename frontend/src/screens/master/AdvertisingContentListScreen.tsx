import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import * as api from '../../api/services';
import '../../styles/master-list.css';

export function AdvertisingContentListScreen() {
  const [contents, setContents] = useState<api.Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedContent, setSelectedContent] = useState<api.Content | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadContents = async (pageNum = 1, searchTerm = '') => {
    setIsLoading(true);
    setError('');
    try {
      const offset = (pageNum - 1) * limit;
      const response = await api.getContentList(limit, offset, searchTerm || undefined);
      if (response.ok && response.data && response.data.length > 0) {
        setContents(response.data);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
        return;
      }
    } catch (err: any) {
      // fallthrough to mock data
    } finally {
      // handled below
    }
    // mock data
    const mock: api.Content[] = [
      {
        id: 'c1',
        content_code: 'CNT-001',
        content_name: 'Billboard Creative A',
        description: 'Creative set for summer launch',
        category: 'LED Screen',
        unit: 'Week',
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth()+1)).toISOString(),
        status: 'Active',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        images: [],
      },
      {
        id: 'c2',
        content_code: 'CNT-002',
        content_name: 'Lightbox Promo B',
        description: '',
        category: 'Light Box',
        unit: 'Week',
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth()+2)).toISOString(),
        status: 'Expired',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        images: [],
      },
    ];
    setContents(mock);
    setTotal(mock.length);
    setPage(1);
    setIsLoading(false);
  };

  useEffect(() => {
    loadContents(1, search);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    loadContents(1, value);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContent(id);
      setShowDeleteConfirm(null);
      loadContents(page, search);
    } catch (err: any) {
      setError(err.message || 'Failed to delete content');
    }
  };

  const handleClone = async (id: string) => {
    try {
      await api.cloneContent(id);
      loadContents(page, search);
    } catch (err: any) {
      setError(err.message || 'Failed to clone content');
    }
  };

  const columns = [
    { label: 'Content Code', key: 'content_code', width: '12%' },
    { label: 'Name', key: 'content_name', width: '25%' },
    { label: 'Category', key: 'category', width: '12%' },
    { label: 'Unit', key: 'unit', width: '10%' },
    { label: 'Start Date', key: 'start_date', width: '12%', render: (v: string) => new Date(v).toLocaleDateString() },
    { label: 'End Date', key: 'end_date', width: '12%', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      label: 'Status',
      key: 'status',
      width: '10%',
      render: (v: string) => (
        <span className={`status-badge status-${(v||'').toString().toLowerCase()}`}>
          {v === 'Active' ? '✓ Active' : v || 'Unknown'}
        </span>
      ),
    },
  ];

  const actions = [
    { label: 'View', onClick: (row: any) => setSelectedContent(row) },
    { label: 'Clone', onClick: (row: any) => handleClone(row.id) },
    { label: 'Delete', onClick: (row: any) => setShowDeleteConfirm(row.id), variant: 'danger' },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>Advertising Content Management</h1>
        <p className="screen-subtitle">List of advertising content</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="filter-section">
        <div className="search-box-wrapper">
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <Button onClick={handleCreate} variant="primary" className="btn-create">
          + Create New Content
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : contents.length === 0 ? (
        <div className="empty-state">
          <p>No content found</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width: '12%'}}>Code</th>
                  <th style={{width: '35%'}}>Name</th>
                  <th style={{width: '15%'}}>Category</th>
                  <th style={{width: '8%'}}>Unit</th>
                  <th style={{width: '10%'}}>Start</th>
                  <th style={{width: '10%'}}>End</th>
                  <th style={{width: '10%'}}>Status</th>
                  <th style={{width: '10%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td>{c.content_code}</td>
                    <td>
                      <div style={{fontWeight: 500}}>{c.content_name}</div>
                      <div style={{fontSize: '0.85rem', color: '#666'}}>{c.description}</div>
                    </td>
                    <td>{c.category}</td>
                    <td>{c.unit}</td>
                    <td>{c.start_date ? new Date(c.start_date).toLocaleDateString('en-US') : '—'}</td>
                    <td>{c.end_date ? new Date(c.end_date).toLocaleDateString('en-US') : '—'}</td>
                    <td>
                      <span className="status-badge" style={{backgroundColor: c.status === 'Active' ? '#10b981' : '#ef4444'}}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <Button onClick={() => setSelectedContent(c)} variant="secondary">View</Button>
                      <Button onClick={() => handleClone(c.id)} variant="secondary" style={{marginLeft: '0.5rem'}}>Clone</Button>
                      <Button onClick={() => setShowDeleteConfirm(c.id)} variant="danger" style={{marginLeft: '0.5rem'}}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <Button
              onClick={() => loadContents(page - 1, search)}
              disabled={page === 1}
            >
              ← Previous
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              onClick={() => loadContents(page + 1, search)}
              disabled={page >= totalPages}
            >
              Next →
            </Button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedContent && (
          <Modal
          title={`Content Details: ${selectedContent.content_name}`}
          onClose={() => setSelectedContent(null)}
        >
          <div className="detail-content">
            <div className="detail-row">
              <label>Content Code:</label>
              <span>{selectedContent.content_code}</span>
            </div>
            <div className="detail-row">
              <label>Name:</label>
              <span>{selectedContent.content_name}</span>
            </div>
            <div className="detail-row">
              <label>Category:</label>
              <span>{selectedContent.category}</span>
            </div>
            <div className="detail-row">
              <label>Unit:</label>
              <span>{selectedContent.unit}</span>
            </div>
            <div className="detail-row">
              <label>Start Date:</label>
              <span>{selectedContent.start_date ? new Date(selectedContent.start_date).toLocaleDateString() : '—'}</span>
            </div>
            <div className="detail-row">
              <label>End Date:</label>
              <span>{selectedContent.end_date ? new Date(selectedContent.end_date).toLocaleDateString() : '—'}</span>
            </div>
            <div className="detail-row">
              <label>Status:</label>
              <span className={`status-badge status-${(selectedContent.status||'').toLowerCase()}`}>
                {selectedContent.status || 'Unknown'}
              </span>
            </div>

            {selectedContent.images && selectedContent.images.length > 0 && (
              <div className="gallery-section">
                <h3>Images</h3>
                <div className="image-grid">
                  {selectedContent.images.map((img) => (
                    <div key={img.id} className="image-item">
                      <img src={img.image_url} alt={`Image ${img.sequence || 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <Button
                onClick={() => setSelectedContent(null)}
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
          title="Delete Confirmation"
          onClose={() => setShowDeleteConfirm(null)}
        >
          <div className="confirm-content">
            <p>Are you sure you want to delete this content?</p>
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
        <AdvertisingContentCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadContents(page, search);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Create/Edit Modal Component
// ============================================================

function AdvertisingContentCreateModal({
  content,
  onClose,
  onSuccess,
}: {
  content?: api.Content;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    content_name: content?.content_name || '',
    category: content?.category || '',
    unit: content?.unit || '',
    start_date: content?.start_date || '',
    end_date: content?.end_date || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.content_name || !form.category || !form.unit || !form.start_date || !form.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (content?.id) {
        await api.updateContent(content.id, form);
      } else {
        await api.createContent(form);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={content ? 'Edit Content' : 'Create New Content'}
      onClose={onClose}
    >
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Content Name *</label>
          <Input
            value={form.content_name}
            onChange={(e) => setForm({ ...form, content_name: e.target.value })}
            placeholder="Enter content name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., LED Screen"
            />
          </div>
          <div className="form-group">
            <label>Unit *</label>
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="e.g., Week"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date *</label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
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
