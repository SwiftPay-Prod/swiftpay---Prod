"use server";

import client from "@/clients/client";
import type {
  ProductData,
  MinimalProductData,
  CreateProductRequest,
  UpdateProductRequest,
  ReadListProductsRequest,
  CategoryData,
  MinimalCategoryData,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ReadListCategoriesRequest,
  VariantData,
  CreateVariantRequest,
  UpdateVariantRequest,
  ReadListVariantsRequest,
  StockAdjustmentRequest,
  StockAdjustmentData,
  StockMovementData,
  ListStockMovementsRequest,
} from "@/types/merchant/products";
import type { ApiResponse, Paginated } from "@/types/common";
import { ProductType, ProductStatus, CategoryStatus, PaymentEnvironment } from "@/types/enums";

const MOCK_PRODUCTS: MinimalProductData[] = [
  {
    id: 'prd_102938475',
    externalId: 'EXT-DIG-01',
    name: 'E-book Dominando Gateway de Pagamentos',
    description: 'Guia definitivo de integração e fintechs',
    type: ProductType.Digital,
    price: 4990,
    stockQuantity: null,
    imageUrl: null,
    imageUrls: [],
    status: ProductStatus.Active,
    environment: PaymentEnvironment.Production,
    isUnlimitedDigitalStock: true,
    digitalItemsPerPurchase: 1,
    digitalItemsCount: 50,
    durationMinutes: null,
    locationType: null,
    categoryCount: 1,
    variantCount: 0,
    couponCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'prd_564738291',
    externalId: 'EXT-DIG-02',
    name: 'Curso Avançado SwiftPay Pro',
    description: 'Aulas em vídeo e suporte prioritário',
    type: ProductType.Digital,
    price: 29700,
    stockQuantity: null,
    imageUrl: null,
    imageUrls: [],
    status: ProductStatus.Active,
    environment: PaymentEnvironment.Production,
    isUnlimitedDigitalStock: true,
    digitalItemsPerPurchase: 1,
    digitalItemsCount: 100,
    durationMinutes: null,
    locationType: null,
    categoryCount: 2,
    variantCount: 1,
    couponCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'prd_987654321',
    externalId: 'EXT-PHY-01',
    name: 'Maquininha SwiftPay Smart POS',
    description: 'Terminal de pagamentos portátil',
    type: ProductType.Physical,
    price: 49900,
    stockQuantity: 45,
    imageUrl: null,
    imageUrls: [],
    status: ProductStatus.Active,
    environment: PaymentEnvironment.Production,
    isUnlimitedDigitalStock: false,
    digitalItemsPerPurchase: 0,
    digitalItemsCount: 0,
    durationMinutes: null,
    locationType: null,
    categoryCount: 1,
    variantCount: 2,
    couponCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export async function listMerchantProducts(
  merchantId: string,
  params?: Omit<ReadListProductsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalProductData>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    const requestedType = params?.type;
    const filtered = requestedType
      ? MOCK_PRODUCTS.filter((p) => p.type === requestedType)
      : MOCK_PRODUCTS;

    return {
      data: {
        items: filtered,
        page: 1,
        pageSize: 10,
        totalItems: filtered.length,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalProductData>>>(
      `/v1/merchant/${merchantId}/products`,
      { params: rest }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    data: {
      items: [],
      page: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0,
    },
    message: null,
    error: null,
  };
}

export async function getMerchantProduct(
  merchantId: string,
  productId: string
): Promise<ApiResponse<ProductData>> {
  try {
    const response = await client.get<ApiResponse<ProductData>>(
      `/v1/merchant/${merchantId}/products/${productId}`
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

export async function createMerchantProduct(
  merchantId: string,
  data: CreateProductRequest
): Promise<ApiResponse<ProductData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<ProductData>>(
    `/v1/merchant/${merchantId}/products`,
    payload
  );
  return response?.data;
}

export async function updateMerchantProduct(
  merchantId: string,
  productId: string,
  data: UpdateProductRequest
): Promise<ApiResponse<ProductData>> {
  const response = await client.patch<ApiResponse<ProductData>>(
    `/v1/merchant/${merchantId}/products/${productId}`,
    data
  );
  return response?.data;
}

export async function updateMerchantProductStatus(
  merchantId: string,
  productId: string,
  status: NonNullable<UpdateProductRequest["status"]>
): Promise<ApiResponse<ProductData>> {
  const response = await client.patch<ApiResponse<ProductData>>(
    `/v1/merchant/${merchantId}/products/${productId}`,
    { status }
  );
  return response?.data;
}

export async function deleteMerchantProduct(
  merchantId: string,
  productId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/products/${productId}`
  );
  return response?.data;
}

// ==================== CATEGORIES ====================

export async function listMerchantCategories(
  merchantId: string,
  params?: Omit<ReadListCategoriesRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCategoryData>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: [
          {
            id: 'cat_1',
            externalId: 'CAT-EBOOK',
            name: 'E-books & Guias',
            status: CategoryStatus.Active,
            environment: PaymentEnvironment.Production,
            productCount: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'cat_2',
            externalId: 'CAT-CURSO',
            name: 'Cursos & Treinamentos',
            status: CategoryStatus.Active,
            environment: PaymentEnvironment.Production,
            productCount: 1,
            createdAt: new Date().toISOString(),
          },
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
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalCategoryData>>>(
      `/v1/merchant/${merchantId}/categories`,
      { params: rest }
    );
    if (response?.data) return response.data;
  } catch {}

  return {
    data: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
    message: null,
    error: null,
  };
}

export async function createMerchantCategory(
  merchantId: string,
  data: CreateCategoryRequest
): Promise<ApiResponse<CategoryData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<CategoryData>>(
    `/v1/merchant/${merchantId}/categories`,
    payload
  );
  return response?.data;
}

export async function updateMerchantCategory(
  merchantId: string,
  categoryId: string,
  data: UpdateCategoryRequest
): Promise<ApiResponse<CategoryData>> {
  const response = await client.patch<ApiResponse<CategoryData>>(
    `/v1/merchant/${merchantId}/categories/${categoryId}`,
    data
  );
  return response?.data;
}

export async function deleteMerchantCategory(
  merchantId: string,
  categoryId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/categories/${categoryId}`
  );
  return response?.data;
}

// ==================== VARIANTS ====================

export async function listProductVariants(
  merchantId: string,
  productId: string,
  params?: Omit<ReadListVariantsRequest, "merchantId" | "productId">
): Promise<ApiResponse<Paginated<VariantData>>> {
  const response = await client.get<ApiResponse<Paginated<VariantData>>>(
    `/v1/merchant/${merchantId}/products/${productId}/variants`,
    { params }
  );
  return response?.data;
}

export async function getProductVariant(
  merchantId: string,
  productId: string,
  variantId: string
): Promise<ApiResponse<VariantData>> {
  const response = await client.get<ApiResponse<VariantData>>(
    `/v1/merchant/${merchantId}/products/${productId}/variants/${variantId}`
  );
  return response?.data;
}

export async function createProductVariant(
  merchantId: string,
  productId: string,
  data: CreateVariantRequest
): Promise<ApiResponse<VariantData>> {
  const response = await client.post<ApiResponse<VariantData>>(
    `/v1/merchant/${merchantId}/products/${productId}/variants`,
    data
  );
  return response?.data;
}

export async function updateProductVariant(
  merchantId: string,
  productId: string,
  variantId: string,
  data: UpdateVariantRequest
): Promise<ApiResponse<VariantData>> {
  const response = await client.patch<ApiResponse<VariantData>>(
    `/v1/merchant/${merchantId}/products/${productId}/variants/${variantId}`,
    data
  );
  return response?.data;
}

export async function deleteProductVariant(
  merchantId: string,
  productId: string,
  variantId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/products/${productId}/variants/${variantId}`
  );
  return response?.data;
}

// ==================== STOCK ====================

export async function adjustProductStock(
  merchantId: string,
  productId: string,
  data: StockAdjustmentRequest
): Promise<ApiResponse<StockAdjustmentData>> {
  const response = await client.post<ApiResponse<StockAdjustmentData>>(
    `/v1/merchant/${merchantId}/products/${productId}/stock/adjust`,
    data
  );
  return response?.data;
}

export async function listStockMovements(
  merchantId: string,
  productId: string,
  params?: ListStockMovementsRequest
): Promise<ApiResponse<Paginated<StockMovementData>>> {
  const response = await client.get<ApiResponse<Paginated<StockMovementData>>>(
    `/v1/merchant/${merchantId}/products/${productId}/stock/movements`,
    { params }
  );
  return response?.data;
}
