import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store/store';
import { injectStore } from './api/axiosInstance';
import './index.css';

injectStore(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#252535',
            color: '#e5e7eb',
            border: '1px solid #383850',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#252535' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#252535' },
          },
        }}
      />
    </Provider>
  </React.StrictMode>
);
