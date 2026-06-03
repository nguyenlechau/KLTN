import './modal.css';
import { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen?: boolean;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  large?: boolean;
}

export function Modal({
  isOpen,
  title,
  children,
  onConfirm,
  onCancel,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  large = false,
}: ModalProps) {
  const visible = isOpen ?? true;
  if (!visible) return null;

  const closeHandler = onClose ?? onCancel;
  const showFooter = typeof onConfirm === 'function';

  return (
    <div className="modal-overlay">
      <div className={`modal ${large ? 'modal-large' : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {closeHandler && (
            <button className="modal-close" onClick={closeHandler} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="modal-content">{children}</div>
        {showFooter && (
          <div className="modal-footer">
            <Button onClick={closeHandler} variant="secondary">
              {cancelText}
            </Button>
            <Button onClick={onConfirm} variant={variant === 'danger' ? 'danger' : 'primary'}>
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
