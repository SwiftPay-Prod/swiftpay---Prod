import type { PaginationParams } from '../common';
import type { PaymentEnvironment, PaymentLinkLifetimeStatus, PaymentMethod, PaymentStatus } from '../enums';

export interface CreatePaymentLinkRequest {
  enabledMethods?: Extract<PaymentMethod, 'Pix'>[];
  amount?: number;
  description?: string;
  customerId?: string;
  callbackUrl?: string;
  pixExpirationMinutes?: number;
  environment?: PaymentEnvironment;
  redirectUrl?: string;
  requiredBuyerFields?: string[];
  showFees?: boolean;
  passFeeToCustomer?: boolean;
  expiresAt?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  colorMode?: string;
  themeMode?: string;
  productName?: string;
  productImageUrl?: string;
  pixLinkMode?: string;
}
export interface PixLinkStaticResponse {
  data?: {
    qr?: string | null;
    copyAndPaste?: string | null;
    pix?: {
      qrCode?: string | null;
      copyAndPaste?: string | null;
    };
  };
}

export interface CreatePaymentLinkDataWithPix extends CreatePaymentLinkData {
  qr?: string | null;
  copyAndPaste?: string | null;
  pix?: {
    qrCode?: string | null;
    copyAndPaste?: string | null;
  };
}

export interface CreatePaymentLinkPixData {
  txId: string | null;
  qrCode: string | null;
  copyAndPaste: string | null;
  expiresAt: string | null;
}

export interface CreatePaymentLinkData {
  paymentLinkId: string;
  paymentLinkUrl: string;
  enabledMethods: Extract<PaymentMethod, 'Pix'>[];
  amount: number;
  environment: PaymentEnvironment;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
  customerId: string | null;
  redirectUrl: string | null;
  requiredBuyerFields: string[];
  showFees: boolean;
  passFeeToCustomer: boolean;
}

export interface MinimalPaymentLinkCustomer {
  id: string;
  name: string;
  email: string | null;
}

export interface MinimalPaymentLink {
  id: string;
  paymentId: string | null;
  paymentLinkUrl: string;
  amount: number;
  method: PaymentMethod;
  enabledMethods: Extract<PaymentMethod, 'Pix'>[];
  status: PaymentStatus;
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  lifetimeStatus: PaymentLinkLifetimeStatus;
  customer: MinimalPaymentLinkCustomer | null;
  pixLinkMode?: string | number | null;
}

export interface PaymentLinkDetails {
  id: string;
  paymentId: string | null;
  paymentLinkUrl: string;
  amount: number;
  enabledMethods: Extract<PaymentMethod, 'Pix'>[];
  status: PaymentStatus;
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  lifetimeStatus: PaymentLinkLifetimeStatus;
  environment: PaymentEnvironment;
  showFees: boolean;
  passFeeToCustomer: boolean;
  requiredBuyerFields: string[];
  redirectUrl: string | null;
  callbackUrl: string | null;
  pixExpirationMinutes: number | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  colorMode: string | null;
  themeMode: string | null;
  productName: string | null;
  productImageUrl: string | null;
  customer: MinimalPaymentLinkCustomer | null;
}

export interface UpdatePaymentLinkRequest {
  enabledMethods: Extract<PaymentMethod, 'Pix'>[];
  amount: number;
  description: string | null;
  callbackUrl: string | null;
  pixExpirationMinutes: number | null;
  redirectUrl: string | null;
  requiredBuyerFields: string[] | null;
  showFees: boolean;
  passFeeToCustomer: boolean;
  expiresAt: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  colorMode: string | null;
  themeMode: string | null;
  productName: string | null;
  productImageUrl: string | null;
}

export interface ReadListPaymentLinksRequest extends PaginationParams {
  merchantId: string;
  status?: PaymentStatus | null;
  method?: PaymentMethod | null;
  environment?: PaymentEnvironment | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}
