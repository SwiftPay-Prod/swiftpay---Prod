'use client';

import { useEffect } from 'react';
import type { BoletoData } from '@/types/boleto';

interface BoletoPageContentProps {
  boleto: BoletoData;
}

export function BoletoPageContent({ boleto }: BoletoPageContentProps) {
  const shouldRedirect = !boleto.isExpired && boleto.status !== 'Completed' && boleto.pdfUrl;

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = boleto.pdfUrl!;
    }
  }, [shouldRedirect, boleto.pdfUrl]);

  if (boleto.status === 'Completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="size-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">Boleto Pago</h1>
          <p className="mt-1 text-sm text-zinc-400">Este boleto já foi pago com sucesso.</p>
        </div>
      </div>
    );
  }

  if (!boleto.pdfUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-800">
            <svg className="size-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">Boleto Indisponível</h1>
          <p className="mt-1 text-sm text-zinc-400">O PDF deste boleto não está disponível no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="text-sm text-zinc-400">Abrindo boleto...</p>
      </div>
    </div>
  );
}
