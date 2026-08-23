import type {
  OrderStatus,
  OrderFulfillmentStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentEnvironment,
  CouponDiscountType,
} from '../enums';
import type { PaginationParams } from '../common';

// ============== CREATE ORDER ==============

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CreateOrderShippingAddressInput {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface CreateOrderRequest {
  merchantId: string;
  customerId: string;
  environment?: PaymentEnvironment;
  paymentMethod?: Extract<PaymentMethod, 'Pix'> | null;
  items: CreateOrderItemInput[];
  couponCode?: string | null;
  shippingAmount?: number | null;
  shippingAddress?: CreateOrderShippingAddressInput | null;
  notes?: string | null;
  callbackUrl?: string | null;
  expiresInMinutes?: number | null;
  metadata?: Record<string, string> | null;
}

export interface CreateOrderItemResult {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderPixResult {
  txId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  couponCode: string | null;
  couponId: string | null;
  itemsCount: number;
  items: CreateOrderItemResult[];
  paymentId: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentFee: number;
  paymentNetAmount: number;
  pix: CreateOrderPixResult | null;
  createdAt: string;
}

// ============== EXISTING TYPES ==============

export interface MinimalOrderCustomer {
  id: string;
  name: string;
  email: string | null;
}

export interface MinimalOrderPayment {
  id: string;
  status: PaymentStatus;
  method: Extract<PaymentMethod, 'Pix'>;
  completedAt: string | null;
}

export interface MinimalOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string | null;
  customer: MinimalOrderCustomer | null;
  payment: MinimalOrderPayment | null;
}

export interface OrderCustomerDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
}

export interface OrderPaymentDetails {
  id: string;
  status: PaymentStatus;
  method: Extract<PaymentMethod, 'Pix'>;
  amount: number;
  fee: number;
  netAmount: number;
  createdAt: string;
  completedAt: string | null;
  refundedAt: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixTxId: string | null;
  pixEndToEndId: string | null;
}

export interface OrderCouponDetails {
  id: string;
  code: string;
  discountType: CouponDiscountType;
}

export interface OrderShippingAddress {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface OrderItemDetails {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  environment: PaymentEnvironment;
  status: OrderStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  couponCode: string | null;
  notes: string | null;
  shippingAddress: OrderShippingAddress | null;
  createdAt: string;
  updatedAt: string | null;
  customer: OrderCustomerDetails | null;
  payment: OrderPaymentDetails | null;
  coupon: OrderCouponDetails | null;
  items: OrderItemDetails[];
}

export interface ReadListOrdersRequest extends PaginationParams {
  merchantId: string;
  status?: OrderStatus | null;
  fulfillmentStatus?: OrderFulfillmentStatus | null;
  environment?: PaymentEnvironment | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateOrderFulfillmentRequest {
  merchantId: string;
  orderId: string;
  fulfillmentStatus: OrderFulfillmentStatus;
}

export interface UpdateOrderFulfillmentData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  updatedAt: string;
}

