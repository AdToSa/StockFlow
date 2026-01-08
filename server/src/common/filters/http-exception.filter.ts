import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standard error response format for the API
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * HttpExceptionFilter
 *
 * A global exception filter that catches all NestJS HTTP exceptions and
 * transforms them into a consistent response format.
 *
 * Features:
 * - Consistent error response structure across all endpoints
 * - Includes request path and timestamp for debugging
 * - Logs errors at appropriate levels based on status code
 * - Handles both string and object exception responses
 *
 * @example
 * Response format:
 * ```json
 * {
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "error": "Bad Request",
 *   "timestamp": "2025-01-07T10:30:00.000Z",
 *   "path": "/api/users"
 * }
 * ```
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message and error from the exception response
    const { message, error } = this.extractErrorDetails(
      exceptionResponse,
      status,
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error at appropriate level
    this.logError(status, errorResponse, request);

    response.status(status).json(errorResponse);
  }

  /**
   * Extracts message and error type from the exception response
   */
  private extractErrorDetails(
    exceptionResponse: string | object,
    status: number,
  ): { message: string | string[]; error: string } {
    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        error: this.getHttpStatusText(status),
      };
    }

    const responseObj = exceptionResponse as Record<string, unknown>;

    // Handle NestJS validation pipe errors (array of messages)
    const message =
      (responseObj.message as string | string[]) || 'An error occurred';
    const error =
      (responseObj.error as string) || this.getHttpStatusText(status);

    return { message, error };
  }

  /**
   * Logs the error at the appropriate level based on status code
   */
  private logError(
    status: number,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      message: errorResponse.message,
    };

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      // Server errors - log as error
      this.logger.error(`HTTP ${status} Error: ${JSON.stringify(logContext)}`);
    } else if (status >= Number(HttpStatus.BAD_REQUEST)) {
      // Client errors - log as warning
      this.logger.warn(`HTTP ${status} Error: ${JSON.stringify(logContext)}`);
    }
  }

  /**
   * Returns the standard HTTP status text for a given status code
   */
  private getHttpStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
      [HttpStatus.NOT_ACCEPTABLE]: 'Not Acceptable',
      [HttpStatus.REQUEST_TIMEOUT]: 'Request Timeout',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.GONE]: 'Gone',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
      [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
    };

    return statusTexts[status] || 'Error';
  }
}
