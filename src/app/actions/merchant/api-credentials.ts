"use server";

import client from "@/clients/client";
import type {
  ApiCredentialsFilters,
  CreateApiCredentialRequest,
  ApiCredentialData,
  ApiCredentialListData,
  DeleteApiCredentialData,
  RegenerateApiCredentialRequest,
  RegenerateApiCredentialData,
} from "@/types/merchant/api-credentials";
import type { ApiResponse, Paginated } from "@/types/common";

export async function listApiCredentials(
  merchantId: string,
  filters?: ApiCredentialsFilters
): Promise<ApiResponse<Paginated<ApiCredentialListData>>> {
  const params = new URLSearchParams();

  if (filters?.name) {
    params.append("name", filters.name);
  }
  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters?.sortBy) {
    params.append("sortBy", filters.sortBy);
  }
  if (filters?.sortOrder) {
    params.append("sortOrder", filters.sortOrder);
  }
  if (filters?.page) {
    params.append("page", String(filters.page));
  }
  if (filters?.pageSize) {
    params.append("pageSize", String(filters.pageSize));
  }

  const queryString = params.toString();
  const url = `/v1/merchant/${merchantId}/api-credentials${queryString ? `?${queryString}` : ""}`;

  const response = await client.get<ApiResponse<Paginated<ApiCredentialListData>>>(url);
  return response?.data;
}

export async function createApiCredential(
  merchantId: string,
  data: Omit<CreateApiCredentialRequest, "merchantId">
): Promise<ApiResponse<ApiCredentialData>> {
  const response = await client.post<ApiResponse<ApiCredentialData>>(
    `/v1/merchant/${merchantId}/api-credentials`,
    data
  );
  return response?.data;
}

export async function deleteApiCredential(
  merchantId: string,
  credentialId: string
): Promise<ApiResponse<DeleteApiCredentialData>> {
  const response = await client.delete<ApiResponse<DeleteApiCredentialData>>(
    `/v1/merchant/${merchantId}/api-credentials/${credentialId}`
  );
  return response?.data;
}

export async function regenerateApiCredential(
  merchantId: string,
  data: Omit<RegenerateApiCredentialRequest, "merchantId">
): Promise<ApiResponse<RegenerateApiCredentialData>> {
  const response = await client.post<ApiResponse<RegenerateApiCredentialData>>(
    `/v1/merchant/${merchantId}/api-credentials/${data.credentialId}/regenerate`,
    {}
  );
  return response?.data;
}
