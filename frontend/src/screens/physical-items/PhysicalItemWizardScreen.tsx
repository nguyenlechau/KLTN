import { useState } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import '../../styles/screen.css';

interface PreviewItem {
  seqNo: number;
  itemCode: string;
  itemName: string;
  inferredStatus: string;
}

interface ItemDetail {
  width: number;
  length: number;
  imageKey: string;
  description: string;
}

export function PhysicalItemWizardScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [base, setBase] = useState({ categoryId: '', locationId: '', quantity: 1 });
  const [generated, setGenerated] = useState<PreviewItem[]>([]);
  const [details, setDetails] = useState<Record<number, ItemDetail>>({});

  const preview = async () => {
    if (!base.categoryId || !base.locationId || base.quantity < 1) {
      setError('Please fill all fields correctly');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ generatedItems: PreviewItem[] }>('/physical-items/wizard/preview', {
        method: 'POST',
        body: JSON.stringify(base),
      });
      setGenerated(data.generatedItems);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to generate items');
    }
    setLoading(false);
  };

  const commit = async () => {
    setLoading(true);
    setError('');
    try {
      const items = generated.map((item) => ({
        seqNo: item.seqNo,
        itemCode: item.itemCode,
        itemName: item.itemName,
        width: parseFloat(`${details[item.seqNo]?.width ?? 0}`),
        length: parseFloat(`${details[item.seqNo]?.length ?? 0}`),
        imageKey: details[item.seqNo]?.imageKey || '',
        description: details[item.seqNo]?.description || '',
      }));

      await apiFetch('/physical-items/wizard/commit', {
        method: 'POST',
        body: JSON.stringify({ ...base, items }),
      });

      setSuccess('Items created successfully!');
      setStep(1);
      setGenerated([]);
      setDetails({});
      setBase({ categoryId: '', locationId: '', quantity: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to create items');
    }
    setLoading(false);
  };

  return (
    <div className="screen">
      <h2>Physical Items Wizard</h2>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Step 1: Input */}
      {step === 1 && (
        <Card title="Step 1: Item Configuration">
          <div className="step-section">
            <div className="form-grid">
              <Input
                label="Category ID"
                value={base.categoryId}
                onChange={(val) => setBase((s) => ({ ...s, categoryId: val }))}
                placeholder="Category identifier"
                required
              />
              <Input
                label="Location ID"
                value={base.locationId}
                onChange={(val) => setBase((s) => ({ ...s, locationId: val }))}
                placeholder="Location identifier"
                required
              />
              <Input
                label="Quantity"
                value={`${base.quantity}`}
                onChange={(val) => setBase((s) => ({ ...s, quantity: Math.max(1, parseInt(val) || 1) }))}
                type="number"
                min="1"
                required
              />
            </div>
            <Button onClick={preview} loading={loading}>Generate Items</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step >= 2 && (
        <Card title="Step 2: Generated Items">
          <div className="step-section">
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {generated.map((item) => (
                <div key={item.seqNo} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                  <strong>{item.itemCode}</strong> • {item.itemName}
                  <span className={`badge badge-${item.inferredStatus.toLowerCase()}`} style={{ marginLeft: '1rem', fontSize: '0.75rem' }}>
                    {item.inferredStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Details */}
      {step >= 2 && (
        <Card title="Step 3: Item Details (Dimensions & Images)">
          <div className="step-section">
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {generated.map((item) => (
                <div key={item.seqNo} style={{ padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--gray-700)' }}>{item.itemCode}</h4>
                  <div className="form-grid">
                    <Input
                      label="Width (cm)"
                      value={`${details[item.seqNo]?.width ?? ''}`}
                      onChange={(val) => setDetails((s) => ({ ...s, [item.seqNo]: { ...(s[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), width: parseFloat(val) || 0 } }))}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Input
                      label="Length (cm)"
                      value={`${details[item.seqNo]?.length ?? ''}`}
                      onChange={(val) => setDetails((s) => ({ ...s, [item.seqNo]: { ...(s[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), length: parseFloat(val) || 0 } }))}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Input
                      label="Image Key"
                      value={details[item.seqNo]?.imageKey ?? ''}
                      onChange={(val) => setDetails((s) => ({ ...s, [item.seqNo]: { ...(s[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), imageKey: val } }))}
                      placeholder="image-key"
                    />
                    <Input
                      label="Description"
                      value={details[item.seqNo]?.description ?? ''}
                      onChange={(val) => setDetails((s) => ({ ...s, [item.seqNo]: { ...(s[item.seqNo] ?? { width: 0, length: 0, imageKey: '', description: '' }), description: val } }))}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="wizard-nav" style={{ marginTop: '2rem' }}>
              <Button onClick={() => setStep(1)} variant="secondary">← Back</Button>
              <Button onClick={commit} loading={loading}>Create All Items ✓</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
