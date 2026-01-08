import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ErrorResponse } from './http-exception.filter';

/**
 * Prisma error code to HTTP status mapping
 *
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const PRISMA_ERROR_MAP: Record<
  string,
  {
    status: number;
    error: string;
    getMessage: (meta?: Record<string, unknown>) => string;
  }
> = {
  // P2002: Unique constraint violation
  P2002: {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    getMessage: (meta) => {
      const target = meta?.target as string[] | undefined;
      if (target && target.length > 0) {
        const fields = target.join(', ');
        return `A record with this ${fields} already exists`;
      }
      return 'A record with these values already exists';
    },
  },

  // P2003: Foreign key constraint violation
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    getMessage: (meta) => {
      const fieldName = meta?.field_name as string | undefined;
      if (fieldName) {
        return `Invalid reference: ${fieldName} does not exist`;
      }
      return 'Invalid reference: related record does not exist';
    },
  },

  // P2025: Record not found
  P2025: {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
    getMessage: (meta) => {
      const cause = meta?.cause as string | undefined;
      if (cause) {
        return cause;
      }
      return 'The requested record was not found';
    },
  },

  // P2014: Required relation violation
  P2014: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    getMessage: (meta) => {
      const relationName = meta?.relation_name as string | undefined;
      if (relationName) {
        return `Required relation '${relationName}' is missing`;
      }
      return 'A required relation is missing';
    },
  },

  // P2016: Query interpretation error
  P2016: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    getMessage: () =>
      'Query interpretation error: the query could not be processed',
  },

  // P2000: Value too long for column
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    getMessage: (meta) => {
      const columnName = meta?.column_name as string | undefined;
      if (columnName) {
        return `The value for '${columnName}' is too long`;
      }
      return 'A provided value is too long for the column';
    },
  },

  // P2001: Record does not exist (in where condition)
  P2001: {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
    getMessage: () =>
      'The record searched for in the where condition does not exist',
  },

  // P2015: Related record not found
  P2015: {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
    getMessage: () => 'A related record could not be found',
  },

  // P2021: Table does not exist
  P2021: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'Internal Server Error',
    getMessage: () => 'Database configuration error',
  },

  // P2022: Column does not exist
  P2022: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'Internal Server Error',
    getMessage: () => 'Database configuration error',
  },
};

/**
 * PrismaExceptionFilter
 *
 * A global exception filter that catches Prisma client errors and transforms
 * them into appropriate HTTP responses with consistent formatting.
 *
 * Handles common Prisma errors:
 * - P2002: Unique constraint violation -> 409 Conflict
 * - P2003: Foreign key constraint violation -> 400 Bad Request
 * - P2025: Record not found -> 404 Not Found
 * - P2014: Required relation violation -> 400 Bad Request
 * - P2016: Query interpretation error -> 400 Bad Request
 *
 * @example
 * Response format:
 * ```json
 * {
 *   "statusCode": 409,
 *   "message": "A record with this email already exists",
 *   "error": "Conflict",
 *   "timestamp": "2025-01-07T10:30:00.000Z",
 *   "path": "/api/users"
 * }
 * ```
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorCode = exception.code;
    const errorMapping = PRISMA_ERROR_MAP[errorCode];

    let status: number;
    let message: string;
    let error: string;

    if (errorMapping) {
      status = errorMapping.status;
      error = errorMapping.error;
      message = errorMapping.getMessage(
        exception.meta as Record<string, unknown>,
      );
    } else {
      // Unknown Prisma error - treat as internal server error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = this.isProduction
        ? 'An unexpected database error occurred'
        : `Database error: ${exception.message}`;
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error with appropriate context
    this.logError(exception, errorResponse, request);

    response.status(status).json(errorResponse);
  }

  /**
   * Logs the Prisma error with context information
   */
  private logError(
    exception: Prisma.PrismaClientKnownRequestError,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const logContext = {
      prismaCode: exception.code,
      statusCode: errorResponse.statusCode,
      path: request.url,
      method: request.method,
      meta: exception.meta,
    };

    if (errorResponse.statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      // Server errors - full error log
      this.logger.error(
        `Prisma Error [${exception.code}]: ${JSON.stringify(logContext)}`,
        exception.stack,
      );
    } else if (errorResponse.statusCode === Number(HttpStatus.NOT_FOUND)) {
      // Not found - debug level
      this.logger.debug(
        `Prisma Error [${exception.code}]: ${JSON.stringify(logContext)}`,
      );
    } else {
      // Other client errors - warn level
      this.logger.warn(
        `Prisma Error [${exception.code}]: ${JSON.stringify(logContext)}`,
      );
    }
  }
}

/**
 * PrismaClientValidationErrorFilter
 *
 * Catches Prisma validation errors (e.g., missing required fields, invalid data types)
 * and transforms them into 400 Bad Request responses.
 */
@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaValidationExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(
    exception: Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.BAD_REQUEST;

    // In production, don't expose internal validation details
    const message = this.isProduction
      ? 'Invalid data provided'
      : this.extractValidationMessage(exception.message);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.warn(
      `Prisma Validation Error: ${JSON.stringify({
        path: request.url,
        method: request.method,
        message: exception.message,
      })}`,
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Extracts a user-friendly message from Prisma validation error
   */
  private extractValidationMessage(errorMessage: string): string {
    // Prisma validation errors often contain "Argument" or "Invalid" keywords
    // Extract the most relevant part for the user
    const lines = errorMessage.split('\n').filter((line) => line.trim());
    const relevantLine = lines.find(
      (line) =>
        line.includes('Argument') ||
        line.includes('Invalid') ||
        line.includes('Missing'),
    );

    if (relevantLine) {
      return relevantLine.trim();
    }

    return 'Invalid data provided for the operation';
  }
}
