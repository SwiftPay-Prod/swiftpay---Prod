'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CancelCircleIcon,
  ChartDownIcon,
  ChartUpIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  TransactionHistoryIcon,
  Wallet01Icon,
  Wallet03Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { MerchantBalanceData } from '@/types/merchant/dashboard';

const BALANCE_TOOLTIPS = {
  available:
    'Valor liberado para saque. Esse é o saldo que você pode transferir para sua conta bancária a qualquer momento.',
  pending:
    'Valor de pagamentos criados e não pagos no período selecionado.',
  reserved:
    'Valor retido temporariamente para cobrir possíveis chargebacks, disputas ou garantias contratuais.',
  total: 'Soma dos pagamentos no período selecionado.',
};

function InfoTip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex cursor-help">
          <Icon icon={InformationCircleIcon} className="icon-xs shrink-0 opacity-60" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface KpiCardProps {
  icon: IconSvgElement;
  iconColor?: string;
  cardClassName?: string;
  contentClassName?: string;
  isMain?: boolean;
  label: string;
  tooltip?: string;
  value: React.ReactNode;
  growth?: number | null;
  growthSuffix?: string;
  growthComparisonLabel?: string | null;
  invertColors?: boolean;
  isProcessing?: boolean;
}

export function KpiCard({
  icon,
  iconColor = 'text-primary',
  cardClassName,
  contentClassName,
  isMain = false,
  label,
  tooltip,
  value,
  growth,
  growthSuffix = '%',
  growthComparisonLabel,
  invertColors = false,
  isProcessing,
}: KpiCardProps) {
  const hasGrowth = growth !== null && growth !== undefined;
  const isPositive = hasGrowth && growth > 0;
  const isNegative = hasGrowth && growth < 0;

  const growthColor = invertColors
    ? isPositive
      ? 'bg-danger/12 text-danger border-danger/20'
      : isNegative
        ? 'bg-success/12 text-success border-success/20'
        : 'bg-surface-secondary text-muted-foreground border-border'
    : isPositive
      ? 'bg-success/12 text-success border-success/20'
      : isNegative
        ? 'bg-danger/12 text-danger border-danger/20'
        : 'bg-surface-secondary text-muted-foreground border-border';

  const GrowthIcon = isPositive ? ChartUpIcon : ChartDownIcon;

  return (
    <div
      className={`rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:border-border/80 ${isProcessing ? 'opacity-70' : ''} ${cardClassName ?? ''}`}
    >
      <div className={`flex flex-col gap-3 p-5 ${contentClassName ?? ''}`}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon icon={icon} className={`${iconColor} ${isMain ? 'icon-md' : 'icon-sm'} shrink-0`} />
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            {tooltip && <InfoTip content={tooltip} />}
          </div>
          {isProcessing && <div className="shrink-0 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
        </div>
        <div className="min-w-0 font-mono text-2xl font-extrabold tracking-tight text-foreground">{value}</div>
        {hasGrowth && growth !== 0 && (
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${growthColor}`}>
                    <Icon icon={GrowthIcon} className="icon-xs" />
                    <AnimatedNumber
                      value={growth}
                      prefix={isPositive ? '+' : undefined}
                      suffix={growthSuffix}
                      maximumFractionDigits={1}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {invertColors
                    ? isPositive
                      ? 'Aumento'
                      : 'Redução'
                    : isPositive
                      ? 'Crescimento'
                      : 'Queda'}{' '}
                  de {Math.abs(growth)}
                  {growthSuffix} {growthComparisonLabel || 'vs. período anterior'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}

export function BalanceCards({ balance }: { balance: MerchantBalanceData }) {
  const cards = [
    {
      key: 'available',
      label: 'Disponível',
      value: balance.available,
      icon: Wallet01Icon,
      iconColor: 'text-success',
      tooltip: BALANCE_TOOLTIPS.available,
    },
    {
      key: 'pending',
      label: 'Pendente',
      value: balance.pending,
      icon: TransactionHistoryIcon,
      iconColor: 'text-warning',
      tooltip: BALANCE_TOOLTIPS.pending,
    },
    {
      key: 'reserved',
      label: 'Saque pendente',
      value: balance.reserved,
      icon: CancelCircleIcon,
      iconColor: 'text-muted-foreground',
      tooltip: BALANCE_TOOLTIPS.reserved,
    },
    {
      key: 'total',
      label: 'Total',
      value: balance.total,
      icon: Wallet03Icon,
      iconColor: 'text-primary',
      tooltip: BALANCE_TOOLTIPS.total,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:border-border/80"
        >
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</span>
              <div className="flex items-center gap-1.5">
                <Icon icon={card.icon} className={`${card.iconColor} icon-sm`} />
                <InfoTip content={card.tooltip} />
              </div>
            </div>
            <AnimatedCurrency value={card.value} className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground" compact />
          </div>
        </div>
      ))}
    </div>
  );
}
