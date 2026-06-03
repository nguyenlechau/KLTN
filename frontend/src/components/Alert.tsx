import './alert.css';
import { ReactNode } from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children?: ReactNode;
  message?: string;
  onClose?: () => void;
}

export function Alert({ type, children, message, onClose }: AlertProps) {
  const content = message ?? children;
  return (
    <div className={`alert alert-${type}`}>
      <div>{content}</div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
}
