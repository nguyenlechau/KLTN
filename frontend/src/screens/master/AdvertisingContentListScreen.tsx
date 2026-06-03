import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { LoadingOverlay } from '../../components/Spinner';
import { useRole, canManageMasterData } from '../../hooks/useRole';
import * as api from '../../api/services';
import '../../styles/master-list.css';

export function AdvertisingContentListScreen() {
  const role = useRole();
  const canWrite = canManageMasterData(role);
  const [contents, setContents] = useState<api.Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedContent, setSelectedContent] = useState<api.Content | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<api.Content | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getPrimaryImage = (content: api.Content): string | null => {
    if (content.images && content.images.length > 0 && content.images[0].image_url) {
      return content.images[0].image_url;
    }
    const rawKeys = (content as any).image_keys;
    if (typeof rawKeys === 'string') {
      try {
        const parsed = JSON.parse(rawKeys);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string' && /^https?:\/\//.test(parsed[0])) {
          return parsed[0];
        }
      } catch {
        // Ignore invalid legacy image_keys format.
      }
    }
    return null;
  };

  const loadContents = async (pageNum = 1, searchTerm = '') => {
    setIsLoading(true);
    setError('');
    try {
      const offset = (pageNum - 1) * limit;
      const response = await api.getContentList(limit, offset, searchTerm || undefined);

      if (response.ok && response.data) {
        const enriched = await Promise.all(
          response.data.map(async (item) => {
            try {
              const detailResponse = await api.getContentById(item.id);
              if (detailResponse.ok && detailResponse.data) {
                return {
                  ...item,
                  images: detailResponse.data.images || item.images || [],
                } as api.Content;
              }
            } catch {
              // Keep list item when detail endpoint fails.
            }
            return item;
          })
        );

        setContents(enriched);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
      } else {
        setContents([]);
        setTotal(0);
        setPage(pageNum);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
      setContents([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
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
      const response = await api.deleteContent(id);
      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      setContents((prev) => prev.filter((item) => item.id !== id));
      setShowDeleteConfirm(null);
      await loadContents(page, search);
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
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        {canWrite && (
          <Button onClick={handleCreate} variant="primary" className="btn-create">
            + Create New Content
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingOverlay text="Loading content…" />
      ) : contents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <h3>No content found</h3>
          <p>{search ? 'Try a different search term.' : 'Create your first advertising content item.'}</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width: '8%'}}>Photo</th>
                  <th style={{width: '12%'}}>Code</th>
                  <th style={{width: '28%'}}>Name</th>
                  <th style={{width: '13%'}}>Category</th>
                  <th style={{width: '8%'}}>Unit</th>
                  <th style={{width: '10%'}}>Start</th>
                  <th style={{width: '10%'}}>End</th>
                  <th style={{width: '10%'}}>Status</th>
                  <th style={{width: '11%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td>
                      {getPrimaryImage(c) ? (
                        <img
                          src={getPrimaryImage(c) as string}
                          alt={c.content_name}
                          className="thumb"
                        />
                      ) : (
                        <div className="thumb-placeholder">—</div>
                      )}
                    </td>
                    <td>{c.content_code}</td>
                    <td>
                      <div>
                        <div className="cell-primary">{c.content_name}</div>
                        <div className="cell-secondary">{c.description}</div>
                      </div>
                    </td>
                    <td>{c.category}</td>
                    <td>{c.unit}</td>
                    <td>{c.start_date ? new Date(c.start_date).toLocaleDateString('en-US') : '—'}</td>
                    <td>{c.end_date ? new Date(c.end_date).toLocaleDateString('en-US') : '—'}</td>
                    <td>
                      <span className={`status-badge status-${(c.status||'').toUpperCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button onClick={() => setSelectedContent(c)} variant="secondary" className="btn-sm">View</Button>
                        {canWrite && <Button onClick={() => setShowEditModal(c)} variant="secondary" className="btn-sm">Edit</Button>}
                        {canWrite && <Button onClick={() => handleClone(c.id)} variant="secondary" className="btn-sm">Clone</Button>}
                        {canWrite && <Button onClick={() => setShowDeleteConfirm(c.id)} variant="danger" className="btn-sm">Delete</Button>}
                      </div>
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

            {(!selectedContent.images || selectedContent.images.length === 0) && (
              <div style={{ color: '#777', marginTop: '0.5rem' }}>No photo attached</div>
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

      {/* Edit Modal */}
      {showEditModal && (
        <AdvertisingContentCreateModal
          content={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSuccess={() => {
            setShowEditModal(null);
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
    start_date: content?.start_date ? content.start_date.slice(0, 10) : '',
    end_date: content?.end_date ? content.end_date.slice(0, 10) : '',
    key_visual_url: content?.images?.[0]?.image_url || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<api.Category[]>([]);

  useEffect(() => {
    api.getCategoryList().then((res) => {
      if (res.ok) setCategories(res.data || []);
    }).catch(() => {});
  }, []);

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
        const created = await api.createContent(form);
        if (form.key_visual_url && created.ok && created.data?.id) {
          await api.addContentImage(created.data.id, form.key_visual_url, undefined);
        }
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
            onChange={(value) => setForm({ ...form, content_name: value })}
            placeholder="Enter content name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="form-select"
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Unit *</label>
            <Input
              value={form.unit}
              onChange={(value) => setForm({ ...form, unit: value })}
              placeholder="e.g., Week"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Key Visual URL</label>
          <Input
            value={form.key_visual_url}
            onChange={(value) => setForm({ ...form, key_visual_url: value })}
            placeholder="https://example.com/creative.jpg"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(value) => setForm({ ...form, start_date: value })}
            />
          </div>
          <div className="form-group">
            <label>End Date *</label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(value) => setForm({ ...form, end_date: value })}
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
