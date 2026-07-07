# SwiftPay

## What This Is

SwiftPay é uma plataforma brasileira de gateway de pagamentos white-label com foco em PIX, cartão de crédito e boleto. Originalmente desenvolvida como Safefy, está passando por um rebranding completo com nova identidade visual, nova proprietária e nova posição de mercado.

## Core Value

Processar pagamentos no Brasil de forma confiável, rápida e com suporte a múltiplos adquirentes e métodos de pagamento locais.

## Requirements

### Validated

- ✓ Arquitetura multi-camadas (.NET 10 + Next.js 16) — existente
- ✓ Pagamentos PIX com QR Code dinâmico — existente
- ✓ Cartão de crédito com parcelamento — existente
- ✓ Boleto bancário — existente
- ✓ Links de pagamento compartilháveis — existente
- ✓ Checkout público multi-template — existente
- ✓ Dashboard em tempo real — existente
- ✓ Sistema de ledger contábil (dupla entrada) — existente
- ✓ Saques automáticos e manuais — existente
- ✓ 9 adquirentes integradas (arquitetura plugável) — existente
- ✓ Tema dark/light — existente
- ✓ Notificações push (FCM) e tempo real (SignalR) — existente

### Active (Rebranding Safefy → SwiftPay)

- [ ] **REBRAND-01**: Renomear todos os namespaces C# de `safefy_*` para `swiftpay_*`
- [ ] **REBRAND-02**: Atualizar AssemblyName e RootNamespace nos arquivos `.csproj`
- [ ] **REBRAND-03**: Renomear arquivos e diretórios com "safefy" no nome
- [ ] **REBRAND-04**: Substituir assets visuais (logos, ícones) com a nova marca
- [ ] **REBRAND-05**: Atualizar componentes React (safefy-brand-logo, safefy-toaster, etc.)
- [ ] **REBRAND-06**: Renomear filas RabbitMQ de `safefy.*` para `swiftpay.*`
- [ ] **REBRAND-07**: Atualizar headers de webhook (`X-Safefy-*` → `X-SwiftPay-*`)
- [ ] **REBRAND-08**: Atualizar variáveis de ambiente (`SAFEFY_*` → `SWIFTPAY_*`)
- [ ] **REBRAND-09**: Atualizar documentação e arquivos `.http`
- [ ] **REBRAND-10**: Renomear diretório pai (`safefy-main` → `swiftpay-main`)
- [ ] **REBRAND-11**: Verificar build completo (dotnet build + npm build)
- [ ] **REBRAND-12**: Remover arquivos residuais da marca antiga

### Out of Scope

- Mudanças na lógica de negócio — apenas rename
- Alteração de funcionalidades existentes
- Migração de dados de produção

## Context

O projeto foi originalmente criado como "Safefy Pay" e recentemente renomeado para "SwiftPay" nos commits e diretórios principais, mas o rebranding foi parcial. Restam ~100+ ocorrências do nome antigo em namespaces, assembly names, componentes UI, filas RabbitMQ, headers HTTP, assets visuais e documentação. A nova proprietária quer uma identidade 100% nova, sem referências à marca anterior.

## Constraints

- **Tech Stack**: .NET 10, Next.js 16, React 19, TypeScript, Entity Framework Core 10, PostgreSQL 17, RabbitMQ, MassTransit, SignalR, Hangfire, HeroUI v3, Tailwind CSS v4
- **Compatibilidade**: Webhooks externos serão atualizados — sem backward compatibility (identidade nova)
- **Infraestrutura**: Filas RabbitMQ ativas precisam de estratégia de migração

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nome: SwiftPay | Nova identidade da marca | — Pending |
| Headers webhook: mudar tudo | Nova proprietária, sem legacy | — Pending |
| Filas RabbitMQ: mudar tudo | Rebranding completo | — Pending |
| Diretório pai: renomear | Novo nome do projeto | — Pending |
| Modo de execução | YOLO — auto-aprovação | ✓ Active |

---

*Last updated: 2026-07-06 after initialization*
