export type MerchantIntegrationType = 'Tracking';
export type MerchantIntegrationProvider = 'Utmify' | 'Otimizey' | 'FacebookCapi';
export type MerchantIntegrationFieldType = 'Text' | 'Password' | 'Number' | 'Url' | 'Email';

export interface MerchantIntegrationConfigField {
  key: string;
  label: string;
  type: MerchantIntegrationFieldType;
  isRequired: boolean;
  placeholder?: string | null;
  description?: string | null;
}

export interface MerchantIntegrationListItem {
  provider: MerchantIntegrationProvider;
  name: string;
  description: string;
  websiteUrl: string;
  isEnabled: boolean;
  isConfigured: boolean;
  configValues: Record<string, string>;
  configFields: MerchantIntegrationConfigField[];
  isAvailable: boolean;
  waitingPaymentEnabled: boolean;
  paidEnabled: boolean;
  refusedEnabled: boolean;
  refundedEnabled: boolean;
  chargedbackEnabled: boolean;
}

export interface ReadMerchantIntegrationsData {
  type: MerchantIntegrationType;
  items: MerchantIntegrationListItem[];
}

export interface UpdateMerchantIntegrationRequest {
  enabled?: boolean;
  configValues?: Record<string, string>;
  apiToken?: string;
  waitingPaymentEnabled?: boolean;
  paidEnabled?: boolean;
  refusedEnabled?: boolean;
  refundedEnabled?: boolean;
  chargedbackEnabled?: boolean;
}

export interface UpdateMerchantIntegrationData {
  provider: MerchantIntegrationProvider;
  isEnabled: boolean;
  isConfigured: boolean;
  configValues: Record<string, string>;
  configFields: MerchantIntegrationConfigField[];
  waitingPaymentEnabled: boolean;
  paidEnabled: boolean;
  refusedEnabled: boolean;
  refundedEnabled: boolean;
  chargedbackEnabled: boolean;
}
