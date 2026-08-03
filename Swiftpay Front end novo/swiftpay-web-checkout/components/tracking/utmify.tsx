'use client';

import Script from 'next/script';

interface UtmifyProps {
  pixelId: string;
}

export function Utmify({ pixelId }: UtmifyProps) {
  if (!pixelId) return null;

  return (
    <Script
      id="utmify-script"
      strategy="afterInteractive"
      src={`https://cdn.utmify.com.br/scripts/${pixelId}/pixel.js`}
    />
  );
}

// Utmify Event Functions
declare global {
  interface Window {
    utmify?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function trackUtmifyEvent(event: string, data?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.utmify) {
    window.utmify.track(event, data);
  }
}

export const UtmifyCheckoutEvents = {
  pageView: () => {
    trackUtmifyEvent('page_view');
  },

  viewContent: (productId: string, productName: string, value: number) => {
    trackUtmifyEvent('view_content', {
      product_id: productId,
      product_name: productName,
      value,
    });
  },

  initiateCheckout: (productId: string, value: number) => {
    trackUtmifyEvent('initiate_checkout', {
      product_id: productId,
      value,
    });
  },

  purchase: (orderId: string, productId: string, value: number) => {
    trackUtmifyEvent('purchase', {
      order_id: orderId,
      product_id: productId,
      value,
    });
  },

  addPaymentInfo: (value: number) => {
    trackUtmifyEvent('add_payment_info', {
      value,
    });
  },
};
