import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../presentation/styles/globals.css';

const OptionsApp: React.FC = () => (
  <div style={{ padding: 24 }}>
    <h1>Xposter Settings</h1>
    <p>Settings page — coming in Phase 9</p>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
