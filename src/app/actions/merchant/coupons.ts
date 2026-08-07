"use server";

import client from "@/clients/client";
import type {
  CouponData,
  MinimalCoupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  ReadListCouponsRequest,
} from "@/types/merchant/coupons";
import type { ApiResponse, Paginated } from "@/types/common";
import { CouponStatus, CouponDiscountType, PaymentEnvironment } from "@/types/enums";

const MOCK_COUPONS: MinimalCoupon[] = [
  {
    id: 'cpn_102938475',
    code: 'SWIFTPAY10',
    name: 'Cupom de Boas-Vindas 10%',
    discountType: CouponDiscountType.Percentage,
    discountPercentage: 10,
    discountFixedAmount: null,
    maxDiscountAmount: 5000,
    maxUses: 500,
    currentUses: 142,
    validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: CouponStatus.Active,
    applyToAllProducts: true,
    applyToAllCheckouts: true,
    environment: PaymentEnvironment.Production,
    productCount: 5,
    checkoutCount: 3,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'cpn_564738291',
    code: 'BLACKFRIDAY',
    name: 'Desconto Fixo R$ 50',
    discountType: CouponDiscountType.FixedAmount,
    discountPercentage: null,
    discountFixedAmount: 5000,
    maxDiscountAmount: null,
    maxUses: 100,
    currentUses: 89,
    validFrom: new Date(Date.now() - 86400000 * 10).toISOString(),
    validUntil: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: CouponStatus.Active,
    applyToAllProducts: false,
    applyToAllCheckouts: true,
    environment: PaymentEnvironment.Production,
    productCount: 2,
    checkoutCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export async function listMerchantCoupons(
  merchantId: string,
  params?: Omit<ReadListCouponsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCoupon>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: MOCK_COUPONS,
        page: 1,
        pageSize: 10,
        totalItems: MOCK_COUPONS.length,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalCoupon>>>(
      `/v1/merchant/${merchantId}/coupons`,
      { params: rest }
    );
    if (response?.data) return response.data;
  } catch {}

  return {
    data: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
    message: null,
    error: null,
  };
}

export async function getMerchantCoupon(
  merchantId: string,
  couponId: string
): Promise<ApiResponse<CouponData>> {
  const response = await client.get<ApiResponse<CouponData>>(
    `/v1/merchant/${merchantId}/coupons/${couponId}`
  );
  return response?.data;
}

export async function createMerchantCoupon(
  merchantId: string,
  data: CreateCouponRequest
): Promise<ApiResponse<CouponData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<CouponData>>(
    `/v1/merchant/${merchantId}/coupons`,
    payload
  );
  return response?.data;
}

export async function updateMerchantCoupon(
  merchantId: string,
  couponId: string,
  data: UpdateCouponRequest
): Promise<ApiResponse<CouponData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.patch<ApiResponse<CouponData>>(
    `/v1/merchant/${merchantId}/coupons/${couponId}`,
    payload
  );
  return response?.data;
}

export async function deleteMerchantCoupon(
  merchantId: string,
  couponId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/coupons/${couponId}`
  );
  return response?.data;
}
