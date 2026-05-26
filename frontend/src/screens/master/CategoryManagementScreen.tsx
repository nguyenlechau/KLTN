import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import * as api from '../../api/services';
import '../../styles/master-list.css';

export function CategoryManagementScreen() {
  const [categories, setCategories] = useState<api.Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<api.Category | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadCategories = async (pageNum = 1, searchTerm = '') => {
    setIsLoading(true);
    setError('');
    try {
      const offset = (pageNum - 1) * limit;
      const response = await api.getCategoryList(limit, offset, searchTerm || undefined);
      if (response.ok && response.data) {
        setCategories(response.data);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(1, search);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    loadCategories(1, value);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setShowDeleteConfirm(null);
      loadCategories(page, search);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const columns = [
    { label: 'Code', key: 'code', width: '10%' },
    { label: 'Name', key: 'name', width: '20%' },
    { label: 'Format', key: 'format', width: '15%' },
    { label: 'Price', key: 'unit_price', width: '15%', render: (v: number) => `$${v.toFixed(2)}` },
    { label: 'Unit', key: 'unit_of_measure', width: '12%' },
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
    { label: 'View', onClick: (row: any) => setSelectedCategory(row) },
    { label: 'Edit', onClick: (row: any) => setSelectedCategory(row) },
    { label: 'Delete', onClick: (row: any) => setShowDeleteConfirm(row.id), variant: 'danger' },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>Category Management</h1>
        <p className="screen-subtitle">Manage advertising format categories</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="filter-bar">
        <Input
          placeholder="Search by name or category code..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Button onClick={handleCreate} variant="primary">
          + Add Category
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories found</p>
        </div>
      ) : (
        <>
          <Table columns={columns} data={categories} actions={actions} />
          <div className="pagination">
            <Button
              onClick={() => loadCategories(page - 1, search)}
              disabled={page === 1}
            >
              ← Previous
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              onClick={() => loadCategories(page + 1, search)}
              disabled={page >= totalPages}
            >
              Next →
            </Button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedCategory && (
        <Modal
          title={`Category Details: ${selectedCategory.name}`}
          onClose={() => setSelectedCategory(null)}
        >
          <div className="detail-content">
            <div className="detail-row">
              <label>Category Code:</label>
              <span>{selectedCategory.code}</span>
            </div>
            <div className="detail-row">
              <label>Category Name:</label>
              <span>{selectedCategory.name}</span>
            </div>
            <div className="detail-row">
              <label>Format:</label>
              <span>{selectedCategory.format}</span>
            </div>
            <div className="detail-row">
              <label>Price:</label>
              <span>${selectedCategory.unit_price.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <label>Unit of Measure:</label>
              <span>{selectedCategory.unit_of_measure}</span>
            </div>
            <div className="detail-row">
              <label>Status:</label>
              <span className={`status-badge status-${selectedCategory.status.toLowerCase()}`}>
                {selectedCategory.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>

            <div className="modal-actions">
              <Button
                onClick={() => setSelectedCategory(null)}
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
            <p>Are you sure you want to delete this category?</p>
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
        <CategoryCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCategories(page, search);
          }}
        />
      )}
    </div>
  );
}

function CategoryCreateModal({
  category,
  onClose,
  onSuccess,
}: {
  category?: api.Category;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    code: category?.code || '',
    name: category?.name || '',
    format: category?.format || '',
    unit_price: category?.unit_price.toString() || '',
    unit_of_measure: category?.unit_of_measure || '',
    status: category?.status || 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.code || !form.name || !form.format || !form.unit_price || !form.unit_of_measure) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (category?.id) {
        await api.updateCategory(category.id, {
          ...form,
          unit_price: parseFloat(form.unit_price),
        });
      } else {
        await api.createCategory({
          ...form,
          unit_price: parseFloat(form.unit_price),
          created_by: 'current_user',
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={category ? 'Edit Category' : 'Add New Category'}
      onClose={onClose}
    >
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-row">
          <div className="form-group">
            <label>Category Code *</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. LS"
              maxLength="2"
              disabled={!!category}
            />
          </div>
          <div className="form-group">
            <label>Category Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. LED Screen"
              disabled={!!category}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Format *</label>
          <Input
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value })}
            placeholder="e.g. Static Image"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price *</label>
            <Input
              type="number"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              placeholder="Enter price"
            />
          </div>
          <div className="form-group">
            <label>Unit of Measure *</label>
            <select
              value={form.unit_of_measure}
              onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
              className="form-select"
            >
              <option value="">-- Select --</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Year">Year</option>
              <option value="Unit">Unit</option>
              <option value="Set">Set</option>
            </select>
          </div>
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
