import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for updating an existing invoice.
 * Only DRAFT invoices can be updated.
 * Limited to notes and due date modifications.
 */
export class UpdateInvoiceDto {
  /**
   * Due date for the invoice
   * @example "2024-12-31T23:59:59.000Z"
   */
  @IsDate({ message: 'La fecha de vencimiento debe ser una fecha válida' })
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  /**
   * Additional notes for the invoice
   * @example "Payment due within 30 days"
   */
  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;
}
