# Swiftpay — Guia de Deploy Completo (Zero ao Producao)

## Pre-requisitos

| Item | Onde criar | Custo |
|------|-----------|-------|
| **Conta Vercel** | https://vercel.com/signup | Gratuito |
| **Conta Railway** | https://railway.app/login | Gratuito ($5 credito) |
| **Token MagicPay** | Ja temos | `geRBOFqMK7ZCrVmpqhUGuJjq8nqQzrSIrZVIJYVXRFE` |

---

## Passo 1: Criar contas

### 1.1 Vercel (Frontend)
1. Acesse https://vercel.com
2. Clique em "Sign Up" → "Continue with GitHub"
3. Autorize o acesso ao repositorio `matspectrum-ai/swiftpay`
4. Apos login, clique "Add New..." → "Project"
5. Selecione o repositorio `matspectrum-ai/swiftpay`
6. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `web/` (para admin) e `checkout/` (para checkout)
   - **Environment Variables:**
     ```
     NEXT_PUBLIC_API_URL = https://<gestao-url>.railway.app/api/v1
     ```
7. Clique "Deploy"

> **Nota:** Vercel detecta automaticamente que e Next.js. Nao precisa de CLI.

### 1.2 Railway (Backend)
1. Acesse https://railway.app/login
2. Clique "Login with GitHub"
3. Autorize o acesso
4. Clique "New Project" → "Deploy from GitHub repo"
5. Selecione `matspectrum-ai/swiftpay`

---

## Passo 2: Deploy do PostgreSQL (Railway)

No Railway:
1. Dentro do projeto, clique "New" → "Database" → "Add PostgreSQL"
2. Railway cria automaticamente o banco
3. Clique no banco → "Connect" → copie a **Connection String**
4. Ela sera algo como: `postgresql://swiftpay:senha@host:port/swiftpay`

---

## Passo 3: Deploy das APIs (.NET) no Railway

### 3.1 Gestao API

No Railway:
1. Clique "New" → "GitHub Repo"
2. Selecione `matspectrum-ai/swiftpay`
3. Configure:
   - **Root Directory:** deixe vazio (raiz do repo)
   - **Build Command:** `dotnet publish src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj -c Release -o /app`
   - **Start Command:** `dotnet /app/Swiftpay.Api.Gestao.dll`
   - **Port:** `5001`

4. **Environment Variables (obrigatorio):**
```
ASPNETCORE_URLS=http://+:5001
MagicPay__ApiKey=geRBOFqMK7ZCrVmpqhUGuJjq8nqQzrSIrZVIJYVXRFE
Jwt__Secret=<CRIAR_UMA_SECRET_FORTE>
ConnectionStrings__DefaultConnection=<URL_DO_POSTGRES>
Resend__ApiToken=<OPCIONAL>
```

### 3.2 Payment API

Mesmo processo, mas:
- **Start Command:** `dotnet /app/Swiftpay.Api.Payment.dll`
- **Port:** `5002`
- Nao precisa de ConnectionStrings separado (usa o mesmo PostgreSQL)

---

## Passo 4: Variaveis de Ambiente (detalhado)

### Gerar JWT Secret

```bash
# Linux/Mac - gere uma secret forte
openssl rand -base64 32
# Exemplo: 8xJ3kR9mZ2pL5vN7qW1tY4sA6dF8gH0j
```

### Lista completa de variaveis

| Variavel | Obrigatoria? | Valor exemplo |
|----------|-------------|---------------|
| `MagicPay__ApiKey` | ✅ Sim | `geRBOFqMK7ZCrVmpqhUGuJjq8nqQzrSIrZVIJYVXRFE` |
| `Jwt__Secret` | ✅ Sim | `8xJ3kR9mZ2pL5vN7qW1tY4sA6dF8gH0j` (32+ chars) |
| `Jwt__Issuer` | ❌ Opcional | `swiftpay` |
| `Jwt__Audience` | ❌ Opcional | `swiftpay` |
| `ConnectionStrings__DefaultConnection` | ✅ Sim | URL do Railway PostgreSQL |
| `ConnectionStrings__RabbitMQ` | ❌ Opcional | `rabbitmq://localhost` (sem RabbitMQ, funciona sem) |
| `Resend__ApiKey` | ❌ Opcional | Deixe vazio se nao for usar email |

**Onde colocar no Railway:**

Acesse o servico → "Variables" → adicione cada uma.

---

## Passo 5: Deploy do Frontend (Vercel)

### 5.1 Admin Dashboard

1. Acesse https://vercel.com
2. "Add New..." → "Project"
3. Importe `matspectrum-ai/swiftpay`
4. **Root Directory:** `web`
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL = https://gestao-api.railway.app
   ```
6. Clique "Deploy"

### 5.2 Checkout

1. "Add New..." → "Project"
2. Importe `matspectrum-ai/swiftpay`
3. **Root Directory:** `checkout`
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL = https://payment-api.railway.app
   ```
5. Clique "Deploy"

---

## Passo 6: Configurar Webhook da MagicPay

Apos o deploy, a Payment API tera uma URL publica como:
`https://payment-api.up.railway.app`

Configure o webhook na MagicPay para apontar para:
`https://payment-api.up.railway.app/api/v1/internal/magicpay/webhook`

No codigo, ao criar pagamentos, o `notificationUrl` ja e gerado automaticamente com base no `Request.Host`.

---

## Passo 7: Verificar se esta tudo funcionando

```bash
# Testar API Gestao
curl https://seu-app.railway.app/api/v1/auth/health

# Testar API Payment  
curl https://seu-payment.railway.app/api/v1/payment-links

# Testar Admin (navegador)
https://swiftpay-admin.vercel.app

# Testar Checkout (navegador)
https://swiftpay-checkout.vercel.app/test-slug
```

---

## Fluxo completo de teste em producao

```bash
# 1. Registrar admin
curl -X POST https://gestao-api.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Empresa","document":"12345678900123","name":"Admin","email":"admin@email.com","password":"Admin123"}'

# 2. Login
TOKEN=$(curl -s -X POST https://gestao-api.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@email.com","password":"Admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 3. Criar link de pagamento
curl -X POST https://payment-api.railway.app/api/v1/payment-links \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Produto","amount":2990}'

# 4. Acessar checkout
# https://swiftpay-checkout.vercel.app/{slug}
```

---

## Problemas comuns

| Problema | Solucao |
|----------|---------|
| **CORS** | Adicionar dominio Vercel no CORS do Program.cs |
| **Webhook nao chega** | Verificar se URL esta acessivel publicamente |
| **Banco de dados** | Rodar migrations automaticamente (ja configurado) |
| **JWT invalido** | Gerar nova secret com `openssl rand -base64 32` |
| **Rate Limit** | Ajustar no Program.cs se necessario |

---

## Resumo de custos

| Servico | Plano | Custo/mes |
|---------|-------|-----------|
| Vercel (Admin) | Free | $0 |
| Vercel (Checkout) | Free | $0 |
| Railway (Gestao API) | Free com $5 credito | $~2 |
| Railway (Payment API) | Free com $5 credito | $~2 |
| Railway (PostgreSQL) | Incluso | $0 |
| MagicPay | Taxas por transacao | So paga se vender |
| **Total** | | **~$4/mes** ($5 credito cobre) |
