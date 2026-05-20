import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getBoletoData } from '@/app/actions/boleto';

interface PageProps {
  params: Promise<{ paymentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { paymentId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(paymentId)) {
    return { title: 'Boleto não encontrado' };
  }

  const response = await getBoletoData(paymentId);
  const boleto = response?.data;

  if (!boleto) {
    return { title: 'Boleto não encontrado' };
  }

  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boleto.amount / 100);
  const title = `Boleto expirado - ${amount}`;
  const description = `Este boleto expirou. Valor: ${amount}`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Safefy',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function BoletoExpiredPage({ params }: PageProps) {
  const { paymentId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(paymentId)) {
    notFound();
  }

  const response = await getBoletoData(paymentId);
  const boleto = response?.data;

  if (!boleto) {
    notFound();
  }

  if (!boleto.isExpired) {
    redirect(`/boleto/${paymentId}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-500/10">
          <svg className="size-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-white">Boleto Expirado</h1>
        <p className="mt-1 text-sm text-zinc-400">Este boleto expirou e não pode mais ser pago.</p>
      </div>
    </div>
  );
}
