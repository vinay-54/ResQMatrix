import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools }  from '@tanstack/react-query-devtools';
import App from './App.jsx';
import { queryClient } from './lib/queryClient';
import 'leaflet/dist/leaflet.css';
import './styles/globals.css';
import './i18n'; // Initialize i18next before render

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  </React.StrictMode>
);
