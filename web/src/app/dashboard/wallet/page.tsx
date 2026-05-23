'use client';

import { useQuery } from '@tanstack/react-query';
import { wallet } from '@/lib/api-client';

export default function WalletPage() {
  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => wallet.balance(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => wallet.transactions(),
  });

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Carteira</h1>

      {loadingBalance ? (
        <div className="animate-pulse h-24 bg-gray-200 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Saldo Disponível</p>
            <p className="text-3xl font-bold text-green-600">
              {formatBRL(balance?.data?.available ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Pendente</p>
            <p className="text-3xl font-bold text-yellow-600">
              {formatBRL(balance?.data?.pending ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatBRL((balance?.data?.available ?? 0) + (balance?.data?.pending ?? 0))}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Últimas Transações</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(transactions?.items ?? []).length === 0 ? (
            <div className="p-6 text-center text-gray-400">Nenhuma transação ainda</div>
          ) : (
            transactions?.items?.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{tx.type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === 'Payment' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'Payment' ? '+' : '-'}{formatBRL(tx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
