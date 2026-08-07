'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import type { MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const ACCENT = 'var(--accent)';

const weeklyChartConfig = {
  volume: {
    label: 'Faturamento',
    color: ACCENT,
  },
} satisfies ChartConfig;

interface WeeklyVolumeChartProps {
  data: MerchantWeeklyVolumeData[];
  isHourlyGranularity: boolean;
  isProcessing?: boolean;
}

export function WeeklyVolumeChart({ data, isHourlyGranularity, isProcessing }: WeeklyVolumeChartProps) {
  const chartData = data.map((item) => ({
    week: item.label,
    volume: item.volume,
    transactionCount: item.transactionCount,
  }));

  return (
    <div className={`mockup-chart-card ${isProcessing ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="mockup-chart-title">
            {isHourlyGranularity ? 'Evolução por hora' : 'Evolução diária'}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHourlyGranularity ? 'Últimas horas do período' : 'Período selecionado (agrupado por dia)'}
          </p>
        </div>
        {isProcessing && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
      </div>
      <ChartContainer config={weeklyChartConfig} className="h-32 w-full">
        <AreaChart accessibilityLayer data={chartData}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="week" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} className="text-muted-foreground" />
          <YAxis hide />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
          <Area type="monotone" dataKey="volume" stroke={ACCENT} strokeWidth={2} fill="url(#volumeGradient)" />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
