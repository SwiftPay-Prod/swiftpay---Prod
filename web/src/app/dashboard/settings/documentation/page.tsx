'use client';
import { useState } from 'react';
import { Copy, Check, Key, CreditCard, Banknote, ArrowRightLeft, Globe, Lock, BookOpen, AlertTriangle, Gauge, Split, Wallet, Webhook } from 'lucide-react';
import { Card, Text, Button, Spacer } from '@geist-ui/core';

const sections = [
  { id: 'intro', title: 'Introduction', icon: BookOpen },
  { id: 'auth', title: 'Authentication', icon: Key },
  { id: 'pix', title: 'PIX Payments', icon: Banknote },
  { id: 'boleto', title: 'Boleto', icon: CreditCard },
  { id: 'card', title: 'Credit Card', icon: CreditCard },
  { id: 'split', title: 'Split Payments', icon: Split },
  { id: 'withdrawals', title: 'Withdrawals', icon: Wallet },
  { id: 'webhooks', title: 'Webhooks', icon: Webhook },
  { id: 'sdks', title: 'SDKs & Examples', icon: Globe },
  { id: 'errors', title: 'Errors', icon: AlertTriangle },
  { id: 'limits', title: 'Rate Limits', icon: Gauge },
];

const docs: Record<string, { desc: string; code?: string; note?: string }> = {
  intro: {
    desc: `Base URL: https://api.swiftpay.com/api/v1

All requests and responses use JSON encoding. Monetary values are in cents (BRL). Authentication is via Bearer token.

Content-Type: application/json`,
    code: `curl https://api.swiftpay.com/api/v1/payment-links \\
  -H "Authorization: Bearer swp_your_key" \\
  -H "Content-Type: application/json"`,
    note: `Amounts are always in cents. R$ 10.00 = 1000 cents. Never use floats.`,
  },
  auth: {
    desc: `Every API request requires authentication via a Bearer token. Generate your API keys from the dashboard.

Keys have read/write scopes. Store them in environment variables, never in code.`,
    code: `curl -H "Authorization: Bearer swp_your_key" \\
  https://api.swiftpay.com/api/v1/api-keys`,
    note: `Keys are shown once at creation. Regenerate if compromised.`,
  },
  pix: {
    desc: `Create PIX payments with dynamic QR Codes. The customer pays by scanning the QR Code or copying the PIX code.

Flow: Create payment link -> Customer opens checkout -> Chooses PIX -> Sees QR Code -> Pays in banking app -> Webhook confirms`,
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "PIX",
  "payerName": "John Doe",
  "payerTaxId": "12345678901"
}

Response:
{
  "success": true,
  "data": {
    "paymentId": "abc123",
    "method": "PIX",
    "qrCode": "[base64 image]",
    "copyPaste": "000201010212...",
    "status": "PENDING"
  }
}`,
    note: `QR Code generated from PIX copy-paste string. Checkout polls every 5s for status changes.`,
  },
  boleto: {
    desc: `Generate bank slips with D+3 maturity. Customers pay at any bank or lottery outlet.

The boleto is available as a barcode number and PDF download link.`,
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "BOLETO",
  "payerName": "John Doe",
  "payerTaxId": "12345678901"
}

Response:
{
  "success": true,
  "data": {
    "paymentId": "abc123",
    "barcode": "34191.79001 01043.510047...",
    "boletoUrl": "https://api.swiftpay.com/boletos/abc123.pdf"
  }
}`,
    note: `Maturity is D+3 business days. Settlement takes up to 3 business days after payment.`,
  },
  card: {
    desc: `Accept credit card payments with installments up to 12x. Card data is tokenized on the frontend - the server never sees raw card numbers.

Tokenization uses asymmetric encryption (libsodium).`,
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "CREDIT_CARD",
  "cardToken": "encrypted_token",
  "lastDigits": "1111",
  "cardHolder": "JOHN DOE",
  "installments": 3,
  "payerName": "John Doe",
  "payerTaxId": "12345678901"
}

Response:
{
  "success": true,
  "data": {
    "paymentId": "abc123",
    "authorizationCode": "123456",
    "lastDigits": "1111",
    "status": "PAID"
  }
}`,
    note: `Installments from 1x to 12x. Tokenization happens in the browser via MagicPay library.`,
  },
  split: {
    desc: `Split payments automatically between multiple recipients. Ideal for marketplaces and platforms.

Each recipient must be registered on the platform. Splits are processed natively by the payment provider.`,
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "PIX",
  "splits": [
    { "amount": 7000, "percent": 70, "storeId": "seller_123" },
    { "amount": 3000, "percent": 30, "storeId": "platform_456" }
  ]
}`,
    note: `Each recipient's balance is updated individually. Splits can be by percentage or fixed amount.`,
  },
  withdrawals: {
    desc: `Request withdrawals from your available balance to your PIX key.

Requirements: sufficient available balance, valid PIX key, minimum withdrawal of R$ 10.00. Fee: R$ 10.00 flat.`,
    code: `POST /api/v1/wallet/withdrawals
{
  "amount": 5000,
  "pixKey": "user@email.com",
  "pixKeyType": "EMAIL"
}

PIX key types: CPF | CNPJ | EMAIL | PHONE | RANDOM_KEY`,
    note: `Status flow: Pending -> Approved -> Completed. On failure, amount returns to available balance.`,
  },
  webhooks: {
    desc: `Configure callback URLs to receive real-time notifications when events occur on your account.

Events: payment.completed, payment.failed, payment.refunded, cashout.completed, cashout.failed`,
    code: `POST /your-webhook-url
Headers:
  X-Swiftpay-Signature: sha256=...
  X-Swiftpay-Event: payment.completed
  X-Swiftpay-Delivery: uuid

Body:
{
  "paymentId": "guid",
  "eventType": "payment.completed",
  "status": "PAID",
  "amount": 2990
}

// Verify signature (Node.js):
const crypto = require('crypto');
const sig = crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');`,
    note: `3 retry attempts with exponential backoff (2s, 4s, 8s). Reply HTTP 200 to confirm receipt.`,
  },
  sdks: {
    desc: `Integration examples across popular languages. All examples use the same REST API.`,
    code: `# Node.js
const res = await fetch('https://api.swiftpay.com/api/v1/payment-links/{slug}/pay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ method: 'PIX', payerName: 'John Doe', payerTaxId: '12345678901' })
});

# Python
import requests
res = requests.post('https://api.swiftpay.com/api/v1/payment-links/{slug}/pay',
  json={'method': 'PIX', 'payerName': 'John Doe', 'payerTaxId': '12345678901'})

# cURL
curl -X POST https://api.swiftpay.com/api/v1/payment-links/{slug}/pay \\
  -H "Content-Type: application/json" \\
  -d '{"method":"PIX","payerName":"John Doe","payerTaxId":"12345678901"}'`,
    note: `All SDKs use the same API. Authentication via Bearer token.`,
  },
  errors: {
    desc: `The API uses standard HTTP status codes to indicate success or failure.

200 Success | 400 Validation | 401 Unauthorized | 404 Not Found | 409 Conflict | 422 Business Error | 429 Rate Limited | 500 Server Error`,
    code: `// Validation error (400)
{ "success": false, "message": "Validation failed", "errors": ["amount: must be positive"] }

// Business error (422)
{ "success": false, "message": "Insufficient balance" }

// Auth error (401)
{ "success": false, "message": "Unauthorized" }`,
    note: `Always check the "success" field. Validation errors list each problematic field.`,
  },
  limits: {
    desc: `Rate limits protect platform stability. Limits are per API key and reset every minute.

GET /payment-links: 100 req/min
POST /payment-links: 30 req/min
POST /payment-links/{slug}/pay: 60 req/min
GET /wallet: 60 req/min
POST /wallet: 20 req/min`,
    code: `// Rate limit headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1621867200

// When exceeded (429):
{ "success": false, "message": "Too many requests. Retry after 30s." }`,
    note: `Monitor X-RateLimit-Remaining header. Contact support to increase limits.`,
  },
};

export default function DocumentationPage() {
  const [active, setActive] = useState('intro');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const section = docs[active];
  const currentSection = sections.find(s => s.id === active)!;
  const Icon = currentSection.icon;

  return (
    <div className="flex gap-10">
      <nav className="w-56 shrink-0 space-y-0.5">
        {sections.map(s => {
          const I = s.icon;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                active === s.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}>
              <I className="h-4 w-4" />
              {s.title}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 min-w-0 max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent">
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">{currentSection.title}</h1>
        </div>

        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.desc}</p>

        {section.code && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary text-primary-foreground text-xs font-mono">
              <span>Example</span>
              <button onClick={() => copyCode(section.code!, active)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                {copiedId === active ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === active ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-5 text-sm font-mono text-foreground bg-muted overflow-x-auto whitespace-pre-wrap leading-relaxed">{section.code}</pre>
          </div>
        )}

        {section.note && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-card-foreground">{section.note}</p>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
