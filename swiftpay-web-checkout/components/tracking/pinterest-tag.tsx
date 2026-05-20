'use client';

import Script from 'next/script';

interface PinterestTagProps {
  tagId: string;
}

export function PinterestTag({ tagId }: PinterestTagProps) {
  if (!tagId) return null;

  return (
    <Script
      id="pinterest-tag"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(e){if(!window.pintrk){window.pintrk = function () {
          window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
          n=window.pintrk;n.queue=[],n.version="3.0";var
          t=document.createElement("script");t.async=!0,t.src=e;var
          r=document.getElementsByTagName("script")[0];
          r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
          pintrk('load', '${tagId}');
          pintrk('page');
        `,
      }}
    />
  );
}

// Pinterest Tag Event Functions
declare global {
  interface Window {
    pintrk?: (action: string, event?: string, params?: Record<string, unknown>) => void;
  }
}

export type PinterestEventName =
  | 'pagevisit'
  | 'viewcategory'
  | 'search'
  | 'addtocart'
  | 'checkout'
  | 'watchvideo'
  | 'signup'
  | 'lead'
  | 'custom';

export interface PinterestEventParams {
  event_id?: string;
  value?: number;
  currency?: string;
  order_id?: string;
  order_quantity?: number;
  product_name?: string;
  product_id?: string;
  product_category?: string;
  product_brand?: string;
  product_price?: number;
  product_quantity?: number;
  search_query?: string;
  line_items?: Array<{
    product_name?: string;
    product_id?: string;
    product_price?: number;
    product_quantity?: number;
  }>;
  [key: string]: unknown;
}

export function trackPinterestEvent(eventName: PinterestEventName, params?: PinterestEventParams): void {
  if (typeof window !== 'undefined' && window.pintrk) {
    window.pintrk('track', eventName, params);
  }
}

export const PinterestCheckoutEvents = {
  pageVisit: () => {
    trackPinterestEvent('pagevisit');
  },

  viewContent: (productId: string, productName: string, value: number, currency: string = 'BRL') => {
    trackPinterestEvent('pagevisit', {
      product_id: productId,
      product_name: productName,
      value,
      currency,
    });
  },

  checkout: (
    orderId: string,
    productId: string,
    productName: string,
    value: number,
    quantity: number = 1,
    currency: string = 'BRL'
  ) => {
    trackPinterestEvent('checkout', {
      order_id: orderId,
      value,
      currency,
      order_quantity: quantity,
      line_items: [
        {
          product_id: productId,
          product_name: productName,
          product_price: value,
          product_quantity: quantity,
        },
      ],
    });
  },

  lead: (value?: number, currency: string = 'BRL') => {
    trackPinterestEvent('lead', value ? { value, currency } : undefined);
  },

  addToCart: (productId: string, productName: string, value: number, currency: string = 'BRL') => {
    trackPinterestEvent('addtocart', {
      product_id: productId,
      product_name: productName,
      value,
      currency,
    });
  },

  addPaymentInfo: (value: number, currency: string = 'BRL') => {
    trackPinterestEvent('custom', {
      event_id: 'add_payment_info',
      value,
      currency,
    });
  },
};
