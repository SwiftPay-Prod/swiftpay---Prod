// ========== Tracking Event Types ==========

/**
 * Eventos padronizados de tracking disponíveis no checkout.
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
 * Mapeamento de eventos padronizados para eventos nativos de cada plataforma.
 */
export const PLATFORM_EVENT_MAPPING = {
  facebook: {
    pageEntered: 'PageView',
    contentLoaded: 'ViewContent',
    initiateCheckout: 'initiateCheckout',
    addPaymentInfo: 'addPaymentInfo',
    clickedPurchase: 'addPaymentInfo',
    purchaseCompleted: 'Purchase',
  },
  google: {
    pageEntered: 'page_view',
    contentLoaded: 'view_item',
    initiateCheckout: 'begin_checkout',
    addPaymentInfo: 'add_payment_info',
    clickedPurchase: 'add_payment_info',
    purchaseCompleted: 'purchase',
  },
  tiktok: {
    pageEntered: 'PageView',
    contentLoaded: 'ViewContent',
    initiateCheckout: 'initiateCheckout',
    addPaymentInfo: 'addPaymentInfo',
    clickedPurchase: 'PlaceAnOrder',
    purchaseCompleted: 'CompletePayment',
  },
  kwai: {
    pageEntered: 'pageview',
    contentLoaded: 'contentView',
    initiateCheckout: 'initiateCheckout',
    addPaymentInfo: 'addToCart',
    clickedPurchase: 'addToCart',
    purchaseCompleted: 'purchase',
  },
  pinterest: {
    pageEntered: 'pagevisit',
    contentLoaded: 'viewcategory',
    initiateCheckout: 'addtocart',
    addPaymentInfo: 'addtocart',
    clickedPurchase: 'lead',
    purchaseCompleted: 'checkout',
  },
  taboola: {
    pageEntered: 'page_view',
    contentLoaded: 'view_content',
    initiateCheckout: 'start_checkout',
    addPaymentInfo: 'lead',
    clickedPurchase: 'start_checkout',
    purchaseCompleted: 'make_purchase',
  },
  utmify: {
    pageEntered: 'page_view',
    contentLoaded: 'view_content',
    initiateCheckout: 'initiate_checkout',
    addPaymentInfo: 'add_payment_info',
    clickedPurchase: 'initiate_checkout',
    purchaseCompleted: 'purchase',
  },
  otimizey: {
    pageEntered: 'page_view',
    contentLoaded: 'view_content',
    initiateCheckout: 'initiate_checkout',
    addPaymentInfo: 'add_payment_info',
    clickedPurchase: 'initiate_checkout',
    purchaseCompleted: 'purchase',
  },
} as const;

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

// ========== Tracking Types ==========

export interface ClarityTracking {
  enabled: boolean;
  projectId: string | null;
}

export interface FacebookPixelTracking {
  enabled: boolean;
  pixelId: string | null;
  accessToken: string | null;
  testEventCode: string | null;
  enableCapi: boolean;
  events: CheckoutTrackingEvent[];
}

export interface GoogleTagManagerTracking {
  enabled: boolean;
  containerId: string | null;
  events: CheckoutTrackingEvent[];
}

export interface TikTokTracking {
  enabled: boolean;
  pixelId: string | null;
  accessToken: string | null;
  enableEventsApi: boolean;
  events: CheckoutTrackingEvent[];
}

export interface KwaiTracking {
  enabled: boolean;
  pixelId: string | null;
  events: CheckoutTrackingEvent[];
}

export interface PinterestTracking {
  enabled: boolean;
  tagId: string | null;
  events: CheckoutTrackingEvent[];
}

export interface TaboolaTracking {
  enabled: boolean;
  accountId: string | null;
  events: CheckoutTrackingEvent[];
}

export interface UtmifyTracking {
  enabled: boolean;
  pixelId: string | null;
  events: CheckoutTrackingEvent[];
}

export interface OtimizeyTracking {
  enabled: boolean;
  pixelId: string | null;
  events: CheckoutTrackingEvent[];
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

// ========== Tracking Event Data ==========

export interface TrackingEventData {
  value?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
  contentType?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    price?: number;
  }>;
  numItems?: number;
  orderId?: string;
  [key: string]: unknown;
}
