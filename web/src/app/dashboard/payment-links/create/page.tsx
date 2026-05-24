'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentLinks } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', amount: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentLinks.create({ title: form.title, description: form.description || undefined, amount: parseInt(form.amount) * 100 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-links'] }); router.push('/dashboard/payment-links'); },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Criar Link de Pagamento</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" type="number" required min="0.01" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          <Button onClick={() => mutation.mutate()} disabled={!form.title || !form.amount || mutation.isPending}
            className="w-full bg-black hover:bg-zinc-800 text-white">
            {mutation.isPending ? 'Criando...' : 'Criar Link de Pagamento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
