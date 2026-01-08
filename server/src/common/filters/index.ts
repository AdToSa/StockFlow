/**
 * Global Exception Filters
 *
 * This module exports all exception filters for centralized error handling.
 *
 * Filter execution order (NestJS applies filters in reverse binding order):
 * When multiple filters are bound globally, the last one bound catches first.
 * Therefore, bind them in this order in main.ts:
 *
 * 1. AllExceptionsFilter - catches everything (fallback)
 * 2. PrismaExceptionFilter - catches Prisma errors
 * 3. PrismaValidationExceptionFilter - catches Prisma validation errors
 * 4. HttpExceptionFilter - catches HTTP exceptions (most specific)
 *
 * @example
 * ```typescript
 * // In main.ts
 * import {
 *   AllExceptionsFilter,
 *   HttpExceptionFilter,
 *   PrismaExceptionFilter,
 *   PrismaValidationExceptionFilter,
 * } from './common/filters';
 *
 * app.useGlobalFilters(
 *   new AllExceptionsFilter(),
 *   new PrismaExceptionFilter(),
 *   new PrismaValidationExceptionFilter(),
 *   new HttpExceptionFilter(),
 * );
 * ```
 */

export { HttpExceptionFilter } from './http-exception.filter';
export type { ErrorResponse } from './http-exception.filter';
export {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './prisma-exception.filter';
export { AllExceptionsFilter } from './all-exceptions.filter';
