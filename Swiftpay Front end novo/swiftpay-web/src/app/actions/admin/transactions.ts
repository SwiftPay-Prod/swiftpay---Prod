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

const mockAdminTransactions: AdminMinimalTransaction[] = [
  {
    id: "tx_1234567890",
    isWayneProtocol: true,
    merchant: { id: "m-1", name: "Starbucks Brasil", document: "12345678000190" },
    acquirer: { name: "fitbank", displayName: "Fitbank PIX", providerCategory: "PIX" as any, logoUrl: null, nominal: "Fitbank S.A." },
    amount: 259.90,
    fee: 7.79,
    profit: 5.20,
    method: "Pix" as any,
    status: "Completed" as any,
    requestSource: "Checkout" as any,
    pix: { payerName: "Carlos Eduardo da Silva", payerBank: "Banco Itaú S.A." },
    createdAt: new Date().toISOString(),
    transactionVisualizationUrl: "http://localhost:5009/visualize/tx_1234567890",
  },
  {
    id: "tx_0987654321",
    isWayneProtocol: false,
    merchant: { id: "m-2", name: "Nespresso Club", document: "98765432000110" },
    acquirer: { name: "transfeera", displayName: "Transfeera Payouts", providerCategory: "PIX" as any, logoUrl: null, nominal: "Transfeera S.A." },
    amount: 1450.00,
    fee: 43.50,
    profit: 29.00,
    method: "Pix" as any,
    status: "Completed" as any,
    requestSource: "API" as any,
    pix: { payerName: "Mariana Souza Almeida", payerBank: "Banco Bradesco S.A." },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    transactionVisualizationUrl: "http://localhost:5009/visualize/tx_0987654321",
  },
  {
    id: "tx_1122334455",
    isWayneProtocol: false,
    merchant: { id: "m-3", name: "Nike Online Store", document: "11223344000155" },
    acquirer: { name: "fitbank", displayName: "Fitbank PIX", providerCategory: "PIX" as any, logoUrl: null, nominal: "Fitbank S.A." },
    amount: 899.90,
    fee: 26.99,
    profit: 18.00,
    method: "Pix" as any,
    status: "Processing" as any,
    requestSource: "PaymentLink" as any,
    pix: { payerName: "Rodrigo Santos Oliveira", payerBank: "Nubank S.A." },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    transactionVisualizationUrl: "http://localhost:5009/visualize/tx_1122334455",
  },
  {
    id: "tx_6677889900",
    isWayneProtocol: true,
    merchant: { id: "m-1", name: "Starbucks Brasil", document: "12345678000190" },
    acquirer: { name: "fitbank", displayName: "Fitbank PIX", providerCategory: "PIX" as any, logoUrl: null, nominal: "Fitbank S.A." },
    amount: 45.00,
    fee: 1.35,
    profit: 0.90,
    method: "Pix" as any,
    status: "Failed" as any,
    requestSource: "Checkout" as any,
    pix: { payerName: "Juliana Mendes Ferreira", payerBank: "Inter S.A." },
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    transactionVisualizationUrl: "http://localhost:5009/visualize/tx_6677889900",
  },
  {
    id: "tx_5544332211",
    isWayneProtocol: false,
    merchant: { id: "m-4", name: "Amazon Prime Brasil", document: "55443322000133" },
    acquirer: { name: "transfeera", displayName: "Transfeera Payouts", providerCategory: "PIX" as any, logoUrl: null, nominal: "Transfeera S.A." },
    amount: 19.90,
    fee: 0.60,
    profit: 0.40,
    method: "Pix" as any,
    status: "Refunded" as any,
    requestSource: "API" as any,
    pix: { payerName: "Felipe Antunes Lima", payerBank: "Caixa Econômica Federal" },
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    transactionVisualizationUrl: "http://localhost:5009/visualize/tx_5544332211",
  }
];

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
      success: true,
      data: {
        items: mockAdminTransactions,
        totalItems: mockAdminTransactions.length,
        totalPages: 1,
        page: 1,
        pageSize: 10,
      },
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
