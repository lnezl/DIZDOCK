
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Сигнализируем HTML-коду, что React начал выполнение
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
  } catch (error) {
    console.error("Render Error:", error);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
