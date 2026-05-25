# Swiftpay — Dashboard Metrics + Audit

## Escopo
Dashboard com metricas financeiras, graficos, auditoria de acoes e exportacao CSV.

## Componentes
1. AuditLog entity + controller
2. Dashboard metrics endpoint
3. Pagina de dashboard com graficos (Recharts)
4. Pagina de auditoria
5. Exportacao CSV

## Backend
- AuditLog: Id, UserId, Action, EntityType, EntityId, Details, IpAddress, CreatedAt
- DashboardController: GET /api/v1/dashboard/summary (monthly), GET /api/v1/dashboard/daily?from=&to=
- AuditController: GET /api/v1/audit-logs (paginado), GET /api/v1/audit-logs/stats

## Frontend
- Dashboard: cards de resumo + AreaChart (receita diaria) + PieChart (metodos)
- Auditoria: tabela com filtros por acao/data
- Export: botao de download CSV nas transacoes
