'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/currency';
import type { MerchantDailyVolumeData, MerchantWeeklyVolumeData } from '@/types/merchant/dashboard';

const volumeChartConfig = {
  volume: {
    label: 'Volume',
    color: 'var(--accent)',
  },
} satisfies ChartConfig;

interface VolumeChartProps {
  data: MerchantDailyVolumeData[];
  adaptiveData: MerchantWeeklyVolumeData[];
  isHourlyGranularity: boolean;
  isProcessing?: boolean;
  periodLabel?: string;
}

export function VolumeChart({ data, adaptiveData, isHourlyGranularity, isProcessing, periodLabel }: VolumeChartProps) {
  const chartData = isHourlyGranularity
    ? adaptiveData.map((item) => ({
        date: item.label,
        volume: item.volume,
        transactionCount: item.transactionCount,
      }))
    : data.map((item) => ({
        date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        volume: item.volume,
        transactionCount: item.transactionCount,
      }));

  return (
    <div className={`mockup-chart-card ${isProcessing ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="mockup-chart-title">
            {isHourlyGranularity ? 'Volume por hora' : 'Volume diário'}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{periodLabel || 'Últimos 7 dias'}</p>
        </div>
        {isProcessing && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
      </div>
      <ChartContainer config={volumeChartConfig} className="h-32 w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tickLine={false} tickMargin={6} axisLine={false} fontSize={9} className="text-muted-foreground" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) =>
                  name === 'volume' ? formatCurrency(value as number) : `${value} transações`
                }
              />
            }
          />
          <Bar dataKey="volume" fill="var(--accent)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
