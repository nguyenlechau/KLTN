import { ReactNode, CSSProperties } from 'react';
import './button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  style,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      style={style}
    >
      {loading ? '…' : children}
    </button>
  );
}
