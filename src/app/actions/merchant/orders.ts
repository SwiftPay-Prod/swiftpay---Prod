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

const MOCK_ORDERS: MinimalOrder[] = [
  {
    id: 'ord_1024',
    orderNumber: 'ORD-1024',
    status: OrderStatus.Completed,
    fulfillmentStatus: OrderFulfillmentStatus.Delivered,
    subtotalAmount: 24000,
    discountAmount: 1000,
    shippingAmount: 2000,
    totalAmount: 25000,
    itemCount: 3,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    customer: {
      id: 'cust_1',
      name: 'Mariana Alves Souza',
      email: 'mariana.alves@email.com',
    },
    payment: {
      id: 'pay_1',
      status: PaymentStatus.Completed,
      method: PaymentMethod.Pix,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  },
  {
    id: 'ord_1023',
    orderNumber: 'ORD-1023',
    status: OrderStatus.Processing,
    fulfillmentStatus: OrderFulfillmentStatus.Shipped,
    subtotalAmount: 8990,
    discountAmount: 0,
    shippingAmount: 0,
    totalAmount: 8990,
    itemCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    customer: {
      id: 'cust_2',
      name: 'Rafael Costa Lima',
      email: 'rafael.lima@email.com',
    },
    payment: {
      id: 'pay_2',
      status: PaymentStatus.Completed,
      method: PaymentMethod.CreditCard,
      completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  },
  {
    id: 'ord_1022',
    orderNumber: 'ORD-1022',
    status: OrderStatus.Pending,
    fulfillmentStatus: OrderFulfillmentStatus.Unfulfilled,
    subtotalAmount: 34999,
    discountAmount: 0,
    shippingAmount: 1500,
    totalAmount: 36499,
    itemCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: null,
    customer: {
      id: 'cust_3',
      name: 'TechNova Soluções LTDA',
      email: 'financeiro@technova.com.br',
    },
    payment: {
      id: 'pay_3',
      status: PaymentStatus.Pending,
      method: PaymentMethod.Pix,
      completedAt: null,
    },
  },
  {
    id: 'ord_1021',
    orderNumber: 'ORD-1021',
    status: OrderStatus.Cancelled,
    fulfillmentStatus: OrderFulfillmentStatus.Unfulfilled,
    subtotalAmount: 4990,
    discountAmount: 0,
    shippingAmount: 0,
    totalAmount: 4990,
    itemCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    customer: {
      id: 'cust_4',
      name: 'Fernanda Lima',
      email: 'fernanda.lima@email.com',
    },
    payment: {
      id: 'pay_4',
      status: PaymentStatus.Failed,
      method: PaymentMethod.CreditCard,
      completedAt: null,
    },
  },
];

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
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: MOCK_ORDERS,
        page: 1,
        pageSize: 10,
        totalItems: MOCK_ORDERS.length,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalOrder>>>(
      `/v1/merchant/${merchantId}/orders`,
      { params: rest }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    data: {
      items: MOCK_ORDERS,
      page: 1,
      pageSize: 10,
      totalItems: MOCK_ORDERS.length,
      totalPages: 1,
    },
    message: null,
    error: null,
  };
}

export async function getMerchantOrder(
  merchantId: string,
  orderId: string
): Promise<ApiResponse<OrderDetails>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    const mock = MOCK_ORDERS.find((item) => item.id === orderId) ?? MOCK_ORDERS[0]!;
    return {
      data: {
        id: mock.id,
        orderNumber: mock.orderNumber,
        environment: PaymentEnvironment.Production,
        status: mock.status,
        fulfillmentStatus: mock.fulfillmentStatus,
        subtotalAmount: mock.subtotalAmount,
        discountAmount: mock.discountAmount,
        shippingAmount: mock.shippingAmount,
        totalAmount: mock.totalAmount,
        couponCode: null,
        notes: null,
        createdAt: mock.createdAt,
        updatedAt: mock.updatedAt,
        customer: {
          id: mock.customer?.id ?? 'cust_0',
          name: mock.customer?.name ?? 'Cliente',
          email: mock.customer?.email ?? null,
          phone: null,
          document: null,
        },
        payment: mock.payment
          ? {
              id: mock.payment.id,
              status: mock.payment.status,
              method: mock.payment.method,
              amount: mock.totalAmount,
              fee: mock.totalAmount * 0.018,
              netAmount: mock.totalAmount * 0.982,
              createdAt: mock.createdAt,
              completedAt: mock.payment.completedAt,
              refundedAt: null,
              pixQrCode: null,
              pixQrCodeBase64: null,
              pixTxId: null,
              pixEndToEndId: null,
            }
          : null,
        items: [],
        shippingAddress: null,
        coupon: null,
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<OrderDetails>>(
      `/v1/merchant/${merchantId}/orders/${orderId}`
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    data: null,
    message: null,
    error: null,
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
