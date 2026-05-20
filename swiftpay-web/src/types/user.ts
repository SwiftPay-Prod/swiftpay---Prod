import { UserRole, UserStatus } from './enums';
import type { MerchantLevel, MerchantLevelData, LevelBorderItem } from './merchant/achievements';

// User Details (para o próprio usuário)
export interface UserDetails {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	emailVerified: boolean;
	twoFactorEnabled: boolean;
	bio: string | null;
	socialLinks: string | null;
	profileImageUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

// Admin User Details (para admin visualizar)
export interface AdminUserDetails {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	emailVerified: boolean;
	twoFactorEnabled: boolean;
	isLockedOut: boolean;
	failedLoginAttempts: number;
	inactiveReason: string | null;
	suspendedReason: string | null;
	lastLoginAt: string | null;
	lastLoginIpAddress: string | null;
	lastLoginUserAgent: string | null;
	lastLoginLocation: string | null;
	lockedOutAt: string | null;
	passwordChangedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

// Admin Minimal User (para listagem)
export interface AdminMinimalUser {
	id: string;
	name: string;
	email: string;
	status: UserStatus;
	role: UserRole;
	emailVerified: boolean;
	createdAt: string;
	lastLoginAt: string | null;
}

// Update User (próprio usuário)
export interface UpdateUserRequest {
	name?: string | null;
}

// Profile
export interface UserSocialLinks {
	instagram?: string | null;
	x?: string | null;
	facebook?: string | null;
	tiktok?: string | null;
	discord?: string | null;
	telegram?: string | null;
	visibility?: {
		instagram?: boolean;
		x?: boolean;
		facebook?: boolean;
		tiktok?: boolean;
		discord?: boolean;
		telegram?: boolean;
	};
}

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	bio: string | null;
	socialLinks: string | null;
	profileImageUrl: string | null;
	profileImageId: string | null;
}

export interface PublicProfileEmblem {
	id: string;
	imageUrl: string;
	title: string;
	description: string | null;
	earnedAt: string | null;
}

export interface UserPublicProfile {
	id: string;
	name: string;
	bio: string | null;
	socialLinks: string | null;
	profileImageUrl: string | null;
	bannerImageUrl?: string | null;
	selectedBorderImageUrl: string | null;
	selectedBorderLevel?: MerchantLevel | null;
	levelInfo?: MerchantLevelData | null;
	levelBorders?: LevelBorderItem[];
	earnedCount?: number;
	totalAchievements?: number;
	selectedEmblems: PublicProfileEmblem[];
}

export interface UpdateProfileRequest {
	name?: string | null;
	bio?: string | null;
	socialLinks?: string | null;
}

export interface UploadAvatarData {
	fileId: string;
	url: string;
}

// Change Password
export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

// Confirm Change Password
export interface ConfirmChangePasswordRequest {
	code: string;
}

// Activate User
export interface ActivateUserRequest {
	userId: string;
	reason?: string | null;
}

// Push Token Registration
export interface RegisterPushTokenRequest {
	token: string;
	platform: 'web' | 'ios' | 'android';
	deviceName?: string;
	deviceId?: string;
}

export interface UnregisterPushTokenRequest {
	token: string;
}

// Notification Preferences
export interface NotificationPreferencesData {
	pushNotificationsEnabled: boolean;
	inAppNotificationsEnabled: boolean;
	notifyPaymentPending: boolean;
	notifyPaymentCompleted: boolean;
	notifyPaymentExpired: boolean;
	notifyPaymentFailed: boolean;
	notifyPaymentRefunded: boolean;
	notifyPayoutPending: boolean;
	notifyPayoutProcessing: boolean;
	notifyPayoutCompleted: boolean;
	notifyPayoutFailed: boolean;
	notifyPayoutRejected: boolean;
	notifyPayoutCancelled: boolean;
	notifyInfo: boolean;
	notifySuccess: boolean;
	notifyWarning: boolean;
	notifyError: boolean;
	notifySecurity: boolean;
	notifySystem: boolean;
	notifyChargeback: boolean;
}

export type UpdateNotificationPreferencesRequest = Partial<NotificationPreferencesData>;

