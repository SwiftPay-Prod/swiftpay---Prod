import type { PaginationParams } from "../common";
import type {
  MerchantEmailTemplateType,
  EmailBlockType,
  EmailTextAlignment,
  PaymentEnvironment,
} from "../enums";

// ==================== EMAIL BLOCK ====================

export interface EmailBlockSettings {
  // General / Layout
  backgroundColor?: string | null;
  padding?: number | null;
  marginTop?: number | null;
  marginBottom?: number | null;

  // Text
  fontSize?: number | null;
  textColor?: string | null;
  textAlign?: EmailTextAlignment | null;
  bold?: boolean | null;
  italic?: boolean | null;

  // Button
  buttonUrl?: string | null;
  buttonBackgroundColor?: string | null;
  buttonTextColor?: string | null;
  buttonBorderRadius?: number | null;

  // Image
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageWidth?: string | null;
  imageLink?: string | null;

  // ProductList / DigitalItemsList
  showProductImages?: boolean | null;
  showPrices?: boolean | null;
  showQuantity?: boolean | null;

  // Spacer
  spacerHeight?: number | null;

  // Divider
  dividerColor?: string | null;
  dividerThickness?: number | null;

  // Columns
  columns?: EmailBlockColumn[] | null;
}

export interface EmailSocialLink {
  type: string;
  url: string;
}

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  order?: number | null;
  content?: string | null;
  settings?: EmailBlockSettings | null;
}

export interface EmailBlockColumn {
  widthPercent?: number | null;
  blocks: EmailBlock[];
}

// ==================== EMAIL TEMPLATE ====================

export interface EmailTemplateData {
  id: string;
  merchantId: string;
  type: MerchantEmailTemplateType;
  environment: PaymentEnvironment;
  name: string;
  enabled: boolean;
  subject: string;
  blocks: EmailBlock[];
  primaryColor: string;
  backgroundColor: string;
  containerBackgroundColor: string;
  textColorMode: 'dark' | 'light';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MinimalEmailTemplateData {
  id: string;
  type: MerchantEmailTemplateType;
  environment: PaymentEnvironment;
  name: string;
  enabled: boolean;
  subject: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  type: MerchantEmailTemplateType;
  environment?: PaymentEnvironment;
  name?: string | null;
  enabled?: boolean;
  subject?: string | null;
  blocks?: EmailBlock[] | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  containerBackgroundColor?: string | null;
  textColorMode?: 'dark' | 'light' | null;
  isDefault?: boolean;
}

export interface UpdateEmailTemplateRequest {
  name?: string | null;
  enabled?: boolean | null;
  subject?: string | null;
  blocks?: EmailBlock[] | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  containerBackgroundColor?: string | null;
  textColorMode?: 'dark' | 'light' | null;
  isDefault?: boolean | null;
}

export interface ReadListEmailTemplatesRequest extends PaginationParams {
  environment?: PaymentEnvironment;
  type?: MerchantEmailTemplateType | null;
  enabled?: boolean | null;
  search?: string | null;
}

// ==================== MERCHANT EMAIL SETTINGS ====================

export interface MerchantEmailSettingsData {
  enabled: boolean;
  resendApiKey: string | null;
  hasResendApiKey: boolean;
  senderEmail: string | null;
  senderName: string | null;
}

export interface UpdateMerchantEmailSettingsRequest {
  enabled?: boolean | null;
  resendApiKey?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
}

// ==================== SEND TEST EMAIL ====================

export interface SendTestEmailRequest {
  email: string;
  subject: string;
  blocks?: EmailBlock[] | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  containerBackgroundColor?: string | null;
  textColor?: string | null;
  mutedColor?: string | null;
}

