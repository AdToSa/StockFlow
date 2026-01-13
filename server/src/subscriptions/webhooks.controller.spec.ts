import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksController } from './webhooks.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: jest.Mocked<SubscriptionsService>;

  // Test data
  const mockSignature = 't=1234567890,v1=abc123,v0=def456';
  const mockRawBody = Buffer.from('{"type":"checkout.session.completed"}');

  const createMockRequest = (rawBody?: Buffer): Request => {
    return {
      rawBody,
    } as unknown as Request;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockSubscriptionsService = {
      handleWebhook: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    service = module.get(SubscriptionsService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ============================================================================
  // HANDLE STRIPE WEBHOOK
  // ============================================================================

  describe('handleStripeWebhook', () => {
    it('should process webhook successfully', async () => {
      const req = createMockRequest(mockRawBody);

      const result = await controller.handleStripeWebhook(mockSignature, req);

      expect(result).toEqual({ received: true });
      expect(service.handleWebhook).toHaveBeenCalledWith(
        mockSignature,
        mockRawBody,
      );
    });

    it('should log webhook receipt', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const req = createMockRequest(mockRawBody);

      await controller.handleStripeWebhook(mockSignature, req);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received Stripe webhook'),
      );
    });

    it('should throw BadRequestException when signature is missing', async () => {
      const req = createMockRequest(mockRawBody);

      await expect(controller.handleStripeWebhook('', req)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.handleStripeWebhook('', req)).rejects.toThrow(
        'Missing stripe-signature header',
      );
    });

    it('should log warning when signature is missing', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const req = createMockRequest(mockRawBody);

      await expect(controller.handleStripeWebhook('', req)).rejects.toThrow();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('without signature'),
      );
    });

    it('should throw BadRequestException when raw body is missing', async () => {
      const req = createMockRequest(undefined);

      await expect(
        controller.handleStripeWebhook(mockSignature, req),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleStripeWebhook(mockSignature, req),
      ).rejects.toThrow('Raw body not available');
    });

    it('should log error when raw body is missing', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const req = createMockRequest(undefined);

      await expect(
        controller.handleStripeWebhook(mockSignature, req),
      ).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Raw body not available'),
      );
    });

    it('should pass through service errors', async () => {
      const error = new BadRequestException('Invalid signature');
      service.handleWebhook.mockRejectedValue(error);
      const req = createMockRequest(mockRawBody);

      await expect(
        controller.handleStripeWebhook(mockSignature, req),
      ).rejects.toThrow(error);
    });

    it('should handle various signature formats', async () => {
      const signatures = [
        't=1234567890,v1=abc123',
        't=1234567890,v1=abc123,v0=def456',
        'v1=abc123,t=1234567890',
      ];

      for (const sig of signatures) {
        const req = createMockRequest(mockRawBody);
        const result = await controller.handleStripeWebhook(sig, req);
        expect(result).toEqual({ received: true });
      }
    });

    it('should handle large payloads', async () => {
      const largeBody = Buffer.alloc(1024 * 100, 'x'); // 100KB
      const req = createMockRequest(largeBody);

      const result = await controller.handleStripeWebhook(mockSignature, req);

      expect(result).toEqual({ received: true });
      expect(service.handleWebhook).toHaveBeenCalledWith(
        mockSignature,
        largeBody,
      );
    });
  });
});
