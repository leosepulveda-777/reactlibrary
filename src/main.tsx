// Punto de entrada de la aplicacion React.
// Monta el arbol de providers y el componente raiz en el DOM.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* AuthProvider: maneja sesion JWT en toda la app */}
    <AuthProvider>
      {/* ToastProvider: notificaciones globales */}
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
