'use client';

import Script from 'next/script';

interface KwaiPixelProps {
  pixelId: string;
}

export function KwaiPixel({ pixelId }: KwaiPixelProps) {
  if (!pixelId) return null;

  return (
    <Script
      id="kwai-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(e,t,n,s,a,c,i,o,p){e.KwsAnalytics=a,e[a]=e[a]||function(){
          (e[a].q=e[a].q||[]).push(arguments)},e[a].l=1*new Date,c=t.createElement(n),
          i=t.getElementsByTagName(n)[0],c.async=1,c.src=s,i.parentNode.insertBefore(c,i)
          }(window,document,"script","https://s1.kwai.net/kos/s101/nlav11187/pixel-sdk/pixel.js","kwaiq");
          kwaiq.load('${pixelId}');
          kwaiq.page();
        `,
      }}
    />
  );
}

// Kwai Pixel Event Functions
declare global {
  interface Window {
    kwaiq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      instance: (pixelId: string) => {
        track: (event: string, params?: Record<string, unknown>) => void;
      };
    };
  }
}

export type KwaiEventName =
  | 'contentView'
  | 'buttonClick'
  | 'purchase'
  | 'registration'
  | 'addToCart'
  | 'addToWishlist'
  | 'initiateCheckout'
  | 'search'
  | 'viewContent'
  | 'completePayment';

export interface KwaiEventParams {
  content_id?: string;
  content_type?: string;
  content_name?: string;
  currency?: string;
  value?: number;
  [key: string]: unknown;
}

export function trackKwaiEvent(eventName: KwaiEventName, params?: KwaiEventParams): void {
  if (typeof window !== 'undefined' && window.kwaiq) {
    window.kwaiq.track(eventName, params);
  }
}

export const KwaiCheckoutEvents = {
  pageView: () => {
    if (typeof window !== 'undefined' && window.kwaiq) {
      window.kwaiq.page();
    }
  },

  viewContent: (contentId: string, contentName: string, value: number, currency: string = 'BRL') => {
    trackKwaiEvent('contentView', {
      content_id: contentId,
      content_name: contentName,
      content_type: 'product',
      value,
      currency,
    });
  },

  initiateCheckout: (contentId: string, value: number, currency: string = 'BRL') => {
    trackKwaiEvent('initiateCheckout', {
      content_id: contentId,
      content_type: 'product',
      value,
      currency,
    });
  },

  purchase: (contentId: string, value: number, currency: string = 'BRL') => {
    trackKwaiEvent('purchase', {
      content_id: contentId,
      content_type: 'product',
      value,
      currency,
    });
  },

  addPaymentInfo: (value: number, currency: string = 'BRL') => {
    trackKwaiEvent('completePayment', {
      value,
      currency,
    });
  },

  addToCart: (contentId: string, value: number, currency: string = 'BRL') => {
    trackKwaiEvent('addToCart', {
      content_id: contentId,
      content_type: 'product',
      value,
      currency,
    });
  },
};
