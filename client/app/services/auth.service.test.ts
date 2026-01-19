import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from './auth.service';
import {
  api,
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
} from '~/lib/api';
import type { User, Tenant } from '~/stores/auth.store';

// Mock the api module
vi.mock('~/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
}));

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
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('should call api.post with correct endpoint and credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockAuthResponse });

      await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
    });

    it('should set access token on successful login', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockAuthResponse });

      await authService.login(credentials);

      expect(setAccessToken).toHaveBeenCalledWith('mock-access-token');
    });

    it('should set refresh token on successful login', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockAuthResponse });

      await authService.login(credentials);

      expect(setRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
    });

    it('should return auth response on successful login', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authService.login(credentials);

      expect(result).toEqual(mockAuthResponse);
    });

    it('should propagate error on failed login', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const error = new Error('Invalid credentials');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should call api.post with correct endpoint and user data', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        tenantName: 'New Company',
      };
      const mockResponse = { message: 'Registration successful' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
    });

    it('should return success message on successful registration', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const mockResponse = { message: 'Registration successful' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.register(userData);

      expect(result).toEqual(mockResponse);
    });

    it('should propagate error on failed registration', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const error = new Error('Email already exists');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should call api.post to logout endpoint with refresh token', async () => {
      vi.mocked(getRefreshToken).mockReturnValue('stored-refresh-token');
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'stored-refresh-token',
      });
    });

    it('should clear access token on successful logout', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(setAccessToken).toHaveBeenCalledWith(null);
    });

    it('should clear refresh token on successful logout', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(setRefreshToken).toHaveBeenCalledWith(null);
    });

    it('should clear tokens even if api call fails', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

      // The error is still thrown after finally runs, but tokens should be cleared
      await expect(authService.logout()).rejects.toThrow('Network error');

      expect(setAccessToken).toHaveBeenCalledWith(null);
      expect(setRefreshToken).toHaveBeenCalledWith(null);
    });
  });

  describe('getMe', () => {
    it('should call api.get with correct endpoint', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAuthResponse });

      await authService.getMe();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });

    it('should set access token from response', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAuthResponse });

      await authService.getMe();

      expect(setAccessToken).toHaveBeenCalledWith('mock-access-token');
    });

    it('should return auth response', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authService.getMe();

      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refreshToken', () => {
    it('should call api.post with correct endpoint', async () => {
      const mockResponse = { accessToken: 'new-access-token' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await authService.refreshToken();

      expect(api.post).toHaveBeenCalledWith('/auth/refresh');
    });

    it('should set new access token', async () => {
      const mockResponse = { accessToken: 'new-access-token' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await authService.refreshToken();

      expect(setAccessToken).toHaveBeenCalledWith('new-access-token');
    });

    it('should return response with new token', async () => {
      const mockResponse = { accessToken: 'new-access-token' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.refreshToken();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should call api.post with email', async () => {
      const email = 'forgot@example.com';
      const mockResponse = { message: 'Email sent' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await authService.forgotPassword(email);

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email });
    });

    it('should return success message', async () => {
      const mockResponse = { message: 'Email sent' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.forgotPassword('test@example.com');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should call api.post with token and new password', async () => {
      const token = 'reset-token-123';
      const password = 'newPassword123';
      const mockResponse = { message: 'Password reset successful' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await authService.resetPassword(token, password);

      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token,
        password,
      });
    });

    it('should return success message', async () => {
      const mockResponse = { message: 'Password reset successful' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.resetPassword('token', 'newPass');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should call api.post with current and new password', async () => {
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword456';
      const mockResponse = { message: 'Password changed' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await authService.changePassword(currentPassword, newPassword);

      expect(api.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    });

    it('should return success message', async () => {
      const mockResponse = { message: 'Password changed' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.changePassword('old', 'new');

      expect(result).toEqual(mockResponse);
    });

    it('should propagate error when current password is wrong', async () => {
      const error = new Error('Current password is incorrect');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(
        authService.changePassword('wrong', 'new')
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});