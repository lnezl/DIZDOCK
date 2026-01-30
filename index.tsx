
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Arcane Bootloader: Инициализация ядра...");

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Critical: Root element not found!");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Arcane Bootloader: Рендеринг запущен.");
  } catch (error) {
    console.error("Critical Render Error:", error);
  }
};

// Гарантируем, что DOM готов перед рендерингом
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
