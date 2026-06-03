import './spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md';
  text?: string;
}

export function Spinner({ size, text }: SpinnerProps) {
  return <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} aria-label="Loading" />;
}

export function LoadingOverlay({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <Spinner />
      <span className="loading-overlay-text">{text}</span>
    </div>
  );
}
