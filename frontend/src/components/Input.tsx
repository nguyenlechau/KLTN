import './input.css';

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  maxLength,
  min,
  max,
  step,
  disabled = false,
}: InputProps) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`input ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
