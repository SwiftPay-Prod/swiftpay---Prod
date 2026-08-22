#!/usr/bin/env bash
set -euo pipefail

source_change=false
todos_staged=false

while IFS= read -r path; do
  [[ -z "$path" ]] && continue

  case "$path" in
    TODOS.md)
      todos_staged=true
      ;;
    src/*|swiftpay-api/*|swiftpay-api-core/*|swiftpay-api-payment/*|swiftpay-web-checkout/*|infra/*|scripts/*|.github/workflows/*|Dockerfile|docker-compose*.yaml|*.csproj|package.json|package-lock.json|start.sh|stop.sh)
      source_change=true
      ;;
  esac
done < <(git diff --cached --name-only --diff-filter=ACMRD)

if [[ "$source_change" != true ]]; then
  exit 0
fi

if [[ "$todos_staged" != true ]]; then
  cat >&2 <<'EOF'
Matt Pocock workflow guard: mudança de código/infra exige atualização staged em TODOS.md.
Registre a spec/issue, estado, evidência planejada e próximo passo antes do commit.
EOF
  exit 1
fi

added_todos=$(git diff --cached --unified=0 -- TODOS.md | sed -n '/^+++ /d; /^+/p')
if [[ ! "$added_todos" =~ (Spec|Issue|Ticket):[[:space:]]*#?[0-9]+ ]] &&
   [[ ! "$added_todos" =~ https://github.com/.*/issues/[0-9]+ ]]; then
  cat >&2 <<'EOF'
Matt Pocock workflow guard: a atualização de TODOS.md precisa referenciar uma Spec, Issue ou Ticket.
Exemplos: "Spec: #94", "Issue: #95" ou uma URL de issue do GitHub.
EOF
  exit 1
fi

for required in AGENTS.md CLAUDE.md docs/agents/issue-tracker.md docs/agents/domain.md; do
  if [[ ! -f "$required" ]]; then
    echo "Matt Pocock workflow guard: artefato obrigatório ausente: $required" >&2
    exit 1
  fi
done
