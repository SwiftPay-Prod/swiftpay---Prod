# SwiftPay Agent Operating Contract

This file is the universal entry point for every AI agent, coding assistant, reviewer, automation, or delegated worker operating in this repository.

## Absolute context rule

Every task, TODO, decision, assumption, blocker, risk, attempted approach, changed artifact, and verification result MUST be written to durable, versioned project artifacts. Chat history, local agent memory, terminal scrollback, and uncommitted planning state are never sufficient as the only record.

This rule is permanent and applies to all agents and all scopes. It MUST NOT be skipped for small, urgent, experimental, delegated, or read-only work.

## Mandatory startup sequence

Before acting, every agent MUST:

1. Read this `AGENTS.md` file.
2. Read `CLAUDE.md` for immutable gstack governance and routing.
3. Read `.github/copilot-instructions.md` and every instruction file applicable to the files being touched.
4. Read `TODOS.md` for current work, blockers, dropped approaches, and handoff state.
5. Read `docs/agent-context-governance.md` for the required documentation lifecycle.
6. Read relevant architecture and decision records under `docs/architecture/` and `docs/decisions/`.
7. Treat unexpected repository changes as user-owned work and preserve them.

An agent that cannot complete this sequence MUST stop and document the exact blocker in `TODOS.md`.

## Mandatory work lifecycle

- Before work: record every requested item as a separate task in `TODOS.md` and in the active task tracker.
- During work: keep task status, decisions, risks, failed attempts, and blockers current as facts change.
- After a decision: create or update a versioned record under `docs/decisions/`; do not leave the rationale only in chat.
- After verification: record the exact command or scenario, date, and observed result. Never claim broader coverage than was exercised.
- Before handoff or stopping: update `TODOS.md` with completed work, remaining work, changed files, verification evidence, blockers, and the single next concrete action.
- After implementation: update affected architecture, operational, API, and user documentation in the same workstream.

## Canonical durable artifacts

| Artifact | Purpose |
|---|---|
| `AGENTS.md` | Universal rules for every agent |
| `CLAUDE.md` | Required gstack governance and routing |
| `.github/copilot-instructions.md` | Copilot discovery and instruction index |
| `TODOS.md` | Canonical task ledger and current handoff state |
| `docs/agent-context-governance.md` | Full context capture and handoff procedure |
| `docs/decisions/` | Durable architectural and product decisions with rationale |
| `docs/architecture/` | Current system design and runtime behavior |
| Tests and command output references | Verification evidence for behavior claims |

Local gstack artifacts and long-term memory MAY supplement these files, but MUST NOT replace committed project records.

## Security boundary

Durable context MUST NOT contain passwords, API keys, OAuth codes, private keys, raw production tokens, customer secrets, or unredacted personal data. Record the secret's purpose, owner, storage location, rotation state, and validation result without recording its value.

## Stop gate

No agent may declare work complete or hand off while actionable work remains undocumented. A valid handoff names:

- what changed;
- why it changed;
- what was verified and the exact evidence;
- what remains;
- what is blocked and by whom;
- the next concrete action;
- every file that another agent must read first.

See `docs/agent-context-governance.md` for templates and examples.
