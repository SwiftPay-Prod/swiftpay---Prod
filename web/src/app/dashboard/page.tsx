'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSignalRConnection, startSignalR } from '@/lib/signalr-client';
import { request } from '@/lib/api-client';
import { TrendingUp, TrendingDown, DollarSign, Ban, RotateCcw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useTheme } from 'next-themes';

const formatBRL = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const formatShortBRL = (cents: number) => `R$${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNumber = (n: number) => n.toLocaleString('pt-BR');

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs mb-1">{new Date(label).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
      <p className="font-semibold">{formatBRL(payload[0].value)}</p>
    </div>
  );
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const accentColor = isDark ? '#fafafa' : '#0a0a0a';
  const mutedColor = isDark ? '#27272a' : '#e4e4e7';
  const gridColor = isDark ? '#1f1f1f' : '#e4e4e7';

  useEffect(() => {
    const conn = getSignalRConnection();
    conn.on('PaymentStatusChanged', () => { queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }); });
    startSignalR();
    return () => { conn.off('PaymentStatusChanged'); };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => request<{ success: boolean; data: any }>('/dashboard/summary'),
  });
  const d = data?.data;

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 bg-muted rounded-xl" />
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    </div>
  );

  const barData = [
    { name: 'Sucesso', valor: d?.successfulTransactions || 0 },
    { name: 'Falha', valor: d?.failedTransactions || 0 },
    { name: 'Estorno', valor: d?.refundedTransactions || 0 },
  ];

  const successRate = d?.totalTransactions > 0 ? ((d?.successfulTransactions / d?.totalTransactions) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-muted-foreground">Mes atual</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-foreground/5 to-transparent rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatShortBRL(d?.revenue || 0)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500 font-medium">{successRate}%</span>
              <span className="text-xs text-muted-foreground ml-1">taxa de sucesso</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Receita Liquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatShortBRL(d?.netRevenue || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Taxas: {formatBRL(d?.platformFees || 0)} + {formatBRL(d?.acquirerFees || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Ban className="h-4 w-4" />Transacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatNumber(d?.successfulTransactions || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(d?.failedTransactions || 0)} falhas / {formatNumber(d?.refundedTransactions || 0)} estornos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />Ticket Medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatShortBRL(d?.avgTicket || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(d?.totalTransactions || 0)} transacoes no mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Receita Diaria</CardTitle>
              <span className="text-xs text-muted-foreground">30 dias</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d?.dailyBreakdown || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accentColor} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => v >= 10000 ? `R$${(v/1000).toFixed(0)}k` : `R$${(v/100).toFixed(0)}`}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="revenue" stroke={accentColor} strokeWidth={2}
                    fill="url(#revenueGradient)" animationDuration={800} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Status das Transacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={48}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--accent)' }} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} animationDuration={600} animationEasing="ease-out">
                    {barData.map((_, i) => (
                      <Cell key={i} fill={accentColor} fillOpacity={i === 0 ? 1 : 0.3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-foreground" /> Sucesso</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-foreground/30" /> Falha</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-foreground/30" /> Estorno</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
