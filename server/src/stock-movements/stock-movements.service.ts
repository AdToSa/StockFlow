import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  StockMovement,
  MovementType,
  Prisma,
  Product,
  Warehouse,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma';
import { TenantContextService } from '../common';
import { CreateMovementDto, FilterMovementsDto } from './dto';

/**
 * Stock movement data returned in responses
 */
export interface StockMovementResponse {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string | null;
  userId: string | null;
  type: MovementType;
  quantity: number;
  reason: string | null;
  notes: string | null;
  invoiceId: string | null;
  createdAt: Date;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  warehouse?: {
    id: string;
    code: string;
    name: string;
  } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Paginated response for stock movement list endpoints
 */
export interface PaginatedMovementsResponse {
  data: StockMovementResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Stock movement with relations for internal use
 */
type MovementWithRelations = StockMovement & {
  product?: Pick<Product, 'id' | 'sku' | 'name'>;
  warehouse?: Pick<Warehouse, 'id' | 'code' | 'name'> | null;
  user?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
};

/**
 * StockMovementsService handles all stock movement operations including
 * listing movements with filtering, viewing individual movements,
 * and creating manual adjustments with multi-tenant isolation.
 *
 * Stock movement business rules:
 * 1. Manual movements can only be of type ADJUSTMENT
 * 2. Product must exist and belong to the current tenant
 * 3. Warehouse (if specified) must exist and belong to the current tenant
 * 4. Creating a movement updates the product stock
 * 5. Positive quantity adds to stock, negative subtracts from stock
 * 6. All operations are performed within transactions
 */
@Injectable()
export class StockMovementsService {
  private readonly logger = new Logger(StockMovementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Lists all stock movements within the current tenant with filtering and pagination.
   *
   * @param filters - Filter and pagination options
   * @returns Paginated list of stock movements
   */
  async findAll(
    filters: FilterMovementsDto = {},
  ): Promise<PaginatedMovementsResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const {
      page = 1,
      limit = 10,
      productId,
      warehouseId,
      type,
      fromDate,
      toDate,
    } = filters;
    const skip = (page - 1) * limit;

    this.logger.debug(
      `Listing stock movements for tenant ${tenantId}, page ${page}, limit ${limit}`,
    );

    // Build where clause
    const where: Prisma.StockMovementWhereInput = { tenantId };

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (type) {
      where.type = type;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      if (toDate) {
        where.createdAt.lte = toDate;
      }
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return this.buildPaginatedResponse(movements, total, page, limit);
  }

  /**
   * Finds a single stock movement by ID within the current tenant.
   * Includes product, warehouse, and user relations.
   *
   * @param id - Stock movement ID
   * @returns Stock movement data with relations
   * @throws NotFoundException if movement not found
   */
  async findOne(id: string): Promise<StockMovementResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(`Finding stock movement ${id} in tenant ${tenantId}`);

    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, tenantId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!movement) {
      this.logger.warn(`Stock movement not found: ${id}`);
      throw new NotFoundException('Movimiento de stock no encontrado');
    }

    return this.mapToMovementResponse(movement);
  }

  /**
   * Finds all stock movements for a specific product within the current tenant.
   *
   * @param productId - Product ID to get movements for
   * @param filters - Filter and pagination options
   * @returns Paginated list of movements for the product
   * @throws NotFoundException if product not found
   */
  async findByProduct(
    productId: string,
    filters: FilterMovementsDto = {},
  ): Promise<PaginatedMovementsResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(
      `Finding stock movements for product ${productId} in tenant ${tenantId}`,
    );

    // Verify product exists and belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      this.logger.warn(`Product not found: ${productId}`);
      throw new NotFoundException('Producto no encontrado');
    }

    // Use findAll with productId filter
    return this.findAll({ ...filters, productId });
  }

  /**
   * Finds all stock movements for a specific warehouse within the current tenant.
   *
   * @param warehouseId - Warehouse ID to get movements for
   * @param filters - Filter and pagination options
   * @returns Paginated list of movements for the warehouse
   * @throws NotFoundException if warehouse not found
   */
  async findByWarehouse(
    warehouseId: string,
    filters: FilterMovementsDto = {},
  ): Promise<PaginatedMovementsResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(
      `Finding stock movements for warehouse ${warehouseId} in tenant ${tenantId}`,
    );

    // Verify warehouse exists and belongs to tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
    });

    if (!warehouse) {
      this.logger.warn(`Warehouse not found: ${warehouseId}`);
      throw new NotFoundException('Almacen no encontrado');
    }

    // Use findAll with warehouseId filter
    return this.findAll({ ...filters, warehouseId });
  }

  /**
   * Creates a manual stock adjustment movement.
   *
   * Business logic:
   * 1. Only allows ADJUSTMENT type for manual creation
   * 2. Verify product exists and belongs to tenant
   * 3. Verify warehouse (if provided) exists and belongs to tenant
   * 4. Update product stock based on quantity
   * 5. Create StockMovement record
   * All operations are performed within a transaction.
   *
   * @param dto - Movement creation data
   * @param userId - ID of the user creating the movement (optional)
   * @returns Created stock movement data
   * @throws NotFoundException if product or warehouse not found
   * @throws BadRequestException if resulting stock would be negative
   */
  async create(
    dto: CreateMovementDto,
    userId?: string,
  ): Promise<StockMovementResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(
      `Creating stock adjustment for product ${dto.productId} in tenant ${tenantId}`,
    );

    // Verify product exists and belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });

    if (!product) {
      this.logger.warn(`Product not found: ${dto.productId}`);
      throw new NotFoundException('Producto no encontrado');
    }

    // Verify warehouse if provided
    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, tenantId },
      });

      if (!warehouse) {
        this.logger.warn(`Warehouse not found: ${dto.warehouseId}`);
        throw new NotFoundException('Almacen no encontrado');
      }
    }

    // Calculate new stock
    const newStock = product.stock + dto.quantity;

    // Verify stock won't go negative
    if (newStock < 0) {
      this.logger.warn(
        `Stock adjustment would result in negative stock: current ${product.stock}, adjustment ${dto.quantity}`,
      );
      throw new BadRequestException(
        `El ajuste resultaria en stock negativo. Stock actual: ${product.stock}, ajuste: ${dto.quantity}`,
      );
    }

    // Create movement and update stock within a transaction
    const movement = await this.prisma.$transaction(async (tx) => {
      // Update product stock
      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      // Create the movement record
      const newMovement = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          warehouseId: dto.warehouseId ?? null,
          userId: userId ?? null,
          type: MovementType.ADJUSTMENT,
          quantity: dto.quantity,
          reason: dto.reason,
          notes: dto.notes ?? null,
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return newMovement;
    });

    this.logger.log(
      `Stock adjustment created: ${movement.id} for product ${product.sku}, quantity: ${dto.quantity}, new stock: ${newStock}`,
    );

    return this.mapToMovementResponse(movement);
  }

  /**
   * Maps a StockMovement entity to a StockMovementResponse object.
   *
   * @param movement - The movement entity to map (with or without relations)
   * @returns StockMovementResponse object
   */
  private mapToMovementResponse(
    movement: MovementWithRelations,
  ): StockMovementResponse {
    const response: StockMovementResponse = {
      id: movement.id,
      tenantId: movement.tenantId,
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      userId: movement.userId,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      notes: movement.notes,
      invoiceId: movement.invoiceId,
      createdAt: movement.createdAt,
    };

    // Map product if included
    if (movement.product) {
      response.product = {
        id: movement.product.id,
        sku: movement.product.sku,
        name: movement.product.name,
      };
    }

    // Map warehouse if included
    if (movement.warehouse) {
      response.warehouse = {
        id: movement.warehouse.id,
        code: movement.warehouse.code,
        name: movement.warehouse.name,
      };
    }

    // Map user if included
    if (movement.user) {
      response.user = {
        id: movement.user.id,
        firstName: movement.user.firstName,
        lastName: movement.user.lastName,
      };
    }

    return response;
  }

  /**
   * Builds a paginated response from movements and pagination params.
   */
  private buildPaginatedResponse(
    movements: MovementWithRelations[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedMovementsResponse {
    return {
      data: movements.map((movement) => this.mapToMovementResponse(movement)),
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }
}
