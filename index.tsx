
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Arcane Bootloader: Starting application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical: Root element not found!");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Arcane Bootloader: Render initiated successfully.");
  } catch (error) {
    console.error("Critical Render Error:", error);
  }
}
