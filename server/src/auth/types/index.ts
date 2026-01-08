import { UserRole } from '@prisma/client';

/**
 * JWT payload structure for access and refresh tokens.
 * Contains essential user information for authentication and authorization.
 */
export interface JwtPayload {
  /** User's unique identifier (subject claim) */
  sub: string;
  /** User's email address */
  email: string;
  /** User's role for authorization */
  role: UserRole;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  /** Token type discriminator */
  type: 'access' | 'refresh';
  /** Issued at timestamp (automatically added by JWT) */
  iat?: number;
  /** Expiration timestamp (automatically added by JWT) */
  exp?: number;
}

/**
 * Validated user data attached to the request after JWT validation.
 * This is the shape of request.user after successful authentication.
 */
export interface RequestUser {
  /** User's unique identifier */
  userId: string;
  /** User's email address */
  email: string;
  /** User's role for authorization */
  role: UserRole;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
}
