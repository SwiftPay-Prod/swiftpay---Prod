'use client';

import Script from 'next/script';

interface TaboolaPixelProps {
  accountId: string;
}

export function TaboolaPixel({ accountId }: TaboolaPixelProps) {
  if (!accountId) return null;

  const sanitizedAccountId = accountId.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Script
      id="taboola-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window._tfa = window._tfa || [];
          window._tfa.push({notify: 'event', name: 'page_view', id: ${parseInt(sanitizedAccountId, 10) || 0}});
          !function (t, f, a, x) {
            if (!document.getElementById(x)) {
              t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
            }
          }(document.createElement('script'),
          document.getElementsByTagName('script')[0],
          '//cdn.taboola.com/libtrc/unip/' + '${sanitizedAccountId}' + '/tfa.js',
          'tb_tfa_script');
        `,
      }}
    />
  );
}

// Taboola Event Functions
declare global {
  interface Window {
    _tfa?: Array<Record<string, unknown>>;
  }
}

export type TaboolaEventName =
  | 'page_view'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase'
  | 'signup'
  | 'lead'
  | 'view_content'
  | 'search'
  | 'complete_registration';

export interface TaboolaEventParams {
  revenue?: number;
  currency?: string;
  orderid?: string;
  quantity?: number;
  [key: string]: unknown;
}

export function trackTaboolaEvent(
  accountId: string,
  eventName: TaboolaEventName,
  params?: TaboolaEventParams
): void {
  if (typeof window !== 'undefined' && window._tfa) {
    window._tfa.push({
      notify: 'event',
      name: eventName,
      id: parseInt(accountId, 10),
      ...params,
    });
  }
}

export const createTaboolaCheckoutEvents = (accountId: string) => ({
  pageView: () => {
    trackTaboolaEvent(accountId, 'page_view');
  },

  viewContent: () => {
    trackTaboolaEvent(accountId, 'view_content');
  },

  checkoutStart: () => {
    trackTaboolaEvent(accountId, 'checkout_start');
  },

  purchase: (orderId: string, value: number, currency: string = 'BRL', quantity: number = 1) => {
    trackTaboolaEvent(accountId, 'purchase', {
      orderid: orderId,
      revenue: value,
      currency,
      quantity,
    });
  },

  lead: () => {
    trackTaboolaEvent(accountId, 'lead');
  },

  addPaymentInfo: (value: number, currency: string = 'BRL') => {
    trackTaboolaEvent(accountId, 'add_to_cart', {
      revenue: value,
      currency,
    });
  },
});
