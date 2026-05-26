import { ReactNode, useCallback, useState } from 'react';
import './table.css';
import './editable-gridview.css';

export interface GridColumn {
  key: string;
  header: string;
  sortable?: boolean;
  editable?: boolean;
  type?: 'text' | 'number' | 'select' | 'boolean' | 'date';
  width?: string;
  render?: (value: any, row: any) => ReactNode;
  options?: { label: string; value: any }[];
  validate?: (value: any) => string | null;
}

export interface GridRow {
  id: string;
  [key: string]: any;
}

export interface EditableGridViewProps<T extends GridRow = GridRow> {
  columns: GridColumn[];
  rows: T[];
  onEdit?: (rowId: string, columnKey: string, newValue: any, oldRow: T) => Promise<void>;
  onDelete?: (rowId: string) => Promise<void>;
  onAdd?: (newRow: Partial<T>) => Promise<void>;
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  showActions?: boolean;
  actionWidth?: string;
}

export function EditableGridView<T extends GridRow = GridRow>({
  columns,
  rows,
  onEdit,
  onDelete,
  onAdd,
  loading = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
  showActions = true,
  actionWidth = '120px',
}: EditableGridViewProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [editError, setEditError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleEditStart = useCallback((row: T, column: GridColumn) => {
    if (!column.editable) return;
    setEditingCell({ rowId: row.id, columnKey: column.key });
    setEditValue(row[column.key] ?? '');
    setEditError('');
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
    setEditError('');
  }, []);

  const handleEditSave = useCallback(
    async (row: T, column: GridColumn) => {
      // Validate
      if (column.validate) {
        const error = column.validate(editValue);
        if (error) {
          setEditError(error);
          return;
        }
      }

      // Type conversion
      let finalValue: any = editValue;
      if (column.type === 'number') {
        finalValue = editValue === '' ? null : parseFloat(editValue);
      } else if (column.type === 'boolean') {
        finalValue = editValue === true || editValue === 'true';
      }

      setSaving(true);
      try {
        if (onEdit) {
          await onEdit(row.id, column.key, finalValue, row);
        }
        setEditingCell(null);
        setEditValue('');
        setEditError('');
      } catch (err: any) {
        setEditError(err.message || 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [editValue, onEdit]
  );

  const renderCell = (row: T, column: GridColumn): ReactNode => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnKey === column.key;
    const value = row[column.key];

    if (isEditing) {
      return (
        <div className="editable-cell-editor">
          {column.type === 'select' ? (
            <select
              value={editValue ?? ''}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              className="cell-input cell-select"
            >
              <option value="">— Select —</option>
              {column.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : column.type === 'boolean' ? (
            <input
              type="checkbox"
              checked={editValue === true || editValue === 'true'}
              onChange={(e) => setEditValue(e.target.checked)}
              autoFocus
              className="cell-input cell-checkbox"
            />
          ) : column.type === 'number' ? (
            <input
              type="number"
              value={editValue ?? ''}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              className="cell-input"
              placeholder="Enter number"
            />
          ) : column.type === 'date' ? (
            <input
              type="date"
              value={editValue ?? ''}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              className="cell-input"
            />
          ) : (
            <input
              type="text"
              value={editValue ?? ''}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave(row, column);
                if (e.key === 'Escape') handleEditCancel();
              }}
              autoFocus
              className="cell-input"
              placeholder={`Enter ${column.header.toLowerCase()}`}
            />
          )}
          <div className="cell-controls">
            <button
              className="cell-btn cell-btn-save"
              onClick={() => handleEditSave(row, column)}
              disabled={saving}
              title="Save (Enter)"
            >
              ✓
            </button>
            <button
              className="cell-btn cell-btn-cancel"
              onClick={handleEditCancel}
              disabled={saving}
              title="Cancel (Esc)"
            >
              ✕
            </button>
          </div>
          {editError && <div className="cell-error">{editError}</div>}
        </div>
      );
    }

    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === 'boolean') {
      return <span className={`badge badge-${value ? 'success' : 'danger'}`}>{value ? 'Yes' : 'No'}</span>;
    }

    if (column.type === 'number') {
      return value != null ? typeof value === 'number' ? value.toFixed(2) : value : '—';
    }

    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '—';
    }

    return value ?? '—';
  };

  return (
    <div className="editable-gridview-container">
      <div className="gridview-wrapper">
        <table className="editable-gridview">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="header-content">
                    <span>{col.header}</span>
                    {col.sortable && sortBy === col.key && (
                      <span className={`sort-indicator sort-${sortOrder}`}>
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {showActions && (
                <th style={{ width: actionWidth }} className="actions-column">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="gridview-row">
                  {columns.map((col) => (
                    <td
                      key={`${row.id}-${col.key}`}
                      className={`gridview-cell ${col.editable ? 'editable' : ''}`}
                      onClick={() => col.editable && handleEditStart(row, col)}
                      style={{
                        cursor: col.editable ? 'pointer' : 'default',
                        width: col.width,
                      }}
                    >
                      {renderCell(row, col)}
                      {col.editable && !editingCell && (
                        <div className="edit-hint" title={`Click to edit ${col.header.toLowerCase()}`}>
                          ✎
                        </div>
                      )}
                    </td>
                  ))}
                  {showActions && (
                    <td className="gridview-actions">
                      {onDelete && (
                        <button
                          className="action-btn action-delete"
                          onClick={() => onDelete?.(row.id)}
                          disabled={saving}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="gridview-empty"
                >
                  {loading ? '⏳ Loading...' : 'No data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
