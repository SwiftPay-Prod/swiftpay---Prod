'use server';

import client from '@/clients/client';
import type {
	AdminReadListReferralsRequest,
	AdminReferralsData,
	AdminReadListReferralCommissionWithdrawalRequestsRequest,
	AdminMinimalReferralCommissionWithdrawalRequest,
	AdminReferralCommissionWithdrawalRequestDetails,
	AdminEvaluateReferralCommissionWithdrawalRequestRequest,
	AdminEvaluateReferralCommissionWithdrawalRequestData,
} from '@/types/admin/referrals';
import type { ApiResponse, Paginated } from '@/types/common';

export async function adminListReferrals(
	params?: AdminReadListReferralsRequest
): Promise<ApiResponse<AdminReferralsData>> {
	const response = await client.get<ApiResponse<AdminReferralsData>>('/v1/admin/referrals', {
		params,
	});
	return response?.data;
}

export async function adminListReferralCommissionWithdrawalRequests(
	params?: AdminReadListReferralCommissionWithdrawalRequestsRequest
): Promise<ApiResponse<Paginated<AdminMinimalReferralCommissionWithdrawalRequest>>> {
	const response = await client.get<ApiResponse<Paginated<AdminMinimalReferralCommissionWithdrawalRequest>>>(
		'/v1/admin/referrals/withdrawal-requests',
		{ params }
	);
	return response?.data;
}

export async function adminGetReferralCommissionWithdrawalRequest(
	requestId: string
): Promise<ApiResponse<AdminReferralCommissionWithdrawalRequestDetails>> {
	const response = await client.get<ApiResponse<AdminReferralCommissionWithdrawalRequestDetails>>(
		`/v1/admin/referrals/withdrawal-requests/${requestId}`
	);
	return response?.data;
}

export async function adminEvaluateReferralCommissionWithdrawalRequest(
	requestId: string,
	data: AdminEvaluateReferralCommissionWithdrawalRequestRequest
): Promise<ApiResponse<AdminEvaluateReferralCommissionWithdrawalRequestData>> {
	const response = await client.post<ApiResponse<AdminEvaluateReferralCommissionWithdrawalRequestData>>(
		`/v1/admin/referrals/withdrawal-requests/${requestId}/evaluate`,
		{
			status: data.status,
			amount: data.amount ?? null,
			notes: data.notes?.trim() || null,
			reason: data.reason?.trim() || null,
			receiptFileId: data.receiptFileId || null,
		}
	);
	return response?.data;
}