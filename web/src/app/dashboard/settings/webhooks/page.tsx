'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooks } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function WebhooksPage() {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['webhooks'], queryFn: () => webhooks.list() });
  const mutation = useMutation({
    mutationFn: () => webhooks.create({ url, secret, events: 'payment.completed,payment.failed' }),
    onSuccess: () => { setUrl(''); setSecret(''); queryClient.invalidateQueries({ queryKey: ['webhooks'] }); },
    onError: (err: any) => setError(err.message),
  });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(''); mutation.mutate(); };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Webhooks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL de Callback</Label>
              <Input id="url" type="url" required value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Secret</Label>
              <Input id="secret" type="text" required value={secret} onChange={e => setSecret(e.target.value)} />
            </div>
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
            <Button type="submit" disabled={mutation.isPending} className="bg-black hover:bg-zinc-800 text-white">
              {mutation.isPending ? 'Salvando...' : 'Adicionar Webhook'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.data ?? []).length === 0
            ? <div className="p-8 text-center text-zinc-400">Nenhum webhook</div>
            : <div className="divide-y divide-zinc-100">{data?.data?.map((w: any) => (
                <div key={w.id} className="p-4 flex justify-between items-center">
                  <div><p className="font-medium text-sm">{w.url}</p><p className="text-xs text-zinc-500">{w.events}</p></div>
                  <Badge variant={w.isActive ? 'default' : 'secondary'} className={w.isActive ? 'bg-black text-white' : ''}>
                    {w.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
            ))}</div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
