import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

/**
 * WarehousesModule provides warehouse management functionality including:
 * - Warehouse CRUD operations
 * - Stock queries per warehouse
 * - Default warehouse management
 *
 * This module depends on:
 * - PrismaModule (global) - for database access
 * - CommonModule (global) - for TenantContextService
 * - AuthModule - for guards and decorators (imported at app level)
 *
 * All endpoints are protected by JwtAuthGuard and RolesGuard.
 * Multi-tenant isolation is enforced through TenantContextService.
 */
@Module({
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
