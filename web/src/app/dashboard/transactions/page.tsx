'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wallet } from '@/lib/api-client';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => wallet.transactions(page, limit),
  });

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transações</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Tipo</th>
                <th className="p-4 font-medium">Método</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Carregando...</td></tr>
              ) : (data?.items ?? []).length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma transação</td></tr>
              ) : (
                data?.items?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 font-medium">{tx.type}</td>
                    <td className="p-4 text-sm text-gray-600">{tx.method}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        tx.status === 'Refunded' ? 'bg-purple-100 text-purple-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-semibold ${
                      tx.type === 'Payment' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'Payment' ? '+' : '-'}{formatBRL(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded text-sm disabled:opacity-30 hover:bg-gray-100"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded text-sm disabled:opacity-30 hover:bg-gray-100"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
