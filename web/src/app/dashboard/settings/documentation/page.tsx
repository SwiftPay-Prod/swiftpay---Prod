'use client';
import { useState } from 'react';
import { Copy } from 'lucide-react';

const sections = [
  { id: 'auth', title: 'Autenticação' },
  { id: 'payments', title: 'Pagamentos' },
  { id: 'webhooks', title: 'Webhooks' },
  { id: 'withdrawals', title: 'Saques' },
  { id: 'errors', title: 'Erros' },
];

const codeExamples: Record<string, string> = {
  auth: `// Autenticação
// Todas as requisições precisam do header:
// Authorization: Bearer <sua_api_key>

// Exemplo com curl:
curl -H "Authorization: Bearer swp_abc123..." \\
     -H "Content-Type: application/json" \\
     https://api.swiftpay.com/v1/payment-links`,

  payments: `// Criar um link de pagamento PIX
POST /api/v1/payment-links
{
  "title": "Consultoria",
  "amount": 2990,         // R$ 29,90 em centavos
  "requireDocument": true
}

// Resposta:
{
  "success": true,
  "data": {
    "id": "guid",
    "slug": "a1b2c3d4",
    "amount": 2990,
    "isActive": true
  }
}

// Cliente paga via:
// GET /checkout/{slug} → página pública`,

  webhooks: `// Webhook de confirmação de pagamento
// Enviado via POST para sua URL configurada

// Headers:
X-Swiftpay-Signature: sha256=...
X-Swiftpay-Event: payment.completed
X-Swiftpay-Delivery: uuid

// Payload:
{
  "paymentId": "guid",
  "eventType": "payment.completed",
  "status": "PAID",
  "amount": 2990
}

// Validação da assinatura (HMAC-SHA256):
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');
// Compare com X-Swiftpay-Signature`,

  withdrawals: `// Solicitar saque
POST /api/v1/wallet/withdrawals
{
  "amount": 5000,          // R$ 50,00 em centavos
  "pixKey": "email@exemplo.com",
  "pixKeyType": "EMAIL"
}

// Resposta:
{
  "success": true,
  "data": { "id": "guid" }
}`,

  errors: `// Erros seguem o padrão:
{
  "success": false,
  "message": "Descrição do erro",
  "errors": ["campo: motivo"]
}

// Códigos HTTP:
// 200 - Sucesso
// 400 - Erro de validação
// 401 - Não autenticado
// 404 - Não encontrado
// 500 - Erro interno`,
};

export default function DocumentationPage() {
  const [active, setActive] = useState('auth');
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    navigator.clipboard?.writeText(codeExamples[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-8 max-w-5xl">
      <nav className="w-48 shrink-0 space-y-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              active === s.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {s.title}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Documentação da API</h1>
          <button onClick={copyCode} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Copy className="h-3 w-3" /> {copied ? 'Copiado!' : 'Copiar exemplo'}
          </button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">bash</span>
            <span className="text-xs text-muted-foreground">{active === 'auth' ? 'Autenticação' :
              active === 'payments' ? 'Pagamentos' :
              active === 'webhooks' ? 'Webhooks' :
              active === 'withdrawals' ? 'Saques' : 'Erros'}</span>
          </div>
          <pre className="p-4 text-sm font-mono text-foreground bg-muted overflow-x-auto whitespace-pre-wrap">{codeExamples[active]}</pre>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Base URL: <code className="bg-muted px-1 rounded">https://api.swiftpay.com/api/v1</code></p>
          <p>Formato: <code className="bg-muted px-1 rounded">JSON</code></p>
          <p>Moeda: <code className="bg-muted px-1 rounded">BRL</code> (valores em centavos)</p>
        </div>
      </div>
    </div>
  );
}
