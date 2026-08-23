# Revolut 10 / Ultra Audit - SwiftPay
> Auditoria estrutural e de design system. Estado atual: 2026-08-23.

## Inventário de rotas e superfícies
### Públicas
- `/` - Landing (`src/components/landing/`)
- `/docs` - Documentação (`src/app/docs/page.tsx`)
- `/boleto/[paymentId]` - Página pública de boleto (`src/app/boleto/[paymentId]/boleto-page-content.tsx`)

### Painel autenticado (`src/app/panel/(main)/`)
- Admin: `admin/dashboard`, `admin/merchants`, `admin/acquirers`, `admin/platform-settings`, `admin/templates`, `admin/transactions`, `admin/payouts`, `admin/balances`, `admin/users`, `admin/logs`, `admin/reconciliations`, `admin/referrals`
- Merchant: `merchant/dashboard`, `merchant/payment-links`, `merchant/checkouts`, `merchant/orders`, `merchant/transactions`, `merchant/balance-history`, `merchant/cashouts`, `merchant/customers`, `merchant/coupons`, `merchant/integrations`, `merchant/fees`, `merchant/settings`, `merchant/profile`, `merchant/notifications`, `merchant/referrals`, `merchant/achievements`, `merchant/bulletins`, `merchant/help`
- Auth: `signin`, `signup`, `forgot-password`, `confirm-email`, `verify-email`, `onboarding`
- Settings: `user-settings`, `security`, `profile`

### Imersivo
- `/panel/immersive/merchant/live-balance` - Live balance screen

## Regras canônicas Revolut 10 / Ultra
- R1-SURFACE-HIERARCHY: True black #000000, elevated #16181a, inset #0a0a0a, hairline rgba(255,255,255,0.12)
- R2-TYPOGRAPHY-TABULAR: Financial amounts em font-mono tabular-nums; labels text-white/50
- R3-PILL-ACTION: Primary actions em pill, border-radius >= 9999px, primary bg, on-primary text, transition 150ms
- R4-HAIRLINE-ONLY: Sem sombras decorativas; apenas borders 1px rgba(255,255,255,0.12)
- R5-STATUS-COLOR: Success=accent-green, Danger=accent-danger, Warning=accent-warning, sem cores hardcoded
- R6-ICONS-ONLY-HUGEFICONS: Apenas @hugeicons/core-free-icons; ícones semânticos
- R7-MOTION-BUDGET: Duração máxima 200ms
- R8-NO-MOCK-DATA: Todo dado renderizado vem de API real
- R9-CONSISTENT-API: Propriedades nomeadas explicitamente
- R10-REVOLUT-SCOPE: Design system aplica a todas as superfícies
- R11-PIX-ONLY-GATEWAY: SwiftPay 100% PIX-only; sem referências a cartão/boleto

## Tokens canônicos (globals.css)
### Cores Dark
- background: #000000
- surface/card: #16181a
- popover: #1c1c1e
- primary: #494fdf / primary-bright: #4f55f1
- accent-green: #00a87e / accent-danger: #e23b4a / accent-warning: #ec7e00
- border: rgba(255,255,255,0.12)
- muted: rgba(255,255,255,0.60) / faint: rgba(255,255,255,0.40)

### Tipografia
- Sans: Geist / Inter / system-ui
- Mono: tabular-nums para valores financeiros
- Tamanhos documentados em design-system.md (xs até 5xl)

### Espaçamento/Radius
- Radius padrão: 0.375rem
- Espaçamento: escala 4px base
- Transições: 150ms ease (máx 200ms)

## Gaps identificados
### Críticos (bloqueiam token standardization)
1. **Herança non-PIX em payment-links/new**: `use-create-payment-link-form.ts` e `create-payment-link-form-content.tsx` ainda referenciam `PaymentMethod.Boleto`, `PaymentMethod.CreditCard`, `boletoDueDate`, campos não-existentes no schema PIX-only atual. Bloqueia padronização de pills/botões/radius nesse fluxo.
   - Evidência: `src/app/panel/(main)/merchant/payment-links/new/use-create-payment-link-form.ts:117-150,241`
   - Evidência: `src/app/panel/(main)/merchant/payment-links/new/create-payment-link-form-content.tsx:160`
   - Evidência: `src/app/panel/(main)/merchant/payment-links/new/page.tsx:69`

2. **Hardcoded colors ativos**: 112+ ocorrências de `#16181a`, `#0a0a0a`, `#494fdf`, `#4f55f1`, `#00a87e`, `#e23b4a`, `#ec7e00` em `src/app/panel/(main)/merchant/**/*.{ts,tsx}`.

3. **Sombras decorativas**: `shadow-2xl`, `shadow-lg`, `shadow-md` em ~38 arquivos, violando R4-HAIRLINE-ONLY.

4. **Mockup-* classes ativas**: `.mockup-*` em uso ativo em componentes de KPI, header, layout picker.

### Médios
5. **Inconsistência de headers**: Admin vs merchant usam padrões visuais distintos.
6. **Tooltip/chart HUD não padronizado**: `admin-revenue-card.tsx`, `merchant-balance-card.tsx` usam estilos hardcoded.
7. **Acessibilidade básica**: Falta de focus-visible ring consistente em alguns botões.

### Baixos
8. **Breakpoints**: Sem dados reais de viewport; marca como `unverified - confirm first`.
9. **Contraste exato**: Alguns textos em `text-white/40` podem estar abaixo de AA em tamanhos pequenos.

## Status do trabalho
### Fase 1-4: Concluído parcialmente
- Rotas mapeadas ✅
- Regras documentadas ✅
- Tokens listados ✅
- Padrões legados varridos ✅
- Gaps registrados com caminho/linha ✅

### Bloqueio atual
Token Standardization (Fase 2) está bloqueada pelo resíduo non-PIX em payment-links/new. Sem esse cleanup, padronizar pills/botões/radius nesse fluxo introduziria dados inválidos ou UI órfã.

### Próximas ações recomendadas
1. **Remover resíduo non-PIX de payment-links/new** (bloqueio atual)
2. **Substituir hardcoded colors por tokens CSS**
3. **Remover mockup-* classes ativas**
4. **Padronizar pills/botões/radius**
5. **Remover sombras decorativas**
6. **Unificar headers admin vs merchant**
7. **Build check + smoke test**

## Arquivos modificados nesta sessão
- `src/components/landing/landing-cta.tsx` - estrutura JSX corrigida
- `DESIGN.md` - versionamento/documentação
- `TODOS.md` - atualizações de status
