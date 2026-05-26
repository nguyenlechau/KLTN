import './alert.css';
import { ReactNode } from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  onClose?: () => void;
}

export function Alert({ type, children, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${type}`}>
      <div>{children}</div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
}
