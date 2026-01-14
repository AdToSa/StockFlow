import { render, type RenderOptions } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface RenderRouteOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

// Render a single route for testing
export function renderRoute(
  element: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderRouteOptions = {}
) {
  const routes = [
    {
      path: '*',
      element,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(<RouterProvider router={router} />, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
    router,
    queryClient,
  };
}

// Route configuration type
interface RouteConfig {
  path: string;
  element?: ReactElement;
  loader?: () => Promise<unknown>;
  action?: () => Promise<unknown>;
  children?: RouteConfig[];
  errorElement?: ReactElement;
}

// Render with full route configuration (for testing loaders/actions)
export function renderWithRouter(
  routes: RouteConfig[],
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderRouteOptions = {}
) {
  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(<RouterProvider router={router} />, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
    router,
    queryClient,
  };
}

// Wait for route to be ready (loader completed)
export async function waitForRouterReady(router: ReturnType<typeof createMemoryRouter>) {
  await new Promise((resolve) => {
    if (router.state.navigation.state === 'idle') {
      resolve(undefined);
    } else {
      const unsubscribe = router.subscribe((state) => {
        if (state.navigation.state === 'idle') {
          unsubscribe();
          resolve(undefined);
        }
      });
    }
  });
}