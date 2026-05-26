import './spinner.css';

export function Spinner() {
  return <div className="spinner"></div>;
}

export function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <Spinner />
    </div>
  );
}
