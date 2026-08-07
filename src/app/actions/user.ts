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
import type { RankingResponse, GetRankingRequest, RankingEntry } from "@/types/ranking";
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
import {
  PixKeyType,
  UserStatus,
  ReferralCommissionWithdrawalRequestStatus,
  ReferralCommissionMovementSourceType,
  ReferralWithdrawalIntervalUnit,
} from "@/types/enums";

const MOCK_REFERRAL_CODE = 'ADM2026';
const MOCK_REFERRAL_LINK = 'https://swiftpay.app/convidar/ADM2026';

const MOCK_REFERRED_USERS: UserReferralsData['referredUsers'] = [
  {
    id: 'ref_mariana',
    name: 'Mariana Alves Souza',
    email: 'mariana.alves@exemplo.com',
    status: UserStatus.Active,
    referredAt: '2026-05-10T14:22:00.000Z',
    eligibleProfitFromPayments: 2500000,
    eligibleProfitFromPayouts: 500000,
    estimatedCommissionFromPayments: 500000,
    estimatedCommissionFromPayouts: 100000,
    estimatedCommissionTotal: 600000,
  },
  {
    id: 'ref_rafael',
    name: 'Rafael Costa Lima',
    email: 'rafael.costa@exemplo.com',
    status: UserStatus.Active,
    referredAt: '2026-06-01T09:10:00.000Z',
    eligibleProfitFromPayments: 1500000,
    eligibleProfitFromPayouts: 250000,
    estimatedCommissionFromPayments: 300000,
    estimatedCommissionFromPayouts: 50000,
    estimatedCommissionTotal: 350000,
  },
  {
    id: 'ref_fernanda',
    name: 'Fernanda Oliveira',
    email: 'fernanda.oliveira@exemplo.com',
    status: UserStatus.Inactive,
    referredAt: '2026-04-15T18:45:00.000Z',
    eligibleProfitFromPayments: 825000,
    eligibleProfitFromPayouts: 500000,
    estimatedCommissionFromPayments: 165000,
    estimatedCommissionFromPayouts: 100000,
    estimatedCommissionTotal: 265000,
  },
];

const MOCK_REFERRAL_WITHDRAWAL_REQUESTS: UserReferralsData['withdrawalRequests'] = [
  {
    id: 'wd_001',
    amount: 100000,
    feeAmount: 350,
    netAmount: 99650,
    requestedAt: '2026-08-01T10:30:00.000Z',
    status: ReferralCommissionWithdrawalRequestStatus.Requested,
    notes: null,
    reviewReason: null,
  },
  {
    id: 'wd_002',
    amount: 50000,
    feeAmount: 350,
    netAmount: 49650,
    requestedAt: '2026-07-20T08:00:00.000Z',
    status: ReferralCommissionWithdrawalRequestStatus.Reviewed,
    notes: 'Pagamento aprovado e enviado.',
    reviewReason: null,
  },
];

const MOCK_REFERRAL_PAYMENT_HISTORY: UserReferralsData['paymentHistory'] = [
  {
    id: 'rpay_002',
    amount: 300000,
    requestedAmount: 300000,
    feeAmount: 350,
    netAmount: 299650,
    pixKeyType: PixKeyType.Cnpj,
    pixKey: '12.345.678/0001-90',
    paidByUserName: 'Financeiro SwiftPay',
    paidAt: '2026-07-25T15:00:00.000Z',
    notes: 'Pagamento de comissão — junho/2026',
    receiptFile: null,
  },
  {
    id: 'rpay_001',
    amount: 185000,
    requestedAmount: 185000,
    feeAmount: 350,
    netAmount: 184650,
    pixKeyType: PixKeyType.Cnpj,
    pixKey: '12.345.678/0001-90',
    paidByUserName: 'Financeiro SwiftPay',
    paidAt: '2026-06-25T15:00:00.000Z',
    notes: 'Pagamento de comissão — maio/2026',
    receiptFile: null,
  },
];

const MOCK_USER_REFERRALS: UserReferralsData = {
  referralCode: MOCK_REFERRAL_CODE,
  referralLink: MOCK_REFERRAL_LINK,
  referralDurationMonths: 12,
  referralCommissionPercentage: 2000,
  eligibleProfitFromPayments: 4825000,
  eligibleProfitFromPayouts: 1250000,
  estimatedCommissionFromPayments: 965000,
  estimatedCommissionFromPayouts: 250000,
  estimatedCommissionTotal: 1215000,
  paidCommissionTotal: 485000,
  availableCommissionBalance: 730000,
  referralCommissionWithdrawalIntervalValue: 1,
  referralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit.Days,
  referralCommissionMinWithdrawalAmount: 5000,
  referralCommissionWithdrawalFeeFixed: 350,
  referralCommissionNextAllowedWithdrawalRequestAt: null,
  canRequestReferralCommissionWithdrawal: true,
  payoutPixKeyType: PixKeyType.Cnpj,
  payoutPixKey: '12.345.678/0001-90',
  withdrawalRequests: MOCK_REFERRAL_WITHDRAWAL_REQUESTS,
  paymentHistory: MOCK_REFERRAL_PAYMENT_HISTORY,
  referredUsers: MOCK_REFERRED_USERS,
};

const MOCK_REFERRED_USER_MOVEMENTS: Record<string, UserReferralReferredUserMovementsData> = {
  ref_mariana: {
    referredUserId: 'ref_mariana',
    referredUserName: 'Mariana Alves Souza',
    referredUserEmail: 'mariana.alves@exemplo.com',
    referredUserStatus: UserStatus.Active,
    referredAt: '2026-05-10T14:22:00.000Z',
    totalCommissionFromPayments: 35000,
    totalCommissionFromPayouts: 5000,
    totalCommissionAmount: 40000,
    page: 1,
    pageSize: 10,
    totalItems: 3,
    totalPages: 1,
    movements: [
      {
        id: 'mov_003',
        sourceType: ReferralCommissionMovementSourceType.Payout,
        sourceId: 'csh_ref_001',
        referralCommissionPercentage: 2000,
        commissionAmount: 5000,
        occurredAt: '2026-07-22T11:20:00.000Z',
        description: 'Saque realizado pelo indicado',
      },
      {
        id: 'mov_002',
        sourceType: ReferralCommissionMovementSourceType.Payment,
        sourceId: 'pay_ref_002',
        referralCommissionPercentage: 2000,
        commissionAmount: 25000,
        occurredAt: '2026-07-20T16:40:00.000Z',
        description: 'Cobrança recorrente aprovada',
      },
      {
        id: 'mov_001',
        sourceType: ReferralCommissionMovementSourceType.Payment,
        sourceId: 'pay_ref_001',
        referralCommissionPercentage: 2000,
        commissionAmount: 10000,
        occurredAt: '2026-07-15T09:05:00.000Z',
        description: 'Pagamento via checkout aprovado',
      },
    ],
  },
  ref_rafael: {
    referredUserId: 'ref_rafael',
    referredUserName: 'Rafael Costa Lima',
    referredUserEmail: 'rafael.costa@exemplo.com',
    referredUserStatus: UserStatus.Active,
    referredAt: '2026-06-01T09:10:00.000Z',
    totalCommissionFromPayments: 30000,
    totalCommissionFromPayouts: 0,
    totalCommissionAmount: 30000,
    page: 1,
    pageSize: 10,
    totalItems: 2,
    totalPages: 1,
    movements: [
      {
        id: 'mov_005',
        sourceType: ReferralCommissionMovementSourceType.Payment,
        sourceId: 'pay_ref_004',
        referralCommissionPercentage: 2000,
        commissionAmount: 20000,
        occurredAt: '2026-07-28T14:10:00.000Z',
        description: 'Pagamento via API aprovado',
      },
      {
        id: 'mov_004',
        sourceType: ReferralCommissionMovementSourceType.Payment,
        sourceId: 'pay_ref_003',
        referralCommissionPercentage: 2000,
        commissionAmount: 10000,
        occurredAt: '2026-07-11T08:55:00.000Z',
        description: 'Link de pagamento aprovado',
      },
    ],
  },
  ref_fernanda: {
    referredUserId: 'ref_fernanda',
    referredUserName: 'Fernanda Oliveira',
    referredUserEmail: 'fernanda.oliveira@exemplo.com',
    referredUserStatus: UserStatus.Inactive,
    referredAt: '2026-04-15T18:45:00.000Z',
    totalCommissionFromPayments: 16500,
    totalCommissionFromPayouts: 0,
    totalCommissionAmount: 16500,
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
    movements: [
      {
        id: 'mov_006',
        sourceType: ReferralCommissionMovementSourceType.Payment,
        sourceId: 'pay_ref_005',
        referralCommissionPercentage: 2000,
        commissionAmount: 16500,
        occurredAt: '2026-06-30T17:25:00.000Z',
        description: 'Pagamento via checkout aprovado',
      },
    ],
  },
};

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
    // Fallback para simulação
  }

  return {
    data: MOCK_USER_REFERRALS,
    message: null,
    error: null,
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
    // Fallback para simulação
  }

  const mock = MOCK_REFERRED_USER_MOVEMENTS[referredUserId] ?? MOCK_REFERRED_USER_MOVEMENTS.ref_mariana!;

  return {
    data: {
      ...mock,
      page,
      pageSize,
    },
    message: null,
    error: null,
  };
}

export async function generateMyReferralLink(): Promise<ApiResponse<GenerateReferralLinkData>> {
  try {
    noStore();
    const response = await client.post<ApiResponse<GenerateReferralLinkData>>("/v1/users/referrals/generate", {});
    if (response?.data && !response.data.error) return response.data;
  } catch {
    // Fallback para simulação
  }

  return {
    data: {
      referralCode: MOCK_REFERRAL_CODE,
      referralLink: MOCK_REFERRAL_LINK,
    },
    message: null,
    error: null,
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
    // Fallback para simulação
  }

  return {
    data: {
      pixKeyType: data.pixKeyType,
      pixKey: data.pixKey,
      updatedAt: new Date().toISOString(),
    },
    message: null,
    error: null,
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
    // Fallback para simulação
  }

  return {
    data: {
      verificationId: 'ver_preview_001',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      maskedEmail: 'a***@swiftpay.com',
    },
    message: null,
    error: null,
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
    // Fallback para simulação
  }

  const amount = data?.amount ?? 0;

  return {
    data: {
      id: `wd_${Date.now()}`,
      amount,
      feeAmount: MOCK_USER_REFERRALS.referralCommissionWithdrawalFeeFixed,
      netAmount: Math.max(amount - MOCK_USER_REFERRALS.referralCommissionWithdrawalFeeFixed, 0),
      requestedAt: new Date().toISOString(),
      nextAllowedRequestAt: new Date(Date.now() + 86400000).toISOString(),
      withdrawalIntervalValue: MOCK_USER_REFERRALS.referralCommissionWithdrawalIntervalValue,
      withdrawalIntervalUnit: MOCK_USER_REFERRALS.referralCommissionWithdrawalIntervalUnit,
      minWithdrawalAmount: MOCK_USER_REFERRALS.referralCommissionMinWithdrawalAmount,
      notes: data?.notes ?? null,
      status: ReferralCommissionWithdrawalRequestStatus.Requested,
    },
    message: null,
    error: null,
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
    // Fallback para simulação
  }

  const cancelled = MOCK_REFERRAL_WITHDRAWAL_REQUESTS.find((item) => item.id === requestId);

  return {
    data: {
      requestId,
      status: ReferralCommissionWithdrawalRequestStatus.Cancelled,
      releasedAmount: cancelled?.amount ?? 0,
      availableCommissionBalance: MOCK_USER_REFERRALS.availableCommissionBalance + (cancelled?.amount ?? 0),
      pendingWithdrawalRequestsTotal: 0,
    },
    message: null,
    error: null,
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
    // Fallback para simulação
  }

  return {
    data: {
      id: 'preview-user-id',
      name: 'Administrador SwiftPay',
      email: 'admin@swiftpay.com',
      bio: 'Conta oficial de administração e preview da plataforma SwiftPay.',
      socialLinks: JSON.stringify({ instagram: 'swiftpay.official', website: 'https://swiftpay.com' }),
      profileImageUrl: null,
      profileImageId: null,
    },
    message: null,
    error: null,
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
    const response = await client.get<ApiResponse<RankingResponse>>(
      "/v1/users/ranking",
      { params }
    );
    const rawData: any = response?.data;
    const items = rawData?.items ?? rawData?.data?.items;
    if (items && Array.isArray(items) && items.length > 0) {
      return response.data!;
    }
  } catch {
    // Fallback para simulação
  }
  const period = params?.period ?? 'Weekly';
  const type = params?.type ?? 'Volume';

  const mockEntries: RankingEntry[] = [
    {
      userId: 'user-1',
      userName: 'Gabriel Santos',
      profileImageUrl: null,
      volume: 184592000,
      position: 1,
      previousPosition: 1,
      positionChange: 0,
      totalReferrals: 42,
      totalCommission: 3840000,
      userPublicProfile: {
        id: 'user-1',
        name: 'Gabriel Santos (Imperium PayTech)',
        bio: 'Líder em e-commerce de alta conversão e automações de faturamento.',
        socialLinks: JSON.stringify({ instagram: 'gabrielsantos', website: 'https://imperiumpay.com' }),
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'Black',
        selectedEmblems: [],
      },
    },
    {
      userId: 'user-2',
      userName: 'Mateus Andrade',
      profileImageUrl: null,
      volume: 142015000,
      position: 2,
      previousPosition: 4,
      positionChange: 2,
      totalReferrals: 28,
      totalCommission: 2210000,
      userPublicProfile: {
        id: 'user-2',
        name: 'Mateus Andrade (Vortex Digital)',
        bio: 'Especialista em infoprodutos e escala global de vendas.',
        socialLinks: JSON.stringify({ instagram: 'mateusandrade' }),
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'PlatinumPro',
        selectedEmblems: [],
      },
    },
    {
      userId: 'user-3',
      userName: 'Lucas Oliveira',
      profileImageUrl: null,
      volume: 98040000,
      position: 3,
      previousPosition: 2,
      positionChange: -1,
      totalReferrals: 19,
      totalCommission: 1530000,
      userPublicProfile: {
        id: 'user-3',
        name: 'Lucas Oliveira (Apex Commerce)',
        bio: 'Operações SaaS e produtos digitais no Brasil e LATAM.',
        socialLinks: null,
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'Diamond',
        selectedEmblems: [],
      },
    },
    {
      userId: 'user-4',
      userName: 'Rafael Costa',
      profileImageUrl: null,
      volume: 74520000,
      position: 4,
      previousPosition: 7,
      positionChange: 3,
      totalReferrals: 14,
      totalCommission: 1120000,
      userPublicProfile: {
        id: 'user-4',
        name: 'Rafael Costa (Nexus Subscriptions)',
        bio: 'Clube de assinaturas e recorrência em grande escala.',
        socialLinks: null,
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'Diamond',
        selectedEmblems: [],
      },
    },
    {
      userId: 'preview-user-id',
      userName: 'Administrador SwiftPay',
      profileImageUrl: null,
      volume: 42850000,
      position: 5,
      previousPosition: 7,
      positionChange: 2,
      totalReferrals: 11,
      totalCommission: 890000,
      userPublicProfile: {
        id: 'preview-user-id',
        name: 'Administrador SwiftPay (Loja Preview)',
        bio: 'Conta oficial de administração e preview SwiftPay.',
        socialLinks: null,
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'GoldPro',
        selectedEmblems: [],
      },
    },
    {
      userId: 'user-6',
      userName: 'Bruno Ferreira',
      profileImageUrl: null,
      volume: 38090000,
      position: 6,
      previousPosition: 6,
      positionChange: 0,
      totalReferrals: 8,
      totalCommission: 540000,
      userPublicProfile: {
        id: 'user-6',
        name: 'Bruno Ferreira (NovaPay Systems)',
        bio: 'Soluções de pagamento B2B.',
        socialLinks: null,
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'GoldStart',
        selectedEmblems: [],
      },
    },
    {
      userId: 'user-7',
      userName: 'Diego Martins',
      profileImageUrl: null,
      volume: 29040000,
      position: 7,
      previousPosition: 8,
      positionChange: 1,
      totalReferrals: 5,
      totalCommission: 320000,
      userPublicProfile: {
        id: 'user-7',
        name: 'Diego Martins (Horizon Tech)',
        bio: null,
        socialLinks: null,
        profileImageUrl: null,
        selectedBorderImageUrl: null,
        selectedBorderLevel: 'Silver',
        selectedEmblems: [],
      },
    },
  ];

  return {
    data: {
      items: mockEntries,
      page: 1,
      pageSize: 20,
      totalItems: mockEntries.length,
      totalPages: 1,
      type,
      period,
      status: 'Completed',
      calculatedAt: new Date().toISOString(),
      periodStart: new Date(Date.now() - 7 * 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
    },
    message: null,
    error: null,
  };
}
