import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getBoletoData } from '@/app/actions/boleto';
import { BoletoPageContent } from './boleto-page-content';

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
  const title = `Boleto ${amount} - ${boleto.merchantName}`;
  const description = boleto.isExpired
    ? `Este boleto expirou. Valor: ${amount}`
    : `Boleto no valor de ${amount} para ${boleto.merchantName}. Pague antes do vencimento.`;

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

export default async function BoletoPage({ params }: PageProps) {
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

  if (boleto.isExpired) {
    redirect(`/boleto/${paymentId}/expired`);
  }

  return <BoletoPageContent boleto={boleto} />;
}
