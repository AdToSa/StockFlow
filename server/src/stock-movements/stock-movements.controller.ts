import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StockMovementsService } from './stock-movements.service';
import type {
  StockMovementResponse,
  PaginatedMovementsResponse,
} from './stock-movements.service';
import { CreateMovementDto, FilterMovementsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth';
import { Roles, CurrentUser } from '../common/decorators';

/**
 * StockMovementsController handles all stock movement management endpoints.
 *
 * All endpoints require JWT authentication.
 * Role-based access is enforced per endpoint:
 * - List movements: All authenticated roles
 * - View movement: All authenticated roles
 * - Create adjustment: ADMIN, MANAGER
 * - Product movements: All authenticated roles
 * - Warehouse movements: All authenticated roles
 */
@Controller('stock-movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockMovementsController {
  private readonly logger = new Logger(StockMovementsController.name);

  constructor(private readonly stockMovementsService: StockMovementsService) {}

  /**
   * Lists all stock movements in the current tenant with filtering and pagination.
   *
   * @param filters - Filter and pagination parameters
   * @returns Paginated list of stock movements
   *
   * @example
   * GET /stock-movements?page=1&limit=20&type=ADJUSTMENT&productId=uuid
   */
  @Get()
  async findAll(
    @Query() filters: FilterMovementsDto,
  ): Promise<PaginatedMovementsResponse> {
    this.logger.log(
      `Listing stock movements - page: ${filters.page ?? 1}, limit: ${filters.limit ?? 10}`,
    );

    return this.stockMovementsService.findAll(filters);
  }

  /**
   * Gets a stock movement by ID.
   * Includes product, warehouse, and user relations.
   *
   * @param id - Stock movement ID
   * @returns Stock movement data with all relations
   *
   * @example
   * GET /stock-movements/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StockMovementResponse> {
    this.logger.log(`Getting stock movement: ${id}`);

    return this.stockMovementsService.findOne(id);
  }

  /**
   * Creates a manual stock adjustment movement.
   * Only ADMIN and MANAGER users can create adjustments.
   *
   * Business logic:
   * - Only allows ADJUSTMENT type for manual creation
   * - Validates product exists and belongs to tenant
   * - Validates warehouse (if provided) exists and belongs to tenant
   * - Updates product stock based on quantity
   * - Creates movement record with the requesting user
   *
   * @param dto - Movement creation data
   * @param userId - ID of the authenticated user (from JWT)
   * @returns Created stock movement data
   *
   * @example
   * POST /stock-movements
   * {
   *   "productId": "clxxxxxxxxxxxxxxxxxxxxxxxxx",
   *   "warehouseId": "clxxxxxxxxxxxxxxxxxxxxxxxxx",
   *   "quantity": 10,
   *   "reason": "Inventory count correction",
   *   "notes": "Found extra units during audit"
   * }
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMovementDto,
    @CurrentUser('userId') userId: string,
  ): Promise<StockMovementResponse> {
    this.logger.log(
      `Creating stock adjustment for product ${dto.productId}, quantity: ${dto.quantity}`,
    );

    return this.stockMovementsService.create(dto, userId);
  }
}

/**
 * ProductMovementsController handles stock movement endpoints scoped to a product.
 *
 * All endpoints require JWT authentication.
 * All authenticated roles can access these endpoints.
 */
@Controller('products/:productId/movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductMovementsController {
  private readonly logger = new Logger(ProductMovementsController.name);

  constructor(private readonly stockMovementsService: StockMovementsService) {}

  /**
   * Gets all stock movements for a specific product.
   * Useful for viewing product inventory history.
   *
   * @param productId - Product ID
   * @param filters - Filter and pagination parameters
   * @returns Paginated list of movements for the product
   *
   * @example
   * GET /products/:productId/movements?page=1&limit=20&type=SALE
   */
  @Get()
  async findByProduct(
    @Param('productId') productId: string,
    @Query() filters: FilterMovementsDto,
  ): Promise<PaginatedMovementsResponse> {
    this.logger.log(
      `Listing stock movements for product ${productId} - page: ${filters.page ?? 1}, limit: ${filters.limit ?? 10}`,
    );

    return this.stockMovementsService.findByProduct(productId, filters);
  }
}

/**
 * WarehouseMovementsController handles stock movement endpoints scoped to a warehouse.
 *
 * All endpoints require JWT authentication.
 * All authenticated roles can access these endpoints.
 */
@Controller('warehouses/:warehouseId/movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseMovementsController {
  private readonly logger = new Logger(WarehouseMovementsController.name);

  constructor(private readonly stockMovementsService: StockMovementsService) {}

  /**
   * Gets all stock movements for a specific warehouse.
   * Useful for viewing warehouse inventory activity.
   *
   * @param warehouseId - Warehouse ID
   * @param filters - Filter and pagination parameters
   * @returns Paginated list of movements for the warehouse
   *
   * @example
   * GET /warehouses/:warehouseId/movements?page=1&limit=20&type=TRANSFER
   */
  @Get()
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query() filters: FilterMovementsDto,
  ): Promise<PaginatedMovementsResponse> {
    this.logger.log(
      `Listing stock movements for warehouse ${warehouseId} - page: ${filters.page ?? 1}, limit: ${filters.limit ?? 10}`,
    );

    return this.stockMovementsService.findByWarehouse(warehouseId, filters);
  }
}
