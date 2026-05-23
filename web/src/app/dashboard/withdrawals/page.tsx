'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withdrawals, wallet } from '@/lib/api-client';

export default function WithdrawalsPage() {
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('CPF');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => wallet.balance(),
  });

  const { data: withdrawalList } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawals.list(),
  });

  const mutation = useMutation({
    mutationFn: () => withdrawals.request(
      Math.round(parseFloat(amount) * 100),
      pixKey,
      pixKeyType
    ),
    onSuccess: () => {
      setSuccess('Saque solicitado com sucesso!');
      setAmount('');
      setPixKey('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err: any) => setError(err.message || 'Erro ao solicitar saque'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    mutation.mutate();
  };

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const available = (balance as any)?.data?.available ?? 0;

  const pixKeyTypes = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM_KEY'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Saques</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Solicitar Saque</h2>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Saldo disponível</p>
            <p className="text-xl font-bold text-green-600">{formatBRL(available)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={available / 100}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="100,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chave PIX</label>
              <select
                value={pixKeyType}
                onChange={e => setPixKeyType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {pixKeyTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
              <input
                type="text"
                required
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="seuemail@exemplo.com"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">{success}</div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Solicitando...' : 'Solicitar Saque'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Saques Recentes</h2>

          {((withdrawalList as any)?.items ?? []).length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum saque realizado</p>
          ) : (
            <div className="space-y-3">
              {(withdrawalList as any)?.items?.map((w: any) => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{formatBRL(w.amount)}</p>
                    <p className="text-xs text-gray-500">{w.pixKeyType}: {w.pixKey}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    w.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    w.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    w.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
