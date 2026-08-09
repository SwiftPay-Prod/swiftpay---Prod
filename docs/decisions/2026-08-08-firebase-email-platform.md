# ADR: Firebase como núcleo da plataforma de email

- **Data:** 2026-08-08
- **Status:** Accepted for implementation; production rollout pending validation
- **Decisor final:** proprietário da SwiftPay
- **Escopo:** autenticação e todos os emails transacionais da SwiftPay

## Contexto

O sistema atual mistura:

- emails nativos do Firebase Auth enviados pelo frontend;
- emails customizados enviados diretamente pelo backend via Resend;
- comportamento implantado antigo que respondeu HTTP 200 quando o Resend rejeitou o domínio então não verificado; o domínio foi verificado posteriormente.

O proprietário determinou que Firebase seja o principal para todos os tipos de email, mantendo o plano gratuito Spark. O projeto `swiftpay-878c0` está no Spark, sem billing, sem Firestore e sem Extensions. A extensão oficial Trigger Email exige Blaze e não pode atender esse requisito.

Além disso, todos os emails devem usar a identidade SwiftPay no domínio público `swiftpayment.info`.

## Decisão

Adotar a arquitetura:

```text
Firebase Auth Admin SDK -> links de ação
SwiftPay API -> fato + email_intent atômicos no PostgreSQL
relay idempotente -> mailOutbox/{intentId}
Cloud Firestore Spark -> fonte de verdade da execução e do aceite
worker na VPS -> lease, retry e observabilidade
Resend Free -> transporte final no domínio swiftpayment.info
```

### Regras vinculantes

1. PostgreSQL registra `email_intents` na mesma transação do fato de negócio.
2. Relay idempotente cria `mailOutbox/{intentId}`; Firestore é a fonte principal da execução e do aceite.
3. Nenhum endpoint chama Resend diretamente.
4. A API persiste o pedido de ação Auth; após o commit, materializador/relay usa Firebase Admin SDK para gerar links de verificação, reset e autenticação. O Client SDK deixa de enviar esses emails diretamente.
5. O remetente padrão é `SwiftPay <noreply@swiftpayment.info>`; domínio Resend e SPF/DKIM foram confirmados.
6. O worker usa o ID da intenção/Firestore como idempotency key do Resend.
7. Email crítico só retorna aceite confirmado após estado `Accepted`; isso não afirma entrega na caixa postal. Timeout retorna `Pending` explícito.
8. Email não crítico retorna após persistência atômica da intenção.
9. Worker usa listener em tempo real mais recuperação periódica, claim transacional, `leaseToken`, backoff, pause global de quota, `sendBefore`, dead-letter e `DeliveryUnknown`.
10. O único banco Firestore gratuito será criado em `southamerica-east1`.
11. Não ativar Blaze, Functions, Trigger Email Extension ou TTL gerenciado.
12. A chave Resend existe somente no worker; credenciais Firebase não entram no Git nem na imagem.
13. A implantação exige testes de atomicidade, relay, concorrência, restart, quota, expiração, timeout e entrega end-to-end.
14. A semântica é at-least-once; `firstProviderAttemptAt` é persistido antes do envio e a janela interna de retry usa 23 horas de margem dentro das 24 horas do Resend.
15. Dedupe varia por família: transição de negócio, período, operação auditada ou janela de cooldown; a mesma chave com payload divergente é conflito.
16. Quota diária usa reserva atômica: notificações ocupam no máximo 70 dos 100 slots e 30 ficam reservados a mensagens críticas.
17. Lease é 60s, timeout do provider 15s, mínimo de 20s antes do envio e oito falhas retryable com backoff exponencial.
18. Terminais mantêm payload por 30 dias; `DeadLetter`/`DeliveryUnknown` preservam só metadados seguros até 180 dias; cleanup é manual no worker.
19. Endpoints anônimos retornam `202` genérico sem handle; endpoints autenticados mapeiam `Accepted`, `Pending`, `Failed` e `Unknown`, com status restrito ao owner.
20. `RequestHash` protege a intenção/dedupe; `EnvelopeHash` separado é congelado pelo materializador vencedor e validado no Firestore.
21. Reserva diária é identificada por intenção/dia, reutilizada em retry e liberada por compare-and-set uma única vez.
22. Possível aceite do provider tem precedência sobre expiração/exaustão e termina `DeliveryUnknown`, nunca `ContentExpired`.
23. O manifesto de callers em `docs/architecture/firebase-email-platform.md` é obrigatório; cutover bloqueia se o scan de `IEmailService` divergir.
24. Toda família de cooldown possui composição determinística explícita e `cooldownWindowUtc` persistido na primeira tentativa.
25. Estados de materialização/publicação PostgreSQL mapeiam `Pending` ou `Failed` mesmo sem documento Firestore.
26. Notificações reivindicam atomicamente somente o pool geral de 70; não usam os 30 slots críticos nem bloqueiam o caller.

## Por que Resend ainda existe

Firebase Auth envia apenas emails de autenticação padronizados. Firestore armazena mensagens, mas não entrega SMTP. Portanto, algum transporte externo é obrigatório para os 34 tipos de template existentes.

Resend foi escolhido como transporte subordinado porque:

- já existe integração e contrato no backend;
- o plano Free atende o volume inicial: 100 emails/dia e 3.000/mês;
- suporta domínio próprio;
- suporta idempotency key por 24 horas, inclusive via SMTP, e retorna ID de mensagem pela API.

A decisão não torna Resend o núcleo: requests não dependem de uma chamada direta ao provider, e o estado canônico permanece no Firestore.

## Alternativas consideradas

### Firebase Trigger Email Extension

**Rejeitada.** Exige Blaze e recursos faturáveis de Firestore/Functions. Viola o requisito de custo zero.

### Firebase Auth nativo para autenticação + Resend direto para transacionais

**Rejeitada.** Mantém dois caminhos, impede remetente uniforme `@swiftpayment.info` e preserva o risco de falso sucesso nas chamadas diretas.

### Gmail como relay

**Rejeitada.** Remetente, reputação, limites e operação de conta pessoal são inadequados para plataforma financeira.

### Novo relay gratuito

**Rejeitada por agora.** Criaria nova conta, segredo e verificação de domínio sem benefício sobre o provider já integrado.

### Firestore direto sem intenção PostgreSQL

**Rejeitada no gate CEO.** Seria menor, mas não pode confirmar o fato de negócio e o enqueue na mesma transação. Commit PostgreSQL seguido de falha Firestore perde email; Firestore primeiro seguido de rollback cria email fantasma. O proprietário escolheu a intenção atômica PostgreSQL com relay idempotente e execução Firestore.

### Outbox e execução somente PostgreSQL/Hangfire

**Rejeitada no gate Eng.** É a alternativa mais simples e reaproveitaria workers existentes, mas o proprietário confirmou explicitamente Firebase como fonte operacional principal. A complexidade adicional do relay e de duas fontes foi aceita conscientemente; PostgreSQL continua autoridade da intenção e resumo terminal após retenção.

## Consequências positivas

- uma fonte de verdade Firestore para execução e aceite do transporte;
- nenhum falso sucesso de aceite quando o transporte falha;
- remetente e templates uniformes no domínio SwiftPay;
- retries e dead-letter sobrevivem a restart;
- requisitos Spark cabem no volume inicial se polling for evitado;
- credencial Resend sai do caminho de request.

## Consequências negativas e limites

- Firestore e PostgreSQL não têm transação conjunta; o relay fornece consistência eventual a partir da intenção atômica persistida;
- exatamente uma vez não é garantido por SMTP/API; a idempotência Resend dura 24 horas;
- quota Resend de 100/dia pode atrasar mensagens;
- retenção automática TTL exige billing e precisa de limpeza manual;
- uma credencial de serviço mínima precisa ser provisionada na VPS;
- o materializador/relay passa a depender do Admin SDK para gerar links de ação após o commit;
- `suporte@swiftpayment.info` não pode receber respostas enquanto o domínio não tiver MX.

## Pré-condições de produção

- criar Firestore em São Paulo;
- configurar regras e IAM mínimos;
- manter `swiftpayment.info` verificado no Resend; API e envio QA confirmaram domínio, região, aceite, entrega e idempotência em 2026-08-08;
- criar chave Resend `sending_access` restrita ao domínio para o worker e remover a chave ampla do request path;
- configurar Enforced TLS no domínio antes do cutover; o estado observado em 2026-08-08 ainda é opportunistic;
- criar DMARC inicialmente em modo de observação; ainda ausente em 2026-08-08;
- escolher `Reply-To` recebível ou configurar recebimento/MX;
- implantar worker e índices;
- corrigir o deploy para usar `/root/swiftpay/.env.production`, fail-fast, readiness e rollback antes de publicar a migração;
- executar cutover único de transporte, sem worker e Resend direto ativos simultaneamente;
- persistir resumo terminal PostgreSQL antes do cleanup Firestore;
- disponibilizar CLI/job God auditado para reconciliar `DeliveryUnknown` sem reabrir intenção antiga;
- migrar todos os callers;
- remover caminhos diretos;
- validar os critérios de aceite de `docs/architecture/firebase-email-platform.md`;
- passar pelos gates gstack `/review`, `/qa` e `/ship`.

## Evidência e referências

- Firebase confirma que emails do Client SDK são enviados pelo Google e têm customização limitada; para templates e serviço próprios, usar Admin SDK para gerar links: <https://firebase.google.com/docs/auth/admin/email-action-links>
- Quotas Spark: <https://firebase.google.com/docs/firestore/pricing>
- Idempotência Resend e janela de 24 horas: <https://resend.com/docs/dashboard/emails/idempotency-keys>
- Limites Resend: <https://resend.com/pricing>
- Domínios verificados Resend: <https://resend.com/docs/dashboard/domains/introduction>
- TLS de domínio Resend: <https://resend.com/docs/dashboard/domains/tls>
- Permissões de API key Resend: <https://resend.com/docs/api-reference/api-keys/create-api-key>
- Desenho detalhado: [`../architecture/firebase-email-platform.md`](../architecture/firebase-email-platform.md)
