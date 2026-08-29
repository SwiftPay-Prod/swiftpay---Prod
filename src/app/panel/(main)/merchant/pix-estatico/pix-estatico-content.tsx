'use client';

import { useMemo, useState, useTransition } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RiCheckLine, RiRefreshLine } from '@remixicon/react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { createMerchantPaymentLink } from '@/app/actions/merchant/payment-links';
import { startPaymentLink } from '@/app/actions/merchant/payment-links-start';
import type { ApiResponse } from '@/types/common';
import type { CreatePaymentLinkData } from '@/types/merchant/payment-links';
import { PaymentMethod } from '@/types/enums';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { formattedCurrencyToCents } from '@/utils/currency';

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
    return formattedCurrencyToCents(amount) ?? 0;
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

        const createdError = created && typeof created === 'object' && 'error' in created ? (created as { error: { message: string } | null }).error : null;
        if (createdError) throw new Error(createdError.message || 'Erro ao criar link Pix Estático.');
        const paymentLinkUrl = created && typeof created === 'object' && 'data' in created ? (created as { data: { paymentLinkUrl?: string } | null }).data?.paymentLinkUrl ?? null : null;
        const token = paymentLinkUrl?.split('/').pop() ?? null;
        if (!token) throw new Error('Não foi possível identificar o token do Pix Estático criado.');

        const startedRaw = await startPaymentLink(token, 'Pix');
        console.log('[PixEstatico] started raw', startedRaw);
        const startedError = startedRaw && typeof startedRaw === 'object' && 'error' in startedRaw ? (startedRaw as { error: { message: string } | null }).error : null;
        if (startedError) throw new Error(startedError.message);
        const startedData = startedRaw && typeof startedRaw === 'object' && 'data' in startedRaw ? (startedRaw as { data: Record<string, unknown> | null }).data : null;
        const pixObj = startedData && typeof startedData === 'object' && ('pix' in startedData || 'Pix' in startedData) ? ((startedData as Record<string, unknown>)['pix'] ?? (startedData as Record<string, unknown>)['Pix']) as Record<string, unknown> | null : null;
        const qrVal = startedData && typeof startedData === 'object' && ('qr' in startedData || 'Qr' in startedData) ? ((startedData as Record<string, unknown>)['qr'] ?? (startedData as Record<string, unknown>)['Qr']) as string | null : null;
        const copyVal = startedData && typeof startedData === 'object' && ('copyAndPaste' in startedData || 'CopyAndPaste' in startedData) ? ((startedData as Record<string, unknown>)['copyAndPaste'] ?? (startedData as Record<string, unknown>)['CopyAndPaste']) as string | null : null;
        const pixQr = pixObj && typeof pixObj === 'object' && ('qrCode' in pixObj || 'QrCode' in pixObj) ? ((pixObj as Record<string, unknown>)['qrCode'] ?? (pixObj as Record<string, unknown>)['QrCode']) as string | null : null;
        const pixCopy = pixObj && typeof pixObj === 'object' && ('copyAndPaste' in pixObj || 'CopyAndPaste' in pixObj) ? ((pixObj as Record<string, unknown>)['copyAndPaste'] ?? (pixObj as Record<string, unknown>)['CopyAndPaste']) as string | null : null;
        const nextQr = qrVal ?? pixQr ?? null;
        const nextCopy = copyVal ?? pixCopy ?? null;
        if (!nextQr && !nextCopy) throw new Error('O Pix Estático foi criado, mas sem QR retornado.');
        setQr(nextQr);
        setCopyAndPaste(nextCopy);
        toast.success('Pix Estático criado com sucesso.');
      } catch (error: unknown) {
        let msg = 'Erro ao comunicar com a API de pagamentos (HTTP 500).';
        if (error && typeof error === 'object' && 'response' in error) {
          const respData = (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response?.data;
          if (respData?.error?.message) msg = respData.error.message;
          else if (respData?.message) msg = respData.message;
          console.error('[PixEstatico] api error', respData, error);
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
              <CurrencyCentsInput
                onValueChange={(v) => setAmount(v)}
                placeholder="R$ 0,00"
                variant="secondary"
                className="text-center [&_input]:text-center [&_input]:text-2xl [&_input]:font-semibold [&_input]:tracking-tight"
              />
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

              <Button variant="outline" onClick={() => { setQr(null); setCopyAndPaste(null); }} className="gap-2">
                <RiRefreshLine className="h-4 w-4" />
                Gerar novo
              </Button>
            </div>

            {(qr || copyAndPaste) && (
              <div className="grid gap-2">
                <Label>QR Code</Label>
                <div className="max-w-sm rounded-xl border border-white/12 bg-white p-4">
                  <QRCodeSVG value={qr ?? copyAndPaste ?? ''} size={256} level="M" className="h-auto w-full" />
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
