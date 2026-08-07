'use client';

import { Tooltip } from '@heroui/react';
import { ChartDownIcon, ChartUpIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface GrowthIndicatorProps {
  growth: number | null | undefined;
  comparisonLabel?: string | null;
  invertColors?: boolean;
}

export function GrowthIndicator({ growth, comparisonLabel, invertColors = false }: GrowthIndicatorProps) {
  const hasGrowth = growth !== null && growth !== undefined && growth !== 0;

  if (!hasGrowth) {
    return null;
  }

  const isPositive = growth > 0;
  const growthColor = invertColors
    ? isPositive
      ? 'text-danger'
      : 'text-success'
    : isPositive
      ? 'text-success'
      : 'text-danger';

  const GrowthIcon = isPositive ? ChartUpIcon : ChartDownIcon;

  return (
    <div className={`flex items-center gap-1 ${growthColor}`}>
      <Icon icon={GrowthIcon} className="icon-xs" />
      <Tooltip>
        <Tooltip.Trigger>
          <span className="flex cursor-help items-center gap-0.5 text-xs font-medium">
            <AnimatedNumber
              value={growth}
              prefix={isPositive ? '+' : undefined}
              suffix="%"
              maximumFractionDigits={1}
              className={growthColor}
            />
            <Icon icon={HelpCircleIcon} className="icon-xs opacity-60" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <span className="text-xs">
            {invertColors ? (isPositive ? 'Aumento' : 'Redução') : isPositive ? 'Crescimento' : 'Queda'} de{' '}
            {Math.abs(growth).toFixed(1)}% {comparisonLabel || 'vs. período anterior'}
          </span>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}
