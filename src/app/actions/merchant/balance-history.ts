'use server';

import client from '@/clients/client';
import type { ApiResponse, Paginated } from '@/types/common';
import type {
  MinimalBalanceHistory,
  BalanceHistoryDetails,
  ListBalanceHistoryRequest,
} from '@/types/merchant/balance-history';
import { BankReconciliationStatus, PaymentEnvironment } from '@/types/enums';

const MOCK_BALANCE_HISTORY: MinimalBalanceHistory[] = [
  {
    id: 'rec_045',
    status: BankReconciliationStatus.Completed,
    environment: PaymentEnvironment.Production,
    previousBalance: 100000,
    newBalance: 125433,
    balanceChange: 25433,
    hasCorrections: false,
    totalCorrections: 0,
    processedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    correctionsAppliedAt: null,
  },
  {
    id: 'rec_044',
    status: BankReconciliationStatus.CorrectionsApplied,
    environment: PaymentEnvironment.Production,
    previousBalance: 125433,
    newBalance: 124933,
    balanceChange: -500,
    hasCorrections: true,
    totalCorrections: 2,
    processedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    correctionsAppliedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rec_043',
    status: BankReconciliationStatus.CompletedWithDiscrepancies,
    environment: PaymentEnvironment.Production,
    previousBalance: 124933,
    newBalance: 124933,
    balanceChange: 0,
    hasCorrections: true,
    totalCorrections: 1,
    processedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    correctionsAppliedAt: null,
  },
  {
    id: 'rec_042',
    status: BankReconciliationStatus.Completed,
    environment: PaymentEnvironment.Production,
    previousBalance: 89000,
    newBalance: 100000,
    balanceChange: 11000,
    hasCorrections: false,
    totalCorrections: 0,
    processedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    correctionsAppliedAt: null,
  },
];

export async function listBalanceHistory(
  merchantId: string,
  params?: ListBalanceHistoryRequest
): Promise<ApiResponse<Paginated<MinimalBalanceHistory>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: MOCK_BALANCE_HISTORY,
        page: 1,
        pageSize: 10,
        totalItems: MOCK_BALANCE_HISTORY.length,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<Paginated<MinimalBalanceHistory>>>(
      `/v1/merchant/${merchantId}/balance-history`,
      { params }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    data: {
      items: MOCK_BALANCE_HISTORY,
      page: 1,
      pageSize: 10,
      totalItems: MOCK_BALANCE_HISTORY.length,
      totalPages: 1,
    },
    message: null,
    error: null,
  };
}

export async function getBalanceHistoryDetails(
  merchantId: string,
  reconciliationId: string
): Promise<ApiResponse<BalanceHistoryDetails>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    const mock = MOCK_BALANCE_HISTORY.find((item) => item.id === reconciliationId) ?? MOCK_BALANCE_HISTORY[0]!;
    return {
      data: {
        id: mock.id,
        status: mock.status,
        environment: mock.environment,
        balance: {
          previousBalance: mock.previousBalance,
          newBalance: mock.newBalance,
          balanceChange: mock.balanceChange,
          isPositiveChange: mock.balanceChange > 0,
        },
        transactions: {
          totalPayments: 142,
          totalPaymentsAmount: 4825000,
          totalPayouts: 3,
          totalPayoutsAmount: 1250000,
          totalRefunds: 2,
          totalRefundsAmount: 36000,
          totalFees: 142,
          totalTransactionsAnalyzed: 289,
        },
        corrections: mock.hasCorrections
          ? [
              {
                id: 'corr_1',
                type: 'PaymentNotInLedger',
                typeLabel: 'Pagamento fora do razão',
                severity: 'High',
                severityLabel: 'Alta',
                description: 'Pagamento PIX registrado sem entrada correspondente no razão bancário.',
                suggestedAction: 'Reconciliar manualmente com o extrato bancário.',
                expectedAmount: 25000,
                actualAmount: 0,
                difference: 25000,
                wasCorrected: true,
                correctedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                correctionDescription: 'Entrada registrada manualmente.',
              },
            ]
          : [],
        processedAt: mock.processedAt,
        correctionsAppliedAt: mock.correctionsAppliedAt,
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<BalanceHistoryDetails>>(
      `/v1/merchant/${merchantId}/balance-history/${reconciliationId}`
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
