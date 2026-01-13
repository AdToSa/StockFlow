import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../prisma';

/**
 * SubscriptionsModule provides Stripe subscription management capabilities.
 *
 * Features:
 * - Checkout session creation for plan upgrades
 * - Customer portal for subscription management
 * - Webhook handling for Stripe events
 * - Plan limit enforcement
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Your Stripe secret API key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe
 * - STRIPE_PRICE_BASIC: Price ID for BASIC plan
 * - STRIPE_PRICE_PRO: Price ID for PRO plan
 * - STRIPE_PRICE_ENTERPRISE: Price ID for ENTERPRISE plan
 * - FRONTEND_URL: URL for redirect after checkout/portal (already exists)
 *
 * @example
 * ```typescript
 * // Import in AppModule
 * @Module({
 *   imports: [SubscriptionsModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [SubscriptionsController, WebhooksController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
