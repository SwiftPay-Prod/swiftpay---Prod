# Swiftpay — Webhook Configuration UI

**Goal:** Add webhook configuration page to admin dashboard — merchants can add/view callback URLs and secrets.

---

### Task 1: Create webhooks management page

**Files:**
- Create: `web/src/app/dashboard/settings/webhooks/page.tsx`
- Create: `web/src/app/dashboard/settings/page.tsx`
- Modify: `web/src/app/dashboard/layout.tsx` (add settings link)
- Modify: `web/src/lib/api-client.ts` (add webhook API methods)

- [ ] **Step 1: Add webhook API methods to client**

Add to `web/src/lib/api-client.ts`:
```typescript
export const webhooks = {
  list: () =>
    request<{ success: boolean; data: any[] }>('/webhooks'),
  create: (data: { url: string; secret: string; events: string }) =>
    request<{ success: boolean; data: any }>('/webhooks', {
      method: 'POST', body: JSON.stringify(data),
    }),
};
```

- [ ] **Step 2: Create webhooks settings page**

Write `web/src/app/dashboard/settings/webhooks/page.tsx`:
```typescript
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooks } from '@/lib/api-client';

export default function WebhooksPage() {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['webhooks'], queryFn: () => webhooks.list() });

  const mutation = useMutation({
    mutationFn: () => webhooks.create({ url, secret, events: 'payment.completed,payment.failed' }),
    onSuccess: () => {
      setUrl(''); setSecret('');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (err: any) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-black">Webhooks</h1>

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Adicionar Webhook</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">URL de Callback *</label>
          <input type="url" required value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://meusite.com/webhook"
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Secret (para assinatura HMAC)</label>
          <input type="text" required value={secret} onChange={e => setSecret(e.target.value)}
            placeholder="minha-chave-secreta"
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black" />
        </div>
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <button type="submit" disabled={mutation.isPending}
          className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">
          {mutation.isPending ? 'Salvando...' : 'Adicionar Webhook'}
        </button>
      </form>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="font-semibold">Webhooks Configurados</h2>
        </div>
        {(data?.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-zinc-400">Nenhum webhook configurado</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data?.data?.map((w: any) => (
              <div key={w.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{w.url}</p>
                  <p className="text-xs text-zinc-500 mt-1">{w.events}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${w.isActive ? 'border-black text-black' : 'border-zinc-200 text-zinc-400'}`}>
                  {w.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update sidebar**

In `web/src/app/dashboard/layout.tsx`, add Settings link to navItems:
```typescript
{ label: 'Configurações', href: '/dashboard/settings/webhooks', icon: Settings },
```

Import `Settings` from lucide-react.

- [ ] **Step 4: Build**

```bash
cd /home/matspectrum-ai/OpenGateway/web
npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add web/
git commit -m "feat: add webhook configuration page in admin dashboard"
git push origin main 2>&1
```
