import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { LoadingOverlay } from '../../components/Spinner';
import { useRole, canCreateRegistration } from '../../hooks/useRole';
import * as api from '../../api/services';
import '../../styles/master-list.css';
import './registration-list.css';

export function RegistrationListScreen() {
  const navigate = useNavigate();
  const role = useRole();
  const canCreate = canCreateRegistration(role);
  const [registrations, setRegistrations] = useState<api.Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

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
      if (response.ok && response.data) {
        setRegistrations(response.data);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load registrations');
      setRegistrations([]);
      setTotal(0);
      setPage(1);
      return;
    } finally {
      setIsLoading(false);
    }

    setRegistrations([]);
    setTotal(0);
    setPage(1);
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
    navigate('/registrations/new');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/registrations/${id}`);
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SUPERVISOR_REVIEW: 'Supervisor Review',
      CBNV_REVISION: 'Requester Revision',
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

  const getStatusClass = (state: string) => {
    const classMap: Record<string, string> = {
      DRAFT: 'workflow-draft',
      SUPERVISOR_REVIEW: 'workflow-supervisor-review',
      CBNV_REVISION: 'workflow-cbnv-revision',
      BRAND_ACCEPTANCE: 'workflow-brand-acceptance',
      BRAND_MANAGER_APPROVAL: 'workflow-brand-manager-approval',
      APPROVED: 'workflow-approved',
      DEPLOYMENT_PREP: 'workflow-deployment-prep',
      FINAL_ACCEPTANCE: 'workflow-final-acceptance',
      COMPLETED: 'workflow-completed',
      CANCELLED: 'workflow-cancelled',
    };
    return classMap[state] || 'workflow-draft';
  };

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
    { value: 'CBNV_REVISION', label: 'Requester Revision' },
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

  const handleExportCsv = () => {
    if (registrations.length === 0) return;
    const headers = [
      'Registration Code',
      'Campaign Name',
      'Brand',
      'Budget Total',
      'Total Amount',
      'Workflow State',
      'Created At',
    ];
    const rows = registrations.map((reg) => [
      reg.registration_code,
      reg.campaign_name,
      reg.brand_name,
      String(reg.budget_total ?? 0),
      String(reg.total_amount ?? 0),
      reg.workflow_state,
      reg.created_at,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="screen-header-text">
          <h1>POSM Registration Management</h1>
          <p className="screen-subtitle">Outdoor Advertising Campaign Registration</p>
        </div>
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
        <Button onClick={handleExportCsv} variant="secondary" disabled={registrations.length === 0}>
          Export CSV
        </Button>
        {canCreate && (
          <Button onClick={handleCreate} variant="primary">
            + Create New
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingOverlay text="Loading registrations…" />
      ) : registrations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No registrations found</h3>
          <p>{search || filterState ? 'Try adjusting your search or filter.' : 'Create your first campaign registration to get started.'}</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Campaign Name</th>
                  <th>Budget</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="table-row" onClick={() => handleViewDetails(reg.id)}>
                    <td style={{whiteSpace: 'nowrap'}}><strong>{reg.registration_code}</strong></td>
                    <td>
                      <div className="cell-primary">{reg.campaign_name}</div>
                      <div className="cell-secondary">{reg.brand_name}</div>
                    </td>
                    <td style={{whiteSpace: 'nowrap'}}>
                      {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(reg.budget_total || 0)} VND
                    </td>
                    <td style={{whiteSpace: 'nowrap'}}>
                      {reg.start_date ? new Date(reg.start_date).toLocaleDateString('en-US') : '—'}
                    </td>
                    <td style={{whiteSpace: 'nowrap'}}>
                      {reg.end_date ? new Date(reg.end_date).toLocaleDateString('en-US') : '—'}
                    </td>
                    <td>{reg.department_id || '—'}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(reg.workflow_state)}`}>
                        {getStateLabel(reg.workflow_state || 'DRAFT')}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        className="btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(reg.id);
                        }}
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
    </div>
  );
}

export function RegistrationCreateScreen() {
  const navigate = useNavigate();

  return (
    <RegistrationCreateModal
      fullPage
      onClose={() => navigate('/registrations')}
      onSuccess={(id) => navigate(`/registrations/${id}`)}
    />
  );
}

// ============================================================
// Create Modal Component
// ============================================================

function RegistrationCreateModal({
  onClose,
  onSuccess,
  fullPage = false,
}: {
  onClose: () => void;
  onSuccess: (id: string) => void;
  fullPage?: boolean;
}) {
  const [form, setForm] = useState({
    registration_id: 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    campaign_name: '',
    budget: '',
    start_date: '',
    end_date: '',
    content_mode: 'new',
    content_name: '',
    existing_content_id: '',
    key_visual_url: '',
    description: '',
    content_type: '',
    department: '',
    account: '',
    title: '',
    user_area: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [pendingChannelId, setPendingChannelId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState('');

  const [selectedPosmItems, setSelectedPosmItems] = useState<Array<{
    item_id: string;
    item_name: string;
    item_code: string;
    channel_id: string;
    channel_label: string;
    category_id: string;
    category_name: string;
    location_id: string;
    location_name: string;
    quantity: number;
    unit_price: number;
    width: number;
    length: number;
    measure_unit: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategoryList(200, 0, undefined, undefined, 'ACTIVE')
      .then((catRes) => {
        if (catRes.ok) {
          setCategories((catRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'));
        }
      })
      .catch(() => setCategories([]));

    api.getContentList(200, 0)
      .then((contentRes) => {
        if (contentRes.ok) {
          const allContents = contentRes.data || [];
          const activeContents = allContents.filter((entry: any) => {
            const status = String(entry.status || '').toLowerCase();
            return status.includes('active');
          });
          setContents(activeContents.length > 0 ? activeContents : allContents);
        }
      })
      .catch(() => setContents([]));

    api.getChannelList()
      .then((channelRes) => {
        if (channelRes.ok) {
          const activeChannels = (channelRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE');
          setChannels(activeChannels);
        }
      })
      .catch(() => setChannels([]));

    api.getLocationList(500, 0, undefined, undefined, 'ACTIVE')
      .then((locationRes) => {
        if (locationRes.ok) {
          setLocations((locationRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'));
        }
      })
      .catch(() => setLocations([]));

    api.getItemList(500, 0)
      .then((itemRes) => {
        if (itemRes.ok) {
          setItems((itemRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'));
        }
      })
      .catch(() => setItems([]));
  }, []);

  const locationMap = useMemo(
    () => new Map(locations.map((entry: any) => [entry.id, entry])),
    [locations],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((entry: any) => [entry.id, entry])),
    [categories],
  );
  const channelMap = useMemo(
    () => new Map(channels.map((entry: any) => [String(entry.id), entry])),
    [channels],
  );

  const activeItems = useMemo(
    () => items.filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'),
    [items],
  );

  const channelOptions = useMemo(() => {
    const ids = Array.from(new Set(activeItems.map((entry: any) => String(entry.channel_id || '')).filter(Boolean)));
    return ids.map((id) => {
      const channel = channelMap.get(id);
      if (channel) {
        const code = String(channel.code || '').toUpperCase();
        const friendlyName = code === 'CN'
          ? 'Branches'
          : code === 'HO'
            ? 'Head Office'
            : (channel.name || `Channel ${id}`);
        const channelCode = channel.code ? `${channel.code} · ` : '';
        return {
          id,
          label: `${channelCode}${friendlyName}`,
        };
      }
      const location = locations.find((entry: any) => String(entry.channel_id || '') === id);
      const locationCode = location?.position_code || location?.code;
      return {
        id,
        label: locationCode ? `${locationCode} (${id})` : `Channel ${id}`,
      };
    });
  }, [activeItems, locations, channelMap]);

  const itemsByChannel = useMemo(() => {
    if (selectedChannelIds.length === 0) {
      return activeItems;
    }
    return activeItems.filter((entry: any) => selectedChannelIds.includes(String(entry.channel_id)));
  }, [activeItems, selectedChannelIds]);

  const availableCategories = useMemo(() => {
    const categoryIds = new Set(itemsByChannel.map((entry: any) => String(entry.category_id)));
    return categories.filter((entry: any) => categoryIds.has(String(entry.id)));
  }, [itemsByChannel, categories]);

  const itemsByCategory = useMemo(
    () => itemsByChannel.filter((entry: any) => !selectedCategoryId || String(entry.category_id) === selectedCategoryId),
    [itemsByChannel, selectedCategoryId],
  );

  const availableLocationIds = useMemo(
    () => new Set(itemsByCategory.map((entry: any) => String(entry.location_id))),
    [itemsByCategory],
  );

  const availableLocations = useMemo(
    () => locations.filter((entry: any) => availableLocationIds.has(String(entry.id))),
    [locations, availableLocationIds],
  );

  const availableItems = useMemo(
    () => itemsByCategory.filter((entry: any) => !selectedLocationId || String(entry.location_id) === selectedLocationId),
    [itemsByCategory, selectedLocationId],
  );

  useEffect(() => {
    if (selectedChannelIds.length === 0 && channelOptions.length > 0) {
      setSelectedChannelIds([channelOptions[0].id]);
    }
  }, [channelOptions, selectedChannelIds.length]);

  const formatChannelDisplay = (label: string) => {
    if (label.includes('Branches')) {
      return 'Branch Channel';
    }
    if (label.includes('Head Office')) {
      return 'Head Office Channel';
    }
    if (label.includes('HO')) {
      return 'OOH Channel';
    }
    return label.replace('CN · ', 'Channel ').replace('HO · ', 'Channel ');
  };

  const addPosmItem = () => {
    setError('');
    if (selectedChannelIds.length === 0 || !selectedCategoryId || !selectedLocationId) {
      setError('Please select channel, category, and location before choosing POSM');
      return;
    }

    if (!selectedItemId) {
      setError('Please select a POSM item');
      return;
    }

    const quantity = Math.max(1, Number(selectedItemQty) || 1);
    const selected = availableItems.find((entry: any) => String(entry.id) === selectedItemId);
    if (!selected) {
      setError('Selected POSM item is not available');
      return;
    }

    const category = categoryMap.get(String(selected.category_id));
    const location = locationMap.get(String(selected.location_id));
    const channel = channelOptions.find((entry) => entry.id === String(selected.channel_id));
    const unitPrice = Number(category?.unit_price ?? 0);
    const widthValue = Number(selected.width_m ?? selected.width ?? 0);
    const lengthValue = Number(selected.length_m ?? selected.length ?? 0);
    const measureUnit = String(category?.unit_of_measure || 'm');

    setSelectedPosmItems((prev) => {
      const existing = prev.find((entry) => entry.item_id === selected.id);
      if (existing) {
        return prev.map((entry) => (
          entry.item_id === selected.id
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        ));
      }

      return [
        ...prev,
        {
          item_id: selected.id,
          item_name: selected.item_name,
          item_code: selected.item_code,
          channel_id: String(selected.channel_id),
          channel_label: channel?.label || String(selected.channel_id),
          category_id: selected.category_id,
          category_name: category?.name || 'Unknown Category',
          location_id: selected.location_id,
          location_name: location?.position_name || location?.name || String(selected.location_id),
          quantity,
          unit_price: unitPrice,
          width: widthValue,
          length: lengthValue,
          measure_unit: measureUnit,
        },
      ];
    });

    setSelectedCategoryId('');
    setSelectedLocationId('');
    setSelectedItemId('');
    setSelectedItemQty('');
  };

  const removePosmItem = (itemId: string) => {
    setSelectedPosmItems((prev) => prev.filter((entry) => entry.item_id !== itemId));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.campaign_name || !form.budget) {
      setError('Please fill in campaign and budget');
      return;
    }

    if (form.content_mode === 'new' && !form.content_name) {
      setError('Please enter campaign content name');
      return;
    }

    if (form.content_mode === 'existing' && !form.existing_content_id) {
      setError('Please select existing campaign content');
      return;
    }

    if (selectedPosmItems.length === 0) {
      setError('Please add at least one POSM item');
      return;
    }

    if (Number(form.budget) <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const locationResponse = await api.getLocationList(1, 0, undefined, undefined, 'ACTIVE');
      const fallbackChannelId = (locationResponse.data && locationResponse.data[0]?.channel_id) || '1';

      const createdRegistration = await api.createRegistration({
        campaign_name: form.campaign_name,
        department_id: form.department || 'MARKETING',
        channel_id: selectedPosmItems[0]?.channel_id || selectedChannelIds[0] || fallbackChannelId,
        brand_name: form.title || form.campaign_name,
        contact_person: form.account || 'User',
        phone: '0900000000',
        email: localStorage.getItem('user_email') || 'user@example.com',
        budget_total: Number(form.budget),
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      });

      const registrationId = createdRegistration?.data?.id;
      if (!registrationId) {
        throw new Error('Failed to create registration');
      }

      let selectedContentId = form.existing_content_id;
      if (form.content_mode === 'new') {
        const selectedCategory = categories.find((entry: any) => entry.name === form.content_type || entry.code === form.content_type);
        const content = await api.createContent({
          content_name: form.content_name,
          description: form.description || undefined,
          category: selectedCategory?.code || form.content_type || 'GENERAL',
          unit: 'Week',
          start_date: form.start_date || new Date().toISOString().slice(0, 10),
          end_date: form.end_date || new Date().toISOString().slice(0, 10),
        });

        selectedContentId = content?.data?.id || '';

        if (selectedContentId && form.key_visual_url.trim()) {
          await api.addContentImage(selectedContentId, form.key_visual_url.trim());
        }
      }

      if (selectedContentId) {
        await api.addRegistrationContent(
          registrationId,
          selectedContentId,
          form.start_date || new Date().toISOString().slice(0, 10),
          form.end_date || new Date().toISOString().slice(0, 10),
          1,
        );
      }

      for (const item of selectedPosmItems) {
        await api.addRegistrationItem(
          registrationId,
          item.item_id,
          item.category_id,
          item.quantity,
        );
      }

      onSuccess(registrationId);
    } catch (err: any) {
      setError(err.message || 'Failed to create registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={fullPage ? 'screen-container' : 'modal-overlay'}>
      <div
        className={fullPage ? 'registration-create-page' : 'modal registration-form-modal'}
        style={fullPage
          ? {
              maxWidth: '1280px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }
          : { maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 className="modal-title" style={{ margin: '0 0 0.5rem 0' }}>POSM Registration</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Registration ID: {form.registration_id}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: fullPage ? '0.95rem' : '1.5rem',
              fontWeight: fullPage ? 600 : 400,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            {fullPage ? '← Back to registrations' : '×'}
          </button>
        </div>

        {error && <Alert type="error" message={error} />}

        <div>
            {/* Campaign Info */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Campaign Information</h3>
              <div>
                <div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {form.key_visual_url ? (
                        <img
                          src={form.key_visual_url}
                          alt="Key visual preview"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.35rem', border: '1px solid #d1d5db' }}
                        />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.35rem', border: '1px dashed #9ca3af', display: 'grid', placeItems: 'center', color: '#9ca3af', fontSize: '0.75rem' }}>No
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <Input
                          value={form.key_visual_url}
                          onChange={(val) => setForm({ ...form, key_visual_url: val })}
                          placeholder="Paste key visual image URL"
                        />
                      </div>
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
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Existing campaign content *</label>
                  <select
                    value={form.existing_content_id}
                    onChange={(e) => setForm({ ...form, existing_content_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  >
                    <option value="">-- Select active content --</option>
                    {contents.map((entry: any) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.content_name} ({entry.content_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* POSM Registration List */}
            <div className="posm-builder">
              <h3 className="posm-builder-title">List of POSM Registrations</h3>
              <div className="posm-budget-bar">
                {(() => {
                  const budgetVal = form.budget ? Number(form.budget) : 0;
                  const totalEstimate = selectedPosmItems.reduce((sum, entry) => sum + (entry.unit_price * entry.quantity), 0);
                  const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
                  return (
                    <>
                      <div className="posm-budget-left-wrap">
                        <span className="posm-budget-metric">Total cost: {fmt.format(totalEstimate)} VND</span>
                        <span className="posm-budget-note">(*) Cost excludes shipping and installation</span>
                      </div>
                      <span className="posm-budget-metric posm-budget-right">Estimated budget: {fmt.format(budgetVal)} VND</span>
                    </>
                  );
                })()}
              </div>

              <div className="posm-channel-strip">
                {selectedChannelIds.map((channelId) => {
                  const channel = channelOptions.find((entry) => entry.id === channelId);
                  return (
                    <div key={channelId} className="posm-channel-pill active">
                      <span>{formatChannelDisplay(channel?.label || channelId)}</span>
                      <button type="button" className="posm-mini-icon" aria-label="Edit channel">✎</button>
                      <button
                        type="button"
                        className="posm-mini-icon"
                        aria-label={`Remove ${channel?.label || channelId}`}
                        onClick={() => {
                          setSelectedChannelIds((prev) => prev.filter((id) => id !== channelId));
                          setSelectedCategoryId('');
                          setSelectedLocationId('');
                          setSelectedItemId('');
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}

                <div className="posm-channel-pill add">
                  <select
                    value={pendingChannelId}
                    onChange={(e) => setPendingChannelId(e.target.value)}
                    className="posm-channel-select"
                  >
                    <option value="">+ Add channel</option>
                    {channelOptions
                      .filter((entry) => !selectedChannelIds.includes(entry.id))
                      .map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {formatChannelDisplay(entry.label)}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="posm-mini-dot"
                    onClick={() => {
                      if (!pendingChannelId) {
                        return;
                      }
                      setSelectedChannelIds((prev) => {
                        if (prev.includes(pendingChannelId)) {
                          return prev;
                        }
                        return [...prev, pendingChannelId];
                      });
                      setPendingChannelId('');
                      setSelectedCategoryId('');
                      setSelectedLocationId('');
                      setSelectedItemId('');
                    }}
                    aria-label="Add channel"
                  >
                    ○
                  </button>
                </div>
              </div>

              <div className="posm-controls-grid">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSelectedLocationId('');
                    setSelectedItemId('');
                  }}
                  disabled={selectedChannelIds.length === 0}
                  className="posm-select"
                >
                  <option value="">-- Select category --</option>
                  {availableCategories.map((entry: any) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLocationId}
                  onChange={(e) => {
                    setSelectedLocationId(e.target.value);
                    setSelectedItemId('');
                  }}
                  className="posm-select"
                  disabled={!selectedCategoryId}
                >
                  <option value="">-- Select location --</option>
                  {availableLocations.map((entry: any) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.position_name || entry.name || entry.position_code || entry.code}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="posm-select"
                  disabled={!selectedLocationId}
                >
                  <option value="">-- Select POSM item --</option>
                  {availableItems.map((entry: any) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.item_name} ({entry.item_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="posm-add-row">
                <Input
                  label="Quantity"
                  value={selectedItemQty}
                  onChange={setSelectedItemQty}
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                />
                <Button onClick={addPosmItem} variant="secondary">+ Add item</Button>
              </div>

              {selectedPosmItems.length === 0 ? (
                <div className="posm-empty-state">
                  No POSM items added yet.
                </div>
              ) : (
                <div className="posm-grouped-panel">
                  {Object.entries(
                    selectedPosmItems.reduce((acc: Record<string, Record<string, typeof selectedPosmItems>>, item) => {
                      const categoryKey = item.category_name || 'Uncategorized';
                      const locationKey = item.location_name || 'Unknown Location';
                      if (!acc[categoryKey]) {
                        acc[categoryKey] = {};
                      }
                      if (!acc[categoryKey][locationKey]) {
                        acc[categoryKey][locationKey] = [];
                      }
                      acc[categoryKey][locationKey].push(item);
                      return acc;
                    }, {})
                  ).map(([categoryName, locationMap], categoryIndex) => (
                    <div key={categoryName} className={`posm-category-block${categoryIndex === 0 ? ' first' : ''}`}>
                      <div className="posm-category-header">
                        <div>
                          <span className="posm-accordion-arrow">⌄</span>
                          <span className="posm-category-prefix">Category:</span>
                          <span className="posm-category-name">{categoryName}</span>
                        </div>
                        <span className="posm-category-actions">✎  🗑</span>
                      </div>

                      {Object.entries(locationMap).map(([locationName, products], locationIndex) => (
                        <div key={`${categoryName}-${locationName}`} className={`posm-location-block${locationIndex === 0 ? ' first' : ''}`}>
                          <div className="posm-location-meta">
                            <span>Design unit price: {Number(products[0]?.unit_price || 0).toLocaleString('en-US')} VND</span>
                          </div>

                          <div className="posm-location-header">
                            <span>
                              Selected locations: <span className="posm-green">{products.length}</span> / {availableLocations.length || products.length}
                              <button type="button" className="posm-inline-link">Add location</button>
                            </span>
                          </div>

                          <div className="posm-location-title-row">
                            <span>Hanoi, location: {locationName}</span>
                            <span>Items added: <span className="posm-green">{products.length}</span></span>
                          </div>

                          <div className="posm-table-shell">
                            <table className="posm-products-table">
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Item</th>
                                  <th className="right">Amount</th>
                                  <th className="center">Current KV</th>
                                  <th className="center"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {products.map((entry, productIndex) => (
                                  <tr key={entry.item_id}>
                                    <td>{productIndex + 1}</td>
                                    <td>
                                      <div className="posm-product-name">{entry.item_name}</div>
                                      <div className="posm-product-meta">{entry.item_code} • {entry.width} x {entry.length} {entry.measure_unit}</div>
                                    </td>
                                    <td className="right">{entry.unit_price.toLocaleString('en-US')} VND</td>
                                    <td className="center">
                                      {form.key_visual_url ? (
                                        <img
                                          src={form.key_visual_url}
                                          alt="Current content"
                                          className="posm-content-thumb"
                                        />
                                      ) : (
                                        <span className="posm-empty-thumb">—</span>
                                      )}
                                    </td>
                                    <td className="center">
                                      <button
                                        onClick={() => removePosmItem(entry.item_id)}
                                        className="posm-remove-btn"
                                        aria-label={`Remove ${entry.item_name}`}
                                      >
                                        ×
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="posm-table-add-link">Add item</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="posm-helper-text">
                Only ACTIVE POSM items are available for selection.
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
