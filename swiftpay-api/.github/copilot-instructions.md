# SwiftPay API - Copilot Instructions (Referência)

Este arquivo principal agora funciona como índice de navegação.
O conteúdo detalhado foi dividido em arquivos menores por contexto para facilitar manutenção, revisão e atualização incremental.

## Regra universal e absoluta de contexto

Antes de qualquer ação, leia [`../../AGENTS.md`](../../AGENTS.md), [`../../CLAUDE.md`](../../CLAUDE.md), [`../../TODOS.md`](../../TODOS.md) e [`../../docs/agent-context-governance.md`](../../docs/agent-context-governance.md). Toda tarefa, decisão, tentativa, risco, bloqueio e evidência deve ser versionada; chat e memória local nunca podem ser a única fonte. Atualize `TODOS.md` antes de encerrar e nunca registre segredos.


## Como usar

1. Use este arquivo para localizar rapidamente o tema desejado.
2. Edite diretamente o arquivo temático correspondente.
3. Mantenha este índice atualizado sempre que um novo bloco temático for criado, renomeado ou removido.

## Glossário de referências temáticas

- [Fundação, arquitetura, mensageria e fluxo base](instructions/swiftpay-api/foundations-auth-merchant.instructions.md)
- [Regras de negócio centrais da plataforma](instructions/swiftpay-api/business-rules.instructions.md)
- [Arquitetura de pedidos e ledger](instructions/swiftpay-api/orders-and-ledger.instructions.md)
- [Dashboard, infraestrutura e stack](instructions/swiftpay-api/dashboard-infra-and-stack.instructions.md)
- [Estrutura de pastas, migrations e integrações tracking](instructions/swiftpay-api/structure-migrations-and-tracking.instructions.md)
- [Criação de endpoints, respostas padrão e utilitários](instructions/swiftpay-api/endpoint-authoring-and-utils.instructions.md)
- [Payment Links e regras de checkout](instructions/swiftpay-api/payment-links-and-checkout-rules.instructions.md)
- [Serviços disponíveis e storage](instructions/swiftpay-api/services-and-storage.instructions.md)
- [Imagens, security log e validação](instructions/swiftpay-api/images-security-and-validation.instructions.md)
- [Modelagem de resposta, mappers e padrões de código](instructions/swiftpay-api/modeling-mappers-and-code-standards.instructions.md)
- [Programa de indicações e checklist final](instructions/swiftpay-api/referrals-and-checklist.instructions.md)

## Regra de manutenção

Sempre que houver alteração em arquitetura, estrutura de dados, fluxos de negócio ou padrões de código, atualize o arquivo temático correto e mantenha este índice sincronizado.
