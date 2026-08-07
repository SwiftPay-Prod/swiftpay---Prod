import type { UserRole, UserStatus, PaymentEnvironment } from './enums';

export interface SessionData {
	sessionId: string;
	userId: string;
	email: string;
	name: string | null;
	role: UserRole;
	status: UserStatus;
	emailVerified: boolean;
	selectedMerchantId: string | null;
	environment: PaymentEnvironment;
	createdAt: string;
	expiresAt: string;
	profileImageUrl?: string | null;
	selectedBorderImageUrl?: string | null;
	userOnboardingCompleted: boolean;
}

export interface UpdateSessionRequest {
	selectedMerchantId?: string | null;
	environment?: PaymentEnvironment;
}

export interface UpdateSessionData {
	selectedMerchantId: string | null;
	environment: PaymentEnvironment;
}

