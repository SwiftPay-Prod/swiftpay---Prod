'use client';

import { Card, Tooltip, Spinner } from '@heroui/react';
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
  iconColor = 'text-accent',
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
      ? 'text-danger'
      : isNegative
        ? 'text-success'
        : 'text-muted'
    : isPositive
      ? 'text-success'
      : isNegative
        ? 'text-danger'
        : 'text-muted';

  const GrowthIcon = isPositive ? ChartUpIcon : ChartDownIcon;

  return (
    <Card className={`${cardClassName ?? ''} ${isProcessing ? 'opacity-70' : ''}`.trim()}>
      <Card.Content className={`flex flex-col gap-2 p-4 ${contentClassName ?? ''}`.trim()}>
        <div className="flex min-w-0 items-center gap-2">
          <Icon icon={icon} className={`${iconColor} ${isMain ? 'icon-md' : 'icon-sm'} shrink-0`} />
          <span className="truncate text-sm font-medium text-foreground">{label}</span>
          {tooltip && (
            <Tooltip>
              <Tooltip.Trigger>
                <Icon icon={InformationCircleIcon} className="icon-xs shrink-0 cursor-help opacity-60" />
              </Tooltip.Trigger>
              <Tooltip.Content className="max-w-64">
                <Tooltip.Arrow />
                {tooltip}
              </Tooltip.Content>
            </Tooltip>
          )}
          {isProcessing && <Spinner size="sm" className="ml-auto shrink-0" />}
        </div>
        <div className="min-w-0 leading-tight">{value}</div>
        {hasGrowth && growth !== 0 && (
          <div className={`flex items-center gap-0.5 ${growthColor}`}>
            <Icon icon={GrowthIcon} className="icon-xs" />
            <Tooltip>
              <Tooltip.Trigger>
                <span className="flex cursor-help items-center gap-0.5 text-xs font-medium">
                  <AnimatedNumber
                    value={growth}
                    prefix={isPositive ? '+' : undefined}
                    suffix={growthSuffix}
                    maximumFractionDigits={1}
                    className={growthColor}
                  />
                  <Icon icon={HelpCircleIcon} className="icon-xs opacity-50" />
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <span className="text-xs">
                  {invertColors
                    ? isPositive
                      ? 'Aumento'
                      : 'Redução'
                    : isPositive
                      ? 'Crescimento'
                      : 'Queda'}{' '}
                  de {Math.abs(growth)}
                  {growthSuffix} {growthComparisonLabel || 'vs. período anterior'}
                </span>
              </Tooltip.Content>
            </Tooltip>
          </div>
        )}
      </Card.Content>
    </Card>
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
      gradient: 'from-success/10 to-success/5',
      tooltip: BALANCE_TOOLTIPS.available,
    },
    {
      key: 'pending',
      label: 'Pendente',
      value: balance.pending,
      icon: TransactionHistoryIcon,
      iconColor: 'text-warning',
      gradient: 'from-warning/10 to-warning/5',
      tooltip: BALANCE_TOOLTIPS.pending,
    },
    {
      key: 'reserved',
      label: 'Saque pendente',
      value: balance.reserved,
      icon: CancelCircleIcon,
      iconColor: 'text-secondary',
      gradient: 'from-secondary/10 to-secondary/5',
      tooltip: BALANCE_TOOLTIPS.reserved,
    },
    {
      key: 'total',
      label: 'Total',
      value: balance.total,
      icon: Wallet03Icon,
      iconColor: 'text-accent',
      gradient: 'from-accent/10 to-accent/5',
      tooltip: BALANCE_TOOLTIPS.total,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} className={`bg-linear-to-br ${card.gradient}`}>
          <Card.Content className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <Icon icon={card.icon} className={`${card.iconColor} icon-md`} />
              <span className="text-sm font-medium text-foreground">{card.label}</span>
              <Tooltip>
                <Tooltip.Trigger>
                  <Icon icon={InformationCircleIcon} className="icon-xs cursor-help opacity-60" />
                </Tooltip.Trigger>
                <Tooltip.Content className="max-w-64">
                  <Tooltip.Arrow />
                  {card.tooltip}
                </Tooltip.Content>
              </Tooltip>
            </div>
            <AnimatedCurrency value={card.value} className="text-2xl font-bold" compact />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

