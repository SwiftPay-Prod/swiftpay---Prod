"use server";

import client from "@/clients/client";
import type {
  AdminMinimalReconciliation,
  AdminReconciliationDetails,
  AdminStartReconciliationRequest,
  AdminListReconciliationsRequest,
  AdminApplyReconciliationCorrectionsData,
  AdminStartAllReconciliationsRequest,
} from "@/types/admin/reconciliation";
import type { ApiResponse, Paginated } from "@/types/common";

export async function adminStartReconciliation(
  data: AdminStartReconciliationRequest
): Promise<ApiResponse<AdminReconciliationDetails>> {
  const response = await client.post<ApiResponse<AdminReconciliationDetails>>(
    "/v1/admin/reconciliations/start",
    data
  );
  return response?.data;
}

export async function adminGetReconciliation(
  reconciliationId: string
): Promise<ApiResponse<AdminReconciliationDetails>> {
  const response = await client.get<ApiResponse<AdminReconciliationDetails>>(
    `/v1/admin/reconciliations/${reconciliationId}`
  );
  return response?.data;
}

export async function adminListReconciliations(
  params?: AdminListReconciliationsRequest
): Promise<ApiResponse<Paginated<AdminMinimalReconciliation>>> {
  const response = await client.get<ApiResponse<Paginated<AdminMinimalReconciliation>>>(
    "/v1/admin/reconciliations",
    { params }
  );
  return response?.data;
}

export async function adminApplyReconciliationCorrections(
  reconciliationId: string
): Promise<ApiResponse<AdminApplyReconciliationCorrectionsData>> {
  const response = await client.post<ApiResponse<AdminApplyReconciliationCorrectionsData>>(
    `/v1/admin/reconciliations/${reconciliationId}/apply`,
    {}
  );
  return response?.data;
}

export async function adminStartAllReconciliations(
  data: AdminStartAllReconciliationsRequest
): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>(
    "/v1/admin/reconciliations/start-all",
    data
  );
  return response?.data;
}
