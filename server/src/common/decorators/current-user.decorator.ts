import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../auth/types';

/**
 * Parameter decorator to extract the current authenticated user from the request.
 *
 * This decorator retrieves the user object that was attached to the request
 * by the JWT authentication strategy after successful token validation.
 *
 * Can be used in two ways:
 * 1. Without arguments - returns the full RequestUser object
 * 2. With a property key - returns only that specific property value
 *
 * @param data - Optional property key from RequestUser to extract
 * @returns The full user object or a specific property value
 *
 * @example
 * // Get the full user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: RequestUser) {
 *   return user;
 * }
 *
 * @example
 * // Get only the user ID
 * @Get('my-id')
 * @UseGuards(JwtAuthGuard)
 * async getMyId(@CurrentUser('userId') userId: string) {
 *   return { userId };
 * }
 *
 * @example
 * // Get only the tenant ID
 * @Get('my-tenant')
 * @UseGuards(JwtAuthGuard)
 * async getMyTenant(@CurrentUser('tenantId') tenantId: string) {
 *   return { tenantId };
 * }
 *
 * @example
 * // Get the user's email
 * @Get('my-email')
 * @UseGuards(JwtAuthGuard)
 * async getMyEmail(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 *
 * @example
 * // Get the user's role
 * @Get('my-role')
 * @UseGuards(JwtAuthGuard)
 * async getMyRole(@CurrentUser('role') role: UserRole) {
 *   return { role };
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    // If a specific property is requested, return only that property
    // Otherwise, return the full user object
    return data ? user?.[data] : user;
  },
);
