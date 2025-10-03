import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // optional global CSS
import { setLocale } from './components/i18n';

// Initialize locale before first render
try {
  const saved = localStorage.getItem('locale');
  if (saved) setLocale(saved);
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


