import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/screen.css';

interface ContentOption {
  id: string;
  name: string;
  computed_status: 'HET_HAN' | 'CON_HAN';
}

interface ItemOption {
  id: string;
  item_code: string;
}

export function RegistrationFormScreen() {
  const [mode, setMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [contents, setContents] = useState<ContentOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    campaignName: '',
    budgetEstimate: '',
    startDate: '',
    endDate: '',
    documentKey: '',
    representativeName: '',
    representativePhone: '',
    contentId: '',
    newContentName: '',
    newContentStartDate: '',
    newContentEndDate: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const allContents = await apiFetch<ContentOption[]>('/master/contents');
        setContents(allContents.filter((item) => item.computed_status === 'CON_HAN'));
        const allItems = await apiFetch<ItemOption[]>('/physical-items');
        setItems(allItems);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      }
      setLoading(false);
    })();
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.campaignName.trim()) newErrors.campaignName = 'Campaign name is required';
    if (!form.budgetEstimate || parseInt(form.budgetEstimate) < 0) newErrors.budgetEstimate = 'Budget must be ≥0';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.startDate >= form.endDate) newErrors.endDate = 'End date must be after start date';
    if (!form.representativeName.trim()) newErrors.representativeName = 'Representative name is required';
    if (form.representativePhone && !/^\d{10}$/.test(form.representativePhone)) newErrors.representativePhone = 'Phone must be 10 digits';
    if (mode === 'EXISTING' && !form.contentId) newErrors.contentId = 'Please select a content';
    if (mode === 'NEW' && !form.newContentName.trim()) newErrors.newContentName = 'Content name is required';
    if (selectedItems.length === 0) newErrors.selectedItems = 'Select at least one item';
    return newErrors;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          campaignName: form.campaignName,
          budgetEstimate: parseInt(form.budgetEstimate),
          startDate: form.startDate,
          endDate: form.endDate,
          documentKey: form.documentKey,
          representativeName: form.representativeName,
          representativePhone: form.representativePhone,
          contentMode: mode,
          contentId: mode === 'EXISTING' ? form.contentId : undefined,
          newContent: mode === 'NEW' ? {
            channelId: '',
            categoryId: null,
            name: form.newContentName,
            startDate: form.newContentStartDate,
            endDate: form.newContentEndDate,
            imageKeys: [],
          } : undefined,
          selectedItemIds: selectedItems,
        }),
      });
      setSuccess('Registration created successfully!');
      setForm({campaignName: '', budgetEstimate: '', startDate: '', endDate: '', documentKey: '', representativeName: '', representativePhone: '', contentId: '', newContentName: '', newContentStartDate: '', newContentEndDate: '' });
      setSelectedItems([]);
      setErrors({});
    } catch (err: any) {
      setError(err.message || 'Failed to create registration');
    }
    setSubmitting(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="screen">
      <h2>Create Registration</h2>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <form onSubmit={onSubmit}>
        {/* Section A */}
        <Card title={<><span className="step-number">A</span> Registration Info</>}>
          <div className="form-row">
            <Input
              label="Campaign Name"
              value={form.campaignName}
              onChange={(val) => setForm((s) => ({ ...s, campaignName: val }))}
              placeholder="Descriptive campaign name"
              required
              error={errors.campaignName}
            />
            <Input
              label="Budget Estimate"
              value={form.budgetEstimate}
              onChange={(val) => setForm((s) => ({ ...s, budgetEstimate: val }))}
              type="number"
              min="0"
              placeholder="0"
              required
              error={errors.budgetEstimate}
            />
            <Input
              label="Start Date"
              value={form.startDate}
              onChange={(val) => setForm((s) => ({ ...s, startDate: val }))}
              type="date"
              required
              error={errors.startDate}
            />
            <Input
              label="End Date"
              value={form.endDate}
              onChange={(val) => setForm((s) => ({ ...s, endDate: val }))}
              type="date"
              required
              error={errors.endDate}
            />
          </div>
          <div className="form-row">
            <Input
              label="IO / Document"
              value={form.documentKey}
              onChange={(val) => setForm((s) => ({ ...s, documentKey: val }))}
              placeholder="Reference document code (optional)"
            />
            <Input
              label="Contact Person"
              value={form.representativeName}
              onChange={(val) => setForm((s) => ({ ...s, representativeName: val }))}
              placeholder="Primary contact"
              required
              error={errors.representativeName}
            />
            <Input
              label="Phone"
              value={form.representativePhone}
              onChange={(val) => setForm((s) => ({ ...s, representativePhone: val }))}
              type="tel"
              placeholder="0123456789"
              error={errors.representativePhone}
            />
          </div>
        </Card>

        {/* Section B */}
        <Card title={<><span className="step-number">B</span> Content</>}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={mode === 'NEW'}
                onChange={() => setMode('NEW')}
              />
              <span style={{ fontWeight: 500 }}>Create new content</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={mode === 'EXISTING'}
                onChange={() => setMode('EXISTING')}
              />
              <span style={{ fontWeight: 500 }}>Use valid existing content</span>
            </label>
          </div>

          {mode === 'EXISTING' ? (
            <div className="input-group">
                <label className="input-label">
                Select content
                <span className="required">*</span>
              </label>
              <select
                value={form.contentId}
                onChange={(e) => setForm((s) => ({ ...s, contentId: e.target.value }))}
                className="action-select"
              >
                <option value="">-- Select content --</option>
                {contents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.contentId && <span className="input-error-text">{errors.contentId}</span>}
            </div>
          ) : (
            <div className="form-row">
              <Input
                label="Content Name"
                value={form.newContentName}
                onChange={(val) => setForm((s) => ({ ...s, newContentName: val }))}
                placeholder="New content name"
                required
                error={errors.newContentName}
              />
              <Input
                label="Start Date"
                value={form.newContentStartDate}
                onChange={(val) => setForm((s) => ({ ...s, newContentStartDate: val }))}
                type="date"
              />
              <Input
                label="End Date"
                value={form.newContentEndDate}
                onChange={(val) => setForm((s) => ({ ...s, newContentEndDate: val }))}
                type="date"
              />
            </div>
          )}
        </Card>

        {/* Section C */}
        <Card title={<><span className="step-number">C</span> Item Scope</>}>
          {items.length > 0 ? (
            <div className="checkbox-list">
              {items.map((item) => (
                <label key={item.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span>{item.item_code}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
              No items available
            </div>
          )}
          {errors.selectedItems && <span className="input-error-text" style={{ display: 'block', marginTop: '0.5rem' }}>{errors.selectedItems}</span>}
        </Card>

        <div className="wizard-nav" style={{ marginTop: '2rem' }}>
          <Button type="submit" loading={submitting}>Create Registration</Button>
        </div>
      </form>
    </div>
  );
}
