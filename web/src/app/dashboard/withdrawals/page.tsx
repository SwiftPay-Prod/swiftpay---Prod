'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withdrawals, wallet } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-xl font-bold">{formatBRL(available)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={available / 100}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="100,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
                <select
                  id="pixKeyType"
                  value={pixKeyType}
                  onChange={e => setPixKeyType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:border-ring bg-background text-foreground"
                >
                  {pixKeyTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  type="text"
                  required
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>
              )}
              {success && (
                <div className="p-3 bg-muted text-foreground text-sm rounded-lg border border-border">{success}</div>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Solicitando...' : 'Solicitar Saque'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saques Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {((withdrawalList as any)?.items ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum saque realizado</p>
            ) : (
              <div className="space-y-3">
                {(withdrawalList as any)?.items?.map((w: any) => (
                  <div key={w.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{formatBRL(w.amount)}</p>
                      <p className="text-xs text-muted-foreground">{w.pixKeyType}: {w.pixKey}</p>
                    </div>
                    <Badge variant={w.status === 'Failed' ? 'destructive' : 'secondary'}>
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
