import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { UserRole } from '@prisma/client';
import { CurrentUser } from './current-user.decorator';
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

describe('CurrentUser Decorator', () => {
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

  describe('when called without data parameter (full user)', () => {
    it('should return the full user object', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      const result = factory(undefined, ctx);

      expect(result).toEqual(testUser);
      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('role', UserRole.ADMIN);
      expect(result).toHaveProperty('tenantId', 'tenant-456');
    });

    it('should return undefined when user is not on request', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(undefined);

      const result = factory(undefined, ctx);

      expect(result).toBeUndefined();
    });

    it('should return null when user is explicitly null', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(null);

      const result = factory(undefined, ctx);

      expect(result).toBeNull();
    });
  });

  describe('when called with data parameter (specific property)', () => {
    it('should return userId when userId is requested', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      const result = factory('userId', ctx);

      expect(result).toBe('user-123');
    });

    it('should return email when email is requested', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      const result = factory('email', ctx);

      expect(result).toBe('test@example.com');
    });

    it('should return role when role is requested', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      const result = factory('role', ctx);

      expect(result).toBe(UserRole.ADMIN);
    });

    it('should return tenantId when tenantId is requested', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      const result = factory('tenantId', ctx);

      expect(result).toBe('tenant-456');
    });

    it('should return undefined when user is not on request and property is requested', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(undefined);

      const result = factory('userId', ctx);

      expect(result).toBeUndefined();
    });
  });

  describe('with different user roles', () => {
    const testCases = [
      { role: UserRole.SUPER_ADMIN, name: 'SUPER_ADMIN' },
      { role: UserRole.ADMIN, name: 'ADMIN' },
      { role: UserRole.MANAGER, name: 'MANAGER' },
      { role: UserRole.EMPLOYEE, name: 'EMPLOYEE' },
    ];

    testCases.forEach(({ role, name }) => {
      it(`should correctly return ${name} role`, () => {
        const factory = getParamDecoratorFactory(CurrentUser);
        const userWithRole: RequestUser = {
          ...testUser,
          role,
        };
        const ctx = createMockContext(userWithRole);

        const result = factory('role', ctx);

        expect(result).toBe(role);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle user with empty string values', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const userWithEmptyValues: RequestUser = {
        userId: '',
        email: '',
        role: UserRole.EMPLOYEE,
        tenantId: '',
      };
      const ctx = createMockContext(userWithEmptyValues);

      expect(factory('userId', ctx)).toBe('');
      expect(factory('email', ctx)).toBe('');
      expect(factory('tenantId', ctx)).toBe('');
    });

    it('should return the full object reference (not a copy)', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      const result1 = factory(undefined, ctx);
      const result2 = factory(undefined, ctx);

      // Both calls should return the same object reference
      expect(result1).toBe(result2);
    });

    it('should correctly access the HTTP request from context', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
      const ctx = createMockContext(testUser);

      factory(undefined, ctx);

      expect(ctx.switchToHttp).toHaveBeenCalled();
      expect(ctx.switchToHttp().getRequest).toHaveBeenCalled();
    });
  });

  describe('HTTP context switching', () => {
    it('should use switchToHttp to get the request', () => {
      const factory = getParamDecoratorFactory(CurrentUser);
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
      expect(result).toEqual(testUser);
    });
  });
});
