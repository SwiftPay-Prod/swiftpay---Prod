# 0008: Push Notifications via FCM com Matriz de Preferências por Canal e Evento

Notificações push do painel utilizam Firebase Cloud Messaging com matriz de preferências por canal × evento controlada pelo usuário, enquanto as notificações in-app (SignalR) permanecem sempre ativas.
Decidimos migrar o push para o projeto Firebase `swiftpay-878c0` (compartilhado com o email), reutilizar a infraestrutura existente de `PushToken`/`UserNotificationPreference`/`NotificationService`, e corrigir o caminho direto de envio para respeitar as preferências do usuário.

## Status

Accepted — 2026-08-24

## Contexto

O painel mobile era uma versão paralela simplificada do desktop e o merchant não recebia push confiável de eventos financeiros (venda aprovada/recusada, saque concluído). A infraestrutura de push existia parcialmente (`PushNotificationService` FCM HTTP v1, `PushToken`, `UserNotificationPreference`, consumers de notificação), mas:

1. Os tokens FCM do frontend eram gerados no projeto `swiftpaya405c`, enquanto a única service account na VPS era do `swiftpay-878c0` — FCM HTTP v1 exige credencial do mesmo projeto que gerou os tokens.
2. O caminho direto de envio (`SendPushNotificationDirectAsync`, fallback sem RabbitMQ) não checava `UserNotificationPreference` — push ignorava as configurações do usuário.
3. O secret `/run/secrets/firebase-email-worker.json` estava montado como diretório vazio na VPS.
4. O `docker-compose.production.yaml` fixava `FirebaseSettings__*` vazios no bloco `environment:`, sobrescrevendo o env-file.

## Decisão

1. **Projeto único `swiftpay-878c0`** para push e email. O projeto `swiftpaya405c` não era acessível pela conta administradora. Compartilhar o projeto isola menos, mas elimina a impossibilidade de envio e simplifica gestão de credenciais. Service account `firebase-adminsdk-fbsvc@swiftpay-878c0` (role `sdkAdminServiceAgent`) usada para o envio FCM.

2. **Preferência controla apenas push; in-app sempre ativo.** A matriz `UserNotificationPreference` (booleans por evento + `PushNotificationsEnabled`/`InAppNotificationsEnabled`) governa exclusivamente o canal push. Notificações in-app (sino + SignalR) são sempre criadas — o usuário não pode ficar "cego" na plataforma. O canal `Email` fica modelado para uso futuro sem migration.

3. **Defaults: tudo ligado no primeiro opt-in**, com modal de confirmação listando os eventos antes do prompt de permissão do browser. O ato de aceitar a permissão já é um opt-in; a confirmação evita surpresa.

4. **Push dispara na transição interna de status** (`PaymentCompletedConsumer` para Completed/Failed/Refunded/Expired/Cancelled; `ProcessCashoutConsumer`/`CashoutService` para payout), não no webhook bruto do acquirer. Cobre todos os acquirers (ADR 0007), evita push duplicado em retry de webhook.

5. **Caminho direto respeita preferências.** `SendPushNotificationDirectAsync` ganhou `ShouldSendPushAsync` (mesma matriz do `SendPushNotificationConsumer`) — sem isso, ambientes sem RabbitMQ enviavam push ignorando as configurações.

## Alternativas consideradas

- **Criar projeto Firebase dedicado a push**: rejeitado — a conta administradora não tinha acesso ao `a405c` e um terceiro projeto aumentaria a superfície de gestão de credenciais sem benefício.
- **Usar a service account do email worker para push no 878c0**: rejeitada — sem role de FCM; a `firebase-adminsdk` nativa já tem acesso completo.
- **Preferência desligar in-app também**: rejeitado — risco de o merchant perder eventos financeiros críticos por configuração; padrão de mercado (Nubank/Mercado Pago) mantém in-app sempre on.
- **Push no webhook do acquirer**: rejeitado — duplicação em retry e acoplamento a um acquirer específico.

## Consequências

- Tokens FCM antigos do projeto `a405c` tornam-se inválidos; usuários precisam reativar push (uma vez; novos tokens vão para o `878c0`).
- `GOOGLE_APPLICATION_CREDENTIALS` e `FirebaseSettings` agora compartilham o mesmo projeto — simplifica rotação de credenciais.
- O secret `/run/secrets/firebase-email-worker.json` foi restaurado (arquivo real) e o compose interpolado — deploys futuros não sobrescrevem mais as credenciais.
- Push em iOS exige PWA instalado (iOS 16.4+); a UI de settings detecta e orienta (`isIOSPWA`).
- Validação de token FCM real requer device/browser com permissão concedida — coberta pela UI de opt-in em `/panel/user-settings`.

## Evidências

- 11/11 testes xUnit (`NotificationServicePushTests`, Testcontainers Postgres) cobrindo: prefs respeitadas por evento e canal, push off → sem push com in-app criado, `actionUrl` no payload, fan-out multi-token.
- Credencial validada ao vivo: JWT RS256 → OAuth OK → FCM `messages:send` respondendo `400 INVALID_ARGUMENT` para token fake.
- Deploys: T1 `35218c4`, T2 `263fa60`, T3 `1e0dae0`, T5 `807111d`, T6 `4e39e4e` — todos success.

## Referências

- ADR 0004 (Firebase email outbox) — padrão de isolamento de projetos Firebase
- ADR 0007 (multi-acquirer dynamic routing) — motivo do push na transição interna
- Spec #104 e tickets #105–#111
