'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeys } from '@/lib/api-client';
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

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
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">Criar Nova Chave</h2>
        <div className="flex gap-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Produção, Homologação"
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black" />
          <button onClick={() => name && createKey.mutate()} disabled={!name || createKey.isPending}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-zinc-200 font-semibold">Suas Chaves</div>
        {(data?.data ?? []).length === 0
          ? <div className="p-8 text-center text-zinc-400">Nenhuma chave criada</div>
          : <div className="divide-y divide-zinc-100">
              {data?.data?.filter((k: any) => k.isActive).map((key: any) => (
                <div key={key.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{key.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">
                        {showKey === key.id ? key.key : `${key.key?.slice(0, 12)}...`}
                      </code>
                      <button onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                        className="text-zinc-400 hover:text-black">
                        {showKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => navigator.clipboard?.writeText(key.key)}
                        className="text-zinc-400 hover:text-black">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Escopos: {key.scopes || 'read,write'} | Criada: {new Date(key.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <button onClick={() => deleteKey.mutate(key.id)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
