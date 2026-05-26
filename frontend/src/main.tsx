import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/global.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML = '<h1 style="color: red;">ERROR: Root element not found</h1>';
} else {
  try {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('React render error:', error);
    rootEl.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace; white-space: pre-wrap;">
ERROR: ${error instanceof Error ? error.message : String(error)}

${error instanceof Error ? error.stack : ''}
    </div>`;
  }
}
