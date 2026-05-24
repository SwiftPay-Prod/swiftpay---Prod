'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentLinks, wallet } from '@/lib/api-client';
import { getSignalRConnection, startSignalR } from '@/lib/signalr-client';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: links } = useQuery({ queryKey: ['payment-links'], queryFn: () => paymentLinks.list() });
  const { data: balance } = useQuery({ queryKey: ['balance'], queryFn: () => wallet.balance() });

  useEffect(() => {
    const conn = getSignalRConnection();
    conn.on('PaymentStatusChanged', () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); });
    conn.on('BalanceUpdated', () => { queryClient.invalidateQueries({ queryKey: ['balance'] }); });
    startSignalR();
    return () => { conn.off('PaymentStatusChanged'); conn.off('BalanceUpdated'); };
  }, []);

  const formatBRL = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatBRL(balance?.data?.available ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Links criados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{links?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
