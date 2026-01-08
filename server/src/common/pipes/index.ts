/**
 * Custom Pipes
 *
 * This module exports all custom pipes for validation and transformation.
 *
 * @example
 * ```typescript
 * import { CustomValidationPipe } from './common/pipes';
 *
 * // In main.ts
 * app.useGlobalPipes(new CustomValidationPipe());
 * ```
 */

export { CustomValidationPipe } from './validation.pipe';
export type {
  ValidationErrorDetail,
  ValidationErrorResponse,
} from './validation.pipe';
