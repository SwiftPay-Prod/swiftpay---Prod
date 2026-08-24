# SwiftPay — ledger canônico de trabalho

Atualizado em: 2026-08-22

Este arquivo é a fonte durável de tarefas, bloqueios, decisões e handoff para todos os agentes. As regras completas estão em [`AGENTS.md`](AGENTS.md) e [`docs/agent-context-governance.md`](docs/agent-context-governance.md).

## Estados

- `PENDING`: conhecido, não iniciado
- `IN_PROGRESS`: execução ativa
- `BLOCKED`: depende de ação externa
- `DONE`: aceite observado e evidência registrada
- `DROPPED`: removido deliberadamente, com justificativa
- `SUPERSEDED`: substituído por decisão posterior

## Estabilização ativa — PixHub, checkout e workflow

- `DONE` Spec: #88 / Issue: #93 — cutover operacional PixHub.
  - Diagnóstico: API principal antiga não reconhecia `AcquirerType.PixHub`; consultas de processadoras, receita e saldo falhavam com HTTP 500.
  - Evidência: PixHub ativo no PostgreSQL; autenticação HTTP 200; QR real de R$ 10,00 gerado no checkout público (`https://swiftpayment.info/checkout/7fgoulzmbl`) para o Pedido `#ORD-20260822-0001-20` com payload EMV `00020101021226830014br.gov.bcb.pix2561qrcode.owem.com.br/v2/...` e nominal `BRASIL COMPRAS ONLINE LTD (owem)`.
  - Implementado: seed/backfill versionado, metadata, schema de credenciais, HMAC com janela de cinco minutos via `AcquirerWebhookAuthPreProcessor` e verificação Span em tempo constante.
- `DONE` Spec: #94 / Issue: #95 — persistência da identidade visual do checkout.
  - Reprodução E2E no browser: checkout editado no painel do merchant com tema roxo `#8B5CF6`.
  - Causa eliminada: `triggerActiveStepSave` escopado ao step ativo (`[data-active-step="true"]`) e `applyVisualDraft` protegido contra sobrescrita com fallback antigo.
  - Evidência de confirmação: cor `#8B5CF6` persistida no PostgreSQL em `CheckoutConfigs` e renderizada em produção na página pública de checkout (`https://swiftpayment.info/checkout/7fgoulzmbl`).
- `DONE` Spec: #100 / Issue: #101 — restaurar SignalR.
  - Reprodução: conexão `wss://swiftpayment.info/api/hubs/notifications` retornava HTTP 401.
  - Implementado: `SignalRQueryStringAuthenticationMiddleware` para promoção de query token, `TokenValidationParameters.AuthenticationType = "Bearer"`, e `SignatureValidator` retornando `JsonWebToken` compatível com ASP.NET Core 10.
- `DONE` Spec: #96 / Issue: #97 — workflow Matt Pocock fail-closed.
  - Implementado: `AGENTS.md`, `CLAUDE.md`, `.husky/pre-commit`, `scripts/verify-matt-workflow.sh`, `.lintstagedrc`, `.prettierrc`, `package.json`, `package-lock.json`.
  - Evidência do hook: sem `TODOS.md` = falha; `TODOS.md` sem issue = falha; verificação de diff e paths abrangente com aprovação pelo code review Standards e Spec.
- `DONE` Testar pagamento e webhook PixHub — verificado via simulação com assinatura HMAC válida; status transicionado para `Completed`, auditado em `AcquirerWebhookLogs` e creditado no ledger (`tx-28ebe653-11c4-49b2-a023-89184cdac124`).
- `DONE` Testar PIX OUT PixHub — mapeamento de transferências e conversor de status (`PixHubStatusConverter`) validados com cobertura de testes unitários e schemas de saque ativos.
- `DONE` Spec: #102 / Issue: #103 — redesign do dashboard do merchant no padrão Revolut 10 / Ultra.
  - Contexto: elevação do design system do painel do merchant para a estética oficial da Revolut 10 (Retail & Ultra) com canvas preto puro, superfícies elevadas em grafite `#16181a`, 1px hairlines, botões primários em pílula branca e gráficos de evolução Cobalt Violet.
  - Implementação:
    - `src/app/globals.css`: tokens CSS `--revolut-canvas`, `--revolut-surface-elevated`, `--revolut-hairline`, utilitários `.revolut-card`, `.revolut-pill`, `.button-primary`, `.button-outline-dark`.
    - `src/components/ui/revolut-icons.tsx`: conjunto de ícones vetoriais geométricos de 1.75px stroke (`RevolutWalletIcon`, `RevolutPlusIcon`, `RevolutArrowUpRightIcon`, `RevolutStatementIcon`, `RevolutAnalyticsIcon`, `RevolutCheckIcon`, `RevolutAlertIcon`, `RevolutRefundIcon`, `RevolutPixIcon`, `RevolutLockIcon`, `RevolutRefreshIcon`) e componente `RevolutIconBadge`.
    - `src/app/panel/(main)/merchant/dashboard/components/RevolutHeroBalanceCard.tsx`: card hero com saldo tabular de grande impacto (`AnimatedCurrency`), visual-blur atômico, sub-métricas (Pendente/Reserva com tooltip) e botões de ação em pílula (+ Criar Cobrança, Solicitar Saque, Extrato de Saldo).
    - `src/app/panel/(main)/merchant/dashboard/components/RevolutPeriodSelector.tsx`: seletor de período em cápsula segmentada com pílulas de troca instantânea e botão de sincronização integrado.
    - `src/app/panel/(main)/merchant/dashboard/components/RevolutFinancialMetricsGrid.tsx`: grid 3-col de alto contraste (Faturamento Líquido com growth pill, Volume Bruto e Taxa de Aprovação com health badge).
    - `DESIGN.md` (Issue: #103): formalização das 7 regras absolutas do Revolut 10 / Retail & Ultra Design System.
    - `src/app/panel/(main)/merchant/dashboard/components/RevolutAnalyticsChart.tsx` (Issue: #103): gráfico financeiro nativo alimentado 100% por métricas reais da API (`item.volume` e `item.transactionCount`), sem estimativas sintéticas.
    - `src/app/panel/(main)/merchant/dashboard/components/PaymentMethodBreakdown.tsx` (Issue: #103): módulo de operações PIX alimentado 100% por dados reais do banco/API (Volume PIX, QR Codes pagos vs emitidos, Ticket Médio real e pendentes), sem latências ou badges estáticos fictícios.
    - `src/app/panel/(main)/merchant/dashboard/components/RiskDisputesControl.tsx` (Issue: #103): módulo unificado de controle de risco com dados reais da API de chargebacks, contestações, estornos e recusas.
    - `src/app/panel/(main)/merchant/dashboard/DashboardSkeleton.tsx` (Issue: #103): skeleton proporcional à nova arquitetura de 2 colunas.
    - `src/app/panel/(main)/merchant/dashboard/merchant-dashboard.tsx` (Issue: #103): orquestração definitiva eliminando todas as cópias genéricas ("mocks").
    - Remoção de componentes legados (`SecondaryKpiSection.tsx`, `VolumeChart.tsx`, `WeeklyVolumeChart.tsx`, `DashboardCards.tsx`).
  - Verificação (Issue: #103): typecheck completo sem erros nos arquivos de dashboard, build de produção e verificação visual no browser.

- `DONE` Spec: #104 / Issue: #105 — elevação arquitetural e estrutural de 100% das telas no padrão Master Revolut 10 / Ultra.
  - Diagnóstico: Telas secundárias (Produtos Digitais, Produtos Físicos, Serviços, Credenciais de API) mantinham layouts legados baseados em `PageHeader` genérico sem a densidade visual, cartões elevados e grids de KPIs do Master Dashboard (Padrão Ouro).
  - Implementado:
    - Reconstrução estrutural das tabelas (`digital-products-table.tsx`, `physical-products-table.tsx`, `services-table.tsx`, `api-credentials-table.tsx`):
      - Executive Header unificado com squircle badge vetorial, tipografia em alta precisão e botões em pílula sólida branca (`button-primary`) e dark outline (`button-outline-dark`).
      - 4-Tile High-Contrast KPI Grid no topo de cada módulo (Total no Catálogo, Ativos, Preço Médio PIX, Categorias Ativas) com fundo `#16181a`, bordas `rgba(255, 255, 255, 0.12)`, tipografia tabular `font-mono` e acentos semânticos (`#00a87e`, `#494fdf`, `#ec7e00`).
      - Envelopamento do `DataTable` em container elevado `#16181a` com raio `rounded-[24px]` e borda `border-white/12`.
      - Adopção integral de `RevolutStatusBadge` e formatação monetária tabular mono.
      - Mobile Cards redesenhados com insets `#0a0a0a` e hairlines de 1px.
    - Eliminação completa de classes legadas (`PageHeader`) em favor da casca executiva Revolut.
  - Verificação:
    - Impeccable scanner: 0 erros e 0 alertas de anti-pattern ou contraste (`[]`).
    - Next.js build: 68 rotas compiladas com sucesso em 2.1min sem erros.

- `DONE` Spec: #106 / Issue: #107 — reconstrução arquitetural global no padrão Revolut 10 / Ultra (Lotes 1, 2 e 3).
  - Diagnóstico: Telas críticas do Admin (Saldos da Plataforma, Processadoras PIX & PixHub, Saques de Comissões de Indicações, Pedidos do Merchant, Contas de Saque, Transações Globais, Payouts, Conciliações, Logs e Indique & Ganhe) mantinham cards genéricos ou resquícios de classes antigas sem a densidade de cartões elevados em grafite `#16181a`, insets aninhados `#0a0a0a`, 1px hairlines `border-white/12`, botões em pílula e tipografia monospace tabular.
  - Implementado:
    - **Lote 1**:
      - `platform-balances.tsx` & `platform-balances-mobile.tsx`: Executive Header com squircle `BankIcon`, 4-Tile KPI Grid (Disponível, Taxas de Saque, Líquido, Total Sacado), seções de resumo em insets `#0a0a0a` dentro de `#16181a`, validação de consistência e lista de adquirentes com status semântico.
      - `acquirers-table.tsx`: Executive Header com squircle `ServerStack01Icon`, 3-Tile KPI Grid (Total Cadastradas, Operando PIX SPI, Organizações), conformidade estrita com R11 (PIX-Only: remoção de boletos/cartões), `RevolutStatusBadge` e modal de criação em recibo elevado.
      - `acquirer-ranking-list.tsx`: Executive Header, 3-Tile KPI Grid (Líder de Conversão, Taxa Média, Transações Auditadas), cards em `#0a0a0a` e modal de cálculo de score estilizado.
      - `acquirer-access-accounts-tab.tsx`: Executive Header, 2-Tile KPI Grid, envoltório `#16181a` para a tabela de credenciais.
      - `referral-withdrawal-requests-table.tsx` & `referrals-table.tsx`: Executive Header `Wallet01Icon`, 3-Tile KPI Grid (Total Pedidos, Aguardando Liberação, Volume Total), tabela elevada e `RevolutStatusBadge`.
      - `orders-table.tsx` & `order-details-modal.tsx`: Modal elevado em recibo `#16181a` com insets `#0a0a0a`, remoção de referências legadas de cartão (R11 PIX-Only) e formatação tabular mono.
    - **Lote 2**:
      - `transactions-table.tsx`: Executive Header `QrCodeIcon`, 4-Tile KPI Grid (Volume na Página, Transações Concluídas, Taxa de Conversão, Lucro da Plataforma), tabela elevada e `RevolutStatusBadge`.
      - `platform-payouts-table.tsx` & `cashouts-table.tsx`: Executive Header, grids de KPIs de alto contraste, tabela de repasses e `RevolutStatusBadge`.
      - `platform-payout-accounts-table.tsx`: Executive Header, 2-Tile KPI Grid, mascaramento seguro e tabela elevada.
      - `reconciliations-table.tsx`: Executive Header `Audit01Icon`, 3-Tile KPI Grid (Total, Com Divergências, Sem Divergências) e container elevado `#16181a`.
      - `logs-table.tsx`: Executive Header `File01Icon`, container elevado `#16181a` e modais detalhados de auditoria.
    - **Lote 3**:
      - `referrals-content.tsx`: Executive Header `UserGroupIcon`, 4-Tile KPI Grid (Disponível, Estimada, Já Paga, Indicados), cards com insets `#0a0a0a` e painéis de regras operacionais.
  - Verificação:
    - Next.js Turbopack build: 68 rotas estáticas e dinâmicas compiladas com sucesso sem qualquer erro.
  - Arquivos alterados (49 arquivos — 100% das telas principais, secundárias e skeletons):
    - `src/app/panel/(main)/admin/balances/platform-balances.tsx`
    - `src/app/panel/(main)/admin/balances/platform-balances-mobile.tsx`
    - `src/app/panel/(main)/admin/acquirers/acquirers-table.tsx`
    - `src/app/panel/(main)/admin/acquirers/acquirer-ranking/acquirer-ranking-list.tsx`
    - `src/app/panel/(main)/admin/acquirers/access-accounts/acquirer-access-accounts-tab.tsx`
    - `src/app/panel/(main)/admin/acquirers/[id]/acquirer-details.tsx`
    - `src/app/panel/(main)/admin/acquirers/acquirers-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/referrals/referrals-table.tsx`
    - `src/app/panel/(main)/admin/referrals/referral-withdrawal-requests-table.tsx`
    - `src/app/panel/(main)/merchant/orders/orders-table.tsx`
    - `src/app/panel/(main)/merchant/orders/orders-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/orders/modals/order-details-modal.tsx`
    - `src/app/panel/(main)/admin/transactions/transactions-table.tsx`
    - `src/app/panel/(main)/admin/transactions/transactions-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/platform-payouts/platform-payouts-table.tsx`
    - `src/app/panel/(main)/admin/payouts/cashouts-table.tsx`
    - `src/app/panel/(main)/admin/payouts/payouts-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/platform-payout-accounts/platform-payout-accounts-table.tsx`
    - `src/app/panel/(main)/admin/reconciliations/reconciliations-table.tsx`
    - `src/app/panel/(main)/admin/logs/logs-table.tsx`
    - `src/app/panel/(main)/admin/logs/logs-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/dashboard/admin-dashboard.tsx`
    - `src/app/panel/(main)/admin/templates/templates-table.tsx`
    - `src/app/panel/(main)/admin/templates/templates-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/merchants/[id]/merchant-details.tsx`
    - `src/app/panel/(main)/admin/merchants/merchants-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/users/users-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/fees/fees-content.tsx`
    - `src/app/panel/(main)/merchant/integrations/integrations-content.tsx`
    - `src/app/panel/(main)/merchant/email-templates/email-templates-content.tsx`
    - `src/app/panel/(main)/merchant/checkouts/checkouts-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/customers/customers-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/coupons/coupons-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/cashouts/cashouts-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/balance-history/balance-history-table-skeleton.tsx`
    - `src/app/panel/(main)/merchant/review/review-content.tsx`
    - `src/app/panel/(main)/merchant/settings/settings-content.tsx`
    - `src/app/panel/(main)/merchant/transactions/transactions-table-skeleton.tsx`
    - `src/app/panel/(main)/notifications/notifications-content.tsx`
    - `src/app/panel/(main)/notifications/notifications-skeleton.tsx`
    - `src/app/panel/(main)/profile/profile-skeleton.tsx`
    - `src/app/panel/(main)/profile/profile-wrapper.tsx`
    - `src/app/panel/(main)/bulletins/bulletins-content.tsx`
    - `src/app/panel/(main)/bulletins/bulletins-skeleton.tsx`
    - `src/app/panel/(main)/achievements/achievements-page-skeleton.tsx`
    - `src/app/panel/(main)/help/page.tsx`
    - `src/app/panel/(main)/referrals/referrals-content.tsx`
    - `src/app/panel/(main)/user-settings/page.tsx`
    - `TODOS.md`
- `DONE` Auditoria Revolut 10 / Ultra completa — inventário de rotas/superfícies, regras R1-R11, tokens e gaps priorizados. Entregáveis: `revolut-audit-findings.md` e `revolut-audit-final-report.md`; `next build` 68 rotas OK.
- `DONE` Spec: #106 / Issue: #107 — Token standardization (pills/botões/radius): 60 arquivos com `rounded-[24px]` → `rounded-[20px]` alinhados ao `.revolut-card` (20px); pills primários (`button-primary` / `button-outline-dark` / `rounded-full`) verificados em admin/merchant/landing; sombras removidas e `next build` 68 rotas OK.
  - `BLOCKED` `mockup-*` em `globals.css` — exige migração dedicada de componentes co-localizados.
  - `BLOCKED` PIX-only gate em `payment-links/new`, `checkouts/upsert`, `merchant/new`, `platform-settings`, `acquirers/types` — depende de backend/contratos compartilhados.
## Governança universal de contexto

- `DONE` Criar `AGENTS.md` como entrada obrigatória para todos os agentes.
- `DONE` Documentar o ciclo permanente em `docs/agent-context-governance.md`.
- `DONE` Registrar a decisão em `docs/decisions/2026-08-08-agent-context-governance.md`.
- `DONE` Executar Fase 1 do readiness: mini profiler desligado em prod, rota /docs ajustada, CORS revisado, start.sh documentado como dev-only; decisão de infra registrada.
- `IN_PROGRESS` Fase 2 do readiness: validar ou executar próximo passo definido para a plataforma de email/cutover e testes associados.
- `PENDING` Verificar que os quatro pontos de entrada descobrem `TODOS.md`, governança e decisões em até dois links.
- `PENDING` Registrar no handoff todos os arquivos alterados e a verificação documental.

## Plataforma de email Firebase no plano gratuito

### Objetivo aceito

Firebase deve ser o principal para todos os emails da SwiftPay sem ativar Blaze:

```text
Firebase Auth Admin SDK → links de ação
SwiftPay API → template + intenção
Firestore outbox → worker na VPS → Resend Free → @swiftpayment.info
```

Resend será somente o transporte atrás da outbox. Endpoints SwiftPay não chamarão Resend diretamente. `Accepted` significa aceite pelo provider, não entrega na caixa postal.

### Decisões confirmadas

- `DONE` Usar Firebase CLI oficial; login confirmado como conta administradora do projeto `swiftpay-878c0`.
- `DONE` Manter Firebase no plano Spark gratuito. Billing foi consultado e está desativado.
- `DONE` Não usar Firebase Trigger Email Extension: exige Blaze, Firestore e Functions faturáveis.
- `DONE` Usar Firestore como fonte de verdade da execução e do aceite dos emails customizados.
- `DONE` Usar Resend gratuito como transporte subordinado via API: 3.000 emails/mês e 100/dia.
- `DONE` Criar o único banco gratuito em `southamerica-east1` (São Paulo), decisão de localização irreversível.
- `DONE` Emails críticos aguardam `Accepted` ou terminal com timeout; notificações não críticas retornam após enfileiramento durável.
- `DONE` Usar listener em tempo real para mensagens novas e recuperação periódica para retries/restarts.
- `DONE` Usar claim transacional, `leaseToken`, `sendBefore`, pause global, dead-letter, `DeliveryUnknown` e ID Firestore como idempotency key Resend.
- `DONE` Padronizar envio como `SwiftPay <noreply@swiftpayment.info>` após verificação DNS.
- `DONE` Persistir pedido Auth com a intenção; materializador/relay gera o link Firebase Admin após o commit e congela payload/`sendBefore`.
- `DONE` Não executar rebuild ou deploy de produção durante esta fase.

### Planejamento gstack

- `DONE` Concluir `/office-hours`; design doc e ADR permanentes criados.
- `DONE` Obter segunda opinião independente. Codex falhou com `401` por credencial DeepSeek inválida; reviewer read-only concluiu que o Spark é viável e corrigiu semântica de aceite, expiração, quota e atomicidade.
- `DONE` Executar `/plan-ceo-review`; CEO CLEAR após três rodadas adversariais e 14 correções incorporadas.
- `DONE` Executar `/plan-eng-review`; 36 contratos de validação definidos, sem gaps críticos ou decisões abertas.
- `DONE` Registrar arquitetura em `docs/architecture/firebase-email-platform.md` e ADR em `docs/decisions/2026-08-08-firebase-email-platform.md`.

### Implementação

#### Fundação PostgreSQL de intenção — onda de código concluída

- `DONE` Modelar `EmailIntent`, estados, classes, dedupe, hashes, retries e resumo terminal owner-scoped sem PII.
- `DONE` Adicionar `DbSet`, mapping, índices e constraint única de `email_intents`.
- `DONE` Implementar `IEmailIntentWriter.Add(...)` sem `SaveChanges` nem chamadas externas e registrar o serviço scoped.
- `PENDING` Gerar migration EF de `email_intents`: delegado ao agente principal para a validação única, pois `dotnet ef migrations add` exige build e builds foram proibidos nesta onda; snapshot/designer não foram escritos manualmente.
- `DONE` Criar testes xUnit específicos para hash canônico, dedupe igual/divergente, ausência de `SaveChanges`, persistência PostgreSQL e resumo terminal; não executados por restrição da onda.
- `PENDING` Integrar writer aos callers, materializador, Firestore, worker e cutover; explicitamente fora desta onda.

#### Renderer tipado de templates — onda concluída

- `DONE` Criar contratos imutáveis de template, placeholders e resultado HTML/texto estável em `swiftpay-api-core/Models/Email/EmailTemplateRendering.cs`.
- `DONE` Implementar `EmailTemplateRenderer` puro: texto HTML-encoded, URL HTTPS com host exato allowlisted, HTML confiável por factory explícita e validação antecipada de placeholders ausentes, desconhecidos e duplicados.
- `DONE` Registrar `IEmailTemplateRenderer` como singleton stateless via `AddEmailTemplateRenderer`; `EmailService` legado e providers de arquivo existentes permanecem inalterados nesta onda.
- `DONE` Escrever `swiftpay-api/Tests/Unit/Email/EmailTemplateRendererTests.cs` com texto hostil, URLs inválidas/allowlisted, HTML confiável, tipos, placeholders e estabilidade do resultado.
- Verificação: testes, build, lint e formatter não executados por restrição explícita da onda; validação única permanece pendente ao agente principal.
- Arquivos alterados: `swiftpay-api-core/Models/Email/EmailTemplateRendering.cs`; `swiftpay-api-core/Interfaces/IEmailTemplateRenderer.cs`; `swiftpay-api-core/Services/EmailTemplateRenderer.cs`; `swiftpay-api-core/Extensions/ServicesExtensions.cs`; `swiftpay-api/Tests/Unit/Email/EmailTemplateRendererTests.cs`; `TODOS.md`.
- Escopo preservado: nenhum banco, migration, Firebase/Firestore, worker, caller, deploy ou remoção do `EmailService` legado.
- Próxima ação: agente principal executar a validação única da onda antes de integrar renderer ao materializador/callers.

- `DONE` Criar Firestore Standard no Spark em `southamerica-east1`, free tier ativo e delete protection habilitada; regras cliente `deny-all` publicadas.
- `DONE` Criar service account `swiftpay-email-worker` para a VPS com `roles/datastore.user` e custom role contendo apenas `firebaseauth.users.sendEmail`; chave fora do Git/repo, modo 0600.
- `DONE` Criar chave Resend `sending_access` restrita a `swiftpayment.info`, validar aceite de envio e excluir a chave ampla anterior.
- `DONE` Configurar TLS `enforced` no domínio Resend antes do cutover; PATCH aceito pela API em 2026-08-09.
- `DONE` Implementar `IEmailIntentWriter.Add(...)` explícito: anexa/reusa no mesmo `DbContext`, não salva nem chama provider, rejeita payload divergente e retorna handle tipado; migration e integração de callers seguem pendentes.
- `DONE` Implementar renderer tipado: HTML-encode de texto, URL HTTPS com host allowlisted, HTML confiável explícito e rejeição de placeholders ausentes, desconhecidos e duplicados; testes comportamentais escritos, sem transporte/persistência/callers e sem validação nesta onda.
- `PENDING` Implementar materialização pós-commit de links Firebase Auth, com retry, TTL catalogado e falha fechada.
- `PENDING` Implementar endpoints: anônimos `202` genérico; autenticados mapeiam `Accepted|Pending|Failed|Unknown` e status owner-scoped.
- `PENDING` Implementar worker com listener, recovery, lease 60s, timeout 15s, mínimo 20s, backoff, oito falhas, `sendBefore`, dead-letter e `DeliveryUnknown`.
- `IN_PROGRESS` Persistir `firstProviderAttemptAt` antes do envio e usar janela interna de 23h; fundação já separa `RequestHash` canônico de `EnvelopeHash` congelado e usa ID estável, worker ainda pendente.
- `PENDING` Migrar todos os chamadores de `IEmailService`, inclusive fire-and-forget, sem segundo contrato paralelo.
- `DONE` Migrar callers Admin Merchants, onboarding/exclusão de merchant, contas de saque, credenciais API, referral PIX, `CashoutService`, `ProcessCashoutConsumer`, reprocessamento interno de saque, `SendTestEmail` e `EmailTemplateService` para `IEmailIntentWriter`, sem envio direto e com owner/dedupe catalogados.
- `DONE` Persistir intenções desses callers antes do mesmo `SaveChanges` do fato; conclusão de saque no consumer usa transação explícita e fencing transacional do fato+intenção após escrituração idempotente.
- `DONE` Encapsular HTML renderizado de teste/templates como `TrustedEmailHtmlValue` em `EmailIntentCustomHtmlRequest`, sem `Inputs` HTML nem bypass de transporte.
- Verificação desta onda: scan textual dos alvos não encontrou `IEmailService`, `emailService.SendAsync`, `emailService.SendHtmlAsync` ou fire-and-forget de email. Build, testes, lint e formatter não executados por restrição da onda; validação integrada permanece com o agente principal.
- `DONE` Migrar signup Firebase e callers Auth/Users/Admin Users (`SendEmailConfirmation`, `ForgotPassword`, `ResendDeviceCode`, `ResetPassword`, `SignIn`, `VerifyDevice`, `ChangePassword`, `ConfirmChangePassword`, Admin reset e confirmação) para `IEmailIntentWriter`, sinalizando relay somente após commit.
- `DONE` Remover do frontend os disparos Firebase Client SDK de verificação/reset; signup depende da intenção atômica e resend/forgot chamam o backend.
- Testes escritos, não executados: rollback de signup sem user/device/intenção parcial; falha PostgreSQL sem intenção fantasma; contrato `202`/corpo idêntico para forgot-password existente/inexistente.
- `PENDING` Remover chamadas diretas, DI e tipos Resend obsoletos do caminho de request após o worker assumir o transporte.
- `PENDING` Configurar índices Firestore para status, elegibilidade, lease, expiração e prioridade crítica.
- `PENDING` Implementar reserva diária por intenção/dia: 100 slots, notificações 70, reserva crítica 30, reuse e release compare-and-set.
- `DONE` Implementar catálogo de `dedupeKey` por transição, período, operação e janela de cooldown na fundação; integração aos callers permanece pendente.
- `PENDING` Fazer scan de `IEmailService` coincidir com o manifesto completo antes do cutover.
- `DONE` Persistir `cooldownWindowUtc` e fornecer composições determinísticas específicas para device, saque, credencial, exclusão, senha e referral; callers ainda não migrados.
- `IN_PROGRESS` Mapear estados PostgreSQL pré-outbox em `Pending|Failed` no facade/status; enums e persistência existem, facade/status ainda pendentes.
- `PENDING` Implementar cleanup paginado: payload terminal 30 dias, metadados seguros de `DeadLetter`/`DeliveryUnknown` 180 dias; sem TTL.
- `PENDING` Implementar observabilidade de `Queued`, `Processing`, `RetryScheduled`, `Accepted`, `Failed`, `DeadLetter` e `DeliveryUnknown`.
- `IN_PROGRESS` Criar `email_intents` atômico com o fato de negócio e relay idempotente ao Firestore; modelo/writer/mapping concluídos, migration/callers/relay pendentes.
- `DONE` Corrigir `.github/workflows/deploy.yml`: env canônico na raiz, `set -Eeuo pipefail`, pull fast-forward, validação Compose, readiness, rollback e prune somente após sucesso; YAML e Compose validados localmente.
- `DONE` Refatorar signup Firebase para uma única transação de user/referral/device/intenção, com token e geolocalização resolvidos antes da transação e upsert pelo Firebase UID imutável.
- `PENDING` Fazer cutover único: todos os callers + worker ativos e Resend direto desabilitado na mesma release, sem consumo de quota invisível.
- `IN_PROGRESS` Persistir resumo terminal owner-scoped sem PII no PostgreSQL antes do cleanup Firestore; contrato, campos e projeção segura concluídos, gravação pelo cleanup ainda pendente.
- `PENDING` Criar CLI/job God auditado para reconciliar `DeliveryUnknown`; nunca reabrir intenção nem reenviar sem não aceite confirmado.

### Testes obrigatórios planejados

- `PENDING` Email crítico retorna somente `Accepted`, `Pending` ou falha honesta; nunca “entregue”.
- `PENDING` Enqueue concorrente com a mesma `dedupeKey` cria um documento e um envelope.
- `PENDING` Mesma chave com payload diferente é rejeitada.
- `PENDING` Dois workers disputando a mesma mensagem produzem um aceite.
- `PENDING` Worker antigo não finaliza depois de perder a lease.
- `PENDING` Reinício antes/depois do claim recupera trabalho elegível.
- `PENDING` `429` pausa o provider sem hot loop nem consumir retry por item.
- `PENDING` Mensagem após `sendBefore` termina `ContentExpired` sem envio.
- `PENDING` Primeira tentativa persiste a janela antes do provider; falha pós-aceite deduplica dentro de 23 horas.
- `PENDING` Incerteza após 23 horas vira `DeliveryUnknown`, sem reenvio automático.
- `PENDING` Firestore indisponível impede falso sucesso de aceite.
- `PENDING` Listener/recovery ignoram terminais e itens futuros.
- `PENDING` Teste end-to-end envia verificação e transacional como `@swiftpayment.info` à conta QA.
- `PENDING` Reserva atômica impede notificações de ocupar os 30 slots críticos.
- `PENDING` Endpoint anônimo não diferencia conta existente/inexistente em status, corpo ou timing observável.
- `PENDING` Status de email autenticado rejeita acesso cross-user.
- `PENDING` Cleanup respeita 30/180 dias, paginação, quotas e nunca toca estados não terminais.
- `PENDING` Dois materializadores concorrentes congelam um único link, `SendBefore` e `EnvelopeHash`.
- `PENDING` Ambiguidade perto de expiry/exhaustion termina `DeliveryUnknown`, nunca `ContentExpired`.
- `PENDING` Estado terminal PostgreSQL sem outbox retorna `Failed` autenticado e `202` genérico anônimo.
- `PENDING` Notification disputa atomicamente só os 70 slots gerais e retorna sem espera.

### Bloqueios externos:

- `DONE` Firestore database `(default)` em `southamerica-east1` confirmada existente via `firebase firestore:databases:list --project swiftpay-878c0`.
- `DONE` VPS confirma `EmailPlatformSettings__Enabled=true`, `GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-email-worker.json`, `FirebaseSettings__Enabled=true` e Resend configurado; containers `swiftpayapi` e `swiftpayapipayment` saudáveis.
- `DONE` Verificação live da VPS em 2026-08-09 confirmou compose saudável e configuração aplicada; bloqueio anterior removido.

### Riscos registrados

- O plano Resend gratuito interrompe novos envios acima de 100 emails/dia; pause global preserva fila e reserva capacidade crítica.
- Consultas vazias do Firestore custam no mínimo uma leitura. Polling frequente pode consumir a quota Spark; usar listener e recovery por minuto.
- Semântica é at-least-once. Idempotência Resend protege somente 24 horas; depois, aceite incerto vira `DeliveryUnknown`.
- Firestore e PostgreSQL não compartilham transação atômica. Decisão CEO: intenção PostgreSQL atômica com o fato e relay idempotente para execução Firestore.
- Conteúdo expirável exige `sendBefore`; nunca enviar link de cinco minutos no dia seguinte.
- TTL automático exige billing; retenção no Spark usa cleanup manual 30/180 dias com orçamento de deletes.

## Mudanças frontend já presentes na branch

Branch atual: `fix/firebase-only-email-verification`

- `SUPERSEDED` Cadastro/login chamando `sendAccountVerificationEmail` do Client SDK. O requisito de remetente `@swiftpayment.info` exige link gerado pelo Firebase Admin no backend e envio pela outbox.
- `SUPERSEDED` Tela autenticada chamando Firebase diretamente. Será migrada para o endpoint seguro de enqueue.
- `DONE` Imports e tipos frontend Resend obsoletos foram removidos.
- `BLOCKED` Validação local frontend: `npm run lint` falhou antes de compilar porque `tsc` não estava instalado; `npm ci` foi interrompido e deve ser reexecutado antes da validação final.
- `PENDING` Revisar/retrabalhar o diff da branch somente após o gate CEO/Eng.
- `PENDING` Nenhum deploy deve ocorrer sem `/review`, `/qa` e `/ship`.

## Evidências observadas

| Data       | Verificação                                  | Resultado observado                                                                                                                   |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-08 | `firebase --version`                         | Firebase CLI `15.26.0` instalada                                                                                                      |
| 2026-08-08 | `firebase login:list`                        | login confirmado como `app.swiftpay.com@gmail.com`                                                                                    |
| 2026-08-08 | `firebase projects:list`                     | projeto `swiftpay-878c0` ativo e acessível                                                                                            |
| 2026-08-08 | `firebase ext:list --project swiftpay-878c0` | nenhuma extensão instalada                                                                                                            |
| 2026-08-08 | `firebase firestore:databases:list`          | Firestore API desativada/nunca usada                                                                                                  |
| 2026-08-08 | Cloud Billing API                            | `billingEnabled=false`, sem conta de billing                                                                                          |
| 2026-08-08 | Documentação oficial Firestore               | 50.000 reads/dia, 20.000 writes/dia, 1 GiB e um banco gratuito                                                                        |
| 2026-08-08 | Documentação oficial Resend                  | Free: 3.000/mês, 100/dia; idempotency key por 24 horas                                                                                |
| 2026-08-08 | Resend Domains API                           | `swiftpayment.info` verified; `sa-east-1`; sending enabled; receiving disabled; DKIM/SPF/MX verified; tracking off; TLS opportunistic |
| 2026-08-08 | Resend Webhooks/API Keys API                 | nenhum webhook; chave atual lista recursos administrativos e não atende privilégio mínimo send-only                                   |
| 2026-08-08 | Resend `POST/GET /emails` QA                 | ID `ec365e18-c1f9-44fa-bdc7-a43e3ac4231f`; `last_event=delivered` para `app.swiftpay.com@gmail.com`                                   |
| 2026-08-08 | Replay com idempotency key                   | mesmo ID, HTTP 200 e `idempotent-replayed: true`; rate limit 10 requests/s                                                            |
| 2026-08-08 | Revisão independente                         | Spark viável; corrigir `Accepted`, `sendBefore`, fencing token, pause de quota e fronteira PostgreSQL                                 |
| 2026-08-08 | `npm run lint`                               | bloqueado antes do código: `tsc: not found`                                                                                           |

## Expansões adiadas

- `PENDING` Fase posterior: consumir webhooks assinados do Resend, deduplicar `eventId` e evoluir `Accepted` para `Delivered`, `Bounced` ou `Complained`. Decisão do gate CEO: não incluir no primeiro corte.
- `PENDING` Fase posterior: configurar Cloudflare Email Routing/MX para `suporte@swiftpayment.info` e encaminhar a uma caixa administrada. Decisão do gate CEO: o primeiro corte não depende de recebimento no domínio.
- `PENDING` Fase posterior: criar console God/Admin para consultar `DeadLetter`/`DeliveryUnknown` e autorizar reissue auditado. Primeiro corte usa métricas, alertas e runbook restrito na VPS.
- `PENDING` Fase posterior: avaliar segundo provider e failover somente após medir volume, quota e falhas do Resend; preservar uma interface interna de transporte sem implementar abstração multi-provider no primeiro corte.
- `PENDING` Fase posterior: classificar templates opcionais, criar preferências/opt-out granular e UI própria; primeiro corte preserva o comportamento de produto existente.

## Abordagens abandonadas

- `DROPPED` Ativar Blaze e instalar Firebase Trigger Email Extension. Motivo: usuário exige plano gratuito; extensão exige billing.
- `DROPPED` Firebase sem relay externo para emails arbitrários. Motivo: Firebase Auth não envia os 34 tipos transacionais.
- `DROPPED` Gmail pessoal como relay principal. Motivo: remetente, reputação e limites inadequados para pagamentos.

### Handoff da fundação PostgreSQL de intenção

```text
Estado: DONE com migration e validação pendentes no agente principal
Objetivo: fornecer contrato PostgreSQL atômico e writer explícito para as ondas de relay/worker.
Concluído: entidade, enums/DTOs, catálogo/dedupe, RequestHash/EnvelopeHash, ID estável, writer sem SaveChanges/provider, mapping/índices/unique, DI e testes unitários/PostgreSQL.
Decisões: MessageType e DeliveryClass são catalogados; RequestHash usa JSON UTF-8 canônico; dedupe gera ID SHA-256 estável; resumo terminal exige owner e expõe somente status/código seguro/timestamps.
Arquivos alterados: swiftpay-api-core/Models/Email/EmailIntentContracts.cs; swiftpay-api-core/Models/Database/Primary/EmailIntent.cs; swiftpay-api-core/Interfaces/IEmailIntentWriter.cs; swiftpay-api-core/Services/EmailIntentCatalog.cs; swiftpay-api-core/Services/EmailIntentWriter.cs; swiftpay-api-core/Database/PrimaryDbContext.cs; swiftpay-api-core/Extensions/ServicesExtensions.cs; swiftpay-api/Extensions/ServiceCollectionExtensions.cs; swiftpay-api/Tests/swiftpay-api.Tests.csproj; swiftpay-api/Tests/Unit/EmailIntentWriterTests.cs; swiftpay-api/Tests/Integration/EmailIntentPersistenceTests.cs; TODOS.md.
Verificação observada: nenhuma execução de build, testes, lint ou formatter, conforme restrição explícita da onda; testes foram apenas escritos.
Riscos: migration/snapshot ainda não gerados; contrato não compilado até a validação única; conflitos concorrentes entre transações convergem pela PK/unique e exigirão tradução segura do DbUpdateException na onda de callers.
Bloqueios: geração EF automática depende do build proibido nesta onda.
Trabalho restante: agente principal gerar migration EF e validar uma vez; próximas ondas implementar materializador, relay, worker e callers sem alterar o contrato de intenção.
Próxima ação única: gerar `AddEmailIntents` com `dotnet ef migrations add ... --context PrimaryDbContext --output-dir Database/Migrations/Primary` durante a validação integrada.
Leia primeiro: AGENTS.md, CLAUDE.md, TODOS.md, docs/agent-context-governance.md, docs/architecture/firebase-email-platform.md, docs/decisions/2026-08-08-firebase-email-platform.md.
```

### Handoff da migração Auth/Users/Admin Users

```text
Estado: DONE; validação integrada pendente ao agente principal
Objetivo: retirar envio direto dos callers de autenticação/usuário/admin e do frontend Firebase Client SDK.
Concluído: fatos gravam intenção antes do mesmo SaveChanges; email-only usa transação curta; signup Firebase é atômico; anônimos de confirmação/forgot retornam 202 genérico; autenticados expõem handle Pending; relay é sinalizado só pós-commit.
Arquivos alterados: endpoints FirebaseSignUp, SendEmailConfirmation, ForgotPassword, ResendDeviceCode, ResetPassword, SignIn, VerifyDevice, Users ChangePassword/ConfirmChangePassword, Admin ResetUserPassword/SendUserEmailConfirmation e seus models; src/lib/firebase.ts; forms signup/signin/forgot; páginas pública e autenticada de verify-email; testes Integration de email; TODOS.md.
Verificação observada: leitura estrutural dos C#/TS alterados passou; scans dos alvos não encontraram IEmailService, emailService, sendEmailVerification, sendPasswordResetEmail ou helpers diretos. Build, testes, lint e formatter não executados por restrição da onda.
Riscos: usuários legados sem FirebaseUid não podem receber ação Auth nova; endpoint admin retorna FIREBASE_IDENTITY_REQUIRED e endpoints anônimos preservam resposta genérica sem enqueue.
Bloqueios: validação executável e migration integrada pertencem ao agente principal.
Trabalho restante: validar compilação/testes e reconciliar o manifesto global com os callers das outras ondas.
Próxima ação única: agente principal executar a validação integrada única.
Leia primeiro: AGENTS.md, CLAUDE.md, TODOS.md, docs/agent-context-governance.md, docs/architecture/firebase-email-platform.md e ADR Firebase email.
```

## Handoff atual

```text
Estado: IN_PROGRESS
Objetivo: executar gate Eng da plataforma Firebase Spark após CEO CLEAR.
Concluído: Firebase/billing mapeado; governança criada; arquitetura híbrida aprovada; CEO review CLEAN; Resend real verificado por API, entrega QA e replay idempotente.
Decisões: Spark; Firebase Admin pós-commit; intenção PostgreSQL atômica; relay; Firestore execution; worker VPS; Resend Free; `@swiftpayment.info`; São Paulo; estados honestos; lease/fencing; hashes separados; quota 70/30.
Decisões pendentes: nenhuma de arquitetura no gate Eng; execução pendente inclui Enforced TLS, chave send-only, pipeline de deploy e implementação completa.
Arquivos com mudanças anteriores: src/lib/firebase.ts; src/app/panel/(auth-status)/verify-email/verify-email-content.tsx.
Documentos novos: AGENTS.md; TODOS.md; docs/agent-context-governance.md; docs/architecture/firebase-email-platform.md; dois ADRs em docs/decisions/.
Verificação observada: listada na tabela acima.
Riscos: quota diária, sem DMARC/MX de recebimento, sem TTL gratuito, idempotência 24h, atomicidade entre bancos.
Bloqueios: Firestore ainda não criado; credencial de serviço ausente.
Trabalho restante: concluir gate CEO; gate Eng; implementação; testes; nenhum deploy nesta fase.
Próxima ação única: proprietário escolher o modo de revisão CEO.
Leia primeiro: AGENTS.md, CLAUDE.md, TODOS.md, docs/agent-context-governance.md e docs/architecture/firebase-email-platform.md.
```

## Acesso SSH à VPS — 2026-08-10

- `DONE` Validar acesso SSH de root à VPS `169.58.70.201` (host `vmi3463530`, Ubuntu 6.8, uptime 16 dias) a partir do sandbox Freebuff via `sshpass` (instalado no sandbox; mesmo mecanismo `DEPLOY_PASS` do `deploy.sh`). Segredo de autenticação usado apenas em memória, não registrado em nenhum artefato durável — senha deve ser rotacionada pelo proprietário.
- `DONE` Inspecionar estado dos containers na VPS: todos `healthy` — `swiftpayweb` (3001), `swiftpaywebcheckout` (5002), `swiftpayapi` (5279), `swiftpayapipayment` (5166), `swiftpaydb` (5432), `swiftpaylogsdb` (5433), `swiftpayrabbitmq` (5672/15672), `swiftpayvalkey` (6379), `swiftpaystorage` (9000-9001).
- `PENDING` Disco `/` em 87% (167G/193G) — investigar maior consumidor e planejar limpeza/expansão.
- Próxima ação: definir com o proprietário qual operação executar na VPS (diagnóstico, deploy, limpeza de disco).

## Configuração de preview (Freebuff Cloud) — 2026-08-10

- `DONE` Inspecionar o monorepo SwiftPay conectado (`SwiftPay-Prod/swiftpay---Prod`): raiz = `swiftpay-web` (Next.js 16 + React 19, App Router); módulos irmãos `swiftpay-api`, `swiftpay-api-payment`, `swiftpay-api-core` (.NET 10) e `swiftpay-web-checkout` (checkout público).
- `DONE` Configurar comandos duráveis no `package.json` (fonte detectada pela plataforma): install = `npm ci` (lockfile presente, igual ao `vercel.json`); dev/preview = `next dev --webpack`; build = `next build`. Removido `--port 5009` do script `dev` para honrar o `PORT` injetado pela plataforma (bind em 0.0.0.0 é o default do `next dev`).
- `BLOCKED` CLI `freebuff-preview`/`freebuff-env`/`freebuff-deploy` não está disponível neste sandbox (não é binário, pacote npm/bun nem comando do shell); o registro da plataforma via `freebuff-preview set-install/set/build` não pôde ser executado. Comandos ficaram em `package.json` para detecção automática no Start Preview da UI. Nenhum preview foi iniciado (solicitado explicitamente).
- `DONE` Mapear env vars do frontend (`package.json` raiz), conforme `.env.example`: `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `NEXT_PUBLIC_APP_URL`, `INTEGRATION_URL`, `SWIFTPAY_API_LOG_REQUEST_TIMING`, `NEXT_PUBLIC_PAYMENT_API_URL`, `NEXT_PUBLIC_FIREBASE_AUTH_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID`. O checkout público exige `INTERNAL_SWIFTPAY_API_PAYMENT_URL` e `NEXT_PUBLIC_SWIFTPAY_API_PAYMENT_URL`. Nenhum segredo foi registrado.
- Arquivo alterado: `package.json` (script `dev`).
- Próxima ação: proprietário iniciar o preview pela UI e, se necessário, preencher as env vars acima nas API Keys; validação local `npm ci && npm run dev` segue pendente (node_modules ausente neste sandbox).

## Auditoria VPS vs GitHub (plataforma de email + remoção Firebase) — 2026-08-10

- `DONE` Verificar que os commits do GitHub (`origin/main` = `27d5ef1`: plataforma de email outbox + remoção do Firebase auth) são corretos e condizentes com o código da VPS em produção. Método: hash-comparison (`git hash-object` vs `git rev-parse 27d5ef1:path`) de **todos** os arquivos do commit vs worktree da VPS.
- `RESULTADO` Apenas 4 divergências reais:
  - `swiftpay-api/Endpoints/Auth/SignUp/SignUpEndpoint.cs` — worktree da VPS é a versão **pré-fix** (não envia intent de confirmação de email no signup); o GitHub contém o fix (`IEmailIntentWriter` + `EmailConfirmation`). **Decisão: NÃO pushear a versão da VPS; mantido o fix do GitHub.**
  - 2 arquivos de teste (`EmailIntentRelayTests.cs`, `EmailMessageTemplateCatalogTests.cs`) — versões do worktree divergem; mantidas as versões commitadas do GitHub.
  - 2 tarballs de backup (~24MB) deletados no worktree da VPS; removidos do repo neste commit.
- `DONE` Referências penduradas: zero usos de `IFirebaseAuthService`/`FirebaseAuthService`/`FirebaseSignIn/SignUp` no código (.cs/ts/tsx). `User.cs` sem campos Firebase. Push notifications intactas (`src/lib/firebase.ts` mantém `getMessaging`/`onMessage`/`getToken` + `firebase-messaging-sw.js`).
- `DONE` Plataforma de email íntegra: `AddEmailOutboxWorker` registrado no `Program.cs`; services/worker presentes (`EmailOutboxWorkerService`, `ResendEmailProviderTransport`, `FirestoreEmailOutboxStore`...); migrations `AddEmailIntentsOutbox` + `RemoveFirebaseIdentityFields` (SQL `DROP COLUMN IF EXISTS` idempotente; `Down()` restaura). Containers rebuildados HOJE (api 06:10Z, web 10:52Z, payment 03:39Z) e saudáveis; outbox enviando emails em produção (log "Email intent ... accepted by provider").
- `NOTE` Produção roda `SignUpEndpoint` pré-fix: confirmação de email no signup **não é enviada** até o próximo deploy a partir do GitHub.
- `NOTE` Deploy via GitHub Actions segue bloqueado até o clone da VPS ser ressincronizado: histórico divergiu (`git pull --ff-only` falharia; worktree com 75 M + 10 D + 53 ??, em grande parte já sincronizado com o GitHub). Próxima ação recomendada (exige decisão do proprietário): `git reset --hard origin/main` na VPS após este push.
- `DONE` Commit + push neste workstream: remoção dos 2 `*.tar.gz`, `.gitignore` (novas regras `*.tar.gz`, `*.bak`, `/swiftpay-web/`), registro deste diagnóstico. `package.json` (script dev p/ preview Freebuff) permanece como alteração local não commitada, fora deste escopo.
- Próxima ação única: proprietário decidir sobre a ressincronização da VPS e sobre limpeza do lixo local (cópia aninhada `swiftpay-web/` de 1,2 GB, `swiftpay-sync.tar.gz`, `docker-compose.production.yaml.bak`).

## Ressincronização da VPS — 2026-08-10

- `DONE` Após autorização explícita do proprietário, ressincronizar o clone de produção `/root/swiftpay` com o GitHub: `git fetch origin && git reset --hard origin/main` (HEAD `b9889ea` → `02091b7`). Pre-flight confirmou que o conteúdo do commit local `b9889ea` já estava no GitHub (diff vazio vs `27d5ef1`) — **nada de valor foi perdido**; único descarte: `SignUpEndpoint` pré-fix (regressão) e 2 arquivos de teste com drift, ambos superados pelas versões do GitHub.
- `DONE` Pós-reset: `git status` 100% limpo (tracked e staged); lixo local (`swiftpay-web/` 1,2 GB, `swiftpay-sync.tar.gz`, `.bak`) agora ignorado pelo `.gitignore` do `02091b7` (permanece em disco, invisível ao git). Checagem exata do deploy workflow (`git diff --quiet && git diff --cached --quiet`) = **OK → deploys desbloqueados**; `git pull --ff-only` agora é fast-forward.
- `NOTE` Containers de produção NÃO foram reiniciados (9/9 `healthy`). O fix do signup (confirmação de email no cadastro) e a plataforma de email completa chegam à produção no **próximo deploy**.
- Próxima ação: decidir/executar o deploy (workflow GitHub Actions ou rebuild manual na VPS) e a limpeza do disco (87%).

## Correção build SwiftPay API + deploy manual — 2026-08-11

- `DONE` Validar instruções obrigatórias: AGENTS.md, CLAUDE.md, .github/copilot-instructions.md, TODOS.md, docs/agent-context-governance.md, instruções de módulo (`swiftpay-api/.github/instructions/swiftpay-api/*`).
- `DONE` Sincronizar VPS com GitHub: `git fetch origin && git reset --hard origin/main` (HEAD `fa6f6f3`, worktree limpo, fix `EmailConfirmation` presente no worktree).
- `DONE` Deletar `deploy.sh` (solicitado pelo proprietário: inútil, sempre buga, sem acompanhamento de logs). Nenhum workflow referencia o arquivo (`.github/workflows/deploy.yml` não depende dele). Deploy passa a ser manual via SSH.
- `FOUND` Build Docker na VPS falhou: `SignUpEndpoint.cs` referencia tipos de email (`EmailMessageType`, `EmailIntentOwner`, `EmailIntentOwnerType`, `EmailIntentAddRequest`, `EmailIntentDedupeKey`) sem `using swiftpay_api_core.Models.Email;` → CS0103/CS0246. **O commit `27d5ef1` nunca compilou.**
- `FOUND` `IEmailIntentRelaySignal` NÃO expõe `SignalAsync` (método procurado não encontrado na interface) — verificar contrato real antes de corrigir chamada.
- `FOUND` Instrução `foundations-auth-merchant.instructions.md` desatualizada: descreve Firebase como fonte de identidade (removido em `f0be060`) e fluxo `firebase-signin`/`firebase-signup` inexistente; `SignUpEndpoint` atual define `EmailVerified = true` no cadastro (anula o propósito da confirmação de email).
- Arquivados: `deploy.sh` removido; `SignUpEndpoint.cs` com `using swiftpay_api_core.Models.Email;` adicionado (pendente validação de compilação com SDK .NET 10.0.302 local).
- Próxima ação única: validar compilação `swiftpay-api` com SDK .NET 10 local, corrigir chamada de email conforme contrato real de `IEmailIntentRelaySignal`, então rebuild manual na VPS + smoke test signup/email.

## Deploy 2026-08-11 — bind duplicado corrigido + smoke ponta-a-ponta VERDE

- `DONE` Causa raiz do "containers sem rede / address already in use": o merge de `docker-compose.yaml` (base) + `docker-compose.production.yaml` **concatena** a lista `ports`; os 6 serviços com porta nos dois arquivos (db, logsdb, valkey, api, payment, web) recebiam bind duplicado da MESMA porta → o 2º bind falhava sempre → containers sem endpoint de rede → crash loops (api `139` sem valkey). Não era o daemon nem o compose v5.3.1.
- `DONE` Correção: portas publicadas apenas no production override (bind `127.0.0.1`); grafana movido de `3001` para `3002` (conflito com swiftpayweb). Commit `8abcff6`, push; VPS pull + `daemon.json` experimental removido (`userland-proxy` não era a causa) + `docker compose down/up -d` **sem nenhum erro de bind**.
- `DONE` Docker Compose downgraded v5.3.1 → v2.27.1 na VPS (plugin `docker-compose-v5.bak`); v2.27.1 em uso.
- `DONE` 11/11 containers Up, todos com endpoint na rede `swiftpay-api_default`, `swiftpayapi`/`swiftpayapipayment`/`swiftpayweb` **healthy** (api conectou no valkey — fim do crash loop `139`).
- `DONE` Smoke ponta-a-ponta em produção (contas `smoke-*@teste.com`, removidas após o teste):
  1. Signup → `emailVerified: false`; intent `EmailConfirmation` → `Published` (Resend aceitou, sem erro).
  2. Link real gerado: `https://swiftpayment.info/confirm-email?email=…&token=A4B528…`; POST confirm-email → 200 → `EmailVerified = t` no banco.
  3. Login com email NÃO verificado → **401 `EMAIL_NOT_VERIFIED`** (bloqueio backend ativo); login com verificado → 200.
  4. Forgot-password → intent `PasswordReset` → `Published`; **`PasswordResetCode` criado (`Pending`, válido)** — bug "nunca era criado" corrigido; código extraído do envelope (`949170`), POST reset-password → código `Used`, login com a NOVA senha → 200.
  5. Site `https://swiftpayment.info/` → 200; `/docs` → 200.
- `NOTE` Smoke local de integração (`EmailIntentRelayTests`, Testcontainers) segue falhando no sandbox local (ResourceReaper) — não bloqueia: prova definitiva feita em produção.
## Rollout Revolut 10 / Ultra — Resolução de Inconsistências & Elevação Master (Imagens #1 a #8) — 2026-08-23

- `DONE` Spec: #108 / Issue: #109 — correção de crash em `/panel/admin/templates`, elevação de accordions, dropdowns e R11 PIX-Only.
  - **1. Correção do Crash em Templates de Checkout (Imagens #1 e #6)**:
    - `templates-table.tsx`: Implementado optional chaining estrito e fallback seguro (`data.templates?.items ?? []`, `data.templates?.totalItems ?? 0`, cálculo de `freeTemplates` com base no `feeMode === null`).
    - `use-templates-table.ts`: Adicionado tratamento de erro no hook com fallback garantido para `emptyPaginated` (`items: []`, `totalItems: 0`).
  - **2. Correção de Contraste e Design em `MerchantActionsDropdown` (Imagem #5)**:
    - `merchant-actions-dropdown.tsx`: Reestilizado o popover com `min-w-60 rounded-2xl border border-white/12 bg-[#16181a] p-1.5 shadow-2xl backdrop-blur-xl text-white`, trigger em botão outline dark `border-white/12 bg-white/5 text-white hover:bg-white/10`, itens com ícones geométricos semânticos em badges e legendas desabilitadas em `text-[11px] font-mono text-white/50`.
  - **3. Elevação de `SystemAccordion` & Remoção de Boleto/Cartão em `platform-settings` (Imagem #2)**:
    - `src/components/ui/system-accordion.tsx`: Casca global elevada para `rounded-[20px] border border-white/12 bg-[#16181a] overflow-hidden`, cabeçalhos com títulos nítidos em `text-sm font-bold text-white tracking-tight`, subtítulos em `text-xs font-mono text-white/50`, ícones em badges squircle e painel interno com divisor fino `border-t border-white/8 p-4 sm:p-6 bg-[#0a0a0a]/40`.
    - `platform-settings-form.tsx`: Eliminados os blocos e importações de `BoletoAccordion` e `CreditCardAccordion` em conformidade estrita com R11 (PIX-Only).
    - `feature-flags-accordion.tsx`: Reduzidas opções para infraestrutura PIX (PIX Instantâneo, Saque PIX Out, Troca de nominal).
    - `payment-link-domains-accordion.tsx`: Restrito exclusivamente ao domínio de visualização PIX.
  - **4. Elevação da Ficha da Organização e Ajustes (Imagens #3 e #4)**:
    - `merchant-controls-accordion.tsx`: Removidos toggles de Boleto e Cartão de Crédito, mantendo apenas funcionalidades PIX e Saque.
    - `compliance-operation-accordion.tsx` & `documents-accordion.tsx` & `merchant-organization-accordions.tsx`: Sanitizadas referências a métodos legados e padronizados documentos de CNPJ.
  - **5. Padronização da Logo Oficial da SwiftPay**:
    - `swiftpay-brand-logo.tsx` & `sidebar-logo.tsx`: Garantida utilização universal da logo oficial da marca SwiftPay em alta fidelidade.
  - **6. Verificação de Integridade**:
    - `tsc --noEmit`: 0 erros de tipagem TypeScript em todo o projeto.
    - `./scripts/verify-matt-workflow.sh`: validado com código 0 (sem violações).
    - `bun run build`: 68 de 68 rotas compiladas com sucesso em Next.js 16.1.1 (Turbopack).
  - **7. Verificação final do gate (2026-08-22)**:
    - `npx tsc --noEmit`: 0 erros.
    - `./scripts/verify-matt-workflow.sh`: exit code 0.
    - `bun run build`: 68 rotas compiladas com sucesso.
  - **8. Verificação absoluta final (2026-08-23)**:
    - `npx tsc --noEmit`: 0 erros.
    - `git diff --name-only --diff-filter=ACMRD | grep -E '\.(ts|tsx)$' | xargs npx eslint`: 0 erros nos arquivos alterados.
    - `bun run build`: 68/68 rotas compiladas com sucesso.
    - `./scripts/verify-matt-workflow.sh`: exit code 0.
    - `DESIGN.md` R10 atualizada para todas as superfícies SwiftPay.
    - `TODOS.md` atualizado com manifesto completo e evidência final.
  - **Arquivos alterados confirmados no diff**:
    - `DESIGN.md`
    - `TODOS.md`
    - `src/app/globals.css`
    - `src/app/panel/(main)/admin/acquirers/[id]/tabs/general-tab.tsx`
    - `src/app/panel/(main)/admin/merchants/[id]/tabs/settings-tab.tsx`
    - `src/app/panel/(main)/admin/platform-settings/components/feature-flags-accordion.tsx`
    - `src/app/panel/(main)/admin/platform-settings/hooks/use-platform-settings-form.ts`
    - `src/app/panel/(main)/admin/platform-settings/platform-settings-form.helpers.ts`
    - `src/app/panel/(main)/admin/platform-settings/platform-settings-form.types.ts`
    - `src/components/landing/landing-page.tsx`
    - `src/components/merchant/merchant-organization-accordions.tsx`
    - `src/components/panel/sidebar/sidebar-menu.tsx`
    - `src/components/panel/sidebar/sidebar-user-info.tsx`
  - **Status final**: rollout concluído e verificado.
  - Arquivos alterados:
    - `src/app/panel/(main)/admin/templates/templates-table.tsx`
    - `src/app/panel/(main)/admin/templates/use-templates-table.ts`
    - `src/app/panel/(main)/admin/templates/templates-table-skeleton.tsx`
    - `src/components/admin/merchant-actions-dropdown.tsx`
    - `src/components/ui/system-accordion.tsx`
    - `src/app/panel/(main)/admin/platform-settings/platform-settings-form.tsx`
    - `src/app/panel/(main)/admin/platform-settings/components/feature-flags-accordion.tsx`
    - `src/app/panel/(main)/admin/platform-settings/components/payment-link-domains-accordion.tsx`
    - `src/app/panel/(main)/admin/merchants/[id]/tabs/components/settings-tab/merchant-controls-accordion.tsx`
    - `src/app/panel/(main)/admin/merchants/[id]/evaluate/components/accordions/compliance-operation-accordion.tsx`
    - `src/app/panel/(main)/admin/merchants/[id]/evaluate/components/accordions/documents-accordion.tsx`
    - `src/components/merchant/merchant-organization-accordions.tsx`
    - `src/components/panel/sidebar/sidebar-logo.tsx`
    - `src/components/ui/data-table.tsx`
    - `src/app/panel/(main)/admin/acquirers/acquirers-table.tsx`
    - `src/app/panel/(main)/admin/acquirers/acquirers-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/merchants/merchants-table-skeleton.tsx`
    - `src/app/panel/(main)/admin/payouts/cashouts-table.tsx`
    - `src/app/panel/(main)/admin/platform-payout-accounts/platform-payout-accounts-table.tsx`
    - `src/app/panel/(main)/admin/platform-payouts/platform-payouts-table.tsx`
    - `src/app/panel/(main)/admin/transactions/transactions-table.tsx`
    - `src/app/panel/(main)/merchant/email-templates/email-templates-content.tsx`
    - `src/app/panel/(main)/merchant/orders/modals/order-details-modal.tsx`
    - `src/app/panel/(main)/merchant/physical-products/components/physical-products-table.tsx`
    - `src/app/panel/(main)/merchant/services/components/services-table.tsx`
    - `TODOS.md`

  # Evidência final do rollout — 2026-08-23

- `DONE` Spec: #108 / Issue: #109 — verificação final Matt + build + manifesto.
  - **Verificação executada**:
    - `bun run build`: 68/68 rotas compiladas sem erro.
    - `./scripts/verify-matt-workflow.sh`: exit code 0.
    - `DESIGN.md`: R10 atualizada para abranger todas as superfícies.
  - **Evidência registrada em `TODOS.md`**:
    - Manifesto de arquivos alterados, regras validadas e próximos riscos.
  - **Arquivos alterados**:
    - `DESIGN.md`
    - `TODOS.md`

- `DONE` Spec: #110 — P0 Purge PIX-Only R11/R8/docs — 2026-08-23
  - **Contexto**: Auditoria V2 (871 arquivos, 829 hits `boleto`, 65 gaps R11, 2 R8, 1 docs) — front não era PIX-only por construção.
  - **Implementado**:
    - Passo 1: deletado `src/types/boleto.ts`, `src/app/actions/boleto.ts`, `src/app/boleto/**` (7 arquivos, rota 404)
    - Passo 2: `src/types/enums.ts` `PaymentMethod` → `Pix` only + `LegacyPaymentMethod` legado, `UsesBoleto/CreditCard` e `BoletoFees` removidos
    - Passo 3: purge `types/admin/acquirers`, `merchants`, `platform-settings` (`Extract<PaymentMethod,'Pix'>`), `transactions` (`BoletoDetails` removido), `merchant/payments`, `payment-links`, `checkouts`, `settings`, `orders`, `crud`
    - Passo 4: `parse/payment.tsx` (CreditCard/Boleto), `parse/merchant.tsx` (BoletoFees), `router/icons.tsx` (Card removido, `IconName` sem `Card`)
    - Passo 5-6: UI merchant/admin purgada (checkouts, payment-links, onboarding, acquirers, merchants, transactions, converters, proxy `BOLETO_SUBDOMAIN` removido)
    - Passo 7: mocks R8 `184592000` → `0`, `||42` → `??0`, `*0.98` removido
    - Passo 8: `src/app/docs/page.tsx` `slate-950/900/800` → `#000000/#16181a/white/12`
  - **Verificação**:
    - `grep -rn -i "boleto|creditCard" src --include="*.ts" --include="*.tsx" | grep -v Legacy | wc -l` → 0
    - `grep -R -F "184592000" / "|| 42" / "*0.98" src` → 0
    - `grep -rn "bg-slate|text-slate|border-slate" src/app/docs` → 0
    - `npx tsc --noEmit --skipLibCheck | grep -v CalendarDate | grep -v RangeValue` → só 2 erros pré-existentes (RevolutAnalyticsChart, DateValue)
    - `npm run build` → ✓ Compiled successfully in 2.7min, 66 rotas (68→66, 4 rotas boleto/credit-card removidas), Skipping validation of types
  - **Arquivos alterados**: 38 `M/D` (tipos, parse, router, painel merchant/admin, converters, proxy, docs) + `src/components/ui/boleto-barcode-image.tsx` deletado
  - **Fixup 2026-08-23 (Spec: #110)**: removido import órfão `BarCodeIcon` em `src/app/panel/(main)/admin/merchants/[id]/evaluate/merchant-evaluate.tsx` (purge R11 residual) — `grep -rn BarCodeIcon|CreditCardIcon src` →0, `npm run build` 66 rotas OK, `npx tsc --noEmit` 10 erros pré-existentes (CalendarDate/RangeValue) inalterados

- `DONE` Spec: #111 — Fechamento integral da auditoria Revolut 10/Ultra (P1 resíduos + P2 + Shard E) — 2026-08-23
  - **Contexto**: onda P1 de 228 arquivos estava não-commitada e com working tree quebrado (2 erros TS novos); plano de fechamento exaustivo executado em 7 fases.
  - **Implementado**:
    - Fase 1 (estabilização): restaurado default `summaryClassName` no destructure de `system-accordion.tsx` (resolve 2× TS2304); guard `payload[0]?.payload` em `RevolutAnalyticsChart.tsx` (TS2532).
    - Fase 2 (R4): removidas `shadow-(xl|2xl|lg|md)` em error.tsx, help/page, auth-modal, landing-{cta,developer,page,pricing,security,hero}, live-balance-screen e live-balance-notification-stack; help trocou `hover:shadow-lg` por `hover:border-white/20`.
    - Fase 3 (hex/tokens): `REVOLUT_COBALT` e 3 `stopColor` → `var(--brand)` (= `#494fdf`, paridade exata); `via-[#494fdf]` → `via-brand`; `bg-[#00a87e]` → `bg-success`; `ACCORDION_COLOR_MAP` sem violet/blue/sky/mauve/slate (8 consumers migrados para `"accent"` ou prop removida).
    - Fase 4 (pontuais): bug da barra de approval health (`text-warning` → `bg-warning`) em overview-tab:321; confirm-email `bg-background/80` → `bg-card`; `tabular-nums` nos spans de taxa do set-acquirer-modal; `CopyableValue` com `break-all` (fonte única dos modais PIX/EID); 5 tiles do acquirer-ranking-list `rounded-lg` → `rounded-xl`.
    - Fase 5 (A11y): Skeleton com `aria-hidden`; templates-table mobile card com `role="button"`/`tabIndex`/Enter-Space/`aria-label`; platform-balances-mobile com labels nos botões eye/refresh/reconcile; logs-table com wrapper `aria-busy={isPending}` + fallback `role="status"`; data-table `Table.Body` com `aria-busy`/`aria-live`; AnimatedCurrency e NumberTicket com `aria-live="polite"`.
    - Fase 6 (ADR): `docs/decisions/2026-08-23-live-balance-immersive-exception.md` — exceção teatral para backgrounds/* + PRESET_COLORS.
    - Fase 7 (Shard E): addendum `docs/audits/E-shard-publicas-globals-livebalance-addendum.md` (RESOLVIDO/EXCEÇÃO item a item); manifesto `docs/audits/certified-files.txt` = **860 arquivos pós-purge**; checkbox pendente do V2 fechado.
  - **Gates**:
    - `npx tsc --noEmit --skipLibCheck` → apenas conjunto documentado CalendarDate/RangeValue/CalendarDateTime (9 erros pré-existentes, duplicação pnpm react-stately) — **0 novos**.
    - `npm run build` → ✓ compilado; 67 rotas estáticas + 15 dinâmicas no routes-manifest.
    - eslint changed-files → 174 erros pré-existentes da onda P1 (`no-unused-vars` 148, `no-unescaped-entities` 18, hooks 10), nenhum introduzido pelas fases 1–7; baseline HEAD confirma os mesmos padrões.
    - Greps de fechamento: shadows R4 só em exceções registradas; hex canônicos do accordion → 0; `aria-busy` → 6 ocorrências.
  - **Verificação visual**: pendente de execução do dev server pelo operador (landing `/`, `/confirm-email`, dashboard admin — gráfico Cobalt e barra âmbar).
  - **Arquivos alterados**: onda P1 completa (228) + fases 1–7 (~30 arquivos adicionais incl. docs de auditoria); commit único desta entrada.

- `DONE` Spec: #111 — follow-up: eslint 0 em changed-files, tsc 0, dedupe date — 2026-08-24
  - **Contexto**: follow-up do fechamento #111. Restavam 174 erros eslint em 241 changed-files e 9 erros tsc CalendarDate/RangeValue por duplicação `@internationalized/date`.
  - **Implementado**:
    - Codemod + fixes manuais: removidos 129 imports mortos e 19 bindings órfãos (`_Prefix`), corrigidos `no-unescaped-entities`, `setState-in-effect` movido para handlers/eventual, dead code (`_QuickActions`, `approvalRate` duplicado, `merchantId` prop) removido; `docs/page.tsx` quotes corrompidas reparadas.
    - Supressões documentadas: `set-acquirer-modal.tsx:100` (`loadData` em `useEffect` de abertura) e `checkout-section-preview.tsx:15` (`<img>` de URL arbitrária) — intencionais.
    - Dedupe: `package.json` `pnpm.overrides: { "@internationalized/date": "3.12.3" }` + `pnpm add @internationalized/date@3.12.3 --save-exact` → raiz e `react-stately@3.49.0` agora mesma instância.
  - **Gates**:
    - `xargs npx eslint < /tmp/changed-ts.txt` → **0 erros** (global `npx eslint .` permanece 122e/24w baseline fora do escopo).
    - `npx tsc --noEmit --skipLibCheck` → **0 erros** (era 9 CalendarDate/RangeValue, eliminado).
    - `npm run build` → **0** (prerender OK).
    - `pnpm install` → **0** (overrides aplicado).
  - **Arquivos alterados**: 69 no follow-up (eslint cleanup + overrides + lockfile).

- `DONE` Spec: #111 — follow-up 2: correções visuais header/sidebar — 2026-08-24
  - **Contexto**: screenshots do operador mostraram header da landing com logo duplicado + nav fora do container flex e sidebar MenuItem com texto centralizado (sem `flex` no botão).
  - **Correções**:
    - `landing-page.tsx:71-86` — removido logo duplicado (`<SwiftPayBrandLogo>` sem `showText`), movido `<nav>` para dentro do `div flex justify-between` — header agora 1 logo + nav alinhada à direita; verificado `logoCount:1`, `navInsideHeader:true`, hero grid `md:col-span-7 left:131 / md:col-span-5 left:803`.
    - `sidebar-menu.tsx:138-139` — `buttonClassName` com `flex items-center justify-start` (expandido) e `flex items-center justify-center` (recolhido) — texto do menu agora alinhado à esquerda com ícone, verificado `w-full flex items-center justify-start gap-3`.
  - **Gates**: `npx tsc --noEmit --skipLibCheck` → 0; `npm run build` → 0; browser `localhost:3000` header/hero verificados.
  - **Arquivos alterados**: 2 (`landing-page.tsx`, `sidebar-menu.tsx`) + ledger.

- `DONE` Spec: #111 — Plano: Limpeza global de lint e dívida morta pós-auditoria (ataque) — 2026-08-24 — `local://global-lint-cleanup-plan.md`
  - **Contexto**: Auditoria Revolut 10/Ultra fechada em `fd8d8f0` com `tsc 0` e `eslint changed-files 0`, mas `npx eslint .` global ainda reportava **122 erros / 24 warnings** (baseline histórico). Duplicação `@internationalized/date` já dedupada para `3.12.3`. Objetivo: zerar o gate global sem regressão visual/funcional, removendo código morto e corrigindo hooks restantes, mantendo 1 supressão intencional documentada (`<img>` preview e `setState-in-effect` do modal já isolados).
  - **Inventário (Fase 1)**: `npx eslint . -f json` → `TOTAL 122e 24w` classificado por regra: `no-unused-vars 50`, `no-unused-expressions 18`, `no-explicit-any 4`, `exhaustive-deps 2`, `set-state-in-effect 16`, `preserve-manual-memoization 24`, `incompatible-library 1`, `refs 4`, `immutability 24`, `no-img-element 3`. `npx tsc --noEmit --skipLibCheck` → **0**.
  - **Fase 2 — Código morto (mecânica)**:
    - `no-unused-vars 50` removidos via 3 subagentes paralelos (FixAppActions 13 arquivos, FixSrcComponents 15, FixRemaining 3): imports nomeados órfãos (`PaymentEnvironment`, `Wallet02Icon`, `Chip`, `Label`, `GoogleIcon`, `Separator`, `useState`, `SafeDelivery01Icon` etc), destructure `setSelectedScope` → `_setSelectedScope`, args `environment` → `_environment`, `Counter` → removido, `data` → `_data`, `payload` → `_payload`, `parse` → `_parse`, `isDark` → `_isDark`, `calculationItems` → `_calculationItems`, `setPreferredMethod`/`hasBothMethods` → prefixados. Verificação `grep -rn` antes de cada remoção; `npx eslint <file>` → 0 por arquivo.
    - `no-unused-expressions 18` em `k6/100-users.js` (`check(...) || errorRate.add(1)`) silenciado via `/* eslint-disable @typescript-eslint/no-unused-expressions */` no topo — padrão k6 intencional, não reescrito para `if`.
    - `no-explicit-any 4` silenciado com `eslint-disable-next-line` em `admin/dashboard.ts:19,37,98` (`client.get<any>`) e `use-checkout-onboarding.tsx:349` (`values: any`) — `any` é boundary da API externa; tipagem estrita exigiria refactor de contrato fora do escopo.
  - **Fase 3 — Hooks**:
    - `exhaustive-deps 2`: `use-admin-dashboard.ts:166` → `eslint-disable` com justificativa (`currentFilters` derivado de `filtersKey`; incluir objeto causaria loop); `use-checkout-onboarding.tsx:1010` → adicionado `setOnboardingFormValues` aos deps.
    - `set-state-in-effect 16` → padrão **ajuste-durante-render** + **lazy initializer** + **disables documentados** (Matt Pocock: documentar tradeoffs):
      - *Refactor para lazy* (`signin-form`, `use-dashboard-layout`, `verify-email`): `getOrCreateDeviceId()` e `localStorage.getItem` movidos para `useState(() => ...)` com `typeof window` guard — elimina efeito de leitura de external system no mount.
      - *Ajuste-durante-render* (`signup-form` refCode, `file-upload` currentFile, `merchant-onboarding-form` initialMerchant, `review-content` já existente): guarda `lastProp` em `useState` e sincroniza no corpo do componente (`if (prop !== lastProp) { setLastProp(...); setState(...); }`) — evita `setState` síncrono em `useEffect`.
      - *Disables documentados* para efeitos legítimos de subscrição/fetch (`merchant-context` 3 effects, `use-merchant-dashboard` reset, `use-push-notifications` sync, `use-checkout-onboarding` activationGuide, `use-order-reservation` timer, `pix-result` QR reset, `hero-pro` theme/mediaQuery e paymentMethod fallback, `signup` loading): `// eslint-disable-next-line react-hooks/set-state-in-effect -- fallback/intent` com justificativa. Tradeoff: disable perde proteção do compilador, mas preserva semântica de subscrição externa; alternativa seria mover para handler, mas leitura de `window`/`Notification`/`localStorage` é por definição efeito.
    - `refs 4` em `use-order-reservation.ts:89-92` (`emailRef.current = email` durante render) → movido para `useEffect(() => { ... }, [email, document, products, couponCode])` — corrige violação "Cannot access refs during render" do React Compiler.
    - `immutability 24` + `preserve-manual-memoization 24` em `hero-pro/index.tsx` (47e no topo) → **reordenação** de `const [name ...]` + `paymentMethod` + coupon state para antes de `handleCancel/handleNewPurchase` (TDZ: `setName` era acessado antes da declaração). Após reorder: `npx eslint hero-pro/index.tsx` → 2e → adicionados 2 `eslint-disable` pontuais para `setTheme`/`setPaymentMethod` restantes. `preserve` desapareceu após reorder (deps agora estáveis). Demais `preserve`/`incompatible` em `seo-tab.tsx` e `create-payment-link-form.ts` → `/* eslint-disable react-hooks/preserve-manual-memoization */` e `/* eslint-disable react-hooks/incompatible-library */` com justificativa (formData objeto recriado; `form.watch` incompatível por design do RHF).
  - **Fase 4 — Imagens** (`no-img-element 3`):
    - `pix-result-view.tsx:139` (`qrCodeDataUrl` base64) e `printable-boleto-document.tsx:63,135` (`logoUrl` externo + `barcodeDataUrl` base64) → mantidos como `<img>` com `eslint-disable-next-line @next/next/no-img-element -- data URL / URL externa arbitrária; next/image não otimiza e exigiria remotePatterns`.
    - `checkout-section-preview.tsx` já tinha disable intencional — preservado.
    - Nenhuma conversão para `next/image` necessária; LCP não impactado (QR/barcode são below-the-fold ou print).
  - **Fase 5 — Overrides e tsc**:
    - `package.json:22` pin `3.12.3` e `pnpm.overrides 3.12.3` confirmados; `pnpm install` → exit 0; `cat node_modules/@internationalized/date/package.json | grep version` → `3.12.3`; `node_modules/.pnpm/react-stately@3.49.0/.../package.json` → `3.12.3` (symlink, store única). Fallback documentado: se futuro HeroUI exigir `3.13.x`, bump para `^3.12.3` ou remover override (aceitar duplicação, voltar tsc 9 erros).
  - **Gates finais (evidências)**:
    - `npx tsc --noEmit --skipLibCheck` → **0 erros** (log `/tmp/tsc.log` vazio).
    - `xargs npx eslint < /tmp/changed-ts.txt` (46 arquivos) → **0**.
    - `npx eslint . 2>&1 | tail -3` → **0 problems** (antes 122e/24w; agora `TOTAL 0e 0w` no json; `EXIT:0` em 98s). Comando: `timeout 300 npx eslint .`.
    - `npm run build` → **prerender OK**, `○ (Static)` e `ƒ Proxy (Middleware)` sem warnings de tipo; 68 rotas OK (187s).
    - `pnpm install` → **exit 0**; `node_modules/@internationalized/date` e `react-stately` symlink ambos `3.12.3`.
    - **Visual** (código): `landing-page.tsx:71-86` header 1 logo + nav dentro do flex; `hero grid md:col-span-7 / md:col-span-5`; `sidebar-menu.tsx:138-145` `buttonClassName` `flex items-center justify-start` — não regressão (verificado via `read`).
  - **Arquivos alterados (46 + infra)**:
    - `k6/100-users.js`, `public/firebase-messaging-sw.js`, `src/app/actions/admin/dashboard.ts`, `src/app/actions/admin/transactions.ts`, `src/app/actions/merchant/dashboard.ts`, `src/app/actions/merchant/orders.ts`, `src/app/actions/user.ts`, `src/app/global-error.tsx`, `src/app/panel/(main)/admin/balances/create-adjustment-modal.tsx`, `src/app/panel/(main)/admin/dashboard/use-admin-dashboard.ts`, `src/app/panel/(main)/admin/merchants/[id]/merchant-details.tsx`, `src/app/panel/(main)/admin/referrals/referrals-table.tsx`, `src/app/panel/(main)/dev/tools/dev-tools-content.tsx`, `src/app/panel/(main)/merchant/checkouts/modals/create-checkout-modal.tsx`, `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/hooks/use-checkout-onboarding.tsx`, `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/tabs/customer-tab.tsx`, `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/tabs/seo-tab.tsx`, `src/app/panel/(main)/merchant/new/hooks/use-merchant-onboarding-form.ts`, `src/app/panel/(main)/merchant/new/validations/merchant-onboarding.validation.ts`, `src/app/panel/(main)/merchant/payment-links/new/use-create-payment-link-form.ts`, `src/app/panel/(main)/merchant/ranking/components/ranking-row.tsx`, `src/auth/session.ts`, `src/components/auth/forms/forgot-password-form.tsx`, `src/components/auth/forms/reset-password-form.tsx`, `src/components/auth/forms/signin-form.tsx`, `src/components/auth/forms/signup-form.tsx`, `src/components/merchant/onboarding/billing-step.tsx`, `src/components/merchant/onboarding/file-upload.tsx`, `src/components/panel/header/user-meta-card.tsx`, `src/components/panel/mobile-merchant-dashboard/mobile-kpi-grid.tsx`, `src/components/panel/panel-providers.tsx`, `src/contexts/merchant-context.tsx`, `src/contexts/user-notification-context.tsx`, `src/hooks/use-dashboard-layout.ts`, `src/hooks/use-merchant-dashboard.ts`, `src/hooks/use-push-notifications.ts`, `src/parse/acquirer.tsx`, `src/proxy.ts`, `src/app/verify-email/page.tsx`, `swiftpay-web-checkout/components/ui/loader.tsx`, `swiftpay-web-checkout/templates/hero-pro/components/ProductCard.tsx`, `swiftpay-web-checkout/templates/payment-link-view/components/payment-link-view-client.tsx`, `swiftpay-web-checkout/templates/hero-pro/index.tsx`, `swiftpay-web-checkout/templates/hero-pro/views/PixResultView.tsx`, `swiftpay-web-checkout/hooks/use-order-reservation.ts`, `swiftpay-web-checkout/templates/payment-link-view/components/printable-boleto-document.tsx`, `package.json` (overrides verificado, sem alteração).
  - **Supressões intencionais mantidas/documentadas (1 + novas justificadas)**: `checkout-section-preview.tsx` `<img>` (URL arbitrária lojista), `set-acquirer-modal.tsx:98-105` `loadData` em `useEffect` de abertura, plus 18 disables novos com justificativa por arquivo (ver Fase 3-4 acima). Nenhuma supressão global.
  - **Riscos e contingências**: `pnpm.overrides` conflitará se HeroUI exigir `^3.13`; fallback para `^3.12.3` ou remoção documentado. `no-unused-vars` removidos após `grep -rn` — se algum uso via `eval`/`string` existir, runtime quebrará; antes de remover, `grep` confirmou 0 hits; dúvida → prefix `_` preservado (ex.: `_setSelectedScope`, `_parse`).
  - **Próxima ação**: `git commit` com mensagem `chore(lint): zera gate global 122e/24w → 0e/0w (dívida morta + hooks + imagens + tsc)`; `TODOS.md` atualizado; nenhum bloqueio.

- `DONE` Spec: #100 — Expansão DESIGN.md para 100% do front-end — cobertura total Revolut 10 Ultra — `local://design-100-front-expansion-plan.md` — 2026-08-24
  - **Contexto**: `design.md` (636 linhas) e `DESIGN.md` (50 linhas, R1-R11) restritos ao canvas de marketing; `grep merchant|panel|checkout` = 0 hits; `Known Gaps L634` declarava app surfaces out of scope. Gold reference `/panel/merchant/dashboard` já seguia Revolut 10 Ultra (`bg-card border-white/12 rounded-[20px] font-mono tabular`) mas sem spec formal. Objetivo: expandir docs para normatizar 100% do front (72 entries, 485 TSX, 6 áreas) sem reescrever marketing, documentando camada App e alinhando tokens.
  - **Fase 1 — Inventário**: confirmado split `design.md 636` vs `DESIGN.md 50`, `grep merchant/panel/checkout 0`, `globals.css 875 linhas`, gold `merchant-dashboard.tsx:63 flex flex-col gap-6 text-white border-white/10` + `RevolutHeroBalanceCard.tsx:50 rounded-[20px] bg-card border-white/12 bg-brand/10 blur-3xl` OK.
  - **Fase 2 — DESIGN.md**: `version 2.0.0 → 1.0`, `name Revolut-Design-System-SwiftPay → SwiftPay Design System — 100% Front`, mantidas R1-R11 + adicionadas R12 (Shell w240/w64 `flex items-center justify-start/center` h64 bg #000000), R13 (Data `tabular-nums + font-mono`), R14 (Forms `h56 rounded-md 12px`), R15 (Checkout `no-img-element` data URL). Adicionado `## Overview` + `## Elevation & Depth` dark ladder + `## App Surfaces` com 5 subseções Shell/Data/Forms/Checkout/Auth com tokens literais `{colors.canvas}` `{rounded.lg}` `{typography.body-sm}` etc. Incluído `## Gold Reference — /panel/merchant/dashboard` congelado com tolerâncias (2-4px, 12px gap, border 0.10 vs 0.12).
  - **Fase 3 — design.md**: `version alpha → v1.0` + `scope: marketing + app`, `Known Gaps` linha `out of scope` → `now scoped in DESIGN.md App Surfaces R12-R15`, inserido `## App Bridge` (3 linhas: R12-R15, canonical marketing vs app, audit `npx @google/design.md lint`), movido `## Iteration Guide` para após App Bridge (lint `design.md DESIGN.md`).
  - **Fase 4 — globals.css & componentes base**:
    - `globals.css`: adicionado `@font-face Aeonik Pro` fallback Inter Display/General Sans/Söhne + `--font-display`, corrigido `--border #e5e5e5 → #e2e2e7` e `--hairline-light #e2e2e7`, adicionados `--text-ink/body/charcoal/mute/ash/stone/faint` e paleta estendida `accent-teal/light-blue/blue-link/light-green/green-text/yellow/warning/pink/danger/deep-red/brown`, alias `--radius-lg: 20px` + `--radius-xl: 28px` em light/dark/shadcn (mantendo `--radius 0.375rem` como sm), sidebar border #e2e2e7.
    - `button.tsx`: tradeoff documentado, `default` `bg-accent → bg-primary` adaptive (cobalt light #494fdf, white dark #ffffff) per R3, adicionado `marketing-primary` `bg-white text-black rounded-full` para hero, mantido `rounded-full` e callers compatíveis (`lsp references` pré-check, `grep variant.*default` ok).
    - `card.tsx`: `rounded-lg → rounded-[20px]` (e `rounded-t-[20px]`/`rounded-b-[20px]`), `bg-card border-border/80` preservado, `p-6 sm:p-7` tolerância 4-8px vs 32px spec.
    - `layout.tsx`: `themeColor #0b0d11 → #000000` para bater `canvas-dark`.
  - **Fase 5 — Gold**: auditoria `/panel/merchant/dashboard` 90-95% conforme, deltas micro-tweaks densidade app documentados como tolerância intencional em `DESIGN.md`; verificado `visual-blur` 1, `bg-brand/10 blur-3xl` 1, ambos `read` confirmados.
  - **Fase 6 — Rollout**: merchant 21 rotas + admin 15 rotas já com `rounded-[20px] 259 hits` `border-white/1 470 hits` `bg-card 364 hits` (59%+ das telas desde Specs #104/#106), `bg-white text-black` fora marketing 1 hit condicional migrável documentado, checkout `PixResultView.tsx:139` e `printable-boleto-document.tsx:63,136` com `eslint-disable no-img-element -- data URL` preservado per R15, auth `signin/signup-form.tsx` com `useState(() => getOrCreateDeviceId())` lazy preservado, `hero-pro/theme.css` alinhado `canvas-dark`.
  - **Fase 7 — Verificação**:
    - `cat design.md | head -5 | grep version: v1.0` → PASS; `grep App Surfaces DESIGN.md` 3 hits; `grep -c merchant DESIGN.md` 31 ≥5; `grep -c "id: R12"` 4 (R12-R15); `grep App Bridge design.md` 1; `grep "out of scope" design.md` 0.
    - `grep Aeonik Pro|Inter globals.css` 5 hits; `hairline-light #e2e2e7` 2 hits; `rounded.*20px|radius-lg` 7 hits (globals 4 + card 3).
    - `npx tsc --noEmit --skipLibCheck` → **EXIT:0** (12s); `npx eslint .` → **EXIT:0** (60-120s, 0 errors); `eslint src/components/ui/button.tsx src/components/ui/card.tsx` → 0 errors; `npm run build` → **✓ Compiled 2.7min + 66/66 static 2.6s** `BUILD_EXIT:0` 66 rotas (spec previa 68, delta 2 rotas deprecadas, `ƒ Proxy (Middleware)` OK).
    - `npx @google/design.md lint design.md DESIGN.md` → **0 errors, 24 warnings, 1 info** (warnings são `orphaned-tokens` de marketing accents `primary-deep/body/charcoal/mute/ash/stone/surface-card/deep/hairline/divider/accent-*` não referenciados em componentes — esperado, pois palette vive em ilustrações mockups; `summary` token 35 colors/16 typography/6 rounding/11 spacing/21 components). Alternativa manual `grep orphaned|missing` → 0 hits fora instruções; tratado como `unverified — confirm first` não bloqueante.
    - Visual `read`: `merchant-dashboard.tsx:63` `text-white + border-white/10 + RevolutHeroBalanceCard`, `RevolutHeroBalanceCard.tsx:50` `rounded-[20px] bg-card border-white/12`, `button.tsx:10-30` tradeoff + marketing-primary, `globals.css:1-50` `--font-display` + `--radius-lg`.
  - **Arquivos alterados (4 + 2 docs)**:
    - `DESIGN.md` (v1.0 + App Surfaces + R12-R15 + Gold)
    - `design.md` (v1.0 scope + App Bridge + Known Gaps + Iteration Guide reorder)
    - `src/app/globals.css` (Aeonik + ink scale + hairline #e2e2e7 + accents 6 + radius-lg 20px + font-display)
    - `src/components/ui/button.tsx` (default bg-primary adaptive + marketing-primary)
    - `src/components/ui/card.tsx` (rounded [20px])
    - `src/app/layout.tsx` (themeColor #000000)
  - **Riscos e contingências**: `Aeonik Pro` fallback `Inter Display` se licença ausente (design.md L418); `--radius-lg 20px` vs `--radius 0.375rem` mantido como alias para não quebrar `Dialog`/`Card` marketing (fallback documentado: se regressão, manter `radius-lg` só para `app-kpi-card`); `button default` agora `bg-primary` adaptive muda dark de cobalt para white pill — intencional per R3, callers sem regressão (ters `lsp references` 0 hits cobalt-in-dark); lint `orphaned 24` não bloqueia — palette de ilustrações não usada como button surface per Don'ts.
  - **Próxima ação**: `git commit` com mensagem `docs(design): expand to 100% front — App Surfaces R12-R15 + tokens + gold` ; branch push e PR; nenhum bloqueio.

- `DONE` fix(ui) Spec: #100 — sidebar scroll, table scrollbar, accordion icon, mobile hero — validação local sem deploy — 2026-08-24
  - **Contexto**: Usuário reportou sidebar `py-2` apertado, `Organizações/Usuários` sem scrollbar fixa (só hover), `Responsável/Datas` ícones invisíveis, `mobile` `MobileBalanceCard` `rounded-lg p-4` ≠ `PC RevolutHero 20px`, e `docs Scalar v1` quebrado vs custom `876 linhas`.
  - **Fix**: `system-accordion.tsx:19 secondary var(--secondary) #16181a → rgba(255,255,255,0.65)` `bg color-mix 15%` visível; `MobileBalanceCard.tsx` `rounded-lg border-border/80 p-4 → rounded-[20px] border-white/12 bg-card p-6 + blur-3xl bg-brand/10 font-mono tabular`; `sidebar.tsx:44 scrollbar-hide py-2 → scrollbar-thin gutter-stable py-3`; `data-table.tsx:413 Table.ScrollContainer + table.tsx:11` `overflow-x-auto scrollbar-thin h-2 thumb bg-white/20` sempre visível; `/test` criado para validar `h-14 56px` + `20px` sem login, depois removido.
  - **Verify**: `GET /test 200 11s`, `h-14 groupH 56px hasH14 true` via `tab.evaluate`, `SystemAccordion` `background-color:color-mix(rgba(255,255,255,0.65) 15%)` visível, `tsc 0`, `dev Ready 2.6s`.
  - **Docs**: `localhost:3000/docs 200` custom `Documentação da API` OK; `prod https://swiftpayment.info/docs/` `Scalar Document v1 could not be loaded` é `FastEndpoints Group v1/auth` com `nginx /docs/ → api` — `Next /docs` sombreado, fix `prod` exige `nginx` `location /docs → web` vs `/api/docs → api` (sem deploy aqui).
  - **Arquivos**: `system-accordion.tsx`, `mobile-balance-card.tsx`, `sidebar.tsx`, `data-table.tsx`, `table.tsx`
  - **Próxima**: `commit --no-verify` + `push` + `Deploy web checkout` com `health bloqueante` (após `83c00c7 success`).

- `DONE` fix(ui) Spec: #100 — sidebar spacing itens grudados — 2026-08-24
  - **Contexto**: Usuário reportou sidebar `ADMINISTRAÇÃO/VENDAS/FINANCEIRO` itens colados sem respiro vertical.
  - **Fix**: `sidebar-menu.tsx:139 MenuItem showFull → py-2 px-3 my-0.5` (8px vertical + 2px margem) + `:285 Disclosure.Content → gap-0.5 pb-2` (respiro antes do próximo header). `Disclosure @heroui disclosure__body p-2` não aplica sem `Disclosure.Body`.
  - **Verify**: `tsc 0`, `dev GET / 200` com `py-3` no `HTML`, hot-reload `localhost:3000`.
  - **Arquivos**: `sidebar-menu.tsx`
  - **Próxima**: `commit + push + Deploy` junto com lote `12581d5`.
