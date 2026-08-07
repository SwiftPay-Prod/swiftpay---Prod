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

export async function listMerchantCheckouts(
  merchantId: string,
  params?: Omit<ReadListCheckoutsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCheckout>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<MinimalCheckout>>>(
    `/v1/merchant/${merchantId}/checkouts`,
    { params: rest }
  );
  return response.data;
}

export async function getMerchantCheckout(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<CheckoutData>> {
  const response = await client.get<ApiResponse<CheckoutData>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}`
  );
  return response.data;
}

export async function createMerchantCheckout(
  merchantId: string,
  data: CreateCheckoutRequest
): Promise<ApiResponse<CheckoutData>> {
  if (data.minimumValue != null && data.minimumValue < 1000) {
    return {
      data: null,
      message: null,
      error: { message: "O valor mínimo do checkout deve ser R$ 10,00." },
    };
  }
  const { environment: _environment, ...payload } = data;

  const response = await client.post<ApiResponse<CheckoutData>>(
    `/v1/merchant/${merchantId}/checkouts`,
    payload
  );

  revalidatePath("/panel/merchant/checkouts");
  return response.data;
}

export async function updateMerchantCheckout(
  merchantId: string,
  checkoutId: string,
  data: UpdateCheckoutRequest
): Promise<ApiResponse<CheckoutData>> {
  if (data.minimumValue != null && data.minimumValue < 1000) {
    return {
      data: null,
      message: null,
      error: { message: "O valor mínimo do checkout deve ser R$ 10,00." },
    };
  }

  const response = await client.patch<ApiResponse<CheckoutData>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}`,
    data
  );

  revalidatePath("/panel/merchant/checkouts");
  revalidatePath(`/panel/merchant/checkouts/upsert/${checkoutId}`);
  return response.data;
}

export async function deleteMerchantCheckout(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}`
  );

  revalidatePath("/panel/merchant/checkouts");
  return response.data;
}

export async function transferMerchantCheckoutToProduction(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<TransferCheckoutToProductionData>> {
  const response = await client.post<ApiResponse<TransferCheckoutToProductionData>>(
    `/v1/merchant/${merchantId}/checkouts/${checkoutId}/transfer-to-production`
  );

  revalidatePath("/panel/merchant/checkouts");
  return response.data;
}

export async function listCheckoutTemplates(
  merchantId: string,
  params?: Omit<ReadListCheckoutTemplatesRequest, "merchantId">
): Promise<ApiResponse<Paginated<CheckoutTemplateData>>> {
  const response = await client.get<ApiResponse<Paginated<CheckoutTemplateData>>>(
    `/v1/merchant/${merchantId}/checkout-templates`,
    { params }
  );
  return response.data;
}
