import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import type {
  SubscriptionStatus,
  CheckoutSessionResponse,
  PortalSessionResponse,
} from './subscriptions.service';
import { CreateCheckoutDto, CreatePortalDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth';
import { CurrentTenant, Roles } from '../common/decorators';

/**
 * SubscriptionsController handles all subscription management endpoints.
 *
 * All endpoints require JWT authentication.
 * Most operations are restricted to ADMIN role to prevent
 * unauthorized subscription changes.
 *
 * Endpoints:
 * - GET /subscriptions/status - Get current subscription status
 * - POST /subscriptions/create-checkout - Create Stripe checkout session
 * - POST /subscriptions/portal - Create Stripe customer portal session
 */
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Gets the current subscription status for the tenant.
   *
   * Returns:
   * - Current plan and limits
   * - Stripe customer and subscription IDs
   * - Subscription status from Stripe (if available)
   * - Current period end date
   * - Cancel at period end flag
   *
   * @param tenantId - Current tenant ID from JWT
   * @returns Subscription status details
   *
   * @example
   * GET /subscriptions/status
   *
   * Response:
   * {
   *   "tenantId": "clu...",
   *   "plan": "BASIC",
   *   "limits": { "maxUsers": 5, "maxProducts": 1000, ... },
   *   "stripeSubscriptionStatus": "active",
   *   "currentPeriodEnd": "2024-02-15T00:00:00.000Z"
   * }
   */
  @Get('status')
  async getStatus(
    @CurrentTenant() tenantId: string,
  ): Promise<SubscriptionStatus> {
    this.logger.log(`Getting subscription status for tenant: ${tenantId}`);
    return this.subscriptionsService.getSubscriptionStatus(tenantId);
  }

  /**
   * Creates a Stripe checkout session for upgrading to a paid plan.
   *
   * Only ADMIN users can initiate subscription upgrades.
   * After creation, redirect the user to the returned URL to complete payment.
   *
   * @param tenantId - Current tenant ID from JWT
   * @param dto - Checkout creation parameters (target plan)
   * @returns Checkout session ID and URL for redirect
   *
   * @example
   * POST /subscriptions/create-checkout
   * {
   *   "plan": "PRO"
   * }
   *
   * Response:
   * {
   *   "sessionId": "cs_test_...",
   *   "url": "https://checkout.stripe.com/..."
   * }
   */
  @Post('create-checkout')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutSessionResponse> {
    this.logger.log(
      `Creating checkout session for tenant ${tenantId} - plan: ${dto.plan}`,
    );
    return this.subscriptionsService.createCheckoutSession(tenantId, dto.plan);
  }

  /**
   * Creates a Stripe customer portal session for managing subscriptions.
   *
   * Only ADMIN users can access the billing portal.
   * The portal allows customers to:
   * - View and download invoices
   * - Update payment methods
   * - Change or cancel subscriptions
   *
   * @param tenantId - Current tenant ID from JWT
   * @param dto - Portal creation parameters (optional return URL)
   * @returns Portal session URL for redirect
   *
   * @example
   * POST /subscriptions/portal
   * {
   *   "returnUrl": "https://app.stockflow.com/settings"
   * }
   *
   * Response:
   * {
   *   "url": "https://billing.stripe.com/..."
   * }
   */
  @Post('portal')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async createPortal(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePortalDto,
  ): Promise<PortalSessionResponse> {
    this.logger.log(`Creating portal session for tenant: ${tenantId}`);
    return this.subscriptionsService.createPortalSession(
      tenantId,
      dto.returnUrl,
    );
  }
}
