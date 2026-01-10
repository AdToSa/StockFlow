import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

/**
 * PaymentsModule provides payment recording functionality including:
 * - Payment CRUD operations
 * - Automatic invoice payment status updates
 * - Payment validation against remaining balance
 * - Multi-tenant isolation
 *
 * This module depends on:
 * - PrismaModule (global) - for database access
 * - CommonModule (global) - for TenantContextService
 * - AuthModule - for guards and decorators (imported at app level)
 *
 * All endpoints are protected by JwtAuthGuard and RolesGuard.
 * Multi-tenant isolation is enforced through TenantContextService.
 *
 * Business Rules:
 * - Payments are associated with invoices
 * - Payment amount cannot exceed remaining invoice balance
 * - Invoice paymentStatus is automatically updated:
 *   - UNPAID when no payments
 *   - PARTIALLY_PAID when some payment made
 *   - PAID when fully paid
 * - Only ADMIN can delete payments
 * - Deleting a payment recalculates invoice payment status
 */
@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
