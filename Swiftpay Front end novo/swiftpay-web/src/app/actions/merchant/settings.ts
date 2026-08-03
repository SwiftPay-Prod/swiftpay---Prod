"use server";

import client from "@/clients/client";
import type {
  ReadSettingsData,
  ReadFeesData,
  ReadNominalsData,
  ReadNominalsHistoryData,
  ReadNominalAbTestHistoryData,
  SwitchNominalRequest,
  SwitchNominalData,
  UpdateNominalAbTestRequest,
  UpdateNominalAbTestData,
} from "@/types/merchant/settings";
import type { UpdateMerchantAutoCashoutRequest } from "@/types/automatic-cashout";
import type { ApiResponse } from "@/types/common";

export async function getMerchantSettings(
  merchantId: string
): Promise<ApiResponse<ReadSettingsData>> {
  const response = await client.get<ApiResponse<ReadSettingsData>>(
    `/v1/merchant/${merchantId}/settings`
  );
  return response?.data;
}

export async function getMerchantFees(
  merchantId: string
): Promise<ApiResponse<ReadFeesData>> {
  const response = await client.get<ApiResponse<ReadFeesData>>(
    `/v1/merchant/${merchantId}/fees`
  );
  return response?.data;
}

export async function updateMerchantSettings(
  merchantId: string,
  data: Omit<UpdateMerchantAutoCashoutRequest, "merchantId">
): Promise<ApiResponse<ReadSettingsData>> {
  const response = await client.patch<ApiResponse<ReadSettingsData>>(
    `/v1/merchant/${merchantId}/settings`,
    data
  );
  return response?.data;
}

export async function getMerchantNominals(
  merchantId: string
): Promise<ApiResponse<ReadNominalsData>> {
  const response = await client.get<ApiResponse<ReadNominalsData>>(
    `/v1/merchant/${merchantId}/nominals`
  );
  return response?.data;
}

export async function switchMerchantNominal(
  merchantId: string,
  data: SwitchNominalRequest
): Promise<ApiResponse<SwitchNominalData>> {
  const response = await client.patch<ApiResponse<SwitchNominalData>>(
    `/v1/merchant/${merchantId}/nominals/current`,
    data
  );
  return response?.data;
}

export async function getMerchantNominalsHistory(
  merchantId: string
): Promise<ApiResponse<ReadNominalsHistoryData>> {
  const response = await client.get<ApiResponse<ReadNominalsHistoryData>>(
    `/v1/merchant/${merchantId}/nominals/history`
  );
  return response?.data;
}

export async function updateMerchantNominalAbTest(
  merchantId: string,
  data: UpdateNominalAbTestRequest
): Promise<ApiResponse<UpdateNominalAbTestData>> {
  const response = await client.patch<ApiResponse<UpdateNominalAbTestData>>(
    `/v1/merchant/${merchantId}/nominals/ab-test`,
    data
  );
  return response?.data;
}

export async function getMerchantNominalAbTestHistory(
  merchantId: string
): Promise<ApiResponse<ReadNominalAbTestHistoryData>> {
  const response = await client.get<ApiResponse<ReadNominalAbTestHistoryData>>(
    `/v1/merchant/${merchantId}/nominals/ab-test/history`
  );
  return response?.data;
}
