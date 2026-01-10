import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from './payments.service';
import type {
  PaymentResponse,
  PaginatedPaymentsResponse,
} from './payments.service';
import { CreatePaymentDto, FilterPaymentsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth';
import { Roles } from '../common/decorators';

/**
 * PaymentsController handles all payment management endpoints.
 *
 * All endpoints require JWT authentication.
 * Role-based access is enforced per endpoint:
 * - List payments: All authenticated roles
 * - View payment: All authenticated roles
 * - Record payment: ADMIN, MANAGER
 * - Delete payment: ADMIN only
 */
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Lists all payments in the current tenant with filtering and pagination.
   *
   * @param filters - Filter and pagination parameters
   * @returns Paginated list of payments
   *
   * @example
   * GET /payments?page=1&limit=20&method=CASH&invoiceId=uuid
   */
  @Get()
  async findAll(
    @Query() filters: FilterPaymentsDto,
  ): Promise<PaginatedPaymentsResponse> {
    this.logger.log(
      `Listing payments - page: ${filters.page ?? 1}, limit: ${filters.limit ?? 10}`,
    );

    return this.paymentsService.findAll(filters);
  }

  /**
   * Gets a payment by ID.
   * Includes invoice and customer relations.
   *
   * @param id - Payment ID
   * @returns Payment data with all relations
   *
   * @example
   * GET /payments/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentResponse> {
    this.logger.log(`Getting payment: ${id}`);

    return this.paymentsService.findOne(id);
  }

  /**
   * Records a new payment against an invoice.
   * Only ADMIN and MANAGER users can record payments.
   *
   * Business logic:
   * - Validates invoice exists and belongs to tenant
   * - Verifies payment doesn't exceed remaining balance
   * - Creates payment record
   * - Updates invoice paymentStatus automatically
   *
   * @param dto - Payment creation data
   * @returns Created payment data
   *
   * @example
   * POST /payments
   * {
   *   "invoiceId": "550e8400-e29b-41d4-a716-446655440000",
   *   "amount": 150.50,
   *   "method": "CASH",
   *   "reference": "REC-001",
   *   "notes": "Partial payment"
   * }
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePaymentDto): Promise<PaymentResponse> {
    this.logger.log(
      `Recording payment for invoice ${dto.invoiceId}, amount: ${dto.amount}`,
    );

    return this.paymentsService.create(dto);
  }

  /**
   * Deletes a payment.
   * Only ADMIN users can delete payments.
   * Recalculates and updates invoice payment status after deletion.
   *
   * @param id - Payment ID to delete
   *
   * @example
   * DELETE /payments/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting payment: ${id}`);

    return this.paymentsService.delete(id);
  }
}
