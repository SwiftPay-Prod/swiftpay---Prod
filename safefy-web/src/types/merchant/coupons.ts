import type { PaginationParams } from "../common";
import type { CouponStatus, CouponDiscountType, PaymentEnvironment } from "../enums";

// ==================== COUPON PRODUCT INFO ====================

export interface CouponProductInfo {
  id: string;
  name: string;
  imageUrl: string | null;
}

// ==================== COUPON CHECKOUT INFO ====================

export interface CouponCheckoutInfo {
  id: string;
  name: string;
  slug: string;
}

// ==================== COUPON DATA (full) ====================

export interface CouponData {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discountType: CouponDiscountType;
  discountPercentage: number | null;
  discountFixedAmount: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  currentUses: number;
  validFrom: string | null;
  validUntil: string | null;
  status: CouponStatus;
  applyToAllProducts: boolean;
  applyToAllCheckouts: boolean;
  environment: PaymentEnvironment;
  products: CouponProductInfo[];
  checkouts: CouponCheckoutInfo[];
  createdAt: string;
  updatedAt: string;
}

// ==================== MINIMAL COUPON (list) ====================

export interface MinimalCoupon {
  id: string;
  code: string;
  name: string | null;
  discountType: CouponDiscountType;
  discountPercentage: number | null;
  discountFixedAmount: number | null;
  maxDiscountAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  validFrom: string | null;
  validUntil: string | null;
  status: CouponStatus;
  applyToAllProducts: boolean;
  applyToAllCheckouts: boolean;
  environment: PaymentEnvironment;
  productCount: number;
  checkoutCount: number;
  createdAt: string;
}

// ==================== CREATE COUPON REQUEST ====================

export interface CreateCouponRequest {
  code: string;
  name?: string | null;
  discountType: CouponDiscountType;
  environment?: PaymentEnvironment;
  description?: string | null;
  discountPercentage?: number | null;
  discountFixedAmount?: number | null;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  status?: CouponStatus;
  applyToAllProducts?: boolean;
  applyToAllCheckouts?: boolean;
  productIds?: string[] | null;
  checkoutIds?: string[] | null;
}

// ==================== UPDATE COUPON REQUEST ====================

export interface UpdateCouponRequest {
  code?: string | null;
  name?: string | null;
  environment?: PaymentEnvironment;
  description?: string | null;
  discountType?: CouponDiscountType | null;
  discountPercentage?: number | null;
  discountFixedAmount?: number | null;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  status?: CouponStatus | null;
  applyToAllProducts?: boolean | null;
  applyToAllCheckouts?: boolean | null;
  productIds?: string[] | null;
  checkoutIds?: string[] | null;
  // Clear flags (when true, set field to null)
  clearMinOrderAmount?: boolean;
  clearMaxDiscountAmount?: boolean;
  clearMaxUses?: boolean;
  clearMaxUsesPerCustomer?: boolean;
  clearValidFrom?: boolean;
  clearValidUntil?: boolean;
}

// ==================== LIST COUPONS REQUEST ====================

export interface ReadListCouponsRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  status?: CouponStatus | null;
  discountType?: CouponDiscountType | null;
  applyToAllProducts?: boolean | null;
  search?: string | null;
}

