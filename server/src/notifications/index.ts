// Module
export { NotificationsModule } from './notifications.module';

// Services
export { NotificationsService } from './notifications.service';
export type {
  WelcomeEmailUser,
  InvoiceEmailData,
  PaymentEmailData,
  LowStockProduct,
} from './notifications.service';

export { MailService } from './mail/mail.service';
export type {
  EmailContext,
  SendMailOptions,
  SendMailResult,
} from './mail/mail.service';
