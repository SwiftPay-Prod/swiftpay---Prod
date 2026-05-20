"use server";

import client from "@/clients/client";
import type {
  DigitalItemData,
  DigitalItemStats,
  ReadListDigitalItemsData,
  CreateDigitalItemRequest,
  CreateBulkDigitalItemsRequest,
  CreateBulkDigitalItemsResponse,
  UpdateDigitalItemRequest,
  ReadListDigitalItemsRequest,
} from "@/types/merchant/digital-items";
import type { ApiResponse } from "@/types/common";

export async function listProductDigitalItems(
  merchantId: string,
  productId: string,
  params?: Omit<ReadListDigitalItemsRequest, "merchantId" | "productId">
): Promise<ApiResponse<ReadListDigitalItemsData>> {
  const response = await client.get<ApiResponse<ReadListDigitalItemsData>>(
    `/v1/merchant/${merchantId}/products/${productId}/digital-items`,
    { params }
  );
  return response?.data;
}

export async function createProductDigitalItem(
  merchantId: string,
  productId: string,
  data: Omit<CreateDigitalItemRequest, "merchantId" | "productId">
): Promise<ApiResponse<DigitalItemData>> {
  const response = await client.post<ApiResponse<DigitalItemData>>(
    `/v1/merchant/${merchantId}/products/${productId}/digital-items`,
    data
  );
  return response?.data;
}

export async function createBulkProductDigitalItems(
  merchantId: string,
  productId: string,
  data: Omit<CreateBulkDigitalItemsRequest, "merchantId" | "productId">
): Promise<ApiResponse<CreateBulkDigitalItemsResponse>> {
  const response = await client.post<ApiResponse<CreateBulkDigitalItemsResponse>>(
    `/v1/merchant/${merchantId}/products/${productId}/digital-items/bulk`,
    data
  );
  return response?.data;
}

export async function updateProductDigitalItem(
  merchantId: string,
  productId: string,
  digitalItemId: string,
  data: UpdateDigitalItemRequest
): Promise<ApiResponse<DigitalItemData>> {
  const response = await client.patch<ApiResponse<DigitalItemData>>(
    `/v1/merchant/${merchantId}/products/${productId}/digital-items/${digitalItemId}`,
    data
  );
  return response?.data;
}

export async function deleteProductDigitalItem(
  merchantId: string,
  productId: string,
  digitalItemId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/products/${productId}/digital-items/${digitalItemId}`
  );
  return response?.data;
}

export async function getProductDigitalItemStats(
  merchantId: string,
  productId: string
): Promise<ApiResponse<DigitalItemStats>> {
  const response = await client.get<ApiResponse<DigitalItemStats>>(
    `/v1/merchant/${merchantId}/products/${productId}/digital-items/stats`
  );
  return response?.data;
}
