'use client';
import { useState } from 'react';
import { Copy, Check, Key, CreditCard, Banknote, Globe, BookOpen, AlertTriangle, Gauge, Split, Wallet, Webhook, Languages } from 'lucide-react';

type Lang = 'pt' | 'en';
type SectionId = 'intro' | 'auth' | 'pix' | 'boleto' | 'card' | 'split' | 'withdrawals' | 'webhooks' | 'sdks' | 'errors' | 'limits';

const sections: { id: SectionId; title: Record<Lang, string>; icon: any }[] = [
  { id: 'intro', title: { pt: 'Introdução', en: 'Introduction' }, icon: BookOpen },
  { id: 'auth', title: { pt: 'Autenticação', en: 'Authentication' }, icon: Key },
  { id: 'pix', title: { pt: 'PIX', en: 'PIX Payments' }, icon: Banknote },
  { id: 'boleto', title: { pt: 'Boleto', en: 'Boleto' }, icon: CreditCard },
  { id: 'card', title: { pt: 'Cartão de Crédito', en: 'Credit Card' }, icon: CreditCard },
  { id: 'split', title: { pt: 'Split de Pagamentos', en: 'Split Payments' }, icon: Split },
  { id: 'withdrawals', title: { pt: 'Saques', en: 'Withdrawals' }, icon: Wallet },
  { id: 'webhooks', title: { pt: 'Webhooks', en: 'Webhooks' }, icon: Webhook },
  { id: 'sdks', title: { pt: 'SDKs & Exemplos', en: 'SDKs & Examples' }, icon: Globe },
  { id: 'errors', title: { pt: 'Erros', en: 'Errors' }, icon: AlertTriangle },
  { id: 'limits', title: { pt: 'Limites', en: 'Rate Limits' }, icon: Gauge },
];

interface DocContent {
  desc: Record<Lang, string>;
  code: string;
  note: Record<Lang, string>;
}

const docs: Record<SectionId, DocContent> = {
  intro: {
    desc: {
      pt: `URL Base: https://api.swiftpay.com/api/v1

Todas as requisições usam JSON. Valores monetários em centavos (BRL). Autenticação via Bearer token.

Content-Type: application/json`,
      en: `Base URL: https://api.swiftpay.com/api/v1

All requests use JSON. Monetary values in cents (BRL). Authentication via Bearer token.

Content-Type: application/json`,
    },
    code: `curl https://api.swiftpay.com/api/v1/payment-links \\
  -H "Authorization: Bearer swp_sua_chave" \\
  -H "Content-Type: application/json"`,
    note: {
      pt: 'Valores sempre em centavos. R$ 10,00 = 1000 centavos. Nunca use floats.',
      en: 'Values are always in cents. R$ 10.00 = 1000 cents. Never use floats.',
    },
  },
  auth: {
    desc: {
      pt: 'Toda requisicao exige autenticacao via Bearer token. Gere suas chaves de API no dashboard.\n\nChaves tem escopos de leitura e escrita. Armazene em variaveis de ambiente, nunca no codigo.',
      en: 'Every request requires Bearer token authentication. Generate API keys from the dashboard.\n\nKeys have read/write scopes. Store in environment variables, never in code.',
    },
    code: `curl -H "Authorization: Bearer swp_sua_chave" \\
  https://api.swiftpay.com/api/v1/api-keys`,
    note: {
      pt: 'Chaves sao mostradas apenas uma vez na criacao. Regere se comprometida.',
      en: 'Keys are shown once at creation. Regenerate if compromised.',
    },
  },
  pix: {
    desc: {
      pt: 'Crie pagamentos PIX com QR Code dinamico. O cliente paga escaneando o QR Code ou copiando o codigo PIX.\n\nFluxo: Criar link de pagamento -> Cliente acessa checkout -> Escolhe PIX -> Ve QR Code -> Paga no app do banco -> Webhook confirma',
      en: 'Create PIX payments with dynamic QR Codes. The customer pays by scanning the QR Code or copying the PIX code.\n\nFlow: Create payment link -> Customer opens checkout -> Chooses PIX -> Sees QR Code -> Pays in banking app -> Webhook confirms',
    },
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "PIX",
  "payerName": "Joao Silva",
  "payerTaxId": "12345678901"
}

Resposta:
{
  "success": true,
  "data": {
    "paymentId": "abc123",
    "method": "PIX",
    "qrCode": "[imagem base64]",
    "copyPaste": "000201010212...",
    "status": "PENDING"
  }
}`,
    note: {
      pt: 'QR Code gerado a partir do codigo PIX. O checkout faz polling a cada 5s para atualizar o status.',
      en: 'QR Code generated from the PIX code. Checkout polls every 5s for status updates.',
    },
  },
  boleto: {
    desc: {
      pt: 'Gere boletos bancarios com vencimento D+3. O cliente paga em qualquer banco ou casa loterica.\n\nO boleto esta disponivel como linha digitavel e link para PDF.',
      en: 'Generate bank slips with D+3 maturity. Customers pay at any bank or lottery outlet.\n\nThe boleto is available as a barcode number and PDF download link.',
    },
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "BOLETO",
  "payerName": "Joao Silva",
  "payerTaxId": "12345678901"
}

Resposta:
{
  "success": true,
  "data": {
    "paymentId": "abc123",
    "barcode": "34191.79001 01043...",
    "boletoUrl": "https://api.swiftpay.com/boletos/abc123.pdf"
  }
}`,
    note: {
      pt: 'Vencimento D+3 dias uteis. A compensacao leva ate 3 dias uteis apos o pagamento.',
      en: 'Maturity D+3 business days. Settlement takes up to 3 business days after payment.',
    },
  },
  card: {
    desc: {
      pt: 'Aceite pagamentos com cartao de credito em ate 12x. Os dados do cartao sao tokenizados no frontend - o servidor nunca ve o numero do cartao.\n\nA tokenizacao usa criptografia assimetrica (libsodium).',
      en: 'Accept credit card payments with installments up to 12x. Card data is tokenized on the frontend - the server never sees raw card numbers.\n\nTokenization uses asymmetric encryption (libsodium).',
    },
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "CREDIT_CARD",
  "cardToken": "token_criptografado",
  "lastDigits": "1111",
  "cardHolder": "JOAO SILVA",
  "installments": 3
}

Resposta:
{
  "success": true,
  "data": {
    "paymentId": "abc123",
    "authorizationCode": "123456",
    "lastDigits": "1111",
    "status": "PAID"
  }
}`,
    note: {
      pt: 'Parcelamento de 1x a 12x. A tokenizacao acontece no navegador via biblioteca MagicPay.',
      en: 'Installments from 1x to 12x. Tokenization happens in the browser via MagicPay library.',
    },
  },
  split: {
    desc: {
      pt: 'Divida pagamentos automaticamente entre multiplos recebedores. Ideal para marketplaces e plataformas.\n\nCada recebedor deve estar cadastrado na plataforma. O split e processado nativamente pelo provedor de pagamento.',
      en: 'Split payments automatically between multiple recipients. Ideal for marketplaces and platforms.\n\nEach recipient must be registered. Splits are processed natively by the payment provider.',
    },
    code: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "PIX",
  "splits": [
    { "amount": 7000, "percent": 70, "storeId": "vendedor_123" },
    { "amount": 3000, "percent": 30, "storeId": "plataforma_456" }
  ]
}`,
    note: {
      pt: 'O saldo de cada recebedor e atualizado individualmente. Split pode ser por porcentagem ou valor fixo.',
      en: "Each recipient's balance is updated individually. Splits can be by percentage or fixed amount.",
    },
  },
  withdrawals: {
    desc: {
      pt: 'Solicite saques do saldo disponivel para sua chave PIX.\n\nRequisitos: saldo disponivel suficiente, chave PIX valida, valor minimo de R$ 10,00. Taxa: R$ 10,00 fixos.',
      en: 'Request withdrawals from your available balance to your PIX key.\n\nRequirements: sufficient balance, valid PIX key, minimum R$ 10.00. Fee: R$ 10.00 flat.',
    },
    code: `POST /api/v1/wallet/withdrawals
{
  "amount": 5000,
  "pixKey": "usuario@email.com",
  "pixKeyType": "EMAIL"
}

Tipos de chave: CPF | CNPJ | EMAIL | PHONE | RANDOM_KEY`,
    note: {
      pt: 'Fluxo: Pendente -> Aprovado -> Concluido. Em caso de falha, o valor retorna ao saldo disponivel.',
      en: 'Flow: Pending -> Approved -> Completed. On failure, amount returns to available balance.',
    },
  },
  webhooks: {
    desc: {
      pt: 'Configure URLs para receber notificacoes em tempo real quando eventos acontecerem.\n\nEventos: payment.completed, payment.failed, payment.refunded, cashout.completed, cashout.failed',
      en: 'Configure URLs to receive real-time notifications when events occur.\n\nEvents: payment.completed, payment.failed, payment.refunded, cashout.completed, cashout.failed',
    },
    code: `POST /sua-url-webhook
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

// Verificar assinatura (Node.js):
const crypto = require('crypto');
const sig = crypto
  .createHmac('sha256', SEU_SEGREDO)
  .update(JSON.stringify(body))
  .digest('hex');`,
    note: {
      pt: '3 tentativas com backoff exponencial (2s, 4s, 8s). Responda HTTP 200 para confirmar recebimento.',
      en: '3 retry attempts with exponential backoff (2s, 4s, 8s). Reply HTTP 200 to confirm receipt.',
    },
  },
  sdks: {
    desc: {
      pt: 'Exemplos de integracao nas linguagens mais populares. Todos usam a mesma API REST.',
      en: 'Integration examples across popular languages. All use the same REST API.',
    },
    code: `// Node.js
const res = await fetch('https://api.swiftpay.com/api/v1/payment-links/{slug}/pay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ method: 'PIX', payerName: 'Joao Silva', payerTaxId: '12345678901' })
});

# Python
import requests
res = requests.post('https://api.swiftpay.com/api/v1/payment-links/{slug}/pay',
  json={'method': 'PIX', 'payerName': 'Joao Silva', 'payerTaxId': '12345678901'})

# cURL
curl -X POST https://api.swiftpay.com/api/v1/payment-links/{slug}/pay \\
  -H "Content-Type: application/json" \\
  -d '{"method":"PIX","payerName":"Joao Silva","payerTaxId":"12345678901"}'`,
    note: {
      pt: 'Todos os SDKs usam a mesma API. Autenticacao via Bearer token.',
      en: 'All SDKs use the same API. Authentication via Bearer token.',
    },
  },
  errors: {
    desc: {
      pt: 'A API usa codigos HTTP padrao para indicar sucesso ou falha.\n\n200 Sucesso | 400 Validacao | 401 Nao autorizado | 404 Nao encontrado | 409 Conflito | 422 Erro de negocio | 429 Muitas requisicoes | 500 Erro interno',
      en: 'The API uses standard HTTP status codes.\n\n200 Success | 400 Validation | 401 Unauthorized | 404 Not Found | 409 Conflict | 422 Business Error | 429 Rate Limited | 500 Server Error',
    },
    code: `// Erro de validacao (400)
{ "success": false, "message": "Falha na validacao", "errors": ["amount: deve ser positivo"] }

// Erro de negocio (422)
{ "success": false, "message": "Saldo insuficiente" }

// Erro de autenticacao (401)
{ "success": false, "message": "Nao autorizado" }`,
    note: {
      pt: 'Sempre verifique o campo "success". Erros de validacao listam cada campo com problema.',
      en: 'Always check the "success" field. Validation errors list each problematic field.',
    },
  },
  limits: {
    desc: {
      pt: 'Limites de requisicao por chave de API, resetados a cada minuto.\n\nGET /payment-links: 100 req/min\nPOST /payment-links: 30 req/min\nPOST /payment-links/{slug}/pay: 60 req/min\nGET /wallet: 60 req/min\nPOST /wallet: 20 req/min',
      en: 'Rate limits per API key, reset every minute.\n\nGET /payment-links: 100 req/min\nPOST /payment-links: 30 req/min\nPOST /payment-links/{slug}/pay: 60 req/min\nGET /wallet: 60 req/min\nPOST /wallet: 20 req/min',
    },
    code: `// Headers de rate limit
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1621867200

// Quando excedido (429):
{ "success": false, "message": "Muitas requisicoes. Tente novamente em 30s." }`,
    note: {
      pt: 'Monitore o header X-RateLimit-Remaining. Para aumentar os limites, contate o suporte.',
      en: 'Monitor X-RateLimit-Remaining header. Contact support to increase limits.',
    },
  },
};

export default function DocumentationPage() {
  const [lang, setLang] = useState<Lang>('pt');
  const [active, setActive] = useState<SectionId>('intro');
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
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <button onClick={() => setLang('pt')}
            className={`text-xs px-2 py-1 rounded transition-colors ${lang === 'pt' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            PT-BR
          </button>
          <Languages className="h-3 w-3 text-muted-foreground" />
          <button onClick={() => setLang('en')}
            className={`text-xs px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            EN
          </button>
        </div>
        {sections.map(s => {
          const I = s.icon;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                active === s.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}>
              <I className="h-4 w-4" />
              {s.title[lang]}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 min-w-0 max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent">
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">{currentSection.title[lang]}</h1>
        </div>

        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.desc[lang]}</p>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-primary text-primary-foreground text-xs font-mono">
            <span>{lang === 'pt' ? 'Exemplo' : 'Example'}</span>
            <button onClick={() => copyCode(section.code, active)}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              {copiedId === active ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedId === active ? (lang === 'pt' ? 'Copiado' : 'Copied') : (lang === 'pt' ? 'Copiar' : 'Copy')}
            </button>
          </div>
          <pre className="p-5 text-sm font-mono text-foreground bg-muted overflow-x-auto whitespace-pre-wrap leading-relaxed">{section.code}</pre>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
          <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-card-foreground">{section.note[lang]}</p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
