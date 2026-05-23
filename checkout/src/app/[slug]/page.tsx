'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPaymentLink, payPaymentLink } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api/v1';

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<any>(null);
  const [form, setForm] = useState({ name: '', taxId: '', email: '', phone: '' });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPaymentLink(slug).then(r => { setLink(r.data); setLoading(false); })
      .catch(() => { setError('Link não encontrado'); setLoading(false); });
  }, [slug]);

  const formatBRL = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault(); setPaying(true); setError('');
    try {
      const r = await payPaymentLink(slug, {
        payerName: form.name, payerTaxId: form.taxId,
        payerEmail: form.email, payerPhone: form.phone,
      });
      setPayment(r.data);
    } catch (err: any) { setError(err.message); }
    setPaying(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" /></div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-600">{error}</div>;
  if (!link) return null;

  if (payment) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto border-2 border-black rounded-full flex items-center justify-center"><span className="text-2xl font-bold">$</span></div>
        <h1 className="text-2xl font-bold">{link.title}</h1>
        <p className="text-4xl font-bold">{formatBRL(link.amount)}</p>
        <div className="bg-gray-50 p-6 rounded-xl space-y-3">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Código PIX</p>
            <p className="text-sm font-mono break-all select-all">{payment.copyPaste}</p>
          </div>
          <button onClick={() => navigator.clipboard?.writeText(payment.copyPaste)}
            className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
            Copiar código PIX
          </button>
          <p className="text-xs text-gray-400">Abra o app do seu banco, escolha PIX Copia e Cola e cole este código</p>
        </div>
        <StatusPoller paymentId={payment.paymentId} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{link.title}</h1>
          {link.description && <p className="text-gray-500">{link.description}</p>}
          <p className="text-4xl font-bold">{formatBRL(link.amount)}</p>
        </div>
        <form onSubmit={handlePay} className="bg-gray-50 p-6 rounded-xl space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nome completo</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">CPF/CNPJ</label>
            <input required value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>
          {link.requirePhone && <div>
            <label className="text-sm font-medium block mb-1">Telefone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>}
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
          <button type="submit" disabled={paying}
            className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {paying ? 'Processando...' : link.ctaText}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusPoller({ paymentId }: { paymentId: string }) {
  const [status, setStatus] = useState('PENDING');
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API}/payment-links/status/${paymentId}`);
        const data = await r.json();
        if (data.data?.status === 'PAID') { setStatus('PAID'); clearInterval(poll); }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [paymentId]);
  if (status === 'PAID') return <p className="text-black font-semibold">Pagamento confirmado!</p>;
  return <p className="text-sm text-gray-400 animate-pulse">Aguardando pagamento...</p>;
}
