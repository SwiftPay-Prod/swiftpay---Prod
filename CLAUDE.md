# SwiftPay — Engineering & AI Agent Workflow (Matt Pocock Skills Exclusivo)

Este documento estabelece o fluxo de trabalho de engenharia e governança de agentes de IA para o projeto **SwiftPay**.
**Regra de exclusividade:** Neste projeto, utiliza-se EXCLUSIVAMENTE a suíte de **Matt Pocock Skills**. Nenhuma outra ferramenta ou skill de terceiros fora desta suíte é permitida.

- O **Usuário / Mantenedor** decide O QUE construir e mantém aprovação final sobre planos, specs e deploys.
- Os **Agentes de IA** executam COMO construir, utilizando as skills de engenharia estruturadas.
- **Contexto Durável Obrigatório:** Todo TODO, decisão de arquitetura, evidência de teste e bloqueio deve ser registrado nos artefatos versionados do repositório (`TODOS.md`, `AGENTS.md`, `docs/decisions/`, `docs/architecture/`). Nunca confie apenas na memória da sessão.
- **Segurança:** Nunca registre segredos (senhas, chaves de API, certificados) na documentação.

---

## Workflow gate

Before any repository or production mutation:

1. Read and execute `AGENTS.md` → **Mandatory Matt Pocock workflow**.
2. Initialize the active todo with every user-requested item.
3. Confirm the current GitHub spec and ticket references are recorded in `TODOS.md`.
4. Stop before mutation if any prior gate lacks durable evidence.

The workflow is sequential and fail-closed. A build, mock, healthcheck, or plausible implementation is evidence only for what it directly exercises. “Complete” requires the reviewed behavior in its real surface. Deploy occurs after review and verification, never as a substitute for them.

## Skill routing

- Reported failure or regression → `/diagnosing-bugs`
- Domain term or irreversible tradeoff → `/domain-modeling`
- Feature or agreed repair contract → `/to-spec`
- Approved decomposition → `/to-tickets`
- Implementation → `/implement-spec` with `/tdd`
- Branch or completed change → `/code-review`
- Module/interface seam → `/codebase-design`

---

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues (using the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped to standard labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.
