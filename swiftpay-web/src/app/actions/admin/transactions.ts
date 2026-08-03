"use server";

import client from "@/clients/client";
import type {
  AdminListTransactionsRequest,
  AdminMinimalTransaction,
  AdminTransactionDetails,
  AdminTransactionLedgerData,
  AdminReprocessCompletedTransactionDevData,
  AdminForceAcquirerWebhookDevData,
  AdminForceAcquirerWebhookRequest,
  AdminReprocessTransactionRequest,
} from "@/types/admin/transactions";
import type { ApiResponse, Paginated } from "@/types/common";
import { PaymentEnvironment, PaymentMethod, PaymentRequestSource, PaymentStatus } from "@/types/enums";

const mockAdminTransactions: AdminMinimalTransaction[] = [];

export async function adminListTransactions(
  params?: AdminListTransactionsRequest
): Promise<ApiResponse<Paginated<AdminMinimalTransaction>>> {
  try {
    const response = await client.get<ApiResponse<Paginated<AdminMinimalTransaction>>>(
      "/v1/admin/transactions",
      { params }
    );
    return response?.data;
  } catch (error) {
    console.warn(`[adminListTransactions] Falha ao conectar ao backend. Retornando dados simulados.`);
    return {
      data: {
        items: mockAdminTransactions,
        totalItems: mockAdminTransactions.length,
        totalPages: 1,
        page: 1,
        pageSize: 10,
      },
      message: null,
      error: null,
    };
  }
}

export async function adminGetTransaction(
  transactionId: string
): Promise<ApiResponse<AdminTransactionDetails>> {
  const response = await client.get<ApiResponse<AdminTransactionDetails>>(
    `/v1/admin/transactions/${transactionId}`
  );
  return response?.data;
}

export async function adminGetTransactionLedger(
  transactionId: string
): Promise<ApiResponse<AdminTransactionLedgerData>> {
  const response = await client.get<ApiResponse<AdminTransactionLedgerData>>(
    `/v1/admin/transactions/${transactionId}/ledger`
  );
  return response?.data;
}

export async function adminReprocessCompletedTransactionDev(
  transactionId: string,
  data: AdminReprocessTransactionRequest
): Promise<ApiResponse<AdminReprocessCompletedTransactionDevData>> {
  const response = await client.post<ApiResponse<AdminReprocessCompletedTransactionDevData>>(
    `/v1/admin/transactions/${transactionId}/dev/reprocess-completed`,
    data
  );
  return response?.data;
}

export async function adminForceAcquirerWebhookDev(
  transactionId: string,
  data: AdminForceAcquirerWebhookRequest
): Promise<ApiResponse<AdminForceAcquirerWebhookDevData>> {
  const response = await client.post<ApiResponse<AdminForceAcquirerWebhookDevData>>(
    `/v1/admin/transactions/${transactionId}/dev/force-acquirer-webhook`,
    data
  );
  return response?.data;
}
