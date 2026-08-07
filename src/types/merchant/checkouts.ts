import type { PaginationParams } from "../common";
import type {
  CheckoutStatus,
  CheckoutTemplateType,
  CouponDiscountType,
  CouponStatus,
  FeeChargeMode,
  PaymentEnvironment,
  CheckoutColorMode,
} from "../enums";

// ========== SEO Configuration ==========

export interface OpenGraphConfig {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string | null;
  siteName: string | null;
  locale: string | null;
  type: 'website' | 'article' | 'product' | null;
}

export interface TwitterCardConfig {
  card: 'summary' | 'summary_large_image' | null;
  site: string | null;
  creator: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

export interface SeoConfig {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  openGraph: OpenGraphConfig | null;
  twitter: TwitterCardConfig | null;
}

// ========== Social Proof ==========

export interface SocialProofNotification {
  name: string;
  location: string;
  action: string;
}

export type SocialProofPosition = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';

export interface SocialProofSettings {
  enabled: boolean;
  intervalSeconds: number;
  durationSeconds: number;
  position: SocialProofPosition;
  notifications: SocialProofNotification[];
}

// ========== Tracking Events ==========

/**
 * Eventos de tracking disponíveis no checkout.
 * Cada plataforma mapeia esses eventos para seus eventos nativos.
 */
export type CheckoutTrackingEvent =
  | 'pageEntered'      // Entrou na página
  | 'contentLoaded'    // Carregou o conteúdo da página
  | 'initiateCheckout' // Iniciou o checkout (começou a preencher qualquer informação)
  | 'addPaymentInfo'   // Adicionou informações de pagamento
  | 'clickedPurchase'  // Clicou em confirmar compra / gerar PIX / cobrar cartão
  | 'purchaseCompleted'; // Realizou o pagamento / cobrança do cartão

/**
 * Configuração de eventos de tracking com boolean para cada evento.
 * Usado pela API para configurar quais eventos estão habilitados.
 */
export interface EventSettings {
  pageEntered: boolean;
  contentLoaded: boolean;
  initiateCheckout: boolean;
  addPaymentInfo: boolean;
  clickedPurchase: boolean;
  purchaseCompleted: boolean;
}

/**
 * Converte array de eventos para formato de objeto EventSettings.
 * Usado ao enviar para API.
 */
export function eventsArrayToSettings(events: CheckoutTrackingEvent[]): EventSettings {
  return {
    pageEntered: events.includes('pageEntered'),
    contentLoaded: events.includes('contentLoaded'),
    initiateCheckout: events.includes('initiateCheckout'),
    addPaymentInfo: events.includes('addPaymentInfo'),
    clickedPurchase: events.includes('clickedPurchase'),
    purchaseCompleted: events.includes('purchaseCompleted'),
  };
}

/**
 * Converte objeto EventSettings para array de eventos.
 * Usado ao ler da API para popular o UI.
 */
export function settingsToEventsArray(settings: EventSettings | null | undefined): CheckoutTrackingEvent[] {
  if (!settings) return [...DEFAULT_TRACKING_EVENTS];
  const events: CheckoutTrackingEvent[] = [];
  if (settings.pageEntered) events.push('pageEntered');
  if (settings.contentLoaded) events.push('contentLoaded');
  if (settings.initiateCheckout) events.push('initiateCheckout');
  if (settings.addPaymentInfo) events.push('addPaymentInfo');
  if (settings.clickedPurchase) events.push('clickedPurchase');
  if (settings.purchaseCompleted) events.push('purchaseCompleted');
  return events.length > 0 ? events : [...DEFAULT_TRACKING_EVENTS];
}

/**
 * Descrição de um evento de tracking com mapeamento por plataforma.
 */
export interface TrackingEventDescription {
  event: CheckoutTrackingEvent;
  label: string;
  description: string;
  platformEventName: string;
}

/**
 * Descrições dos eventos por plataforma (para exibição na UI).
 */
const facebookEvents: TrackingEventDescription[] = [
  { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'PageView' },
  { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'ViewContent' },
  { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'initiateCheckout' },
  { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'addPaymentInfo' },
  { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'addPaymentInfo' },
  { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'Purchase' },
];

const googleEvents: TrackingEventDescription[] = [
  { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'page_view' },
  { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'view_item' },
  { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'begin_checkout' },
  { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'add_payment_info' },
  { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'add_payment_info' },
  { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'purchase' },
];

export const TRACKING_EVENT_DESCRIPTIONS: Record<string, TrackingEventDescription[]> = {
  facebook: facebookEvents,
  facebookPixel: facebookEvents,
  google: googleEvents,
  googleTagManager: googleEvents,
  tiktok: [
    { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'PageView' },
    { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'ViewContent' },
    { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'initiateCheckout' },
    { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'addPaymentInfo' },
    { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'PlaceAnOrder' },
    { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'CompletePayment' },
  ],
  kwai: [
    { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'pageview' },
    { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'contentView' },
    { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'initiateCheckout' },
    { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'addToCart' },
    { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'addToCart' },
    { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'purchase' },
  ],
  pinterest: [
    { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'pagevisit' },
    { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'viewcategory' },
    { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'addtocart' },
    { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'addtocart' },
    { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'lead' },
    { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'checkout' },
  ],
  taboola: [
    { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'page_view' },
    { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'view_content' },
    { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'start_checkout' },
    { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'lead' },
    { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'start_checkout' },
    { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'make_purchase' },
  ],
  utmify: [
    { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'page_view' },
    { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'view_content' },
    { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'initiate_checkout' },
    { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'add_payment_info' },
    { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'initiate_checkout' },
    { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'purchase' },
  ],
  otimizey: [
    { event: 'pageEntered', label: 'Visualização de Página', description: 'Dispara quando o usuário entra na página do checkout', platformEventName: 'page_view' },
    { event: 'contentLoaded', label: 'Conteúdo Visualizado', description: 'Dispara quando o conteúdo do checkout é carregado', platformEventName: 'view_content' },
    { event: 'initiateCheckout', label: 'Início do Checkout', description: 'Dispara quando o usuário começa a preencher o checkout', platformEventName: 'initiate_checkout' },
    { event: 'addPaymentInfo', label: 'Info de Pagamento', description: 'Dispara quando o usuário adiciona informações de pagamento', platformEventName: 'add_payment_info' },
    { event: 'clickedPurchase', label: 'Clicou em Comprar', description: 'Dispara quando o usuário clica em confirmar/gerar PIX/pagar', platformEventName: 'initiate_checkout' },
    { event: 'purchaseCompleted', label: 'Compra Realizada', description: 'Dispara quando o pagamento é confirmado', platformEventName: 'purchase' },
  ],
};

/**
 * Eventos padrão habilitados (todos por padrão).
 */
export const DEFAULT_TRACKING_EVENTS: CheckoutTrackingEvent[] = [
  'pageEntered',
  'contentLoaded',
  'initiateCheckout',
  'addPaymentInfo',
  'clickedPurchase',
  'purchaseCompleted',
];

// ========== Tracking Settings ==========

export interface ClarityTracking {
  enabled: boolean;
  projectId: string | null;
}

export interface FacebookPixelTracking {
  enabled: boolean;
  pixelId: string | null;
  accessToken: string | null;
  testEventCode: string | null;
  enableDeduplication: boolean;
  events: EventSettings | null;
}

export interface GoogleTagManagerTracking {
  enabled: boolean;
  containerId: string | null;
  events: EventSettings | null;
}

export interface TikTokTracking {
  enabled: boolean;
  pixelId: string | null;
  accessToken: string | null;
  events: EventSettings | null;
}

export interface KwaiTracking {
  enabled: boolean;
  pixelId: string | null;
  events: EventSettings | null;
}

export interface PinterestTracking {
  enabled: boolean;
  tagId: string | null;
  events: EventSettings | null;
}

export interface TaboolaTracking {
  enabled: boolean;
  accountId: string | null;
  events: EventSettings | null;
}

export interface UtmifyTracking {
  enabled: boolean;
  pixelId: string | null;
  events: EventSettings | null;
}

export interface OtimizeyTracking {
  enabled: boolean;
  pixelId: string | null;
  events: EventSettings | null;
}

export interface TrackingSettings {
  clarity: ClarityTracking | null;
  facebookPixel: FacebookPixelTracking | null;
  googleTagManager: GoogleTagManagerTracking | null;
  tikTok: TikTokTracking | null;
  kwai: KwaiTracking | null;
  pinterest: PinterestTracking | null;
  taboola: TaboolaTracking | null;
  utmify: UtmifyTracking | null;
  otimizey: OtimizeyTracking | null;
}

// ========== Checkout Template ==========

export interface CheckoutTemplateData {
  id: string;
  code: string;
  type: CheckoutTemplateType;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
  bestFor: string | null;
  thumbnailUrl: string | null;
  previewImages: string[];
  features: string[];
  /** Modo de cobrança de taxa (null = template gratuito) */
  feeMode: FeeChargeMode | null;
  /** Taxa fixa em centavos (ex: 100 = R$ 1,00) */
  feeFixed: number;
  /** Taxa percentual em basis points (ex: 150 = 1.5%) */
  feePercentage: number;
  isActive: boolean;
  supportsCoupons: boolean;
  supportsShipping: boolean;
  supportsTimer: boolean;
  supportsSocialProof: boolean;
  supportsMinimumValue: boolean;
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

export interface CheckoutTemplateMinimal {
  id: string;
  type: CheckoutTemplateType;
  name: string;
  thumbnailUrl?: string | null;
}

// ========== Checkout Config ==========

export interface CheckoutConfigData {
  id: string;
  // Payment Settings
  pixEnabled: boolean;
  creditCardEnabled: boolean;
  boletoEnabled: boolean;
  minimumValue: number | null;
  // Feature Settings
  couponEnabled: boolean;
  shippingEnabled: boolean;
  fixedShippingAmount: number | null;
  requireCustomerPhone: boolean;
  requireCustomerAddress: boolean;
  requireCustomerDocument: boolean;
  reservationExpirationMinutes: number;
  // Redirect URLs
  successUrl: string | null;
  cancelUrl: string | null;
  callbackUrl: string | null;
  // Visual Customization
  primaryColor: string | null;
  secondaryColor: string | null;
  colorMode: CheckoutColorMode;
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  faviconUrl: string | null;
  // Custom Messages
  headerMessage: string | null;
  subHeaderMessage: string | null;
  footerMessage: string | null;
  successMessage: string | null;
  pageTitle: string | null;
  // Timer Settings
  showTimer: boolean;
  timerMinutes: number | null;
  timerText: string | null;
  timerExpiredText: string | null;
  // Social Proof Settings
  socialProofEnabled: boolean;
  socialProofSettings: SocialProofSettings | null;
  // Tracking Settings
  trackingSettings: TrackingSettings | null;
  // SEO Settings
  seo: SeoConfig | null;
  // Contact Settings
  contactWhatsAppEnabled: boolean;
  contactWhatsAppNumber: string | null;
  contactTelegramEnabled: boolean;
  contactTelegramUsername: string | null;
  contactEmailEnabled: boolean;
  contactEmail: string | null;
}

// ========== Checkout Product ==========

export interface CheckoutProductData {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productImageUrl: string | null;
  variantName: string | null;
  displayOrder: number;
  customPrice: number | null;
  originalPrice: number;
  quantity: number;
  maxQuantity: number | null;
  isActive: boolean;
}

// ========== Checkout Coupon ==========

export interface CheckoutCouponData {
  id: string;
  code: string;
  name: string | null;
  discountType: CouponDiscountType;
  discountFixedAmount: number | null;
  discountPercentage: number | null;
  status: CouponStatus;
  applyToAllCheckouts: boolean;
  currentUses: number;
  maxUses: number | null;
}

export interface CheckoutKpisData {
  accessCount: number;
  revenueAmount: number;
  orderCount: number;
  transactionCount: number;
  completedTransactions: number;
  approvalRate: number;
  customerCount: number;
}

// ========== Checkout ==========

export interface CheckoutData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  shortId: string;
  status: CheckoutStatus;
  expiresAt: string | null;
  environment: PaymentEnvironment;
  onboardingCompleted: boolean;
  onboardingStep: number;
  template: CheckoutTemplateData | null;
  config: CheckoutConfigData | null;
  products: CheckoutProductData[];
  coupons: CheckoutCouponData[];
  kpis: CheckoutKpisData;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MinimalCheckout {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  shortId: string;
  status: CheckoutStatus;
  expiresAt: string | null;
  environment: PaymentEnvironment;
  onboardingCompleted: boolean;
  onboardingStep: number;
  template: CheckoutTemplateMinimal | null;
  productCount: number;
  couponCount: number;
  paymentCount: number;
  checkoutUrl: string | null;
  createdAt: string;
}

// ========== Requests ==========

export interface ReadListCheckoutsRequest extends PaginationParams {
  search?: string | null;
  status?: CheckoutStatus | null;
  templateType?: CheckoutTemplateType | null;
  environment?: PaymentEnvironment;
}

export interface ReadListCheckoutTemplatesRequest extends PaginationParams {
  type?: CheckoutTemplateType | null;
}

export interface CreateCheckoutRequest {
  name: string;
  minimumValue?: number;
}

export interface UpdateCheckoutRequest {
  // Checkout root fields
  name?: string;
  description?: string;
  checkoutTemplateId?: string;
  clearCheckoutTemplate?: boolean;
  // Onboarding fields
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  // Payment Settings
  pixEnabled?: boolean;
  creditCardEnabled?: boolean;
  boletoEnabled?: boolean;
  pixExpirationMinutes?: number;
  // Feature Settings
  couponEnabled?: boolean;
  shippingEnabled?: boolean;
  minimumValue?: number | null;
  clearFixedShippingAmount?: boolean;
  requireCustomerPhone?: boolean;
  requireCustomerAddress?: boolean;
  requireCustomerDocument?: boolean;
  reservationExpirationMinutes?: number;
  // Redirect URLs
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  // Visual Customization
  primaryColor?: string;
  secondaryColor?: string;
  colorMode?: CheckoutColorMode;
  logoUrl?: string;
  backgroundImageUrl?: string;
  faviconUrl?: string;
  // Custom Messages
  headerMessage?: string;
  subHeaderMessage?: string;
  footerMessage?: string;
  successMessage?: string;
  pageTitle?: string;
  // Timer Settings
  showTimer?: boolean;
  timerMinutes?: number;
  timerText?: string;
  timerExpiredText?: string;
  // Social Proof Settings
  socialProofEnabled?: boolean;
  socialProofSettings?: SocialProofSettings;
  // Tracking Settings
  trackingSettings?: Partial<TrackingSettings>;
  // SEO Settings
  seo?: Partial<SeoConfig>;
  // Contact Settings
  contactWhatsAppEnabled?: boolean;
  contactWhatsAppNumber?: string;
  contactTelegramEnabled?: boolean;
  contactTelegramUsername?: string;
  contactEmailEnabled?: boolean;
  contactEmail?: string;
  productOperations?: UpdateCheckoutProductOperationRequest[];
}

export interface UpdateCheckoutProductOperationRequest {
  operation: 'add' | 'update' | 'remove';
  checkoutProductId?: string;
  productId?: string;
  variantId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface TransferCheckoutToProductionData {
  sourceCheckoutId: string;
  targetCheckoutId: string;
  targetEnvironment: PaymentEnvironment;
  skippedProductsCount: number;
  skippedCouponsCount: number;
}


