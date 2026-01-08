/**
 * Prisma Types
 *
 * Re-exports useful types from Prisma for use throughout the application.
 * This centralizes type imports and provides convenient access to model types,
 * enums, and utility types.
 */

import { Prisma } from '@prisma/client';

// ============================================================================
// MODEL TYPES
// ============================================================================

/**
 * Core model types - these represent the base shape of each model
 */
export type {
  Tenant,
  User,
  Category,
  Product,
  Warehouse,
  WarehouseStock,
  StockMovement,
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
} from '@prisma/client';

// ============================================================================
// ENUM TYPES
// ============================================================================

/**
 * All enums defined in the Prisma schema
 */
export {
  TenantStatus,
  SubscriptionPlan,
  UserRole,
  UserStatus,
  ProductStatus,
  WarehouseStatus,
  MovementType,
  CustomerStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Create input types for each model
 */
export type TenantCreateInput = Prisma.TenantCreateInput;
export type UserCreateInput = Prisma.UserCreateInput;
export type CategoryCreateInput = Prisma.CategoryCreateInput;
export type ProductCreateInput = Prisma.ProductCreateInput;
export type WarehouseCreateInput = Prisma.WarehouseCreateInput;
export type WarehouseStockCreateInput = Prisma.WarehouseStockCreateInput;
export type StockMovementCreateInput = Prisma.StockMovementCreateInput;
export type CustomerCreateInput = Prisma.CustomerCreateInput;
export type InvoiceCreateInput = Prisma.InvoiceCreateInput;
export type InvoiceItemCreateInput = Prisma.InvoiceItemCreateInput;
export type PaymentCreateInput = Prisma.PaymentCreateInput;

/**
 * Update input types for each model
 */
export type TenantUpdateInput = Prisma.TenantUpdateInput;
export type UserUpdateInput = Prisma.UserUpdateInput;
export type CategoryUpdateInput = Prisma.CategoryUpdateInput;
export type ProductUpdateInput = Prisma.ProductUpdateInput;
export type WarehouseUpdateInput = Prisma.WarehouseUpdateInput;
export type WarehouseStockUpdateInput = Prisma.WarehouseStockUpdateInput;
export type StockMovementUpdateInput = Prisma.StockMovementUpdateInput;
export type CustomerUpdateInput = Prisma.CustomerUpdateInput;
export type InvoiceUpdateInput = Prisma.InvoiceUpdateInput;
export type InvoiceItemUpdateInput = Prisma.InvoiceItemUpdateInput;
export type PaymentUpdateInput = Prisma.PaymentUpdateInput;

/**
 * Where input types for filtering
 */
export type TenantWhereInput = Prisma.TenantWhereInput;
export type UserWhereInput = Prisma.UserWhereInput;
export type CategoryWhereInput = Prisma.CategoryWhereInput;
export type ProductWhereInput = Prisma.ProductWhereInput;
export type WarehouseWhereInput = Prisma.WarehouseWhereInput;
export type WarehouseStockWhereInput = Prisma.WarehouseStockWhereInput;
export type StockMovementWhereInput = Prisma.StockMovementWhereInput;
export type CustomerWhereInput = Prisma.CustomerWhereInput;
export type InvoiceWhereInput = Prisma.InvoiceWhereInput;
export type InvoiceItemWhereInput = Prisma.InvoiceItemWhereInput;
export type PaymentWhereInput = Prisma.PaymentWhereInput;

/**
 * Where unique input types for finding single records
 */
export type TenantWhereUniqueInput = Prisma.TenantWhereUniqueInput;
export type UserWhereUniqueInput = Prisma.UserWhereUniqueInput;
export type CategoryWhereUniqueInput = Prisma.CategoryWhereUniqueInput;
export type ProductWhereUniqueInput = Prisma.ProductWhereUniqueInput;
export type WarehouseWhereUniqueInput = Prisma.WarehouseWhereUniqueInput;
export type WarehouseStockWhereUniqueInput =
  Prisma.WarehouseStockWhereUniqueInput;
export type StockMovementWhereUniqueInput =
  Prisma.StockMovementWhereUniqueInput;
export type CustomerWhereUniqueInput = Prisma.CustomerWhereUniqueInput;
export type InvoiceWhereUniqueInput = Prisma.InvoiceWhereUniqueInput;
export type InvoiceItemWhereUniqueInput = Prisma.InvoiceItemWhereUniqueInput;
export type PaymentWhereUniqueInput = Prisma.PaymentWhereUniqueInput;

/**
 * OrderBy input types for sorting
 */
export type TenantOrderByWithRelationInput =
  Prisma.TenantOrderByWithRelationInput;
export type UserOrderByWithRelationInput = Prisma.UserOrderByWithRelationInput;
export type CategoryOrderByWithRelationInput =
  Prisma.CategoryOrderByWithRelationInput;
export type ProductOrderByWithRelationInput =
  Prisma.ProductOrderByWithRelationInput;
export type WarehouseOrderByWithRelationInput =
  Prisma.WarehouseOrderByWithRelationInput;
export type CustomerOrderByWithRelationInput =
  Prisma.CustomerOrderByWithRelationInput;
export type InvoiceOrderByWithRelationInput =
  Prisma.InvoiceOrderByWithRelationInput;
export type PaymentOrderByWithRelationInput =
  Prisma.PaymentOrderByWithRelationInput;

/**
 * Include types for eager loading relations
 */
export type TenantInclude = Prisma.TenantInclude;
export type UserInclude = Prisma.UserInclude;
export type CategoryInclude = Prisma.CategoryInclude;
export type ProductInclude = Prisma.ProductInclude;
export type WarehouseInclude = Prisma.WarehouseInclude;
export type WarehouseStockInclude = Prisma.WarehouseStockInclude;
export type StockMovementInclude = Prisma.StockMovementInclude;
export type CustomerInclude = Prisma.CustomerInclude;
export type InvoiceInclude = Prisma.InvoiceInclude;
export type InvoiceItemInclude = Prisma.InvoiceItemInclude;
export type PaymentInclude = Prisma.PaymentInclude;

/**
 * Select types for field selection
 */
export type TenantSelect = Prisma.TenantSelect;
export type UserSelect = Prisma.UserSelect;
export type CategorySelect = Prisma.CategorySelect;
export type ProductSelect = Prisma.ProductSelect;
export type WarehouseSelect = Prisma.WarehouseSelect;
export type WarehouseStockSelect = Prisma.WarehouseStockSelect;
export type StockMovementSelect = Prisma.StockMovementSelect;
export type CustomerSelect = Prisma.CustomerSelect;
export type InvoiceSelect = Prisma.InvoiceSelect;
export type InvoiceItemSelect = Prisma.InvoiceItemSelect;
export type PaymentSelect = Prisma.PaymentSelect;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Sort order enum
 */
export type SortOrder = Prisma.SortOrder;

/**
 * JSON value type for handling JSON fields
 */
export type JsonValue = Prisma.JsonValue;

/**
 * Decimal type for handling decimal/money fields
 */
export type Decimal = Prisma.Decimal;

/**
 * Transaction client type for use in transactional operations
 */
export type TransactionClient = Prisma.TransactionClient;

/**
 * Prisma namespace for advanced type utilities
 */
export { Prisma };

// ============================================================================
// MULTI-TENANT HELPER TYPES
// ============================================================================

/**
 * Base interface for tenant-scoped entities
 */
export interface TenantScoped {
  tenantId: string;
}

/**
 * Helper type to add tenant scope to any where clause
 */
export type WithTenantScope<T> = T & { tenantId: string };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  skip?: number;
  take?: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Common find options with pagination and tenant scope
 */
export interface TenantScopedFindOptions<
  TOrderBy = unknown,
  TInclude = unknown,
> {
  tenantId: string;
  skip?: number;
  take?: number;
  orderBy?: TOrderBy;
  include?: TInclude;
}
