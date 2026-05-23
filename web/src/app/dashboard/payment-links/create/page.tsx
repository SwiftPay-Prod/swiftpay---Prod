'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentLinks } from '@/lib/api-client';

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', amount: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => paymentLinks.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-links'] }); router.push('/dashboard/payment-links'); },
    onError: (err: any) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    mutation.mutate({ title: form.title, description: form.description || undefined, amount: parseInt(form.amount) * 100 });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-black">Criar Link de Pagamento</h1>
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Título *</label>
          <input type="text" required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black transition-colors" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Valor (R$) *</label>
          <input type="number" required min="0.01" step="0.01" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black transition-colors" />
        </div>
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
        <button type="submit" disabled={mutation.isPending}
          className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">
          {mutation.isPending ? 'Criando...' : 'Criar Link de Pagamento'}
        </button>
      </form>
    </div>
  );
}
