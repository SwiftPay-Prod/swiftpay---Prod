"use server";

import client from "@/clients/client";
import type {
  ReadListPaymentsRequest,
  MinimalPayment,
  PaymentDetails,
  CreatePaymentRequest,
  CreatePaymentData,
  SimulatePaymentData,
  PreviewPaymentRequest,
  PreviewPaymentData,
} from "@/types/merchant/payments";
import type { ApiResponse, Paginated } from "@/types/common";
import { SimulatePaymentAction, PaymentMethod, PaymentStatus, PaymentRequestSource, PaymentEnvironment } from "@/types/enums";

const mockMerchantPayments: MinimalPayment[] = [];

export async function listMerchantPayments(
  merchantId: string,
  params?: Omit<ReadListPaymentsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalPayment>>> {
  try {
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalPayment>>>(
      `/v1/merchant/${merchantId}/payments`,
      { params: rest }
    );
    return response?.data;
  } catch (error) {
    console.warn(`[listMerchantPayments] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      data: {
        items: mockMerchantPayments,
        totalItems: mockMerchantPayments.length,
        totalPages: 1,
        page: 1,
        pageSize: 10,
      },
      message: null,
      error: null,
    };
  }
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

export async function simulatePayment(
  merchantId: string,
  paymentId: string,
  action: SimulatePaymentAction
): Promise<ApiResponse<SimulatePaymentData>> {
  const response = await client.post<ApiResponse<SimulatePaymentData>>(
    `/v1/merchant/${merchantId}/payments/${paymentId}/simulate`,
    { action }
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
