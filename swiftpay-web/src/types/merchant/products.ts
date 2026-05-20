import type { PaginationParams } from "../common";
import type { ProductType, ProductStatus, CategoryStatus, VariantStatus, PaymentEnvironment, CouponDiscountType, CouponStatus, StockMovementType, StockMovementReferenceType, ServiceLocationType, DigitalItemType, DigitalItemStatus } from "../enums";

// ==================== CATEGORY ====================

export interface CategoryData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  status: CategoryStatus;
  environment: PaymentEnvironment;
  productCount: number;
  createdAt: string;
}

export interface MinimalCategoryData {
  id: string;
  externalId: string | null;
  name: string;
  status: CategoryStatus;
  environment: PaymentEnvironment;
  productCount: number;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  environment?: PaymentEnvironment;
  description?: string | null;
  externalId?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string | null;
  description?: string | null;
  externalId?: string | null;
  status?: CategoryStatus | null;
}

export interface ReadListCategoriesRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: CategoryStatus | null;
  search?: string | null;
}

// ==================== VARIANT ====================

export interface VariantData {
  id: string;
  productId: string;
  productName: string | null;
  externalId: string | null;
  name: string;
  sku: string | null;
  price: number;
  stockQuantity: number | null;
  imageUrl: string | null;
  status: VariantStatus;
  createdAt: string;
}

export interface CreateVariantRequest {
  name: string;
  price: number;
  externalId?: string | null;
  sku?: string | null;
  stockQuantity?: number | null;
  imageUrl?: string | null;
  status?: VariantStatus;
}

export interface UpdateVariantRequest {
  name?: string | null;
  price?: number | null;
  externalId?: string | null;
  sku?: string | null;
  stockQuantity?: number | null;
  imageUrl?: string | null;
  status?: VariantStatus | null;
}

export interface ReadListVariantsRequest extends PaginationParams {
  status?: VariantStatus | null;
  search?: string | null;
}

// ==================== PRODUCT ====================

export interface ProductCategoryData {
  id: string;
  name: string;
  status: CategoryStatus;
}

export interface ProductVariantData {
  id: string;
  name: string;
  externalId: string | null;
  sku: string | null;
  price: number;
  stockQuantity: number | null;
  imageUrl: string | null;
  status: VariantStatus;
}

export interface ProductCouponData {
  id: string;
  code: string;
  name: string | null;
  discountType: CouponDiscountType;
  discountFixedAmount: number | null;
  discountPercentage: number | null;
  status: CouponStatus;
  currentUses: number;
  maxUses: number | null;
}

export interface ProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  type: ProductType;
  price: number | null;
  stockQuantity: number | null;
  imageUrl: string | null;
  imageUrls: string[];
  status: ProductStatus;
  environment: PaymentEnvironment;
  isUnlimitedDigitalStock: boolean;
  digitalItemsPerPurchase: number;
  digitalItemsCount: number;
  categories: ProductCategoryData[];
  variants: ProductVariantData[];
  coupons: ProductCouponData[];
  createdAt: string;
}

export interface MinimalProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  type: ProductType;
  price: number | null;
  stockQuantity: number | null;
  imageUrl: string | null;
  imageUrls: string[];
  status: ProductStatus;
  environment: PaymentEnvironment;
  isUnlimitedDigitalStock: boolean;
  digitalItemsPerPurchase: number;
  digitalItemsCount: number;
  durationMinutes: number | null;
  locationType: ServiceLocationType | null;
  categoryCount: number;
  variantCount: number;
  couponCount: number;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  type: ProductType;
  environment?: PaymentEnvironment;
  status?: ProductStatus | null;
  description?: string | null;
  externalId?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  isUnlimitedDigitalStock?: boolean | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  categoryIds?: string[] | null;
}

export interface UpdateProductRequest {
  name?: string | null;
  type?: ProductType | null;
  description?: string | null;
  externalId?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  clearStockQuantity?: boolean;
  isUnlimitedDigitalStock?: boolean | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  status?: ProductStatus | null;
  categoryIds?: string[] | null;
  couponIds?: string[] | null;
}

export interface ReadListProductsRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: ProductStatus | null;
  type?: ProductType | null;
  categoryId?: string | null;
  search?: string | null;
}

// ==================== PAYMENT API PRODUCTS ====================

export interface PaymentApiProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  imageUrls: string[];
  type: ProductType;
  status: ProductStatus;
  categories: PaymentApiProductCategoryData[];
  variants: PaymentApiProductVariantData[];
  createdAt: string;
}

export interface PaymentApiProductCategoryData {
  id: string;
  externalId: string | null;
  name: string;
  status: CategoryStatus;
}

export interface PaymentApiProductVariantData {
  id: string;
  externalId: string | null;
  name: string;
  sku: string | null;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  status: VariantStatus;
}

export interface ListPaymentApiProductsRequest extends PaginationParams {
  status?: ProductStatus | null;
  type?: ProductType | null;
  categoryId?: string | null;
  search?: string | null;
  externalId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

// ==================== STOCK MOVEMENT ====================

export interface StockAdjustmentRequest {
  type: StockMovementType;
  quantity: number;
  variantId?: string | null;
  notes?: string | null;
}

export interface StockAdjustmentData {
  movementId: string;
  productId: string;
  variantId: string | null;
  type: StockMovementType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
}

export interface StockMovementData {
  id: string;
  productId: string;
  variantId: string | null;
  variantName: string | null;
  type: StockMovementType;
  referenceType: StockMovementReferenceType;
  referenceId: string | null;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
}

export interface ListStockMovementsRequest extends PaginationParams {
  variantId?: string | null;
  type?: StockMovementType | null;
}

// ==================== PHYSICAL PRODUCT ====================

export interface PhysicalProductVariantData {
  id: string;
  name: string;
  externalId: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number | null;
  weightGrams: number | null;
  imageUrl: string | null;
  status: VariantStatus;
}

export interface PhysicalProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number | null;
  compareAtPrice: number | null;
  stockQuantity: number | null;
  trackInventory: boolean;
  allowBackorder: boolean;
  brand: string | null;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  hasVariants: boolean;
  imageUrl: string | null;
  imageUrls: string[];
  status: ProductStatus;
  environment: PaymentEnvironment;
  categories: ProductCategoryData[];
  variants: PhysicalProductVariantData[];
  coupons: ProductCouponData[];
  createdAt: string;
}

export interface MinimalPhysicalProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number | null;
  compareAtPrice: number | null;
  stockQuantity: number | null;
  trackInventory: boolean;
  brand: string | null;
  hasVariants: boolean;
  imageUrl: string | null;
  status: ProductStatus;
  environment: PaymentEnvironment;
  categoryCount: number;
  variantCount: number;
  createdAt: string;
}

export interface CreatePhysicalProductRequest {
  name: string;
  environment?: PaymentEnvironment;
  description?: string | null;
  externalId?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  brand?: string | null;
  weightGrams?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  categoryIds?: string[] | null;
  variants?: CreatePhysicalProductVariantRequest[] | null;
}

export interface CreatePhysicalProductVariantRequest {
  name: string;
  price: number;
  externalId?: string | null;
  sku?: string | null;
  compareAtPrice?: number | null;
  stockQuantity?: number | null;
  weightGrams?: number | null;
  imageUrl?: string | null;
}

export interface UpdatePhysicalProductRequest {
  name?: string | null;
  description?: string | null;
  externalId?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number | null;
  clearStockQuantity?: boolean;
  trackInventory?: boolean | null;
  allowBackorder?: boolean | null;
  brand?: string | null;
  weightGrams?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  status?: ProductStatus | null;
  categoryIds?: string[] | null;
  couponIds?: string[] | null;
}

export interface ReadListPhysicalProductsRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: ProductStatus | null;
  categoryId?: string | null;
  search?: string | null;
}

// ==================== DIGITAL PRODUCT ====================

export interface DigitalProductVariantData {
  id: string;
  name: string;
  externalId: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  itemsCount: number;
  availableItemsCount: number;
  status: VariantStatus;
}

export interface DigitalProductItemData {
  id: string;
  type: DigitalItemType;
  value: string;
  status: DigitalItemStatus;
  deliveredAt: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface DigitalProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  itemsPerPurchase: number;
  autoDelivery: boolean;
  hasVariants: boolean;
  imageUrl: string | null;
  imageUrls: string[];
  status: ProductStatus;
  environment: PaymentEnvironment;
  itemsCount: number;
  availableItemsCount: number;
  categories: ProductCategoryData[];
  variants: DigitalProductVariantData[];
  coupons: ProductCouponData[];
  createdAt: string;
}

export interface MinimalDigitalProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  itemsPerPurchase: number;
  autoDelivery: boolean;
  hasVariants: boolean;
  imageUrl: string | null;
  status: ProductStatus;
  environment: PaymentEnvironment;
  itemsCount: number;
  availableItemsCount: number;
  categoryCount: number;
  variantCount: number;
  createdAt: string;
}

export interface CreateDigitalProductRequest {
  name: string;
  price: number;
  environment?: PaymentEnvironment;
  description?: string | null;
  externalId?: string | null;
  compareAtPrice?: number | null;
  itemsPerPurchase?: number;
  autoDelivery?: boolean;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  categoryIds?: string[] | null;
  variants?: CreateDigitalProductVariantRequest[] | null;
  items?: CreateDigitalProductItemRequest[] | null;
}

export interface CreateDigitalProductVariantRequest {
  name: string;
  price: number;
  externalId?: string | null;
  sku?: string | null;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
}

export interface CreateDigitalProductItemRequest {
  type: DigitalItemType;
  value: string;
  variantId?: string | null;
}

export interface UpdateDigitalProductRequest {
  name?: string | null;
  description?: string | null;
  externalId?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  itemsPerPurchase?: number | null;
  autoDelivery?: boolean | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  status?: ProductStatus | null;
  categoryIds?: string[] | null;
  couponIds?: string[] | null;
}

export interface ReadListDigitalProductsRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: ProductStatus | null;
  categoryId?: string | null;
  search?: string | null;
}

export interface ReadListDigitalProductItemsRequest extends PaginationParams {
  status?: DigitalItemStatus | null;
  variantId?: string | null;
}

export interface AddDigitalProductItemsRequest {
  items: CreateDigitalProductItemRequest[];
}

// ==================== SERVICE PRODUCT ====================

export interface ServiceProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  durationMinutes: number | null;
  requiresScheduling: boolean;
  locationType: ServiceLocationType;
  locationAddress: string | null;
  onlineServiceUrl: string | null;
  instructions: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  status: ProductStatus;
  environment: PaymentEnvironment;
  categories: ProductCategoryData[];
  coupons: ProductCouponData[];
  createdAt: string;
}

export interface MinimalServiceProductData {
  id: string;
  externalId: string | null;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  durationMinutes: number | null;
  requiresScheduling: boolean;
  locationType: ServiceLocationType;
  imageUrl: string | null;
  status: ProductStatus;
  environment: PaymentEnvironment;
  categoryCount: number;
  createdAt: string;
}

export interface CreateServiceProductRequest {
  name: string;
  price: number;
  environment?: PaymentEnvironment;
  description?: string | null;
  externalId?: string | null;
  compareAtPrice?: number | null;
  durationMinutes?: number | null;
  requiresScheduling?: boolean;
  locationType?: ServiceLocationType;
  locationAddress?: string | null;
  onlineServiceUrl?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  categoryIds?: string[] | null;
}

export interface UpdateServiceProductRequest {
  name?: string | null;
  description?: string | null;
  externalId?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  durationMinutes?: number | null;
  requiresScheduling?: boolean | null;
  locationType?: ServiceLocationType | null;
  locationAddress?: string | null;
  onlineServiceUrl?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  status?: ProductStatus | null;
  categoryIds?: string[] | null;
  couponIds?: string[] | null;
}

export interface ReadListServiceProductsRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: ProductStatus | null;
  categoryId?: string | null;
  search?: string | null;
}

