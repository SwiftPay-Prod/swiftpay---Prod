'use server';

import client from '@/clients/client';
import type { MerchantAchievementsData } from '@/types/merchant/achievements';
import type { ApiResponse } from '@/types/common';

export async function getAchievements(merchantId: string): Promise<ApiResponse<MerchantAchievementsData>> {
  const response = await client.get<ApiResponse<MerchantAchievementsData>>(
    `/v1/merchant/${merchantId}/achievements`
  );
  return response?.data;
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
