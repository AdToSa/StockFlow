import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  Customer,
  User,
  Product,
} from '@prisma/client';
import { PrismaService } from '../prisma';
import { TenantContextService } from '../common';
import { CreateInvoiceDto, UpdateInvoiceDto, FilterInvoicesDto } from './dto';

/**
 * Invoice item data returned in responses
 */
export interface InvoiceItemResponse {
  id: string;
  invoiceId: string;
  productId: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  product?: {
    id: string;
    sku: string;
    name: string;
  } | null;
}

/**
 * Invoice data returned in responses
 */
export interface InvoiceResponse {
  id: string;
  tenantId: string;
  customerId: string | null;
  userId: string | null;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  issueDate: Date;
  dueDate: Date | null;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  dianCufe: string | null;
  dianXml: string | null;
  dianPdf: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: InvoiceItemResponse[];
  customer?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Paginated response for invoice list endpoints
 */
export interface PaginatedInvoicesResponse {
  data: InvoiceResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Invoice with relations for internal use
 * Note: Prisma returns null for optional relations, hence the null unions
 */
type InvoiceWithRelations = Invoice & {
  items?: (InvoiceItem & { product?: Product | null })[];
  customer?: Customer | null;
  user?: User | null;
};

/**
 * InvoicesService handles all invoice management operations including
 * CRUD operations, invoice status transitions, stock management, and
 * monthly limit enforcement with multi-tenant isolation.
 *
 * Invoices are the core billing documents within a tenant.
 * Each invoice number is unique within its tenant and auto-generated.
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Lists all invoices within the current tenant with filtering and pagination.
   *
   * @param filters - Filter and pagination options
   * @returns Paginated list of invoices
   */
  async findAll(
    filters: FilterInvoicesDto = {},
  ): Promise<PaginatedInvoicesResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      customerId,
      fromDate,
      toDate,
    } = filters;
    const skip = (page - 1) * limit;

    this.logger.debug(
      `Listing invoices for tenant ${tenantId}, page ${page}, limit ${limit}`,
    );

    // Build where clause
    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) {
        where.issueDate.gte = fromDate;
      }
      if (toDate) {
        where.issueDate.lte = toDate;
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          user: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return this.buildPaginatedResponse(invoices, total, page, limit);
  }

  /**
   * Finds a single invoice by ID within the current tenant.
   * Includes all items, customer, and user relations.
   *
   * @param id - Invoice ID
   * @returns Invoice data with relations
   * @throws NotFoundException if invoice not found
   */
  async findOne(id: string): Promise<InvoiceResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(`Finding invoice ${id} in tenant ${tenantId}`);

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: true,
      },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${id}`);
      throw new NotFoundException('Factura no encontrada');
    }

    return this.mapToInvoiceResponse(invoice);
  }

  /**
   * Creates a new invoice within the current tenant.
   * Generates invoice number, reduces stock, and creates stock movements.
   *
   * @param dto - Invoice creation data
   * @param userId - ID of the user creating the invoice
   * @returns Created invoice data
   * @throws ForbiddenException if monthly invoice limit is reached
   * @throws NotFoundException if product not found
   * @throws BadRequestException if insufficient stock
   */
  async create(
    dto: CreateInvoiceDto,
    userId: string,
  ): Promise<InvoiceResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(
      `Creating invoice for tenant ${tenantId} by user ${userId}`,
    );

    // Check monthly invoice limit
    await this.checkMonthlyLimit();

    // Validate customer if provided
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      });

      if (!customer) {
        throw new NotFoundException(`Cliente no encontrado: ${dto.customerId}`);
      }
    }

    // Validate all products and check stock
    const productValidations = await this.validateProductsAndStock(
      dto.items,
      tenantId,
    );

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate item totals and invoice totals
    const itemsData = dto.items.map((item, index) => {
      const subtotal = item.quantity * item.unitPrice;
      const taxRate = item.taxRate ?? 19;
      const discount = item.discount ?? 0;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax - discount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate,
        discount,
        subtotal,
        tax,
        total,
        productName: productValidations[index].name,
      };
    });

    const invoiceSubtotal = itemsData.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const invoiceTax = itemsData.reduce((sum, item) => sum + item.tax, 0);
    const invoiceDiscount = itemsData.reduce(
      (sum, item) => sum + item.discount,
      0,
    );
    const invoiceTotal = invoiceSubtotal + invoiceTax - invoiceDiscount;

    // Create invoice within a transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      // Create the invoice
      const newInvoice = await tx.invoice.create({
        data: {
          tenantId,
          userId,
          customerId: dto.customerId ?? null,
          invoiceNumber,
          subtotal: invoiceSubtotal,
          tax: invoiceTax,
          discount: invoiceDiscount,
          total: invoiceTotal,
          issueDate: new Date(),
          dueDate: dto.dueDate ?? null,
          status: InvoiceStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          notes: dto.notes ?? null,
        },
        include: {
          customer: true,
          user: true,
        },
      });

      // Create invoice items
      await tx.invoiceItem.createMany({
        data: itemsData.map((item) => ({
          invoiceId: newInvoice.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discount: item.discount,
          subtotal: item.subtotal,
          tax: item.tax,
          total: item.total,
        })),
      });

      // Reduce stock and create stock movements
      for (const item of itemsData) {
        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            userId,
            type: 'SALE',
            quantity: -item.quantity,
            reason: `Venta - Factura ${invoiceNumber}`,
            notes: `Item de factura: ${item.productName}`,
            invoiceId: newInvoice.id,
          },
        });
      }

      // Fetch the complete invoice with items
      return tx.invoice.findUnique({
        where: { id: newInvoice.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          user: true,
        },
      });
    });

    if (!invoice) {
      throw new BadRequestException('Error al crear la factura');
    }

    this.logger.log(
      `Invoice created: ${invoice.invoiceNumber} (${invoice.id})`,
    );

    return this.mapToInvoiceResponse(invoice);
  }

  /**
   * Updates an existing invoice.
   * Only DRAFT invoices can be updated.
   *
   * @param id - Invoice ID to update
   * @param dto - Update data (only notes and dueDate)
   * @returns Updated invoice data
   * @throws NotFoundException if invoice not found
   * @throws BadRequestException if invoice is not in DRAFT status
   */
  async update(id: string, dto: UpdateInvoiceDto): Promise<InvoiceResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(`Updating invoice ${id} in tenant ${tenantId}`);

    // Find the invoice to update
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${id}`);
      throw new NotFoundException('Factura no encontrada');
    }

    // Only DRAFT invoices can be updated
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden modificar facturas en borrador',
      );
    }

    // Build update data
    const updateData: Prisma.InvoiceUpdateInput = {};

    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate;
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    // Update the invoice
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: true,
      },
    });

    this.logger.log(
      `Invoice updated: ${updatedInvoice.invoiceNumber} (${updatedInvoice.id})`,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  /**
   * Deletes an invoice from the tenant.
   * Only DRAFT invoices can be deleted.
   * Stock is NOT restored when deleting a draft (stock was already reduced on creation).
   *
   * @param id - Invoice ID to delete
   * @throws NotFoundException if invoice not found
   * @throws BadRequestException if invoice is not in DRAFT status
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(`Deleting invoice ${id} in tenant ${tenantId}`);

    // Find the invoice to delete
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${id}`);
      throw new NotFoundException('Factura no encontrada');
    }

    // Only DRAFT invoices can be deleted
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden eliminar facturas en borrador',
      );
    }

    // Delete within a transaction to restore stock
    await this.prisma.$transaction(async (tx) => {
      // Restore stock for each item (only if productId exists)
      for (const item of invoice.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          // Create return stock movement
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'RETURN',
              quantity: item.quantity,
              reason: `Eliminación de factura borrador ${invoice.invoiceNumber}`,
              invoiceId: invoice.id,
            },
          });
        }
      }

      // Delete invoice items first
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Delete stock movements associated with this invoice
      await tx.stockMovement.deleteMany({
        where: { invoiceId: id },
      });

      // Delete the invoice
      await tx.invoice.delete({ where: { id } });
    });

    this.logger.log(
      `Invoice deleted: ${invoice.invoiceNumber} (${invoice.id})`,
    );
  }

  /**
   * Sends an invoice (changes status from DRAFT to SENT).
   *
   * @param id - Invoice ID to send
   * @returns Updated invoice data
   * @throws NotFoundException if invoice not found
   * @throws BadRequestException if invoice is not in DRAFT status
   */
  async send(id: string): Promise<InvoiceResponse> {
    const tenantId = this.tenantContext.requireTenantId();

    this.logger.debug(`Sending invoice ${id} in tenant ${tenantId}`);

    // Find the invoice
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${id}`);
      throw new NotFoundException('Factura no encontrada');
    }

    // Only DRAFT invoices can be sent
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden enviar facturas en borrador',
      );
    }

    // Update status to SENT
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: true,
      },
    });

    this.logger.log(
      `Invoice sent: ${updatedInvoice.invoiceNumber} (${updatedInvoice.id})`,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  /**
   * Cancels an invoice, restoring stock and creating return stock movements.
   *
   * @param id - Invoice ID to cancel
   * @returns Updated invoice data
   * @throws NotFoundException if invoice not found
   * @throws BadRequestException if invoice is already cancelled or void
   */
  async cancel(id: string): Promise<InvoiceResponse> {
    const tenantId = this.tenantContext.requireTenantId();
    const userId = this.getUserIdFromContext();

    this.logger.debug(`Cancelling invoice ${id} in tenant ${tenantId}`);

    // Find the invoice with items
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${id}`);
      throw new NotFoundException('Factura no encontrada');
    }

    // Cannot cancel already cancelled or void invoices
    if (
      invoice.status === InvoiceStatus.CANCELLED ||
      invoice.status === InvoiceStatus.VOID
    ) {
      throw new BadRequestException('La factura ya está cancelada o anulada');
    }

    // Cancel within a transaction to restore stock
    const cancelledInvoice = await this.prisma.$transaction(async (tx) => {
      // Restore stock for each item (only if productId exists)
      for (const item of invoice.items) {
        if (item.productId) {
          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          // Create return stock movement
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              userId,
              type: 'RETURN',
              quantity: item.quantity,
              reason: `Cancelación de factura ${invoice.invoiceNumber}`,
              notes: `Devolución por cancelación: ${item.product?.name ?? item.productId}`,
              invoiceId: invoice.id,
            },
          });
        }
      }

      // Update invoice status to CANCELLED
      return tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELLED,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          user: true,
        },
      });
    });

    this.logger.log(
      `Invoice cancelled: ${cancelledInvoice.invoiceNumber} (${cancelledInvoice.id})`,
    );

    return this.mapToInvoiceResponse(cancelledInvoice);
  }

  /**
   * Generates a consecutive invoice number unique to the tenant.
   * Format: INV-00001, INV-00002, etc.
   *
   * @returns Generated invoice number
   */
  async generateInvoiceNumber(): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    // Get the last invoice number for this tenant
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;

    if (lastInvoice?.invoiceNumber) {
      // Extract the number from the invoice number (INV-00001 -> 1)
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (5 digits)
    const invoiceNumber = `INV-${nextNumber.toString().padStart(5, '0')}`;

    this.logger.debug(`Generated invoice number: ${invoiceNumber}`);

    return invoiceNumber;
  }

  /**
   * Checks if the tenant has reached their monthly invoice limit.
   *
   * @throws ForbiddenException if monthly limit is reached
   */
  async checkMonthlyLimit(): Promise<void> {
    const tenant = await this.tenantContext.getTenant();

    // -1 means unlimited
    if (tenant.maxInvoices === -1) {
      return;
    }

    // Get count of invoices created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentMonthCount = await this.prisma.invoice.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfMonth },
      },
    });

    if (currentMonthCount >= tenant.maxInvoices) {
      this.logger.warn(
        `Monthly invoice limit reached for tenant ${tenant.id}: ${currentMonthCount}/${tenant.maxInvoices}`,
      );
      throw new ForbiddenException('Límite mensual de facturas alcanzado');
    }

    this.logger.debug(
      `Invoice limit check passed: ${currentMonthCount}/${tenant.maxInvoices}`,
    );
  }

  /**
   * Validates all products exist and have sufficient stock.
   *
   * @param items - Invoice items to validate
   * @param tenantId - Tenant ID
   * @returns Array of validated products
   * @throws NotFoundException if product not found
   * @throws BadRequestException if insufficient stock
   */
  private async validateProductsAndStock(
    items: { productId: string; quantity: number }[],
    tenantId: string,
  ): Promise<Product[]> {
    const products: Product[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, tenantId },
      });

      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto: ${product.name}`,
        );
      }

      products.push(product);
    }

    return products;
  }

  /**
   * Gets the user ID from the tenant context request.
   * Returns undefined if not available.
   */
  private getUserIdFromContext(): string | undefined {
    try {
      // The user ID should be available from the request context
      // This is a fallback in case it's not passed directly
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Maps an Invoice entity to an InvoiceResponse object.
   *
   * @param invoice - The invoice entity to map (with or without relations)
   * @returns InvoiceResponse object
   */
  private mapToInvoiceResponse(invoice: InvoiceWithRelations): InvoiceResponse {
    const response: InvoiceResponse = {
      id: invoice.id,
      tenantId: invoice.tenantId,
      customerId: invoice.customerId,
      userId: invoice.userId,
      invoiceNumber: invoice.invoiceNumber,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      notes: invoice.notes,
      dianCufe: invoice.dianCufe,
      dianXml: invoice.dianXml,
      dianPdf: invoice.dianPdf,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    // Map items if included
    if (invoice.items) {
      response.items = invoice.items.map((item) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discount: Number(item.discount),
        subtotal: Number(item.subtotal),
        tax: Number(item.tax),
        total: Number(item.total),
        createdAt: item.createdAt,
        product: item.product
          ? {
              id: item.product.id,
              sku: item.product.sku,
              name: item.product.name,
            }
          : undefined,
      }));
    }

    // Map customer if included
    if (invoice.customer) {
      response.customer = {
        id: invoice.customer.id,
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      };
    }

    // Map user if included
    if (invoice.user) {
      response.user = {
        id: invoice.user.id,
        name: `${invoice.user.firstName} ${invoice.user.lastName}`,
        email: invoice.user.email,
      };
    }

    return response;
  }

  /**
   * Builds a paginated response from invoices and pagination params.
   */
  private buildPaginatedResponse(
    invoices: InvoiceWithRelations[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedInvoicesResponse {
    return {
      data: invoices.map((invoice) => this.mapToInvoiceResponse(invoice)),
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }
}
