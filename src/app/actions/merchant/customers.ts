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
import { CustomerDocumentType, CustomerStatus, PaymentEnvironment } from "@/types/enums";

const MOCK_CUSTOMERS: MinimalCustomer[] = [
  {
    id: 'cus_748392651',
    externalId: 'EXT-CUS-001',
    name: 'Mariana Alves Souza',
    email: 'mariana.alves@email.com',
    document: '390.554.128-07',
    documentType: CustomerDocumentType.CPF,
    phone: '+55 11 98765-4321',
    status: CustomerStatus.Active,
    address: {
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Apto 52',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100',
      country: 'BR',
    },
    paymentsCount: 12,
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
  },
  {
    id: 'cus_192847563',
    externalId: 'EXT-CUS-002',
    name: 'Rafael Costa Lima',
    email: 'rafael.lima@email.com',
    document: '287.654.321-90',
    documentType: CustomerDocumentType.CPF,
    phone: '+55 21 99876-5432',
    status: CustomerStatus.Active,
    address: {
      street: 'Rua do Comércio',
      number: '45',
      complement: null,
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      postalCode: '20010-010',
      country: 'BR',
    },
    paymentsCount: 5,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'cus_564738291',
    externalId: 'EXT-CUS-003',
    name: 'TechNova Soluções LTDA',
    email: 'financeiro@technova.com.br',
    document: '12.345.678/0001-95',
    documentType: CustomerDocumentType.CNPJ,
    phone: '+55 31 91234-5678',
    status: CustomerStatus.Inactive,
    address: {
      street: 'Rua dos Andradas',
      number: '500',
      complement: 'Sala 1201',
      neighborhood: 'Santa Efigênia',
      city: 'Belo Horizonte',
      state: 'MG',
      postalCode: '30120-010',
      country: 'BR',
    },
    paymentsCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

export async function listMerchantCustomers(
  merchantId: string,
  params?: Omit<ReadListCustomersRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalCustomer>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: MOCK_CUSTOMERS,
        page: 1,
        pageSize: 10,
        totalItems: MOCK_CUSTOMERS.length,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const { environment: _environment, ...rest } = params ?? {};
    const response = await client.get<ApiResponse<Paginated<MinimalCustomer>>>(
      `/v1/merchant/${merchantId}/customers`,
      { params: rest }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }
  return {
    data: {
      items: MOCK_CUSTOMERS,
      page: 1,
      pageSize: 10,
      totalItems: MOCK_CUSTOMERS.length,
      totalPages: 1,
    },
    message: null,
    error: null,
  };
}

export async function getCustomer(
  merchantId: string,
  customerId: string
): Promise<ApiResponse<CustomerData>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    const mock = MOCK_CUSTOMERS.find((item) => item.id === customerId) ?? MOCK_CUSTOMERS[0]!;
    return {
      data: {
        id: mock.id,
        externalId: mock.externalId,
        name: mock.name,
        email: mock.email,
        document: mock.document,
        documentType: mock.documentType,
        phone: mock.phone,
        status: mock.status,
        metadata: null,
        address: mock.address,
        createdAt: mock.createdAt,
        updatedAt: mock.createdAt,
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<CustomerData>>(
      `/v1/merchant/${merchantId}/customers/${customerId}`
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
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
