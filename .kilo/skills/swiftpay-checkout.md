# Swiftpay Checkout Público

## Sub-skills
- **swiftpay-payment-processing** — payment creation flow
- **swiftpay-acquirer-integration** — acquirer-specific PIX/Boleto/Card
- **swiftpay-webhooks** — post-payment notifications

## Architecture
Página pública de checkout (não precisa de autenticação). Renderiza dinamicamente baseado no template configurado pelo merchant.

## Tech Stack
- Next.js 16 standalone (app separado do admin)
- Tailwind v4 (monocrom preto e branco)
- Server Components para páginas de produto
- Client Components para formulário de pagamento
- API calls diretas para `swiftpay-api-payment`

## Payment Methods
### PIX
- QR Code dinâmico (pixel ou base64)
- Cópia e cola do PIX
- Polling de status (a cada 5s) via API
- Redirecionamento após confirmação

### Boleto
- Linha digitável
- Código de barras
- PDF gerado
- Vencimento configurável (mínimo D+2)

### Cartão de Crédito
- Parcelamento (suporte a juros)
- 3DS (quando exigido pelo adquirente)
- Captura imediata

## Page Routes
```
/checkout/{slug}              ← Página pública do link de pagamento
/checkout/{slug}/pix          ← PIX QR Code
/checkout/{slug}/boleto       ← Boleto
/checkout/{slug}/card         ← Cartão
/checkout/{slug}/success      ← Pagamento confirmado
/checkout/{slug}/expired      ← Link expirado
```

## Template System
- Multi-template: merchants escolhem entre layouts pré-definidos
- Customização: logo, banner, cor primária (monocrom → tons de cinza)
- Domínio personalizado: merchant pode usar subdomínio próprio

## Data Flow
```
1. GET /checkout/{slug}
   → Busca PaymentLink + Merchant config
   → Renderiza template

2. User preenche dados + escolhe método
   → POST /v1/payment-links/{slug}/pay
   → Cria Payment + PaymentPix/Boleto/Card
   → Retorna URL do método específico

3. PIX: Redireciona para /checkout/{slug}/pix
   → Mostra QR Code
   → Polling GET /v1/transactions/{id}/status a cada 5s
   → Quando status = Completed → redirect /success

4. Webhook: Merchant recebe notificação
   → Pode liberar o produto/serviço
```

## Key Rules
- **No auth required**: Checkout é público
- **Lazy payment creation**: Payment só é criado quando o comprador inicia o checkout
- **Sandbox**: Links sandbox são identificados por badge visual e PIX simulado
- **Expiration**: Links expirados mostram página específica (nunca 404)
- **Multi-idioma**: Textos em Português (BR) por padrão
- **Tracking**: Suporte a Facebook Pixel, Google Ads, TikTok (opcional por merchant)
- **Monocrom**: Tema do checkout deve seguir identidade visual do merchant (apenas tons de cinza)
