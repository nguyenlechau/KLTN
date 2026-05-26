/**
 * DeploymentAcceptanceScreen.tsx
 * Acceptance phase screen for field verification with old/new image comparison
 * Per SYSTEM_SPECIFICATION Section G (Acceptance Details screen)
 * Used during Acceptance and Acceptance Review phases
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Button from './Button';
import Alert from './Alert';
import Spinner from './Spinner';
import './DeploymentAcceptanceScreen.css';

interface AcceptanceItem {
  id: string;
  item_code: string;
  item_name: string;
  original_image_url?: string;
  current_status: 'ACTIVE' | 'INACTIVE';
  new_image_url?: string;
  new_image_file?: File;
  final_status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

interface DeploymentAcceptanceScreenProps {
  registrationId: string;
  onSubmit?: (acceptanceData: any) => void;
  readonly?: boolean;
}

export const DeploymentAcceptanceScreen: React.FC<DeploymentAcceptanceScreenProps> = ({
  registrationId,
  onSubmit,
  readonly = false,
}) => {
  const [items, setItems] = useState<AcceptanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load acceptance items on mount
  useEffect(() => {
    loadAcceptanceItems();
  }, [registrationId]);

  const loadAcceptanceItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/registrations/${registrationId}/acceptance-items`);
      const acceptanceItems = response.data.items.map((item: any) => ({
        ...item,
        final_status: item.current_status,
        new_image_file: undefined,
      }));

      setItems(acceptanceItems);
    } catch (err) {
      setError(`Failed to load acceptance items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle image upload for an item
   */
  const handleImageUpload = (itemId: string, file: File) => {
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Store file for submission
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              new_image_file: file,
              new_image_url: URL.createObjectURL(file),
            }
          : item
      )
    );
  };

  /**
   * Handle status change for an item
   */
  const handleStatusChange = (itemId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              final_status: newStatus,
            }
          : item
      )
    );
  };

  /**
   * Handle notes update
   */
  const handleNotesChange = (itemId: string, notes: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              notes,
            }
          : item
      )
    );
  };

  /**
   * Validate acceptance data
   */
  const validateAcceptance = (): string[] => {
    const errors: string[] = [];

    for (const item of items) {
      // Check if ACTIVE items have new images
      if (item.final_status === 'ACTIVE' && !item.new_image_url) {
        errors.push(`${item.item_code}: Active item requires deployment image`);
      }

      // Check if INACTIVE items have notes
      if (item.final_status === 'INACTIVE' && !item.notes) {
        errors.push(`${item.item_code}: Inactive item requires explanation notes`);
      }

      // Check if image file is provided for new image (not just URL from existing)
      if (item.final_status === 'ACTIVE' && !item.new_image_file) {
        errors.push(`${item.item_code}: Must upload actual deployment image file`);
      }
    }

    return errors;
  };

  /**
   * Submit acceptance
   */
  const handleSubmit = async () => {
    const validationErrors = validateAcceptance();

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Prepare form data with file uploads
      const formData = new FormData();
      formData.append('registration_id', registrationId);

      // Add acceptance items
      const itemsData = [];
      for (const item of items) {
        const itemData: any = {
          item_id: item.id,
          final_status: item.final_status,
          notes: item.notes || null,
        };

        // Only add file if present (ACTIVE items)
        if (item.new_image_file) {
          itemData.has_image = true;
        }

        itemsData.push(itemData);
        if (item.new_image_file) {
          formData.append(`image_${item.id}`, item.new_image_file);
        }
      }

      formData.append('items', JSON.stringify(itemsData));

      // Submit via API
      await api.post(`/registrations/${registrationId}/submit-acceptance`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage('Acceptance submitted successfully');
      onSubmit?.(itemsData);
    } catch (err) {
      setError(`Failed to submit acceptance: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading acceptance items..." />;
  }

  return (
    <div className="deployment-acceptance-screen">
      <div className="acceptance-header">
        <h2>Deployment Acceptance Verification</h2>
        <p className="subtitle">
          Verify deployed items by comparing original vs. deployment images and confirming status
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="acceptance-instructions">
        <div className="instruction-card">
          <h4>📋 Instructions</h4>
          <ul>
            <li>Compare original deployment location with actual site</li>
            <li>
              For <strong>ACTIVE</strong> items: Upload new image showing current deployment
            </li>
            <li>
              For <strong>INACTIVE</strong> items: Provide reason for deactivation (e.g., removed,
              damaged)
            </li>
            <li>Complete all required fields before submitting</li>
          </ul>
        </div>

        <div className="instruction-card">
          <h4>✅ Acceptance Criteria</h4>
          <ul>
            <li>All ACTIVE items must have deployment proof image</li>
            <li>All INACTIVE items must have explanation notes</li>
            <li>Image must be dated photo showing current state</li>
            <li>Coordinates and position must match original deployment</li>
          </ul>
        </div>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content">
            <img src={previewImage} alt="Preview" />
            <button className="close-btn" onClick={() => setPreviewImage(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Items grid */}
      <div className="acceptance-items">
        {items.length === 0 ? (
          <div className="no-items">No items to accept for this registration</div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="acceptance-item-card">
              <div className="card-header">
                <span className="item-number">Item {index + 1}</span>
                <span className="item-code-badge">{item.item_code}</span>
              </div>

              <div className="card-body">
                <h4>{item.item_name}</h4>

                {/* Image comparison section */}
                <div className="image-comparison">
                  <div className="comparison-column">
                    <label className="comparison-label">Original Deployment</label>
                    {item.original_image_url ? (
                      <img
                        src={item.original_image_url}
                        alt="Original"
                        className="comparison-image original"
                        onClick={() => setPreviewImage(item.original_image_url || null)}
                      />
                    ) : (
                      <div className="no-image-placeholder">No original image</div>
                    )}
                  </div>

                  <div className="comparison-column">
                    <label className="comparison-label">Current Deployment</label>
                    {item.new_image_url ? (
                      <img
                        src={item.new_image_url}
                        alt="Current"
                        className="comparison-image current"
                        onClick={() => setPreviewImage(item.new_image_url || null)}
                      />
                    ) : (
                      <div className="no-image-placeholder">Upload image to compare</div>
                    )}

                    {/* File upload input */}
                    {!readonly && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] && handleImageUpload(item.id, e.target.files[0])
                        }
                        className="image-input"
                        aria-label="Upload deployment image"
                      />
                    )}
                  </div>
                </div>

                {/* Status and notes section */}
                <div className="item-details">
                  <div className="form-group">
                    <label htmlFor={`status-${item.id}`}>
                      <strong>Acceptance Status</strong>
                      {item.final_status === 'INACTIVE' && (
                        <span className="required-note"> (required)</span>
                      )}
                    </label>
                    <div className="status-selector">
                      <input
                        type="radio"
                        id={`status-${item.id}-active`}
                        name={`status-${item.id}`}
                        value="ACTIVE"
                        checked={item.final_status === 'ACTIVE'}
                        onChange={() => handleStatusChange(item.id, 'ACTIVE')}
                        disabled={readonly}
                      />
                      <label htmlFor={`status-${item.id}-active`} className="radio-label">
                        <span className="status-badge active">ACTIVE</span>
                        <span className="status-description">Item is deployed and visible</span>
                      </label>

                      <input
                        type="radio"
                        id={`status-${item.id}-inactive`}
                        name={`status-${item.id}`}
                        value="INACTIVE"
                        checked={item.final_status === 'INACTIVE'}
                        onChange={() => handleStatusChange(item.id, 'INACTIVE')}
                        disabled={readonly}
                      />
                      <label htmlFor={`status-${item.id}-inactive`} className="radio-label">
                        <span className="status-badge inactive">INACTIVE</span>
                        <span className="status-description">Item is not deployed</span>
                      </label>
                    </div>
                  </div>

                  {item.final_status === 'INACTIVE' && (
                    <div className="form-group">
                      <label htmlFor={`notes-${item.id}`}>
                        <strong>Reason for Inactivity</strong> (required)
                      </label>
                      <textarea
                        id={`notes-${item.id}`}
                        value={item.notes || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        placeholder="Explain why this item is inactive (e.g., removed, damaged, inaccessible)"
                        disabled={readonly}
                        className="form-textarea"
                      />
                    </div>
                  )}
                </div>

                {/* Validation indicator */}
                <div className="validation-indicator">
                  {item.final_status === 'ACTIVE' && !item.new_image_url && (
                    <span className="validation-error">⚠️ Image required for ACTIVE items</span>
                  )}
                  {item.final_status === 'ACTIVE' && item.new_image_url && (
                    <span className="validation-success">✅ Deployment image provided</span>
                  )}
                  {item.final_status === 'INACTIVE' && !item.notes && (
                    <span className="validation-error">⚠️ Explanation required for INACTIVE</span>
                  )}
                  {item.final_status === 'INACTIVE' && item.notes && (
                    <span className="validation-success">✅ Explanation provided</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary section */}
      {items.length > 0 && (
        <div className="acceptance-summary">
          <div className="summary-stat">
            <strong>Total Items:</strong> {items.length}
          </div>
          <div className="summary-stat">
            <strong>ACTIVE:</strong>
            <span className="active-count">
              {items.filter((i) => i.final_status === 'ACTIVE').length}
            </span>
          </div>
          <div className="summary-stat">
            <strong>INACTIVE:</strong>
            <span className="inactive-count">
              {items.filter((i) => i.final_status === 'INACTIVE').length}
            </span>
          </div>
          <div className="summary-stat">
            <strong>Complete:</strong>
            <span
              className={
                validateAcceptance().length === 0 ? 'complete-yes' : 'complete-no'
              }
            >
              {validateAcceptance().length === 0 ? '✅ Ready' : `❌ ${validateAcceptance().length} issues`}
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!readonly && (
        <div className="acceptance-actions">
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={submitting || validateAcceptance().length > 0}
            className="submit-btn"
          >
            {submitting ? 'Submitting...' : 'Submit Acceptance'}
          </Button>
          <Button type="secondary" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeploymentAcceptanceScreen;
