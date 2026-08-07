"use server";

import client from "@/clients/client";
import type {
  ReadListPaymentsRequest,
  MinimalPayment,
  PaymentDetails,
  CreatePaymentRequest,
  CreatePaymentData,
  PreviewPaymentRequest,
  PreviewPaymentData,
} from "@/types/merchant/payments";
import type { ApiResponse, Paginated } from "@/types/common";

export async function listMerchantPayments(
  merchantId: string,
  params?: Omit<ReadListPaymentsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalPayment>>> {
  const { environment: _environment, ...rest } = params ?? {};

  try {
    const response = await client.get<ApiResponse<Paginated<MinimalPayment>>>(
      `/v1/merchant/${merchantId}/payments`,
      { params: rest }
    );
    return response?.data;
  } catch {
  }

  return { data: null, message: null, error: { message: "Não foi possível carregar os pagamentos." } };
}

export async function getMerchantPayment(
  merchantId: string,
  paymentId: string
): Promise<ApiResponse<PaymentDetails>> {
  const response = await client.get<ApiResponse<PaymentDetails>>(
    `/v1/merchant/${merchantId}/payments/${paymentId}`
  );
  return response?.data;
}

export async function createMerchantPayment(
  merchantId: string,
  data: Omit<CreatePaymentRequest, "merchantId">
): Promise<ApiResponse<CreatePaymentData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<CreatePaymentData>>(
    `/v1/merchant/${merchantId}/payments`,
    payload
  );
  return response?.data;
}


export async function previewPayment(
  merchantId: string,
  data: PreviewPaymentRequest
): Promise<ApiResponse<PreviewPaymentData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<PreviewPaymentData>>(
    `/v1/merchant/${merchantId}/payments/preview`,
    payload
  );
  return response?.data;
}

export async function resendWebhook(
  merchantId: string,
  paymentId: string
): Promise<ApiResponse<{ paymentId: string; callbackStatus: string } | null>> {
  const response = await client.post<
    ApiResponse<{ paymentId: string; callbackStatus: string } | null>
  >(`/v1/merchant/${merchantId}/payments/${paymentId}/resend-webhook`);
  return response?.data;
}
