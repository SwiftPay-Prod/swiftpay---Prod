'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextField, Label as HeroLabel, Select, ListBox, Chip } from '@heroui/react';
import { RiCheckLine, RiRefreshLine, RiQrCodeLine, RiMoneyDollarCircleLine, RiShareLine, RiDeleteBinLine } from '@remixicon/react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { createMerchantPaymentLink, deleteMerchantPaymentLink, listMerchantPaymentLinks } from '@/app/actions/merchant/payment-links';
import { startPaymentLink } from '@/app/actions/merchant/payment-links-start';
import type { ApiResponse } from '@/types/common';
import type { CreatePaymentLinkData, MinimalPaymentLink } from '@/types/merchant/payment-links';
import { PaymentMethod } from '@/types/enums';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { mapParseColorToChipColor } from '@/parse';

type PixLinkMode = 'StaticFixed' | 'StaticOpen' | 'StaticPortable';

const pixLinkModeParse = {
  StaticFixed: { label: 'Pix Estático com valor fixo', description: 'Gera um QR com valor definido. Quem pagar escaneia e paga exatamente esse valor.', color: 'accent' as const, icon: <RiMoneyDollarCircleLine className="size-3.5" /> },
  StaticOpen: { label: 'Pix Estático sem valor', description: 'Gera um QR sem valor. O pagador digita o valor no app do banco.', color: 'success' as const, icon: <RiQrCodeLine className="size-3.5" /> },
  StaticPortable: { label: 'BR Code Portável', description: 'Mesmo QR anterior, mas sem depender do checkout. Pode ser impresso e colado no comércio.', color: 'warning' as const, icon: <RiShareLine className="size-3.5" /> },
} as const;

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
  const [staticLinks, setStaticLinks] = useState<MinimalPaymentLink[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const amountCents = useMemo(() => {
    if (!amount) return 0;
    return formattedCurrencyToCents(amount) ?? 0;
  }, [amount]);
  const canCreate = mode === 'StaticFixed' ? amountCents > 0 : true;
  const selectedMode = useMemo(() => MODES.find((item) => item.value === mode) ?? MODES[0], [mode]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await listMerchantPaymentLinks(merchantId, { page: 1, pageSize: 50 });
        console.log('[PixEstatico] list raw', res);
        const raw = (res as unknown as { data?: { items?: unknown[] } | unknown[] })?.data;
        const items = Array.isArray(raw) ? raw : Array.isArray((raw as { items?: unknown[] })?.items) ? (raw as { items: unknown[] }).items : [];
        console.log('[PixEstatico] list items', items);
        const filtered = (items as MinimalPaymentLink[]).filter((l) => {
          const v = (l as unknown as { pixLinkMode?: string | number }).pixLinkMode;
          console.log('[PixEstatico] item', l.id, v, (l as unknown as { description?: string }).description);
          if (v == null) return String((l as unknown as { description?: string }).description ?? '').includes('Pix Estático');
          const s = String(v);
          return s !== '0' && s !== 'Dynamic' && (s.startsWith('Static') || ['1', '2', '3'].includes(s));
        });
        console.log('[PixEstatico] filtered', filtered, 'total', items.length);
        if (!cancelled) setStaticLinks(filtered.length > 0 ? filtered : (items as MinimalPaymentLink[]).slice(0, 10));
      } catch (e) {
        console.error('[PixEstatico] list failed', e);
        if (!cancelled) setStaticLinks([]);
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [merchantId]);

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
        try {
          const res = await listMerchantPaymentLinks(merchantId, { page: 1, pageSize: 50 });
          const raw = (res as unknown as { data?: { items?: unknown[] } | unknown[] })?.data;
          const items = Array.isArray(raw) ? raw : Array.isArray((raw as { items?: unknown[] })?.items) ? (raw as { items: unknown[] }).items : [];
          const filtered = (items as MinimalPaymentLink[]).filter((l) => {
            const v = (l as unknown as { pixLinkMode?: string | number }).pixLinkMode;
            if (v == null) return String((l as unknown as { description?: string }).description ?? '').includes('Pix Estático');
            const s = String(v);
            return s !== '0' && s !== 'Dynamic' && (s.startsWith('Static') || ['1', '2', '3'].includes(s));
          });
          setStaticLinks(filtered.length > 0 ? filtered : (items as MinimalPaymentLink[]).slice(0, 10));
        } catch {}
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

  const handleDelete = async (paymentLinkId: string) => {
    if (!confirm('Excluir este QR estático? Ele não poderá ser usado para pagamento.')) return;
    setDeletingId(paymentLinkId);
    try {
      await deleteMerchantPaymentLink(merchantId, paymentLinkId);
      toast.success('QR excluído.');
      const res = await listMerchantPaymentLinks(merchantId, { page: 1, pageSize: 50 });
      const raw = (res as unknown as { data?: { items?: unknown[] } | unknown[] })?.data;
      const items = Array.isArray(raw) ? raw : Array.isArray((raw as { items?: unknown[] })?.items) ? (raw as { items: unknown[] }).items : [];
      const filtered = (items as MinimalPaymentLink[]).filter((l) => {
        const v = (l as unknown as { pixLinkMode?: string | number }).pixLinkMode;
        if (v == null) return String((l as unknown as { description?: string }).description ?? '').includes('Pix Estático');
        const s = String(v);
        return s !== '0' && s !== 'Dynamic' && (s.startsWith('Static') || ['1', '2', '3'].includes(s));
      });
      setStaticLinks(filtered.length > 0 ? filtered : (items as MinimalPaymentLink[]).slice(0, 10));
      setQr(null);
      setCopyAndPaste(null);
    } catch (e) {
      console.error('[PixEstatico] delete failed', e);
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir QR');
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="grid gap-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-3.5 bg-white text-black">
          <span className="text-[11px] font-bold tracking-widest">PIX</span>
        </div>
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white">Pix Estático</h1>
          <p className="max-w-2xl text-sm leading-5 text-white/60">Crie QR reutilizável sem expiração para usar no seu comércio. Funciona off-checkout e pode ser impresso.</p>
        </div>
      </div>
      <div className="rounded-5 border border-white/12 bg-[#16181a] p-5 sm:p-6">
        <div className="grid gap-4">
          <Select
            variant="secondary"
            className="w-full"
            placeholder="Selecione o modo"
            value={mode}
            onChange={(key) => setMode(key as PixLinkMode)}
          >
            <HeroLabel className="text-xs font-semibold tracking-wide text-white/70">Modo</HeroLabel>
            <Select.Trigger>
              <Select.Value>
                <div className="flex items-center gap-2">
                  <Chip variant="soft" color={mapParseColorToChipColor(pixLinkModeParse[mode].color)} size="sm" className="gap-1">
                    {pixLinkModeParse[mode].icon}
                    {pixLinkModeParse[mode].label}
                  </Chip>
                </div>
              </Select.Value>
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {MODES.map((item) => {
                  const parse = pixLinkModeParse[item.value];
                  const isFuture = item.value !== 'StaticFixed';
                  return (
                    <ListBox.Item key={item.value} id={item.value} textValue={item.label} isDisabled={isFuture}>
                      <Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm" className="gap-1">
                        {parse.icon}
                        {parse.label}
                      </Chip>
                      {isFuture && <span className="ml-auto text-xs text-muted">em breve</span>}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </Select.Popover>
          </Select>
          <p className="text-xs text-white/50">{selectedMode!.description}</p>
          {mode === 'StaticFixed' && (
            <TextField
              variant="secondary"
              isRequired
              className="[&_input]:text-center [&_input]:text-4xl [&_input]:font-semibold [&_input]:tracking-tight"
            >
              <HeroLabel>Valor (BRL)</HeroLabel>
              <CurrencyCentsInput
                onValueChange={(v) => setAmount(v)}
                placeholder="R$ 0,00"
                variant="secondary"
                className="text-center"
              />
            </TextField>
          )}
          <Button onClick={handleCreate} disabled={!canCreate || isPending} className="rounded-full bg-white font-semibold text-black hover:bg-white/90 disabled:opacity-40">
            {isPending ? 'Criando...' : 'Criar Pix Estático'}
          </Button>
          {lastError && (
            <div className="rounded-[12px] border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{lastError}</div>
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
                <div className="w-fit rounded-xl border border-white/12 bg-white p-3">
                  {qr && (qr.startsWith('data:') || qr.startsWith('http')) ? (
                    <img alt="QR Code" src={qr} className="h-auto w-full max-w-64" />
                  ) : (
                    <QRCodeSVG value={copyAndPaste ?? qr ?? 'pix'} size={240} level="L" />
                  )}
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
      <Card className="border-white/12 bg-[#16181a] text-white">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">QRs criados</h2>
          <p className="text-sm text-white/60">Reutilize seus QRs estáticos. Eles não expiram e ficam salvos aqui.</p>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <p className="text-sm text-white/50">Carregando...</p>
          ) : staticLinks.length === 0 ? (
            <p className="text-sm text-white/50">Nenhum QR estático criado ainda.</p>
          ) : (
            <div className="grid gap-2">
              {staticLinks.map((link) => {
                const rawMode = (link as unknown as { pixLinkMode?: string | number }).pixLinkMode;
                let key: PixLinkMode = 'StaticFixed';
                if (typeof rawMode === 'number') {
                  if (rawMode === 2) key = 'StaticOpen';
                  else if (rawMode === 3) key = 'StaticPortable';
                  else key = 'StaticFixed';
                } else if (typeof rawMode === 'string' && rawMode in pixLinkModeParse) {
                  key = rawMode as PixLinkMode;
                }
                const parse = pixLinkModeParse[key];
                return (
                  <div key={link.id} className="flex items-center justify-between gap-2 rounded-3 border border-white/12 bg-black/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm" className="gap-1">
                        {parse.icon}
                        {parse.label}
                      </Chip>
                      <span className="text-sm font-mono tabular-nums text-white">{typeof link.amount === 'number' ? formatCurrency(link.amount) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="max-w-40 truncate text-xs text-white/50 md:max-w-60">{link.id}</span>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(link.id)} disabled={deletingId === link.id} aria-label="Excluir QR">
                        <RiDeleteBinLine className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
