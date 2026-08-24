"use server";

import { unstable_noStore as noStore } from 'next/cache';
import client from "@/clients/client";
import type {
  UserDetails,
  UpdateUserRequest,
  ChangePasswordRequest,
  ConfirmChangePasswordRequest,
  ActivateUserRequest,
  RegisterPushTokenRequest,
  UnregisterPushTokenRequest,
  NotificationPreferencesData,
  UpdateNotificationPreferencesRequest,
  UserProfile,
  UserPublicProfile,
  UpdateProfileRequest,
  UploadAvatarData,
} from "@/types/user";
import type {
  UserOnboardingData,
  UpdateUserOnboardingRequest,
  UpdateUserOnboardingData,
} from '@/types/user/onboarding';
import type { RankingResponse, GetRankingRequest } from "@/types/ranking";
import type { UserReferralsData } from "@/types/user/referrals";
import type { GenerateReferralLinkData } from "@/types/user/referrals";
import type { UserReferralReferredUserMovementsData } from "@/types/user/referrals";
import type { ReadUserReferralReferredUserMovementsRequest } from "@/types/user/referrals";
import type {
  RequestUserReferralPayoutPixKeyUpdateData,
  UpdateUserReferralPayoutPixKeyData,
  UpdateUserReferralPayoutPixKeyRequest,
  CreateUserReferralCommissionWithdrawalRequestData,
  CreateUserReferralCommissionWithdrawalRequestRequest,
  CancelUserReferralCommissionWithdrawalRequestData,
} from "@/types/user/referrals";
import type {
  UserNotificationData,
  ReadListUserNotificationsRequest,
  ReadUserNotificationCountData,
  UnifiedNotificationData,
  ReadListAllNotificationsRequest,
} from "@/types/user/notifications";
import type {
  UnreadBulletin,
  BulletinListItem,
  BulletinContent,
  ReactToBulletinRequest,
  ReactToBulletinData,
} from "@/types/user/bulletins";
import type { ApiResponse, Paginated } from "@/types/common";

export async function getUser(): Promise<ApiResponse<UserDetails>> {
  const response = await client.get<ApiResponse<UserDetails>>("/v1/users");
  return response?.data;
}

export async function getUserOnboarding(): Promise<ApiResponse<UserOnboardingData>> {
  const response = await client.get<ApiResponse<UserOnboardingData>>('/v1/users/onboarding');
  return response?.data;
}

export async function updateUserOnboarding(
  data: UpdateUserOnboardingRequest
): Promise<ApiResponse<UpdateUserOnboardingData>> {
  const response = await client.patch<ApiResponse<UpdateUserOnboardingData>>('/v1/users/onboarding', data);
  return response?.data;
}

export async function getMyReferrals(): Promise<ApiResponse<UserReferralsData>> {
  try {
    noStore();
    const response = await client.get<ApiResponse<UserReferralsData>>("/v1/users/referrals");
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível carregar as indicações no momento." },
  };
}

export async function getMyReferredUserMovements(
  referredUserId: string,
  page = 1,
  pageSize = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<ApiResponse<UserReferralReferredUserMovementsData>> {
  try {
    noStore();
    const params: ReadUserReferralReferredUserMovementsRequest = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    const response = await client.get<ApiResponse<UserReferralReferredUserMovementsData>>(
      `/v1/users/referrals/referred-users/${referredUserId}/movements`,
      {
        params,
      }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível carregar os movimentos no momento." },
  };
}

export async function generateMyReferralLink(): Promise<ApiResponse<GenerateReferralLinkData>> {
  try {
    noStore();
    const response = await client.post<ApiResponse<GenerateReferralLinkData>>("/v1/users/referrals/generate", {});
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível gerar o link de indicação agora." },
  };
}

export async function updateMyReferralPayoutPixKey(
  data: UpdateUserReferralPayoutPixKeyRequest
): Promise<ApiResponse<UpdateUserReferralPayoutPixKeyData>> {
  try {
    noStore();
    const response = await client.patch<ApiResponse<UpdateUserReferralPayoutPixKeyData>>(
      "/v1/users/referrals/payout-pix-key",
      data
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível atualizar a chave PIX no momento." },
  };
}

export async function requestMyReferralPayoutPixKeyUpdate(): Promise<ApiResponse<RequestUserReferralPayoutPixKeyUpdateData>> {
  try {
    noStore();
    const response = await client.post<ApiResponse<RequestUserReferralPayoutPixKeyUpdateData>>(
      "/v1/users/referrals/payout-pix-key/request-update",
      {}
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível solicitar a atualização agora." },
  };
}

export async function createMyReferralCommissionWithdrawalRequest(
  data?: CreateUserReferralCommissionWithdrawalRequestRequest
): Promise<ApiResponse<CreateUserReferralCommissionWithdrawalRequestData>> {
  try {
    noStore();
    const response = await client.post<ApiResponse<CreateUserReferralCommissionWithdrawalRequestData>>(
      "/v1/users/referrals/withdrawal-requests",
      data ?? {}
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível criar o pedido de saque no momento." },
  };
}

export async function cancelMyReferralCommissionWithdrawalRequest(
  requestId: string
): Promise<ApiResponse<CancelUserReferralCommissionWithdrawalRequestData>> {
  try {
    noStore();
    const response = await client.patch<ApiResponse<CancelUserReferralCommissionWithdrawalRequestData>>(
      `/v1/users/referrals/withdrawal-requests/${requestId}/cancel`,
      {}
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível cancelar o pedido no momento." },
  };
}

export async function updateUser(
  data: UpdateUserRequest
): Promise<ApiResponse<UserDetails>> {
  const response = await client.patch<ApiResponse<UserDetails>>("/v1/users", data);
  return response?.data;
}

export async function requestChangePassword(
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>(
    "/v1/users/request-change-password",
    data
  );
  return response?.data;
}

export async function confirmChangePassword(
  data: ConfirmChangePasswordRequest
): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>(
    "/v1/users/confirm-change-password",
    data
  );
  return response?.data;
}

export async function activateUser(
  data: ActivateUserRequest
): Promise<ApiResponse<string>> {
  const response = await client.post<ApiResponse<string>>(
    "/v1/users/activate",
    data
  );
  return response?.data;
}

export async function registerPushToken(
  data: RegisterPushTokenRequest
): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>(
    "/v1/users/push-tokens",
    data
  );
  return response?.data;
}

export async function unregisterPushToken(
  data: UnregisterPushTokenRequest
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    "/v1/users/push-tokens",
    { data }
  );
  return response?.data;
}

export async function getNotificationPreferences(): Promise<ApiResponse<NotificationPreferencesData>> {
  const response = await client.get<ApiResponse<NotificationPreferencesData>>(
    "/v1/users/notification-preferences"
  );
  return response?.data;
}

export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesRequest
): Promise<ApiResponse<NotificationPreferencesData>> {
  const response = await client.patch<ApiResponse<NotificationPreferencesData>>(
    "/v1/users/notification-preferences",
    data
  );
  return response?.data;
}

export async function listUserNotifications(
  params?: ReadListUserNotificationsRequest
): Promise<ApiResponse<Paginated<UserNotificationData>>> {
  const response = await client.get<ApiResponse<Paginated<UserNotificationData>>>(
    "/v1/users/notifications",
    { params }
  );
  return response?.data;
}

export async function getUserNotificationCount(): Promise<ApiResponse<ReadUserNotificationCountData>> {
  const response = await client.get<ApiResponse<ReadUserNotificationCountData>>(
    "/v1/users/notifications/count"
  );
  return response?.data;
}

export async function markUserNotificationRead(
  notificationId: string
): Promise<ApiResponse<null>> {
  const response = await client.patch<ApiResponse<null>>(
    `/v1/users/notifications/${notificationId}/read`,
    {}
  );
  return response?.data;
}

export async function markAllUserNotificationsRead(): Promise<ApiResponse<null>> {
  const response = await client.patch<ApiResponse<null>>(
    "/v1/users/notifications/read-all",
    {}
  );
  return response?.data;
}

export async function deleteUserNotification(
  notificationId: string
): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>(
    `/v1/users/notifications/${notificationId}`
  );
  return response?.data;
}

export async function listAllNotifications(
  merchantId: string,
  params?: Omit<ReadListAllNotificationsRequest, 'merchantId'>
): Promise<ApiResponse<Paginated<UnifiedNotificationData>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<UnifiedNotificationData>>>(
    `/v1/users/notifications/all/${merchantId}`,
    { params: rest }
  );
  return response?.data;
}

export async function getUnreadBulletins(): Promise<ApiResponse<UnreadBulletin[]>> {
  const response = await client.get<ApiResponse<UnreadBulletin[]>>(
    "/v1/users/bulletins/unread"
  );
  return response?.data;
}

export async function listBulletins(): Promise<ApiResponse<BulletinListItem[]>> {
  const response = await client.get<ApiResponse<BulletinListItem[]>>(
    "/v1/users/bulletins"
  );
  return response?.data;
}

export async function getBulletinContent(
  bulletinId: string
): Promise<ApiResponse<BulletinContent>> {
  const response = await client.get<ApiResponse<BulletinContent>>(
    `/v1/users/bulletins/${bulletinId}`
  );
  return response?.data;
}

export async function markBulletinAsRead(
  bulletinId: string
): Promise<ApiResponse<null>> {
  const response = await client.post<ApiResponse<null>>(
    `/v1/users/bulletins/${bulletinId}/read`,
    {}
  );
  return response?.data;
}

export async function reactToBulletin(
  bulletinId: string,
  data: ReactToBulletinRequest
): Promise<ApiResponse<ReactToBulletinData>> {
  const response = await client.post<ApiResponse<ReactToBulletinData>>(
    `/v1/users/bulletins/${bulletinId}/react`,
    data
  );
  return response?.data;
}

export async function getMyProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    noStore();
    const response = await client.get<ApiResponse<UserProfile>>("/v1/users/profile");
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível carregar o perfil no momento." },
  };
}

export async function updateMyProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<UserProfile>> {
  const response = await client.patch<ApiResponse<UserProfile>>("/v1/users/profile", data);
  return response?.data;
}

export async function uploadMyAvatar(
  formData: FormData
): Promise<ApiResponse<UploadAvatarData>> {
  const response = await client.post<ApiResponse<UploadAvatarData>>(
    "/v1/users/profile/avatar",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response?.data;
}

export async function deleteMyAvatar(): Promise<ApiResponse<null>> {
  const response = await client.delete<ApiResponse<null>>("/v1/users/profile/avatar");
  return response?.data;
}

export async function getPublicProfile(
  userId: string
): Promise<ApiResponse<UserPublicProfile>> {
  const response = await client.get<ApiResponse<UserPublicProfile>>(
    `/v1/users/${userId}/public-profile`
  );
  return response?.data;
}

export async function getRanking(
  params?: GetRankingRequest
): Promise<ApiResponse<RankingResponse>> {
  try {
    noStore();
    const response = await client.get<ApiResponse<RankingResponse>>(
      "/v1/users/ranking",
      { params }
    );
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Intentionally no mock fallback.
  }

  return {
    data: null,
    message: null,
    error: { message: "Não foi possível carregar o ranking no momento." },
  };
}
