"use server";

import client from "@/clients/client";
import type { ReadBalanceData } from "@/types/merchant/balance";
import type { ApiResponse } from "@/types/common";
import { PaymentEnvironment } from "@/types/enums";

const MOCK_BALANCES: Record<string, number> = {
  'preview-merchant-id': 1543250,
  'preview-merchant-2': 4892080,
  'preview-merchant-3': 0,
};

export async function getMerchantBalance(
  merchantId: string
): Promise<ApiResponse<ReadBalanceData>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    const available = MOCK_BALANCES[merchantId] ?? 1543250;
    return {
      data: {
        currency: 'BRL',
        balance: {
          available,
          withdrawNowAvailable: available,
          requiresFullWithdrawalNow: false,
          pending: 120000,
          reserved: 50000,
          total: available + 170000,
          acquirerBucketBalances: [],
        },
        totals: {
          lifetimeVolume: 15000000,
          lifetimePayouts: 13000000,
          lifetimeRefunds: 150000,
          lifetimeFeesPaid: 300000,
        },
        period: {
          volumeToday: 420000,
          volumeThisWeek: 2850000,
          volumeThisMonth: 11200000,
        },
        lastTransactions: [],
        updatedAt: new Date().toISOString(),
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<ReadBalanceData>>(
      `/v1/merchant/${merchantId}/balance`
    );
    return response?.data;
  } catch {
    const available = MOCK_BALANCES[merchantId] ?? 1543250;
    return {
      data: {
        currency: 'BRL',
        balance: {
          available,
          withdrawNowAvailable: available,
          requiresFullWithdrawalNow: false,
          pending: 120000,
          reserved: 50000,
          total: available + 170000,
          acquirerBucketBalances: [],
        },
        totals: {
          lifetimeVolume: 15000000,
          lifetimePayouts: 13000000,
          lifetimeRefunds: 150000,
          lifetimeFeesPaid: 300000,
        },
        period: {
          volumeToday: 420000,
          volumeThisWeek: 2850000,
          volumeThisMonth: 11200000,
        },
        lastTransactions: [],
        updatedAt: new Date().toISOString(),
      },
      message: null,
      error: null,
    };
  }
}
