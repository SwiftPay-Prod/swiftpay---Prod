'use client';

import { useMemo, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedMode = useMemo(() => MODES.find((item) => item.value === mode) ?? MODES[0], [mode]);

  const canCreate = mode === 'StaticFixed' ? Number(amount) > 0 : true;

  const handleCreate = async () => {
    if (!canCreate || !selectedMode) {
      toast.error('Informe um valor para o Pix com valor fixo.');
      return;
    }

    setLoading(true);
    try {
      const created = (await createMerchantPaymentLink(merchantId, {
        enabledMethods: [PaymentMethod.Pix],
        amount: mode === 'StaticFixed' ? Number(amount) : 0,
        description: selectedMode.label,
        pixLinkMode: mode,
      })) as ApiResponse<CreatePaymentLinkData> | null;

      const token = created?.data?.paymentLinkUrl?.split('/').pop() ?? null;
      if (!token) {
        throw new Error('Não foi possível identificar o token do Pix Estático criado.');
      }

      const started = (await startPaymentLink(token, 'Pix')) as StaticStartPayload | null;
      const nextQr = started?.data?.qr ?? started?.data?.pix?.qrCode ?? null;
      const nextCopy = started?.data?.copyAndPaste ?? started?.data?.pix?.copyAndPaste ?? null;

      if (!nextQr && !nextCopy) {
        throw new Error('O Pix Estático foi criado, mas sem QR retornado.');
      }

      setQr(nextQr);
      setCopyAndPaste(nextCopy);
      toast.success('Pix Estático criado com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar Pix Estático.');
    } finally {
      setLoading(false);
    }
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
      <Card className="border-white/12 bg-[#16181a] text-white">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Pix Estático</h1>
          <p className="text-sm text-white/60">Crie QR reutilizável sem expiração para usar no seu comércio.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Modo</Label>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as PixLinkMode)}
              className="border-white/12 bg-black/40 text-white"
            >
              {MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {mode === 'StaticFixed' && (
            <div className="grid gap-2">
              <Label>Valor (BRL)</Label>
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="0,00"
                className="border-white/12 bg-black/40 text-white"
              />
            </div>
          )}

          <Button onClick={handleCreate} disabled={!canCreate || loading}>
            {loading ? 'Criando...' : 'Criar Pix Estático'}
          </Button>
        </CardContent>
      </Card>

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
