# SwiftPay Agent Operating Contract

This file is the universal entry point for every AI agent, coding assistant, reviewer, automation, or delegated worker operating in this repository.

## Absolute context rule

Every task, TODO, decision, assumption, blocker, risk, attempted approach, changed artifact, and verification result MUST be written to durable, versioned project artifacts. Chat history, local agent memory, terminal scrollback, and uncommitted planning state are never sufficient as the only record.

This rule is permanent and applies to all agents and all scopes. It MUST NOT be skipped for small, urgent, experimental, delegated, or read-only work.

## Mandatory startup sequence

Before acting, every agent MUST:

1. Read this `AGENTS.md` file.
2. Read `CLAUDE.md` for engineering skills workflow and routing.
3. Read `.github/copilot-instructions.md` and every instruction file applicable to the files being touched.
4. Read `TODOS.md` for current work, blockers, dropped approaches, and handoff state.
5. Read `docs/agent-context-governance.md` for the required documentation lifecycle.
6. Read `CONTEXT.md`, relevant architecture records under `docs/architecture/`, and ADRs under `docs/adr/`.
7. Treat unexpected repository changes as user-owned work and preserve them.

An agent that cannot complete this sequence MUST stop and document the exact blocker in `TODOS.md`.

## Mandatory Matt Pocock workflow

Every request MUST pass these gates in order:

1. **Route:** invoke the matching Matt Pocock skill and read `CONTEXT.md` plus relevant ADRs.
2. **Track:** record every requested item in `TODOS.md` and the active task tracker.
3. **Diagnose:** for a reported failure, use `diagnosing-bugs`; produce a red-capable reproduction before changing source.
4. **Specify:** publish a `/to-spec` issue and confirm the observable test seam. Investigation may precede the spec; source or production mutation may not.
5. **Decompose:** run `/to-tickets`; publish approved tracer-bullet tickets and blocking edges.
6. **Implement:** execute the current ticket with `/implement-spec` and `/tdd`, one red-green slice at a time.
7. **Review:** run `/code-review` against a fixed point. Resolve both Standards and Spec findings.
8. **Verify:** run the affected behavior, not only compilation. Record exact commands, scenarios, dates, and observed results in `TODOS.md`.
9. **Deploy:** deploy only the reviewed, verified revision. Production financial operations require explicit user approval for value and destination.
10. **Close:** close tickets/spec only after production evidence satisfies every acceptance criterion.

Completion criterion: every gate has durable evidence; `TODOS.md` names changed files, verification, blockers, and the next action.

## Canonical durable artifacts

| Artifact                            | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `AGENTS.md`                         | Universal rules for every agent                    |
| `CLAUDE.md`                         | Required engineering workflow and skills routing   |
| `.github/copilot-instructions.md`   | Copilot discovery and instruction index            |
| `TODOS.md`                          | Canonical task ledger and current handoff state    |
| `docs/agent-context-governance.md`  | Full context capture and handoff procedure         |
| `CONTEXT.md`                        | Ubiquitous Language glossary and domain boundaries |
| `docs/adr/`                         | Architectural Decision Records (ADRs)              |
| `docs/architecture/`                | Current system design and runtime behavior         |
| Tests and command output references | Verification evidence for behavior claims          |

Local agent artifacts and long-term memory MAY supplement these files, but MUST NOT replace committed project records.

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

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues (using the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped to standard labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.
