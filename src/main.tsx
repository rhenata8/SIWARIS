import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ConvexProvider } from 'convex/react';
import { convexClient, isConvexEnabled } from './services/convex';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const RootApp = () => {
  if (isConvexEnabled && convexClient) {
    return (
      <ConvexProvider client={convexClient}>
        <AppProvider>
          <App />
        </AppProvider>
      </ConvexProvider>
    );
  }

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
