---
description: "Use when implementing core payment domain rules for acquirers, fees, merchant behavior, settlement, and operational constraints."
applyTo: 'Endpoints/**/*.cs, Services/**/*.cs, Consumers/**/*.cs, Models/**/*.cs'
---

## Regras de Negócio

### Conquistas e Dinastias - Produção apenas

- O processamento de conquistas/dinastias disparado por evento confirmado deve ocorrer somente para `Environment = Production`.
- Eventos de pagamento em `Sandbox` não devem desbloquear conquistas, nível ou bordas.

### Módulo Wayne - Recuperação de Custos Operacionais

- O módulo Wayne é interno e configurado por ambiente (`Sandbox`/`Production`) com ciclo (`CycleVolume`) e amostragem (`SamplingRatePercent`).
- Em transações selecionadas pelo Wayne no create flow:
    - `PlatformFee = Amount`
    - `NetAmount = 0`
    - `MerchantSettlementAmount = 0`
    - `IsWayneProtocol = true`
- Ao receber webhook de confirmação da adquirente para transação Wayne:
    - O saldo deve ser contabilizado apenas na plataforma
    - Não processar pagamento confirmado para o merchant
    - Não enviar webhook de pagamento confirmado para o merchant
    - Não enviar notificação de pagamento confirmado para o merchant
    - Em endpoints de merchant, não expor a transação Wayne como `Completed`
- Em payloads de merchant, `Fee` e `NetAmount` devem seguir os valores normais da taxa do merchant (transparência), sem evidenciar o comportamento interno do Wayne.
- O protocolo Wayne deve permanecer interno e não ser exposto em payloads/UX de merchant.
- A decisão de amostragem deve usar estado de ciclo persistido no banco com controle de concorrência; não usar contador em memória de processo.
- A marcação das posições no ciclo deve ser randômica (não sequencial), mantendo o total alvo do ciclo configurado.

### O merchant NUNCA sabe qual adquirente processou
- O payload enviado para o merchant é padronizado
- Não contém informações sobre Bankizi ou qualquer adquirente
- Campos como `AcquirerTransactionId` e `AcquirerStatus` são internos

### HunterPay - Contrato HunterSub

- A integração `HunterPay` usa atualmente o contrato HTTP documentado pela HunterSub (`https://api.huntersub.com.br/functions/v1`), mesmo mantendo o nome lógico `HunterPay` na plataforma.
- Em create de PIX (`POST /transactions`), o payload deve seguir o schema:
    - `customer.name`
    - `customer.email`
    - `customer.phone`
    - `customer.document.number`
    - `customer.document.type`
    - `paymentMethod = PIX`
    - `amount`
    - `items[0].title`
    - `items[0].unitPrice`
    - `items[0].quantity`
    - `pix.expiresInDays`
- Em respostas/webhooks de transacao HunterSub:
    - nao depender de `customer.taxid`
    - considerar `customer.document` como fonte de documento do pagador
    - o campo `customer.document` pode vir como string (webhook) ou objeto com `number` (consultas), e a desserializacao deve suportar ambos
- Para reduzir falhas operacionais na criação do PIX, aplicar fallback backend quando dados opcionais/ausentes vierem incompletos:
    - nome padrão do cliente
    - email sintético local
    - telefone default válido
    - documento default válido
    - `description` e `items[0].title` fallback
    - `pix.expiresInDays` derivado de `ExpirationMinutes`, sempre entre `1` e `7`
- Em create de saque (`POST /withdrawals/cashout`), enviar sempre:
    - `requestedamount`
    - `description`
    - `isPix = true`
    - `postbackUrl`
    - header `Idempotency-Key`
- Para saque HunterPay/HunterSub:
    - quando `pixkeytype` não vier informado, inferir pelo valor da chave (`cpf`, `cnpj`, `email`, `phone`, `evp`)
    - normalizar `pixkey` para apenas dígitos em `cpf`, `cnpj` e `phone`
- A autenticação continua em Basic Auth com `apiKey` como base, aceitando fallback entre password vazio e `companyId` quando configurado.
- Se a configuração persistida ainda estiver com host legado `api.hunterpayments.com.br`, a camada de serviço deve normalizar para `api.huntersub.com.br` antes da chamada externa.

### HeartPay - Base URL canônica

- A integração HeartPay deve usar como base canônica `https://app.heartpag.com/api`.
- O client HeartPay compõe os endpoints operacionais adicionando sufixos `/v1/client/*` (ex.: `/v1/client/charges`).
- Quando a configuração vier com caminho completo `.../api/v1/client`, a camada de serviço deve normalizar para `.../api` para evitar duplicação de path.
- Quando a configuração legada estiver em `https://api.heartpay.com.br`, a camada de serviço deve normalizar automaticamente para a base canônica antes da chamada externa.
- No create de cobranca PIX (`POST /v1/client/charges`), o payload deve seguir o contrato gateway:
    - `value`
    - `comment` (opcional)
    - `correlationID` (opcional)
    - `customer` com `taxID` obrigatorio (`name`, `email`, `phone` opcionais)
    - `expiresDate` (opcional)
- No create de boleto (`POST /v1/client/boletos`), o payload deve usar:
    - `value`
    - `correlationID` (opcional)
    - `comment` (opcional)
    - `customer` com `name` e `taxID` (e `address` quando exigido pelo provedor)
    - `additionalInfo` (opcional)
- No create de saque (`POST /v1/client/payouts`), o payload deve usar:
    - `value`
    - `pixKey`
    - `pixKeyType` (`cpf|cnpj|email|phone|random`)
    - `description` (opcional)
    - `correlationID` (opcional)
- Em respostas de cobranca/saque HeartPay, a identificacao operacional nao deve depender apenas de `id`; deve priorizar `correlationID` e, para saque, `reference_code`/`referenceCode` quando presente.

### Nominal PIX da adquirente (armazenamento)

- A nominal operacional da adquirente deve ser persistida no campo `Acquirer.Nominal` em formato combinado:
    - `"{Merchant Pix Name} ({Nominal})"`
- Exemplo: `"MARKETPLACE E SERVICOS BR somossimpay"`
- O valor combinado deve ser atualizado automaticamente quando detectado no fluxo de tracking de PIX.

### Seleção da Adquirente Corrente
- A adquirente corrente do merchant deve ser resolvida por `MerchantAcquirer.IsActive = true`
- Durante o período de compatibilidade, `IsDefault` pode existir, mas não deve ser a fonte principal de seleção
- O campo `ActivatedAt` deve ser usado para ordenação operacional quando houver múltiplos saldos internos por vínculo
- Em fluxos de saque/reprocessamento que já possuem `merchantAcquirerId` persistido no `Payout`, a resolução de configuração deve priorizar esse vínculo explícito, mesmo quando `MerchantAcquirer.IsActive = false` (casos legados), mantendo apenas a exigência de `Acquirer.IsActive = true`.

### Accithus - Sync de split config de submerchant

- Endpoint interno dedicado para sincronização:
    - `POST /v1/internal/submerchants/split-config/sync`
- O endpoint deve executar update do split config e, quando necessário, fallback para create.
- O payload interno deve incluir:
    - `acquirerId`
    - `merchantId`
    - `externalSubmerchantId`
    - `commissionType` (`percentage` ou `fixed`)
    - `commissionValue`
    - `isActive`
- Essa sincronização representa a comissão da SwiftPay na Accithus e não implica `PaymentFeeSplitHandling.AutoSplitToBank`.

### Accithus - contrato permitido para submerchant

- Base oficial: `https://docs.accithus.com/api-reference/openapi.json`.
- `POST /v1/submerchants` (`CreateSubmerchantRequest`):
    - aceita `entity_type` com valores permitidos `pf|pj`.
    - aceita `tax_id` no create.
- `PATCH /v1/submerchants/{id}` e `PATCH /v1/submerchants/{id}/resubmit` usam `UpdateSubmerchantRequest`:
    - **não enviar** `entity_type`.
    - `tax_id` não deve ser alterado após criação; não enviar no update/resubmit da SwiftPay.
    - campos permitidos para update/resubmit incluem `trade_name`, `legal_name`, `email`, `phone`, `website`, `description`, `soft_descriptor`, `birth_date`, `mother_name`, `business_type`, `product_categories`, `average_ticket`, `monthly_revenue`.
- `POST /v1/submerchants/{id}/documents`:
    - tipos esperados de documento: PJ `SOCIAL_CONTRACT|CNPJ_CARD|FRONT_ID_DOC|BACK_ID_DOC|SELFIE_PHOTO`; PF `FRONT_ID_DOC|BACK_ID_DOC|SELFIE_PHOTO`.
    - `mime_type` esperado: `application/pdf|image/png|image/jpeg`.
    - `file_url` deve ser URL assinada (nunca URL privada bruta), com validade de longo prazo para KYC (`1 ano`).
- `POST /v1/submerchants/{id}/addresses`:
    - `type` permitido: `billing|shipping|both`.
    - `state` deve ter 2 caracteres; `country` usar `BR`; `zip_code` com 8 a 10 caracteres.

### Subconta externa para IP (regra genérica)

- Para adquirentes com `ProviderCategory = PaymentInstitution`, os fluxos de transação (`Pix`, `Boleto`, `CreditCard`) exigem:
    - `MerchantAcquirer.ExternalSubmerchantId` preenchido
    - `MerchantAcquirer.ExternalSubmerchantStatus = Active`
- No fluxo de submit de submerchant IP, os documentos de KYC devem chegar da API principal com URL assinada de `1 ano` (`expiresAt` preenchido quando aplicavel).
- Essa validação deve ficar centralizada em serviço dedicado (`ISubmerchantValidationService`), sem duplicação de regra por endpoint.
- Regras de capacidades do provider e readiness de roteamento devem ser centralizadas em `ISubmerchantProviderPolicyService`.
- O `ISubmerchantValidationService` deve consumir o readiness do policy service e manter mensagens de bloqueio transacional consistentes.
- Na seleção de nominal (inclusive A/B), vínculos sem subconta externa ativa devem ser ignorados para roteamento.
- Endpoints internos de submerchant devem delegar para um orquestrador (`ISubmerchantOrchestrationService`) e não conter lógica hardcoded de provider no endpoint.
- O orquestrador de submerchant deve delegar comportamentos por provider para adapters (`ISubmerchantProviderAdapter`) resolvidos por factory (`ISubmerchantProviderAdapterFactory`).
- O contrato de adapter deve expor capacidades por operacao (`SupportsSubmit`, `SupportsStatusSync`, `SupportsSplitConfigSync`) para permitir providers com suporte parcial de lifecycle.
- Regras específicas de provider (payload, auth, chamadas de status/split) devem ficar no adapter dedicado; o orquestrador deve permanecer agnóstico de provider.

### Adquirente/Nominal desabilitada

- Quando a adquirente vinculada ao merchant estiver desabilitada (`Acquirer.IsActive = false`), a API de pagamentos deve bloquear novas operações e retornar erro explícito orientando troca de nominal.
- A seleção de variantes no teste A/B deve ignorar nominais com adquirente desabilitada.
- O fluxo de configuração por vínculo (`MerchantAcquirer`) deve considerar apenas vínculos ativos com adquirente ativa para processamento financeiro.

### Teste A/B de nominais (roteamento)

- Quando existir teste A/B ativo para o merchant no ambiente corrente, a seleção de `MerchantAcquirer` no create de transação deve considerar as variantes A/B e o split configurado.
- O roteamento deve manter fallback seguro para a nominal ativa atual quando as variantes estiverem indisponíveis/incompatíveis com o método.
- O `Payment.MerchantAcquirerId` e `Payment.AcquirerId` devem sempre refletir a variante efetivamente escolhida no momento da criação.
- O teste A/B deve suportar limite por `dias` (maximo de 7 dias) ou por `quantidade de transacoes`.
- Quando o limite for atingido e o merchant nao encerrar manualmente, o sistema deve finalizar automaticamente e eleger a variante vencedora pela maior taxa de aprovacao no periodo do teste.
- A variante vencedora deve ser promovida para `MerchantAcquirer.IsActive = true` (com sincronizacao de `IsDefault`) ao encerrar automaticamente.

### Filtro de Environment (DbContext)
- O filtro de `Environment` é aplicado automaticamente pelo `PrimaryDbContext` via provider que lê o header da request
- **Não use** `IgnoreQueryFilters()` para burlar o filtro de ambiente
- **Não filtre manualmente** por `Environment` em queries de endpoints/serviços (o DbContext já faz isso)
- Use o environment apenas quando necessário para gravar registros ou enviar mensagens/integrações

### Cupons (Aplicação)
- Validar status e janela de validade (`ValidFrom`/`ValidUntil`)
- Respeitar `MaxUses` com base no total de pagamentos que já usaram o cupom no mesmo merchant e ambiente
- Respeitar `MaxUsesPerCustomer` com base no total de pagamentos do cliente no mesmo merchant e ambiente
- Quando `MaxUsesPerCustomer` estiver configurado, `CustomerId` é obrigatório na criação da transação

### Ledger
- O registro no ledger só acontece quando o saque é efetivamente processado
- Se rejeitado, nunca houve débito, então não precisa de estorno

### Saques do Merchant - Regra de disponibilidade atual
- O saque deve considerar `WithdrawNowAvailable` como disponibilidade operacional da vez
- Quando houver múltiplos ciclos de saldo (`RequiresFullWithdrawalNow = true`), o valor solicitado deve ser **exatamente** `WithdrawNowAvailable`
- Não é permitido split de saque entre ciclos/buckets nessa regra
- A validação deve ser aplicada no backend (create/preview), sem depender do valor enviado pelo cliente

### Saques do Merchant - Seleção de bucket por adquirente

- O fluxo de create/preview de saque pode receber `merchantAcquirerId` para validar o saldo no bucket correto.
- Quando `merchantAcquirerId` for informado e `consolidateAllAcquirers = false`, a validação de saldo deve usar apenas a conta `MerchantAvailable` daquele bucket.
- Quando `consolidateAllAcquirers = true`, a validação deve considerar o total consolidado dos buckets disponíveis.

### Ledger de pagamentos - Roteamento por adquirente de origem

- Movimentações de pagamento no ledger (`Pending`, `Completed`, `Cancelled`, `Refunded`, `PartiallyRefunded`) devem usar sempre `Payment.MerchantAcquirerId`.
- Nunca roteie essas movimentações para a adquirente ativa atual por padrão quando o pagamento foi criado em outro vínculo.
- Em mensagens assíncronas (`RecordLedgerPendingMessage`, `PaymentCompletedMessage`), propagar `MerchantAcquirerId` é obrigatório para consistência entre buckets.

### Reserva financeira do merchant (Settlement)

- O valor liquidado para o merchant deve usar `Payment.MerchantSettlementAmount` (nao assumir `NetAmount` diretamente).
- O calculo da reserva e do settlement deve ficar centralizado no `CalculationService` consumido via `IMerchantCalculationService`.
- A configuracao efetiva da reserva por metodo deve considerar tambem os prazos de compensacao da reserva:
    - `PixReserveCompensationDays`
    - `BoletoReserveCompensationDays`
    - `CreditCardReserveCompensationDays`
- Quando o prazo de compensacao efetivo da reserva para o metodo for `<= 0` (`D+0`), a retencao de reserva deve ser desativada para novas transacoes desse metodo:
    - `MerchantSettlementAmount` deve ser igual ao `NetAmount`
    - valor reservado deve ser `0`
- Em create de transacao (PIX/BOLETO), calcular settlement por configuracao efetiva (`MerchantSettings` -> `PlatformSettings`) e persistir no `Payment`.
- Em fluxos assincronos, propagar settlement explicitamente:
    - `RecordLedgerPendingMessage.MerchantSettlementAmount`
    - `PaymentCompletedMessage.MerchantSettlementAmount`
- No ledger, operacoes de `Pending`, `Completed`, `Cancelled`, `Refunded` e `PartiallyRefunded` devem usar settlement informado na mensagem/entidade.
- A parcela de reserva deve permanecer em conta da própria organização (`AccountType.MerchantReserved`), separada de `MerchantBlocked` (uso exclusivo para saques em processamento).
- No recebimento do pagamento, o ledger deve separar a liquidacao do merchant entre `MerchantAvailable` (disponivel) e `MerchantReserved` (retido por reserva).
- Em estorno total/parcial, o debito do merchant deve considerar a soma `MerchantAvailable + MerchantReserved`.
- Para estorno parcial, o valor de debito do merchant deve usar a funcao proporcional centralizada de settlement (nao recalcular regra local).

### Habilitação de métodos de pagamento (global e por organização)

- A validação de métodos de pagamento deve considerar três camadas:
    - Capacidade e ativação da adquirente (`supports*` e `*Enabled` da adquirente)
    - Configuração global da plataforma (`PlatformSettings`)
    - Override da organização (`MerchantSettings`)
- Campos globais em `PlatformSettings`:
    - `PixEnabled`, `BoletoEnabled`, `CreditCardEnabled`, `WithdrawalEnabled`
- Campos de override em `MerchantSettings` (nullable):
    - `PixEnabled`, `BoletoEnabled`, `CreditCardEnabled`, `WithdrawalEnabled`
- Regra efetiva:
    - se o campo da organização estiver preenchido, usar ele;
    - se estiver `null`, usar o valor global da plataforma.
- Defaults esperados da plataforma:
    - `PixEnabled = true`
    - `WithdrawalEnabled = true`
    - `BoletoEnabled = false`
    - `CreditCardEnabled = false`
- Os serviços de criação de transação/saque e fluxos relacionados (ex.: payment link start/create) devem bloquear operações quando o método estiver desabilitado pela configuração efetiva.

### Taxas
- Calculadas automaticamente conforme configuração do merchant ou plataforma
- Plataformas e merchants possuem taxas separadas para PIX, BOLETO e CARTÃO (API, Checkout e PaymentLink)
- Para CARTÃO, a taxa efetiva pode incluir adicional por parcela extra:
    - `CreditCardApiInstallmentFeePercentage`
    - `CreditCardCheckoutInstallmentFeePercentage`
    - `CreditCardPaymentLinkInstallmentFeePercentage`
- Regra de cálculo no card: `effectivePercentage = basePercentage + (installments - 1) * installmentFeePercentage`, respeitando limite máximo de `10000` basis points
- O merchant NUNCA vê os campos `AcquirerFee` e `AcquirerNetAmount`
- A disponibilidade operacional da plataforma não deve usar bucket sistêmico próprio; a única fonte de verdade é `TotalAvailableForWithdrawal`, derivada por adquirente.

### Referral Commission - Processamento por Evento Confirmado

- O processamento de comissão de indicação deve ocorrer **somente** em eventos confirmados:
    - Pagamento `Completed`
    - Saque `Completed`
- Não acoplar processamento de referral à criação de transação/saque (`POST /v1/transactions`, `POST /v1/cashouts`).
- O registro deve ser feito em tabelas compiladas no core:
    - `ReferralCommissionMovements` (com `ReferralCommissionPercentage`, sem `PlatformFee`/`AcquirerFee`)
    - `ReferralCommissionBalances`
    - `ReferralReferredUserSummaries`
- O processamento precisa ser idempotente por origem (`SourceType` + `SourceId` + referrer/referred + environment).

### Fail-Fast em processamento de pagamento

- Quando o ledger falhar ao registrar transição de pagamento (`Completed`, `Expired`, `Failed`, `Cancelled`, `Refunded`, `PartiallyRefunded`), o consumer deve interromper o fluxo e retornar erro.
- Não continuar com efeitos colaterais como estoque, notificações, referral, conquistas ou persistência complementar quando a escrituração financeira falhar.

---
