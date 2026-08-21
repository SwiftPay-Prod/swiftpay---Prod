# SwiftPay — Engineering & AI Agent Workflow (Matt Pocock Skills Exclusivo)

Este documento estabelece o fluxo de trabalho de engenharia e governança de agentes de IA para o projeto **SwiftPay**.
**Regra de exclusividade:** Neste projeto, utiliza-se EXCLUSIVAMENTE a suíte de **Matt Pocock Skills**. Nenhuma outra ferramenta ou skill de terceiros fora desta suíte é permitida.

- O **Usuário / Mantenedor** decide O QUE construir e mantém aprovação final sobre planos, specs e deploys.
- Os **Agentes de IA** executam COMO construir, utilizando as skills de engenharia estruturadas.
- **Contexto Durável Obrigatório:** Todo TODO, decisão de arquitetura, evidência de teste e bloqueio deve ser registrado nos artefatos versionados do repositório (`TODOS.md`, `AGENTS.md`, `docs/decisions/`, `docs/architecture/`). Nunca confie apenas na memória da sessão.
- **Segurança:** Nunca registre segredos (senhas, chaves de API, certificados) na documentação.

---

## 1. Ciclo de Vida do Desenvolvimento (Skills Workflow)

| Fase | Skill Principal | Objetivo |
| :--- | :--- | :--- |
| **1. Ideação & Discovery** | `/grilling`, `/research`, `/prototype` | Estressar ideias, validar hipóteses, pesquisar documentação e criar protótipos rápidos |
| **2. Domínio & Arquitetura** | `/domain-modeling`, `/codebase-design` | Modelar termos de domínio em `CONTEXT.md`, criar ADRs em `docs/adr/` e desenhar módulos profundos |
| **3. Especificação** | `/to-spec` | Gerar especificações técnicas detalhadas a partir de demandas ou tickets |
| **4. Tickets & Decomposição** | `/to-tickets` | Decompor a especificação em tickets granulares no GitHub Issues (usando `gh`) |
| **5. Triagem & Priorização** | `/triage` | Classificar e etiquetar issues com o vocabulário padrão (`needs-triage`, `ready-for-agent`, etc.) |
| **6. Navegação em Grafo** | `/wayfinder` | Gerenciar mapa de dependências e ordem de execução de tickets complexos |
| **7. Implementação & TDD** | `/implement-spec`, `/implement`, `/tdd` | Implementar contratos guiado por testes (Red-Green-Refactor) e fatias verticais |
| **8. Diagnóstico de Bugs** | `/diagnosing-bugs` | Investigação de causa raiz para falhas e regressões |
| **9. Revisão de Código** | `/code-review` | Revisão em dois eixos (Padrões da base e Conformidade com a especificação) |

---

## 2. Roteamento de Skills

Quando uma tarefa for iniciada, use a skill correspondente:
- **Discutir ou desafiar uma proposta/decisão:** `/grilling` ou `/grill-with-docs`
- **Modelar domínio ou registrar ADR:** `/domain-modeling`
- **Escrever uma especificação técnica:** `/to-spec`
- **Criar/publicar tickets a partir de uma spec:** `/to-tickets`
- **Classificar issues do GitHub:** `/triage`
- **Executar implementação:** `/implement-spec` ou `/implement` com `/tdd`
- **Resolver bugs difíceis:** `/diagnosing-bugs`
- **Revisar pull request ou branch:** `/code-review`
- **Projetar módulos e interfaces:** `/codebase-design`

---

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues (using the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped to standard labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.
