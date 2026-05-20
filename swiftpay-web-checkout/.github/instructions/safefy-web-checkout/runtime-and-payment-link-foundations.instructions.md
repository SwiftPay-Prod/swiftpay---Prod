---
description: "Use when editing checkout runtime architecture, route resolution, payment link token flow, and session behavior for permanent links."
applyTo: 'app/[checkoutId]/page.tsx, app/sandbox/[checkoutId]/page.tsx, core/checkout/application/**/*.ts, core/checkout/runtime/**/*.ts, core/checkout/runtime/**/*.tsx'
---

# Safefy Web Checkout - Copilot Instructions

Este documento descreve a arquitetura de templates do checkout e as funcionalidades compartilhadas entre eles.

> **⚠️ IMPORTANTE PARA O COPILOT**: Sempre que um novo template for criado, **PERGUNTE QUAIS FUNCIONALIDADES O TEMPLATE VAI SUPORTAR** antes de iniciar a implementação.

---

## Visão Geral

O checkout da Safefy utiliza uma arquitetura baseada em **templates**. Cada template é uma implementação visual diferente do checkout, mas todos compartilham a mesma infraestrutura de dados, tipos, formatadores e funcionalidades opcionais.

### Runtime de Templates (Arquitetura Atual)

O projeto foi reestruturado para usar um runtime central em `core/checkout`:

- `core/checkout/application/load-checkout-page-data.ts`: carrega o checkout pela URL.
- `core/checkout/metadata/build-checkout-metadata.ts`: gera metadata SEO/OG/Twitter.
- `core/checkout/runtime/templates/types.ts`: contrato de template.
- `core/checkout/runtime/templates/registry.ts`: registro global de templates.
- `core/checkout/runtime/templates/resolve-checkout-template.ts`: resolve template por `checkout.template.code`.
- `core/checkout/runtime/render-checkout-runtime.tsx`: orquestra render + tracking.

As rotas `app/[checkoutId]/page.tsx` e `app/sandbox/[checkoutId]/page.tsx` nao devem conter logica de template. Elas apenas carregam dados e delegam ao runtime.

## Payment Link - Token e Template de Visualizacao

- O token de `Payment Link` deve ser gerado no backend com prefixo `pay_` (formato: `pay_{token}`).
- Na rota `app/[checkoutId]/page.tsx`, quando o parametro iniciar com `pay_`, deve renderizar o fluxo de `Payment Link` sem tentar resolver checkout antes.
- Na rota `app/[checkoutId]/page.tsx`, quando o parametro nao iniciar com `pay_`, validar se e um GUID valido.
- Apenas quando for GUID valido, o checkout deve tentar carregar dados de pagamento por `paymentId`.
- Se nao for GUID valido, o checkout nao deve tentar chamada de pagamento por id (evitar chamadas desnecessarias).
- O fluxo por `paymentId` deve ficar sempre habilitado na rota `app/[checkoutId]/page.tsx` quando `checkoutId` for um GUID valido.
- No fluxo carregado por `paymentId`, o template nao deve executar polling de status por token; o polling deve permanecer restrito ao fluxo por token/sessao.
- A tela de `Payment Link` deve usar um template dedicado de visualizacao em `templates/payment-link-view/`.
- Nao manter implementacao de `Payment Link` em `app/pay/*`, pois isso cria rota publica no Next.js.
- Quando a transacao iniciar com `Pix` ou `Boleto`, a tela deve exibir elementos escaneaveis:
  - `Pix`: QR Code visivel
  - `Boleto`: codigo de barras visivel para leitura por scanner

### Sessao do checkout para Payment Link permanente

- Para links sem expiracao (`ExpiresAt = null`), o fluxo de pagamento deve ser por sessao local do cliente.
- Ao gerar PIX/BOLETO, a sessao atual deve armazenar o `paymentId` e os dados exibidos.
- Abrir o mesmo token em outra aba/dispositivo deve iniciar do zero (sem exibir cobranca de outra sessao).
- O polling de status da sessao deve usar endpoint com `paymentId`:
  - `GET /v1/payment-links/{token}/payments/{paymentId}/status`

### Payment Link - Escopo da visualizacao

- O template de visualizacao de `Payment Link` deve focar em dados essenciais de cobranca e status.
- O escopo principal desta tela e exibir `Pix` e `Boleto` quando houver dados de pagamento disponiveis.

### Visualizacao de transacao por `paymentId`

- O template de visualizacao por `paymentId` deve suportar copia de codigo de pagamento e exibir dados de `Pix`/`Boleto` sem depender de redirecionamento para proxy de boleto.
- A tela deve permitir alternancia de paleta de cor local (botao de tema/cor), preservando a cor base configurada no link quando houver.

### Checkout de templates sem reserva de produto

- O template publico nao deve reservar estoque/produto antes do envio do pagamento.
- A criacao do pedido deve ocorrer apenas na confirmacao do checkout (acao de pagar).
- A validacao de estoque deve acontecer no backend no momento da criacao do pedido/pagamento:
  - Se o item tiver controle de estoque ativo, validar disponibilidade.
  - Em falta de estoque, retornar erro para exibicao no checkout.
---

## Estrutura do Projeto

```
safefy-web-checkout/
├── app/
│   ├── [checkoutId]/
│   │   └── page.tsx           # Carrega checkout e delega para runtime
│   ├── sandbox/[checkoutId]/
│   │   └── page.tsx           # Mesmo pipeline em sandbox
│   └── layout.tsx             # Layout global
├── core/
│   └── checkout/
│       ├── application/       # Orquestracao de carregamento
│       ├── metadata/          # SEO/OG centralizado
│       └── runtime/           # Contratos, registro e resolucao de templates
├── components/
│   ├── full-page-loader.tsx   # Loader com detecção de tema do sistema
│   ├── tracking/              # Sistema de tracking (GA, FB Pixel, etc.)
│   └── ...
├── shared/
│   └── masks/                 # Mascaras compartilhadas entre templates
├── parse/                     # Parse de enums para UI (COMPARTILHADO)
│   ├── index.ts               # Barrel export
│   ├── types.ts               # TParse interface
│   ├── payment-method.ts      # PaymentMethod parse
│   ├── payment-status.ts      # PaymentStatus parse
│   ├── product-type.ts        # ProductType parse
│   └── pix-key-type.ts        # PixKeyType parse
├── types/
│   ├── enums.ts               # Enums compartilhados entre templates
│   ├── checkout.ts            # Tipos de checkout, config, SEO/OG
│   └── tracking.ts            # Tipos de tracking
├── utils/
│   ├── index.ts               # Barrel export
│   └── formatters.ts          # Formatadores (currency, CPF, phone, etc.)
└── templates/
    └── hero-pro/              # Template Hero Pro
  ├── module.tsx         # Adaptador para o runtime de templates
        ├── index.tsx          # Componente principal
        ├── types.ts           # Re-exporta enums + tipos específicos
        ├── parse.tsx          # Estende parse compartilhado com ícones
        ├── constants.ts       # Constantes do template
        ├── components/        # Componentes específicos do template
        └── views/             # Views do template
```

---
