import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from './http-exception.filter';

/**
 * AllExceptionsFilter
 *
 * A catch-all exception filter that handles any unhandled exceptions that slip
 * through the more specific filters. This ensures that even unexpected errors
 * result in a consistent response format.
 *
 * Features:
 * - Catches all exceptions not handled by other filters
 * - Returns 500 Internal Server Error for unknown exceptions
 * - Shows stack traces only in development mode
 * - Logs full error details for debugging
 *
 * Order of filter execution (NestJS applies filters in reverse order):
 * 1. AllExceptionsFilter (catches everything)
 * 2. PrismaExceptionFilter (catches Prisma errors)
 * 3. HttpExceptionFilter (catches HTTP exceptions)
 *
 * @example
 * Response format in production:
 * ```json
 * {
 *   "statusCode": 500,
 *   "message": "An unexpected error occurred",
 *   "error": "Internal Server Error",
 *   "timestamp": "2025-01-07T10:30:00.000Z",
 *   "path": "/api/users"
 * }
 * ```
 *
 * Response format in development:
 * ```json
 * {
 *   "statusCode": 500,
 *   "message": "Cannot read property 'x' of undefined",
 *   "error": "Internal Server Error",
 *   "timestamp": "2025-01-07T10:30:00.000Z",
 *   "path": "/api/users",
 *   "stack": "Error: Cannot read property 'x'...",
 *   "debug": { ... }
 * }
 * ```
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If this is an HttpException, extract its status; otherwise, use 500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message
    const message = this.extractMessage(exception);

    // Build the error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message:
        this.isProduction && status >= 500
          ? 'An unexpected error occurred'
          : message,
      error: this.getErrorType(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add debug information in development
    if (!this.isProduction) {
      const debugResponse = errorResponse as ErrorResponse & {
        stack?: string;
        debug?: Record<string, unknown>;
      };

      if (exception instanceof Error && exception.stack) {
        debugResponse.stack = exception.stack;
      }

      debugResponse.debug = {
        exceptionType: exception?.constructor?.name || 'Unknown',
        method: request.method,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        body: this.sanitizeBody(request.body),
      };

      response.status(status).json(debugResponse);
    } else {
      response.status(status).json(errorResponse);
    }

    // Log the error
    this.logError(exception, request, status);
  }

  /**
   * Extracts a message from various exception types
   */
  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        if (typeof responseObj.message === 'string') {
          return responseObj.message;
        }
        if (Array.isArray(responseObj.message)) {
          return responseObj.message.join(', ');
        }
      }
      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    return 'An unexpected error occurred';
  }

  /**
   * Returns the error type string for a given status code
   */
  private getErrorType(status: number): string {
    const errorTypes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
    };

    return errorTypes[status] || 'Error';
  }

  /**
   * Sanitizes request headers for logging (removes sensitive data)
   */
  private sanitizeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes request body for logging (removes sensitive data)
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'creditCard',
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      body as Record<string, unknown>,
    )) {
      if (
        sensitiveFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Logs the exception with full context
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      exceptionType: exception?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const stack = exception instanceof Error ? exception.stack : undefined;

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `Unhandled Exception: ${JSON.stringify(logContext)}`,
        stack,
      );
    } else {
      this.logger.warn(`Exception: ${JSON.stringify(logContext)}`);
    }
  }
}
