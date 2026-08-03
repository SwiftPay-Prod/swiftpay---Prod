'use client';

import Script from 'next/script';

interface OtimizeyProps {
  pixelId: string;
}

export function Otimizey({ pixelId }: OtimizeyProps) {
  if (!pixelId) return null;

  return (
    <Script
      id="otimizey-script"
      strategy="afterInteractive"
      src={`https://cdn.otimizey.com/pixel/${pixelId}.js`}
    />
  );
}

// Otimizey Event Functions
declare global {
  interface Window {
    otimizey?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function trackOtimizeyEvent(event: string, data?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.otimizey) {
    window.otimizey.track(event, data);
  }
}

export const OtimizeyCheckoutEvents = {
  pageView: () => {
    trackOtimizeyEvent('page_view');
  },

  viewContent: (productId: string, productName: string, value: number) => {
    trackOtimizeyEvent('view_content', {
      product_id: productId,
      product_name: productName,
      value,
    });
  },

  initiateCheckout: (productId: string, value: number) => {
    trackOtimizeyEvent('initiate_checkout', {
      product_id: productId,
      value,
    });
  },

  purchase: (orderId: string, productId: string, value: number) => {
    trackOtimizeyEvent('purchase', {
      order_id: orderId,
      product_id: productId,
      value,
    });
  },

  addPaymentInfo: (value: number) => {
    trackOtimizeyEvent('add_payment_info', {
      value,
    });
  },
};
