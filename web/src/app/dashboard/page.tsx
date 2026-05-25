'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSignalRConnection, startSignalR } from '@/lib/signalr-client';
import { request } from '@/lib/api-client';
import { TrendingUp, DollarSign, CreditCard, Ban, RotateCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const formatBRL = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const formatNumber = (n: number) => new Intl.NumberFormat('pt-BR').format(n);

export default function DashboardPage() {
  const queryClient = useQueryClient();

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

  if (isLoading) return <div className="text-muted-foreground animate-pulse">Carregando...</div>;

  const barData = [
    { name: 'Sucesso', valor: d?.successfulTransactions || 0 },
    { name: 'Falha', valor: d?.failedTransactions || 0 },
    { name: 'Estorno', valor: d?.refundedTransactions || 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(d?.revenue || 0)}</p>
            <p className="text-xs text-muted-foreground">Liquido: {formatBRL(d?.netRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Transacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(d?.successfulTransactions || 0)}</p>
            <p className="text-xs text-muted-foreground">de {formatNumber(d?.totalTransactions || 0)} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Ban className="h-4 w-4" />Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(d?.failedTransactions || 0)}</p>
            <p className="text-xs text-muted-foreground">Ticket medio: {formatBRL(d?.avgTicket || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />Estornos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(d?.refundedTransactions || 0)}</p>
            <p className="text-xs text-muted-foreground">Taxas: {formatBRL(d?.platformFees || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receita Diaria (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={d?.dailyBreakdown || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'})} fontSize={11} />
                  <YAxis tickFormatter={(v: number) => `R$${(v/100).toFixed(0)}`} fontSize={11} />
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                  <Area type="monotone" dataKey="revenue" stroke="#000" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Transacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#000" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
