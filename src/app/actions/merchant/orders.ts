"use server";

import client from "@/clients/client";
import type {
  ReadListOrdersRequest,
  MinimalOrder,
  OrderDetails,
  UpdateOrderFulfillmentData,
  CreateOrderRequest,
  CreateOrderResult,
} from "@/types/merchant/orders";
import type { ApiResponse, Paginated } from "@/types/common";
import {
  OrderFulfillmentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentEnvironment,
} from "@/types/enums";

export async function createMerchantOrder(
  merchantId: string,
  data: Omit<CreateOrderRequest, "merchantId">
): Promise<ApiResponse<CreateOrderResult>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<CreateOrderResult>>(
    `/v1/merchant/${merchantId}/orders`,
    payload
  );
  return response?.data;
}

export async function listMerchantOrders(
  merchantId: string,
  params?: Omit<ReadListOrdersRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalOrder>>> {
  const { environment: _environment, ...rest } = params ?? {};

  try {
    const response = await client.get<ApiResponse<Paginated<MinimalOrder>>>(
      `/v1/merchant/${merchantId}/orders`,
      { params: rest }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível carregar os pedidos no momento." },
  };
}

export async function getMerchantOrder(
  merchantId: string,
  orderId: string
): Promise<ApiResponse<OrderDetails>> {
  try {
    const response = await client.get<ApiResponse<OrderDetails>>(
      `/v1/merchant/${merchantId}/orders/${orderId}`
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Pedido não encontrado." },
  };
}

export async function updateOrderFulfillment(
  merchantId: string,
  orderId: string,
  fulfillmentStatus: OrderFulfillmentStatus
): Promise<ApiResponse<UpdateOrderFulfillmentData>> {
  const response = await client.patch<ApiResponse<UpdateOrderFulfillmentData>>(
    `/v1/merchant/${merchantId}/orders/${orderId}/fulfillment`,
    { fulfillmentStatus }
  );
  return response?.data;
}

export async function cancelOrder(
  merchantId: string,
  orderId: string
): Promise<ApiResponse<{ success: boolean }>> {
  const response = await client.post<ApiResponse<{ success: boolean }>>(
    `/v1/merchant/${merchantId}/orders/${orderId}/cancel`
  );
  return response?.data;
}
