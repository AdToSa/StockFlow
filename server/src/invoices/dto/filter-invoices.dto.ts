import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

/**
 * Data transfer object for filtering and paginating invoices.
 * Extends PaginationDto for page-based pagination support.
 */
export class FilterInvoicesDto extends PaginationDto {
  /**
   * Filter by invoice status
   * @example "SENT"
   */
  @IsEnum(InvoiceStatus, {
    message:
      'El estado debe ser DRAFT, PENDING, SENT, OVERDUE, CANCELLED o VOID',
  })
  @IsOptional()
  status?: InvoiceStatus;

  /**
   * Filter by payment status
   * @example "UNPAID"
   */
  @IsEnum(PaymentStatus, {
    message: 'El estado de pago debe ser UNPAID, PARTIALLY_PAID o PAID',
  })
  @IsOptional()
  paymentStatus?: PaymentStatus;

  /**
   * Filter by customer ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @IsUUID('all', { message: 'El ID del cliente debe ser un UUID válido' })
  @IsOptional()
  customerId?: string;

  /**
   * Filter invoices from this date (inclusive)
   * @example "2024-01-01T00:00:00.000Z"
   */
  @IsDate({ message: 'La fecha de inicio debe ser una fecha válida' })
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  /**
   * Filter invoices until this date (inclusive)
   * @example "2024-12-31T23:59:59.000Z"
   */
  @IsDate({ message: 'La fecha de fin debe ser una fecha válida' })
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;
}
