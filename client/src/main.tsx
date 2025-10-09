import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './design-system/ThemeProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { SnackbarProvider } from 'notistack';
import './index.css';
import AppRouter from './AppRouter';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Error boundary fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
    <pre className="p-4 mb-6 text-left text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
      {error.message}
    </pre>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Try again
    </button>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <HotkeysProvider>
            <SnackbarProvider
              maxSnack={3}
              autoHideDuration={5000}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <BrowserRouter>
                <AppRouter />
              </BrowserRouter>
              <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            </SnackbarProvider>
          </HotkeysProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
