'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeys } from '@/lib/api-client';
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ApiKeysPage() {
  const [name, setName] = useState('');
  const [showKey, setShowKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['api-keys'], queryFn: () => apiKeys.list() });
  const createKey = useMutation({
    mutationFn: () => apiKeys.create({ name }),
    onSuccess: () => { setName(''); queryClient.invalidateQueries({ queryKey: ['api-keys'] }); },
  });
  const deleteKey = useMutation({
    mutationFn: (id: string) => apiKeys.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">API Keys</h1>
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Chave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="key-name">Nome</Label>
              <Input id="key-name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Produção, Homologação" />
            </div>
            <Button onClick={() => name && createKey.mutate()} disabled={!name || createKey.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Suas Chaves</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.data ?? []).length === 0
            ? <div className="p-8 text-center text-muted-foreground">Nenhuma chave criada</div>
            : <div className="divide-y divide-border">
                {data?.data?.filter((k: any) => k.isActive).map((key: any) => (
                  <div key={key.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{key.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {showKey === key.id ? key.key : `${key.key?.slice(0, 12)}...`}
                        </code>
                        <button onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                          className="text-muted-foreground hover:text-foreground">
                          {showKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => navigator.clipboard?.writeText(key.key)}
                          className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Escopos: {key.scopes || 'read,write'} | Criada: {new Date(key.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={() => deleteKey.mutate(key.id)} className="text-destructive hover:text-destructive/80 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
