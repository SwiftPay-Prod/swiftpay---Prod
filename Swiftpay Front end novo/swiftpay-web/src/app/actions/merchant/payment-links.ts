"use server";

import client from "@/clients/client";
import type { ApiResponse, Paginated } from "@/types/common";
import type {
  CreatePaymentLinkData,
  CreatePaymentLinkRequest,
  MinimalPaymentLink,
  PaymentLinkDetails,
  ReadListPaymentLinksRequest,
  UpdatePaymentLinkRequest,
} from "@/types/merchant/payment-links";

export async function createMerchantPaymentLink(
  merchantId: string,
  data: CreatePaymentLinkRequest
): Promise<ApiResponse<CreatePaymentLinkData>> {
  const { environment: _environment, ...payload } = data;

  const response = await client.post<ApiResponse<CreatePaymentLinkData>>(
    `/v1/merchant/${merchantId}/payment-links`,
    payload
  );

  return response?.data;
}

export async function listMerchantPaymentLinks(
  merchantId: string,
  params?: Omit<ReadListPaymentLinksRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalPaymentLink>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<MinimalPaymentLink>>>(
    `/v1/merchant/${merchantId}/payment-links`,
    { params: rest }
  );

  return response?.data;
}

export async function getMerchantPaymentLink(
  merchantId: string,
  paymentLinkId: string
): Promise<ApiResponse<PaymentLinkDetails>> {
  const response = await client.get<ApiResponse<PaymentLinkDetails>>(
    `/v1/merchant/${merchantId}/payment-links/${paymentLinkId}`
  );

  return response?.data;
}

export async function expireMerchantPaymentLink(
  merchantId: string,
  paymentLinkId: string
): Promise<ApiResponse<void>> {
  const response = await client.patch<ApiResponse<void>>(
    `/v1/merchant/${merchantId}/payment-links/${paymentLinkId}/expire`
  );

  return response?.data;
}

export async function updateMerchantPaymentLink(
  merchantId: string,
  paymentLinkId: string,
  data: UpdatePaymentLinkRequest
): Promise<ApiResponse<PaymentLinkDetails>> {
  const response = await client.patch<ApiResponse<PaymentLinkDetails>>(
    `/v1/merchant/${merchantId}/payment-links/${paymentLinkId}`,
    data
  );

  return response?.data;
}

export async function deleteMerchantPaymentLink(
  merchantId: string,
  paymentLinkId: string
): Promise<ApiResponse<void>> {
  const response = await client.delete<ApiResponse<void>>(
    `/v1/merchant/${merchantId}/payment-links/${paymentLinkId}`
  );

  return response?.data;
}
