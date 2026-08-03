# Especificação de Deploy — Frontend SwiftPay na VPS

## Contexto

- **Domínio**: swift-pay.top (SSL via Let's Encrypt, nginx na VPS)
- **VPS**: 169.58.70.201, root (credencial via env/secret — nao versionar)
- **Backend**: Docker Compose (swiftpay-api/docker-compose.production.yaml) — já rodando e saudável
- **Frontend atual na VPS**: swiftpay-web (Node 20, porta 3001) e swiftpay-web-checkout (Node 22, porta 5002) — ambos com código antigo (safefy references, logos antigos)
- **Novo frontend**: Já está no repo local em swiftpay-web/ e swiftpay-web-checkout/ (substituído por Swiftpay Front end novo/)
- **Vercel**: Descontinuado. Tudo na VPS.

## Arquitetura de Rede

O nginx na VPS roteia:
- `/` → 127.0.0.1:3001 (admin web)
- `/checkout/` → 127.0.0.1:5002 (checkout web)
- `/api/` → 127.0.0.1:5279 (backend API)
- `/api/payment/` → 127.0.0.1:5166 (payment API)
- `/api/storage/` → 127.0.0.1:9000 (MinIO)
- `/docs` → 127.0.0.1:5279 (backend docs)

## Problemas Identificados

1. Frontends na VPS estão desatualizados — código antigo com safefy references
2. .env dos frontends na VPS usa localhost URLs (correto para rede Docker interna)
3. Dockerfile do web na VPS usa Node 20 — o novo frontend precisa de Node 22
4. Nginx já roteia corretamente — nenhuma mudança necessária na configuração

## Plano de Deploy

### Fase 1: Preparação
- Backup dos frontends atuais na VPS
- Copiar novos frontends do repo local para a VPS
- Atualizar .env de produção de ambos os frontends na VPS
- Atualizar Dockerfile do web para Node 22

### Fase 2: Build e Deploy
- Fazer build das novas imagens Docker na VPS
- Deploy com docker compose (rolling update)
- Verificar saúde de todos os containers

### Fase 3: Validação
- Testar acesso ao admin (swift-pay.top/)
- Testar acesso ao checkout (swift-pay.top/checkout/)
- Testar login e autenticação
- Testar API connectivity
