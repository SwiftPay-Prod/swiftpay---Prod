'use client';

import { useQuery } from '@tanstack/react-query';
import { wallet, paymentLinks } from '@/lib/api-client';
import { ArrowRightLeft, Link as LinkIcon, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { data: balance } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => wallet.balance(),
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => wallet.transactions(1, 5),
  });

  const { data: links } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => paymentLinks.list(1, 5),
  });

  const stats = [
    {
      label: 'Available Balance',
      value: balance?.data ? `R$ ${(balance.data.available / 100).toFixed(2)}` : '—',
      icon: DollarSign,
    },
    {
      label: 'Pending Balance',
      value: balance?.data ? `R$ ${(balance.data.pending / 100).toFixed(2)}` : '—',
      icon: ArrowRightLeft,
    },
    {
      label: 'Payment Links',
      value: links?.total ?? '—',
      icon: LinkIcon,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2">
                  <Icon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                  <p className="text-xl font-semibold text-zinc-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Recent Transactions</h2>
          {recentTransactions?.items && recentTransactions.items.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.items.map(tx => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-zinc-900 capitalize">{tx.type}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}R$ {(tx.amount / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No transactions yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Recent Payment Links</h2>
          {links?.items && links.items.length > 0 ? (
            <div className="space-y-3">
              {links.items.map(link => (
                <div key={link.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-zinc-900">{link.title}</p>
                    <p className="text-xs text-zinc-500">{link.usesCount} use(s)</p>
                  </div>
                  <span className="font-medium text-zinc-900">
                    R$ {(link.amount / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No payment links yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
