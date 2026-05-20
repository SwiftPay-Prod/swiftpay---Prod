'use client';

import Script from 'next/script';
import type { TikTokTracking } from '@/types/tracking';

interface TikTokPixelProps {
  config: TikTokTracking;
}

export function TikTokPixel({ config }: TikTokPixelProps) {
  const { pixelId } = config;

  if (!pixelId) return null;

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${pixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}

// TikTok Pixel Event Functions
declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify: (params: Record<string, unknown>) => void;
    };
  }
}

export type TikTokEventName =
  | 'ViewContent'
  | 'ClickButton'
  | 'Search'
  | 'AddToWishlist'
  | 'AddToCart'
  | 'initiateCheckout'
  | 'addPaymentInfo'
  | 'CompletePayment'
  | 'PlaceAnOrder'
  | 'Contact'
  | 'Download'
  | 'SubmitForm'
  | 'CompleteRegistration'
  | 'Subscribe';

export interface TikTokEventParams {
  content_id?: string;
  content_type?: string;
  content_name?: string;
  currency?: string;
  value?: number;
  quantity?: number;
  price?: number;
  query?: string;
  description?: string;
  [key: string]: unknown;
}

export function trackTikTokEvent(eventName: TikTokEventName, params?: TikTokEventParams): void {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(eventName, params);
  }
}

export const TikTokCheckoutEvents = {
  pageView: () => {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.page();
    }
  },

  viewContent: (contentId: string, contentName: string, value: number, currency: string = 'BRL') => {
    trackTikTokEvent('ViewContent', {
      content_id: contentId,
      content_name: contentName,
      content_type: 'product',
      value,
      currency,
    });
  },

  initiateCheckout: (contentId: string, value: number, currency: string = 'BRL') => {
    trackTikTokEvent('initiateCheckout', {
      content_id: contentId,
      content_type: 'product',
      value,
      currency,
    });
  },

  addPaymentInfo: (value: number, currency: string = 'BRL') => {
    trackTikTokEvent('addPaymentInfo', {
      value,
      currency,
    });
  },

  completePayment: (contentId: string, value: number, currency: string = 'BRL', quantity: number = 1) => {
    trackTikTokEvent('CompletePayment', {
      content_id: contentId,
      content_type: 'product',
      value,
      currency,
      quantity,
    });
  },

  placeAnOrder: (contentId: string, value: number, currency: string = 'BRL') => {
    trackTikTokEvent('PlaceAnOrder', {
      content_id: contentId,
      content_type: 'product',
      value,
      currency,
    });
  },
};
