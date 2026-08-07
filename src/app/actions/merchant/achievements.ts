'use server';

import client from '@/clients/client';
import type { MerchantAchievementsData } from '@/types/merchant/achievements';
import type { ApiResponse } from '@/types/common';

export async function getAchievements(merchantId: string): Promise<ApiResponse<MerchantAchievementsData>> {
  const mockLevelInfo = {
    current: 'Bronze' as const,
    currentDisplayName: 'Nível Bronze',
    nextLevel: 'Silver' as const,
    nextLevelDisplayName: 'Nível Prata',
    totalVolume: 1543250,
    minThreshold: 0,
    maxThreshold: 5000000,
    progress: 30.8,
    borderImageUrl: null,
  };

  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        levelInfo: mockLevelInfo,
        achievements: [],
        levelBorders: [],
        selectedEmblemIds: [],
        selectedBorderLevel: null,
        selectedBorderImageUrl: null,
      },
      message: null,
      error: null,
    };
  }

  try {
    const response = await client.get<ApiResponse<MerchantAchievementsData>>(
      `/v1/merchant/${merchantId}/achievements`
    );
    return response?.data;
  } catch {
    return {
      data: {
        levelInfo: mockLevelInfo,
        achievements: [],
        levelBorders: [],
        selectedEmblemIds: [],
        selectedBorderLevel: null,
        selectedBorderImageUrl: null,
      },
      message: null,
      error: null,
    };
  }
}
export async function selectEmblem(achievementId: string | null): Promise<ApiResponse<null>> {
  const response = await client.patch<ApiResponse<null>>('/v1/users/emblem', {
    achievementId,
  });
  return response?.data;
}

export async function selectBorder(borderLevel: string | null): Promise<ApiResponse<null>> {
  const response = await client.patch<ApiResponse<null>>('/v1/users/border', {
    borderLevel,
  });
  return response?.data;
}
