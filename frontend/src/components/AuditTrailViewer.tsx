/**
 * AuditTrailViewer.tsx
 * Immutable audit trail viewer with timeline display and filtering
 * Per SYSTEM_SPECIFICATION Section J (Audit Trail Design)
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import './AuditTrailViewer.css';

interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION' | 'APPROVE' | 'REJECT' | 'REVISE';
  entity_type: string;
  entity_id: string;
  entity_code: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  timestamp: string;
  ip_address?: string;
}

interface AuditTrailViewerProps {
  entityType: string;
  entityId: string;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ entityType, entityId }) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    loadAuditTrail();
  }, [entityType, entityId]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/registrations/${entityId}/history?limit=1000`);
      setEntries(response.data.history || []);
    } catch (err) {
      setError(`Failed to load audit trail: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get display color/style for action type
   */
  const getActionStyle = (
    action: string
  ): {
    color: string;
    bgColor: string;
    icon: string;
  } => {
    switch (action) {
      case 'CREATE':
        return { color: '#155724', bgColor: '#d4edda', icon: '✚' };
      case 'UPDATE':
        return { color: '#0c5460', bgColor: '#d1ecf1', icon: '⟳' };
      case 'DELETE':
        return { color: '#721c24', bgColor: '#f8d7da', icon: '✕' };
      case 'TRANSITION':
        return { color: '#856404', bgColor: '#fff3cd', icon: '→' };
      case 'APPROVE':
        return { color: '#155724', bgColor: '#d4edda', icon: '✓' };
      case 'REJECT':
        return { color: '#721c24', bgColor: '#f8d7da', icon: '✗' };
      case 'REVISE':
        return { color: '#004085', bgColor: '#cfe2ff', icon: '↻' };
      default:
        return { color: '#666', bgColor: '#f0f0f0', icon: '•' };
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Filter entries
   */
  const filteredEntries =
    selectedAction === 'all'
      ? entries
      : entries.filter((e) => e.action_type === selectedAction);

  /**
   * Get action counts
   */
  const getActionCount = (action: string): number => {
    return entries.filter((e) => e.action_type === action).length;
  };

  const uniqueActions = Array.from(new Set(entries.map((e) => e.action_type)));

  if (loading) {
    return <div className="audit-loading">Loading audit trail...</div>;
  }

  return (
    <div className="audit-trail-viewer">
      <div className="audit-header">
        <h3>Audit Trail</h3>
        <p className="audit-subtitle">Immutable change log for {entityType}</p>
      </div>

      {error && <div className="audit-error">{error}</div>}

      {/* Action filter tabs */}
      <div className="action-filters">
        <button
          className={`filter-tab ${selectedAction === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedAction('all')}
        >
          All ({entries.length})
        </button>
        {uniqueActions.map((action) => (
          <button
            key={action}
            className={`filter-tab ${selectedAction === action ? 'active' : ''}`}
            onClick={() => setSelectedAction(action)}
            style={{
              borderBottomColor:
                selectedAction === action ? getActionStyle(action).color : 'transparent',
            }}
          >
            {action} ({getActionCount(action)})
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="no-entries">No audit entries found</div>
      ) : (
        <div className="audit-timeline">
          {filteredEntries.map((entry, index) => {
            const style = getActionStyle(entry.action_type);
            const isExpanded = expandedEntry === entry.id;

            return (
              <div key={entry.id} className="timeline-entry">
                {/* Timeline node */}
                <div className="timeline-node">
                  <div
                    className="node-circle"
                    style={{
                      backgroundColor: style.bgColor,
                      borderColor: style.color,
                    }}
                  >
                    <span style={{ color: style.color }}>{style.icon}</span>
                  </div>
                  {index < filteredEntries.length - 1 && <div className="node-connector" />}
                </div>

                {/* Entry content */}
                <div className="entry-content">
                  <div
                    className="entry-header"
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  >
                    <div className="entry-title">
                      <span
                        className="action-badge"
                        style={{
                          backgroundColor: style.bgColor,
                          color: style.color,
                        }}
                      >
                        {entry.action_type}
                      </span>
                      <span className="user-name">{entry.user_name}</span>
                      <span className="timestamp">{formatTime(entry.timestamp)}</span>
                    </div>
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  </div>

                  {/* Summary line */}
                  <div className="entry-summary">
                    {entry.field_name && (
                      <span className="field-name">Field: {entry.field_name}</span>
                    )}
                    {entry.notes && <span className="notes">{entry.notes}</span>}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="entry-details">
                      <div className="detail-row">
                        <label>Entity Type:</label>
                        <span className="detail-value">{entry.entity_type}</span>
                      </div>

                      <div className="detail-row">
                        <label>Entity Code:</label>
                        <span className="detail-value">{entry.entity_code}</span>
                      </div>

                      {entry.field_name && (
                        <div className="detail-row">
                          <label>Field:</label>
                          <span className="detail-value">{entry.field_name}</span>
                        </div>
                      )}

                      {entry.old_value && (
                        <div className="detail-row">
                          <label>Old Value:</label>
                          <span className="detail-value old-value">
                            {this.formatValue(entry.old_value)}
                          </span>
                        </div>
                      )}

                      {entry.new_value && (
                        <div className="detail-row">
                          <label>New Value:</label>
                          <span className="detail-value new-value">
                            {this.formatValue(entry.new_value)}
                          </span>
                        </div>
                      )}

                      {entry.notes && (
                        <div className="detail-row">
                          <label>Notes:</label>
                          <span className="detail-value notes">{entry.notes}</span>
                        </div>
                      )}

                      {entry.ip_address && (
                        <div className="detail-row">
                          <label>IP Address:</label>
                          <span className="detail-value">{entry.ip_address}</span>
                        </div>
                      )}

                      <div className="detail-row">
                        <label>Timestamp:</label>
                        <span className="detail-value">{formatTime(entry.timestamp)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info notice */}
      <div className="audit-notice">
        <strong>ℹ️ Immutable Record:</strong> Audit trail entries cannot be modified or deleted. All
        changes are permanently logged for compliance and traceability.
      </div>
    </div>
  );
};

// Helper function to format values for display
function formatValue(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

export default AuditTrailViewer;
