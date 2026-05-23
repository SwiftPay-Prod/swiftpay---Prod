const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api/v1';

export async function getPaymentLink(slug: string) {
  const res = await fetch(`${API}/payment-links/slug/${slug}`);
  if (!res.ok) throw new Error('Payment link not found');
  return res.json();
}

export async function payPaymentLink(slug: string, data: {
  payerName?: string; payerTaxId?: string; payerEmail?: string; payerPhone?: string; method?: string;
  cardToken?: string; lastDigits?: string; cardHolder?: string; installments?: number;
}) {
  const res = await fetch(`${API}/payment-links/${slug}/pay`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Payment failed');
  return res.json();
}
