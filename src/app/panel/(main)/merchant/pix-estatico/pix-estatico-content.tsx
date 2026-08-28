'use client';

import { useMemo, useState, useTransition } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RiCheckLine, RiRefreshLine } from '@remixicon/react';
import { toast } from 'sonner';
import { createMerchantPaymentLink } from '@/app/actions/merchant/payment-links';
import { startPaymentLink } from '@/app/actions/merchant/payment-links-start';
import type { ApiResponse } from '@/types/common';
import type { CreatePaymentLinkData } from '@/types/merchant/payment-links';
import { PaymentMethod } from '@/types/enums';

type PixLinkMode = 'StaticFixed' | 'StaticOpen' | 'StaticPortable';

const MODES: { value: PixLinkMode; label: string; description: string }[] = [
  {
    value: 'StaticFixed',
    label: 'Pix Estático com valor fixo',
    description: 'Gera um QR com valor definido. Quem pagar escaneia e paga exatamente esse valor.',
  },
  {
    value: 'StaticOpen',
    label: 'Pix Estático sem valor',
    description: 'Gera um QR sem valor. O pagador digita o valor no app do banco.',
  },
  {
    value: 'StaticPortable',
    label: 'BR Code Portável',
    description: 'Mesmo QR anterior, mas sem depender do checkout. Pode ser impresso e colado no comércio.',
  },
];

interface StaticStartPayload {
  data?: {
    qr?: string | null;
    copyAndPaste?: string | null;
    pix?: {
      qrCode?: string | null;
      copyAndPaste?: string | null;
    };
  };
}

export function PixEstaticoContent({ merchantId }: { merchantId: string }) {
  const [mode, setMode] = useState<PixLinkMode>('StaticFixed');
  const [amount, setAmount] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [copyAndPaste, setCopyAndPaste] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedMode = useMemo(() => MODES.find((item) => item.value === mode) ?? MODES[0], [mode]);
  const amountCents = useMemo(() => {
    if (!amount) return 0;
    const normalized = amount.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }, [amount]);
  const canCreate = mode === 'StaticFixed' ? amountCents > 0 : true;

  const handleCreate = () => {
    if (!canCreate || !selectedMode) {
      toast.error('Informe um valor para o Pix com valor fixo.');
      return;
    }

    startTransition(async () => {
      setLastError(null);
      try {
        const created = (await createMerchantPaymentLink(merchantId, {
          enabledMethods: [PaymentMethod.Pix],
          amount: mode === 'StaticFixed' ? amountCents : 0,
          description: selectedMode!.label,
          pixLinkMode: mode,
        })) as unknown as ApiResponse<CreatePaymentLinkData>;

        if (created?.error) {
          throw new Error(created.error.message || 'Erro ao criar link Pix Estático.');
        }
        const token = created?.data?.paymentLinkUrl?.split('/').pop() ?? null;
        if (!token) {
          throw new Error('Não foi possível identificar o token do Pix Estático criado.');
        }

        const started = (await startPaymentLink(token, 'Pix')) as unknown as StaticStartPayload & { error?: { message?: string } } | null;
        if (started && 'error' in started && (started as { error?: { message?: string } }).error) {
          throw new Error((started as { error: { message: string } }).error.message);
        }
        const nextQr = started?.data?.qr ?? started?.data?.pix?.qrCode ?? null;
        const nextCopy = started?.data?.copyAndPaste ?? started?.data?.pix?.copyAndPaste ?? null;

        if (!nextQr && !nextCopy) {
          throw new Error('O Pix Estático foi criado, mas sem QR retornado.');
        }

        setQr(nextQr);
        setCopyAndPaste(nextCopy);
        toast.success('Pix Estático criado com sucesso.');
      } catch (error: unknown) {
        let msg = 'Erro ao comunicar com a API de pagamentos (HTTP 500).';
        if (error && typeof error === 'object' && 'response' in error) {
          const data = (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response?.data;
          if (data?.error?.message) msg = data.error.message;
          else if (data?.message) msg = data.message;
          console.error('[PixEstatico] api error', data, error);
        } else if (error instanceof Error) {
          msg = error.message;
          console.error('[PixEstatico] create failed', error);
        }
        setLastError(msg);
        toast.error(msg);
      }
    });
  };

  const handleCopy = async () => {
    if (!copyAndPaste) {
      return;
    }

    await navigator.clipboard.writeText(copyAndPaste);
    setCopied(true);
    toast.success('Copia e cola copiado.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6">
      {/* Executive Header — Revolut 10 Ultra */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black">
          <span className="text-[11px] font-bold tracking-widest">PIX</span>
        </div>
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white">Pix Estático</h1>
          <p className="max-w-2xl text-sm leading-5 text-white/60">Crie QR reutilizável sem expiração para usar no seu comércio. Funciona off-checkout e pode ser impresso.</p>
        </div>
      </div>
      <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-xs font-semibold tracking-wide text-white/70">Modo</Label>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as PixLinkMode)}
              className="h-10 rounded-[12px] border border-white/12 bg-black/40 px-3 text-sm text-white outline-none focus:border-white/20"
            >
              {MODES.map((item) => (
                <option key={item.value} value={item.value} className="bg-[#0a0a0a]">
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-white/50">{selectedMode!.description}</p>
          </div>

          {mode === 'StaticFixed' && (
            <div className="grid gap-2">
              <Label className="text-xs font-semibold tracking-wide text-white/70">Valor (BRL)</Label>
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="10,00"
                inputMode="decimal"
                className="h-10 rounded-[12px] border-white/12 bg-black/40 text-white placeholder:text-white/30"
              />
              <p className="text-xs text-white/40">Digite como no Brasil: 10,00 = R$ 10,00. Envie em centavos.</p>
            </div>
          )}

          <Button onClick={handleCreate} disabled={!canCreate || isPending} className="rounded-full bg-white font-semibold text-black hover:bg-white/90 disabled:opacity-40">
            {isPending ? 'Criando...' : 'Criar Pix Estático'}
          </Button>
          {lastError && (
            <div className="rounded-[12px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{lastError}</div>
          )}
        </div>
      </div>
      {(qr || copyAndPaste) && (
        <Card className="border-white/12 bg-[#16181a] text-white">
          <CardHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <RiCheckLine className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold">QR pronto</h2>
            </div>
            <p className="text-sm text-white/60">
              Este QR é reutilizável e não expira. Copie o código ou use o QR abaixo.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={handleCopy} className="gap-2">
                {copied ? <RiCheckLine className="h-4 w-4" /> : <RiCheckLine className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar copia e cola'}
              </Button>

              <Button variant="outline" onClick={() => setQr(null)} className="gap-2">
                <RiRefreshLine className="h-4 w-4" />
                Gerar novo
              </Button>
            </div>

            {qr && (
              <div className="grid gap-2">
                <Label>QR Code</Label>
                <div className="max-w-sm rounded-xl border border-white/12 bg-white p-4">
                  <img alt="QR Code" src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}`} />
                </div>
              </div>
            )}

            {copyAndPaste && (
              <div className="grid gap-2">
                <Label>Copia e cola</Label>
                <Input readOnly value={copyAndPaste} className="border-white/12 bg-black/40 text-white" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
