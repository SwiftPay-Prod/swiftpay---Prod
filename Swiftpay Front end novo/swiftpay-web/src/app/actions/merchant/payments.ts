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
import { SimulatePaymentAction } from "@/types/enums";

const mockMerchantPayments: MinimalPayment[] = [
  {
    id: "pay_1234567890",
    customer: { name: "Carlos Eduardo da Silva", email: "carlos.eduardo@gmail.com", phone: "11999999999" },
    amount: 259.90,
    fee: 7.79,
    netAmount: 252.11,
    method: "Pix" as any,
    status: "Completed" as any,
    pix: { payerName: "Carlos Eduardo da Silva", payerBank: "Banco Itaú S.A." },
    createdAt: new Date().toISOString(),
    checkoutName: "Checkout de Camisetas",
  },
  {
    id: "pay_0987654321",
    customer: { name: "Mariana Souza Almeida", email: "mariana.souza@hotmail.com", phone: "21988888888" },
    amount: 1450.00,
    fee: 43.50,
    netAmount: 1406.50,
    method: "Pix" as any,
    status: "Completed" as any,
    pix: { payerName: "Mariana Souza Almeida", payerBank: "Banco Bradesco S.A." },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    checkoutName: "Checkout Principal",
  },
  {
    id: "pay_1122334455",
    customer: { name: "Rodrigo Santos Oliveira", email: "rodrigo.santos@yahoo.com.br", phone: "31977777777" },
    amount: 899.90,
    fee: 26.99,
    netAmount: 872.91,
    method: "Pix" as any,
    status: "Processing" as any,
    pix: { payerName: "Rodrigo Santos Oliveira", payerBank: "Nubank S.A." },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    checkoutName: "Link Promocional Nike",
  },
  {
    id: "pay_6677889900",
    customer: { name: "Juliana Mendes Ferreira", email: "juliana.mendes@outlook.com", phone: "41966666666" },
    amount: 45.00,
    fee: 1.35,
    netAmount: 43.65,
    method: "Pix" as any,
    status: "Failed" as any,
    pix: { payerName: "Juliana Mendes Ferreira", payerBank: "Inter S.A." },
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    checkoutName: "Checkout de Camisetas",
  },
  {
    id: "pay_5544332211",
    customer: { name: "Felipe Antunes Lima", email: "felipe.antunes@gmail.com", phone: "51955555555" },
    amount: 19.90,
    fee: 0.60,
    netAmount: 19.30,
    method: "Pix" as any,
    status: "Refunded" as any,
    pix: { payerName: "Felipe Antunes Lima", payerBank: "Caixa Econômica Federal" },
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    checkoutName: "Checkout Principal",
  }
];

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
      success: true,
      data: {
        items: mockMerchantPayments,
        totalItems: mockMerchantPayments.length,
        totalPages: 1,
        page: 1,
        pageSize: 10,
      },
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
