import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PaginatedResult, PaginationParams } from './types';

/**
 * Configuration options for the PrismaService
 */
interface PrismaServiceConfig {
  /**
   * Enable query logging in development mode
   * @default true in non-production environments
   */
  enableQueryLogging?: boolean;

  /**
   * Log slow queries that exceed this threshold (in milliseconds)
   * @default 1000
   */
  slowQueryThreshold?: number;
}

/**
 * PrismaService
 *
 * A NestJS-integrated Prisma client that provides:
 * - Automatic connection management via lifecycle hooks
 * - Development query logging for debugging
 * - Slow query detection and logging
 * - Helper methods for common operations (pagination, transactions)
 * - Multi-tenant query scoping utilities
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UsersService {
 *   constructor(private readonly prisma: PrismaService) {}
 *
 *   async findAll(tenantId: string) {
 *     return this.prisma.user.findMany({
 *       where: { tenantId },
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly serviceConfig: Required<PrismaServiceConfig>;
  private readonly pool: Pool;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const enableQueryLogging =
      process.env.PRISMA_QUERY_LOGGING === 'true' || !isProduction;
    const slowQueryThreshold = parseInt(
      process.env.PRISMA_SLOW_QUERY_THRESHOLD ?? '1000',
      10,
    );

    // Create the PostgreSQL connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create the Prisma PostgreSQL adapter
    const adapter = new PrismaPg(pool);

    // Build Prisma client options
    const prismaOptions: Prisma.PrismaClientOptions = {
      adapter,
    };

    // Enable query logging in development
    if (enableQueryLogging) {
      prismaOptions.log = [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ];
    }

    super(prismaOptions);

    this.pool = pool;
    this.serviceConfig = {
      enableQueryLogging,
      slowQueryThreshold,
    };

    // Set up event listeners for query logging
    if (enableQueryLogging) {
      this.setupQueryLogging();
    }
  }

  /**
   * Sets up query logging event listeners for development debugging
   */
  private setupQueryLogging(): void {
    // Type assertion needed because Prisma's event typing is complex
    const client = this as PrismaClient<{
      log: [
        { emit: 'event'; level: 'query' },
        { emit: 'event'; level: 'info' },
        { emit: 'event'; level: 'warn' },
        { emit: 'event'; level: 'error' },
      ];
    }>;

    // Log all queries with their duration
    client.$on('query', (e: Prisma.QueryEvent) => {
      const duration = e.duration;
      const query = e.query;
      const params = e.params;

      // Warn about slow queries
      if (duration > this.serviceConfig.slowQueryThreshold) {
        this.logger.warn(
          `Slow query detected (${duration}ms): ${query}`,
          params,
        );
      } else {
        this.logger.debug(`Query (${duration}ms): ${query}`, params);
      }
    });

    // Log info messages
    client.$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(e.message);
    });

    // Log warnings
    client.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(e.message);
    });

    // Log errors
    client.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(e.message);
    });
  }

  /**
   * Connects to the database when the module initializes
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');

      if (this.serviceConfig.enableQueryLogging) {
        this.logger.log('Query logging enabled (development mode)');
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Disconnects from the database when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Disconnected from database');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Executes a callback within a database transaction
   *
   * @param fn - Callback function that receives a transaction client
   * @returns The result of the callback function
   *
   * @example
   * ```typescript
   * const result = await this.prisma.executeInTransaction(async (tx) => {
   *   const user = await tx.user.create({ data: userData });
   *   await tx.auditLog.create({ data: { action: 'USER_CREATED', userId: user.id } });
   *   return user;
   * });
   * ```
   */
  async executeInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.$transaction(fn, options);
  }

  /**
   * Creates a paginated result from a query
   *
   * @param model - The Prisma model delegate to query
   * @param params - Pagination parameters
   * @param where - Where clause for filtering
   * @param options - Additional query options
   * @returns Paginated result with metadata
   *
   * @example
   * ```typescript
   * const result = await this.prisma.paginate(
   *   this.prisma.user,
   *   { skip: 0, take: 10 },
   *   { tenantId: 'tenant-123', status: 'ACTIVE' },
   *   { orderBy: { createdAt: 'desc' }, include: { profile: true } }
   * );
   * ```
   */
  async paginate<T, TWhereInput>(
    model: {
      findMany: (args: {
        where?: TWhereInput;
        skip?: number;
        take?: number;
        orderBy?: unknown;
        include?: unknown;
      }) => Promise<T[]>;
      count: (args: { where?: TWhereInput }) => Promise<number>;
    },
    params: PaginationParams,
    where?: TWhereInput,
    options?: {
      orderBy?: unknown;
      include?: unknown;
    },
  ): Promise<PaginatedResult<T>> {
    const skip = params.skip ?? 0;
    const take = params.take ?? 10;
    const page = Math.floor(skip / take) + 1;

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take,
        orderBy: options?.orderBy,
        include: options?.include,
      }),
      model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Checks if a record exists
   *
   * @param model - The Prisma model delegate to query
   * @param where - Where clause for filtering
   * @returns True if the record exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await this.prisma.exists(
   *   this.prisma.user,
   *   { email: 'user@example.com', tenantId: 'tenant-123' }
   * );
   * ```
   */
  async exists<TWhereInput>(
    model: {
      count: (args: { where?: TWhereInput }) => Promise<number>;
    },
    where: TWhereInput,
  ): Promise<boolean> {
    const count = await model.count({ where });
    return count > 0;
  }

  /**
   * Soft deletes are not built into Prisma, but this helper can be used
   * to implement soft delete patterns consistently across models that have
   * a deletedAt field.
   *
   * Note: Requires models to have a deletedAt DateTime? field
   *
   * @example
   * ```typescript
   * await this.prisma.softDelete(this.prisma.user, { id: 'user-123' });
   * ```
   */
  async softDelete<TWhereUniqueInput, TUpdateInput>(
    model: {
      update: (args: {
        where: TWhereUniqueInput;
        data: TUpdateInput;
      }) => Promise<unknown>;
    },
    where: TWhereUniqueInput,
  ): Promise<void> {
    await model.update({
      where,
      data: { deletedAt: new Date() } as TUpdateInput,
    });
  }

  /**
   * Utility to check database health/connectivity
   * Useful for health check endpoints
   *
   * @returns Object with connected status and optional error
   */
  async healthCheck(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { connected: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';
      return { connected: false, error: message };
    }
  }
}
