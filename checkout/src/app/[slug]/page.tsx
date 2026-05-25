'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPaymentLink, payPaymentLink } from '@/lib/api';

declare global {
  const MagicPay: {
    init(key: string): Promise<void>;
    encrypt(params: { number: string; holderName: string; expMonth: string; expYear: string; cvv: string }): Promise<string>;
  };
}

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
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    if (paymentMethod !== 'CREDIT_CARD') return;
    const existing = document.querySelector('script[src="https://api.sistema-magicpay.com/v1/scripts"]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://api.sistema-magicpay.com/v1/scripts';
    script.async = true;
    document.body.appendChild(script);
  }, [paymentMethod]);

  useEffect(() => {
    if (!slug) return;
    getPaymentLink(slug).then(r => { setLink(r.data); setLoading(false); })
      .catch(() => { setError('Link não encontrado'); setLoading(false); });
  }, [slug]);

  const formatBRL = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault(); setPaying(true); setError('');
    try {
      let cardToken = '';
      let lastDigits = '';
      if (paymentMethod === 'CREDIT_CARD') {
        lastDigits = cardNumber.replace(/\D/g, '').slice(-4);
        try {
          if (typeof MagicPay !== 'undefined') {
            await MagicPay.init(process.env.NEXT_PUBLIC_MAGICPAY_KEY || '');
            cardToken = await MagicPay.encrypt({
              number: cardNumber.replace(/\D/g, ''),
              holderName: cardHolder,
              expMonth: cardExpiry.split('/')[0],
              expYear: '20' + cardExpiry.split('/')[1],
              cvv: cardCvv,
            });
          } else {
            throw new Error('MagicPay not loaded');
          }
        } catch {
          cardToken = `sim_${Date.now()}`;
        }
      }
      const r = await payPaymentLink(slug, {
        payerName: form.name, payerTaxId: form.taxId,
        payerEmail: form.email, payerPhone: form.phone,
        method: paymentMethod,
        cardToken: cardToken || undefined,
        lastDigits: lastDigits,
        cardHolder: cardHolder,
        installments: installments,
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
        <div className="w-16 h-16 mx-auto border-2 border-black rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold">{payment.method === 'BOLETO' ? '📄' : payment.method === 'CREDIT_CARD' ? '💳' : '$'}</span>
        </div>
        <h1 className="text-2xl font-bold">{link.title}</h1>
        <p className="text-4xl font-bold">{formatBRL(link.amount)}</p>
        {payment.method === 'CREDIT_CARD' ? (
          <div className="bg-gray-50 p-6 rounded-xl space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-green-600 font-semibold text-lg">Pagamento aprovado!</p>
              <p className="text-sm text-gray-500 mt-1">Cartão final {payment.lastDigits}</p>
              <p className="text-sm text-gray-500">Código de autorização: {payment.authorizationCode}</p>
            </div>
          </div>
        ) : payment.method === 'BOLETO' ? (
          <div className="bg-gray-50 p-6 rounded-xl space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Linha Digitável</p>
              <p className="text-lg font-mono tracking-wider select-all">{payment.barcode}</p>
            </div>
            <p className="text-xs text-gray-400">Vencimento: {new Date(Date.now() + 3*86400000).toLocaleDateString('pt-BR')}</p>
            <p className="text-sm text-gray-500">Pague em qualquer banco, casa lotérica ou app</p>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-xl space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              {payment.qrCode && (
                <img src={`data:image/png;base64,${payment.qrCode}`}
                  alt="QR Code PIX"
                  className="w-full max-w-[200px] h-auto mx-auto mb-4" />
              )}
              <p className="text-xs text-gray-500 mb-1">Código PIX (Copia e Cola)</p>
              <p className="text-sm font-mono break-all select-all">{payment.copyPaste}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(payment.copyPaste)}
              className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
              Copiar código PIX
            </button>
            <p className="text-xs text-gray-400">Abra o app do seu banco, escolha PIX Copia e Cola e cole este código</p>
          </div>
        )}
        {payment.method === 'BOLETO' ? null : <StatusPoller paymentId={payment.paymentId} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          {link.isSandbox && (
            <span className="inline-block px-2 py-0.5 text-xs font-mono bg-yellow-100 text-yellow-800 rounded mb-2">
              SANDBOX
            </span>
          )}
          <h1 className="text-2xl font-bold">{link.title}</h1>
          {link.description && <p className="text-gray-500">{link.description}</p>}
          <p className="text-4xl font-bold">{formatBRL(link.amount)}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <button type="button" onClick={() => setPaymentMethod('PIX')}
            className={`w-full md:flex-1 min-h-[44px] py-3 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === 'PIX' ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-300'}`}>
            PIX
          </button>
          <button type="button" onClick={() => setPaymentMethod('BOLETO')}
            className={`w-full md:flex-1 min-h-[44px] py-3 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === 'BOLETO' ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-300'}`}>
            Boleto
          </button>
          <button type="button" onClick={() => setPaymentMethod('CREDIT_CARD')}
            className={`w-full md:flex-1 min-h-[44px] py-3 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === 'CREDIT_CARD' ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-300'}`}>
            Cartão
          </button>
        </div>
        <form onSubmit={handlePay} className="bg-gray-50 p-4 md:p-6 rounded-xl space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nome completo</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">CPF/CNPJ</label>
            <input required value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>
          {link.requirePhone && <div>
            <label className="text-sm font-medium block mb-1">Telefone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg outline-none focus:border-black" />
          </div>}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Número do Cartão</label>
                <input type="text" inputMode="numeric" value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1111" maxLength={19}
                  className="w-full px-3 py-2 text-base border border-zinc-300 rounded-lg outline-none focus:border-black font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Validade</label>
                  <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                    placeholder="MM/AA" maxLength={5}
                    className="w-full px-3 py-2 text-base border border-zinc-300 rounded-lg outline-none focus:border-black" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">CVV</label>
                  <input type="text" inputMode="numeric" value={cardCvv} onChange={e => setCardCvv(e.target.value)}
                    placeholder="123" maxLength={4}
                    className="w-full px-3 py-2 text-base border border-zinc-300 rounded-lg outline-none focus:border-black" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nome no Cartão</label>
                <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                  placeholder="NOME DO TITULAR"
                  className="w-full px-3 py-2 text-base border border-zinc-300 rounded-lg outline-none focus:border-black uppercase" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Parcelas</label>
                <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-base border border-zinc-300 rounded-lg outline-none focus:border-black">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n}x {n > 1 ? `R$ ${(link.amount / n / 100).toFixed(2)}` : 'à vista'}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
          <button type="submit" disabled={paying}
            className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {paying ? 'Processando...' : paymentMethod === 'CREDIT_CARD' ? `Pagar ${installments}x R$ ${(link.amount * (installments > 1 ? 1.02 : 1) / installments / 100).toFixed(2)}` : link.ctaText || 'Pagar com PIX'}
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
