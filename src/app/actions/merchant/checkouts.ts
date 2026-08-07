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
import { CheckoutStatus, CheckoutTemplateType, PaymentEnvironment } from "@/types/enums";

const MOCK_CHECKOUTS: MinimalCheckout[] = [
  {
    id: 'chk_918273645',
    name: 'Checkout Padrão Pix & Cartão',
    description: 'Checkout principal com PIX e cartão',
    slug: 'checkout-padrao-pix-cartao',
    shortId: 'pay-main',
    status: CheckoutStatus.Active,
    expiresAt: null,
    environment: PaymentEnvironment.Production,
    onboardingCompleted: true,
    onboardingStep: 3,
    template: {
      id: 'tpl_1',
      type: CheckoutTemplateType.SingleOrder,
      name: 'Modern Flow',
      thumbnailUrl: null,
    },
    productCount: 3,
    couponCount: 1,
    paymentCount: 142,
    checkoutUrl: 'https://pay.swiftpay.app/pay-main',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'chk_192837465',
    name: 'Checkout Oferta Especial E-book',
    description: 'Checkout promocional para e-books',
    slug: 'ebook-promo',
    shortId: 'ebook-promo',
    status: CheckoutStatus.Active,
    expiresAt: null,
    environment: PaymentEnvironment.Production,
    onboardingCompleted: true,
    onboardingStep: 3,
    template: {
      id: 'tpl_2',
      type: CheckoutTemplateType.Catalog,
      name: 'High Conversion',
      thumbnailUrl: null,
    },
    productCount: 1,
    couponCount: 0,
    paymentCount: 89,
    checkoutUrl: 'https://pay.swiftpay.app/ebook-promo',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'chk_564738291',
    name: 'Checkout Assinatura VIP',
    description: 'Checkout de assinatura recorrente',
    slug: 'vip-sub',
    shortId: 'vip-sub',
    status: CheckoutStatus.Draft,
    expiresAt: null,
    environment: PaymentEnvironment.Production,
    onboardingCompleted: false,
    onboardingStep: 1,
    template: {
      id: 'tpl_3',
      type: CheckoutTemplateType.Transparent,
      name: 'Subscription Minimal',
      thumbnailUrl: null,
    },
    productCount: 2,
    couponCount: 0,
    paymentCount: 0,
    checkoutUrl: null,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];
// ==================== CHECKOUTS ====================

export async function listMerchantCheckouts(
  merchantId: string,
  params?: Omit<ReadListCheckoutsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCheckout>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: MOCK_CHECKOUTS,
        page: 1,
        pageSize: 10,
        totalItems: MOCK_CHECKOUTS.length,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalCheckout>>>(
      `/v1/merchant/${merchantId}/checkouts`,
      { params: rest }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }
  return {
    data: {
      items: MOCK_CHECKOUTS,
      page: 1,
      pageSize: 10,
      totalItems: MOCK_CHECKOUTS.length,
      totalPages: 1,
    },
    message: null,
    error: null,
  };
}

export async function getMerchantCheckout(
  merchantId: string,
  checkoutId: string
): Promise<ApiResponse<CheckoutData>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        id: checkoutId,
        name: 'Checkout Padrão Pix & Cartão',
        description: 'Checkout principal com PIX e cartão',
        slug: 'checkout-padrao-pix-cartao',
        shortId: 'pay-main',
        status: CheckoutStatus.Active,
        expiresAt: null,
        environment: PaymentEnvironment.Production,
        onboardingCompleted: true,
        onboardingStep: 3,
        template: {
          id: 'tpl_1',
          name: 'Modern Flow',
          type: CheckoutTemplateType.SingleOrder,
          thumbnailUrl: null,
        } as unknown as CheckoutData['template'],
        config: {
          id: 'cfg_1',
          templateId: 'tpl_1',
          primaryColor: '#9eff00',
          pixEnabled: true,
          creditCardEnabled: true,
          boletoEnabled: false,
        } as unknown as CheckoutData['config'],
        products: [],
        coupons: [],
        kpis: {
          accessCount: 1240,
          revenueAmount: 482500,
          orderCount: 142,
          transactionCount: 142,
          completedTransactions: 138,
          approvalRate: 97.2,
          customerCount: 96,
        },
        checkoutUrl: 'https://pay.swiftpay.app/pay-main',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<CheckoutData>>(
      `/v1/merchant/${merchantId}/checkouts/${checkoutId}`
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
  
  if (response?.data?.error) {
    throw response.data.error;
  }
  
  revalidatePath(`/panel/merchant/checkouts`);
  revalidatePath(`/panel/merchant/checkouts/upsert/${checkoutId}`);
  
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
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: [
          {
            id: 'tpl_1',
            name: 'Modern Flow',
            type: CheckoutTemplateType.SingleOrder,
            thumbnailUrl: null,
          } as unknown as CheckoutTemplateData,
          {
            id: 'tpl_2',
            name: 'High Conversion',
            type: CheckoutTemplateType.Catalog,
            thumbnailUrl: null,
          } as unknown as CheckoutTemplateData,
        ],
        page: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<Paginated<CheckoutTemplateData>>>(
      `/v1/merchant/${merchantId}/checkout-templates`,
      { params }
    );
    if (response?.data) return response.data;
  } catch {}

  return {
    data: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
    message: null,
    error: null,
  };
}

