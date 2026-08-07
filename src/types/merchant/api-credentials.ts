import {
  MerchantApiCredentialEnvironment,
  MerchantApiCredentialStatus,
} from "../enums";
import type { PaginationParams } from "../common";

export interface ApiCredentialData {
  id: string;
  name: string | null;
  clientId: string;
  clientSecret: string;
  environment: MerchantApiCredentialEnvironment;
  allowedIpRange: string | null;
  createdAt: string;
}

export interface ApiCredentialListData {
  id: string;
  name: string | null;
  clientId: string;
  environment: MerchantApiCredentialEnvironment;
  status: MerchantApiCredentialStatus;
  allowedIpRange: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadListApiCredentialsRequest extends PaginationParams {
  merchantId: string;
  name?: string;
  environment?: MerchantApiCredentialEnvironment;
  status?: MerchantApiCredentialStatus;
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiCredentialsFilters extends PaginationParams {
  name?: string;
  environment?: MerchantApiCredentialEnvironment | 'all';
  status?: MerchantApiCredentialStatus | 'all';
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateApiCredentialRequest {
  merchantId: string;
  name?: string | null;
  environment: MerchantApiCredentialEnvironment;
  allowedIpRange?: string | null;
}

export interface RegenerateApiCredentialRequest {
  merchantId: string;
  credentialId: string;
}

export interface RegenerateApiCredentialData {
  id: string;
  name: string | null;
  clientId: string;
  clientSecret: string;
  environment: MerchantApiCredentialEnvironment;
  allowedIpRange: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteApiCredentialRequest {
  merchantId: string;
  credentialId: string;
}

export interface DeleteApiCredentialData {
  id: string;
  message: string;
}

export interface RequestCreateApiCredentialRequest {
  merchantId: string;
  name?: string | null;
  environment: MerchantApiCredentialEnvironment;
  allowedIpRange?: string | null;
}

export interface ConfirmCreateApiCredentialRequest {
  merchantId: string;
  code: string;
}

export interface RequestRegenerateApiCredentialRequest {
  merchantId: string;
  credentialId: string;
}

export interface RegenerateApiCredentialRequest {
  merchantId: string;
  credentialId: string;
}

export interface RegenerateApiCredentialData {
  id: string;
  name: string | null;
  clientId: string;
  clientSecret: string;
  environment: MerchantApiCredentialEnvironment;
  allowedIpRange: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmRegenerateApiCredentialRequest {
  merchantId: string;
  credentialId: string;
  code: string;
}

export interface ConfirmRegenerateApiCredentialData {
  id: string;
  name: string | null;
  clientId: string;
  clientSecret: string;
  environment: MerchantApiCredentialEnvironment;
  allowedIpRange: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestDeleteApiCredentialRequest {
  merchantId: string;
  credentialId: string;
}

export interface ConfirmDeleteApiCredentialRequest {
  merchantId: string;
  credentialId: string;
  code: string;
}
