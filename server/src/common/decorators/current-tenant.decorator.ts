import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../auth/types';

/**
 * Parameter decorator to extract the current tenant ID from the authenticated user.
 *
 * This is a convenience decorator that provides a shorthand for accessing
 * the tenant ID from the authenticated user. It's particularly useful in
 * multi-tenant applications where most service methods require the tenant ID
 * for data isolation.
 *
 * The tenant ID is extracted from the user object that was attached to the
 * request by the JWT authentication strategy after successful token validation.
 *
 * @returns The tenant ID string, or undefined if no user is authenticated
 *
 * @example
 * // Use in a controller to get tenant-scoped data
 * @Get('products')
 * @UseGuards(JwtAuthGuard)
 * async findProducts(@CurrentTenant() tenantId: string) {
 *   return this.productsService.findAll(tenantId);
 * }
 *
 * @example
 * // Combine with other decorators
 * @Post('orders')
 * @UseGuards(JwtAuthGuard)
 * async createOrder(
 *   @CurrentTenant() tenantId: string,
 *   @CurrentUser('userId') userId: string,
 *   @Body() createOrderDto: CreateOrderDto,
 * ) {
 *   return this.ordersService.create(tenantId, userId, createOrderDto);
 * }
 *
 * @example
 * // Use in repository operations
 * @Get('inventory')
 * @UseGuards(JwtAuthGuard)
 * async getInventory(@CurrentTenant() tenantId: string) {
 *   return this.inventoryService.findByTenant(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    return request.user?.tenantId;
  },
);
