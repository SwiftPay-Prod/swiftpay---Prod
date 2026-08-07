"use server";

import client from "@/clients/client";
import type {
  ReadListCustomersRequest,
  MinimalCustomer,
  CustomerData,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/types/merchant/customers";
import type { ApiResponse, Paginated } from "@/types/common";

export async function listMerchantCustomers(
  merchantId: string,
  params?: Omit<ReadListCustomersRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCustomer>>> {
  const { environment: _environment, ...rest } = params ?? {};

  try {
    const response = await client.get<ApiResponse<Paginated<MinimalCustomer>>>(
      `/v1/merchant/${merchantId}/customers`,
      { params: rest }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível carregar os clientes no momento." },
  };
}

export async function getCustomer(
  merchantId: string,
  customerId: string
): Promise<ApiResponse<CustomerData>> {
  try {
    const response = await client.get<ApiResponse<CustomerData>>(
      `/v1/merchant/${merchantId}/customers/${customerId}`
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Cliente não encontrado." },
  };
}

export async function createCustomer(
  merchantId: string,
  data: Omit<CreateCustomerRequest, "merchantId">
): Promise<ApiResponse<CustomerData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.post<ApiResponse<CustomerData>>(
    `/v1/merchant/${merchantId}/customers`,
    payload
  );
  return response?.data;
}

export async function updateCustomer(
  merchantId: string,
  customerId: string,
  data: Omit<UpdateCustomerRequest, "merchantId" | "customerId">
): Promise<ApiResponse<CustomerData>> {
  const { environment: _environment, ...payload } = data;
  const response = await client.patch<ApiResponse<CustomerData>>(
    `/v1/merchant/${merchantId}/customers/${customerId}`,
    payload
  );
  return response?.data;
}

export async function deleteCustomer(
  merchantId: string,
  customerId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/merchant/${merchantId}/customers/${customerId}`
  );
  return response?.data;
}
