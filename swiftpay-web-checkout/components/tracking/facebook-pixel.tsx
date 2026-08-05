'use client';

import Image from 'next/image';
import Script from 'next/script';
import type { FacebookPixelTracking } from '@/types/tracking';

interface FacebookPixelProps {
  config: FacebookPixelTracking;
}

export function FacebookPixel({ config }: FacebookPixelProps) {
  const { pixelId, testEventCode } = config;

  if (!pixelId) return null;

  const testEventCodeParam = testEventCode ? `&test_event_code=${testEventCode}` : '';

  return (
    <>
      <Script
        id="facebook-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}'${testEventCodeParam ? `, {testEventCode: '${testEventCode}'}` : ''});
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <Image
          height={1}
          width={1}
          unoptimized
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1${testEventCodeParam}`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Facebook Pixel Event Tracking Functions
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type FacebookEventName =
  | 'PageView'
  | 'ViewContent'
  | 'initiateCheckout'
  | 'addPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'AddToCart'
  | 'Search'
  | 'AddToWishlist'
  | 'StartTrial'
  | 'Subscribe'
  | 'Schedule'
  | 'Contact'
  | 'SubmitApplication'
  | 'FindLocation'
  | 'Donate'
  | 'CustomizeProduct';

export interface FacebookEventParams {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  num_items?: number;
  order_id?: string;
  search_string?: string;
  status?: string;
  [key: string]: unknown;
}

export function trackFacebookEvent(eventName: FacebookEventName, params?: FacebookEventParams): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
}

export function trackFacebookCustomEvent(eventName: string, params?: FacebookEventParams): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

// Standard checkout events
export const FacebookCheckoutEvents = {
  pageView: () => {
    trackFacebookEvent('PageView');
  },

  viewProduct: (productId: string, productName: string, value: number, currency: string = 'BRL') => {
    trackFacebookEvent('ViewContent', {
      content_ids: [productId],
      content_name: productName,
      content_type: 'product',
      value,
      currency,
    });
  },

  initiateCheckout: (productId: string, value: number, currency: string = 'BRL') => {
    trackFacebookEvent('initiateCheckout', {
      content_ids: [productId],
      content_type: 'product',
      value,
      currency,
    });
  },

  addPaymentInfo: (value: number, currency: string = 'BRL') => {
    trackFacebookEvent('addPaymentInfo', {
      value,
      currency,
    });
  },

  purchase: (
    orderId: string,
    productId: string,
    value: number,
    currency: string = 'BRL',
    quantity: number = 1
  ) => {
    trackFacebookEvent('Purchase', {
      content_ids: [productId],
      content_type: 'product',
      contents: [{ id: productId, quantity }],
      value,
      currency,
      order_id: orderId,
      num_items: quantity,
    });
  },

  lead: (value?: number, currency: string = 'BRL') => {
    trackFacebookEvent('Lead', value ? { value, currency } : undefined);
  },
};
