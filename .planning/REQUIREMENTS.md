# Requirements — Rebranding Safefy → SwiftPay

## v1 Requirements

### Namespaces e Assembly (.NET)
- [ ] **REBRAND-01**: Renomear namespaces `safefy_api_core` → `swiftpay_api_core` em todo o código C#
- [ ] **REBRAND-02**: Renomear namespaces `safefy_api` → `swiftpay_api`
- [ ] **REBRAND-03**: Renomear namespaces `safefy_api_payment` → `swiftpay_api_payment`
- [ ] **REBRAND-04**: Atualizar `RootNamespace` e `AssemblyName` em `swiftpay-api.csproj`
- [ ] **REBRAND-05**: Atualizar `RootNamespace` e `AssemblyName` em `swiftpay-api-payment.csproj` (se existir)
- [ ] **REBRAND-06**: Atualizar `RootNamespace` e `AssemblyName` em `swiftpay-api-core.csproj`

### Arquivos e Diretórios
- [ ] **REBRAND-07**: Renomear `swiftpay-api/safefy-api.*.http` → `swiftpay-api/swiftpay-api.*.http`
- [ ] **REBRAND-08**: Renomear `swiftpay-api-payment/safefy-api-payment.http` → `swiftpay-api-payment/swiftpay-api-payment.http`
- [ ] **REBRAND-09**: Renomear `swiftpay-web/src/components/ui/safefy-brand-logo.tsx` → `swiftpay-brand-logo.tsx`
- [ ] **REBRAND-10**: Renomear `swiftpay-web/src/components/ui/safefy-toaster.tsx` → `swiftpay-toaster.tsx`
- [ ] **REBRAND-11**: Renomear `swiftpay-web-checkout/components/safefy-brand-logo.tsx` → `swiftpay-brand-logo.tsx`
- [ ] **REBRAND-12**: Remover/renomear diretórios `.github/instructions/safefy-*`

### Assets Visuais
- [ ] **REBRAND-13**: Substituir `swiftpay-web/public/logos/safefy-icon-logo.png`
- [ ] **REBRAND-14**: Substituir `swiftpay-web/public/logos/safefy-horizontal-dark.png`
- [ ] **REBRAND-15**: Substituir `swiftpay-web/public/logos/safefy-horizontal-light.png`
- [ ] **REBRAND-16**: Substituir `swiftpay-web-checkout/public/safefy-icon-logo.png`
- [ ] **REBRAND-17**: Substituir `swiftpay-web-checkout/public/safefy-horizontal-dark.png`
- [ ] **REBRAND-18**: Substituir `swiftpay-web-checkout/public/safefy-horizontal-light.png`

### Componentes React
- [ ] **REBRAND-19**: Atualizar imports e referências ao `safefy-brand-logo` no `swiftpay-web`
- [ ] **REBRAND-20**: Atualizar `safefy-toaster.tsx` para nova identidade
- [ ] **REBRAND-21**: Atualizar imports e referências ao `safefy-brand-logo` no `swiftpay-web-checkout`

### RabbitMQ (MassTransit)
- [ ] **REBRAND-22**: Renomear fila `safefy.ledger.pending` → `swiftpay.ledger.pending`
- [ ] **REBRAND-23**: Renomear fila `safefy.payment.completed` → `swiftpay.payment.completed`
- [ ] **REBRAND-24**: Renomear fila `safefy.notification.created` → `swiftpay.notification.created`
- [ ] **REBRAND-25**: Renomear fila `safefy.email.customer` → `swiftpay.email.customer`
- [ ] **REBRAND-26**: Renomear fila `safefy.digital.delivery` → `swiftpay.digital.delivery`
- [ ] **REBRAND-27**: Renomear fila `safefy.webhook.send` → `swiftpay.webhook.send`
- [ ] **REBRAND-28**: Renomear fila `safefy.dashboard.merchant` → `swiftpay.dashboard.merchant`
- [ ] **REBRAND-29**: Renomear fila `safefy.dashboard.admin` → `swiftpay.dashboard.admin`
- [ ] **REBRAND-30**: Renomear fila `safefy.dashboard.acquirer` → `swiftpay.dashboard.acquirer`
- [ ] **REBRAND-31**: Renomear fila `safefy.cashout.process` → `swiftpay.cashout.process`
- [ ] **REBRAND-32**: Renomear fila `safefy.cashout.webhook.send` → `swiftpay.cashout.webhook.send`

### Webhooks
- [ ] **REBRAND-33**: Atualizar header `X-Safefy-Signature` → `X-SwiftPay-Signature`
- [ ] **REBRAND-34**: Atualizar header `X-Safefy-Event` → `X-SwiftPay-Event`
- [ ] **REBRAND-35**: Atualizar header `X-Safefy-Delivery` → `X-SwiftPay-Delivery`
- [ ] **REBRAND-36**: Atualizar header `X-Safefy-Attempt` → `X-SwiftPay-Attempt`

### Variáveis de Ambiente
- [ ] **REBRAND-37**: Atualizar `SAFEFY_API_LOG_REQUEST_TIMING` → `SWIFTPAY_API_LOG_REQUEST_TIMING`
- [ ] **REBRAND-38**: Verificar outras env vars com prefixo `SAFEFY_`

### Testes
- [ ] **REBRAND-39**: Renomear `SafefyApiFactory.cs` → `SwiftPayApiFactory.cs`
- [ ] **REBRAND-40**: Atualizar referências à factory nos testes

### Documentação
- [ ] **REBRAND-41**: Atualizar `docs/architecture/payment-lifecycle.md` com novos nomes de filas
- [ ] **REBRAND-42**: Revisar README.md para consistência da marca

### Validação Final
- [ ] **REBRAND-43**: Build completo (`dotnet build` em todas as APIs)
- [ ] **REBRAND-44**: Build completo (`npm run build` nos frontends)
- [ ] **REBRAND-45**: Verificar se não restam referências a "safefy" (case insensitive)
- [ ] **REBRAND-46**: Renomear diretório pai `safefy-main` → `swiftpay-main`

## v2 (Deferred)

- Nenhum

## Out of Scope

- Alterações de lógica de negócio — apenas renomeação
- Migração de dados de produção
- Novo layout/UI (apenas substituição de marca)
- Alteração de funcionalidades existentes

## Traceability

| REQ-ID | Phase |
|--------|-------|
| REBRAND-01 to REBRAND-06 | Fase 1 |
| REBRAND-07 to REBRAND-12 | Fase 2 |
| REBRAND-13 to REBRAND-18 | Fase 3 |
| REBRAND-19 to REBRAND-21 | Fase 3 |
| REBRAND-22 to REBRAND-32 | Fase 4 |
| REBRAND-33 to REBRAND-36 | Fase 4 |
| REBRAND-37 to REBRAND-38 | Fase 5 |
| REBRAND-39 to REBRAND-40 | Fase 5 |
| REBRAND-41 to REBRAND-42 | Fase 5 |
| REBRAND-43 to REBRAND-46 | Fase 6 |
