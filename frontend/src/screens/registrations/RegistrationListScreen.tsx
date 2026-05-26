import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import * as api from '../../api/services';
import '../../styles/master-list.css';
import './registration-list.css';

export function RegistrationListScreen() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<api.Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadRegistrations = async (pageNum = 1, searchTerm = '', state = '') => {
    setIsLoading(true);
    setError('');
    try {
      const offset = (pageNum - 1) * limit;
      const response = await api.getRegistrationList(
        limit,
        offset,
        searchTerm || undefined,
        state || undefined
      );
      if (response.ok && response.data && response.data.length > 0) {
        setRegistrations(response.data);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
        return;
      }
    } catch (err: any) {
      // continue to mock data
    }
    
    // Use mock data for testing
    const mockRegistrations: api.Registration[] = [
      {
        id: '1',
        registration_code: 'REG-001',
        campaign_name: 'Summer Campaign 2024',
        brand_name: 'Brand A',
        budget_total: 50000000,
        total_amount: 50000000,
        contact_person: 'John Doe',
        phone: '0901234567',
        email: 'john@brand.com',
        workflow_state: 'APPROVED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        registration_code: 'REG-002',
        campaign_name: 'Autumn Promotion',
        brand_name: 'Brand B',
        budget_total: 75000000,
        total_amount: 75000000,
        contact_person: 'Jane Smith',
        phone: '0912345678',
        email: 'jane@brand.com',
        workflow_state: 'SUPERVISOR_REVIEW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        registration_code: 'REG-003',
        campaign_name: 'Winter Special',
        brand_name: 'Brand C',
        budget_total: 100000000,
        total_amount: 100000000,
        contact_person: 'Mike Johnson',
        phone: '0923456789',
        email: 'mike@brand.com',
        workflow_state: 'DRAFT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setRegistrations(mockRegistrations);
    setTotal(3);
    setPage(1);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRegistrations(1, search, filterState);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    loadRegistrations(1, value, filterState);
  };

  const handleFilterState = (state: string) => {
    setFilterState(state);
    setPage(1);
    loadRegistrations(1, search, state);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/registrations/${id}`);
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SUPERVISOR_REVIEW: 'Supervisor Review',
      CBNV_REVISION: 'Revision Needed',
      BRAND_ACCEPTANCE: 'Brand Acceptance',
      BRAND_MANAGER_APPROVAL: 'Manager Approval',
      APPROVED: 'Approved',
      DEPLOYMENT_PREP: 'Deployment Prep',
      FINAL_ACCEPTANCE: 'Final Acceptance',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return labels[state] || state;
  };

  const columns = [
    { label: 'Code', key: 'registration_code', width: '12%' },
    { label: 'Campaign', key: 'campaign_name', width: '20%' },
    { label: 'Brand', key: 'brand_name', width: '15%' },
    { label: 'Contact', key: 'contact_person', width: '12%' },
    { label: 'Budget', key: 'budget_total', width: '10%', render: (v: number) => `$${(v/1000).toFixed(1)}K` },
    { label: 'Cost', key: 'total_amount', width: '10%', render: (v: number) => `$${(v/1000).toFixed(1)}K` },
    {
      label: 'Status',
      key: 'workflow_state',
      width: '15%',
      render: (v: string) => (
        <span className={`status-badge workflow-${v.toLowerCase().replace(/_/g, '-')}`}>
          {getStateLabel(v)}
        </span>
      ),
    },
  ];

  const actions = [
    { label: 'View Details', onClick: (row: any) => handleViewDetails(row.id) },
  ];

  const totalPages = Math.ceil(total / limit);

  const workflowStates = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUPERVISOR_REVIEW', label: 'Supervisor Review' },
    { value: 'BRAND_ACCEPTANCE', label: 'Brand Acceptance' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const allStates = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUPERVISOR_REVIEW', label: 'Supervisor Review' },
    { value: 'CBNV_REVISION', label: 'Revision Needed' },
    { value: 'BRAND_ACCEPTANCE', label: 'Brand Acceptance' },
    { value: 'BRAND_MANAGER_APPROVAL', label: 'Manager Approval' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DEPLOYMENT_PREP', label: 'Deployment Prep' },
    { value: 'FINAL_ACCEPTANCE', label: 'Final Acceptance' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      case 'SUPERVISOR_REVIEW': return '#3b82f6';
      case 'BRAND_ACCEPTANCE': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>POSM Registration Management</h1>
        <p className="screen-subtitle">Outdoor Advertising Campaign Registration</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="filter-section">
        <div className="search-box-wrapper">
          <Input
            placeholder="Search by registration code, campaign name..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <select
          value={filterState}
          onChange={(e) => handleFilterState(e.target.value)}
          className="filter-select"
        >
          {workflowStates.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </select>
        <Button onClick={handleCreate} variant="primary">
          + Create New
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : registrations.length === 0 ? (
        <div className="empty-state">
          <p>No registrations found</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width: '10%'}}>ID</th>
                  <th style={{width: '20%'}}>Campaign Name</th>
                  <th style={{width: '8%'}}>Key Visual</th>
                  <th style={{width: '12%'}}>Budget</th>
                  <th style={{width: '10%'}}>Start Date</th>
                  <th style={{width: '10%'}}>End Date</th>
                  <th style={{width: '10%'}}>Department</th>
                  <th style={{width: '10%'}}>Status</th>
                  <th style={{width: '10%'}}>Created</th>
                  <th style={{width: '8%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="table-row" onClick={() => handleViewDetails(reg.id)} style={{cursor: 'pointer'}}>
                    <td><strong>{reg.registration_code}</strong></td>
                    <td>
                      <div style={{fontWeight: '500'}}>{reg.campaign_name}</div>
                      <div style={{fontSize: '0.85rem', color: '#666'}}>{reg.brand_name}</div>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <div style={{width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'}}>📷</div>
                    </td>
                    <td>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(reg.budget_total || 0)}
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(reg.workflow_state) }}
                      >
                        {getStateLabel(reg.workflow_state || 'DRAFT')}
                      </span>
                    </td>
                    <td>{new Date(reg.created_at).toLocaleDateString('en-US')}</td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(reg.id);
                        }}
                        style={{fontSize: '0.875rem', padding: '0.375rem 0.75rem'}}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <Button
              onClick={() => loadRegistrations(page - 1, search, filterState)}
              disabled={page === 1}
              variant="secondary"
            >
              ← Previous
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              onClick={() => loadRegistrations(page + 1, search, filterState)}
              disabled={page >= totalPages}
              variant="secondary"
            >
              Next →
            </Button>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <RegistrationCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(id) => {
            setShowCreateModal(false);
            navigate(`/registrations/${id}`);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Create Modal Component
// ============================================================

function RegistrationCreateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [form, setForm] = useState({
    registration_id: 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    campaign_name: '',
    budget: '',
    start_date: '',
    end_date: '',
    content_mode: 'new', // 'new' or 'existing'
    content_name: '',
    key_visual: null as File | null,
    description: '',
    content_type: '',
    department: '',
    account: '',
    title: '',
    user_area: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.campaign_name || !form.budget || !form.content_name) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Mock submission - replace with actual API call
      const response = await new Promise(resolve => {
        setTimeout(() => {
          resolve({ ok: true, data: { id: form.registration_id } });
        }, 500);
      });
      onSuccess(form.registration_id);
    } catch (err: any) {
      setError(err.message || 'Failed to create registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal registration-form-modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 className="modal-title" style={{ margin: '0 0 0.5rem 0' }}>POSM Registration</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Registration ID: {form.registration_id}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {error && <Alert type="error" message={error} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Left Sidebar */}
          <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065f46', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>POSM Registration</h3>
              <button style={{ width: '100%', padding: '0.5rem', backgroundColor: '#065f46', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}>
                ← Back
              </button>
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>Campaign's Content</h3>
              <button style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}>
                Campaign's Content
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div>
            {/* Campaign Info */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Campaign Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <Input
                  label="Campaign Name"
                  value={form.campaign_name}
                  onChange={(val) => setForm({ ...form, campaign_name: val })}
                  placeholder="Placeholder"
                  required
                />
                <Input
                  label="Budget"
                  value={form.budget}
                  onChange={(val) => setForm({ ...form, budget: val })}
                  placeholder="Placeholder"
                  type="number"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Start date"
                  value={form.start_date}
                  onChange={(val) => setForm({ ...form, start_date: val })}
                  placeholder="Placeholder"
                  type="date"
                />
                <Input
                  label="End date"
                  value={form.end_date}
                  onChange={(val) => setForm({ ...form, end_date: val })}
                  placeholder="Placeholder"
                  type="date"
                />
              </div>
            </div>

            {/* Campaign Content Mode */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Campaign's content</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={form.content_mode === 'new'}
                    onChange={() => setForm({ ...form, content_mode: 'new' })}
                  />
                  <span>Create new content</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={form.content_mode === 'existing'}
                    onChange={() => setForm({ ...form, content_mode: 'existing' })}
                  />
                  <span>Use created content</span>
                </label>
              </div>

              {form.content_mode === 'new' ? (
                <>
                  <Input
                    label="Content's name"
                    value={form.content_name}
                    onChange={(val) => setForm({ ...form, content_name: val })}
                    placeholder="Placeholder"
                    required
                  />

                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Content's Key Visual</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '1rem', border: '1px dashed #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f3f4f6' }}>
                      <div style={{ width: '60px', height: '60px', backgroundColor: '#e5e7eb', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        📷
                      </div>
                      <button style={{ padding: '0.5rem 1rem', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        Upload
                      </button>
                      <button style={{ padding: '0.5rem 1rem', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Placeholder"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontFamily: 'inherit', minHeight: '100px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                      label="Content type"
                      value={form.content_type}
                      onChange={(val) => setForm({ ...form, content_type: val })}
                      placeholder="Placeholder"
                    />
                    <Input
                      label="Department"
                      value={form.department}
                      onChange={(val) => setForm({ ...form, department: val })}
                      placeholder="Placeholder"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <Input
                      label="Account"
                      value={form.account}
                      onChange={(val) => setForm({ ...form, account: val })}
                      placeholder="Placeholder"
                    />
                    <Input
                      label="Title"
                      value={form.title}
                      onChange={(val) => setForm({ ...form, title: val })}
                      placeholder="Placeholder"
                    />
                  </div>

                  <Input
                    label="User area"
                    value={form.user_area}
                    onChange={(val) => setForm({ ...form, user_area: val })}
                    placeholder="Placeholder"
                    style={{ marginTop: '1rem' }}
                  />
                </>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  Select from existing content
                </div>
              )}
            </div>

            {/* POSM Registration List */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>List of POSM Registrations</h3>
              <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#059669', fontWeight: '500' }}>Total cost estimation: $30,000</span>
                <span style={{ float: 'right', color: '#059669', fontWeight: '500' }}>Budget: $70,000</span>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                No POSM registrations added. Click "+ Add Channels" to begin.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
