# Plano de Produção — SwiftPay

## Objetivo
Colocar a plataforma SwiftPay em produção com SSL, infraestrutura robusta, backup, monitoramento e CI/CD.

## Tarefas

### Wave 1: SSL + Infra Base
1. **SSL/HTTPS (Let's Encrypt)** no VPS para swift-pay.top
2. **docker-compose de produção** (restart policies, health checks, resource limits)
3. **Variáveis de ambiente de produção**

### Wave 2: Segurança e Backup
4. **Rate limiting** na API
5. **CORS configurado** para produção
6. **Backup automático do PostgreSQL**

### Wave 3: CI/CD e Finalização
7. **CI/CD** (deploy automatizado)
8. **Landing page profissional**
9. **Monitoramento** (health checks, logs)

## Verificação
- `curl -I https://swift-pay.top` → 200 OK
- `docker ps` → todos containers com status healthy
- Backup automático rodando
- CI/CD pipeline funcional
