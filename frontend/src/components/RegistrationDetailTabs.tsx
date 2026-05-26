/**
 * RegistrationDetailTabs.tsx
 * Registration detail view with 5 tabs per SYSTEM_SPECIFICATION Section G.3.2
 * Tabs:
 *   1. Registration Information (basic info + status)
 *   2. Advertising Content (create new or use existing)
 *   3. Item Scope (hierarchical item selector)
 *   4. Brand Intake Proposals (conditional - visible during BRAND_INTAKE only)
 *   5. Acceptance Details (conditional - visible during ACCEPTANCE/ACCEPTANCE_REVIEW)
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import HierarchicalItemSelector from './HierarchicalItemSelector';
import Button from './Button';
import Alert from './Alert';
import './RegistrationDetailTabs.css';

interface RegistrationTab {
  id: 'info' | 'content' | 'items' | 'brand-intake' | 'acceptance';
  label: string;
  visible: boolean;
  badge?: number;
}

interface RegistrationData {
  id: string;
  registration_no: string;
  status: string;
  created_by: string;
  created_at: string;
  content_ids?: string[];
  total_quantity?: number;
  total_budget?: number;
  prices_locked?: boolean;
}

interface RegistrationDetailTabsProps {
  registrationId: string;
  onStatusChange?: (newStatus: string) => void;
}

export const RegistrationDetailTabs: React.FC<RegistrationDetailTabsProps> = ({
  registrationId,
  onStatusChange,
}) => {
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'items' | 'brand-intake' | 'acceptance'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Determine which tabs are visible based on status
  const getVisibleTabs = (status: string): RegistrationTab[] => {
    const tabs: RegistrationTab[] = [
      { id: 'info', label: 'Registration Information', visible: true },
      { id: 'content', label: 'Advertising Content', visible: true },
      { id: 'items', label: 'Item Scope', visible: true },
      {
        id: 'brand-intake',
        label: 'Brand Intake Proposals',
        visible: status === 'P.Thương hiệu tiếp nhận' || status === 'BRAND_INTAKE',
      },
      {
        id: 'acceptance',
        label: 'Acceptance Details',
        visible:
          status === 'Nghiệm thu' || status === 'Trưởng phòng nghiệm thu' || status === 'ACCEPTANCE' || status === 'ACCEPTANCE_REVIEW',
      },
    ];
    return tabs.filter((t) => t.visible);
  };

  // Load registration data
  useEffect(() => {
    loadRegistration();
  }, [registrationId]);

  const loadRegistration = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/registrations/${registrationId}`);
      setRegistration(response.data.registration);

      // Auto-switch to brand-intake tab if registration is in that status
      if (response.data.registration.status === 'P.Thương hiệu tiếp nhận') {
        setActiveTab('brand-intake');
      }
    } catch (err) {
      setError(`Failed to load registration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setRegistration((prev) =>
      prev
        ? {
            ...prev,
            status: newStatus,
          }
        : null
    );
    onStatusChange?.(newStatus);
    setSuccessMessage(`Status updated to ${newStatus}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) return <div className="loading">Loading registration details...</div>;
  if (!registration) return <div className="error">Registration not found</div>;

  const visibleTabs = getVisibleTabs(registration.status);

  return (
    <div className="registration-detail-tabs">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Tab Navigation */}
      <div className="tabs-header">
        <div className="tabs-navigation">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.badge && <span className="tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>

        {/* Status badge */}
        <div className="status-badge">
          <span className="status-label">Status:</span>
          <span className={`status-value status-${registration.status.toLowerCase()}`}>
            {registration.status}
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tabs-content">
        {/* Tab 1: Registration Information */}
        {activeTab === 'info' && (
          <div className="tab-pane">
            <RegistrationInfoTab registration={registration} />
          </div>
        )}

        {/* Tab 2: Advertising Content */}
        {activeTab === 'content' && (
          <div className="tab-pane">
            <AdvertisingContentTab
              registrationId={registrationId}
              contentIds={registration.content_ids}
              locked={registration.prices_locked}
            />
          </div>
        )}

        {/* Tab 3: Item Scope */}
        {activeTab === 'items' && (
          <div className="tab-pane">
            <ItemScopeTab
              registrationId={registrationId}
              locked={registration.prices_locked}
            />
          </div>
        )}

        {/* Tab 4: Brand Intake Proposals (conditional) */}
        {activeTab === 'brand-intake' && (
          <div className="tab-pane">
            <BrandIntakeTab
              registrationId={registrationId}
              status={registration.status}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {/* Tab 5: Acceptance Details (conditional) */}
        {activeTab === 'acceptance' && (
          <div className="tab-pane">
            <AcceptanceDetailsTab
              registrationId={registrationId}
              status={registration.status}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tab 1: Registration Information
 */
const RegistrationInfoTab: React.FC<{ registration: RegistrationData }> = ({ registration }) => {
  return (
    <div className="info-tab">
      <div className="info-grid">
        <div className="info-field">
          <label>Registration Number</label>
          <div className="info-value">{registration.registration_no}</div>
        </div>

        <div className="info-field">
          <label>Status</label>
          <div className="info-value">{registration.status}</div>
        </div>

        <div className="info-field">
          <label>Created At</label>
          <div className="info-value">{new Date(registration.created_at).toLocaleString()}</div>
        </div>

        <div className="info-field">
          <label>Total Budget</label>
          <div className="info-value info-number">
            {registration.total_budget?.toLocaleString()} VND
          </div>
        </div>

        <div className="info-field">
          <label>Item Quantity</label>
          <div className="info-value info-number">{registration.total_quantity || 0}</div>
        </div>

        <div className="info-field">
          <label>Prices Locked</label>
          <div className="info-value">
            {registration.prices_locked ? (
              <span className="badge badge-warning">Locked</span>
            ) : (
              <span className="badge badge-info">Editable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Tab 2: Advertising Content
 */
const AdvertisingContentTab: React.FC<{
  registrationId: string;
  contentIds?: string[];
  locked: boolean;
}> = ({ registrationId, contentIds = [], locked }) => {
  const [activeMode, setActiveMode] = useState<'create' | 'existing'>('create');
  const [contents, setContents] = useState<any[]>([]);

  useEffect(() => {
    if (activeMode === 'existing') {
      loadExistingContents();
    }
  }, [activeMode]);

  const loadExistingContents = async () => {
    try {
      const response = await api.get('/contents?status=ACTIVE');
      setContents(response.data.contents || []);
    } catch (err) {
      console.error('Failed to load contents:', err);
    }
  };

  return (
    <div className="content-tab">
      <div className="mode-tabs">
        <button
          className={`mode-tab ${activeMode === 'create' ? 'active' : ''}`}
          onClick={() => setActiveMode('create')}
          disabled={locked}
        >
          Create New Content
        </button>
        <button
          className={`mode-tab ${activeMode === 'existing' ? 'active' : ''}`}
          onClick={() => setActiveMode('existing')}
          disabled={locked}
        >
          Use Existing Content ({contentIds.length})
        </button>
      </div>

      {activeMode === 'create' && (
        <div className="mode-content">
          <div className="form-group">
            <label>Content Type</label>
            <select disabled={locked}>
              <option>-- Select Content Type --</option>
              <option>Image</option>
              <option>Video</option>
              <option>Animation</option>
            </select>
          </div>

          <div className="form-group">
            <label>Content Details</label>
            <textarea placeholder="Describe your advertising content..." disabled={locked} />
          </div>

          <div className="form-group">
            <label>Upload Media</label>
            <input type="file" disabled={locked} accept="image/*,video/*" />
          </div>

          <Button type="primary" disabled={locked}>
            Save New Content
          </Button>
        </div>
      )}

      {activeMode === 'existing' && (
        <div className="mode-content">
          {contents.length === 0 ? (
            <p className="no-data">No existing content available</p>
          ) : (
            <div className="contents-list">
              {contents.map((content) => (
                <div key={content.id} className="content-item">
                  <input type="checkbox" id={`content-${content.id}`} disabled={locked} />
                  <label htmlFor={`content-${content.id}`}>
                    <strong>{content.title}</strong>
                    <p>{content.description}</p>
                  </label>
                </div>
              ))}
            </div>
          )}

          <Button type="primary" disabled={locked || contents.length === 0}>
            Link Selected Content
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Tab 3: Item Scope
 */
const ItemScopeTab: React.FC<{ registrationId: string; locked: boolean }> = ({
  registrationId,
  locked,
}) => {
  const handleItemsSelected = (itemIds: string[]) => {
    console.log('Items selected:', itemIds);
    // Callback will be triggered by HierarchicalItemSelector
  };

  return (
    <div className="items-tab">
      <HierarchicalItemSelector
        registrationId={registrationId}
        onItemsSelected={handleItemsSelected}
        disabled={locked}
      />
    </div>
  );
};

/**
 * Tab 4: Brand Intake Proposals
 */
const BrandIntakeTab: React.FC<{
  registrationId: string;
  status: string;
  onStatusChange: (status: string) => void;
}> = ({ registrationId, status, onStatusChange }) => {
  return (
    <div className="brand-intake-tab">
      <div className="alert alert-info">
        <strong>Brand Intake Phase:</strong> Review procurement category proposals and provide
        acceptance/rejection feedback.
      </div>

      <div className="proposals-section">
        <h3>Category Proposals</h3>
        <div className="proposal-fields">
          <div className="form-group">
            <label>Procurement Category Proposal</label>
            <input type="text" placeholder="Proposed category..." />
          </div>

          <div className="form-group">
            <label>Other Category Proposal</label>
            <input type="text" placeholder="Alternative category..." />
          </div>

          <div className="form-group">
            <label>Other Proposal Notes</label>
            <textarea placeholder="Additional notes or requirements..." />
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Button type="primary" onClick={() => onStatusChange('Trưởng phòng thương hiệu phê duyệt')}>
          Approve & Send to Brand Manager
        </Button>
        <Button type="secondary" onClick={() => onStatusChange('CBNV Điều Chỉnh')}>
          Request Revision
        </Button>
        <Button type="danger" onClick={() => onStatusChange('CANCELLED')}>
          Cancel Request
        </Button>
      </div>
    </div>
  );
};

/**
 * Tab 5: Acceptance Details
 */
const AcceptanceDetailsTab: React.FC<{
  registrationId: string;
  status: string;
  onStatusChange: (status: string) => void;
}> = ({ registrationId, status, onStatusChange }) => {
  return (
    <div className="acceptance-tab">
      <div className="alert alert-info">
        <strong>Acceptance Phase:</strong> Verify deployment images and update item status.
      </div>

      <div className="items-acceptance-list">
        <h3>Items for Acceptance</h3>
        <table className="acceptance-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Old Image</th>
              <th>Deployment Image</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ITEM-001</td>
              <td>
                <img src="/placeholder.jpg" alt="old" className="thumbnail" />
              </td>
              <td>
                <input type="file" accept="image/*" />
              </td>
              <td>
                <select>
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
              </td>
              <td>
                <input type="text" placeholder="Notes if inactive..." />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <Button
          type="primary"
          onClick={() => onStatusChange('Trưởng phòng nghiệm thu')}
          disabled={status === 'Trưởng phòng nghiệm thu'}
        >
          Submit for Approval
        </Button>
        {status === 'Trưởng phòng nghiệm thu' && (
          <Button type="success" onClick={() => onStatusChange('Đã nghiệm thu')}>
            Approve & Complete
          </Button>
        )}
        <Button type="secondary" onClick={() => onStatusChange('Nghiệm thu')}>
          Back to Acceptance
        </Button>
      </div>
    </div>
  );
};

export default RegistrationDetailTabs;
