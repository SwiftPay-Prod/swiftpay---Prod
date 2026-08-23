'use client';

import { Chip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SystemAccordion } from '@/components/ui/system-accordion';
import {
  CheckmarkCircle02Icon,
  Alert01Icon,
  InformationCircleIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import type { CheckoutData } from '@/types/merchant/checkouts';
import { CheckoutColorMode } from '@/types/enums';

interface ReviewTabProps {
  merchantId: string;
  checkout: CheckoutData;
  onRefresh: () => void;
  reviewDraft?: {
    payments?: {
      pixEnabled: boolean;
      hasPendingChanges: boolean;
    } | null;
    customer?: {
      requireCustomerPhone: boolean;
      requireCustomerDocument: boolean;
      requireCustomerAddress: boolean;
      hasPendingChanges: boolean;
    } | null;
    products?: {
      count: number;
      hasPendingChanges: boolean;
    } | null;
    features?: {
      couponEnabled: boolean;
      showTimer: boolean;
      timerMinutes: number;
      hasPendingChanges: boolean;
    } | null;
    urls?: {
      successUrl: string;
      cancelUrl: string;
      callbackUrl: string;
      hasPendingChanges: boolean;
    } | null;
    contact?: {
      contactWhatsAppEnabled: boolean;
      contactTelegramEnabled: boolean;
      contactEmailEnabled: boolean;
      hasPendingChanges: boolean;
    } | null;
    messages?: {
      pageTitle: string;
      headerMessage: string;
      subHeaderMessage: string;
      footerMessage: string;
      successMessage: string;
      hasPendingChanges: boolean;
    } | null;
    tracking?: {
      hasPendingChanges: boolean;
    } | null;
    seo?: {
      hasPendingChanges: boolean;
    } | null;
    visual?: {
      primaryColor: string;
      colorMode: CheckoutColorMode;
      hasPendingChanges: boolean;
    } | null;
  };
}

interface ReviewChecklistItem {
  id: string;
  label: string;
  ok: boolean;
}

interface SummaryField {
  id: string;
  label: string;
  value: string;
}

export function ReviewTab({ merchantId, checkout, onRefresh, reviewDraft }: ReviewTabProps) {
  const _merchantId = merchantId;
  const _onRefresh = onRefresh;

  const config = checkout.config;
  const effectivePayments = reviewDraft?.payments;
  const effectiveProductsCount = reviewDraft?.products?.count ?? checkout.products.length;

  const hasLocalDraftChanges = [
    effectivePayments?.hasPendingChanges,
    reviewDraft?.customer?.hasPendingChanges,
    reviewDraft?.products?.hasPendingChanges,
    reviewDraft?.features?.hasPendingChanges,
    reviewDraft?.urls?.hasPendingChanges,
    reviewDraft?.contact?.hasPendingChanges,
    reviewDraft?.messages?.hasPendingChanges,
    reviewDraft?.tracking?.hasPendingChanges,
    reviewDraft?.seo?.hasPendingChanges,
    reviewDraft?.visual?.hasPendingChanges,
  ].some(Boolean);

  const paymentMethods = [
    (effectivePayments?.pixEnabled ?? config?.pixEnabled ?? true) ? 'PIX' : null,
  ].filter((item): item is string => !!item);

  const checklist: ReviewChecklistItem[] = [
    {
      id: 'name',
      label: 'Nome definido',
      ok: !!checkout.name?.trim(),
    },
    {
      id: 'template',
      label: 'Template definido',
      ok: !!checkout.template,
    },
    {
      id: 'payment-methods',
      label: 'Metodos de pagamento ativos',
      ok: paymentMethods.length > 0,
    },
    {
      id: 'products',
      label: 'Produtos vinculados',
      ok: true,
    },
  ];

  const completedChecklist = checklist.filter((item) => item.ok).length;
  const pendingChecklist = checklist.length - completedChecklist;
  const isReadyToPublish = completedChecklist === checklist.length;

  const summaryFields: SummaryField[] = [
    {
      id: 'name',
      label: 'Nome',
      value: checkout.name?.trim() || 'Nao informado',
    },
    {
      id: 'template',
      label: 'Template',
      value: checkout.template?.name?.trim() || 'Nenhum selecionado',
    },
    {
      id: 'payments',
      label: 'Pagamento',
      value: paymentMethods.join(', ') || 'Nenhum',
    },
    {
      id: 'products',
      label: 'Produtos',
      value: `${effectiveProductsCount}`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SystemAccordion
        id="review-pendencies"
        icon={isReadyToPublish ? CheckmarkCircle02Icon : Alert01Icon}
        color={isReadyToPublish ? 'success' : 'warning'}
        title={isReadyToPublish ? 'Checkout pronto para ativacao' : 'Checkout com pendencias'}
        summary="Revise o resumo geral e confirme os requisitos minimos antes de finalizar."
        defaultExpanded
        bodyClassName="flex flex-col gap-4 py-4"
      >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">
                  {isReadyToPublish ? 'Checkout pronto para ativacao' : 'Checkout com pendencias'}
                </p>
                <p className="text-xs text-muted">
                  Revise o resumo geral e confirme os requisitos minimos antes de finalizar.
                </p>
              </div>
            </div>
            <Chip variant="soft" color={isReadyToPublish ? 'success' : 'warning'} size="sm">
              {isReadyToPublish ? 'Pronto' : `${pendingChecklist} pendente(s)`}
            </Chip>
          </div>

          {hasLocalDraftChanges && (
            <div className="flex items-center gap-2 rounded-lg border border-warning-soft-hover bg-warning-soft px-3 py-2">
              <Icon icon={InformationCircleIcon} className="icon-sm text-warning" />
              <p className="text-xs text-warning-soft-foreground">
                Voce esta vendo alteracoes locais ainda nao salvas.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {summaryFields.map((field) => (
              <div key={field.id} className="rounded-lg border border-divider px-3 py-2">
                <p className="text-xs text-muted">{field.label}</p>
                <p className="text-sm font-medium">{field.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-content2 p-3">
            <Icon icon={Tick02Icon} className="icon-sm mt-0.5 shrink-0 text-accent" />
            <p className="text-xs text-muted">
              O resumo desta etapa mostra apenas nome, template, pagamentos e produtos. Ao salvar e finalizar,
              alteracoes pendentes sao persistidas antes da conclusao do onboarding.
            </p>
          </div>
      </SystemAccordion>
    </div>
  );
}
