// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

// ---- Google Fonts: Inter ----
const fontLink = document.createElement('link');
fontLink.rel = 'preconnect';
fontLink.href = 'https://fonts.googleapis.com';
document.head.appendChild(fontLink);

const fontLink2 = document.createElement('link');
fontLink2.rel = 'stylesheet';
fontLink2.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
document.head.appendChild(fontLink2);

// ---- React Query client ----
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* AuthProvider wraps everything — must be inside QueryClientProvider
            so AuthContext can use React Query if needed in future */}
        <AuthProvider>
          {/* SocketProvider depends on AuthContext */}
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
