import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { QuickstartProvider } from './context/index.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}
    >
      <QuickstartProvider>
        <App />
      </QuickstartProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)