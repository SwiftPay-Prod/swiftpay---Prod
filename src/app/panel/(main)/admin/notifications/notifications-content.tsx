'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { adminBroadcastNotification } from '@/app/actions/admin/notifications-broadcast';

type Audience = 'all' | 'merchant' | 'user';

export function NotificationsBroadcastContent({ currentUserRole }: { currentUserRole?: string }) {
  const [audience, setAudience] = useState<Audience>('merchant');
  const [merchantId, setMerchantId] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="p-6 text-sm text-white/50">Carregando...</div>;
  }

  if (currentUserRole !== 'God') {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
        <p className="text-sm font-medium text-amber-200">Acesso restrito</p>
        <p className="text-xs text-amber-200/70">Apenas usuários com papel God podem enviar push personalizado.</p>
      </div>
    );
  }

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
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
          userEmail: audience === 'user' ? userEmail : null,
          title: title.trim(),
          message: message.trim(),
          actionUrl: actionUrl.trim() || null,
          type: 'Admin',
          priority: 'Normal',
        } as never);
        if ((res as unknown as { error?: { message?: string } })?.error) {
          throw new Error((res as unknown as { error: { message: string } }).error.message);
        }
        toast.success('Push enfileirado.');
        setTitle(''); setMessage(''); setActionUrl('');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao enviar');
      }
    });
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-3.5 bg-white text-black">
          <span className="text-[11px] font-bold tracking-widest">PUSH</span>
        </div>
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white">Notificações Push</h1>
          <p className="max-w-2xl text-sm leading-5 text-white/60">
            Envie push personalizado para todos, uma organização ou um usuário.
          </p>
        </div>
      </div>

      <Card className="border-white/12 bg-[#16181a] text-white">
        <CardHeader><h2 className="text-sm font-semibold">Destinatário</h2></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Audiência</Label>
            <select
              className="rounded-md border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
            >
              <option value="all">Todos</option>
              <option value="merchant">Organização específica</option>
              <option value="user">Usuário específico</option>
            </select>
          </div>
          {audience === 'merchant' && (
            <div className="grid gap-2">
              <Label>Merchant ID</Label>
              <Input
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="019ff10b-3d9f-7869-b036-33460bb4d66a"
              />
              <p className="text-xs text-white/40">Cole o UUID da organização. Em breve: combobox.</p>
            </div>
          )}
          {audience === 'user' && (
            <div className="grid gap-2">
              <Label>User E-mail</Label>
              <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@email.com" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/12 bg-[#16181a] text-white">
        <CardHeader><h2 className="text-sm font-semibold">Conteúdo</h2></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Atualização importante" maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label>Mensagem</Label>
            <textarea
              className="rounded-md border border-white/12 bg-black/40 px-3 py-2 text-sm text-white"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Seu saque foi aprovado."
              rows={4}
              maxLength={300}
            />
            <p className="text-xs text-white/40">{message.length}/300</p>
          </div>
          <div className="grid gap-2">
            <Label>Action URL (opcional)</Label>
            <Input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/panel/transactions" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-medium text-white/80">Prévia</p>
            <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-sm font-semibold text-white">{title || 'Título'}</p>
              <p className="text-xs text-white/60">{message || 'Sua mensagem aparecerá aqui.'}</p>
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
