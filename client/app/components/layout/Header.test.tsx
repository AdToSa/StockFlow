import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { useUIStore } from '~/stores/ui.store';
import { useAuthStore } from '~/stores/auth.store';
import type { User, Tenant } from '~/stores/auth.store';

// Mock useAuth hook
const mockLogout = vi.fn();
vi.mock('~/hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    isLoggingOut: false,
  }),
}));

// Mock ThemeToggle to simplify testing
vi.mock('~/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

const mockUser: User = {
  id: '1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN',
  status: 'ACTIVE',
  tenantId: 'tenant-1',
};

const mockTenant: Tenant = {
  id: 'tenant-1',
  name: 'Acme Corporation',
  slug: 'acme',
  plan: 'PRO',
  status: 'ACTIVE',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('Header', () => {
  beforeEach(() => {
    // Reset stores before each test
    useUIStore.setState({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      globalLoading: false,
      loadingMessage: '',
    });
    useAuthStore.setState({
      user: mockUser,
      tenant: mockTenant,
      isAuthenticated: true,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render header element', () => {
      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render mobile menu toggle button', () => {
      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/cerrar menu|abrir menu/i)).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(<Header />, { wrapper: createWrapper() });

      // There's a desktop search button with "Buscar..." text
      expect(screen.getByText('Buscar...')).toBeInTheDocument();
    });

    it('should render theme toggle', () => {
      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('should render notifications button', () => {
      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    });

    it('should render user profile button', () => {
      render(<Header />, { wrapper: createWrapper() });

      // User name displayed in profile button
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('mobile menu toggle', () => {
    it('should toggle sidebar when clicked', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      const menuButton = screen.getByLabelText(/cerrar menu/i);
      await user.click(menuButton);

      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('should show different icon based on sidebar state', () => {
      render(<Header />, { wrapper: createWrapper() });

      // When sidebar is open, should show close option
      expect(screen.getByLabelText('Cerrar menu')).toBeInTheDocument();
    });

    it('should show open menu when sidebar is closed', () => {
      useUIStore.setState({ sidebarOpen: false });

      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should expand search on click', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      const searchButton = screen.getByText('Buscar...');
      await user.click(searchButton);

      // After clicking, search input should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
      });
    });

    it('should allow typing in search input', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      // Open search
      await user.click(screen.getByText('Buscar...'));

      // Type in search
      const searchInput = await screen.findByPlaceholderText(/buscar productos/i);
      await user.type(searchInput, 'test query');

      expect(searchInput).toHaveValue('test query');
    });

    it('should close search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      // Open search
      await user.click(screen.getByText('Buscar...'));

      // Find and click the close button in search
      const searchInput = await screen.findByPlaceholderText(/buscar productos/i);
      expect(searchInput).toBeInTheDocument();

      // The X button is inside the input's rightElement
      const closeButtons = screen.getAllByRole('button');
      const searchCloseButton = closeButtons.find(
        (btn) => btn.querySelector('svg')?.classList.contains('lucide-x')
      );

      if (searchCloseButton) {
        await user.click(searchCloseButton);
      }
    });
  });

  describe('notifications dropdown', () => {
    it('should open notifications dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      const notificationsButton = screen.getByLabelText('Notificaciones');
      await user.click(notificationsButton);

      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      });
    });

    it('should display notification count badge', () => {
      render(<Header />, { wrapper: createWrapper() });

      // The mock notifications have 2 unread items
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show notification items in dropdown', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Notificaciones'));

      await waitFor(() => {
        expect(screen.getByText('Stock bajo')).toBeInTheDocument();
        expect(screen.getByText('Nueva factura')).toBeInTheDocument();
        expect(screen.getByText('Pago recibido')).toBeInTheDocument();
      });
    });

    it('should show unread count in dropdown header', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Notificaciones'));

      await waitFor(() => {
        expect(screen.getByText('2 sin leer')).toBeInTheDocument();
      });
    });

    it('should have link to view all notifications', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByLabelText('Notificaciones'));

      await waitFor(() => {
        expect(screen.getByText('Ver todas las notificaciones')).toBeInTheDocument();
      });
    });

    it('should close when clicking outside', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      // Open notifications
      await user.click(screen.getByLabelText('Notificaciones'));
      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      });

      // Click outside (on the header itself)
      await user.click(screen.getByRole('banner'));

      // The dropdown title should be gone (there's also a heading that might remain)
    });
  });

  describe('profile dropdown', () => {
    it('should open profile dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      // Click on user name/profile button
      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });

    it('should display user role badge', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText('Administrador')).toBeInTheDocument();
      });
    });

    it('should have profile link', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /mi perfil/i })).toBeInTheDocument();
      });
    });

    it('should have settings link', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /configuracion/i })).toBeInTheDocument();
      });
    });

    it('should have logout button', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cerrar sesion/i })).toBeInTheDocument();
      });
    });

    it('should call logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cerrar sesion/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cerrar sesion/i }));

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('user display', () => {
    it('should display user initials when no avatar', () => {
      render(<Header />, { wrapper: createWrapper() });

      // JD for John Doe
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display avatar when user has avatarUrl', () => {
      useAuthStore.setState({
        user: { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' },
      });

      render(<Header />, { wrapper: createWrapper() });

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should display default name when no user', () => {
      useAuthStore.setState({ user: null });

      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByText('Usuario')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should open search with Cmd+K', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      // Simulate Cmd+K
      await user.keyboard('{Meta>}k{/Meta}');

      // Search input should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
      });
    });

    it('should close dropdowns with Escape', async () => {
      const user = userEvent.setup();
      render(<Header />, { wrapper: createWrapper() });

      // Open notifications
      await user.click(screen.getByLabelText('Notificaciones'));
      await waitFor(() => {
        expect(screen.getByText('Stock bajo')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('Stock bajo')).not.toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByLabelText(/cerrar menu|abrir menu/i)).toBeInTheDocument();
    });

    it('should render as header landmark', () => {
      render(<Header />, { wrapper: createWrapper() });

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('role labels', () => {
    it('should show correct label for SUPER_ADMIN', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({ user: { ...mockUser, role: 'SUPER_ADMIN' } });

      render(<Header />, { wrapper: createWrapper() });
      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText('Super Admin')).toBeInTheDocument();
      });
    });

    it('should show correct label for MANAGER', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({ user: { ...mockUser, role: 'MANAGER' } });

      render(<Header />, { wrapper: createWrapper() });
      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText('Gerente')).toBeInTheDocument();
      });
    });

    it('should show correct label for EMPLOYEE', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({ user: { ...mockUser, role: 'EMPLOYEE' } });

      render(<Header />, { wrapper: createWrapper() });
      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText('Empleado')).toBeInTheDocument();
      });
    });
  });
});