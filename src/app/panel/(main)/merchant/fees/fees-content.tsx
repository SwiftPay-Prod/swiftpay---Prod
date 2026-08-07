'use client';

import type { ReactNode } from 'react';
import { Chip, Separator } from '@heroui/react';
import {
  StopWatchIcon,
  WalletRemove01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  QrCodeIcon,
  BarCodeIcon,
  CreditCardIcon,
  PercentSquareIcon,
  ArrowRight01Icon,
  MoneyReceiveSquareIcon,
  ShoppingCartCheckIn01Icon,
  Link02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { formatFeeRate, formatCurrency } from '@/utils/currency';
import type { ReadFeesData } from '@/types/merchant/settings';
import { withdrawalApprovalModeParse, mapParseColorToChipColor } from '@/parse';

interface FeesContentProps {
  fees: ReadFeesData;
}

function formatReservePercentage(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

function FeeValue({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold text-foreground ${colorClass ?? ''}`}>{value}</span>
    </div>
  );
}

function MethodStatusBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <Chip variant="soft" color={enabled ? 'success' : 'default'} size="sm" className="gap-1">
        <Icon icon={enabled ? CheckmarkCircle01Icon : CancelCircleIcon} className="icon-xs" />
        {enabled ? 'Ativo' : 'Inativo'}
      </Chip>
    </div>
  );
}

function FeeBlock({ icon, title, value, iconBg }: { icon: ReactNode; title: string; value: string; iconBg?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg ?? 'bg-surface-secondary'}`}>
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <span className="truncate text-sm font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}

function ChannelFeeCard({
  icon,
  iconClassName,
  title,
  feeValue,
  feeColorClass,
}: {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  feeValue: string;
  feeColorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={iconClassName}>{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="flex flex-col">
        <FeeValue label="Taxa" value={feeValue} colorClass={feeColorClass} />
      </div>
    </div>
  );
}

function MethodGlobalLimitsCard({
  methodLabel,
  minAmount,
  maxAmount,
}: {
  methodLabel: string;
  minAmount: string;
  maxAmount: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limites Globais de {methodLabel}</p>
      <div className="flex flex-col">
        <FeeValue label="Valor mínimo" value={minAmount} />
        <Separator />
        <FeeValue label="Valor máximo" value={maxAmount} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Esses limites valem para todos os canais ({methodLabel} via API, Checkout e Link de Pagamento).
      </p>
    </div>
  );
}

function CompensationCard({
  methodLabel,
  days,
  reservePercentageBasisPoints,
  tone,
}: {
  methodLabel: string;
  days: number;
  reservePercentageBasisPoints?: number;
  tone: 'success' | 'warning' | 'accent';
}) {
  const compensationToneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-accent';
  const shouldShowReserve = (reservePercentageBasisPoints ?? 0) > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compensação da Reserva ({methodLabel})</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 py-1">
          <Icon icon={StopWatchIcon} className={`icon-sm ${compensationToneClass}`} />
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium text-muted-foreground">Prazo de liberação</span>
            <span className={`text-sm font-semibold ${compensationToneClass}`}>{`D+${days}`}</span>
          </div>
        </div>
        {shouldShowReserve && (
          <div className="flex items-center gap-3 py-1">
            <Icon icon={PercentSquareIcon} className={`icon-sm ${compensationToneClass}`} />
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium text-muted-foreground">Reserva financeira</span>
              <span className={`text-sm font-semibold ${compensationToneClass}`}>
                {formatReservePercentage(reservePercentageBasisPoints ?? 0)}
              </span>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Esse prazo define quando o valor retido na reserva financeira desse método é liberado para o saldo disponível da organização.
      </p>
    </div>
  );
}

export function FeesContent({ fees }: FeesContentProps) {
  const withdrawalModeParse = withdrawalApprovalModeParse[fees.withdrawalApprovalMode];
  const enabledMethodsCount = [fees.pixEnabled, fees.boletoEnabled, fees.creditCardEnabled].filter(Boolean).length;
  const paymentMethodsSummary = [
    `PIX: ${fees.pixEnabled ? 'Ativo' : 'Inativo'}`,
    `Boleto: ${fees.boletoEnabled ? 'Ativo' : 'Inativo'}`,
    `Cartão: ${fees.creditCardEnabled ? 'Ativo' : 'Inativo'}`,
  ].join(' | ');
  const pixSummary = [
    `API: ${formatFeeRate(fees.pixApiFeeMode, fees.pixApiFeeFixed, fees.pixApiFeePercentage)}`,
    `Checkout: ${formatFeeRate(fees.pixCheckoutFeeMode, fees.pixCheckoutFeeFixed, fees.pixCheckoutFeePercentage)}`,
    `Link: ${formatFeeRate(fees.pixPaymentLinkFeeMode, fees.pixPaymentLinkFeeFixed, fees.pixPaymentLinkFeePercentage)}`,
    `Min: ${formatCurrency(fees.pixMinTransactionAmount)}`,
    `Max: ${formatCurrency(fees.pixMaxTransactionAmount)}`,
    `Comp.: D+${fees.pixCompensationDays}`,
    `Reserva: ${formatReservePercentage(fees.pixReservePercentage)}`,
  ].join(' | ');
  const boletoSummary = [
    `API: ${formatFeeRate(fees.boletoApiFeeMode, fees.boletoApiFeeFixed, fees.boletoApiFeePercentage)}`,
    `Checkout: ${formatFeeRate(fees.boletoCheckoutFeeMode, fees.boletoCheckoutFeeFixed, fees.boletoCheckoutFeePercentage)}`,
    `Link: ${formatFeeRate(fees.boletoPaymentLinkFeeMode, fees.boletoPaymentLinkFeeFixed, fees.boletoPaymentLinkFeePercentage)}`,
    `Min: ${formatCurrency(fees.boletoMinTransactionAmount)}`,
    `Max: ${formatCurrency(fees.boletoMaxTransactionAmount)}`,
    `Comp.: D+${fees.boletoCompensationDays}`,
    `Reserva: ${formatReservePercentage(fees.boletoReservePercentage)}`,
  ].join(' | ');
  const creditCardSummary = [
    `API: ${formatFeeRate(fees.creditCardApiFeeMode, fees.creditCardApiFeeFixed, fees.creditCardApiFeePercentage)}`,
    `Checkout: ${formatFeeRate(fees.creditCardCheckoutFeeMode, fees.creditCardCheckoutFeeFixed, fees.creditCardCheckoutFeePercentage)}`,
    `Link: ${formatFeeRate(fees.creditCardPaymentLinkFeeMode, fees.creditCardPaymentLinkFeeFixed, fees.creditCardPaymentLinkFeePercentage)}`,
    `Comp.: D+${fees.creditCardCompensationDays}`,
    `Reserva: ${formatReservePercentage(fees.creditCardReservePercentage)}`,
  ].join(' | ');
  const withdrawalSummary = [
    `Taxa: ${formatFeeRate(fees.withdrawalFeeMode, fees.withdrawalFeeFixed, fees.withdrawalFeePercentage)}`,
    `Mínimo: ${formatCurrency(fees.minWithdrawalAmount)}`,
    `Aprovação: ${withdrawalModeParse.label}`,
  ].join(' | ');
  const rateLimitsSummary = [
    `${fees.rateLimitPerMinute.toLocaleString()}/min`,
    `${fees.rateLimitPerHour.toLocaleString()}/hora`,
    `${fees.rateLimitPerDay.toLocaleString()}/dia`,
  ].join(' | ');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={<Icon icon={PercentSquareIcon} className="icon-md text-accent-foreground" />}
        title="Taxas e Limites"
        description="Visualize as taxas, limites e configurações aplicadas à sua organização."
      />

      <SystemAccordion
        id="payment-methods"
        icon={CheckmarkCircle01Icon}
        title="Métodos de Pagamento Habilitados"
        color="sky"
        defaultExpanded
        summary={`${enabledMethodsCount} de 3 métodos ativos | ${paymentMethodsSummary}`}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <MethodStatusBadge enabled={fees.pixEnabled} label="PIX" />
          <MethodStatusBadge enabled={fees.boletoEnabled} label="Boleto" />
          <MethodStatusBadge enabled={fees.creditCardEnabled} label="Cartão de Crédito" />
        </div>
      </SystemAccordion>

      {fees.pixEnabled && (
        <SystemAccordion
          id="pix-fees"
          icon={QrCodeIcon}
          title="Taxas PIX"
          color="emerald"
          defaultExpanded
          summary={pixSummary}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ChannelFeeCard
              icon={<Icon icon={MoneyReceiveSquareIcon} className="icon-sm" />}
              iconClassName="text-success"
              title="Via API"
              feeValue={formatFeeRate(fees.pixApiFeeMode, fees.pixApiFeeFixed, fees.pixApiFeePercentage)}
              feeColorClass="text-success"
            />
            <ChannelFeeCard
              icon={<Icon icon={ShoppingCartCheckIn01Icon} className="icon-sm" />}
              iconClassName="text-success"
              title="Via Checkout"
              feeValue={formatFeeRate(fees.pixCheckoutFeeMode, fees.pixCheckoutFeeFixed, fees.pixCheckoutFeePercentage)}
              feeColorClass="text-success"
            />
            <ChannelFeeCard
              icon={<Icon icon={Link02Icon} className="icon-sm" />}
              iconClassName="text-success"
              title="Via Link de Pagamento"
              feeValue={formatFeeRate(
                fees.pixPaymentLinkFeeMode,
                fees.pixPaymentLinkFeeFixed,
                fees.pixPaymentLinkFeePercentage
              )}
              feeColorClass="text-success"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <MethodGlobalLimitsCard
              methodLabel="PIX"
              minAmount={formatCurrency(fees.pixMinTransactionAmount)}
              maxAmount={formatCurrency(fees.pixMaxTransactionAmount)}
            />
            <CompensationCard
              methodLabel="PIX"
              days={fees.pixCompensationDays}
              reservePercentageBasisPoints={fees.pixReservePercentage}
              tone="success"
            />
          </div>
        </SystemAccordion>
      )}

      {fees.boletoEnabled && (
        <SystemAccordion
          id="boleto-fees"
          icon={BarCodeIcon}
          title="Taxas Boleto"
          color="amber"
          defaultExpanded
          summary={boletoSummary}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ChannelFeeCard
              icon={<Icon icon={MoneyReceiveSquareIcon} className="icon-sm" />}
              iconClassName="text-warning"
              title="Via API"
              feeValue={formatFeeRate(fees.boletoApiFeeMode, fees.boletoApiFeeFixed, fees.boletoApiFeePercentage)}
              feeColorClass="text-warning"
            />
            <ChannelFeeCard
              icon={<Icon icon={ShoppingCartCheckIn01Icon} className="icon-sm" />}
              iconClassName="text-warning"
              title="Via Checkout"
              feeValue={formatFeeRate(fees.boletoCheckoutFeeMode, fees.boletoCheckoutFeeFixed, fees.boletoCheckoutFeePercentage)}
              feeColorClass="text-warning"
            />
            <ChannelFeeCard
              icon={<Icon icon={Link02Icon} className="icon-sm" />}
              iconClassName="text-warning"
              title="Via Link de Pagamento"
              feeValue={formatFeeRate(
                fees.boletoPaymentLinkFeeMode,
                fees.boletoPaymentLinkFeeFixed,
                fees.boletoPaymentLinkFeePercentage
              )}
              feeColorClass="text-warning"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <MethodGlobalLimitsCard
              methodLabel="Boleto"
              minAmount={formatCurrency(fees.boletoMinTransactionAmount)}
              maxAmount={formatCurrency(fees.boletoMaxTransactionAmount)}
            />
            <CompensationCard
              methodLabel="Boleto"
              days={fees.boletoCompensationDays}
              reservePercentageBasisPoints={fees.boletoReservePercentage}
              tone="warning"
            />
          </div>
        </SystemAccordion>
      )}

      {fees.creditCardEnabled && (
        <SystemAccordion
          id="credit-card-fees"
          icon={CreditCardIcon}
          title="Taxas Cartão de Crédito"
          color="sky"
          defaultExpanded
          summary={creditCardSummary}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ChannelFeeCard
              icon={<Icon icon={MoneyReceiveSquareIcon} className="icon-sm" />}
              iconClassName="text-accent"
              title="Via API"
              feeValue={formatFeeRate(
                fees.creditCardApiFeeMode,
                fees.creditCardApiFeeFixed,
                fees.creditCardApiFeePercentage
              )}
              feeColorClass="text-accent"
            />
            <ChannelFeeCard
              icon={<Icon icon={ShoppingCartCheckIn01Icon} className="icon-sm" />}
              iconClassName="text-accent"
              title="Via Checkout"
              feeValue={formatFeeRate(
                fees.creditCardCheckoutFeeMode,
                fees.creditCardCheckoutFeeFixed,
                fees.creditCardCheckoutFeePercentage
              )}
              feeColorClass="text-accent"
            />
            <ChannelFeeCard
              icon={<Icon icon={Link02Icon} className="icon-sm" />}
              iconClassName="text-accent"
              title="Via Link de Pagamento"
              feeValue={formatFeeRate(
                fees.creditCardPaymentLinkFeeMode,
                fees.creditCardPaymentLinkFeeFixed,
                fees.creditCardPaymentLinkFeePercentage
              )}
              feeColorClass="text-accent"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FeeBlock
              icon={<Icon icon={PercentSquareIcon} className="icon-sm text-accent" />}
              title="Reserva financeira"
              value={formatReservePercentage(fees.creditCardReservePercentage)}
              iconBg="bg-accent/10"
            />
            <CompensationCard methodLabel="Cartão" days={fees.creditCardCompensationDays} tone="accent" />
          </div>
        </SystemAccordion>
      )}

      <SystemAccordion
        id="withdrawal-fees"
        icon={WalletRemove01Icon}
        title="Saques"
        color="violet"
        defaultExpanded
        summary={withdrawalSummary}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeeBlock
              icon={<Icon icon={PercentSquareIcon} className="icon-sm text-accent" />}
              title="Taxa de Saque"
              value={formatFeeRate(fees.withdrawalFeeMode, fees.withdrawalFeeFixed, fees.withdrawalFeePercentage)}
              iconBg="bg-accent/10"
            />
            <FeeBlock
              icon={<Icon icon={ArrowRight01Icon} className="icon-sm text-accent" />}
              title="Saque Mínimo"
              value={formatCurrency(fees.minWithdrawalAmount)}
              iconBg="bg-accent/10"
            />
            <div className="flex items-center gap-3 rounded-xl border border-divider bg-content1 p-3 transition-colors duration-200 hover:border-default/30 hover:bg-content2/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                {withdrawalModeParse.icon}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted">Aprovação</span>
                <Chip variant="soft" color={mapParseColorToChipColor(withdrawalModeParse.color)} size="sm" className="w-fit gap-1">
                  {withdrawalModeParse.label}
                </Chip>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-content1 p-3">
            <p className="text-xs text-muted">
              {fees.withdrawalApprovalMode === 'Automatic'
                ? 'Seus saques são processados automaticamente assim que solicitados.'
                : 'Seus saques passam por análise manual antes de serem aprovados (até 72h úteis).'}
            </p>
          </div>
        </div>
      </SystemAccordion>

      <SystemAccordion
        id="rate-limits"
        icon={StopWatchIcon}
        title="Limites de Requisição"
        color="slate"
        defaultExpanded
        summary={rateLimitsSummary}
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-content1 p-3">
            <p className="text-xs text-muted">
              Estes limites são aplicados por organização e ambiente para proteger a API contra uso excessivo.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeeBlock
              icon={<Icon icon={StopWatchIcon} className="icon-xs text-secondary" />}
              title="Por Minuto"
              value={fees.rateLimitPerMinute.toLocaleString()}
              iconBg="bg-secondary/10"
            />
            <FeeBlock
              icon={<Icon icon={StopWatchIcon} className="icon-xs text-secondary" />}
              title="Por Hora"
              value={fees.rateLimitPerHour.toLocaleString()}
              iconBg="bg-secondary/10"
            />
            <FeeBlock
              icon={<Icon icon={StopWatchIcon} className="icon-xs text-secondary" />}
              title="Por Dia"
              value={fees.rateLimitPerDay.toLocaleString()}
              iconBg="bg-secondary/10"
            />
          </div>
        </div>
      </SystemAccordion>
    </div>
  );
}

