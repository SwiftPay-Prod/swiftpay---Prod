import {
  AcquirerType,
  PaymentEnvironment,
  PaymentMethod,
  PaymentStatus,
  AccountType,
  LedgerEntryType,
  CallbackStatus,
  PaymentRequestSource,
  ProviderCategory,
} from "../enums";
import type { PaginationParams } from "../common";

export interface AdminMinimalTransactionMerchantInfo {
  id: string;
  name: string | null;
  document: string | null;
}

export interface AdminMinimalTransactionAcquirerInfo {
  id: string;
  name: string;
  displayName: string | null;
  code: string;
  nominal: string | null;
  logoUrl: string | null;
  providerCategory?: ProviderCategory | null;
}

export interface AdminMinimalTransactionPixInfo {
  payerName: string | null;
  payerBank: string | null;
}

export interface AdminMinimalTransaction {
  id: string;
  transactionVisualizationUrl: string | null;
  isWayneProtocol: boolean;
  amount: number;
  fee: number;
  profit: number;
  method: PaymentMethod;
  requestSource: PaymentRequestSource;
  status: PaymentStatus;
  environment: PaymentEnvironment;
  createdAt: string;
  merchant: AdminMinimalTransactionMerchantInfo;
  acquirer: AdminMinimalTransactionAcquirerInfo | null;
  pix: AdminMinimalTransactionPixInfo | null;
}

export interface AdminListTransactionsRequest extends PaginationParams {
  merchantId?: string | null;
  acquirerId?: string | null;
  status?: PaymentStatus | null;
  method?: PaymentMethod | null;
  environment?: PaymentEnvironment | null;
  search?: string | null;
}

export interface AdminTransactionMerchantDetails {
  id: string;
  name: string | null;
  email: string | null;
}

export interface AdminTransactionAcquirerDetails {
  id: string;
  name: string | null;
  nominal: string | null;
  transactionId: string | null;
  paymentId: string | null;
  status: string | null;
}

export interface AdminTransactionCustomerDetails {
  id: string;
  name: string | null;
  email: string | null;
  document: string | null;
}

export interface AdminTransactionPixDetails {
  txId: string | null;
  endToEndId: string | null;
  qrCode: string | null;
  copyAndPaste: string | null;
  payerName: string | null;
  payerDocument: string | null;
  payerBank: string | null;
  paidAt: string | null;
  expiresAt: string | null;
}

export interface AdminTransactionBoletoDetails {
  barcode: string | null;
  digitableLine: string | null;
  pdfUrl: string | null;
  proxyUrl: string | null;
  dueDate: string | null;
}

export interface AdminTransactionDetails {
  id: string;
  transactionVisualizationUrl: string | null;
  isWayneProtocol: boolean;
  externalId: string | null;
  amount: number;
  platformFee: number;
  checkoutFeeAmount: number;
  acquirerFee: number;
  netAmount: number;
  reserveDeductedAmount: number;
  acquirerNetAmount: number;
  profit: number;
  description: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  environment: PaymentEnvironment;
  requestOrigin: string | null;
  failureReason: string | null;
  metadata: string | null;
  callbackUrl: string | null;
  callbackStatus: CallbackStatus;
  callbackAttempts: number;
  callbackLastAttemptAt: string | null;
  callbackError: string | null;
  createdAt: string;
  completedAt: string | null;
  refundedAt: string | null;
  expiresAt: string | null;
  merchant: AdminTransactionMerchantDetails;
  acquirer: AdminTransactionAcquirerDetails | null;
  customer: AdminTransactionCustomerDetails | null;
  pix: AdminTransactionPixDetails | null;
  boleto: AdminTransactionBoletoDetails | null;
}

export interface AdminTransactionLedgerAccountData {
  id: string;
  type: AccountType;
}

export interface AdminTransactionLedgerEntryData {
  id: string;
  transactionId: string;
  type: LedgerEntryType;
  amount: number;
  timestamp: string;
  description: string;
  account: AdminTransactionLedgerAccountData;
}

export interface AdminTransactionLedgerData {
  paymentId: string;
  merchantId: string;
  merchantName: string | null;
  amount: number;
  platformFee: number;
  acquirerFee: number;
  netAmount: number;
  profit: number;
  entries: AdminTransactionLedgerEntryData[];
}

export interface AdminReprocessCompletedTransactionDevData {
  id: string;
  status: PaymentStatus;
  completedAt: string | null;
  message: string;
}

export type AdminReprocessTransactionTargetStatus = 'Completed' | 'Failed';

export interface AdminReprocessTransactionRequest {
  targetStatus: AdminReprocessTransactionTargetStatus;
}

export interface AdminForceAcquirerWebhookRequest {
  acquirerType: AcquirerType;
  payloadJson: string;
}

export interface AdminForceAcquirerWebhookDevData {
  transactionId: string;
  acquirerType: AcquirerType;
  paymentId: string | null;
  txId: string | null;
  endToEndId: string | null;
  status: string | null;
  processed: boolean;
  message: string;
}



