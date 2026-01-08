import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { UserRole } from '@prisma/client';
import { CurrentTenant } from './current-tenant.decorator';
import { RequestUser } from '../../auth/types';

/**
 * Type for the factory function returned by parameter decorators.
 */
type ParamDecoratorFactory = (data: unknown, ctx: ExecutionContext) => unknown;

/**
 * Interface for NestJS parameter decorator metadata.
 */
interface ParamDecoratorMetadata {
  factory: ParamDecoratorFactory;
}

/**
 * Helper function to get the factory function for parameter decorators.
 * This mimics how NestJS internally retrieves decorator metadata.
 */
function getParamDecoratorFactory(
  decorator: () => ParameterDecorator,
): ParamDecoratorFactory {
  class TestClass {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    testMethod(@decorator() _value: unknown) {}
  }

  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestClass,
    'testMethod',
  ) as Record<string, ParamDecoratorMetadata>;

  const key = Object.keys(args)[0];
  return args[key].factory;
}

describe('CurrentTenant Decorator', () => {
  // Test user fixture
  const testUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    tenantId: 'tenant-456',
  };

  // Helper to create mock ExecutionContext
  const createMockContext = (user?: RequestUser | null): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
        getResponse: jest.fn().mockReturnValue({}),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  };

  describe('tenant ID extraction', () => {
    it('should return the tenant ID from the authenticated user', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const ctx = createMockContext(testUser);

      const result = factory(undefined, ctx);

      expect(result).toBe('tenant-456');
    });

    it('should return undefined when user is not on request', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const ctx = createMockContext(undefined);

      const result = factory(undefined, ctx);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user is null', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const ctx = createMockContext(null);

      const result = factory(undefined, ctx);

      expect(result).toBeUndefined();
    });
  });

  describe('with different tenant IDs', () => {
    const tenantIds = [
      'tenant-001',
      'org-abc-123',
      'cmp_xyz789',
      '00000000-0000-0000-0000-000000000001', // UUID format
      'a', // Single character
    ];

    tenantIds.forEach((tenantId) => {
      it(`should correctly return tenant ID: ${tenantId}`, () => {
        const factory = getParamDecoratorFactory(CurrentTenant);
        const userWithTenant: RequestUser = {
          ...testUser,
          tenantId,
        };
        const ctx = createMockContext(userWithTenant);

        const result = factory(undefined, ctx);

        expect(result).toBe(tenantId);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string tenant ID', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const userWithEmptyTenant: RequestUser = {
        ...testUser,
        tenantId: '',
      };
      const ctx = createMockContext(userWithEmptyTenant);

      const result = factory(undefined, ctx);

      expect(result).toBe('');
    });

    it('should ignore the data parameter (decorator takes no arguments)', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const ctx = createMockContext(testUser);

      // Even if data is passed, it should be ignored and return tenantId
      const result = factory('someIgnoredValue', ctx);

      expect(result).toBe('tenant-456');
    });

    it('should correctly access the HTTP request from context', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const ctx = createMockContext(testUser);

      factory(undefined, ctx);

      expect(ctx.switchToHttp).toHaveBeenCalled();
      expect(ctx.switchToHttp().getRequest).toHaveBeenCalled();
    });
  });

  describe('HTTP context switching', () => {
    it('should use switchToHttp to get the request', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const mockGetRequest = jest.fn().mockReturnValue({ user: testUser });
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
        getResponse: jest.fn(),
      });

      const ctx = {
        switchToHttp: mockSwitchToHttp,
      } as unknown as ExecutionContext;

      const result = factory(undefined, ctx);

      expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
      expect(mockGetRequest).toHaveBeenCalledTimes(1);
      expect(result).toBe('tenant-456');
    });
  });

  describe('with different user roles (tenant ID should be independent of role)', () => {
    const roles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.EMPLOYEE,
    ];

    roles.forEach((role) => {
      it(`should return tenant ID regardless of user role (${role})`, () => {
        const factory = getParamDecoratorFactory(CurrentTenant);
        const userWithRole: RequestUser = {
          ...testUser,
          role,
        };
        const ctx = createMockContext(userWithRole);

        const result = factory(undefined, ctx);

        expect(result).toBe('tenant-456');
      });
    });
  });

  describe('request structure variations', () => {
    it('should handle request with only user.tenantId defined', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const mockGetRequest = jest.fn().mockReturnValue({
        user: { tenantId: 'partial-tenant' },
      });
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      });

      const ctx = {
        switchToHttp: mockSwitchToHttp,
      } as unknown as ExecutionContext;

      const result = factory(undefined, ctx);

      expect(result).toBe('partial-tenant');
    });

    it('should return undefined when request has empty user object', () => {
      const factory = getParamDecoratorFactory(CurrentTenant);
      const mockGetRequest = jest.fn().mockReturnValue({
        user: {},
      });
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      });

      const ctx = {
        switchToHttp: mockSwitchToHttp,
      } as unknown as ExecutionContext;

      const result = factory(undefined, ctx);

      expect(result).toBeUndefined();
    });
  });
});
