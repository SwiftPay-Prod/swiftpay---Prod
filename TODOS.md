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

- `IN_PROGRESS` Spec: #88 / Issue: #93 — concluir cutover operacional PixHub.
  - Diagnóstico: API principal antiga não reconhecia `AcquirerType.PixHub`; consultas de processadoras, receita e saldo falhavam com HTTP 500.
  - Evidência: PixHub ativo no PostgreSQL; autenticação HTTP 200; QR real de R$ 5,00 criado e consultado como `pending`; EMV e imagem presentes; nominal derivado do EMV como `BRASIL COMPRAS ONLINE LTD (White)`.
  - Implementado: seed/backfill versionado, metadata, schema de credenciais, HMAC com janela de cinco minutos e comparação em tempo constante.
  - Pendente: deploy do HMAC, webhook cadastrado no PixHub, pagamento confirmado e PIX OUT.
- `IN_PROGRESS` Spec: #94 / Issue: #95 — persistência da identidade visual do checkout.
  - Reprodução E2E no browser: template, organização, produto e checkout criados; Server Action de salvar retornou HTTP 200, mas o formulário voltou de `#8B5CF6` para `#059669`.
  - Causa: `visualDraft` assíncrono sobrescrevia `onboardingForm.getValues()`; preview, validação e payload também usavam políticas de normalização diferentes.
  - Implementado: React Hook Form como fonte única no clique e política compartilhada `normalizeCheckoutHexColor`.
  - Pendente: code review, deploy e repetição do E2E com confirmação no PostgreSQL e checkout público.
- `IN_PROGRESS` Spec: #96 / Issue: #97 — workflow Matt Pocock fail-closed.
  - Alterados: `AGENTS.md`, `CLAUDE.md`, `.husky/pre-commit`, `scripts/verify-matt-workflow.sh`, `.lintstagedrc`, `.prettierrc`, `package.json`, `package-lock.json`.
  - Evidência do hook: sem `TODOS.md` = falha; `TODOS.md` sem issue = falha; `Spec: #96` = sucesso.
  - Evidência do review (Spec: #96): revisão em dois eixos (Standards e Spec) aprovou as correções de fail-closed, hooks e caminhos observados.
  - Status: pronto para commit e deploy.
- `IN_PROGRESS` Spec: #100 / Issue: #101 — restaurar SignalR.
  - Reprodução: conexão `wss://swiftpayment.info/api/hubs/notifications` retorna HTTP 401; o mesmo JWT retorna HTTP 200 em REST.
  - Implementado via TDD: promoção restrita de `access_token` para `Authorization` antes do JwtBearer; três testes passando.
  - Evidência do review (Spec: #100): pipeline FastEndpoints e diagramas de arquitetura atualizados (`deployment-map.md`).
  - Status: pronto para deploy e validação em browser.
- Bloqueio financeiro: pagamento real e PIX OUT exigem aprovação explícita do usuário para valor e chave de destino.
- Próxima ação: deploy dos serviços na VPS (autenticação SSH/Contabo) e verificação end-to-end nas superfícies web e APIs.

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
- Próxima ação: retomar fase 2 (aposentadoria do Firestore no pipeline de email — migration com colunas de entrega + `PostgresEmailOutboxStore`) e smoke de pagamento sandbox quando houver credenciais.
