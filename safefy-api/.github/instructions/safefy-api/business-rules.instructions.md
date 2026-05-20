---
description: "Use when implementing core business rules for platform operations, acquirer behavior, fees, cashouts, ranking, and merchant policies."
applyTo: 'Endpoints/Admin/**/*.cs, Endpoints/Merchants/**/*.cs, Services/Internal/**/*.cs, Services/Acquirers/**/*.cs, Consumers/**/*.cs, Filters/**/*.cs'
---

## Regras de Negócio Importantes

### Conquistas e Dinastias - Produção apenas

- O desbloqueio de conquistas (`Achievements`) e progressão de dinastias/níveis (`MerchantLevel`) deve considerar **apenas faturamento `Production`**.
- Faturamento `Sandbox` **não pode** desbloquear conquistas, nível, borda ou emblemas.
- Consumers/jobs que tentarem processar conquistas em `Sandbox` devem ignorar a operação de award.
- Endpoints de leitura de perfil/ranking/conquistas devem exibir progresso e contagem de conquistas com base em dados de `Production`.
- Os thresholds de progressão de nível/dinastia devem ter fonte única em `safefy-api-core/Constants/UserProgressionConstants.cs` (`UserProgressionConstants.LevelThresholds`), sem duplicação local em endpoints/serviços.

### Módulo Wayne - Recuperação de Custos Operacionais

- O módulo interno Wayne aplica amostragem cíclica por ambiente (`Sandbox`/`Production`) para retenção integral de taxa em parte das transações.
- Configuração interna por ambiente:
    - `CycleVolume` (X): tamanho do ciclo
    - `SamplingRatePercent` (Y): percentual de transações elegíveis no ciclo
    - `IsEnabled`
- Para transações selecionadas pelo ciclo Wayne:
    - `PlatformFee = Amount`
    - `NetAmount = 0`
    - Merchant recebe liquidação zero (`MerchantSettlementAmount = 0`)
    - Pagamento marcado com `IsWayneProtocol = true`
- Essas transações **não** devem ser processadas como pagamento confirmado para o merchant:
    - O saldo deve ser contabilizado apenas na plataforma
    - O merchant não deve receber sinalização de pagamento confirmado para essas transações
    - Em visões de merchant, a transação não deve ser apresentada como `Completed`
- O protocolo Wayne deve permanecer estritamente interno:
    - Não expor campos, flags ou nomenclaturas de Wayne em endpoints/payloads de merchant
    - Em payloads de merchant, `Fee` e `NetAmount` devem permanecer transparentes (iguais ao cálculo normal da transação), mesmo quando o Wayne estiver ativo
- A auditoria admin pode visualizar a transação normalmente e deve identificar o protocolo por metadado interno.
- O estado do ciclo deve ser persistido em banco com controle de concorrência (não usar contadores em memória de instância).
- A seleção dentro do ciclo deve ser randômica (não sequencial), preservando o alvo de amostragem configurado por ciclo.

### Módulo Wayne - Endpoints Admin Internos

- Endpoints internos de configuração (somente `God`):
    - `GET /v1/admin/internal/wayne-protocol`
    - `PATCH /v1/admin/internal/wayne-protocol`
- A configuração não deve ser exposta em endpoints de merchant.

### Saque Automático - Frequência Minutely (restrita)
- A frequência `Minutely` (a cada minuto) é uma opção privilegiada.
- Apenas usuários com role `God` podem configurar `AutomaticCashoutFrequency = Minutely`.
- Usuários sem role `God` devem receber `403 Forbidden` ao tentar persistir essa frequência.
- A validação deve ser aplicada em endpoints de update de configurações (merchant e admin platform).

### Saque Automático - Agendamento Hangfire
- O Hangfire dispara os jobs recorrentes de saque automático em `Cron.Minutely` (tick por minuto).
- A frequência efetiva por merchant/plataforma continua sendo aplicada no serviço (`Minutely`, `Hourly`, `Daily`, `Weekly`) via validação por último log de execução.
- Ao habilitar/configurar o saque automático, a primeira execução **não** deve ocorrer imediatamente no mesmo ciclo.
- No primeiro tick após habilitação, o serviço deve registrar tentativa `Skipped` indicando agendamento da primeira janela e só executar no próximo ciclo elegível.
- Endpoints de leitura de configuração devem expor `nextAutomaticCashoutAttemptAt` (merchant/plataforma) para a UI exibir a próxima tentativa programada.

### Saque Automático do Merchant - Configuração por Environment
- As configurações de saque automático do merchant devem ser independentes por ambiente (`Sandbox` e `Production`).
- Atualizar configuração no `Sandbox` não pode alterar o comportamento no `Production` (e vice-versa).
- Endpoints de leitura/update devem usar `IEnvironmentProvider.CurrentEnvironment` para resolver e persistir os campos corretos.

### Leitura de configurações do merchant (Admin)

- O endpoint `GET /v1/admin/merchant/{merchantId}/settings` deve retornar valores **efetivos** de configuração.
- Para cada campo nullable de `MerchantSettings`, aplicar fallback para `PlatformSettings` quando o override da organização estiver `null`.
- A resposta de leitura admin não deve expor `null` em campos de taxa/limites quando houver default válido da plataforma.

### Adquirente Invisível
- O merchant **NUNCA** pode saber qual adquirente está processando seus pagamentos
- A configuração da adquirente é feita exclusivamente pelo Admin
- Endpoints de merchant não expõem informações sobre a adquirente
- **Não enviar notificação in-app nem push** ao configurar nova adquirente para o merchant

### Provisionamento de processadoras (somente via Admin)

- O startup da API principal **não deve criar processadoras por seed padrão**.
- Novas processadoras devem ser criadas exclusivamente por fluxo administrativo (UI/API de Admin).
- O endpoint de criação deve funcionar sem depender de registro base previamente semeado no banco.
- Metadados padrão de adquirente (descrição, URLs base, links de documentação e `WebhookAuthMode`) devem ter fonte única em `safefy-api-core/Constants/AcquirerDefaultsConstants.cs`.
- O endpoint `POST /v1/admin/acquirers` deve consumir essa fonte única, sem hardcode local desses metadados.
- O `Acquirer.Code` gerado no `POST /v1/admin/acquirers` deve ser canônico e fixo por tipo (ex.: `rapdyn`, `heartpay`), sem sufixos automáticos (`_1`, `_2`, `_clone_*`).
- Quando o seed de adquirentes for executado (`AcquirerInitializer`), todas as processadoras devem ser criadas com `IsActive = false` por padrão.

### Configuração de contas de acesso da processadora

- A entidade `Acquirer` deve suportar uma lista de contas de acesso do painel/site da adquirente em `AccessAccounts` (JSON).
- Cada conta de acesso pode conter:
    - `Login`
    - `Password`
    - `Description`
- A lista deve permitir múltiplos registros por adquirente e ser editável no endpoint admin de update da processadora.
- Endpoints de leitura admin da processadora devem retornar essa lista para visualização no painel.

### HunterPay - Contrato HunterSub e Backfill de Configuração

- A adquirente lógica `HunterPay` usa atualmente o contrato/API da HunterSub, com base URL canônica:
    - `https://api.huntersub.com.br/functions/v1`
- O seed/admin deve considerar `companyId` como credencial opcional, além da `apiKey`.
- O suporte a saque da HunterPay deve permanecer habilitado (`SupportsWithdrawal = true`).
- O startup da API principal deve executar backfill da configuração da HunterPay para corrigir registros legados com:
    - host antigo `api.hunterpayments.com.br`
    - `SupportsWithdrawal = false`
    - links antigos de documentação
- Esse backfill deve acontecer em `PrimaryDbInitialize`, sem depender de intervenção manual do admin para registros já existentes.

### HeartPay - Base URL canônica e backfill

- A configuração padrão da HeartPay deve usar base canônica `https://app.heartpag.com/api`.
- O consumo operacional da integração HeartPay utiliza sufixos `/v1/client/*` para montagem de endpoint.
- O startup da API principal deve aplicar backfill da configuração HeartPay em `PrimaryDbInitialize` para alinhar registros legados ao novo contrato de base URL.
- O contrato gateway da HeartPay para pagamentos/saques deve seguir payloads com campos canônicos:
    - cobrança PIX: `value`, `comment`, `correlationID`, `customer.taxID`, `expiresDate`
    - boleto: `value`, `correlationID`, `comment`, `customer` (com `taxID`), `additionalInfo`
    - saque: `value`, `pixKey`, `pixKeyType`, `description`, `correlationID`
- A identificação retornada pela HeartPay deve priorizar `correlationID` e `reference_code` (saques), sem depender exclusivamente de `id` para persistência/consulta.

### Vínculo Ativo de Adquirente (MerchantAcquirer)
- O vínculo corrente da organização deve usar `MerchantAcquirer.IsActive = true` como fonte de verdade
- Deve existir apenas **1 vínculo ativo por merchant** (unicidade por `MerchantId` com filtro `IsActive = true`)
- O campo `ActivatedAt` registra quando o vínculo passou a valer operacionalmente
- `IsDefault` permanece apenas para compatibilidade temporária e deve ser mantido sincronizado com `IsActive` durante a transição
- A troca da adquirente ativa **não depende de saldo zerado** da organização (não bloquear por `MerchantAvailable > 0`)
- Ao trocar a adquirente ativa, contas legadas de merchant com `Account.MerchantAcquirerId = null` devem ser vinculadas ao vínculo ativo anterior para evitar saldo em limbo

### Adquirente desabilitada (impacto em vínculo e nominal)

- Quando `Acquirer.IsActive = false`, não deve ser possível vincular essa adquirente a uma organização.
- Na tela de configuração de nominais do merchant, nominais de adquirentes desabilitadas não devem ser listadas como opções.
- Se a organização estiver com uma nominal vinculada cuja adquirente foi desabilitada, as operações transacionais devem retornar erro explícito orientando a troca para outra nominal.

### Nominal da adquirente (admin)

- O campo `Acquirer.Nominal` deve armazenar o valor combinado de identificação PIX no formato:
    - `"{Merchant Pix Name} ({Nominal})"`
- Em telas administrativas que exibem informações da adquirente, a apresentação deve priorizar:
    - linha principal: `DisplayName`
    - linha secundária: `Nominal` (texto menor)

### Ocultação de nominal no autoatendimento do merchant

- A adquirente possui a flag `HideFromMerchantNominalSelection`.
- Quando `HideFromMerchantNominalSelection = true`, a nominal não deve aparecer em `GET /v1/merchant/{merchantId}/nominals`.
- A mesma regra deve bloquear seleção direta da nominal nos endpoints de autoatendimento do merchant, incluindo troca de nominal e configuração de teste A/B.
- A ocultação afeta apenas o autoatendimento da organização; não impede configuração administrativa interna.

### Troca de nominal pelo merchant (self-service)
- Endpoints do merchant para nominal:
    - `GET /v1/merchant/{merchantId}/nominals`
    - `PATCH /v1/merchant/{merchantId}/nominals/current`
    - `GET /v1/merchant/{merchantId}/nominals/history`
- O merchant só pode trocar para nominal compatível com seu `MerchantKyc.OperationType` (`Black`/`White`).
- Quando `PlatformSettings.SelfNominalSwitchEnabled = false`, o endpoint de troca (`PATCH /v1/merchant/{merchantId}/nominals/current`) deve bloquear a autoalteração com erro de autorização para o usuário da organização.
- A listagem de nominais deve incluir **todas** as nominais elegíveis por operação (`Black`/`White`), mesmo quando a organização nunca utilizou aquela nominal/adquirente antes.
- A listagem de nominais deve retornar suporte por método baseado na configuração da adquirente:
    - `supportsPix = SupportsPix && PixEnabled`
    - `supportsBoleto = SupportsBoleto && BoletoEnabled`
    - `supportsCreditCard = SupportsCreditCard && CreditCardEnabled`
- A listagem de nominais deve filtrar apenas adquirentes com taxa compatível com a taxa cobrada da organização, evitando prejuízo da plataforma:
    - Comparar por método (`Pix`, `Boleto` e `Withdrawal`) usando taxa efetiva da organização (fallback `MerchantSettings` -> `PlatformSettings`).
    - A taxa da adquirente (ou `MerchantAcquirer` já vinculado) deve ser menor ou igual à taxa da organização no componente fixo e percentual.
    - Para `Pix` e `Boleto`, validar compatibilidade tanto para `Api` quanto para `Checkout`.
- A resposta de listagem inclui `conversionYesterday` por nominal/adquirente para apoio de decisão.
- A resposta de listagem inclui também `conversionLast7Days` por nominal/adquirente.
- A resposta de listagem inclui também as métricas por merchant (`merchantConversionYesterday`, `merchantConversionLast7Days`) para comparação entre performance global da adquirente e performance da organização.
- Regra de recomendação no painel: quando `conversionYesterday < 20%`, a comparação de conversão deve usar `conversionLast7Days`.
- No painel do merchant, o badge `Novo` para nominal deve considerar ausência de dados de taxa de aprovação da nominal (global e merchant), e não apenas idade de criação.
- O histórico de nominais do merchant deve exibir as nominais já utilizadas com contagem de transações por nominal.
- A troca de nominal deve:
    - manter histórico em `MerchantAcquirerChangeHistory`
    - relinkar contas legadas (`MerchantAcquirerId = null`) para o vínculo ativo anterior
    - invalidar/processar cache de saldo de plataforma das adquirentes envolvidas

### Teste A/B de nominais (merchant)

- O merchant pode configurar teste A/B entre duas nominais da propria organizacao por ambiente.
- Endpoint de configuracao:
    - `PATCH /v1/merchant/{merchantId}/nominals/ab-test`
    - `GET /v1/merchant/{merchantId}/nominals/ab-test/history`
- Regras:
    - Apenas organizacao `Active` pode ativar/desativar teste A/B.
    - As duas variantes devem ser nominais diferentes e pertencer ao merchant.
    - O split atual e por percentual da variante A (`VariantAWeightPercent`, 0,01-99,99 com 2 casas decimais); variante B recebe `100 - A`.
    - Para iniciar o teste A/B, as nominais nao precisam estar com `MerchantAcquirer.IsActive = true`; elas apenas precisam pertencer ao merchant e ter adquirente ativa.
    - O teste deve ter limite de encerramento por `dias` ou por `quantidade de transacoes`.
    - Limite por dias deve aceitar no maximo `7` dias.
    - Ao encerrar manualmente, o merchant deve informar qual nominal permanecera ativa.
    - Ao encerrar automaticamente por limite, o sistema deve escolher a nominal vencedora pela maior taxa de aprovacao no periodo do teste.
    - Apenas um teste A/B ativo por `MerchantId + Environment`.
- O endpoint `GET /v1/merchant/{merchantId}/nominals` retorna o estado atual em `abTest` quando houver teste ativo.
- O endpoint `GET /v1/merchant/{merchantId}/nominals/ab-test/history` retorna historico de testes A/B com:
    - periodo (`startedAt`, `endedAt`), limite aplicado e motivo de encerramento
    - estatisticas por variante (total, aprovadas, taxa de aprovacao)
    - serie horaria para graficos comparativos de aprovacao e volume por variante

### Filtro de Environment (DbContext)
- O filtro de `Environment` é aplicado automaticamente pelo `PrimaryDbContext` via provider que lê o header da request
- **Não use** `IgnoreQueryFilters()` para burlar o filtro de ambiente
- **Não filtre manualmente** por `Environment` em queries de endpoints/serviços (o DbContext já faz isso)
- Use `environmentProvider.CurrentEnvironment` apenas quando precisar gravar novos registros ou enviar mensagens/telemetria

### Status do Merchant
- `Draft` - Rascunho, ainda preenchendo dados
- `PendingApproval` - Aguardando análise do Admin
- `Active` - Aprovado e operacional
- `Suspended` - Suspenso temporariamente
- `Rejected` - Reprovado na análise

### Ranking de usuários (merchant)
- O ranking deve incluir todos os usuários que possuem ao menos uma organização elegível:
    - `Merchant.Status = Active`
    - `Merchant.KycStatus = Approved`
    - `Merchant.DeletedAt = null`
- Usuários elegíveis sem movimentação no período devem permanecer no ranking com `Volume = 0`.
- Empates por volume devem compartilhar a mesma posição (`Position`).
- O período exibido deve representar o ciclo completo em horário de Brasília (não apenas até o horário atual):
    - `Weekly`: domingo 00:00 até sábado 23:59:59.999
    - `Monthly`: dia 1 00:00 até último dia do mês 23:59:59.999
    - `Annual`: 1º de janeiro 00:00 até 31 de dezembro 23:59:59.999
- O endpoint `GET /v1/users/ranking` deve retornar `status` (`Processing` ou `Completed`) para refletir o estado real da fila do ranking solicitado (`type` + `period` + `environment`).
- O `status` deve ser marcado como `Processing` no enqueue (scheduler Hangfire e trigger manual) e voltar para `Completed` no `finally` do consumer correspondente.
- O estado de processamento do ranking deve ser persistido em banco (`SystemInternalConfigs`) por chave de ranking + ambiente; não usar estado em memória local (singleton) para evitar inconsistência em múltiplas instâncias.

### Ranking de indicações (único)
- O ranking de indicações é um tipo separado do ranking de volume (`RankingType = Referral`).
- O ranking de usuários (volume) deve permanecer intacto em `UserRankingCache`.
- O ranking de indicações deve usar cache dedicado em `ReferralRankingCache`.
- Esse ranking é **único** (não segmentado por período funcional no frontend).
- Ordenação obrigatória:
    - 1) `TotalReferrals` (quantidade de indicados) em ordem decrescente
    - 2) `TotalCommission` (comissão total gerada) em ordem decrescente
    - 3) `UserId` ascendente para desempate determinístico
- O endpoint de leitura de ranking deve aceitar seleção de tipo e retornar, no modo indicação:
    - `totalReferrals`
    - `totalCommission`
- O processamento assíncrono do ranking de indicações deve ocorrer em fila dedicada (`safefy.ranking.referral.process`) e consumer próprio, sem reutilizar a mesma mensagem/fila do ranking de volume.

### Ranking de adquirentes (admin)

- Endpoint administrativo: `GET /v1/admin/ranking/acquirers`.
- O ranking deve ordenar adquirentes por maior `score` (0 a 1000) e usar desempate por `approvalRate` (desc), `analyzedTransactions` (desc) e `acquirerId` (asc).
- O ranking deve considerar janela amostral das **últimas 1000 transações por adquirente** no ambiente corrente (ordenadas por recência).
- Para adquirentes com menos de 1000 transações elegíveis, usar o máximo disponível.
- A janela amostral deve considerar as transações independentemente do status.
- As métricas do ranking devem usar a base da janela amostral:
    - `analyzedTransactions = total da amostra elegível (até 1000)`
    - `approvedTransactions = quantidade com status Completed na amostra`
    - `failedTransactions = quantidade com status Failed, Cancelled ou Expired na amostra`
    - `approvalRate = approvedTransactions / analyzedTransactions`
    - `failureRate = failedTransactions / analyzedTransactions`
    - `score` com pesos de 1 a 10 (quanto maior, maior impacto):
        - `approvalRate` peso `10`
        - `analyzedTransactions` (normalizado por 1000) peso `5`
        - `inverseFailureRate` (`1 - failureRate`) peso `5`
    - Fórmula do score: `score = round((((approvalRate/100)*10) + ((analyzedTransactions/1000)*5) + ((1 - failureRate/100)*5)) / 20 * 1000)`
- O filtro por operação deve aceitar seleção múltipla de `Black` e `White` via query `operationTypes` (CSV).
- O filtro de operação deve considerar `Acquirer.OperationTypes` (operações suportadas pela própria adquirente), e não `MerchantKyc.OperationType`.
- O processamento do ranking de adquirentes deve ocorrer em background por fila dedicada (`safefy.ranking.acquirer.process`) e atualizar o cache a cada `5` minutos, no mesmo padrão do ranking de usuários.
- O disparo recorrente dos rankings (`usuarios`, `indicações` e `adquirentes`) deve ser feito exclusivamente por job recorrente do Hangfire (fila `ranking`, cron de 5 minutos), sem uso de `BackgroundService` para agendamento.
- O payload do ranking de adquirentes deve incluir:
    - identificação da adquirente
    - `displayName`
    - `logoUrl`
    - `operationTypes`
    - métricas (`score`, `approvalRate`, `approvedTransactions`, `failedTransactions`, `analyzedTransactions`)
- O endpoint `GET /v1/admin/ranking/acquirers` deve retornar `status` (`Processing` ou `Completed`) para indicar o estado de processamento da fila de ranking de adquirentes no ambiente corrente.

### Credenciais de API
- Geradas pelo merchant após aprovação
- Ambientes: `Sandbox` (testes) e `Production` (produção)
- client_secret mostrado apenas uma vez na criação
- Podem ser regeneradas a qualquer momento
- **Revogação imediata**: Quando uma credencial é regenerada ou revogada, a credencial anterior para de funcionar instantaneamente

### Contas de Saque da Plataforma
- A plataforma pode ter várias contas cadastradas
- Existe apenas **1 conta padrão** (`IsActive = true`)
- **Não é permitido remover** a conta padrão
- Para trocar a padrão, use o endpoint `PATCH /v1/admin/platform-payout-accounts/{id}/set-default`
- Contas desativadas (`DeactivatedAt != null`) não podem virar padrão nem ser usadas em novos saques

### Saques da Plataforma - Bloqueio de Saldo
- O saldo disponível para saque deve considerar **saques em processamento** para evitar duplicidade
- O cálculo de disponibilidade **subtrai** a soma de `PlatformPayoutItem.Amount` com `Status = Processing`
- Isso vale para **preview** e **create** do saque da plataforma
- No `POST /v1/admin/platform-payouts/preview`, o campo `totalAvailableAmount` deve representar o total **realmente distribuível entre adquirentes** (soma de disponibilidade por adquirente), e não apenas um bucket contábil bruto.
- Em `preview` e `create` de saque da plataforma, cada item de distribuição deve ser validado antes do processamento:
    - `NetAmount` deve ser maior que `0` (não permitir saque com valor consumido pela taxa)
    - valor efetivo enviado para a adquirente (`CalculatePayoutAmountToSend`) deve respeitar `MinPayoutAmount` e `MaxPayoutAmount` da adquirente
    - na distribuição automática, adquirentes cujo item ficar inválido por taxa/limite (`net <= 0`, abaixo do mínimo ou acima do máximo) devem ser ignoradas e a alocação deve seguir para as demais adquirentes elegíveis
    - quando a distribuição automática não conseguir alocar todo o `TotalAmount` solicitado considerando disponibilidade e limites por adquirente, a operação deve seguir com distribuição parcial, descartando adquirentes inválidas e informando claramente o valor não alocado e o motivo

### Saldo por adquirente - Disponível para saque (Admin)

- O endpoint `GET /v1/admin/balance` deve expor, por adquirente, o campo `availableForWithdrawal`.
- `availableForWithdrawal` deve usar a mesma base de cálculo do preview de saque (`GetTotalAvailableForWithdrawalByAcquirerAsync`) para manter consistência com `POST /v1/admin/platform-payouts/preview`.
- A fonte de verdade do cálculo deve ficar centralizada no `CalculationService`, e não duplicada em endpoint.
- Nenhum consumer, endpoint, cache processor ou serviço auxiliar deve reimplementar manualmente fórmulas de saldo, lucro, composição por adquirente ou disponibilidade operacional da plataforma.
- Quando um fluxo precisar de saldos correntes por adquirente, deve consumir snapshots/composição expostos pelo `CalculationService`, em vez de recomputar joins e somas locais sobre `Accounts`.
- Fórmula oficial por adquirente: `(AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable`.
- O cálculo acima não deve subtrair `MerchantBlocked` nem aplicar regra adicional no endpoint administrativo; a composição deve sair pronta da camada de cálculo compartilhada.
- Em telas de admin, o valor de "Saldo Disponível" por adquirente deve usar `availableForWithdrawal` como fonte de verdade.

### Reserva financeira do merchant (Settlement)

- A plataforma suporta reserva financeira por metodo para o valor liquido do merchant:
    - `PixReservePercentage`
    - `BoletoReservePercentage`
    - `CreditCardReservePercentage`
    - `PixReserveCompensationDays`
    - `BoletoReserveCompensationDays`
    - `CreditCardReserveCompensationDays`
- Hierarquia de configuracao:
    - `MerchantSettings` (override por organizacao, nullable)
    - fallback para `PlatformSettings`.
- A formula de reserva e liquidacao deve ser centralizada no `CalculationService`:
    - `CalculateMerchantReserveAmount(netAmount, reservePercentageBasisPoints)`
    - `CalculateMerchantSettlementAmount(netAmount, reservePercentageBasisPoints)`
    - `CalculateRefundedMerchantSettlementAmount(merchantSettlementAmount, originalAmount, refundedAmount)`
- Quando o prazo de compensacao efetivo da reserva para o metodo for `<= 0` (`D+0`), a retencao de reserva deve ser desativada para novas transacoes desse metodo:
    - `MerchantSettlementAmount` deve ser igual ao `NetAmount`
    - valor reservado deve ser `0`
- O valor final para escrituração no merchant deve usar `Payment.MerchantSettlementAmount` como fonte de verdade.
- A parcela retida da reserva deve permanecer em conta da própria organização no ledger (`AccountType.MerchantReserved`), e nao no bucket de bloqueio de saque (`MerchantBlocked`).
- No pagamento confirmado, o ledger deve liquidar o valor do merchant em dois buckets:
    - `MerchantAvailable`: parcela disponivel para saque
    - `MerchantReserved`: parcela retida por reserva financeira
- Em estorno total/parcial, o debito do merchant deve considerar a soma `MerchantAvailable + MerchantReserved`, com proporcionalidade para estorno parcial.
- E proibido recalcular reserva/settlement em endpoints, consumers ou servicos auxiliares fora da camada de calculo compartilhada.
- O endpoint do merchant `GET /v1/merchant/{merchantId}/fees` deve retornar os percentuais efetivos de reserva por metodo (com fallback `MerchantSettings` -> `PlatformSettings`):
    - `pixReservePercentage`
    - `boletoReservePercentage`
    - `creditCardReservePercentage`
- O endpoint do merchant `GET /v1/merchant/{merchantId}/fees` deve retornar tambem os prazos efetivos de compensacao da reserva por metodo (com fallback `MerchantSettings` -> `PlatformSettings`):
    - `pixCompensationDays`
    - `boletoCompensationDays`
    - `creditCardCompensationDays`

### Saldo por adquirente - Organizações com disponível e bloqueado (Admin)

- O endpoint `GET /v1/admin/balance/acquirers/{acquirerId}/merchant-availability` deve retornar paginação das organizações que compõem os buckets `MerchantAvailable`, `MerchantBlocked` e `MerchantReserved` da adquirente no ambiente corrente.
- A listagem deve incluir `merchantId`, `merchantName`, `email`, `documentNumber`, `documentType`, `availableBalance`, `blockedBalance` e `reservedBalance`.
- O saldo por organização deve somar todas as contas `MerchantAvailable`, `MerchantBlocked` e `MerchantReserved` ligadas ao mesmo `AcquirerId`, inclusive quando a organização tiver mais de um `MerchantAcquirer` histórico nessa adquirente.

### Saques da Plataforma - Simulado
- Use o endpoint `POST /v1/admin/platform-payouts/simulated` para registrar saques feitos fora da plataforma
- O saque simulado **debita** o saldo disponível da adquirente (atualiza `AcquirerPayoutsOut`)
- O payout é criado com `Status = Completed` e aparece normalmente no painel

### Saques da Plataforma - Cancelamento
- Use o endpoint `PATCH /v1/admin/platform-payouts/{id}/cancel` para cancelar saques da plataforma em processamento
- O cancelamento pode ser executado por usuários com role `Admin` ou `God` (grupo `AdminGroup`)
- O cancelamento atua apenas nos itens com `Status = Processing`:
    - Reverte o bloqueio no ledger da plataforma para cada item ainda em processamento
    - Marca cada item como `Cancelled`
- Se o estorno no ledger falhar, o item deve retornar para `Processing` para evitar estado terminal inconsistente com o saldo bloqueado
- Status final do payout:
    - `Cancelled` quando nenhum item foi concluído
    - `PartiallyCompleted` quando parte dos itens já estava concluída

### Saques da Plataforma - Reprocessamento de Pendências
- Use o endpoint `PATCH /v1/admin/platform-payouts/{id}/reprocess-pending` para reenfileirar itens de adquirente que permaneceram em `Processing`
- O reprocessamento atua somente nos itens com `PlatformPayoutItem.Status = Processing`
- O endpoint pode ser executado por usuários com role `Admin` ou `God` (grupo `AdminGroup`)
- O reprocessamento não recria o saque, apenas republica o processamento dos itens pendentes na fila `safefy.platform.payout.item.process`
- O endpoint deve retornar sucesso parcial quando apenas parte dos itens for reenfileirada, com auditoria de falhas por item em `ApiLogs`

### Reconciliação de Saldos da Plataforma (Admin)

- O endpoint `POST /v1/admin/balance/reconcile` deve retornar reconciliação detalhada por adquirente com as dimensões:
    - `in` (entradas / settlement)
    - `out` (saídas / payouts out)
    - `grossBalance` (saldo bruto da adquirente)
    - `merchantBalance` (parcela do saldo pertencente às organizações)
    - `safefyProfit` (parcela do saldo pertencente à Safefy)
- Os campos legados `settlement` e `payoutsOut` devem permanecer no payload por compatibilidade retroativa, espelhando respectivamente `in` e `out`.
- A discrepância por adquirente (`hasDiscrepancy`) deve considerar todas as dimensões acima, e não apenas `settlement`/`payoutsOut`.
- Correções automáticas de reconciliação da plataforma/adquirente devem ser registradas como transações no ledger, nunca por sobrescrita direta de `Account.Balance`.
- Na reconciliação da plataforma, o cálculo de `TotalAvailableForWithdrawal` deve considerar **todas** as adquirentes do ambiente para representar o saldo remanescente real da plataforma (`(AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable` por adquirente, somado no total).
- Esse cálculo deve refletir automaticamente ajustes manuais da plataforma por adquirente (`AcquirerAdjustment` e `AcquirerSafefyProfitAdjustment`), pois a fonte de verdade é o saldo atual das contas no ledger.

### Contas sistêmicas da plataforma por Environment

- As contas sistêmicas reais da plataforma são apenas `PlatformBlocked` e `PlatformPayoutsOut`, sempre segregadas por `Environment`.
- `PlatformAvailable` deixou de existir como conta/bucket sistêmico.
- A única fonte de verdade para disponibilidade operacional da plataforma é `TotalAvailableForWithdrawal`, calculada por decomposição das adquirentes.
- Em `Production`, os IDs legados fixos podem continuar sendo reutilizados por compatibilidade.
- Em ambientes não produtivos, a resolução deve ocorrer por `AccountType + Environment` e a criação deve usar novos IDs, sem reaproveitar os IDs fixos de produção.

### Ajuste Manual de Saldos da Plataforma (Admin)

- O endpoint `POST /v1/admin/balance/adjustment` suporta ajustes com escopo:
    - `Acquirer`
    - `Merchant`
- `scope = Platform` não deve mais ser usado. Ajustes globais de disponibilidade da plataforma foram descontinuados.
- Para `scope = Acquirer`, o payload deve informar `acquirerTarget`:
    - `MerchantBalance` (ou `Settlement` por compatibilidade): ajusta o saldo global das organizações na adquirente via `AcquirerSettlement`
    - `SafefyProfit`: ajusta o lucro Safefy da adquirente e o `TotalAvailableForWithdrawal`; os cálculos de saldo/leitura devem refletir esse ajuste por adquirente
- Para `scope = Merchant`, o ajuste deve permitir `merchantAcquirerId` opcional para direcionar o bucket correto da organização.
- Na leitura de saldo por adquirente, o bucket de `SafefyProfit` deve ser calculado com piso zero após abatimento de saques da plataforma concluídos no ambiente (`max(0, safefyBase - platformPayoutsCompleted)`).
- Quando o total de saques da plataforma concluídos exceder o bucket Safefy de uma adquirente, o excedente deve impactar o bucket de organizações (`merchantBalance`) via decomposição por `grossBalance - safefyProfit`.

### Saques do Merchant - Regra de disponibilidade atual
- O saldo de saque deve usar `WithdrawNowAvailable` como valor disponível para a operação atual
- Quando `RequiresFullWithdrawalNow = true`, o merchant deve sacar **exatamente** `WithdrawNowAvailable` para liberar o próximo ciclo de saldo
- Nessa condição, **não** fazer split de saque entre ciclos/buckets
- O frontend deve exibir apenas "disponível para saque agora" (sem expor adquirente/legado)

### Saque em Sandbox (bloqueado)

- O ambiente `Sandbox` não permite criação de saque para merchant.
- O endpoint do `safefy-api` deve propagar o ambiente corrente para a `safefy-api-payment` na criação do saque.
- A API de pagamentos é a fonte final de validação e deve recusar qualquer tentativa de saque em `Sandbox` antes de criar `Payout`.

### Admin Cashouts - Campos financeiros na leitura

- Os endpoints administrativos de saque (`GET /v1/admin/cashouts` e `GET /v1/admin/cashouts/{cashoutId}`) devem incluir, além de `feeAmount` (taxa plataforma):
    - `acquirerFeeAmount` (taxa paga para a adquirente)
    - `safefyProfitAmount` (lucro Safefy no saque, calculado como `PlatformFee - AcquirerFee`)
- Esses campos são obrigatórios para a modal de detalhes no painel admin.

### Saques do Merchant - Conta de origem por bucket

- O painel pode informar `merchantAcquirerId` no create/preview de saque para selecionar explicitamente o bucket de saldo.
- Quando `merchantAcquirerId` estiver presente e `ConsolidateAllAcquirers = false`, a validação deve ocorrer na conta `MerchantAvailable` do bucket informado.
- Quando `ConsolidateAllAcquirers = true`, a validação deve considerar saldo consolidado entre buckets.

### Estoque ilimitado (produtos)
- Campo `IsUnlimitedDigitalStock` no `Product` define estoque ilimitado
- Quando `IsUnlimitedDigitalStock = true`, o backend ignora `StockQuantity` do produto
- Quando `IsUnlimitedDigitalStock = true`, não é permitido definir `StockQuantity` em variantes (create/update)
- Quando `IsUnlimitedDigitalStock = true`, é permitido apenas **1 item digital por variante**
- Quando `IsUnlimitedDigitalStock = false`, estoque volta a obedecer `StockQuantity` do produto/variantes

### Validação de Credenciais em Tempo Real (safefy-api-payment)

O `CredentialValidationMiddleware` valida a cada requisição autenticada se a credencial ainda está ativa:

**Funcionamento:**
1. Após o usuário obter um token JWT via `/v1/auth/token`, cada requisição subsequente passa pelo middleware
2. O middleware extrai o `credential_id` e `secret_version` do token JWT
3. Verifica no banco se a credencial ainda está `Active`, se o merchant está `Active` e se a versão do secret é a mesma
4. Se a credencial foi revogada/inativa, merchant desativado ou credencial regenerada, retorna `401 Unauthorized`

**Campo `SecretVersion`:**
- Cada credencial tem um campo `SecretVersion` (int) que começa em 1
- Quando a credencial é regenerada (novo ClientId/ClientSecret), o `SecretVersion` é incrementado
- O token JWT contém a claim `secret_version` com o valor no momento da geração
- O middleware compara a versão do token com a versão atual da credencial
- Se diferente, o token foi gerado antes da regeneração e é inválido

**Códigos de Erro:**
| Código | Mensagem |
|--------|----------|
| `credential_not_found` | Credencial não encontrada |
| `credential_inactive` | Credencial inativa, revogada ou regenerada |
| `merchant_inactive` | Conta do merchant inativa |

**Paths excluídos da validação:**
- `/v1/auth/token` - Endpoint de autenticação
- `/v1/internal/*` - Webhooks de adquirentes (autenticação própria)
- `/health` - Health check
- `/docs` - Documentação

### Rate Limiting (API de Pagamentos)

**Rate Limiting de Requisições (por Merchant):**
- Configurado **exclusivamente pelo Admin** para cada merchant
- O merchant **NÃO** pode alterar seus próprios limites
- Limites padrão:
  - `RateLimitPerMinute`: 60 requisições/minuto
  - `RateLimitPerHour`: 1.000 requisições/hora
  - `RateLimitPerDay`: 10.000 requisições/dia
- Aplicado na **safefy-api-payment** nos endpoints de criação de cobrança
- Retorna HTTP 429 (Too Many Requests) quando excedido

**Rate Limiting de Autenticação (por Credencial):**
- Limite fixo de **10 tokens por hora** por credencial
- Evita que o merchant fique gerando tokens desnecessariamente
- O token JWT tem validade configurável (padrão: 1 hora)
- Quando excedido, retorna HTTP 429 com headers:
  - `Retry-After`: segundos até poder tentar novamente
  - `X-RateLimit-Limit`: limite máximo (10)
  - `X-RateLimit-Remaining`: 0
- Código de erro: `auth_rate_limit_exceeded`
- Mensagem: "Limite de geração de tokens excedido (10/hora). Aguarde X minutos."

### Arquitetura de Taxas (Fees)

### Habilitação de métodos de pagamento (global e por organização)

- A plataforma deve controlar habilitação de métodos de pagamento em dois níveis:
    - `PlatformSettings` (global)
    - `MerchantSettings` (override por organização)
- Campos globais em `PlatformSettings`:
    - `PixEnabled`
    - `BoletoEnabled`
    - `CreditCardEnabled`
    - `WithdrawalEnabled`
- Campos de override em `MerchantSettings` (nullable):
    - `PixEnabled`
    - `BoletoEnabled`
    - `CreditCardEnabled`
    - `WithdrawalEnabled`
- Regra de resolução efetiva:
    - Quando o campo da organização estiver preenchido, ele prevalece.
    - Quando estiver `null`, usar o valor global da plataforma.
    - Além disso, o método ainda depende da capacidade/ativação da adquirente (suporte + enabled da adquirente).
- Defaults obrigatórios da plataforma:
    - `PixEnabled = true`
    - `WithdrawalEnabled = true`
    - `BoletoEnabled = false`
    - `CreditCardEnabled = false`
- O suporte a `Estorno` da adquirente não deve mais ser tratado como toggle configurável no fluxo administrativo de update.

### Compensação em dias por processadora

- A configuração administrativa da processadora deve permitir definir compensação por método habilitado:
    - `PixHasCompensation` + `PixCompensationDays`
    - `BoletoHasCompensation` + `BoletoCompensationDays`
    - `CreditCardHasCompensation` + `CreditCardCompensationDays`
- Quando o toggle de compensação estiver desabilitado, o prazo correspondente deve permanecer `0`.
- Quando o toggle estiver habilitado, o prazo mínimo válido é `1` dia.
- A tela de detalhes/configuração deve exibir seções separadas por método (`Pix`, `Boleto`, `Cartão`) apenas quando aquele método estiver habilitado na processadora.

A plataforma possui um sistema hierárquico de configuração de taxas com fallback automático:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE CONFIGURAÇÃO DE TAXAS                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NÍVEL 1: MerchantSettings (taxa cobrada DO merchant pela Safefy)            │
│  ┌─────────────────────────────────────────────────────────────────┐         │
│  │  Se configurado, usa valores específicos do merchant            │         │
│  │  → PixApiFeeMode, PixApiFeeFixed, PixApiFeePercentage          │         │
│  │  → PixCheckoutFeeMode, PixCheckoutFeeFixed, PixCheckoutFeePercentage│     │
│  │  → PixPaymentLinkFeeMode, PixPaymentLinkFeeFixed, PixPaymentLinkFeePercentage│
│  │  → BoletoApiFeeMode, BoletoApiFeeFixed, BoletoApiFeePercentage  │         │
│  │  → BoletoCheckoutFeeMode, BoletoCheckoutFeeFixed, BoletoCheckoutFeePercentage│
│  │  → BoletoPaymentLinkFeeMode, BoletoPaymentLinkFeeFixed, BoletoPaymentLinkFeePercentage│
│  │  → WithdrawalFeeMode, WithdrawalFeeFixed, WithdrawalFeePercentage│        │
│  └────────────────────────────────┬────────────────────────────────┘         │
│                                   │ fallback (se null)                       │
│                                   ▼                                          │
│  NÍVEL 2: PlatformSettings (padrão da plataforma)                            │
│  ┌─────────────────────────────────────────────────────────────────┐         │
│  │  Valores padrão para todos os merchants                         │         │
│  │  → PixApiFeeMode, PixApiFeeFixed, PixApiFeePercentage          │         │
│  │  → PixCheckoutFeeMode, PixCheckoutFeeFixed, PixCheckoutFeePercentage│     │
│  │  → PixPaymentLinkFeeMode, PixPaymentLinkFeeFixed, PixPaymentLinkFeePercentage│
│  │  → BoletoApiFeeMode, BoletoApiFeeFixed, BoletoApiFeePercentage  │         │
│  │  → BoletoCheckoutFeeMode, BoletoCheckoutFeeFixed, BoletoCheckoutFeePercentage│
│  │  → BoletoPaymentLinkFeeMode, BoletoPaymentLinkFeeFixed, BoletoPaymentLinkFeePercentage│
│  │  → WithdrawalFeeMode, WithdrawalFeeFixed, WithdrawalFeePercentage│        │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  SEPARADO: Acquirer (taxa cobrada PELA adquirente da Safefy)                 │
│  ┌─────────────────────────────────────────────────────────────────┐         │
│  │  Custo operacional da plataforma (invisível para merchant)      │         │
│  │  → PixInFeeMode, PixInFeeFixed, PixInFeePercentage             │         │
│  │  → BoletoInFeeMode, BoletoInFeeFixed, BoletoInFeePercentage     │         │
│  │  → PayoutFeeMode, PayoutFeeFixed, PayoutFeePercentage          │         │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Taxas da Plataforma (cobradas DO merchant):**

| Campo | Descrição |
|-------|-----------|
| `PixApiFeeMode/Fixed/Percentage` | Taxa cobrada em PIX via API |
| `PixCheckoutFeeMode/Fixed/Percentage` | Taxa cobrada em PIX via Checkout |
| `PixPaymentLinkFeeMode/Fixed/Percentage` | Taxa cobrada em PIX via Payment Link |
| `BoletoApiFeeMode/Fixed/Percentage` | Taxa cobrada em BOLETO via API |
| `BoletoCheckoutFeeMode/Fixed/Percentage` | Taxa cobrada em BOLETO via Checkout |
| `BoletoPaymentLinkFeeMode/Fixed/Percentage` | Taxa cobrada em BOLETO via Payment Link |
| `CreditCardApiFeeMode/Fixed/Percentage` | Taxa cobrada em CARTÃO via API |
| `CreditCardCheckoutFeeMode/Fixed/Percentage` | Taxa cobrada em CARTÃO via Checkout |
| `CreditCardPaymentLinkFeeMode/Fixed/Percentage` | Taxa cobrada em CARTÃO via Payment Link |
| `CreditCardApiInstallmentFeePercentage` | Taxa percentual adicional por parcela extra no CARTÃO via API |
| `CreditCardCheckoutInstallmentFeePercentage` | Taxa percentual adicional por parcela extra no CARTÃO via Checkout |
| `CreditCardPaymentLinkInstallmentFeePercentage` | Taxa percentual adicional por parcela extra no CARTÃO via Payment Link |
| `WithdrawalFeeMode/Fixed/Percentage` | Taxa cobrada em saques |

**Taxas das Adquirentes (cobradas DA Safefy):**

| Campo | Descrição |
|-------|-----------|
| `PixInFeeMode/Fixed/Percentage` | Taxa cobrada pela adquirente em PIX recebido |
| `BoletoInFeeMode/Fixed/Percentage` | Taxa cobrada pela adquirente em BOLETO recebido |
| `CreditCardInFeeMode/Fixed/Percentage` | Taxa cobrada pela adquirente em CARTÃO recebido |
| `PayoutFeeMode/Fixed/Percentage` | Taxa cobrada pela adquirente em saques |

**Comportamento de Taxa em Saques (`PayoutFeeHandling`):**

Cada adquirente pode ter um comportamento diferente ao cobrar a taxa de saque:

| Modo | Descrição |
|------|-----------|
| `FeeDeductedFromTransfer` | Adquirente **desconta** a taxa **do valor** que envia ao merchant |
| `FeeAddedToDebit` | Adquirente **adiciona** a taxa **ao débito** da conta da plataforma |

**Cálculo do valor a enviar para a adquirente:**

Use `FeeCalculator.CalculatePayoutAmountToSend(netAmount, acquirerFee, payoutFeeHandling)`:

| Modo | Valor Enviado | Débito na Conta | Merchant Recebe |
|------|---------------|-----------------|-----------------|
| `FeeDeductedFromTransfer` | `NetAmount + AcquirerFee` | `NetAmount + AcquirerFee` | `NetAmount` |
| `FeeAddedToDebit` | `NetAmount` | `NetAmount + AcquirerFee` | `NetAmount` |

**Exemplo prático (saque de R$ 500, PlatformFee R$ 5, AcquirerFee R$ 1):**

```
Valores:
- Amount (solicitado pelo merchant): R$ 500,00
- PlatformFee (taxa Safefy visível): R$ 5,00
- AcquirerFee (taxa da adquirente): R$ 1,00
- NetAmount = Amount - PlatformFee = R$ 495,00

FeeDeductedFromTransfer:
- Safefy envia: R$ 496,00 (NetAmount + AcquirerFee)
- Adquirente desconta: R$ 1,00
- Merchant recebe: R$ 495,00 ✓

FeeAddedToDebit:
- Safefy envia: R$ 495,00 (NetAmount)
- Adquirente debita da conta: R$ 496,00 (NetAmount + AcquirerFee)
- Merchant recebe: R$ 495,00 ✓
```

**Split Automático de Taxas (`PaymentFeeSplitHandling`):**

Algumas adquirentes enviam automaticamente a taxa da plataforma (PlatformFee) diretamente para o banco da Safefy, ao invés de creditar tudo na conta da adquirente.

| Modo | Descrição |
|------|-----------|
| `None` | Comportamento padrão - taxa creditada como saldo disponível da plataforma |
| `AutoSplitToBank` | Adquirente já envia a taxa direto para o banco da Safefy |

**Campos por método de pagamento:**
- `PixFeeSplitHandling` - Configuração para PIX
- `BoletoFeeSplitHandling` - Configuração para Boleto
- `CreditCardFeeSplitHandling` - Configuração para Cartão de Crédito

**Comportamento no Ledger:**

Quando `AutoSplitToBank` está ativo:
- A PlatformFee **NÃO** permanece em um bucket sistêmico de disponibilidade da plataforma
- Em vez disso, é creditada em `PlatformPayoutsOut` + `AcquirerPayoutsOut`
- Isso reflete que o dinheiro já foi "sacado" automaticamente pela adquirente

```
Exemplo: Pagamento de R$ 100,00, PlatformFee R$ 2,00, AcquirerFee R$ 0,50

PaymentFeeSplitHandling.None (padrão):
- TotalAvailableForWithdrawal: +R$ 1,50 (PlatformFee - AcquirerFee, por decomposição)
- PlatformPayoutsOut: R$ 0,00
- AcquirerPayoutsOut: +R$ 0,50

PaymentFeeSplitHandling.AutoSplitToBank:
- TotalAvailableForWithdrawal: R$ 0,00
- PlatformPayoutsOut: +R$ 1,50 (PlatformFee - AcquirerFee, já enviado para banco)
- AcquirerPayoutsOut: +R$ 0,50
```

**Accithus Submerchant - Sincronização de Split Config:**

- A configuração de split de submerchant da Accithus deve ser sincronizada quando o Admin atualizar `MerchantSettings` da organização.
- A sincronização deve usar a taxa efetiva de `PixApi` (fallback `MerchantSettings` -> `PlatformSettings`).
- Mapeamento de comissão:
    - `FeeChargeMode.PercentageOnly` -> `commissionType = percentage`, `commissionValue = basisPoints / 10000`
    - `FeeChargeMode.FixedOnly` -> `commissionType = fixed`, `commissionValue = cents / 100`
    - `FeeChargeMode.FixedAndPercentage` -> priorizar percentual quando houver valor; fallback para fixo.
- A sincronização deve ser aplicada somente quando existir vínculo ativo `MerchantAcquirer` da Accithus com `ExternalSubmerchantId` preenchido.
- Essa sincronização **não** altera `PaymentFeeSplitHandling` da adquirente (`None` permanece válido quando não há auto-split bancário).

**Accithus Submerchant - Criação no vínculo da organização:**

- Ao vincular uma organização a uma adquirente `Accithus` (`POST /v1/admin/merchant/{merchantId}/acquirer`), o backend deve submeter automaticamente o submerchant na API de pagamentos.
- O `MerchantAcquirer` deve persistir:
    - `ExternalSubmerchantId`
    - `ExternalSubmerchantStatus`
    - `ExternalOnboardingSubmittedAt`
- A criação automática depende de KYC mínimo da organização (`LegalName`, `DocumentType`, `DocumentNumber`).
- Em falha de submissão da subconta na Accithus, o vínculo deve retornar erro para evitar `MerchantAcquirer` sem submerchant externo.

**Accithus Submerchant - campos permitidos em update/resubmit:**

- Fonte de verdade do contrato: `https://docs.accithus.com/api-reference/openapi.json`.
- No create (`POST /v1/submerchants`), `entity_type` é permitido com valores `pf|pj` e `tax_id` é aceito.
- No update/resubmit (`PATCH /v1/submerchants/{id}` e `PATCH /v1/submerchants/{id}/resubmit`), usar `UpdateSubmerchantRequest`:
    - não enviar `entity_type`.
    - não enviar `tax_id` para alteração (campo não alterável após create).
    - priorizar apenas campos editáveis (`trade_name`, `legal_name`, `email`, `phone`, `website`, `description` e demais opcionais do schema).
- Em erro `422 VALIDATION_ERROR` da Accithus para campo inválido, ajustar payload para o schema oficial e manter log de erro detalhado via parser.

### Subconta externa para IP (regra genérica)

- Vínculos de organização com adquirentes `ProviderCategory = PaymentInstitution` devem provisionar subconta externa no momento do bind.
- O provisionamento não deve ficar inline em endpoint; usar serviço dedicado (`ISubmerchantProvisioningService`).
- O parsing de status externo de subconta deve usar utilitário compartilhado (`ExternalSubmerchantUtils`).
- No envio de documentos de KYC para submerchant de adquirente IP, nunca enviar URL privada bruta de storage.
- O backend deve gerar URL assinada para cada documento com validade de `1 ano` (`31536000` segundos) antes de chamar a API de pagamentos.
- A geração de URL assinada longa deve usar `IStorageService.GetOrRefreshUrlAsync(file, 31536000)` e propagar `expiresAt` no payload interno.
- Em leituras administrativas de vínculo (`ReadMerchant`, `ReadListMerchants`, `ReadAcquirerMerchants`), expor explicitamente:
    - `usesSubaccount`
    - `externalSubmerchantId`
    - `externalSubmerchantStatus`

**Hierarquia de Taxas das Adquirentes:**

As taxas das adquirentes também seguem uma hierarquia:

1. **MerchantAcquirer**: Taxas específicas para o merchant com a adquirente
   - Campos: `PixInFeeMode`, `PixInFeeFixed`, `PixInFeePercentage`, `PayoutFeeMode`, `PayoutFeeFixed`, `PayoutFeePercentage`
   - Quando um merchant é vinculado a uma adquirente, os valores são copiados da adquirente
   - O admin pode personalizar as taxas por merchant
   
2. **Acquirer**: Taxas padrão da adquirente (usadas como base)
   - Quando o admin atualiza as taxas da adquirente, pode sincronizar com todos os MerchantAcquirers

**Modos de Cobrança (`FeeChargeMode`):**

| Modo | Descrição |
|------|-----------|
| `FixedOnly` | Cobra apenas valor fixo (em centavos) |
| `PercentageOnly` | Cobra apenas percentual (em basis points: 150 = 1.5%) |
| `FixedAndPercentage` | Cobra valor fixo + percentual |

**Campos nas Entidades:**

| Entidade | Campo | Descrição |
|----------|-------|-----------|
| `Payment` | `PlatformFee` | Taxa Safefy cobrada do merchant |
| `Payment` | `AcquirerFee` | Taxa cobrada pela adquirente (invisível para merchant) |
| `Payment` | `NetAmount` | Amount - PlatformFee (valor que merchant recebe) |
| `Payment` | `AcquirerNetAmount` | Amount - AcquirerFee (valor que Safefy recebe) |
| `Payout` | `PlatformFee` | Taxa Safefy cobrada do merchant |
| `Payout` | `AcquirerFee` | Taxa cobrada pela adquirente (invisível para merchant) |

**Regras Importantes:**
- O **merchant NUNCA pode configurar suas próprias taxas**
- Apenas o **Admin** pode alterar as taxas de um merchant
- Se `MerchantSettings` não tiver taxa configurada (null), usa `PlatformSettings`
- `PlatformSettings` é um singleton (apenas 1 registro no banco)
- O **merchant NUNCA vê** os campos `AcquirerFee` e `AcquirerNetAmount`
- As taxas das adquirentes são usadas para reconciliação bancária

**Cálculo de Lucro:**
```
Lucro Safefy = PlatformFee - AcquirerFee

Exemplo (pagamento de R$ 100,00):
- PlatformFee: R$ 2,00 (2%)
- AcquirerFee: R$ 0,50 (0.5%)
- Lucro: R$ 1,50
```

**Endpoints de Admin:**
- `GET /v1/admin/platform-settings` - Ler configurações globais
- `PATCH /v1/admin/platform-settings` - Atualizar configurações globais
- `PATCH /v1/admin/merchant/{id}/settings` - Atualizar configurações do merchant

---



