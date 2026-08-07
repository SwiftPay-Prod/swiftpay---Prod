'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/currency';

const MOCK_TEMPLATE = {
  name: 'Modern Flow',
  type: 'Single Order',
  description: 'Checkout otimizado para vendas únicas e links temporários.',
  price: 14990,
  feeMode: 'paid',
  supportsCoupons: true,
  supportsTracking: true,
  features: [
    { title: 'PIX automático', supported: true },
    { title: 'Cartão de crédito', supported: true },
    { title: 'Boleto', supported: true },
    { title: 'Cupons', supported: true },
    { title: 'Rastreamento', supported: true },
    { title: 'Recorrência', supported: false },
  ],
  tracking: [
    { title: 'Google Tag Manager', supported: true },
    { title: 'Facebook Pixel', supported: true },
    { title: 'TikTok', supported: false },
    { title: 'UTMify', supported: true },
  ],
};

export default function MockCheckoutPage() {
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-default bg-content1 p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Template
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{MOCK_TEMPLATE.name}</h1>
            <p className="text-sm text-muted">{MOCK_TEMPLATE.description}</p>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-sm text-muted">Valor do pedido</span>
              <div className="text-3xl font-semibold">
                {formatCurrency(MOCK_TEMPLATE.price)}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:w-72">
              <Button
                color="primary"
                size="lg"
                className="w-full"
                isDisabled={paid}
                onPress={() => {
                  setIsPaying(true);
                  setTimeout(() => {
                    setIsPaying(false);
                    setPaid(true);
                  }, 1200);
                }}
              >
                {paid ? 'Pagamento confirmado' : isPaying ? 'Processando...' : 'Pagar agora'}
              </Button>

              {paid && (
                <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
                  <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
                  Pagamento aprovado com sucesso.
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-default bg-content2 p-4">
              <h2 className="text-sm font-semibold">Funcionalidades</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {MOCK_TEMPLATE.features.map((feature) => (
                  <li key={feature.title} className="flex items-center gap-2">
                    <Icon
                      icon={feature.supported ? CheckmarkCircle02Icon : CancelCircleIcon}
                      className={`icon-sm ${feature.supported ? 'text-success' : 'text-danger'}`}
                    />
                    <span className={feature.supported ? '' : 'text-muted line-through'}>
                      {feature.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-default bg-content2 p-4">
              <h2 className="text-sm font-semibold">Rastreamento e integrações</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {MOCK_TEMPLATE.tracking.map((item) => (
                  <li key={item.title} className="flex items-center gap-2">
                    <Icon
                      icon={item.supported ? CheckmarkCircle02Icon : CancelCircleIcon}
                      className={`icon-sm ${item.supported ? 'text-success' : 'text-danger'}`}
                    />
                    <span className={item.supported ? '' : 'text-muted line-through'}>
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
