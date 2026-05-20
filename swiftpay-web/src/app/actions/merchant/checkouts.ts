"use server";

import { revalidatePath } from "next/cache";
import client from "@/clients/client";
import type {
  CheckoutData,
  MinimalCheckout,
  CheckoutTemplateData,
  ReadListCheckoutsRequest,
  ReadListCheckoutTemplatesRequest,
  CreateCheckoutRequest,
  UpdateCheckoutRequest,
  TransferCheckoutToProductionData,
} from "@/types/merchant/checkouts";
import type { ApiResponse, Paginated } from "@/types/common";

// ==================== CHECKOUTS ====================

export async function listMerchantCheckouts(
  merchantId: string,
  params?: Omit<ReadListCheckoutsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCheckout>>> {
  const response = await client.get<ApiResponse<Paginated<MinimalCheckout>>>(
    `/v1/merchant/${merchantId}/checkouts`,
    { params }
  );
  return response?.data;
}

export async function getMerchantCheckout(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<CheckoutData>> {
  const response = await client.get<ApiResponse<CheckoutData>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}`
  );
  return response?.data;
}

export async function createMerchantCheckout(
  merchantId: string,
  data: CreateCheckoutRequest
): Promise<ApiResponse<CheckoutData>> {
  const response = await client.post<ApiResponse<CheckoutData>>(
    `/v1/merchant/${merchantId}/checkouts`,
    data
  );
  
  // Revalidate the checkouts list page
  revalidatePath(`/panel/merchant/checkouts`);
  
  return response?.data;
}

export async function updateMerchantCheckout(
  merchantId: string,
  checkoutId: string,
  data: UpdateCheckoutRequest
): Promise<ApiResponse<CheckoutData>> {
  const response = await client.patch<ApiResponse<CheckoutData>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}`,
    data
  );
  
  revalidatePath(`/panel/merchant/checkouts`);
  
  return response?.data;
}

export async function deleteMerchantCheckout(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}`
  );
  
  revalidatePath(`/panel/merchant/checkouts`);
  
  return response?.data;
}

export async function transferMerchantCheckoutToProduction(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<TransferCheckoutToProductionData>> {
  const response = await client.post<ApiResponse<TransferCheckoutToProductionData>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}/transfer-to-production`
  );

  revalidatePath(`/panel/merchant/checkouts`);

  return response?.data;
}

// ==================== CHECKOUT TEMPLATES ====================

export async function listCheckoutTemplates(
  merchantId: string,
  params?: Omit<ReadListCheckoutTemplatesRequest, "merchantId">
): Promise<ApiResponse<Paginated<CheckoutTemplateData>>> {
  const response = await client.get<ApiResponse<Paginated<CheckoutTemplateData>>>(
    `/v1/merchant/${merchantId}/checkout-templates`,
    { params }
  );
  return response?.data;
}

