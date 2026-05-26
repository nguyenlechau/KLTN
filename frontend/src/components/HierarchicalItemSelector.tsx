/**
 * HierarchicalItemSelector.tsx
 * Multi-level item selector: Channel → Category → Location → Items
 * Per SYSTEM_SPECIFICATION Section G (Screen: Item Scope Tab)
 * Replaces flat item list with hierarchical dropdown structure
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import './HierarchicalItemSelector.css';

interface Channel {
  id: string;
  code: string;
  name: string;
}

interface Category {
  id: string;
  code: string;
  name: string;
}

interface Location {
  id: string;
  position_code: string;
  position_name: string;
  zone: string;
}

interface PhysicalItem {
  id: string;
  item_code: string;
  item_name: string;
  width_m?: number;
  length_m?: number;
  status: string;
}

interface HierarchicalItemSelectorProps {
  registrationId: string;
  onItemsSelected: (itemIds: string[]) => void;
  disabled?: boolean;
}

export const HierarchicalItemSelector: React.FC<HierarchicalItemSelectorProps> = ({
  registrationId,
  onItemsSelected,
  disabled = false,
}) => {
  // State for each level
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const [items, setItems] = useState<PhysicalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load channels on mount
  useEffect(() => {
    loadChannels();
  }, []);

  // Load categories when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadCategories(selectedChannel);
    } else {
      setCategories([]);
      setSelectedCategory('');
      setLocations([]);
      setSelectedLocation('');
      setItems([]);
    }
  }, [selectedChannel]);

  // Load locations when category changes
  useEffect(() => {
    if (selectedChannel && selectedCategory) {
      loadLocations(selectedChannel, selectedCategory);
    } else {
      setLocations([]);
      setSelectedLocation('');
      setItems([]);
    }
  }, [selectedChannel, selectedCategory]);

  // Load items when location changes
  useEffect(() => {
    if (selectedChannel && selectedCategory && selectedLocation) {
      loadItems(selectedChannel, selectedCategory, selectedLocation);
    } else {
      setItems([]);
    }
  }, [selectedChannel, selectedCategory, selectedLocation]);

  /**
   * API Calls
   */

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/channels?status=ACTIVE');
      setChannels(response.data.channels || []);
    } catch (err) {
      setError('Failed to load channels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (channelId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/categories?channel_id=${channelId}&status=ACTIVE`);
      setCategories(response.data.categories || []);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async (channelId: string, categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/locations?channel_id=${channelId}&category_id=${categoryId}&status=ACTIVE`
      );
      setLocations(response.data.locations || []);
    } catch (err) {
      setError('Failed to load locations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (channelId: string, categoryId: string, locationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/physical-items?channel_id=${channelId}&category_id=${categoryId}&location_id=${locationId}&status=ACTIVE`
      );
      setItems(response.data.items || []);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handlers
   */

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChannel(e.target.value);
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedItems(new Set());
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedLocation('');
    setSelectedItems(new Set());
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
    setSelectedItems(new Set());
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleAddItems = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API to add items to registration
      // POST /api/registrations/:id/items
      await api.post(`/registrations/${registrationId}/items`, {
        physical_item_ids: Array.from(selectedItems),
      });

      // Notify parent component
      onItemsSelected(Array.from(selectedItems));

      // Reset selection
      setSelectedItems(new Set());
      setSelectedLocation('');

      // Show success message
      alert(`${selectedItems.size} item(s) added to registration`);
    } catch (err) {
      setError('Failed to add items to registration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hierarchical-item-selector">
      <div className="selector-panel">
        {error && <div className="error-message">{error}</div>}

        {/* Level 1: Channel */}
        <div className="selector-level">
          <label htmlFor="channel-select">
            <strong>Step 1: Select Channel</strong>
          </label>
          <select
            id="channel-select"
            value={selectedChannel}
            onChange={handleChannelChange}
            disabled={disabled || loading || channels.length === 0}
            className="selector-input"
          >
            <option value="">-- Choose Channel --</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                [{ch.code}] {ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level 2: Category (visible only after channel selected) */}
        {selectedChannel && (
          <div className="selector-level">
            <label htmlFor="category-select">
              <strong>Step 2: Select Category</strong>
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={disabled || loading || categories.length === 0}
              className="selector-input"
            >
              <option value="">-- Choose Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  [{cat.code}] {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Level 3: Location/Position (visible only after category selected) */}
        {selectedCategory && (
          <div className="selector-level">
            <label htmlFor="location-select">
              <strong>Step 3: Select Position/Location</strong>
            </label>
            <select
              id="location-select"
              value={selectedLocation}
              onChange={handleLocationChange}
              disabled={disabled || loading || locations.length === 0}
              className="selector-input"
            >
              <option value="">-- Choose Position --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  [{loc.position_code}] {loc.position_name} ({loc.zone})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Level 4: Items (visible only after location selected) */}
        {selectedLocation && (
          <div className="selector-level">
            <label>
              <strong>Step 4: Select Items</strong>
            </label>
            <div className="items-grid">
              {items.length === 0 ? (
                <p className="no-items">No items available at this location</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="item-checkbox">
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleItemToggle(item.id)}
                      disabled={disabled || loading || item.status !== 'ACTIVE'}
                    />
                    <label htmlFor={`item-${item.id}`}>
                      <span className="item-code">{item.item_code}</span>
                      <span className="item-name">{item.item_name}</span>
                      {item.width_m && item.length_m && (
                        <span className="item-dimensions">
                          ({item.width_m}m × {item.length_m}m)
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>

            {/* Selected items summary */}
            {selectedItems.size > 0 && (
              <div className="selected-summary">
                <p>
                  <strong>{selectedItems.size}</strong> item(s) selected
                </p>
                <div className="selected-items-list">
                  {Array.from(selectedItems).map((itemId) => {
                    const item = items.find((i) => i.id === itemId);
                    return (
                      <span key={itemId} className="selected-tag">
                        {item?.item_code} <span className="remove-btn">×</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add button */}
            <button
              onClick={handleAddItems}
              disabled={disabled || loading || selectedItems.size === 0}
              className="btn btn-primary add-items-btn"
            >
              {loading ? 'Adding...' : `Add ${selectedItems.size} Item(s) to Registration`}
            </button>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="selector-info">
        <h4>Selection Guide</h4>
        <ol>
          <li>Choose a channel (distribution network)</li>
          <li>Select a category (advertising format)</li>
          <li>Pick a specific location/position</li>
          <li>Check items you want to add</li>
          <li>Click "Add Items" to proceed</li>
        </ol>
        <p className="note">
          <strong>Note:</strong> Only ACTIVE items can be selected. Inactive items are unavailable
          for new registrations.
        </p>
      </div>
    </div>
  );
};

export default HierarchicalItemSelector;
