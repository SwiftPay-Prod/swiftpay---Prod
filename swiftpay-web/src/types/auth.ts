import { UserRole, UserStatus } from "./enums";

// User Info
export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  suspendedReason?: string | null;
  inactiveReason?: string | null;
  profileImageUrl?: string | null;
  selectedBorderImageUrl?: string | null;
}

// Auth Tokens
export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  sessionId?: string;
}

// Current Device Info
export interface CurrentDeviceInfo {
  deviceId: string;
  deviceName: string;
}

// Device Verification Info
export interface DeviceVerificationInfo {
  verificationId: string;
  maskedEmail: string;
  expiresAt: string;
  deviceId: string;
}

// Auth Data (nested in response)
export interface AuthData {
  user: UserInfo;
  tokens: AuthTokens;
}

// Sign In Data
export interface SignInData {
  requiresDeviceVerification: boolean;
  auth?: AuthData;
  deviceVerification?: DeviceVerificationInfo;
}

// Sign Up
export interface SignUpRequest {
  name: string;
  email: string;
  whatsApp: string;
  password: string;
  deviceId?: string;
  refCode?: string;
}

export interface ReferralOwnerData {
  refCode: string;
  ownerName: string;
}

// Sign Up Response Data
export interface SignUpData {
  requiresDeviceVerification: boolean;
  maskedEmail?: string;
  user?: UserInfo;
  tokens?: AuthTokens;
  currentDevice?: CurrentDeviceInfo;
}

// Sign In
export interface SignInRequest {
  email: string;
  password: string;
  deviceId?: string;
}

// Verify Device
export interface VerifyDeviceRequest {
  verificationId: string;
  code: string;
  deviceId: string;
}

export interface VerifyDeviceData {
  user: UserInfo;
  tokens: AuthTokens;
  currentDevice: CurrentDeviceInfo;
}

// Resend Device Code
export interface ResendDeviceCodeRequest {
  verificationId: string;
}

export interface ResendDeviceCodeData {
  verificationId: string;
  expiresAt: string;
}

// Trusted Device
export interface TrustedDeviceData {
  id: string;
  deviceId: string;
  deviceName: string;
  browser?: string;
  operatingSystem?: string;
  lastIpAddress?: string;
  lastLocation?: string;
  lastUsedAt: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface ListDevicesData {
  devices: TrustedDeviceData[];
  currentDeviceId?: string;
}

// Forgot Password
export interface ForgotPasswordRequest {
  email: string;
}

// Reset Password
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// Send Email Confirmation
export interface SendEmailConfirmationRequest {
  email: string;
}

// Confirm Email
export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

