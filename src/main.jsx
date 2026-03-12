import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element #root was not found in index.html');
}

const root = createRoot(rootElement);

const renderBootstrapError = (error) => {
    console.error('Fatal bootstrap error:', error);
    const message = error?.message || 'Unknown startup error';

    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#020617;color:#f8fafc;font-family:Outfit,sans-serif;">
        <div style="width:100%;max-width:700px;border:1px solid rgba(239,68,68,0.35);border-radius:16px;background:rgba(30,41,59,0.75);padding:20px;">
          <h2 style="margin:0 0 10px;color:#fca5a5;">›‘·  Õ„Ì· «· ÿ»Ìﬁ</h2>
          <p style="margin:0 0 14px;color:#cbd5e1;">ŸÂ— Œÿ√ √À‰«¡  ‘€Ì· «· ÿ»Ìﬁ. «› Õ Console ·„“Ìœ „‰ «· ›«’Ì·.</p>
          <pre style="margin:0;padding:12px;border-radius:10px;background:rgba(2,6,23,0.8);overflow-x:auto;white-space:pre-wrap;">${message}</pre>
          <button onclick="window.location.reload()" style="margin-top:14px;border:none;border-radius:10px;padding:10px 14px;background:#39ff14;color:#020617;font-weight:700;cursor:pointer;">≈⁄«œ…  Õ„Ì·</button>
        </div>
      </div>
    `;
};

const startApp = async () => {
    try {
        const { default: App } = await import('./App.jsx');
        root.render(
            <StrictMode>
                <AppErrorBoundary>
                    <App />
                </AppErrorBoundary>
            </StrictMode>
        );
    } catch (error) {
        renderBootstrapError(error);
    }
};

startApp();
