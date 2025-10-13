import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

type RenderOptions = {
  route?: string;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
};

export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', ...renderOptions }: RenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route);
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

export * from '@testing-library/react';
export { renderWithProviders as render };
