'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const sections = [
  { id: 'intro', title: 'Introdução' },
  { id: 'auth', title: 'Autenticação' },
  { id: 'pix', title: 'PIX' },
  { id: 'boleto', title: 'Boleto' },
  { id: 'card', title: 'Cartão de Crédito' },
  { id: 'split', title: 'Split de Pagamentos' },
  { id: 'withdrawals', title: 'Saques' },
  { id: 'webhooks', title: 'Webhooks' },
  { id: 'sdks', title: 'SDKs & Exemplos' },
  { id: 'errors', title: 'Erros' },
  { id: 'limits', title: 'Rate Limits' },
];

const docs: Record<string, { desc: string; request?: string; response?: string; notes?: string }> = {
  intro: {
    desc: `A API Swiftpay permite criar e gerenciar pagamentos via PIX, Boleto e Cartão de Crédito.

Base URL: https://api.swiftpay.com/api/v1
Formato: JSON
Moeda: BRL (valores em centavos — R$ 10,00 = 1000)
Autenticação: Bearer Token (via API Key)`,
    notes: `📌 Importante: Todos os valores monetários são em centavos.
📌 Sempre envie Content-Type: application/json.
📌 Use ambiente de produção com HTTPS.`,
  },
  auth: {
    desc: `Todas as requisições à API exigem autenticação via Bearer Token.

Para obter sua chave:
1. Acesse Dashboard → API Keys
2. Clique em "Criar"
3. Copie a chave gerada (prefixo swp_)

A chave tem escopos de leitura (read) e escrita (write).`,
    request: `curl -H "Authorization: Bearer swp_sua_chave_aqui" \\
     -H "Content-Type: application/json" \\
     https://api.swiftpay.com/api/v1/payment-links`,
    response: `// Listando suas chaves de API
GET /api/v1/api-keys
Authorization: Bearer swp_sua_chave

// Resposta:
{
  "success": true,
  "data": [
    { "id": "guid", "name": "Produção", "key": "swp_abc...", "scopes": "read,write", "isActive": true }
  ]
}`,
    notes: `⚠️ A chave de API é mostrada apenas uma vez na criação.
⚠️ Mantenha sua chave em variável de ambiente, nunca no código.
⚠️ Em caso de vazamento, revogue a chave em Dashboard → API Keys.`,
  },
  pix: {
    desc: `Crie cobranças PIX com QR Code dinâmico. O cliente paga escaneando o QR Code ou copiando o código PIX.

Fluxo:
1. POST /payment-links → cria um link de pagamento
2. Comprador acessa /checkout/{slug}
3. Preenche dados e escolhe PIX
4. Sistema gera QR Code + Código PIX
5. Comprador paga no app do banco
6. Webhook notifica quando o pagamento é confirmado`,
    request: `// Criar um link de pagamento (admin)
POST /api/v1/payment-links
Authorization: Bearer swp_sua_chave

{
  "title": "Consultoria em Marketing",
  "description": "Pacote completo de consultoria",
  "amount": 2990,
  "requireDocument": true,
  "requirePhone": false
}

// Cliente paga o link
POST /api/v1/payment-links/{slug}/pay
{
  "method": "PIX",
  "payerName": "João Silva",
  "payerTaxId": "12345678901",
  "payerEmail": "joao@email.com"
}`,
    response: `// Resposta do pagamento:
{
  "success": true,
  "data": {
    "paymentId": "meu-link-abc123def",
    "method": "PIX",
    "qrCode": "iVBORw0KGgo...",  // base64 da imagem QR Code
    "copyPaste": "000201010212...", // código PIX copia e cola
    "status": "PENDING"
  }
}

// Consultar status:
GET /api/v1/payment-links/status/{paymentId}

// Resposta:
{
  "success": true,
  "data": {
    "status": "PAID",  // PENDING | PAID | REFUSED | REFUNDED
    "externalId": "meu-link-abc123def",
    "paidAt": "2026-05-24T14:30:00Z"
  }
}`,
    notes: `✅ O QR Code é gerado automaticamente a partir do código PIX.
✅ O checkout faz polling automático a cada 5 segundos.
✅ Quando o status muda para PAID, o cliente é redirecionado.
✅ O webhook de confirmação é enviado para sua URL configurada.`,
  },
  boleto: {
    desc: `Crie boletos bancários com vencimento D+3. O cliente paga em qualquer banco, casa lotérica ou app.

Fluxo:
1. Cria o link de pagamento (admin)
2. Cliente acessa /checkout/{slug} e escolhe Boleto
3. Sistema gera o boleto com linha digitável
4. Cliente paga em qualquer banco ou lotérica
5. O status é atualizado quando o boleto é compensado (até D+3)`,
    request: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "BOLETO",
  "payerName": "João Silva",
  "payerTaxId": "12345678901"
}`,
    response: `{
  "success": true,
  "data": {
    "paymentId": "meu-link-abc123def",
    "method": "BOLETO",
    "barcode": "34191.79001 01043.510047 91020.150008 4 12340000001000",
    "boletoUrl": "https://api.swiftpay.com/boletos/meu-link-abc123def.pdf"
  }
}`,
    notes: `📄 O boleto tem vencimento em D+3 (dias úteis).
📄 A linha digitável pode ser copiada e colada em apps de banco.
📄 O PDF do boleto pode ser baixado para impressão.
📄 A compensação pode levar até 3 dias úteis.`,
  },
  card: {
    desc: `Aceite cartões de crédito com parcelamento em até 12x. A tokenização dos dados do cartão é feita no frontend, garantindo que o servidor nunca veja os dados sensíveis.

Fluxo:
1. Cliente preenche dados do cartão no checkout
2. O cartão é tokenizado no navegador (criptografado)
3. O token é enviado para a API
4. A API processa a cobrança
5. Retorna autorização ou recusa`,
    request: `POST /api/v1/payment-links/{slug}/pay
{
  "method": "CREDIT_CARD",
  "cardToken": "token_criptografado_aqui",
  "lastDigits": "1111",
  "cardHolder": "JOAO SILVA",
  "installments": 3,
  "payerName": "João Silva",
  "payerTaxId": "12345678901"
}`,
    response: `{
  "success": true,
  "data": {
    "paymentId": "meu-link-abc123def",
    "method": "CREDIT_CARD",
    "authorizationCode": "123456",
    "lastDigits": "1111",
    "status": "PAID"
  }
}`,
    notes: `💳 Parcelamento de 1x (à vista) até 12x.
💳 A tokenização usa criptografia assimétrica (libsodium).
💳 O servidor nunca armazena dados brutos do cartão.
💳 Para tokenizar no frontend: use a biblioteca oficial MagicPay.`,
  },
  split: {
    desc: `Divida o valor do pagamento entre múltiplos recebedores automaticamente. Ideal para marketplaces e plataformas que precisam distribuir o dinheiro entre vendedores.

O split é especificado no momento da criação do pagamento e processado automaticamente pela MagicPay.`,
    request: `// Exemplo: R$ 100,00 divididos entre plataforma e vendedor
POST /api/v1/payment-links/{slug}/pay
{
  "method": "PIX",
  "splits": [
    { "amount": 7000, "percent": 70, "storeId": "merchant_123" },
    { "amount": 3000, "percent": 30, "storeId": "platform_456" }
  ]
}`,
    notes: `💰 O split é processado automaticamente pela MagicPay.
💰 Cada recebedor precisa estar cadastrado na plataforma.
💰 O percentual pode ser fixo (porcentagem) ou valor exato.
💰 O saldo de cada recebedor é atualizado individualmente no ledger.`,
  },
  withdrawals: {
    desc: `Solicite saques do saldo disponível para sua conta PIX.

Requisitos:
- Saldo disponível suficiente (saldo total - valor em compensação)
- Chave PIX cadastrada
- Valor mínimo de saque: R$ 10,00`,
    request: `POST /api/v1/wallet/withdrawals
Authorization: Bearer swp_sua_chave

{
  "amount": 5000,
  "pixKey": "joao@email.com",
  "pixKeyType": "EMAIL"
}`,
    response: `{
  "success": true,
  "data": { "id": "guid" }
}

// Tipos de chave PIX aceitos:
// CPF, CNPJ, EMAIL, PHONE, RANDOM_KEY`,
    notes: `🏦 Saques são processados em até 1 dia útil.
🏦 Taxa de saque: R$ 10,00 fixos.
🏦 A chave PIX deve ser a mesma cadastrada na sua conta.
🏦 O status do saque pode ser: Pending → Approved → Completed.
🏦 Se falhar, o valor retorna para o saldo disponível.`,
  },
  webhooks: {
    desc: `Configure URLs para receber notificações em tempo real quando eventos acontecerem na sua conta.

Eventos disponíveis:
- payment.completed — pagamento confirmado
- payment.failed — pagamento recusado
- payment.refunded — pagamento estornado
- cashout.completed — saque realizado
- cashout.failed — saque recusado

Para configurar, acesse Dashboard → Configurações → Webhooks.`,
    request: `// Payload enviado via POST para sua URL:
{
  "paymentId": "guid",
  "eventType": "payment.completed",
  "status": "PAID",
  "amount": 2990
}

// Headers:
X-Swiftpay-Signature: sha256=...
X-Swiftpay-Event: payment.completed
X-Swiftpay-Delivery: uuid
X-Swiftpay-Attempt: 1`,
    response: `// Validação da assinatura HMAC-SHA256:

// Node.js
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', SEU_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');
// Compare com X-Swiftpay-Signature

// Python
import hmac, hashlib, json
signature = hmac.new(
  SEU_SECRET.encode(),
  json.dumps(body).encode(),
  hashlib.sha256
).hexdigest()
// Compare com X-Swiftpay-Signature

// C#
using System.Security.Cryptography;
var key = Encoding.UTF8.GetBytes(seuSecret);
var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(json));
var signature = Convert.ToHexString(hash).ToLower();`,
    notes: `🔔 Sua URL deve responder com HTTP 200 para confirmar recebimento.
🔔 3 tentativas com backoff exponencial (2s, 4s, 8s).
🔔 Após 3 falhas, um alerta é gerado no dashboard.
🔔 A assinatura HMAC garante que o webhook é legítimo.
🔔 Sempre valide a assinatura antes de processar o webhook.`,
  },
  sdks: {
    desc: `Abaixo exemplos completos de integração em diferentes linguagens.`,
    request: `// cURL
curl -X POST https://api.swiftpay.com/api/v1/payment-links/{slug}/pay \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "PIX",
    "payerName": "João Silva",
    "payerTaxId": "12345678901"
  }'

// Node.js
const response = await fetch('https://api.swiftpay.com/api/v1/payment-links/{slug}/pay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'PIX',
    payerName: 'João Silva',
    payerTaxId: '12345678901'
  })
});
const data = await response.json();

// Python
import requests
response = requests.post(
  'https://api.swiftpay.com/api/v1/payment-links/{slug}/pay',
  json={'method': 'PIX', 'payerName': 'João Silva', 'payerTaxId': '12345678901'}
)
data = response.json()

// C#
using var client = new HttpClient();
var payload = new { method = "PIX", payerName = "João Silva", payerTaxId = "12345678901" };
var response = await client.PostAsJsonAsync(
  "https://api.swiftpay.com/api/v1/payment-links/{slug}/pay", payload);
var data = await response.Content.ReadFromJsonAsync<object>();`,
    notes: `📚 A API usa REST com JSON.
📚 Para ambientes de teste, use as chaves de sandbox.
📚 Consulte a documentação de cada endpoint para detalhes específicos.`,
  },
  errors: {
    desc: `A API segue o padrão REST de códigos HTTP para indicar o resultado da requisição.

Códigos:
• 200 — Sucesso
• 201 — Criado com sucesso
• 400 — Erro de validação (dados inválidos)
• 401 — Não autenticado (token ausente ou inválido)
• 403 — Sem permissão (token não tem escopo necessário)
• 404 — Recurso não encontrado
• 409 — Conflito (recurso já existe)
• 422 — Erro de negócio (saldo insuficiente, etc.)
• 429 — Muitas requisições (rate limit)
• 500 — Erro interno do servidor`,
    request: `// Exemplo de erro de validação (400):
{
  "success": false,
  "message": "Validation failed",
  "errors": ["amount: Amount must be greater than zero"]
}

// Exemplo de erro de negócio (422):
{
  "success": false,
  "message": "Insufficient balance"
}

// Exemplo de erro de autenticação (401):
{
  "success": false,
  "message": "Unauthorized"
}`,
    notes: `❌ Sempre verifique o campo "success" da resposta.
❌ Erros de validação listam cada campo com problema.
❌ Erros 5xx são raros — se persistirem, contate o suporte.
❌ Tokens expiram em 2 horas — use refresh token ou gere novo.`,
  },
  limits: {
    desc: `Para garantir a estabilidade da plataforma, aplicamos limites de requisição.

Limites por rota:
• GET /payment-links — 100 req/min
• POST /payment-links — 30 req/min
• POST /payment-links/{slug}/pay — 60 req/min
• GET /wallet/* — 60 req/min
• POST /wallet/* — 20 req/min
• Webhooks — 180 req/min

Os limites são por API Key e resetam a cada minuto.`,
    request: `// Headers de rate limit retornados:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1621867200

// Se o limite for excedido (429 Too Many Requests):
{
  "success": false,
  "message": "Too many requests. Try again in 30 seconds."
}`,
    notes: `⏱️ Use o header X-RateLimit-Remaining para monitorar seu consumo.
⏱️ Em caso de 429, aguarde o tempo indicado no header Retry-After.
⏱️ Para aumentar os limites, entre em contato com o suporte.`,
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

  return (
    <div className="flex gap-8 max-w-6xl">
      <nav className="w-48 shrink-0 space-y-0.5">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
              active === s.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}>
            {s.title}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-w-0 space-y-6">
        <h1 className="text-2xl font-bold">{sections.find(s => s.id === active)?.title}</h1>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.desc}</p>

        {section.request && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground text-xs font-mono">
              <span>Exemplo de requisição</span>
              <button onClick={() => copyCode(section.request!, `req-${active}`)} className="flex items-center gap-1 hover:opacity-70">
                {copiedId === `req-${active}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedId === `req-${active}` ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="p-4 text-sm font-mono text-foreground bg-muted overflow-x-auto whitespace-pre-wrap">{section.request}</pre>
          </div>
        )}

        {section.response && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground text-xs font-mono">
              <span>Exemplo de resposta</span>
              <button onClick={() => copyCode(section.response!, `res-${active}`)} className="flex items-center gap-1 hover:opacity-70">
                {copiedId === `res-${active}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedId === `res-${active}` ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="p-4 text-sm font-mono text-foreground bg-muted overflow-x-auto whitespace-pre-wrap">{section.response}</pre>
          </div>
        )}

        {section.notes && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm whitespace-pre-line text-card-foreground">{section.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
