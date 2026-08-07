import { PaymentEnvironment, PaymentMethod, PaymentStatus, CallbackStatus, OrderStatus, OrderFulfillmentStatus, PaymentRequestSource } from "../enums";
import type { PaginationParams } from "../common";

export interface MinimalPaymentPix {
  txId: string | null;
  endToEndId: string | null;
  payerName: string | null;
  payerDocument: string | null;
  payerBank: string | null;
  paidAt: string | null;
}

export interface MinimalPaymentCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
}

export interface MinimalPayment {
  id: string;
  transactionVisualizationUrl: string | null;
  amount: number;
  fee: number;
  netAmount: number;
  description: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  requestSource: PaymentRequestSource;
  isCheckoutPayment: boolean;
  checkoutName: string | null;
  hasCallbackUrl: boolean;
  createdAt: string;
  completedAt: string | null;
  refundedAt: string | null;
  customer: MinimalPaymentCustomer | null;
  pix: MinimalPaymentPix | null;
}

export interface ReadListPaymentsRequest extends PaginationParams {
  merchantId: string;
  status?: PaymentStatus | null;
  method?: PaymentMethod | null;
  environment?: PaymentEnvironment | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
  customerId?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentCustomerDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
}

export interface PaymentPixDetails {
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

export interface PaymentBoletoDetails {
  barcode: string | null;
  digitableLine: string | null;
  pdfUrl: string | null;
  proxyUrl: string | null;
  dueDate: string | null;
}

export interface PaymentOrderItemDetails {
  id: string;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentOrderDetails {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  totalAmount: number;
  createdAt: string;
  items: PaymentOrderItemDetails[];
}

export interface PaymentDetails {
  id: string;
  transactionVisualizationUrl: string | null;
  externalId: string | null;
  amount: number;
  fee: number;
  checkoutFeeAmount: number;
  netAmount: number;
  description: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  requestSource: PaymentRequestSource;
  isCheckoutPayment: boolean;
  checkoutId: string | null;
  checkoutName: string | null;
  environment: PaymentEnvironment;
  reserveDeductedAmount: number;
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
  orderId: string | null;
  order: PaymentOrderDetails | null;
  customer: PaymentCustomerDetails | null;
  pix: PaymentPixDetails | null;
  boleto: PaymentBoletoDetails | null;
}

export interface CreatePaymentRequest {
  merchantId: string;
  environment?: PaymentEnvironment;
  method: PaymentMethod;
  amount: number;
  description?: string;
  customerId?: string;
  customerPhone?: string;
  pixExpirationMinutes?: number;
  boletoDueDate?: string;
  boletoInstructions?: string;
  cardNumber?: string;
  cardHolderName?: string;
  cardExpirationMonth?: number;
  cardExpirationYear?: number;
  installments?: number;
  cardCvv?: string;
  callbackUrl?: string;
  metadata?: string;
}

export interface CreatePaymentPixData {
  txId: string | null;
  qrCode: string | null;
  copyAndPaste: string | null;
  expiresAt: string | null;
}

export interface CreatePaymentBoletoData {
  barcode: string | null;
  digitableLine: string | null;
  pdfUrl: string | null;
  dueDate: string | null;
}

export interface CreatePaymentData {
  id: string;
  externalId: string | null;
  method: PaymentMethod;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  environment: PaymentEnvironment;
  expiresAt: string | null;
  createdAt: string;
  customerId: string | null;
  pix: CreatePaymentPixData | null;
  boleto: CreatePaymentBoletoData | null;
}


export interface PreviewPaymentRequest {
  amount: number;
  method?: PaymentMethod;
  installments?: number;
  feeContext?: 'Api' | 'Checkout' | 'PaymentLink';
  environment?: PaymentEnvironment;
}

export interface PreviewPaymentData {
  amount: number;
  fee: number;
  netAmount: number;
}

