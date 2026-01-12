import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail/mail.service';

/**
 * NotificationsModule
 *
 * Provides email notification functionality for the StockFlow application.
 *
 * Features:
 * - Email sending via SMTP with configurable transport
 * - Handlebars template rendering for HTML emails
 * - Scheduled cron jobs for automated notifications
 * - Manual trigger endpoints for admin users
 *
 * Configuration:
 * The module reads mail configuration from environment variables:
 * - MAIL_HOST: SMTP server hostname
 * - MAIL_PORT: SMTP server port (default: 587)
 * - MAIL_USER: SMTP authentication username
 * - MAIL_PASSWORD: SMTP authentication password
 * - MAIL_FROM: Default sender address
 *
 * If MAIL_HOST is not configured, the module will still load but
 * email sending will be disabled (logs a warning instead).
 *
 * Templates:
 * Email templates are located in ./templates and use Handlebars syntax.
 * Available templates:
 * - welcome.hbs: New user welcome email
 * - low-stock-alert.hbs: Low inventory alert for admins
 * - invoice-sent.hbs: Invoice sent to customer
 * - overdue-invoice.hbs: Overdue payment reminder
 * - payment-received.hbs: Payment confirmation
 *
 * Scheduled Jobs:
 * - Daily low stock alert at 9:00 AM (America/New_York)
 * - Daily overdue invoice reminder at 10:00 AM (America/New_York)
 */
@Module({
  imports: [
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Mailer module with dynamic configuration
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('MailerModule');
        const mailHost = configService.get<string>('mail.host');
        const mailPort = configService.get<number>('mail.port') || 587;
        const mailUser = configService.get<string>('mail.user');
        const mailPassword = configService.get<string>('mail.password');
        const mailFrom =
          configService.get<string>('mail.from') ||
          'StockFlow <noreply@stockflow.com>';

        // If mail is not configured, use a dummy transport that does nothing
        // This allows the application to start without mail configuration
        if (!mailHost) {
          logger.warn(
            'Mail configuration not found. Email sending will be disabled.',
          );
          logger.warn(
            'Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD to enable emails.',
          );

          return {
            transport: {
              host: 'localhost',
              port: 25,
              ignoreTLS: true,
              secure: false,
            },
            defaults: {
              from: mailFrom,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(undefined, {
                inlineCssEnabled: false,
              }),
              options: {
                strict: true,
              },
            },
          };
        }

        logger.log(`Mail configured with host: ${mailHost}:${mailPort}`);

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailPort === 465, // Use TLS for port 465
            auth:
              mailUser && mailPassword
                ? {
                    user: mailUser,
                    pass: mailPassword,
                  }
                : undefined,
            // Connection pooling for better performance
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            // Timeouts
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 30000, // 30 seconds
          },
          defaults: {
            from: mailFrom,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(undefined, {
              inlineCssEnabled: false,
            }),
            options: {
              strict: true,
            },
          },
          // Preview emails in development (optional)
          // preview: configService.get('app.nodeEnv') === 'development',
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, MailService],
  exports: [NotificationsService, MailService],
})
export class NotificationsModule {}
