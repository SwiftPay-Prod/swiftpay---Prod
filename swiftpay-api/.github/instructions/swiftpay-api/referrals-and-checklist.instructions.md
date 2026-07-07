---
description: "Use when editing referral program flows, commission rules, withdrawal requests, and final endpoint implementation checklist."
applyTo: 'Endpoints/Users/**/*.cs, Endpoints/Auth/**/*.cs, Endpoints/Admin/**/*.cs, Services/Internal/*Referral*.cs, Database/**/*Referral*.cs'
---

## Programa Indique e Ganhe (Fase Inicial)

Foi iniciada a base do programa de indicação no fluxo de autenticação:

### SignUp com código de indicação

- O endpoint `POST /v1/auth/signup` aceita `refCode` opcional no body
- O endpoint `POST /v1/auth/signup` exige `whatsApp` no formato internacional com DDI (ex.: `+5511999999999`)
- Quando `refCode` é informado e válido, o usuário criado fica vinculado ao indicador
- O vínculo de indicação ocorre **somente no signup**

### Campos no usuário

O `User` passou a suportar os campos:

- `ReferralCode` (código fixo e público do usuário para convite)
- `ReferredByUserId` (usuário que indicou)
- `ReferredAt` (data do vínculo)

### Notificação ao indicador

Quando um novo usuário se cadastra com `refCode` válido:

- O indicador recebe notificação **in-app** (`NotificationScope.User`)
- O indicador recebe também **push notification** (via fluxo do `NotificationService`)
- A mensagem informa nome e email do usuário indicado

### Regras desta fase

- `refCode` inválido retorna erro de validação no signup
- `refCode` de usuário não ativo não pode ser usado
- O código de indicação é gerado para novos usuários e não expira

### Configuração de regras de indicação

- Configuração global em `PlatformSettings`:
    - `ReferralDurationMonths` (duração da janela de indicação em meses)
    - `ReferralCommissionPercentage` (percentual em **basis points**; `1000 = 10%`)
- Override por usuário em `User`:
    - `ReferralDurationMonths` (nullable)
    - `ReferralCommissionPercentage` (nullable)
- Hierarquia efetiva para leitura no endpoint do usuário:
    - 1) valor do `User` (quando existir)
    - 2) fallback para `PlatformSettings`

### Endpoint do usuário indicador

- `GET /v1/users/referrals` retorna:
    - `referralCode`
    - `referralLink`
    - `referralDurationMonths`
    - `referralCommissionPercentage`
    - `eligibleProfitFromPayments` (soma de `PlatformFee - AcquirerFee` em pagamentos `Completed` elegíveis)
    - `eligibleProfitFromPayouts` (soma de `PlatformFee - AcquirerFee` em saques `Completed` elegíveis)
    - `estimatedCommissionFromPayments`
    - `estimatedCommissionFromPayouts`
    - `estimatedCommissionTotal`
    - `referredUsers` com `name`, `email`, `status`, `referredAt`, `estimatedCommissionFromPayments`, `estimatedCommissionFromPayouts` e `estimatedCommissionTotal`
- `GET /v1/users/referrals/referred-users/{referredUserId}/movements` retorna o histórico de movimentações de comissão por indicado, com resumo de lucro SwiftPay e comissões por origem (`Payment`/`Payout`)
- `referralCode` e `referralLink` podem vir vazios quando o usuário ainda não gerou link de indicação
- O endpoint `POST /v1/users/referrals/generate` gera o `ReferralCode` único e retorna o `referralLink` permanente
- O endpoint `POST /v1/users/referrals/payout-pix-key/request-update` envia código de verificação por email para alteração da chave PIX de recebimento
- O endpoint `PATCH /v1/users/referrals/payout-pix-key` exige `verificationId` + `code` + nova chave para confirmar a alteração da chave PIX
- O endpoint `POST /v1/users/referrals/withdrawal-requests` cria solicitação de saque de comissão (sem crédito automático em conta)
- O endpoint `PATCH /v1/users/referrals/withdrawal-requests/{requestId}/cancel` permite o usuário cancelar uma solicitação pendente e liberar o saldo novamente para novo saque
- O frontend deve exibir aviso de que contas indicadas `Inactive`/`Suspended` congelam ganhos até reativação

### Atribuição manual de indicação (Admin/God)

- O endpoint `POST /v1/admin/users/{userId}/assign-referrer` permite vincular manualmente um indicador para um usuário
- O endpoint `POST /v1/admin/users/{userId}/assign-referrer/preview` retorna uma prévia da comissão histórica estimada antes da confirmação da indicação
- Regras de validação:
    - Não permitir autoindicação (`userId == referrerUserId`)
    - O indicador deve estar `Active`
    - Usuário já indicado não pode ser usado como indicador de outro usuário
- Reatribuição de indicação (usuário já indicado):
    - É permitido trocar o indicador de um usuário já indicado
    - Quando `processHistoricalCommission = true`, o sistema deve **reverter** as movimentações compiladas do indicador anterior para o indicado e **recompilar** para o novo indicador
    - O preview deve funcionar mesmo para usuário já indicado
    - A janela histórica deve considerar `referredAt` até `min(referredAt + durationMonths, now)`
    - Valores inválidos de configuração (`ReferralDurationMonths <= 0` ou `ReferralCommissionPercentage <= 0`) devem usar fallback (`12` meses e `1000` bps)
- O payload aceita `processHistoricalCommission`:
    - `false`: registra indicação com `ReferredAt = now`
    - `true`: registra com `ReferredAt = CreatedAt` do indicado e recompila movimentações elegíveis (pagamentos/saques `Completed`) até o limite de duração da indicação

### Regras de saque da comissão de indicação (solicitação)

- A solicitação de saque de comissão depende de:
    - `ReferralCode` já gerado
    - `ReferralPayoutPixKeyType` e `ReferralPayoutPixKey` cadastrados
    - `AvailableCommissionBalance > 0`
- Existe cooldown entre solicitações:
    - Prioridade 1: `User.ReferralCommissionWithdrawalCooldownHours` (override por usuário)
    - Prioridade 2: `PlatformSettings.ReferralCommissionWithdrawalCooldownHours` (padrão da plataforma)
- Quando `ReferralCommissionWithdrawalIntervalValue = 0`, o cooldown deve ser desativado (saque liberado a qualquer hora, sem janela mínima).
- A próxima janela de solicitação considera a última solicitação de saque; quando não existir, usa `ReferralCodeCreatedAt` como baseline

### Saque de comissão - bloqueio por solicitações pendentes

- O saldo disponível para **nova solicitação** de saque de comissão deve considerar solicitações pendentes (`Status = Requested`)
- Cálculo de disponibilidade para nova solicitação:
    - `AvailableForRequest = EstimatedCommissionTotal - PaidCommissionTotal - RequestedPendingTotal`
- Regra prática:
    - Após solicitar saque, o mesmo valor fica bloqueado e não pode ser solicitado novamente até a análise/pagamento/cancelamento
    - Se novas comissões entrarem, apenas o saldo adicional pode ser solicitado

### Avaliação admin de solicitação de saque de comissão

- A tela administrativa de indicações é a origem oficial para marcar solicitações como pagas
- Endpoints de suporte:
    - `GET /v1/admin/referrals/withdrawal-requests/{requestId}`: detalha solicitação, chave PIX e saldo disponível
    - `POST /v1/admin/referrals/withdrawal-requests/{requestId}/evaluate`: endpoint único de avaliação (status `Reviewed` ou `Cancelled`), seguindo o padrão de avaliação de saques da plataforma
- O admin pode pagar valor igual, maior ou menor que o solicitado, desde que não ultrapasse o saldo disponível de comissão
- Observações de pagamento devem ser salvas para visibilidade do usuário no histórico de comissões
- O endpoint de avaliação deve aceitar apenas `receiptFileId` (opcional) para vincular comprovante já enviado
- O upload do comprovante deve ocorrer fora da avaliação, via fluxo padrão de upload de arquivos da plataforma

### Saque de comissão - cancelamento/rejeição e cooldown

- Quando a solicitação de saque de comissão é `Cancelled` (cancelada pelo usuário ou rejeitada pelo admin), o valor deve ser devolvido para `AvailableBalance` e removido de `TotalPendingWithdrawal`
- Solicitações `Cancelled` **não devem bloquear** a próxima janela de solicitação (cooldown)
- A rejeição administrativa exige motivo e deve gerar notificação **in-app + push** para o usuário

### Endpoint admin de indicações

- `GET /v1/admin/referrals` retorna visão consolidada para administração com:
    - `summary.totalReferredUsers`
    - `summary.totalReferrers`
    - `summary.totalEstimatedCommissionFromPayments`
    - `summary.totalEstimatedCommissionFromPayouts`
    - `summary.totalEstimatedCommission`
    - `referredUsers` paginado contendo indicado, indicador e comissões por usuário
- Filtros disponíveis: `referrerUserId`, `referredUserStatus`, `search`, `page`, `pageSize`
- `GET /v1/admin/referrals/withdrawal-requests` retorna solicitações de saque de comissão por indicador com filtros `status`, `search`, `page`, `pageSize`

### Comissão de indicação (relatório)

- Nesta fase, a comissão de indicação é **somente relatório** (sem crédito financeiro em conta/ledger)
- Base de lucro por operação: `PlatformFee - AcquirerFee`
- A comissão estimada é calculada em basis points sobre o lucro elegível
- Regra de arredondamento da comissão: **sempre para baixo** (`floor`), nunca para cima
- Regras de elegibilidade no cálculo:
    - Apenas indicados com `UserStatus = Active`
    - Apenas operações `Completed`
    - Janela de indicação: `ReferredAt` (ou `CreatedAt`) até `+ ReferralDurationMonths`

### Arquitetura de comissão de indicação (movimentações compiladas)

Para evitar processamento massivo em toda request, a comissão de indicação deve usar tabelas compiladas atualizadas por evento de confirmação.

**Tabelas de comissão:**

1. `ReferralCommissionMovements`
    - Ledger de movimentações de comissão por operação confirmada
    - Campos principais: `ReferrerUserId`, `ReferredUserId`, `SourceType` (`Payment`/`Payout`), `SourceId`, `SourceAmount`, `ReferralCommissionPercentage` (bps), `CommissionAmount`, `Environment`, `OccurredAt`
    - **Não armazenar** `PlatformFee` e `AcquirerFee` nesta tabela

2. `ReferralCommissionBalances`
    - Saldo compilado por indicador e ambiente
    - Campos principais: `ReferrerUserId`, `Environment`, `AvailableBalance`, `TotalGenerated`, `TotalPaid`, `TotalPendingWithdrawal`

3. `ReferralReferredUserSummaries`
    - Resumo compilado por par indicador→indicado e ambiente
    - Campos principais: `ReferrerUserId`, `ReferredUserId`, `Environment`, `TotalCommissionFromPayments`, `TotalCommissionFromPayouts`, `TotalCommissionAmount`, `LastMovementAt`

**Regras de processamento:**
- Atualizar essas tabelas apenas quando necessário (vinculação de indicação e confirmação de pagamento/saque)
- Não acoplar processamento de referral à criação de transação/saque
- Em consumers/jobs sem HTTP request: usar `IgnoreQueryFilters()` e filtrar `Environment` manualmente

### Endpoint público para signup por link

- `GET /v1/auth/referrals/{refCode}` resolve o código de indicação e retorna apenas:
    - `refCode`
    - `ownerName` (nome do usuário indicador)
- Deve ser usado na tela pública de cadastro para exibir o dono do código sem expor dados sensíveis

Para casos em que a adquirente não permite reenviar webhook e a transação/saque real ficou inconsistente (`Pending`, `Processing`, `Failed`, etc.), existem endpoints de recuperação acionados pelo painel admin:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1/admin/transactions/{transactionId}/dev/reprocess-completed` | POST | Reprocessa a transação via fluxo de webhook com `targetStatus` (`Completed` ou `Failed`) |
| `POST /v1/admin/cashouts/{cashoutId}/dev/reprocess-completed` | POST | Reprocessa o saque via fluxo de webhook com `targetStatus` (`Completed`, `Failed` ou `Rejected`) |
| `POST /v1/admin/logs/acquirer-webhooks/{webhookLogId}/dev/reprocess` | POST | Reprocessa, do lado SwiftPay, o payload bruto salvo no `AcquirerWebhookLogs` |

Regras:
- Somente usuários com role `God` podem executar os endpoints
- O backend deve reaproveitar o fluxo de webhook/processamento existente para garantir ledger/notificações/webhook

### Boleto - Vencimento obrigatório D+2

- Na criação de pagamento com método `Boleto`, a data de vencimento é obrigatória.
- O vencimento deve respeitar o mínimo de `D+2` (data atual + 2 dias).
- Não aplicar fallback automático de vencimento quando o campo não for informado.

### Onboarding de usuário pós-verificação de email

- O onboarding de usuário é um fluxo dedicado, separado do onboarding de organização (merchant).
- O fluxo ocorre após `EmailVerified = true` e antes do redirecionamento padrão para o painel principal.
- As respostas do onboarding devem ser persistidas diretamente em `User`:
    - `UserOnboardingCompleted`
    - `UserOnboardingCompletedAt`
    - `UserOnboardingDataJson` (payload com `discovery/channels/goals` e campos `other`)
- Endpoints do usuário:
    - `GET /v1/users/onboarding`
    - `PATCH /v1/users/onboarding`
- O endpoint `GET /v1/session` deve expor `userOnboardingCompleted` para o frontend aplicar o gate de navegação.
- O endpoint admin `GET /v1/admin/users/{userId}` deve incluir os dados de onboarding respondidos.

---

## Checklist para Novos Endpoints

- [ ] Criar pasta `Endpoints/[Grupo]/[NomeAcao]/`
- [ ] Criar `[NomeAcao]Models.cs` com Request, Validator e Response
- [ ] Criar `[NomeAcao]Endpoint.cs` com a lógica
- [ ] Usar `BaseResponse<T>` para response
- [ ] Validar token com `EndpointUtils.GetUserId(User)`
- [ ] Usar grupo apropriado (`MerchantGroup`, `AdminGroup`, etc.)
- [ ] Adicionar validações com FluentValidation
- [ ] Retornar códigos HTTP apropriados
- [ ] Testar no arquivo `.http` correspondente


