'use client';

import Script from 'next/script';

interface GoogleTagManagerProps {
  containerId: string;
}

export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  if (!containerId) return null;

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${containerId}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}

// GTM DataLayer Functions
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushToDataLayer(data: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
}

export const GTMCheckoutEvents = {
  pageView: () => {
    pushToDataLayer({
      event: 'page_view',
    });
  },

  viewItem: (itemId: string, itemName: string, price: number, currency: string = 'BRL') => {
    pushToDataLayer({
      event: 'view_item',
      ecommerce: {
        currency,
        value: price,
        items: [
          {
            item_id: itemId,
            item_name: itemName,
            price,
            quantity: 1,
          },
        ],
      },
    });
  },

  beginCheckout: (itemId: string, itemName: string, price: number, currency: string = 'BRL') => {
    pushToDataLayer({
      event: 'begin_checkout',
      ecommerce: {
        currency,
        value: price,
        items: [
          {
            item_id: itemId,
            item_name: itemName,
            price,
            quantity: 1,
          },
        ],
      },
    });
  },

  addPaymentInfo: (value: number, currency: string = 'BRL', paymentType: string = 'pix') => {
    pushToDataLayer({
      event: 'add_payment_info',
      ecommerce: {
        currency,
        value,
        payment_type: paymentType,
      },
    });
  },

  purchase: (
    transactionId: string,
    itemId: string,
    itemName: string,
    value: number,
    currency: string = 'BRL'
  ) => {
    pushToDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: transactionId,
        currency,
        value,
        items: [
          {
            item_id: itemId,
            item_name: itemName,
            price: value,
            quantity: 1,
          },
        ],
      },
    });
  },
};
