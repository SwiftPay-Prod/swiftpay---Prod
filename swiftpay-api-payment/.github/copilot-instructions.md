# SwiftPay API Payment - Copilot Instructions (Referência)

Este arquivo principal agora funciona como índice de navegação.
O conteúdo detalhado foi dividido em arquivos menores por contexto para facilitar manutenção, revisão e atualização incremental.

## Regra universal e absoluta de contexto

Antes de qualquer ação, leia [`../../AGENTS.md`](../../AGENTS.md), [`../../CLAUDE.md`](../../CLAUDE.md), [`../../TODOS.md`](../../TODOS.md) e [`../../docs/agent-context-governance.md`](../../docs/agent-context-governance.md). Toda tarefa, decisão, tentativa, risco, bloqueio e evidência deve ser versionada; chat e memória local nunca podem ser a única fonte. Atualize `TODOS.md` antes de encerrar e nunca registre segredos.


## Como usar

1. Use este arquivo para localizar rapidamente o tema desejado.
2. Edite diretamente o arquivo temático correspondente.
3. Mantenha este índice atualizado sempre que um novo bloco temático for criado, renomeado ou removido.

## Glossário de referências temáticas

- [Fundamentos, environment e fluxos iniciais de transação/saque](instructions/swiftpay-api-payment/foundations-transactions-and-cashouts.instructions.md)
- [Payment Links e arquitetura de saques](instructions/swiftpay-api-payment/payment-links-and-cashout-architecture.instructions.md)
- [Webhooks, tracking e sinalização de status](instructions/swiftpay-api-payment/webhooks-tracking-and-signalr.instructions.md)
- [Clients, autenticação, rate limiting e resiliência HTTP](instructions/swiftpay-api-payment/clients-auth-rate-limit-and-resilience.instructions.md)
- [Estrutura, stack, mensageria e extensão do startup](instructions/swiftpay-api-payment/structure-stack-broker-and-extensions.instructions.md)
- [Regras de negócio centrais do domínio de pagamento](instructions/swiftpay-api-payment/core-business-rules.instructions.md)
- [Checkout config, práticas, dependências e logging](instructions/swiftpay-api-payment/checkout-practices-dependencies-and-logging.instructions.md)
- [Reprocessamento DEV, health checks e migrações](instructions/swiftpay-api-payment/dev-reprocessing-health-and-migrations.instructions.md)

## Regra de manutenção

Sempre que houver alteração em arquitetura, estrutura de dados, fluxos de negócio ou padrões de código, atualize o arquivo temático correto e mantenha este índice sincronizado.