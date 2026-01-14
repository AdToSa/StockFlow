import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { authService } from '~/services/auth.service';
import { useAuthStore } from '~/stores/auth.store';
import type { User, Tenant } from '~/stores/auth.store';

// Mock dependencies
vi.mock('~/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('~/components/ui/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN',
  status: 'ACTIVE',
  tenantId: 'tenant-1',
};

const mockTenant: Tenant = {
  id: 'tenant-1',
  name: 'Test Company',
  slug: 'test-company',
  plan: 'PRO',
  status: 'ACTIVE',
};

const mockAuthResponse = {
  user: mockUser,
  tenant: mockTenant,
  accessToken: 'mock-token',
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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.setState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should return loading state initially', () => {
      vi.mocked(authService.getMe).mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should call getMe on mount', () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));

      renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(authService.getMe).toHaveBeenCalled();
    });
  });

  describe('login mutation', () => {
    it('should call authService.login with credentials', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.login({ email: 'test@example.com', password: 'password' });
      });

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        });
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.login({ email: 'test@example.com', password: 'password' });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should update auth store on successful login', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.login({ email: 'test@example.com', password: 'password' });
      });

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.tenant).toEqual(mockTenant);
      });
    });

    it('should set isLoggingIn to true during login', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      let resolveLogin: (value: typeof mockAuthResponse) => void;
      const loginPromise = new Promise<typeof mockAuthResponse>((resolve) => {
        resolveLogin = resolve;
      });
      vi.mocked(authService.login).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password' });
      });

      await waitFor(() => {
        expect(result.current.isLoggingIn).toBe(true);
      });

      await act(async () => {
        resolveLogin!(mockAuthResponse);
      });

      await waitFor(() => {
        expect(result.current.isLoggingIn).toBe(false);
      });
    });
  });

  describe('register mutation', () => {
    it('should call authService.register with user data', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.register).mockResolvedValue({ message: 'Success' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      await act(async () => {
        result.current.register(userData);
      });

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(userData);
      });
    });

    it('should navigate to login on successful registration', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.register).mockResolvedValue({ message: 'Success' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.register({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should set isRegistering during registration', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      let resolveRegister: () => void;
      const registerPromise = new Promise<{ message: string }>((resolve) => {
        resolveRegister = () => resolve({ message: 'Success' });
      });
      vi.mocked(authService.register).mockReturnValue(registerPromise);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.register({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
        });
      });

      await waitFor(() => {
        expect(result.current.isRegistering).toBe(true);
      });

      await act(async () => {
        resolveRegister!();
      });

      await waitFor(() => {
        expect(result.current.isRegistering).toBe(false);
      });
    });
  });

  describe('logout mutation', () => {
    it('should call authService.logout', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(mockAuthResponse);
      vi.mocked(authService.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });
    });

    it('should navigate to login on logout', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(mockAuthResponse);
      vi.mocked(authService.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should clear auth store on logout', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(mockAuthResponse);
      vi.mocked(authService.logout).mockResolvedValue();

      // Set up authenticated state
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setTenant(mockTenant);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.logout();
      });

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });
    });
  });

  describe('forgotPassword mutation', () => {
    it('should call authService.forgotPassword with email', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'Email sent' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.forgotPassword('forgot@example.com');
      });

      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalledWith('forgot@example.com');
      });
    });
  });

  describe('resetPassword mutation', () => {
    it('should call authService.resetPassword with token and password', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'Password reset' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.resetPassword({ token: 'reset-token', password: 'newPassword' });
      });

      await waitFor(() => {
        expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'newPassword');
      });
    });

    it('should navigate to login on successful reset', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'Password reset' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.resetPassword({ token: 'reset-token', password: 'newPassword' });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('authenticated user query', () => {
    it('should return user data when authenticated', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.tenant).toEqual(mockTenant);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return null user when not authenticated', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});