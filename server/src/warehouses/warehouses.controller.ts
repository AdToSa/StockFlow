import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { WarehousesService } from './warehouses.service';
import type {
  WarehouseResponse,
  WarehouseWithStockSummary,
  PaginatedWarehousesResponse,
  PaginatedWarehouseStockResponse,
} from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth';
import { Roles } from '../common/decorators';

/**
 * WarehousesController handles all warehouse management endpoints.
 *
 * All endpoints require JWT authentication.
 * Role-based access is enforced per endpoint:
 * - List warehouses: All authenticated roles
 * - View warehouse: All authenticated roles
 * - View warehouse stock: All authenticated roles
 * - Create warehouse: ADMIN only
 * - Update warehouse: ADMIN, MANAGER
 * - Delete warehouse: ADMIN only
 */
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  private readonly logger = new Logger(WarehousesController.name);

  constructor(private readonly warehousesService: WarehousesService) {}

  /**
   * Lists all warehouses in the current tenant with pagination.
   *
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   * @returns Paginated list of warehouses
   *
   * @example
   * GET /warehouses?page=1&limit=20
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedWarehousesResponse> {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '10', 10) || 10),
    );

    this.logger.log(
      `Listing warehouses - page: ${pageNum}, limit: ${limitNum}`,
    );

    return this.warehousesService.findAll(pageNum, limitNum);
  }

  /**
   * Gets a warehouse by ID with stock summary.
   *
   * @param id - Warehouse ID
   * @returns Warehouse data with stock summary
   *
   * @example
   * GET /warehouses/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WarehouseWithStockSummary> {
    this.logger.log(`Getting warehouse: ${id}`);

    return this.warehousesService.findOne(id);
  }

  /**
   * Lists products and their quantities in a specific warehouse.
   *
   * @param id - Warehouse ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   * @returns Paginated list of products with quantities
   *
   * @example
   * GET /warehouses/:id/stock?page=1&limit=20
   */
  @Get(':id/stock')
  async getStock(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedWarehouseStockResponse> {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '10', 10) || 10),
    );

    this.logger.log(
      `Getting stock for warehouse: ${id} - page: ${pageNum}, limit: ${limitNum}`,
    );

    return this.warehousesService.getStock(id, pageNum, limitNum);
  }

  /**
   * Creates a new warehouse in the tenant.
   * Only ADMIN users can create warehouses.
   * Respects tenant warehouse limits.
   *
   * @param dto - Warehouse creation data
   * @returns Created warehouse data
   *
   * @example
   * POST /warehouses
   * {
   *   "name": "Main Warehouse",
   *   "code": "WH-001",
   *   "address": "123 Industrial Ave",
   *   "isDefault": true
   * }
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWarehouseDto): Promise<WarehouseResponse> {
    this.logger.log(`Creating warehouse: ${dto.name}`);
    return this.warehousesService.create(dto);
  }

  /**
   * Updates a warehouse.
   * Only ADMIN and MANAGER users can update warehouses.
   *
   * @param id - Warehouse ID to update
   * @param dto - Update data
   * @returns Updated warehouse data
   *
   * @example
   * PATCH /warehouses/:id
   * {
   *   "name": "Updated Warehouse Name",
   *   "isDefault": true
   * }
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponse> {
    this.logger.log(`Updating warehouse: ${id}`);
    return this.warehousesService.update(id, dto);
  }

  /**
   * Deletes a warehouse.
   * Only ADMIN users can delete warehouses.
   * Deletion fails if the warehouse has any stock.
   *
   * @param id - Warehouse ID to delete
   *
   * @example
   * DELETE /warehouses/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting warehouse: ${id}`);
    return this.warehousesService.delete(id);
  }
}
