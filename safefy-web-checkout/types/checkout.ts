import type { SocialProofConfig } from './social-proof';
import type { TrackingSettings } from './tracking';
import type { ProductType, CheckoutColorMode, PaymentMethod, PaymentStatus } from './enums';

// Re-export commonly used enums
export type { PaymentMethod, PaymentStatus } from './enums';

// Enums matching safefy-api-payment models
export type CheckoutStatus = "Draft" | "Active" | "Paused" | "Archived" | "Expired";
export type CheckoutTemplateType = "SingleOrder" | "Catalog" | "Transparent";
export type CouponDiscountType = "FixedAmount" | "Percentage";

// Open Graph Configuration
// Note: 'product' type is stored for potential future use but converted to 'website' for Next.js metadata
export type OpenGraphType = 'website' | 'product' | 'article';

export interface OpenGraphConfig {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string | null;
  siteName: string | null;
  locale: string | null;
  type: OpenGraphType | null;
}

// Twitter Card Configuration
export interface TwitterCardConfig {
  card: 'summary' | 'summary_large_image' | 'app' | 'player' | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  site: string | null;
  creator: string | null;
}

// Complete SEO/Social Config
export interface SeoConfig {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  openGraph: OpenGraphConfig | null;
  twitter: TwitterCardConfig | null;
}

// Checkout Template Data
export interface CheckoutTemplate {
  code: string;
  type: CheckoutTemplateType;
  name: string;
  supportsCoupons: boolean;
  supportsShipping: boolean;
  supportsTimer: boolean;
  supportsSocialProof: boolean;
  // Tracking Support
  supportsClarity: boolean;
  supportsFacebookPixel: boolean;
  supportsGoogleTagManager: boolean;
  supportsTikTok: boolean;
  supportsKwai: boolean;
  supportsPinterest: boolean;
  supportsTaboola: boolean;
  supportsUtmify: boolean;
  supportsOtimizey: boolean;
}

// Checkout Config Data
export interface CheckoutConfig {
  pixEnabled: boolean;
  creditCardEnabled: boolean;
  boletoEnabled: boolean;
  pixExpirationMinutes: number;
  defaultPaymentMethod: "Pix" | "CreditCard" | "Boleto" | null;
  couponEnabled: boolean;
  shippingEnabled: boolean;
  fixedShippingAmount: number | null;
  requireCustomerPhone: boolean;
  requireCustomerAddress: boolean;
  requireCustomerDocument: boolean;
  reservationExpirationMinutes: number;
  successUrl: string | null;
  cancelUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  colorMode: CheckoutColorMode;
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  faviconUrl: string | null;
  headerMessage: string | null;
  subHeaderMessage: string | null;
  footerMessage: string | null;
  successMessage: string | null;
  pageTitle: string | null;
  showTimer: boolean;
  timerMinutes: number | null;
  timerText: string | null;
  timerExpiredText: string | null;
  socialProof: SocialProofConfig | null;
  tracking: TrackingSettings | null;
  seo: SeoConfig | null;
  // Contact configuration
  contactWhatsAppEnabled: boolean;
  contactWhatsAppNumber: string | null;
  contactTelegramEnabled: boolean;
  contactTelegramUsername: string | null;
  contactEmailEnabled: boolean;
  contactEmail: string | null;
}

// Checkout Merchant Data
export interface CheckoutMerchant {
  name: string;
  logoUrl: string | null;
}

// Checkout Product Data
export interface CheckoutProduct {
  productId: string;
  variantId: string | null;
  name: string;
  description: string | null;
  variantName: string | null;
  type: ProductType;
  imageUrl: string | null;
  imageUrls: string[] | null;
  price: number;
  quantity: number;
  maxQuantity: number | null;
  displayOrder: number;
}

// Coupon Scope (validation response)
export type CouponScope = "Global" | "Checkout" | "Product";

// Checkout Coupon Data (from checkout list)
export interface CheckoutCoupon {
  code: string;
  name: string;
  discountType: CouponDiscountType;
  discountPercentage: number | null;
  discountFixedAmount: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
}

// Validated Coupon Data (from validate endpoint)
export interface ValidatedCoupon {
  code: string;
  name: string | null;
  discountType: CouponDiscountType;
  discountPercentage: number | null;
  discountFixedAmount: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  scope: CouponScope;
  applicableProductIds: string[] | null;
}

// Main Checkout Data (matches CheckoutPublicData from API)
export interface CheckoutData {
  shortId: string;
  name: string;
  description: string | null;
  status: CheckoutStatus;
  isExpired: boolean;
  expirationReason: string | null;
  expiresAt: string | null;
  environment: "Sandbox" | "Production";
  template: CheckoutTemplate;
  config: CheckoutConfig;
  merchant: CheckoutMerchant;
  products: CheckoutProduct[];
  coupons: CheckoutCoupon[];
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T | null;
  message: string | null;
  error: { message: string } | null;
}

// Customer data for checkout form
export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
}

// Address data for checkout form
export interface CheckoutAddress {
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

// Transaction request for creating payment
export interface CreateCheckoutTransactionRequest {
  customer: CheckoutCustomer | null;
  address: CheckoutAddress | null;
  couponCode: string | null;
  items: CheckoutTransactionItem[];
}

export interface CheckoutTransactionItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

// Order creation types
export interface CreateOrderRequest {
  method: PaymentMethod;
  items: CreateOrderItemRequest[] | null;
  couponCode: string | null;
  customer: CheckoutCustomer | null;
  address: CheckoutAddress | null;
  pixExpirationMinutes: number | null;
  orderId: string | null;
}

export interface CreateOrderItemRequest {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface OrderPixData {
  txId: string;
  qrCode: string;
  copyAndPaste: string;
  expiresAt: string;
}

export interface OrderData {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  externalId: string | null;
  method: PaymentMethod;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  environment: 'Sandbox' | 'Production';
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
  customerId: string | null;
  pix: OrderPixData | null;
}

// Checkout state for React context/hooks
export interface CheckoutState {
  checkout: CheckoutData | null;
  isLoading: boolean;
  error: string | null;
  errorType: "not_found" | "expired" | "template_not_found" | "api_error" | null;
}

// Calculate checkout request/response
export interface CalculateCheckoutRequest {
  items: CalculateCheckoutItem[];
  couponCode: string | null;
  zipCode: string | null;
}

export interface CalculateCheckoutItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface CalculatedCheckout {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponValid: boolean;
  couponError: string | null;
  items: CalculatedCheckoutItemInfo[];
}

export interface CalculatedCheckoutItemInfo {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stockQuantity: number | null;
  isInStock: boolean;
}

// Get Order response (for recovering order state)
export interface GetOrderData {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentId: string | null;
  externalId: string | null;
  method: PaymentMethod | null;
  selectedPaymentMethod: PaymentMethod | null;
  amount: number;
  currency: string | null;
  status: PaymentStatus | null;
  description: string | null;
  environment: 'Sandbox' | 'Production' | null;
  expiresAt: string | null;
  displayExpiresAt: string | null;
  createdAt: string | null;
  completedAt: string | null;
  customerId: string | null;
  couponCode: string | null;
  customer: GetOrderCustomerData | null;
  shippingAddress: GetOrderAddressData | null;
  items: GetOrderItemData[] | null;
  pix: OrderPixData | null;
}

export interface GetOrderAddressData {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
}

export interface GetOrderCustomerData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  document: string | null;
}

export interface GetOrderItemData {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isInStock: boolean;
  stockQuantity: number | null;
}

// Reserve Order types (stock reservation system)
export interface ReserveOrderRequest {
  sessionId: string;
  items: ReserveOrderItemRequest[];
  customer: {
    email: string;
    document: string | null;
  };
  couponCode: string | null;
}

export interface ReserveOrderItemRequest {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export type OrderStatus = 'Draft' | 'Reserved' | 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Expired' | 'Failed' | 'Refunded' | 'PartiallyRefunded';

export interface ReservedOrderData {
  orderId: string;
  orderNumber: string;
  sessionId: string | null;
  status: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  reservedAt: string;
  expiresAt: string;
  displayExpiresAt: string;
  items: ReservedOrderItemData[];
  customer: ReservedOrderCustomerData | null;
}

export interface ReservedOrderItemData {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number | null;
  isInStock: boolean;
}

export interface ReservedOrderCustomerData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  document: string | null;
}

// Update Order types (for updating reserved orders)
export interface UpdateOrderRequest {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
  };
  address?: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  selectedPaymentMethod?: PaymentMethod;
}

export interface UpdateOrderData {
  orderId: string;
  orderNumber: string;
  selectedPaymentMethod: PaymentMethod | null;
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    document: string | null;
  } | null;
  address: {
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
  updatedAt: string;
}

// Payment Link types
export interface PaymentLinkPixData {
  txId: string | null;
  qrCode: string | null;
  copyAndPaste: string | null;
  expiresAt: string | null;
}

export interface PaymentLinkBoletoData {
  barcode: string | null;
  digitableLine: string | null;
  pdfUrl: string | null;
  recipientName: string | null;
  recipientDocument: string | null;
  payerName: string | null;
  payerDocument: string | null;
  pixCopyAndPaste: string | null;
  pixQrCode: string | null;
  pixExpiresAt: string | null;
  dueDate: string | null;
  barcodeImageUrl: string | null;
}

export type ApiEnvironment = 'Sandbox' | 'Production';

export interface PaymentLinkData {
  id: string;
  paymentLinkId: string;
  paymentId: string | null;
  enabledMethods: PaymentMethod[];
  method: PaymentMethod | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  environment: ApiEnvironment;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
  isPaymentStarted: boolean;
  isUnlimitedLink: boolean;
  redirectUrl: string | null;
  requiredBuyerFields: string[];
  showFees: boolean;
  feeAmounts: Record<string, number>;
  passFeeToCustomer: boolean;
  showSafefyBranding: boolean;
  themeMode: 'Light' | 'Dark' | 'Auto' | null;
  logoUrl: string | null;
  productName: string | null;
  productImageUrl: string | null;
  pix: PaymentLinkPixData | null;
  boleto: PaymentLinkBoletoData | null;
}
