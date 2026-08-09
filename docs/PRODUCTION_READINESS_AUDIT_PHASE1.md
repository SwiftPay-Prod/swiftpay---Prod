# SwiftPay — Production Readiness Audit — Phase 1

> **Data:** 2026-08-09
> **Escopo:** auditoria operacional da Fase 1, sem aplicação de alterações.
> **Referências:** `AGENTS.md`, `CLAUDE.md`, `TODOS.md`, `docs/architecture/*`, `docs/decisions/*`, `swiftpay-api/docker-compose.production.yaml`, `infra/nginx/swiftpayment.info.conf`, `swiftpay-api/Program.cs`, `swiftpay-api-payment/Program.cs`, `swiftpay-api/Extensions/*`, `start.sh`.

---

## Sumário

- Itens auditados: 5
- Bloqueios críticos: 1
- Itens de alta severidade: 1
- Itens de média severidade: 2
- Itens de baixa-média severidade: 1

---

## 1) Infraestrutura de produção — RabbitMQ, Valkey e Storage/MinIO

**Status:** ❌ Bloqueio crítico

**Evidência:**
- `swiftpay-api/docker-compose.production.yaml` declara apenas:
  - bancos Postgres
  - APIs
  - frontends
- Não há `swiftpayrabbitmq`, `swiftpayvalkey`, `swiftpaystorage` ou `swiftpaystorage-init` no compose de produção.
- `docs/deployment-map.md` lista apenas os mesmos serviços na seção “Produção”.

**Impacto:**
- `AddMassTransitWithConsumers()` está registrado em ambas APIs.
- Hangfire usa Valkey/Redis como storage.
- Diversos fluxos dependem de RabbitMQ:
  - ledger pendente
  - notificações
  - dashboards
  - ranking
  - webhooks
  - emails
  - reconciliation

**Recomendação:**
- Opção A: adicionar RabbitMQ, Valkey e MinIO no `docker-compose.production.yaml`.
- Opção B: usar serviços gerenciados externos e documentar endpoints/credenciais.
- Documentar a decisão em `docs/decisions/` e atualizar o deployment map.

---

## 2) Rota `/docs` no nginx

**Status:** ❌ Alta severidade

**Evidência:**
- `infra/nginx/swiftpayment.info.conf`:
  - `location /docs` aponta para `http://127.0.0.1:3001`
  - `3001` é o frontend `swiftpayweb`
- O backend FastEndpoints/docs deveria ser servido de `127.0.0.1:5279`.

**Impacto:**
- `/docs` retorna UI do Next.js em vez da documentação da API.
- Pode expor componentes/páginas internas do painel.
- Dificulta acesso a docs para desenvolvedores/parceiros.

**Recomendação:**
- Alterar `proxy_pass` para o backend correto ou bloquear `/docs` publicamente.

---

## 3) MiniProfiler em produção

**Status:** ❌ Média-alta severidade

**Evidência:**
- `swiftpay-api/Program.cs` e `swiftpay-api-payment/Program.cs` registram e usam MiniProfiler.
- `UseMiniProfiler()` está no pipeline de produção.

**Impacto:**
- Potencial vazamento de queries SQL, tempos, headers/cookies e estrutura interna.

**Recomendação:**
- Habilitar MiniProfiler apenas em `Development`/`Staging`.

---

## 4) CORS produção

**Status:** ⚠️ Média severidade

**Evidência:**
- `swiftpay-api/Extensions/CorsExtensions.cs` permite origins HTTPS:
  - `swiftpay.com.br`
  - `*.swiftpay.com.br`
  - `*.vercel.app`

**Impacto:**
- `.vercel.app` pode ser obsoleta ou sem propósito documentado.
- Aumenta superfície de CORS sem necessidade clara.

**Recomendação:**
- Remover `.vercel.app` se não for mais usada.
- Caso contrário, documentar o motivo em `docs/deployment-map.md`.

---

## 5) `start.sh` enganoso para produção

**Status:** ⚠️ Baixa-média severidade

**Evidência:**
- `start.sh` usa ambiente `Development`, portas fixas e conexões `localhost`.
- Contém senhas hardcoded para ambiente local.

**Impacto:**
- Pode ser usado incorretamente como referência ou script de produção.
- Senhas hardcoded podem ser copiadas indevidamente.

**Recomendação:**
- Adicionar banner explícito de “somente desenvolvimento”.
- Documentar que produção usa `docker-compose.production.yaml`.

---

## Próximos passos recomendados

1. Decidir tratamento de RabbitMQ/Valkey/Storage.
2. Corrigir `/docs` e MiniProfiler.
3. Revisar CORS e `start.sh`.
4. Prosseguir para auditoria da Fase 2.
