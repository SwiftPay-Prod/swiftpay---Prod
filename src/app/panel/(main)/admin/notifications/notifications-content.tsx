'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextField, TextArea } from '@heroui/react';
import { toast } from 'sonner';
import { adminBroadcastNotification } from '@/app/actions/admin/notifications-broadcast';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { adminListMerchants } from '@/app/actions/admin/merchants';
import { SelectFilter } from '@/components/ui/select-filter';

type Audience = 'all' | 'merchant' | 'user';

const audienceOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'merchant', label: 'Organização específica' },
  { value: 'user', label: 'Usuário específico' },
];

export function NotificationsBroadcastContent({ currentUserRole }: { currentUserRole?: string }) {
  const [audience, setAudience] = useState<Audience>('merchant');
  const [merchantId, setMerchantId] = useState<string>('');
  const [merchantLabel, setMerchantLabel] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [isPending, startTransition] = useTransition();

  const isGod = currentUserRole === 'God';

  const handleSend = () => {
    if (!isGod) {
      toast.error('Apenas God pode enviar broadcast.');
      return;
    }
    if (!(title || '').trim() || !(message || '').trim()) {
      toast.error('Título e mensagem são obrigatórios.');
      return;
    }
    if (audience === 'merchant' && !merchantId) {
      toast.error('Selecione a organização.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await adminBroadcastNotification({
          audience,
          merchantId: audience === 'merchant' ? merchantId : null,
          userEmail: audience === 'user' ? (userEmail || '').trim() || null : null,
          title: (title || '').trim(),
          message: (message || '').trim(),
          actionUrl: (actionUrl || '').trim() || null,
          type: 'Admin',
          priority: 'Normal',
        });

        if ((res as unknown as { error?: { message?: string } })?.error) {
          throw new Error((res as unknown as { error: { message: string } }).error.message);
        }

        const data = (res as unknown as { data?: { total?: number; accepted?: boolean } })?.data;
        toast.success(`Push enfileirado para ${data?.total ?? 0} usuário(s).`);
        setTitle('');
        setMessage('');
        setActionUrl('');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao enviar notificação');
      }
    });
  };

  if (!isGod) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
        <p className="text-sm font-medium text-amber-200">Acesso restrito</p>
        <p className="text-xs text-amber-200/70">Apenas usuários com papel God podem enviar push personalizado.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-3.5 bg-white text-black">
          <span className="text-[11px] font-bold tracking-widest">PUSH</span>
        </div>
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white">Notificações Push</h1>
          <p className="max-w-2xl text-sm leading-5 text-white/60">
            Envie push personalizado para todos, uma organização ou um usuário. Entrega via FCM em tempo real.
          </p>
        </div>
      </div>

      <Card className="border-white/12 bg-[#16181a] text-white">
        <CardHeader>
          <h2 className="text-sm font-semibold">Destinatário</h2>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SelectFilter
            label="Audiência"
            value={audience}
            onChange={(v) => setAudience(v as Audience)}
            options={audienceOptions}
          />

          {audience === 'merchant' && (
            <div className="grid gap-2">
              <Label>Organização</Label>
              <AsyncCombobox
                fetcher={async (query) => {
                  const res = await adminListMerchants({ search: query || null, pageSize: 10 } as never);
                  const items = (res as unknown as { data?: { items?: { id: string; name: string }[] } })?.data?.items ?? [];
                  return items.map((m) => ({ value: m.id, label: m.name }));
                }}
                value={merchantId}
                onValueChange={(v, item) => {
                  setMerchantId(v);
                  setMerchantLabel((item as { label?: string })?.label ?? v);
                }}
                placeholder="Buscar organização..."
              />
              {merchantLabel && <p className="text-xs text-white/50">Selecionado: {merchantLabel}</p>}
            </div>
          )}

          {audience === 'user' && (
            <TextField variant="secondary">
              <Label>User E-mail</Label>
              <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@email.com" />
            </TextField>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/12 bg-[#16181a] text-white">
        <CardHeader>
          <h2 className="text-sm font-semibold">Conteúdo</h2>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField variant="secondary" isRequired>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Atualização importante" maxLength={80} />
          </TextField>

          <TextField variant="secondary" isRequired>
            <Label>Mensagem</Label>
            <TextArea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex: Seu saque foi aprovado e o valor já está disponível." rows={4} maxLength={300} />
            <p className="text-xs text-white/40">{(message || '').length}/300</p>
          </TextField>

          <TextField variant="secondary">
            <Label>Action URL (opcional)</Label>
            <Input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/panel/transactions" />
          </TextField>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-medium text-white/80">Prévia</p>
            <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-sm font-semibold text-white">{title || 'Título da notificação'}</p>
              <p className="text-xs text-white/60">{message || 'Sua mensagem aparecerá aqui e no push do dispositivo.'}</p>
              {actionUrl && <p className="mt-1 text-xs text-sky-300">{actionUrl}</p>}
            </div>
          </div>

          <Button onClick={handleSend} disabled={isPending} className="rounded-full bg-white font-semibold text-black hover:bg-white/90">
            {isPending ? 'Enviando...' : 'Enviar push'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
