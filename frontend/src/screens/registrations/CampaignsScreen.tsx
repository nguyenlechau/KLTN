import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { apiFetch } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { Table } from '../../components/Table';
import '../../styles/screen.css';

interface ContentOption {
  id: string;
  name: string;
  computed_status: 'HET_HAN' | 'CON_HAN';
}

interface ChannelOption {
  id: string;
  code: string;
  name: string;
  location_id?: string | null;
  location_name?: string | null;
}

interface LocationOption {
  id: string;
  code: string;
  name: string;
  classification?: string | null;
  province?: string | null;
  sub_district?: string | null;
  address_line?: string | null;
  channels?: string[];
}

interface CategoryOption {
  id: string;
  code: string;
  name: string;
}

interface PhysicalItemOption {
  id: string;
  channel_id: string;
  category_id: string;
  location_id: string;
  item_code: string;
  item_name: string;
  width: string;
  length: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

interface CategoryBlock {
  id: string;
  channelId: string;
  categoryId: string;
  locationIds: string[];
  isExpanded: boolean;
}

interface RegistrationRow {
  id: string;
  registration_no: string;
  campaign_name: string;
  status: string;
}

const WORKFLOW_ACTIONS = [
  'SAVE_DRAFT',
  'SUBMIT',
  'REQUEST_REVISION',
  'RESUBMIT',
  'REVIEW_PASS',
  'APPROVE',
  'PREPARE_DEPLOYMENT',
  'SUBMIT_FINAL_ACCEPTANCE',
  'COMPLETE',
];

type ViewMode = 'list' | 'form';

export function CampaignsScreen() {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [contents, setContents] = useState<ContentOption[]>([]);
  const [items, setItems] = useState<PhysicalItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [categoryBlocks, setCategoryBlocks] = useState<CategoryBlock[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCategoryPickerChannelId, setShowCategoryPickerChannelId] = useState<string | null>(null);
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

  // List state
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [applying, setApplying] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Record<string, string>>({});

  const loadOptions = async () => {
    try {
      const [allChannels, allLocations, allCategories, allContents, allItems] = await Promise.all([
        apiFetch<ChannelOption[]>('/master/channels'),
        apiFetch<LocationOption[]>('/master/locations'),
        apiFetch<CategoryOption[]>('/master/categories'),
        apiFetch<ContentOption[]>('/master/contents'),
        apiFetch<PhysicalItemOption[]>('/physical-items'),
      ]);

      setChannels(allChannels);
      setLocations(allLocations);
      setCategories(allCategories);
      setContents(allContents.filter((item) => item.computed_status === 'CON_HAN'));
      setItems(allItems);
    } catch (err: any) {
      setError(err.message || 'Failed to load options');
    }
  };

  const loadCampaigns = async () => {
    try {
      setRows(await apiFetch<RegistrationRow[]>('/registrations'));
    } catch (err: any) {
      setError(err.message || 'Failed to load registrations');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadOptions(), loadCampaigns()]);
      setLoading(false);
    };
    load();
  }, []);

  const resetForm = () => {
    setForm({
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
    setSelectedChannelIds([]);
    setCategoryBlocks([]);
    setSelectedItems([]);
    setShowCategoryPickerChannelId(null);
    setErrors({});
    setEditingId(null);
    setMode('NEW');
  };

  const handleEdit = async (id: string) => {
    // For now, we'll just switch to form mode
    // In a real app, you'd fetch the registration data and populate the form
    setEditingId(id);
    setViewMode('form');
    setError('');
    // TODO: Fetch registration data and populate form
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const selectedChannels = channels.filter((item) => selectedChannelIds.includes(item.id));
  const selectedChannelCodes = selectedChannels.map((item) => item.code);
  const selectedCategoryIds = categoryBlocks.map((block) => block.categoryId);
  const selectedLocationIds = Array.from(new Set(categoryBlocks.flatMap((block) => block.locationIds)));
  const selectedLocations = locations.filter((item) => selectedLocationIds.includes(item.id));
  const selectedCategories = categories.filter((item) => selectedCategoryIds.includes(item.id));

  const filteredLocations = locations.filter((location) => {
    if (selectedChannelCodes.length === 0) return true;
    const supportedChannels = location.channels ?? [];
    if (supportedChannels.length === 0) return false;
    return selectedChannelCodes.some((code) => supportedChannels.includes(code));
  });

  const availableCategories = categories.filter((category) => !selectedCategoryIds.includes(category.id));

  const getMatchingItemId = (categoryId: string, locationId: string) => {
    return items.find((item) => {
      const channelMatch = selectedChannelIds.length === 0 || selectedChannelIds.includes(item.channel_id);
      return channelMatch && item.category_id === categoryId && item.location_id === locationId;
    })?.id ?? null;
  };

  const filteredItems = items.filter((item) => selectedItems.includes(item.id));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (selectedChannelIds.length === 0) newErrors.channelIds = 'Please select at least one channel';
    if (selectedLocationIds.length === 0) newErrors.locationIds = 'Please select at least one location';
    if (selectedCategoryIds.length === 0) newErrors.categoryIds = 'Please select at least one category';
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

  const toggleSelection = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => (current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]));
  };

  const clearCategoryBlocks = () => {
    setCategoryBlocks([]);
    setSelectedItems([]);
    setShowCategoryPickerChannelId(null);
  };

  const addCategoryBlock = (categoryId: string, channelId: string) => {
    if (categoryBlocks.some((block) => block.channelId === channelId && block.categoryId === categoryId)) {
      setShowCategoryPickerChannelId(null);
      return;
    }

    setCategoryBlocks((current) => [
      ...current,
      {
        id: `${channelId}-${categoryId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        channelId,
        categoryId,
        locationIds: [],
        isExpanded: true,
      },
    ]);
    setShowCategoryPickerChannelId(null);
  };

  const toggleBlockExpanded = (blockId: string) => {
    setCategoryBlocks((current) =>
      current.map((entry) =>
        entry.id === blockId ? { ...entry, isExpanded: !entry.isExpanded } : entry
      )
    );
  };

  const removeCategoryBlock = (blockId: string) => {
    const block = categoryBlocks.find((entry) => entry.id === blockId);
    if (!block) {
      return;
    }

    const removedItemIds = block.locationIds
      .map((locationId) => getMatchingItemId(block.categoryId, locationId))
      .filter((itemId): itemId is string => Boolean(itemId));
    setCategoryBlocks((current) => current.filter((entry) => entry.id !== blockId));
    setSelectedItems((current) => current.filter((itemId) => !removedItemIds.includes(itemId)));
  };

  const toggleBlockLocation = (blockId: string, locationId: string) => {
    const block = categoryBlocks.find((entry) => entry.id === blockId);
    if (!block) {
      return;
    }

    const isSelected = block.locationIds.includes(locationId);
    const matchingItemId = getMatchingItemId(block.categoryId, locationId);

    if (!matchingItemId) {
      return;
    }

    setCategoryBlocks((current) => current.map((entry) => {
      if (entry.id !== blockId) {
        return entry;
      }
      return {
        ...entry,
        locationIds: isSelected ? entry.locationIds.filter((id) => id !== locationId) : [...entry.locationIds, locationId],
      };
    }));

    setSelectedItems((current) => {
      if (isSelected) {
        return current.filter((itemId) => itemId !== matchingItemId);
      }
      return current.includes(matchingItemId) ? current : [...current, matchingItemId];
    });
  };

  const renderOptionList = (
    title: string,
    description: string,
    options: Array<{ id: string; label: string; helper?: string }>,
    selectedIds: string[],
    onToggle: (id: string) => void,
    emptyMessage: string,
  ) => (
    <div className="selection-panel">
      <div className="selection-panel-header">
        <div>
              label="Start Date"
          <div className="selection-panel-description">{description}</div>
        </div>
        <div className="selection-count">{selectedIds.length} selected</div>
      </div>
      {options.length > 0 ? (
        <div className="selection-list">
          {options.map((option) => {
              label="End Date"
            return (
              <label key={option.id} className={`selection-item ${checked ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(option.id)} />
                <div>
                  <div className="selection-item-title">{option.label}</div>
                  {option.helper && <div className="selection-item-helper">{option.helper}</div>}
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="selection-empty">{emptyMessage}</div>
      )}
    </div>
  );

  const channelLabel = (id: string) => {
    const channel = channels.find((item) => item.id === id);
    return channel ? `${channel.code} - ${channel.name}` : id;
  };

  const locationLabel = (id: string) => {
    const location = locations.find((item) => item.id === id);
    return location ? `${location.code} - ${location.name}` : id;
  };

  const categoryLabel = (id: string) => {
    const category = categories.find((item) => item.id === id);
    return category ? `${category.code} - ${category.name}` : id;
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
            channelId: selectedChannelIds[0] ?? '',
            categoryId: categoryBlocks[0]?.categoryId ?? null,
            name: form.newContentName,
            startDate: form.newContentStartDate,
            endDate: form.newContentEndDate,
            imageKeys: [],
          } : undefined,
          selectedItemIds: selectedItems,
        }),
      });
      setSuccess(editingId ? 'Campaign updated successfully!' : 'Campaign created successfully!');
      await loadCampaigns();
      resetForm();
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to save campaign');
    }
    setSubmitting(false);
  };

  const [generatingMocks, setGeneratingMocks] = useState(false);
  const generateMockRegistrations = async (count = 3) => {
    if (channels.length === 0 || locations.length === 0 || categories.length === 0 || items.length === 0) {
      setError('Insufficient data to generate mock registrations');
      return;
    }
    setGeneratingMocks(true);
    try {
      for (let i = 0; i < count; i++) {
        const channelId = channels[0].id;
        const locationId = locations[0].id;
        const categoryId = categories[0].id;
        const candidateItems = items.filter((it) => it.channel_id === channelId && it.location_id === locationId && it.category_id === categoryId);
        const selectedItemIdsLocal = (candidateItems.length ? candidateItems.slice(0, 2) : [items[0]]).map((it) => it.id);
        await apiFetch('/registrations', {
          method: 'POST',
          body: JSON.stringify({
            campaignName: `Mock Campaign ${Date.now().toString().slice(-5)}-${i}`,
            budgetEstimate: 1000000 + i * 500000,
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
            documentKey: `MOCK-${i}`,
            representativeName: 'Auto Tester',
            representativePhone: '0123456789',
            contentMode: 'NEW',
            newContent: {
              channelId,
              categoryId,
              name: `Auto Content ${i}`,
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
              imageKeys: [],
            },
            selectedItemIds: selectedItemIdsLocal,
          }),
        });
      }
      setSuccess(`Successfully created ${count} mock registrations`);
      await loadCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to create mock registrations');
    }
    setGeneratingMocks(false);
  };

  const runAction = async (id: string) => {
    const action = selectedAction[id];
    if (!action) {
      setError('Please select an action');
      return;
    }

    setApplying(true);
    setError('');
    try {
      await apiFetch(`/registrations/${id}/workflow-action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setSuccess(`Action "${action}" completed successfully`);
      setSelectedAction((s) => ({ ...s, [id]: '' }));
      await loadCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to apply action');
    }
    setApplying(false);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'inactive',
      'SUPERVISOR_REVIEW': 'pending',
      'CENTRAL_OPS_REVIEW': 'pending',
      'MANAGER_APPROVAL': 'pending',
      'APPROVED': 'approved',
      'DEPLOYMENT_PREP': 'warning',
      'FINAL_ACCEPTANCE': 'pending',
      'COMPLETED': 'approved',
      'REVISION_REQUIRED': 'danger',
    };
    return statusMap[status] || 'inactive';
  };

  if (loading && viewMode === 'list') return <Spinner />;

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Registrations</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            onClick={() => {
              setViewMode('list');
              resetForm();
            }}
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            className="btn-sm"
          >
            List
          </Button>
          <Button
            onClick={() => {
              setViewMode('form');
              resetForm();
            }}
            variant={viewMode === 'form' ? 'primary' : 'secondary'}
            className="btn-sm"
          >
            Create New
        </div>
      </div>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {viewMode === 'list' ? (
        <Card title="Registration List">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Button onClick={() => generateMockRegistrations(3)} loading={generatingMocks} variant="secondary" className="btn-sm">
                  Generate Sample Data
                </Button>
              </div>
              <Table
              headers={['#', 'Campaign', 'Status', 'Actions']}
              rows={rows.map((row) => [
                row.registration_no,
                row.campaign_name,
                <span className={`badge badge-${getStatusBadgeClass(row.status)}`}>{row.status}</span>,
                <div className="actions" style={{ gap: '0.5rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                  <Button
                    onClick={() => handleEdit(row.id)}
                    variant="info"
                    className="btn-sm"
                  >
                    Edit
                  </Button>
                  <select
                    value={selectedAction[row.id] ?? ''}
                    onChange={(e) => setSelectedAction((s) => ({ ...s, [row.id]: e.target.value }))}
                    className="action-select"
                    style={{ flex: 1, minWidth: '120px' }}
                  >
                    <option value="">-- Select Action --</option>
                    {WORKFLOW_ACTIONS.map((action) => (
                      <option value={action} key={action}>
                        {action === 'SAVE_DRAFT'
                          ? 'Save Draft'
                          : action === 'SUBMIT'
                            ? 'Submit for Review'
                            : action === 'REQUEST_REVISION'
                              ? 'Request Revision'
                              : action === 'RESUBMIT'
                                ? 'Resubmit'
                                : action === 'REVIEW_PASS'
                                  ? 'Approve Review'
                                  : action === 'APPROVE'
                                    ? 'Approve'
                                    : action === 'PREPARE_DEPLOYMENT'
                                      ? 'Prepare Deployment'
                                      : action === 'SUBMIT_FINAL_ACCEPTANCE'
                                        ? 'Submit for Acceptance'
                                        : 'Complete'}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => runAction(row.id)}
                    loading={applying}
                    variant="success"
                    className="btn-sm"
                  >
                    Execute
                  </Button>
                </div>,
              ])}
            />
            </>
          )}
        </Card>
      ) : (
        // FORM VIEW
        <form onSubmit={onSubmit}>
          {editingId && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e3f2fd', borderRadius: '0.375rem', color: '#1565c0' }}>
              ✎ Editing registration - ID: {editingId}
            </div>
          )}

          {/* Section C */}
          <Card title={<><span className="step-number">C</span> Registration Information</>}>
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
                label="IO / Document No"
                value={form.documentKey}
                onChange={(val) => setForm((s) => ({ ...s, documentKey: val }))}
                placeholder="Document reference (optional)"
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
                label="Phone Number"
                value={form.representativePhone}
                onChange={(val) => setForm((s) => ({ ...s, representativePhone: val }))}
                type="tel"
                placeholder="0123456789"
                error={errors.representativePhone}
              />
            </div>
          </Card>

          {/* Section D */}
          <Card title={<><span className="step-number">D</span> Advertising Content</>}>
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
                <span style={{ fontWeight: 500 }}>Use valid content</span>
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

          

          {/* Section B */}
          <Card title={<><span className="step-number">B</span> Select Products</>}>
            <div className="step-intro" style={{ marginBottom: '1rem' }}>
              Select channels first, then add categories. Each category has its own locations table for selecting physical items.
            </div>

            <div className="selection-grid">
              {renderOptionList(
                'Channels',
                'Select one or more channels to reveal matching locations.',
                channels.map((channel) => ({
                  id: channel.id,
                  label: `${channel.code} - ${channel.name}`,
                  helper: channel.location_name ? `Linked: ${channel.location_name}` : undefined,
                })),
                selectedChannelIds,
                (id) => {
                  toggleSelection(id, setSelectedChannelIds);
                  clearCategoryBlocks();
                },
                'No channels to display.',
              )}
            </div>

            <div className="selection-summary">
              <div className="selection-summary-item">
                <span>Channels</span>
                <strong>{selectedChannels.length > 0 ? selectedChannels.map((item) => item.code).join(', ') : 'Not selected'}</strong>
              </div>
              <div className="selection-summary-item">
                <span>Categories</span>
                <strong>{selectedCategories.length > 0 ? selectedCategories.map((item) => item.code).join(', ') : 'Not selected'}</strong>
              </div>
              <div className="selection-summary-item">
                <span>Locations</span>
                <strong>{selectedLocations.length > 0 ? selectedLocations.map((item) => item.code).join(', ') : 'Not selected'}</strong>
              </div>
            </div>

            {errors.channelIds && <span className="input-error-text">{errors.channelIds}</span>}
            {errors.locationIds && <span className="input-error-text">{errors.locationIds}</span>}
            {errors.categoryIds && <span className="input-error-text">{errors.categoryIds}</span>}

            <div style={{ marginTop: '1rem', marginBottom: '1rem', color: 'var(--gray-600)' }}>
              Each channel has a list of categories. Click to view location details and select items.
            </div>

            {selectedChannelIds.length > 0 ? (
              <div className="registration-builder">
                {selectedChannels.map((channel) => {
                  const channelBlocks = categoryBlocks.filter((block) => block.channelId === channel.id);
                  const channelLocations = filteredLocations.filter((location) => location.channels?.includes(channel.code));
                  return (
                    <div key={channel.id} className="registration-channel-card">
                      <div className="registration-channel-header">
                        <span className="registration-channel-title-text">{channel.code} - {channel.name}</span>
                        <div className="registration-channel-actions">
                          <Button type="button" variant="secondary" className="btn-sm" onClick={() => {}}>✎</Button>
                          <Button type="button" variant="secondary" className="btn-sm" onClick={() => {}}>🗑</Button>
                        </div>
                      </div>

                      <div className="registration-channel-body">
                        {channelBlocks.length > 0 ? (
                          channelBlocks.map((block) => {
                            const category = categories.find((entry) => entry.id === block.categoryId);
                            const matchingLocations = channelLocations.filter((location) => Boolean(getMatchingItemId(block.categoryId, location.id)));
                            return (
                              <div key={block.id} className="registration-category-block">
                                  <div className="registration-category-header">
                                  <button type="button" className="registration-category-toggle" onClick={() => toggleBlockExpanded(block.id)}>
                                    {block.isExpanded ? '⌄' : '›'}
                                  </button>
                                  <button type="button" className="registration-category-summary" onClick={() => toggleBlockExpanded(block.id)}>
                                    <span className="registration-category-name">Category: {category ? `${category.code} - ${category.name}` : 'Unknown'}</span>
                                    <span className="registration-category-meta">Total locations: {matchingLocations.length} · {matchingLocations.length} items</span>
                                  </button>
                                  <div className="registration-category-actions">
                                    <Button type="button" variant="secondary" className="btn-sm" onClick={() => removeCategoryBlock(block.id)}>
                                      Remove
                                    </Button>
                                  </div>
                                </div>

                                {block.isExpanded && (
                                  <div className="registration-category-body">
                                    {matchingLocations.length > 0 ? (
                                      <Table
                                        headers={['Select', 'Location Code', 'Location Name', 'Area', 'Channels', 'Item']}
                                        rows={matchingLocations.map((location) => {
                                          const checked = block.locationIds.includes(location.id);
                                          const matchingItemId = getMatchingItemId(block.categoryId, location.id);
                                          const matchingItem = matchingItemId ? items.find((item) => item.id === matchingItemId) : null;
                                          return [
                                            <input
                                              key={`location-${block.id}-${location.id}`}
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() => toggleBlockLocation(block.id, location.id)}
                                            />,
                                            location.code,
                                            location.name,
                                            location.province || location.sub_district || '—',
                                            location.channels?.length ? location.channels.join(', ') : '—',
                                            matchingItem ? matchingItem.item_code : '—',
                                          ];
                                        })}
                                      />
                                      ) : (
                                      <div className="registration-location-empty">
                                        No locations have items for this category.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="registration-channel-empty">
                            No categories in this channel.
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="secondary"
                          className="btn-sm"
                          onClick={() => setShowCategoryPickerChannelId((current) => (current === channel.id ? null : channel.id))}
                          style={{ marginTop: '0.75rem' }}
                        >
                          + Add category for {channel.code}
                        </Button>

                        {showCategoryPickerChannelId === channel.id && (
                          <div className="registration-category-picker">
                            <div className="registration-category-picker-title">Select category:</div>
                            <div className="registration-category-picker-grid">
                              {availableCategories.map((category) => (
                                <Button
                                  key={category.id}
                                  type="button"
                                  variant="secondary"
                                  className="btn-sm"
                                  onClick={() => addCategoryBlock(category.id, channel.id)}
                                  style={{ whiteSpace: 'nowrap' }}
                                >
                                  {category.code} - {category.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                Please select at least one channel first.
              </div>
            )}

            <div style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--gray-600)' }}>
              Item data is selected automatically by category and location. You can still unselect individual items in the summary table below.
            </div>

            {selectedLocationIds.length > 0 && selectedCategoryIds.length > 0 ? (
              filteredItems.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Channel</th>
                        <th>Location</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Description</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => toggleItem(item.id)}
                            />
                          </td>
                          <td>{item.item_code}</td>
                          <td>{item.item_name}</td>
                          <td>{channelLabel(item.channel_id)}</td>
                          <td>{locationLabel(item.location_id)}</td>
                          <td>{categoryLabel(item.category_id)}</td>
                          <td>{`${Number(item.width) > 0 ? item.width : 'N/A'} x ${Number(item.length) > 0 ? item.length : 'N/A'}`}</td>
                          <td>{item.description || '-'}</td>
                          <td>
                            <span className={`badge badge-${item.status === 'ACTIVE' ? 'approved' : item.status === 'PENDING' ? 'warning' : 'inactive'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                  No items match the selected channel, location and category.
                </div>
              )
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                Please select a channel and at least one category that has locations to view the item list.
              </div>
            )}

            {errors.selectedItems && <span className="input-error-text" style={{ display: 'block', marginTop: '0.5rem' }}>{errors.selectedItems}</span>}
          </Card>

          <div className="wizard-nav" style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
            <Button type="submit" loading={submitting}>
              {editingId ? 'Update Registration' : 'Create Registration'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setViewMode('list');
                resetForm();
              }}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
