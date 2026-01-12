import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { SentMessageInfo } from 'nodemailer';

/**
 * Context data for email templates
 */
export interface EmailContext {
  [key: string]: unknown;
}

/**
 * Options for sending an email
 */
export interface SendMailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: EmailContext;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Result of sending an email
 */
export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * MailService
 *
 * A wrapper around NestJS MailerService that provides:
 * - Logging of all email operations
 * - Retry logic with exponential backoff
 * - Graceful handling when mail is not configured
 * - Consistent error handling
 *
 * This service checks if mail is configured before attempting to send.
 * If mail is not configured, it logs a warning and returns gracefully.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isMailConfigured: boolean;
  private readonly defaultFrom: string;
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    // Check if mail is properly configured
    const mailHost = this.configService.get<string>('mail.host');
    this.isMailConfigured = !!mailHost;

    this.defaultFrom =
      this.configService.get<string>('mail.from') ||
      'StockFlow <noreply@stockflow.com>';

    if (!this.isMailConfigured) {
      this.logger.warn(
        'Mail service is not configured. Email notifications will be disabled. ' +
          'Set MAIL_HOST, MAIL_PORT, MAIL_USER, and MAIL_PASSWORD environment variables to enable.',
      );
    } else {
      this.logger.log('Mail service initialized successfully');
    }
  }

  /**
   * Checks if mail service is properly configured and can send emails.
   *
   * @returns True if mail is configured, false otherwise
   */
  isConfigured(): boolean {
    return this.isMailConfigured;
  }

  /**
   * Sends an email with the specified options.
   *
   * If mail is not configured, logs a warning and returns a success result
   * with a note that no email was actually sent.
   *
   * Implements retry logic with exponential backoff for transient failures.
   *
   * @param options - Email options including recipient, subject, template, and context
   * @returns Result indicating success or failure
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    if (!this.isMailConfigured) {
      this.logger.debug(
        `Mail not configured. Would have sent email to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}: ${options.subject}`,
      );
      return {
        success: true,
        messageId: 'mail-not-configured',
      };
    }

    const recipients = Array.isArray(options.to)
      ? options.to.join(', ')
      : options.to;

    this.logger.debug(
      `Sending email to ${recipients}: ${options.subject} (template: ${options.template})`,
    );

    return this.sendWithRetry(options, 0);
  }

  /**
   * Sends an email with retry logic.
   *
   * @param options - Email options
   * @param attempt - Current attempt number (0-indexed)
   * @returns Result indicating success or failure
   */
  private async sendWithRetry(
    options: SendMailOptions,
    attempt: number,
  ): Promise<SendMailResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: SentMessageInfo = await this.mailerService.sendMail({
        to: options.to,
        from: options.from || this.defaultFrom,
        replyTo: options.replyTo,
        subject: options.subject,
        template: options.template,
        context: options.context,
        attachments: options.attachments,
      });

      const recipients = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const messageId = result?.messageId as string | undefined;

      this.logger.log(
        `Email sent successfully to ${recipients}: ${options.subject} (messageId: ${messageId || 'unknown'})`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if we should retry
      if (attempt < this.maxRetries - 1 && this.isRetryableError(error)) {
        const delay = this.calculateBackoffDelay(attempt);
        this.logger.warn(
          `Email send failed (attempt ${attempt + 1}/${this.maxRetries}): ${errorMessage}. Retrying in ${delay}ms...`,
        );

        await this.delay(delay);
        return this.sendWithRetry(options, attempt + 1);
      }

      // Log final failure
      const recipients = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;

      this.logger.error(
        `Failed to send email to ${recipients}: ${options.subject}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Determines if an error is retryable (transient network/server errors).
   *
   * @param error - The error to check
   * @returns True if the error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const retryableMessages = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ESOCKET',
      'EAI_AGAIN',
      'socket hang up',
      'connection timeout',
      'getaddrinfo',
      '421', // Service not available
      '450', // Mailbox unavailable (temporary)
      '451', // Local error in processing
      '452', // Insufficient storage
    ];

    return retryableMessages.some(
      (msg) =>
        error.message.includes(msg) ||
        (error as NodeJS.ErrnoException).code === msg,
    );
  }

  /**
   * Calculates exponential backoff delay.
   *
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return this.baseDelayMs * Math.pow(2, attempt);
  }

  /**
   * Delays execution for the specified time.
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convenience method to send a welcome email.
   *
   * @param to - Recipient email address
   * @param userName - User's display name
   * @param tenantName - Organization/tenant name
   * @returns Send result
   */
  async sendWelcome(
    to: string,
    userName: string,
    tenantName: string,
  ): Promise<SendMailResult> {
    return this.sendMail({
      to,
      subject: `Welcome to StockFlow, ${userName}!`,
      template: 'welcome',
      context: {
        userName,
        tenantName,
        loginUrl: this.configService.get<string>('app.frontendUrl') + '/login',
        supportEmail: 'support@stockflow.com',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Convenience method to send a low stock alert email.
   *
   * @param to - Recipient email address(es)
   * @param tenantName - Organization/tenant name
   * @param products - Array of low stock products
   * @returns Send result
   */
  async sendLowStockAlert(
    to: string | string[],
    tenantName: string,
    products: Array<{
      sku: string;
      name: string;
      currentStock: number;
      minStock: number;
    }>,
  ): Promise<SendMailResult> {
    return this.sendMail({
      to,
      subject: `[StockFlow] Low Stock Alert - ${products.length} product(s) need attention`,
      template: 'low-stock-alert',
      context: {
        tenantName,
        products,
        productCount: products.length,
        dashboardUrl:
          this.configService.get<string>('app.frontendUrl') + '/products',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Convenience method to send an invoice sent notification.
   *
   * @param to - Customer email address
   * @param customerName - Customer's name
   * @param invoiceNumber - Invoice number
   * @param total - Invoice total amount
   * @param dueDate - Invoice due date
   * @param tenantName - Organization/tenant name
   * @returns Send result
   */
  async sendInvoiceSent(
    to: string,
    customerName: string,
    invoiceNumber: string,
    total: number,
    dueDate: Date | null,
    tenantName: string,
  ): Promise<SendMailResult> {
    return this.sendMail({
      to,
      subject: `Invoice ${invoiceNumber} from ${tenantName}`,
      template: 'invoice-sent',
      context: {
        customerName,
        invoiceNumber,
        total: total.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        dueDate: dueDate
          ? dueDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Upon receipt',
        tenantName,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Convenience method to send an overdue invoice reminder.
   *
   * @param to - Customer email address
   * @param customerName - Customer's name
   * @param invoiceNumber - Invoice number
   * @param total - Invoice total amount
   * @param dueDate - Invoice due date
   * @param daysOverdue - Number of days past due
   * @param tenantName - Organization/tenant name
   * @returns Send result
   */
  async sendOverdueInvoice(
    to: string,
    customerName: string,
    invoiceNumber: string,
    total: number,
    dueDate: Date,
    daysOverdue: number,
    tenantName: string,
  ): Promise<SendMailResult> {
    return this.sendMail({
      to,
      subject: `[Reminder] Invoice ${invoiceNumber} is ${daysOverdue} day(s) overdue`,
      template: 'overdue-invoice',
      context: {
        customerName,
        invoiceNumber,
        total: total.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        dueDate: dueDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        daysOverdue,
        tenantName,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Convenience method to send a payment received confirmation.
   *
   * @param to - Customer email address
   * @param customerName - Customer's name
   * @param invoiceNumber - Invoice number
   * @param paymentAmount - Amount paid
   * @param paymentMethod - Payment method used
   * @param remainingBalance - Remaining balance on invoice
   * @param tenantName - Organization/tenant name
   * @returns Send result
   */
  async sendPaymentReceived(
    to: string,
    customerName: string,
    invoiceNumber: string,
    paymentAmount: number,
    paymentMethod: string,
    remainingBalance: number,
    tenantName: string,
  ): Promise<SendMailResult> {
    return this.sendMail({
      to,
      subject: `Payment Received - Invoice ${invoiceNumber}`,
      template: 'payment-received',
      context: {
        customerName,
        invoiceNumber,
        paymentAmount: paymentAmount.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        paymentMethod: this.formatPaymentMethod(paymentMethod),
        remainingBalance: remainingBalance.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        isPaidInFull: remainingBalance <= 0,
        tenantName,
        paymentDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Formats a payment method enum value to a human-readable string.
   *
   * @param method - Payment method enum value
   * @returns Human-readable payment method
   */
  private formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      CASH: 'Cash',
      CREDIT_CARD: 'Credit Card',
      DEBIT_CARD: 'Debit Card',
      BANK_TRANSFER: 'Bank Transfer',
      CHECK: 'Check',
      OTHER: 'Other',
    };

    return methodMap[method] || method;
  }
}
