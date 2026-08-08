import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SecurityProvider } from './context/SecurityContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SecurityProvider>
        <App />
      </SecurityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
