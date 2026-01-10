import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/**
 * Data transfer object for recording a new payment against an invoice.
 * Validates payment data before processing the transaction.
 */
export class CreatePaymentDto {
  /**
   * Invoice ID to apply the payment to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @IsUUID('all', { message: 'El ID de la factura debe ser un UUID valido' })
  invoiceId: string;

  /**
   * Payment amount in the invoice currency
   * @example 150.50
   */
  @IsNumber({}, { message: 'El monto debe ser un numero' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  /**
   * Payment method used
   * @example "CASH"
   */
  @IsEnum(PaymentMethod, {
    message:
      'El metodo de pago debe ser CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, PSE, NEQUI, DAVIPLATA u OTHER',
  })
  method: PaymentMethod;

  /**
   * Payment reference number (transaction ID, check number, etc.)
   * @example "TXN-123456789"
   */
  @IsString({ message: 'La referencia debe ser texto' })
  @IsOptional()
  reference?: string;

  /**
   * Additional notes about the payment
   * @example "Partial payment - remaining balance due next month"
   */
  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;

  /**
   * Date when the payment was made (defaults to current date/time)
   * @example "2024-01-15T10:30:00.000Z"
   */
  @IsDate({ message: 'La fecha de pago debe ser una fecha valida' })
  @Type(() => Date)
  @IsOptional()
  paymentDate?: Date;
}
