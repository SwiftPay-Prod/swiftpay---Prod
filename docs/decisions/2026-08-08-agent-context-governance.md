# ADR: contexto durável obrigatório para todos os agentes

- **Data:** 2026-08-08
- **Status:** Accepted
- **Decisor final:** proprietário da SwiftPay
- **Escopo:** todo o repositório e todos os agentes atuais ou futuros

## Problema

O contexto de trabalho estava distribuído entre conversas, memória local, TODOs do harness e artefatos gstack fora do Git. Um agente novo ou outra máquina poderia perder tarefas, decisões, tentativas, riscos e evidências, repetir trabalho ou declarar conclusão sem conhecer o estado real.

## Decisão

Todo agente deve registrar cada tarefa, TODO, decisão, bloqueio, risco, tentativa, arquivo alterado e verificação em artefatos duráveis e versionados no repositório.

A descoberta será redundante:

```text
AGENTS.md
  ├── CLAUDE.md
  ├── .github/copilot-instructions.md
  ├── TODOS.md
  └── docs/agent-context-governance.md
        ├── docs/decisions/
        └── docs/architecture/
```

`AGENTS.md` será a entrada universal. `CLAUDE.md` continuará sendo a autoridade de governança gstack. O Copilot receberá a mesma regra no seu índice. `TODOS.md` será o ledger operacional canônico.

Memória local, chat e arquivos sob `~/.gstack` podem complementar, mas nunca substituir, o contexto versionado.

## Alternativas consideradas

### Manter somente contexto no chat

Rejeitada. Conversas são compactadas, arquivadas, inacessíveis a outros agentes e inadequadas para revisão por Git.

### Usar somente artefatos locais do gstack

Rejeitada como fonte única. Eles melhoram continuidade na mesma máquina, mas não acompanham clones, agentes remotos ou revisores que recebem apenas o repositório.

### Manter somente um `AGENTS.md`

Rejeitada como documentação completa. Um arquivo de regras não substitui ledger de tarefas, decisões com histórico e arquitetura atualizada.

### Versionar regras, ledger, decisões e arquitetura

Aceita. A redundância de descoberta reduz a chance de um agente ignorar a governança, enquanto cada artefato mantém responsabilidade única.

## Consequências

### Positivas

- agentes novos recuperam contexto sem depender da conversa anterior;
- decisões mantêm alternativas e justificativas;
- trabalho parcial tem handoff explícito;
- verificações ficam auditáveis;
- bloqueios e dívida deixam de desaparecer entre sessões.

### Custos

- toda tarefa exige manutenção documental contínua;
- mudanças pequenas ainda precisam de ledger e evidência proporcionais;
- documentação desatualizada passa a ser tratada como defeito.

## Segurança

A exigência de contexto não autoriza registrar segredos. Credenciais e dados pessoais devem ser representados somente por metadados seguros: finalidade, armazenamento, proprietário, estado de rotação e resultado de validação.

## Condições de revisão

Esta decisão só pode ser substituída por uma nova decisão explícita do proprietário. Simplificações podem alterar formato ou automação, mas não podem remover a obrigação de contexto durável e versionado.

## Evidência de aplicação inicial

- `AGENTS.md` criado como contrato universal;
- `docs/agent-context-governance.md` criado com ciclo de trabalho e handoff;
- `TODOS.md` criado como ledger canônico;
- `CLAUDE.md`, `.github/copilot-instructions.md` e `README.md` apontam para os artefatos canônicos.
