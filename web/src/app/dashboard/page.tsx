'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentLinks, wallet } from '@/lib/api-client';
import { getSignalRConnection, startSignalR } from '@/lib/signalr-client';
import { useEffect } from 'react';

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
      <h1 className="text-2xl font-bold text-black">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Saldo disponível</p>
          <p className="text-3xl font-bold text-black mt-1">{formatBRL(balance?.data?.available ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Links criados</p>
          <p className="text-3xl font-bold text-black mt-1">{links?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Transações</p>
          <p className="text-3xl font-bold text-black mt-1">—</p>
        </div>
      </div>
    </div>
  );
}
