import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { LoadingOverlay } from '../../components/Spinner';
import * as api from '../../api/services';
import '../../styles/registration-detail.css';

export function RegistrationDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<api.RegistrationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [workflowInfo, setWorkflowInfo] = useState<any>(null);
  const [availableTransitions, setAvailableTransitions] = useState<any[]>([]);

  const loadRegistration = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getRegistrationById(id);
      if (response.ok && response.data) {
        setRegistration(response.data);
        
        // Load workflow info
        const wfResponse = await api.getRegistrationWorkflow(id);
        if (wfResponse.ok) setWorkflowInfo(wfResponse.data);

        // Load available transitions
        const transResponse = await api.getAvailableTransitions(id);
        if (transResponse.ok) setAvailableTransitions(transResponse.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load registration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistration();
  }, [id]);

  if (isLoading) return <LoadingOverlay text="Loading registration…" />;
  if (error) return <Alert type="error" message={error} />;
  if (!registration) return <Alert type="error" message="Registration not found" />;

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SUPERVISOR_REVIEW: 'Supervisor Review',
      CBNV_REVISION: 'Requester Revision',
      BRAND_ACCEPTANCE: 'Brand Acceptance',
      BRAND_MANAGER_APPROVAL: 'Brand Manager Approval',
      APPROVED: 'Approved',
      DEPLOYMENT_PREP: 'Deployment Preparation',
      FINAL_ACCEPTANCE: 'Final Acceptance',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return labels[state] || state;
  };

  const budgetTotal = Number(registration.registration.budget_total || 0);
  const totalAmount = Number(registration.registration.total_amount || 0);
  const remainingBudget = budgetTotal - totalAmount;
  const budgetPercentage = budgetTotal > 0 ? (totalAmount / budgetTotal) * 100 : 0;

  return (
    <div className="registration-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/registrations')} className="back-button">
            ← Back
          </button>
          <div className="header-info">
            <h1>{registration.registration.campaign_name}</h1>
            <p className="registration-code">Registration Code: {registration.registration.registration_code}</p>
          </div>
        </div>
        <div className="header-right">
          <span className={`state-badge workflow-${registration.registration.workflow_state.toLowerCase().replace(/_/g, '-')}`}>
            {getStateLabel(registration.registration.workflow_state)}
          </span>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          General Info
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content ({registration.content.length})
        </button>
        <button 
          className={`tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Locations/Categories ({registration.items.length})
        </button>
        <button 
          className={`tab ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          Workflow
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <RegistrationInfoTab 
            registration={registration.registration}
            remainingBudget={remainingBudget}
            budgetPercentage={budgetPercentage}
          />
        )}
        {activeTab === 'content' && (
          <ContentTab 
            registrationId={id!}
            content={registration.content}
            onRefresh={loadRegistration}
          />
        )}
        {activeTab === 'items' && (
          <ItemsTab 
            registrationId={id!}
            items={registration.items}
            onRefresh={loadRegistration}
          />
        )}
        {activeTab === 'workflow' && (
          <WorkflowTab 
            registrationId={id!}
            currentState={registration.registration.workflow_state}
            availableTransitions={availableTransitions}
            history={workflowInfo?.history || []}
            onTransition={loadRegistration}
          />
        )}
      </div>

      <div className="detail-footer">
        <Button 
          onClick={() => navigate('/registrations')}
          variant="secondary"
        >
          Close
        </Button>
        {registration.registration.workflow_state === 'DRAFT' && (
          <Button 
            variant="danger"
            onClick={() => {
              // Delete registration
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Info Tab
// ============================================================

function RegistrationInfoTab({ 
  registration, 
  remainingBudget,
  budgetPercentage 
}: any) {
  return (
    <div className="tab-pane">
      <div className="info-grid">
        <div className="info-item">
          <label>Campaign Name</label>
          <span>{registration.campaign_name}</span>
        </div>
        <div className="info-item">
          <label>Brand</label>
          <span>{registration.brand_name}</span>
        </div>
        <div className="info-item">
          <label>Contact Person</label>
          <span>{registration.contact_person}</span>
        </div>
        <div className="info-item">
          <label>Phone</label>
          <span>{registration.phone}</span>
        </div>
        <div className="info-item">
          <label>Email</label>
          <span>{registration.email}</span>
        </div>
        <div className="info-item">
          <label>Created</label>
          <span>{new Date(registration.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="budget-section">
        <h3>Budget Information</h3>
        <div className="budget-summary">
          <div className="budget-item">
            <label>Total Budget</label>
            <span className="amount">{Number(registration.budget_total || 0).toLocaleString()} ₫</span>
          </div>
          <div className="budget-item">
            <label>Used</label>
            <span className="amount">{Number(registration.total_amount || 0).toLocaleString()} ₫</span>
          </div>
          <div className="budget-item">
            <label>Remaining</label>
            <span className={`amount ${remainingBudget < 0 ? 'danger' : ''}`}>
              {remainingBudget.toLocaleString()} ₫
            </span>
          </div>
        </div>
        <div className="budget-bar">
          <div 
            className={`budget-progress ${budgetPercentage > 100 ? 'danger' : budgetPercentage > 80 ? 'warning' : 'success'}`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
          <span className="budget-percent">{budgetPercentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Content Tab
// ============================================================

function ContentTab({ registrationId, content, onRefresh }: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="tab-pane">
      {content.length === 0 ? (
        <div className="empty-state">
          <p>No content added yet</p>
        </div>
      ) : (
        <div className="content-list">
          {content.map((item: any) => (
            <div key={item.id} className="content-item">
              <div className="content-header">
                <h4>{item.content_name}</h4>
                <button 
                  className="remove-btn"
                  onClick={async () => {
                    await api.removeRegistrationContent(item.id);
                    onRefresh();
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="content-meta">
                <span>{item.quantity} pcs</span>
                <span>{item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'} - {item.end_date ? new Date(item.end_date).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button 
        onClick={() => setShowAddModal(true)}
        variant="primary"
        style={{ marginTop: '16px' }}
      >
        + Add Content
      </Button>

      {showAddModal && (
        <AddContentModal
          registrationId={registrationId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function AddContentModal({ registrationId, onClose, onSuccess }: any) {
  const [contents, setContents] = useState<any[]>([]);
  const [form, setForm] = useState({
    content_id: '',
    quantity: '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getContentList(100).then(r => {
      if (r.ok) {
        const allContents = r.data || [];
        const activeContents = allContents.filter((entry: any) => {
          const status = String(entry.status || '').toLowerCase();
          return status.includes('active');
        });
        setContents(activeContents.length > 0 ? activeContents : allContents);
      }
    });
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!form.content_id || !form.quantity) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.addRegistrationContent(
        registrationId,
        form.content_id,
        form.start_date,
        form.end_date,
        parseInt(form.quantity)
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Add Content" onClose={onClose}>
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Content *</label>
          <select
            value={form.content_id}
            onChange={(e) => setForm({ ...form, content_id: e.target.value })}
            className="form-select"
          >
            <option value="">-- Select content --</option>
            {contents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.content_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity *</label>
            <Input
              type="number"
              value={form.quantity}
              onChange={(value) => setForm({ ...form, quantity: value })}
              min="1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(value) => setForm({ ...form, start_date: value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(value) => setForm({ ...form, end_date: value })}
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={handleSubmit} variant="primary" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Items Tab
// ============================================================

function ItemsTab({ registrationId, items, onRefresh }: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.total_amount) || 0), 0);

  return (
    <div className="tab-pane">
      {items.length === 0 ? (
        <div className="empty-state">
          <p>No locations/categories added yet</p>
        </div>
      ) : (
        <>
          <div className="items-summary">
            <span>Total Cost: <strong>{totalAmount.toLocaleString()} ₫</strong></span>
          </div>
          <div className="items-list">
            {items.map((item: any) => (
              <div key={item.id} className="item-row">
                <div className="item-info">
                  <div className="item-name">{item.item_name || item.item_id || item.id}</div>
                  <div className="item-details">
                    Quantity: {item.quantity} × {Number(item.unit_price || 0).toLocaleString()} ₫ = {Number(item.total_amount || 0).toLocaleString()} ₫
                  </div>
                </div>
                <button 
                  className="remove-btn"
                  onClick={async () => {
                    await api.removeRegistrationItem(registrationId, item.id);
                    onRefresh();
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      <Button 
        onClick={() => setShowAddModal(true)}
        variant="primary"
        style={{ marginTop: '16px' }}
      >
        + Add Location/Category
      </Button>

      {showAddModal && (
        <AddItemModal
          registrationId={registrationId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function AddItemModal({ registrationId, onClose, onSuccess }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getItemList(200, 0),
      api.getCategoryList(200, 0, undefined, undefined, 'ACTIVE'),
      api.getLocationList(500, 0, undefined, undefined, 'ACTIVE'),
    ]).then(([itemRes, categoryRes, locationRes]) => {
      if (itemRes.ok) {
        setItems((itemRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'));
      }
      if (categoryRes.ok) {
        setCategories((categoryRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'));
      }
      if (locationRes.ok) {
        setLocations((locationRes.data || []).filter((entry: any) => String(entry.status || '').toUpperCase() === 'ACTIVE'));
      }
    });
  }, []);

  const channelOptions = Array.from(new Set(items.map((entry: any) => String(entry.channel_id || '')).filter(Boolean))).map((id) => {
    const location = locations.find((entry: any) => String(entry.channel_id || '') === id);
    const locationCode = location?.position_code || location?.code;
    return {
      id,
      label: locationCode ? `${locationCode} (${id})` : `Channel ${id}`,
    };
  });

  const itemsByChannel = items.filter((entry: any) => !selectedChannelId || String(entry.channel_id) === selectedChannelId);
  const categoryIds = new Set(itemsByChannel.map((entry: any) => String(entry.category_id)));
  const availableCategories = categories.filter((entry: any) => categoryIds.has(String(entry.id)));
  const itemsByCategory = itemsByChannel.filter((entry: any) => !selectedCategoryId || String(entry.category_id) === selectedCategoryId);
  const locationIds = new Set(itemsByCategory.map((entry: any) => String(entry.location_id)));
  const availableLocations = locations.filter((entry: any) => locationIds.has(String(entry.id)));
  const availableItems = itemsByCategory.filter((entry: any) => !selectedLocationId || String(entry.location_id) === selectedLocationId);

  const selectedItem = availableItems.find((entry: any) => String(entry.id) === selectedItemId);

  const handleSubmit = async () => {
    setError('');
    if (!selectedChannelId || !selectedCategoryId || !selectedLocationId || !selectedItem || !quantity) {
      setError('Please select channel, category, location, POSM item and enter quantity');
      return;
    }

    setIsLoading(true);
    try {
      await api.addRegistrationItem(
        registrationId,
        selectedItem.id,
        selectedItem.category_id,
        parseInt(quantity)
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Add Item" onClose={onClose}>
      <div className="form-content">
        {error && <Alert type="error" message={error} />}

        <div className="form-group">
          <label>Channel *</label>
          <select
            value={selectedChannelId}
            onChange={(e) => {
              setSelectedChannelId(e.target.value);
              setSelectedCategoryId('');
              setSelectedLocationId('');
              setSelectedItemId('');
            }}
            className="form-select"
          >
            <option value="">-- Select channel --</option>
            {channelOptions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedLocationId('');
              setSelectedItemId('');
            }}
            className="form-select"
            disabled={!selectedChannelId}
          >
            <option value="">-- Select category --</option>
            {availableCategories.map((entry: any) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Location *</label>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              setSelectedItemId('');
            }}
            className="form-select"
            disabled={!selectedCategoryId}
          >
            <option value="">-- Select location --</option>
            {availableLocations.map((entry: any) => (
              <option key={entry.id} value={entry.id}>
                {entry.position_name || entry.name || entry.position_code || entry.code}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>POSM Item *</label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="form-select"
            disabled={!selectedLocationId}
          >
            <option value="">-- Select POSM --</option>
            {availableItems.map((i: any) => (
              <option key={i.id} value={i.id}>
                {i.item_name} ({i.item_code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity *</label>
          <Input
            type="number"
            value={quantity}
            onChange={(value) => setQuantity(value)}
            min="1"
          />
        </div>

        <div className="modal-actions">
          <Button onClick={handleSubmit} variant="primary" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Workflow Tab
// ============================================================

function WorkflowTab({ 
  registrationId, 
  currentState, 
  availableTransitions, 
  history, 
  onTransition 
}: any) {
  const [selectedTransition, setSelectedTransition] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransition = async () => {
    if (!selectedTransition) return;
    
    setIsLoading(true);
    setError('');
    try {
      await api.transitionRegistration(registrationId, selectedTransition, reason || undefined);
      setSelectedTransition('');
      setReason('');
      onTransition();
    } catch (err: any) {
      setError(err.message || 'Failed to transition state');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-pane">
      <div className="workflow-section">
        <h3>Change State</h3>
        {availableTransitions.length === 0 ? (
          <p className="info-text">No actions available for the current state</p>
        ) : (
          <>
            {error && <Alert type="error" message={error} />}
            <div className="form-group">
              <label>Transition to *</label>
              <select
                value={selectedTransition}
                onChange={(e) => setSelectedTransition(e.target.value)}
                className="form-select"
              >
                <option value="">-- Select new state --</option>
                {availableTransitions.map((t: any) => (
                  <option key={t.state} value={t.state}>
                    {t.label || t.state}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter a note for the transition"
                rows={3}
                className="form-textarea"
              />
            </div>
            <Button 
              onClick={handleTransition}
              variant="primary"
              disabled={!selectedTransition || isLoading}
            >
              {isLoading ? 'Processing...' : 'Apply Transition'}
            </Button>
          </>
        )}
      </div>

      <div className="workflow-history">
        <h3>Workflow History</h3>
        {history.length === 0 ? (
          <p className="info-text">No history yet</p>
        ) : (
          <div className="timeline">
            {history.map((item: any, index: number) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div className="timeline-state">{item.state}</div>
                  <div className="timeline-date">{new Date(item.created_at).toLocaleString()}</div>
                  {item.notes && <div className="timeline-notes">{item.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
