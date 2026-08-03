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

export async function listMerchantCoupons(
  merchantId: string,
  params?: Omit<ReadListCouponsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCoupon>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<MinimalCoupon>>>(
    `/v1/merchant/${merchantId}/coupons`,
    { params: rest }
  );
  return response?.data;
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
