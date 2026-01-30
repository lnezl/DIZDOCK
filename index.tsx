import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Мгновенно сообщаем, что файл начал исполняться
(window as any).APP_LOADED = true;

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Arcane Hub: Запущен успешно.");
    
    // Скрываем плашку ошибок если вдруг она появилась
    const errDisp = document.getElementById('error-display');
    if (errDisp) errDisp.style.display = 'none';
    
  } catch (error: any) {
    console.error("Render Error:", error);
    const display = document.getElementById('error-display');
    if (display) {
      display.style.display = 'block';
      display.innerHTML += `<div>[RENDER ERROR]: ${error?.message || 'Unknown'}</div>`;
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}