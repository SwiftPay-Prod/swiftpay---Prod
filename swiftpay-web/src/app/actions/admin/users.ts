'use server';

import client from '@/clients/client';
import { UserRole } from '@/types/enums';
import type {
	AdminReadListUsersRequest,
	AdminMinimalUser,
	AdminUserDetails,
	AdminUpdateUserRequest,
	AdminUpdateUserReferralSettingsRequest,
	AdminUpdateUserReferralSettingsData,
	AdminUpdateUserRoleData,
	AdminAssignUserReferrerRequest,
	AdminAssignUserReferrerData,
	AdminPreviewAssignUserReferrerData,
	AdminCreateReferralCommissionPaymentRequest,
	AdminReferralCommissionPaymentData,
	AdminSuspendFromRankingRequest,
} from '@/types/admin/users';
import type { UserReferralsData } from '@/types/user/referrals';
import type { UserReferralReferredUserMovementsData } from '@/types/user/referrals';
import type { ApiResponse, Paginated } from '@/types/common';

export async function adminListUsers(
	params?: AdminReadListUsersRequest
): Promise<ApiResponse<Paginated<AdminMinimalUser>>> {
	const response = await client.get<ApiResponse<Paginated<AdminMinimalUser>>>('/v1/admin/users', {
		params,
	});
	return response?.data;
}

export async function adminGetUser(userId: string): Promise<ApiResponse<AdminUserDetails>> {
	const response = await client.get<ApiResponse<AdminUserDetails>>(`/v1/admin/users/${userId}`);
	return response?.data;
}

export async function adminGetUserReferrals(userId: string): Promise<ApiResponse<UserReferralsData>> {
	const response = await client.get<ApiResponse<UserReferralsData>>(`/v1/admin/users/${userId}/referrals`);
	return response?.data;
}

export async function adminGetReferredUserMovements(
	userId: string,
	referredUserId: string,
	page = 1,
	pageSize = 10
): Promise<ApiResponse<UserReferralReferredUserMovementsData>> {
	const response = await client.get<ApiResponse<UserReferralReferredUserMovementsData>>(
		`/v1/admin/users/${userId}/referrals/referred-users/${referredUserId}/movements`,
		{
			params: { page, pageSize },
		}
	);
	return response?.data;
}

export async function adminUpdateUser(
	userId: string,
	data: Omit<AdminUpdateUserRequest, 'userId'>
): Promise<ApiResponse<AdminUserDetails>> {
	const response = await client.patch<ApiResponse<AdminUserDetails>>(`/v1/admin/users/${userId}`, data);
	return response?.data;
}

export async function adminActivateUser(userId: string): Promise<ApiResponse<AdminUserDetails>> {
	const response = await client.post<ApiResponse<AdminUserDetails>>(`/v1/admin/users/${userId}/activate`, {});
	return response?.data;
}

export async function adminSuspendUser(userId: string, reason: string): Promise<ApiResponse<string>> {
	const response = await client.post<ApiResponse<string>>(`/v1/admin/users/${userId}/suspend`, { reason });
	return response?.data;
}

export async function adminInactivateUser(userId: string, reason: string): Promise<ApiResponse<string>> {
	const response = await client.post<ApiResponse<string>>(`/v1/admin/users/${userId}/inactivate`, { reason });
	return response?.data;
}

export async function adminUpdateUserRole(
	userId: string,
	role: UserRole
): Promise<ApiResponse<AdminUpdateUserRoleData>> {
	const response = await client.patch<ApiResponse<AdminUpdateUserRoleData>>(`/v1/admin/users/${userId}/role`, { role });
	return response?.data;
}

export async function adminUpdateUserReferralSettings(
	userId: string,
	data: AdminUpdateUserReferralSettingsRequest
): Promise<ApiResponse<AdminUpdateUserReferralSettingsData>> {
	const response = await client.patch<ApiResponse<AdminUpdateUserReferralSettingsData>>(
		`/v1/admin/users/${userId}/referral-settings`,
		data
	);
	return response?.data;
}

export async function adminCreateReferralCommissionPayment(
	userId: string,
	data: AdminCreateReferralCommissionPaymentRequest
): Promise<ApiResponse<AdminReferralCommissionPaymentData>> {
	const response = await client.post<ApiResponse<AdminReferralCommissionPaymentData>>(
		`/v1/admin/users/${userId}/referral-commission-payments`,
		data
	);
	return response?.data;
}

export async function adminAssignUserReferrer(
	userId: string,
	data: AdminAssignUserReferrerRequest
): Promise<ApiResponse<AdminAssignUserReferrerData>> {
	const response = await client.post<ApiResponse<AdminAssignUserReferrerData>>(
		`/v1/admin/users/${userId}/assign-referrer`,
		data
	);
	return response?.data;
}

export async function adminPreviewAssignUserReferrer(
	userId: string,
	referrerUserId: string
): Promise<ApiResponse<AdminPreviewAssignUserReferrerData>> {
	const response = await client.post<ApiResponse<AdminPreviewAssignUserReferrerData>>(
		`/v1/admin/users/${userId}/assign-referrer/preview`,
		{ referrerUserId }
	);
	return response?.data;
}

export interface DevToolsUser {
	id: string;
	name: string | null;
	email: string;
	hasPushEnabled: boolean;
}

export async function listUsersForDevTools(search?: string): Promise<ApiResponse<DevToolsUser[]>> {
	const response = await client.get<ApiResponse<DevToolsUser[]>>('/v1/dev-tools/users', {
		params: search ? { search } : undefined,
	});
	return response?.data;
}

export interface SendNotificationRequest {
	title: string;
	message: string;
	actionUrl?: string;
	sendPush?: boolean;
	sendInApp?: boolean;
	sendToAll?: boolean;
	targetUserId?: string;
	targetUserIds?: string[];
	notificationType?: string;
	statusType?: string;
	priority?: string;
}

export interface SendNotificationData {
	totalTargets: number;
	isBatchProcessing: boolean;
	batchInfo?: string;
}

export async function sendNotification(data: SendNotificationRequest): Promise<ApiResponse<SendNotificationData>> {
	const response = await client.post<ApiResponse<SendNotificationData>>('/v1/dev-tools/send-notification', data);
	return response?.data;
}

export async function adminSuspendFromRanking(
	userId: string,
	data: AdminSuspendFromRankingRequest
): Promise<ApiResponse<string>> {
	const response = await client.post<ApiResponse<string>>(`/v1/admin/users/${userId}/ranking-suspension`, data);
	return response?.data;
}

export async function adminUpdateUserWayneProtocolAccess(
	userId: string,
	enabled: boolean
): Promise<ApiResponse<null>> {
	const response = await client.patch<ApiResponse<null>>(`/v1/admin/users/${userId}/wayne-protocol-access`, { enabled });
	return response?.data;
}

export async function adminRemoveRankingSuspension(userId: string): Promise<ApiResponse<string>> {
	const response = await client.delete<ApiResponse<string>>(`/v1/admin/users/${userId}/ranking-suspension`);
	return response?.data;
}

export interface CreateBulletinRequest {
	title: string;
	content: string;
	expiresInDays: number;
}

export interface CreateBulletinData {
	id: string;
	title: string;
	content: string;
	expiresAt: string;
	createdAt: string;
	createdByUserName: string | null;
}

export async function createBulletin(data: CreateBulletinRequest): Promise<ApiResponse<CreateBulletinData>> {
	const response = await client.post<ApiResponse<CreateBulletinData>>('/v1/dev-tools/bulletins', data);
	return response?.data;
}
