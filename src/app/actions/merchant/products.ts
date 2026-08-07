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

export async function listMerchantProducts(
  merchantId: string,
  params?: Omit<ReadListProductsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalProductData>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<MinimalProductData>>>(
    `/v1/merchant/${merchantId}/products`,
    { params: rest }
  );
  return response?.data;
}

export async function getMerchantProduct(
  merchantId: string,
  productId: string
): Promise<ApiResponse<ProductData>> {
  const response = await client.get<ApiResponse<ProductData>>(
    `/v1/merchant/${merchantId}/products/${productId}`
  );
  return response?.data;
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

export async function listMerchantCategories(
  merchantId: string,
  params?: Omit<ReadListCategoriesRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCategoryData>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<MinimalCategoryData>>>(
    `/v1/merchant/${merchantId}/categories`,
    { params: rest }
  );
  return response?.data;
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
