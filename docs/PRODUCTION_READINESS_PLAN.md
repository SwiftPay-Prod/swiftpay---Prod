# SwiftPay — Production Readiness Plan

> **Data:** 2026-08-09
> **Status:** Em planejamento — nenhuma alteração aplicada ainda
> **Fonte da verdade:** `AGENTS.md`, `CLAUDE.md`, `TODOS.md`, `docs/architecture/*`, `docs/decisions/*`, `swiftpay-api/docker-compose.production.yaml`

---

## 1) Resumo executivo

O SwiftPay tem uma base arquitetural forte, mas **ainda não está completo para produção em escala**.  
Há bloqueios operacionais e riscos que precisam ser resolvidos antes do go-live: plataforma de email em transição, composição de produção incompleta, deploy/testes automatizados insuficientes e configurações que ainda precisam de ajustes.

Este plano define as fases, ações, critérios de aceite e riscos para chegar a um estado de produção seguro.

---

## 2) Objetivos

- Remover bloqueios que impedem o go-live ou causam falhas operacionais.
- Ativar a plataforma de email Firebase + Resend sem perder entrega.
- Eliminar deploy manual e reduzir erro humano.
- Garantir validação contínua com testes automatizados.
- Deixar a operação monitorada, auditada e recuperável.

---

## 3) Fase 1 — Estabilização mínima para produção

**Objetivo:** remover bloqueios operacionais imediatos.  
**Duração estimada:** 1 a 2 dias.

### Ações
1. Definir se RabbitMQ, Valkey e Storage/MinIO serão provisionados na VPS via Docker ou serão serviços gerenciados externos.
2. Documentar essa decisão em `docs/decisions/` e atualizar `docker-compose.production.yaml` ou `docs/deployment-map.md`.
3. Corrigir rota `/docs` no nginx para apontar para o backend correto ou bloquear acesso público.
4. Remover/desligar MiniProfiler em produção.
5. Revisar CORS produção e remover referências obsoletas se necessário.
6. Tornar explícito que `start.sh` é somente desenvolvimento e evitar valores hardcoded que possam ser copiados para produção.

### Critérios de aceite
- Nginx serve `/docs` do backend correto ou a rota está bloqueada publicamente.
- MiniProfiler não aparece em produção.
- CORS aceita apenas origins válidas.
- `start.sh` não pode ser confundido com script de produção.

---

## 4) Fase 2 — Email platform production-ready

**Objetivo:** ativar a arquitetura Firebase + Resend de forma segura, sem perder entrega.  
**Duração estimada:** 2 a 4 dias.

### Ações
1. Criar Firestore e service account mínima no projeto `swiftpay-878c0`.
2. Colocar credencial na VPS com permissão restrita e montá-la como secret somente leitura.
3. Ativar `EmailPlatformSettings.Enabled = true` em produção.
4. Executar cutover dos callers conforme manifesto de email.
5. Executar testes de email outbox e corrigir falhas.
6. Validar entrega real com conta QA e confirmar aceite do provider.

### Critérios de aceite
- Firestore criado e acessível pela VPS.
- Testes de email outbox passam.
- Nenhum caller legado permanece sem intenção.
- Emails críticos retornam estados honestos; nunca entrega confirmada sem prova.

---

## 5) Fase 3 — Deploy automatizado

**Objetivo:** eliminar deploy manual e reduzir erro humano.  
**Duração estimada:** 1 a 2 dias.

### Ações
1. Criar workflow de deploy para `swiftpay-api` e `swiftpay-api-payment`.
2. Criar workflow de deploy para `swiftpay-web` e `swiftpay-web-checkout`.
3. Remover `sshpass`/senha do `deploy.sh` ou substituir por fluxo baseado em chave/segredo.
4. Adicionar validação de secrets no CI e garantir que `.env.production` não é commitado.

### Critérios de aceite
- Push para `main` faz deploy automatizado dos 4 serviços.
- Falha no health check aborta deploy e reverte imagem anterior.
- Nenhuma senha ou credencial aparece no repo ou logs públicos.

---

## 6) Fase 4 — Testes automatizados e validação contínua

**Objetivo:** garantir que produção não regride sem aviso.  
**Duração estimada:** 2 a 3 dias.

### Ações
1. Rodar toda a suíte existente e corrigir falhas.
2. Adicionar cobertura mínima obrigatória para ledger, webhooks, auth e acquirens.
3. Configurar CI para rodar testes e bloquear merge em caso de falha.
4. Adicionar smoke test automatizado para health checks e fluxos básicos.

### Critérios de aceite
- 100% dos testes existentes passam.
- Novos testes bloqueiam merge.
- Smoke test roda automaticamente após deploy.

---

## 7) Fase 5 — Observabilidade e operação

**Objetivo:** garantir que produção é monitorada, auditada e recuperável.  
**Duração estimada:** 1 a 2 dias.

### Ações
1. Automatizar backup e testar restore.
2. Criar alertas para health check, fila RabbitMQ, quota Resend e erros 5xx.
3. Documentar runbook de deploy, rollback, restore e incidentes.
4. Remover código/documentação obsoleta.

### Critérios de aceite
- Backup e restore testados.
- Runbook disponível.
- Repo limpo de arquivos obsoletos.

---

## 8) Ordem recomendada

```
Fase 1 -> Fase 2 -> Fase 3 -> Fase 4 -> Fase 5
```

Essa ordem evita deploy automatizado de sistema instável, ativação de email antes do compose/testes prontos e monitoramento sem saber o que medir.

---

## 9) Riscos residuais

| Fase | Risco residual | Mitigação |
|------|----------------|-----------|
| 1 | Nginx/docs/miniprofiler | Baixo; mudança pequena e reversível |
| 2 | Email platform | Médio; requer testes e cutover controlado |
| 3 | Deploy automatizado | Médio; começar em branch separada |
| 4 | Testes | Baixo; falhas viram bloqueio |
| 5 | Operação | Baixo; documentação e backup são seguros |

---

## 10) Próximos passos

1. Aprovar ou ajustar este plano.
2. Executar a Fase 1 antes de qualquer deploy ou alteração maior.
3. Manter `TODOS.md` sincronizado com cada fase e ação.
