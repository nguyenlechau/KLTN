import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import * as api from '../../api/services';
import '../../styles/deployment-acceptance.css';

export function DeploymentAcceptanceScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadRegistration = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getRegistrationById(id);
      if (response.ok && response.data) setRegistration(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load registration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistration();
  }, [id]);

  if (isLoading && !registration) return <Spinner />;
  if (error && !registration) return <Alert type="error" message={error} />;
  if (!registration) return <Alert type="error" message="Registration not found" />;

  return (
    <div className="deployment-container">
      <div className="deployment-header">
        <button onClick={() => navigate(-1)} className="back-button">← Back</button>
        <h1>Deployment Acceptance</h1>
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {error && <Alert type="error" message={error} />}

      <DeploymentForm
        registration={registration}
        onSuccess={() => {
          setSuccessMessage('Deployment successful!');
          setTimeout(() => navigate('/registrations'), 2000);
        }}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
}

interface DeploymentFormProps {
  registration: any;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function DeploymentForm({ registration, onSuccess, onError }: DeploymentFormProps) {
  const [form, setForm] = useState({
    deployment_date: new Date().toISOString().split('T')[0],
    deployment_location: '',
    deployment_notes: '',
    photos: [] as File[],
    previewUrls: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    items_deployed: false,
    photos_confirmed: false,
    location_verified: false,
    final_approval: false,
  });

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setForm((s) => ({ ...s, photos: [...s.photos, ...newFiles], previewUrls: [...s.previewUrls, ...newPreviews] }));
  };

  const removePhoto = (index: number) => {
    setForm((s) => ({ ...s, photos: s.photos.filter((_, i) => i !== index), previewUrls: s.previewUrls.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!checklist.items_deployed || !checklist.photos_confirmed || !checklist.location_verified || !checklist.final_approval) {
      onError('Please complete all confirmation steps');
      return;
    }
    if (form.photos.length === 0) {
      onError('Please upload at least one deployment photo');
      return;
    }
    if (!form.deployment_location.trim()) {
      onError('Please enter the deployment location');
      return;
    }

    setIsSubmitting(true);
    try {
      // simulate upload
      await new Promise((r) => setTimeout(r, 800));

      await api.transitionRegistration(
        registration.registration.id,
        'COMPLETED',
        `Deployment completed on ${form.deployment_date}. ${form.deployment_notes || ''}`
      );

      onSuccess();
    } catch (err: any) {
      onError(err.message || 'Failed to complete deployment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="deployment-form">
      <section className="overview-section">
        <h2>Registration Information</h2>
        <div className="overview-grid">
          <div className="overview-item">
            <label>Registration Code</label>
            <span>{registration.registration.registration_code}</span>
          </div>
          <div className="overview-item">
            <label>Campaign</label>
            <span>{registration.registration.campaign_name}</span>
          </div>
          <div className="overview-item">
            <label>Brand</label>
            <span>{registration.registration.brand_name}</span>
          </div>
          <div className="overview-item">
            <label>Number of Items</label>
            <span>{registration.items.length}</span>
          </div>
        </div>
      </section>

      <section className="items-section">
        <h2>Deployment Locations</h2>
        <div className="items-list">
          {registration.items.map((item: any, index: number) => (
            <div key={index} className="item-card">
              <div className="item-header">
                <span className="item-number">#{index + 1}</span>
                <span className="item-name">{item.item_id}</span>
              </div>
              <div className="item-details">
                <span className="status-badge active">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="details-section">
        <h2>Deployment Details</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Deployment Date *</label>
            <Input type="date" value={form.deployment_date} onChange={(value) => setForm({ ...form, deployment_date: value })} />
          </div>
          <div className="form-group">
            <label>Deployment Location *</label>
            <Input type="text" value={form.deployment_location} onChange={(value) => setForm({ ...form, deployment_location: value })} placeholder="e.g., 3rd floor, Trần Hưng Đạo store" />
          </div>
        </div>

        <div className="form-group">
          <label>Deployment Notes</label>
          <textarea value={form.deployment_notes} onChange={(e) => setForm({ ...form, deployment_notes: e.target.value })} placeholder="Enter notes about the deployment process" rows={4} className="form-textarea" />
        </div>
      </section>

      <section className="photos-section">
        <h2>Upload Deployment Photos</h2>
        <p className="section-subtitle">Please upload photos proving the advertisement has been deployed (minimum 1 photo)</p>

        <div className="photo-upload">
          <label htmlFor="photo-input" className="upload-label">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              <p className="upload-title">Select or drag & drop photos</p>
              <p className="upload-subtitle">PNG, JPG, GIF (Max 10MB)</p>
            </div>
          </label>
          <input id="photo-input" type="file" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files)} style={{ display: 'none' }} />
        </div>

        {form.previewUrls.length > 0 && (
          <div className="photo-gallery">
            <h4>Uploaded Photos ({form.previewUrls.length})</h4>
            <div className="gallery-grid">
              {form.previewUrls.map((url, index) => (
                <div key={index} className="photo-item">
                  <img src={url} alt={`Photo ${index + 1}`} />
                  <button type="button" className="remove-photo" onClick={() => removePhoto(index)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="checklist-section">
        <h2>Completion Confirmation</h2>
        <div className="checklist">
          <label className="checklist-item">
            <input type="checkbox" checked={checklist.items_deployed} onChange={(e) => setChecklist({ ...checklist, items_deployed: e.target.checked })} />
            <span className="checkbox-label">All advertising locations have been deployed</span>
          </label>

          <label className="checklist-item">
            <input type="checkbox" checked={checklist.photos_confirmed} onChange={(e) => setChecklist({ ...checklist, photos_confirmed: e.target.checked })} />
            <span className="checkbox-label">Proof photos have been reviewed</span>
          </label>

          <label className="checklist-item">
            <input type="checkbox" checked={checklist.location_verified} onChange={(e) => setChecklist({ ...checklist, location_verified: e.target.checked })} />
            <span className="checkbox-label">Deployment location has been verified</span>
          </label>

          <label className="checklist-item">
            <input type="checkbox" checked={checklist.final_approval} onChange={(e) => setChecklist({ ...checklist, final_approval: e.target.checked })} />
            <span className="checkbox-label">I confirm the advertisement is ready for deployment</span>
          </label>
        </div>
      </section>

      <div className="actions">
        <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting || !checklist.final_approval} className="submit-btn">{isSubmitting ? 'Processing...' : 'Complete Deployment'}</Button>
        <Button onClick={() => window.history.back()} variant="secondary" disabled={isSubmitting}>Cancel</Button>
      </div>
    </div>
  );
}
