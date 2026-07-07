---
description: "Use when implementing payment link lifecycle, checkout rules, and transaction visualization behavior."
applyTo: 'Endpoints/**/PaymentLinks/**/*.cs, Endpoints/**/Checkouts/**/*.cs, Services/Internal/*PaymentLink*.cs, Services/Internal/*Checkout*.cs, Mappers/*Checkout*.cs'
---

## Payment Links - Fluxo com Criacao Tardia de Transacao

- No fluxo de `Payment Link`, a criacao do link nao deve criar `Payment` imediatamente.
- O merchant define `EnabledMethods` (ex.: `Pix`, `Boleto`) ao criar o link.
- A transacao deve ser criada apenas quando o pagador acessar o link publico, escolher o metodo e confirmar.
- A origem funcional da transacao criada por esse fluxo deve ser registrada como `requestSource = PaymentLink`.
- Consequencias de modelagem:
    - `PaymentLink.PaymentId` pode ser nulo antes do start.
    - Listagens/admin devem tolerar links sem `Payment` associado.
    - A URL publica do link continua estatica por `Token`.
- Governanca de dominio do link publico:
    - A base do link deve ser configurada e persistida em `PlatformSettings` no banco (via endpoint admin), nunca por env.
    - A resolucao da URL deve ser por metodo de pagamento efetivo (`Pix`, `Boleto`, `CreditCard`).
    - Configuracao principal de dominios da plataforma:
        - `PaymentLinkDomainOptionsJson` (lista de opcoes por metodo, com `id`, `name`, `baseUrl`, `isDefault` e `showSwiftPayBranding`)
    - Override por organizacao:
        - `MerchantSettings.PaymentLinkDomainSelectionJson` (seleciona o `id` da opcao por metodo)
    - Campos legados (`PixPaymentLinkBaseUrl`, `BoletoPaymentLinkBaseUrl`, `CreditCardPaymentLinkBaseUrl`) permanecem apenas como fallback de compatibilidade.
    - Sem dominio configurado para o metodo, manter fallback para URL por token (sem compor host via env).
    - `BoletoBaseUrl` em env foi descontinuado.

    ### Payment Link sem expiracao (status e remocao)

    - Quando `ExpiresAt = null`, o link e considerado permanente e reutilizavel.
    - O painel do merchant deve identificar esse caso com status de lifetime dedicado (`NeverExpires` / "Nao expira").
    - O status de lifetime do link nao deve ser confundido com o status da cobranca atual (`PaymentStatus`).
    - O merchant pode remover manualmente um link permanente quando desejar:
        - `DELETE /v1/merchant/{merchantId}/payment-links/{paymentLinkId}`
        - A remocao invalida o token para novos acessos no checkout.

### Link de visualizacao de transacao (merchant/admin)

- Endpoints de transacao do `swiftpay-api` devem expor `transactionVisualizationUrl` para uso direto no painel:
    - `GET /v1/merchant/{merchantId}/payments`
    - `GET /v1/merchant/{merchantId}/payments/{paymentId}`
    - `GET /v1/admin/transactions`
    - `GET /v1/admin/transactions/{transactionId}`
- A URL deve ser resolvida no backend via `PlatformLinkResolver.BuildTransactionVisualizationUrl(...)`, usando o dominio por metodo configurado na plataforma.
- A resolucao deve priorizar selecao da organizacao (`MerchantSettings.PaymentLinkDomainSelectionJson`) e fallback para default da plataforma (`PaymentLinkDomainOptionsJson`).
- O fluxo de visualizacao por `paymentId` e separado do fluxo de token do Payment Link.
- O `ProxyUrl` de boleto nao deve ser priorizado em payloads de leitura; quando necessario, expor apenas `PdfUrl` da adquirente.

### Payment Link ilimitado (sem expiração)

- Quando `expiresAt` não for informado, o link deve permanecer ilimitado/reutilizável.
- Link ilimitado não deve ser encerrado após a primeira cobrança concluída.
- O fluxo deve permitir múltiplas cobranças (PIX/BOLETO) no mesmo token ao longo do tempo.

---

## Checkout Config - Visual

- **`BackgroundColor` foi removido** do `CheckoutConfig`.
- **`ColorMode`** define se o checkout usa cor única ou gradiente:
    - `Single` → usa apenas `PrimaryColor`
    - `Gradient` → usa `PrimaryColor` + `SecondaryColor`
- Para limpar imagens (logo, background, favicon), envie string vazia no update.

## Checkout - Preço de Produto

- No checkout, o preço do item deve ser sempre derivado do produto/variante de origem.
- Não permitir definição de `CustomPrice` ao adicionar ou atualizar `CheckoutProduct`.
- A edição no checkout deve permitir apenas ordem, quantidade, limite e status do item.

## Checkout - Atualização Unificada (inclui produtos)

- O checkout deve ser atualizado por um único endpoint:
    - `PATCH /v1/merchant/{merchantId}/checkouts/{checkoutId}`
- O payload `UpdateCheckoutRequest` deve aceitar atualizações parciais e completas, incluindo operações de produtos.
- Operações de produto devem ser enviadas em `productOperations` com `operation`:
    - `add` (requer `productId`, opcional `variantId`, `displayOrder`, `isActive`)
    - `update` (requer `checkoutProductId`, opcional `displayOrder`, `isActive`)
    - `remove` (requer `checkoutProductId`)
- Não criar/manter endpoints separados para produto de checkout (`add/update/remove`) quando a operação puder ser tratada pelo update unificado.

## Checkout - Transferência de Sandbox para Produção

- Endpoint do merchant para promover configuração de checkout:
    - `POST /v1/merchant/{merchantId}/checkouts/{checkoutId}/transfer-to-production`
- Regras:
    - O checkout de origem deve estar em `Sandbox`.
    - A transferência cria um **novo** checkout em `Production` com `Status = Draft` e `OnboardingCompleted = false`.
    - A cópia leva template e configurações gerais (`CheckoutConfig`).
    - Produtos e cupons não são transferidos automaticamente entre ambientes e devem ser configurados no checkout de produção.

## Checkout - Ciclo de vida sem publicação

- O fluxo do checkout do merchant deve operar apenas com:
    - `Create`
    - `Edit`
    - `Delete`
- Após criar um checkout, ele deve iniciar em `Draft`.
- Em `Draft`, o checkout não deve expor `checkoutUrl` público nem ficar acessível no runtime público.
- O checkout só deve mudar para `Active` quando a configuração for concluída com os requisitos mínimos atendidos.
- Requisitos mínimos para ativação do checkout:
    - template definido
    - ao menos um método de pagamento ativo
- A cor primária do checkout deve ter fallback padrão backend (`#1886ed`) quando não for informada.
- Não deve existir fluxo operacional de `publish`/`unpublish` para o merchant.
- Toda edição deve exigir ação explícita de salvar no frontend antes de persistir no backend.

---



