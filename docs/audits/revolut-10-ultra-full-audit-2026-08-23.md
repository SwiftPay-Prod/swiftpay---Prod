# Auditoria Completa Revolut 10 / Ultra — SwiftPay UI — 2026-08-23

> **Modo:** somente leitura, sem alteração de código. Workflow Matt Pocock + Impeccable + Frontend Design.  
> **Canônico:** `DESIGN.md` v2.0.0 R1–R11 (conflito prefere DESIGN.md).  
> **Período:** 2026-08-23 — auditoria visual/estrutural estática (grep/read/glob, sem viewport real).  
> **Superfícies não tocadas por planos anteriores incluídas.**

---

## 1. Fase 1 — Inventário de superfícies e regras

### 1.1 Inventário completo de rotas/superfícies

#### Públicas (fora de `/panel`)

| Rota | Arquivo | Tipo |
|------|---------|------|
| `/` | `src/app/page.tsx` → `src/components/landing/landing-page.tsx` + `landing-hero.tsx`, `landing-cta.tsx`, `landing-header.tsx`, `landing-pillars.tsx`, `landing-pricing.tsx`, `landing-footer.tsx` + `auth-modal.tsx` + `splash-redirect.tsx` | Landing + Auth modal (signin/signup/forgot/reset) |
| `/splash` | `src/app/splash/page.tsx` + `src/components/splash-redirect.tsx` | Splash loading |
| `/verify-email` | `src/app/verify-email/page.tsx` | Verificação pública |
| `/confirm-email` | `src/app/confirm-email/page.tsx` → `confirm-email-content.tsx` | Confirmação e-mail |
| `/docs` | `src/app/docs/page.tsx` (876 linhas, `bg-slate-950` legada) | Docs públicas |
| `/boleto/[paymentId]` | `src/app/boleto/[paymentId]/page.tsx` + `boleto-page-content.tsx` + `not-found/page.tsx` | Viewer boleto (legado) |
| `/boleto/[paymentId]/expired` | `src/app/boleto/[paymentId]/expired/page.tsx` | Boleto expirado |
| `opengraph-image.tsx` | `src/app/opengraph-image.tsx` | OG image (gradient `#494fdf` → `#00a87e`) |

#### Panel — rotas autenticadas (`src/app/panel/(main)`)

**Admin (14 superfícies):**

| Rota | Arquivos principais |
|------|---------------------|
| `/panel/admin/dashboard` | `admin/dashboard/admin-dashboard.tsx` + `tabs/{overview,financial,transactions,users-orgs,growth}-tab.tsx` |
| `/panel/admin/merchants` | `merchants/merchants-table.tsx` + `[id]/merchant-details.tsx` + `tabs/*` + `[id]/evaluate/*` |
| `/panel/admin/users` | `users/users-table.tsx` + `[id]/page.tsx` |
| `/panel/admin/transactions` | `transactions/transactions-table.tsx` + `modals/admin-transaction-details-modal.tsx` |
| `/panel/admin/payouts` | `payouts/cashouts-table.tsx` |
| `/panel/admin/acquirers` | `acquirers/acquirers-table.tsx` + `[id]/acquirer-details.tsx` + `tabs/config-tab.tsx`, `required-fields-tab.tsx` + `acquirer-ranking-list.tsx` + `access-accounts/acquirer-access-accounts-tab.tsx` |
| `/panel/admin/balances` | `balances/platform-balances.tsx`, `platform-balances-mobile.tsx`, `reconciliation-modal.tsx`, `adjustment-history-modal.tsx`, `create-adjustment-modal.tsx` |
| `/panel/admin/referrals` | `referrals/referrals-table.tsx`, `referral-withdrawal-requests-table.tsx` |
| `/panel/admin/templates` | `templates/templates-table.tsx` + `upsert/[templateId]` |
| `/panel/admin/platform-settings` | `platform-settings/platform-settings-form.tsx` + helpers/types/hooks + `components/{feature-flags,payment-link-domains,payment-link-domain-method}-accordion.tsx` |
| `/panel/admin/reconciliations` | `reconciliations/reconciliations-table.tsx` |
| `/panel/admin/platform-payouts` | `platform-payouts/platform-payouts-table.tsx` |
| `/panel/admin/platform-payout-accounts` | `platform-payout-accounts/platform-payout-accounts-table.tsx` |
| `/panel/admin/logs` | `logs/logs-table.tsx` |

**Merchant (30 superfícies):**

| Rota | Arquivo |
|------|---------|
| `/panel/merchant/dashboard` | `merchant/dashboard/merchant-dashboard.tsx` + `components/{RevolutHeroBalanceCard,RevolutFinancialMetricsGrid,RevolutAnalyticsChart,PaymentMethodBreakdown,RiskDisputesControl,RevolutPeriodSelector}.tsx` + `DashboardSkeleton.tsx` |
| `/panel/merchant/checkouts` | `checkouts/checkouts-table.tsx` + skeleton + `modals/checkout-details-modal.tsx` |
| `/panel/merchant/checkouts/upsert/[checkoutId]` | `upsert/tabs/{payments,visual,review,operations}-tab.tsx` + `hooks/use-checkout-onboarding.tsx` + schemas |
| `/panel/merchant/payment-links` | `payment-links/payment-links-table.tsx` + skeleton |
| `/panel/merchant/payment-links/new` | `payment-links/new/create-payment-link-form-content.tsx` + `use-create-payment-link-form.ts` + `modals/payment-link-details-modal.tsx` |
| `/panel/merchant/payment-links/[id]/edit` | `[id]/edit/page.tsx` |
| `/panel/merchant/products` (wrapper) | `products/products-table.tsx` |
| `/panel/merchant/physical-products` | `physical-products-table.tsx` + `upsert/physical-product-form.tsx` |
| `/panel/merchant/digital-products` | `digital-products-table.tsx` + upsert |
| `/panel/merchant/services` | `services-table.tsx` + upsert + skeleton |
| `/panel/merchant/orders` | `orders-table.tsx` + `upsert/order-upsert-form.tsx` + `modals/order-details-modal.tsx` |
| `/panel/merchant/customers` | `customers-table.tsx` + `use-customers-table.ts` + `modals/customer-details-modal.tsx` |
| `/panel/merchant/cashouts` | `cashouts-table.tsx` + `automatic-cashout-logs-table.tsx` + modals |
| `/panel/merchant/cashout-accounts` | `cashout-accounts-table.tsx` + `modals/view-account-modal.tsx` |
| `/panel/merchant/transactions` | `transactions-table.tsx` + skeleton + `modals/{create,details}` + `transaction-type-filter.tsx` |
| `/panel/merchant/balance-history` | `balance-history-table.tsx` + skeleton |
| `/panel/merchant/coupons` | `coupons-table.tsx` + `upsert/upsert-form.tsx` + `modals/coupon-details-modal.tsx` |
| `/panel/merchant/integrations` | `integrations-content.tsx` + `components/integration-card.tsx` + `configure-integration-modal.tsx` |
| `/panel/merchant/fees` | `fees-content.tsx` |
| `/panel/merchant/api-credentials` | `api-credentials-table.tsx` + `modals/view-credential-modal.tsx` |
| `/panel/merchant/email-templates` | `email-templates-content.tsx` + upsert |
| `/panel/merchant/ranking` | `ranking-list.tsx` + `components/top-three-podium.tsx` etc. |
| `/panel/merchant/settings` | `settings/settings-content.tsx` (1638 linhas) + skeleton/wrapper |
| `/panel/merchant/review` | `review-content.tsx` + skeleton |
| `/panel/merchant/new` (onboarding) | `forms/merchant-onboarding-form.tsx` + `steps/*` + validation/hook/constants |
| `/panel/merchant/payments/credit-card` | `payments/credit-card/page.tsx` (redirect) + `credit-card-payments.tsx` (legado) |
| `/panel/merchant/achievements` | via `panel/achievements/achievements-page.tsx` |
| `/panel/merchant/live-balance` (immersive) | `(immersive)/merchant/live-balance/live-balance-screen.tsx` + `backgrounds/*.tsx` (19 variantes) + `live-balance-effects.tsx` + `live-balance-notification-stack.tsx` + `live-balance-settings-modal.tsx` |

**Outras panel (nível `/panel`):**

| Rota | Arquivo |
|------|---------|
| `/panel/dashboard` | `panel/dashboard/page.tsx` (redirect genérico) |
| `/panel/referrals` | `panel/referrals/referrals-content.tsx` + tables/modals/forms |
| `/panel/achievements` | `panel/achievements/achievements-page.tsx` + skeleton |
| `/panel/notifications` | `panel/notifications/notifications-content.tsx` |
| `/panel/bulletins` | `panel/bulletins/bulletins-content.tsx` |
| `/panel/profile` | `panel/profile/profile-wrapper.tsx` + tabs |
| `/panel/user-settings` | `panel/user-settings/page.tsx` |
| `/panel/security` | `panel/security/security-content.tsx` + `change-password-modal.tsx` |
| `/panel/help` | `panel/help/page.tsx` |
| `/panel/about` | `panel/about/page.tsx` |
| `/panel/docs` | `panel/docs/page.tsx` |
| `/panel/menu` | `panel/menu/page.tsx` |
| `/panel/dev/tools` | `panel/dev/tools/page.tsx` |

> Descobertas além do listado: `panel/profile`, `panel/user-settings`, `panel/bulletins`, `panel/notifications`, `panel/about`, `panel/help`, `panel/menu`, `panel/dev/tools` — incluídas Fase 3.

### 1.2 Regras canônicas Revolut 10 / Ultra (R1–R11 — DESIGN.md v2.0.0)

| ID | Regra |
|----|-------|
| **R1-SURFACE-HIERARCHY** | True black `#000000` canvas, `#16181a` elevated cards, `#0a0a0a` deep inset, `1px hairline rgba(255,255,255,0.12)` |
| **R2-TYPOGRAPHY-TABULAR** | Montantes e taxas em `font-mono tabular-nums`; labels neutros `text-white/50` |
| **R3-PILL-ACTIONS** | Primário `solid white rounded-full pill black text` (`button-primary`); secundário `dark outline 1px` |
| **R4-ICONOGRAPHY-SQUIRCLES** | Ícones `1.75px stroke rounded caps`, housing `rounded-2xl/xl` `15% opacity` backgrounds |
| **R5-NO-GENERIC-MOCK-COPY** | Terminologia financeira estrita (Taxa de Conversão, Volume Bruto, Faturamento Líquido, Índice de Chargeback) — sem placeholder |
| **R6-MINIMALIST-COBALT-CHARTS** | Charts `gradient #494fdf → transparent`, curva `2.5px`, zero heavy grid, HUD `backdrop-blur` |
| **R7-SEMANTIC-COLOR-DISCIPLINE** | Vermelho/âmbar/verde só em evento real `>0`; zero = `neutral white` |
| **R8-ZERO-MOCKS-IN-PRODUCTION** | Proibido hardcoded/synthetic como dado vivo; omit ou empty state se sem API |
| **R9-REAL-DATA-TRACEABILITY** | Cada métrica nomeia `apiField` (ex: `kpis.approvalRate`, `balance.available`) |
| **R10-REVOLUT-SCOPE** | Design system aplica a **todas** superfícies SwiftPay |
| **R11-PIX-ONLY-GATEWAY** | 100% PIX-only; proibir cartão/boleto/qualquer outro método |

> Nota: `instructions/design-system-and-code-quality` declara R10 escopo restrito a merchant dashboard, conflita com DESIGN.md. **Canônico:** DESIGN.md (todas superfícies).

### 1.3 Tokens (design-system.md + globals.css)

| Categoria | Tokens canônicos | Observação |
|-----------|------------------|------------|
| **Cores — canvas/surface** | `--background:#000000` (dark), `--card:#16181a`, `--surface:#16181a`, `--popover:#1c1c1e`, `--content1:#16181a`, `--content2:#0a0a0a`, `--border:rgba(255,255,255,0.12)`, `--separator:rgba(255,255,255,0.08)` | `globals.css:291-400` dark tokens OK. Light: `#f9f9f9/#ffffff/#e5e5e5`. |
| **Cores — brand/semantic** | `--brand:#494fdf`, `--brand-soft:rgba(73,79,223,0.15)`, `--accent:#494fdf`, `--success:#00a87e`, `--danger/#destructive:#e23b4a`, `--warning:#ec7e00`, `--primary:#ffffff` (pill), `--primary-foreground:#000000`, `--link:#4f55f1` | `design-system.md` legacy lime `#a3e635` ≠ Revolut cobalt — `globals.css` já migrou para cobalt. `--chart-1:#494fdf` etc. |
| **Cores — sidebar** | `--sidebar:#000000`, `--sidebar-foreground:#ffffff`, `--sidebar-primary:#ffffff`, `--sidebar-accent:#16181a`, `--sidebar-border:rgba(255,255,255,0.12)` | Dark-first. |
| **Tipografia** | Famílias `Geist` (sans) `Geist Mono` (mono) `@font-face` variable; escala `text-xs 11px`, `sm 13px`, `base 15px`, `lg 17px`, `xl 20px`, `2xl 24px`, `3xl 30px`; financeiro `font-mono tabular-nums`; labels `text-xs font-medium tracking-wide uppercase` | `design-system.md:92-123` + `globals.css:160-172`. |
| **Spacing** | Tailwind 4px base: `1=4px`, `2=8px`, `3=12px`, `4=16px`, `5=20px`, `6=24px`, `8=32px`, `10=40px`, `12=48px`, `16=64px` | Verificado. |
| **Radius** | `--radius:0.375рем→dark:0.5rem`, `--radius-sm 4px`, `md 6px`, `lg 8px`, `xl 12px`, `2xl 16px`; Revolut elevated `rounded-[20px]`, inset `rounded-[18px]`, pill `rounded-full` | `globals.css` define `radius-xl: calc(var(--radius)*1.4)` etc. |
| **Elevação** | Sem `box-shadow` decorativo; hierarquia via `border+background`; modal overlay `0 8px 32px oklch(0 0 0 /0.4)` única exceção | R4 hairline-only. |
| **Breakpoints** | Tailwind default; dashboard grids `grid-cols-4 → 2 → 1`; responsive gaps `p-5 sm:p-6` etc. | Ver `design-system.md:352-383` |
| **Estados** | `hover: bg-muted/40`, `focus-visible: ring-2 ring-ring/40`, `active: scale(0.99)`, `disabled: opacity-50`, `error: border-destructive` | |
| **Acessibilidade** | WCAG AAA 7:1 primary, AA 4.5:1 muted; `role=dialog`, `aria-modal`, `Esc` fecha modais; `tabIndex`+`Enter/Space` em cards | |
| **Immutables** | **Classes legadas proibidas** ainda vivas listadas Fase 2 | |

---

## 2. Fase 2 — Padrões legados ativos (grep + read)

| # | Padrão | Evidência (path:linha aproximada) | Severidade | Notas |
|---|--------|-----------------------------------|------------|-------|
| L01 | **`mockup-*` 38+ definições** em `globals.css:672-984` (`mockup-kpi-card`, `mockup-kpi-label`, `mockup-kpi-value`, `mockup-chart-card`, `mockup-sandbox-banner`, `mockup-header-btn`, `mockup-layout-picker`, etc.) — **0 uso em merchant** pós-migração, mas definições permanecem (débito morto) | `globals.css:673-984` + `TODOS.md:137 BLOCKED` | **Média** | Remover ou migrar para co-localizado; bloqueia tree-shaking; auditada como baixa visual, média dívida |
| L02 | **Hardcoded hex `~380 ocorrências`** `bg-[#16181a]`, `bg-[#0a0a0a]`, `text-[#494fdf]`, `text-[#4f55f1]`, `bg-[#00a87e]/15`, `text-[#e23b4a]`, `bg-[#ec7e00]/15` em `src/app/panel/(main)/merchant/**/*` (42 arquivos), `admin/**/*` (~15 arquivos), `landing-cta.tsx:18`, `help/page.tsx`, `live-balance-screen:335` etc. | `merchant/checkouts-table.tsx:182`, `merchant/dashboard/*:52`, `admin/acquirers-table:545`, `landing-cta:18 bg-gradient-to-r via-[#494fdf]` | **Média** | Visual correto (hierarquia cumprida), mas viola `bg-card`/`text-brand` tokens — dívida P1 tokenização |
| L03 | **`bg-gradient-*` decorativo** | `help/page.tsx:295 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500`, `landing-cta.tsx:18 bg-gradient-to-r via-[#494fdf]`, `live-balance/backgrounds/*.tsx` (19 gradientes), `splash/page.tsx:9 bg-linear-to-br from-accent/5 to-accent/10`, `confirm-email:27-35 BackgroundGradientAnimation` | **Baixa/Média** | `landing-cta` cobalt highlight é canônico R6 (tolerado); `help` Instagram gradient é legada e viola R4 hairline — remover; `live-balance` maximalista documentado como exceção imersiva (ver M17) |
| L04 | **Paleta light/slate legada** | `src/app/docs/page.tsx:35 bg-slate-950`, `bg-slate-900`, `border-slate-800`, `text-slate-300`, `bg-slate-800` (22+ ocorrências), `src/app/boleto/**/page.tsx:67 bg-zinc-950`, `src/app/error.tsx:18 bg-[#0B0E14]`, `opengraph-image.tsx:35 linear-gradient #494fdf→#00a87e` | **Alta (docs)** / Baixa (boleto) | `/docs` pública inteira em `slate-900/950` conflita R1 true black `#000000` + Revolut scope R10 — requer migração para `bg-[#000000]/bg-[#16181a]/border-white/12`; boleto viewer usa `zinc-950` (neutro, aceitável como standalone mas não tokenizado) |
| L05 | **Sombras decorativas `shadow-*`** ~38 arquivos | `live-balance-screen:334 shadow-2xl`, `live-balance-notification-stack:37 shadow-[0_18px...]`, `admin/complement-history-accordion:49 shadow-xs`, `admin/history-tab:812 shadow-lg`, `help/page:41 hover:shadow-lg`, `cashout-accounts-table:171 shadow-xl`, `merchant/reconciliation-modal`, `landing-cta shadow-2xl` etc. | **Média** | R4 proíbe shadows — migrar para `border` + `bg-*` elevação |
| L06 | **`SystemAccordion` hardcoded color map** | `src/components/ui/system-accordion.tsx:10-32 ACCORDION_COLOR_MAP` com 23 cores hardcoded (`accent:#4f55f1`, `blue:#60a5fa`, `emerald:#00a87e` etc.) + `buildColorMix` | **Média** | Viola R1 tokenização; já tem nova casca `rounded-[20px] border-white/12 bg-[#16181a]` mas lógica de cor interna permanece legada |
| L07 | **Accordions/cards legados** `bg-surface`, `bg-content1`, `border-divider` (light tokens) em dark-first | `admin/acquirers/[id]/tabs/config-tab:212,527,805`, `admin/balances/reconciliation-modal:188,231`, `admin/logs/logs-table:120,332`, `admin/evaluate/merchant-evaluate:659`, `merchant/settings` previews ocasionalmente | **Média** | ~15 arquivos admin com `bg-surface`/`border-divider` — migrar para `bg-[#16181a]/bg-[#0a0a0a]/border-white/12` |
| L08 | **Ícones/pills legados** `CreditCardIcon`, `BarCodeIcon` órfãos | `payments-tab:8`, `operations-tab:9`, `merchant-onboarding compliance-step:12`, `acquirers/acquirers-table:5`, `credit-card-payments.tsx` | **Alta (R11)** | Sinal de escopo PIX-only não purgado — ver R11 seção 4 |
| L09 | **Skeletons sem `aria-busy`** | 12 `*-skeleton.tsx` (`acquirers-table-skeleton:108`, `transactions-table-skeleton`, `merchant-dashboard DashboardSkeleton` etc.) | **Baixa** | A11y gap |

> Verificação: `grep mockup-` → 0 uso em merchant, 38 defs globais; `grep bg-gradient-*` → 4 não-immersive + 19 immersive; `grep #16181a|#494fdf` → 380+ hardcoded.

---

## 3. Fase 3 — Auditoria por superfície (gaps)

### 3.1 Admin — 14 superfícies (detalhe completo)

| # | path | componente | regra violada | sev | evidência |
|---|------|------------|---------------|-----|-----------|
| A01 | `acquirers/acquirers-table.tsx:298-299` | `renderMobileAcquirerCard` | **R1** | Média | `border-divider bg-surface p-3` — token light vs `bg-[#16181a] border-white/12`. Desktop L600+ correto; mobile diverge. |
| A02 | `acquirers/[id]/tabs/config-tab.tsx:212,527,805,903,1536,1744,1834,1904` (7 instâncias) | `Accordion.Item` | **R1** | Média | `rounded-xl border-divider bg-surface` repetido; `bg-content1` em `:1068,1224,1380`. |
| A03 | `balances/reconciliation-modal.tsx:188,231,240,318,432-433,456,482,535,574,623` | `ReconciliationModal` | **R1** | Média | `bg-surface-secondary`, `bg-surface`, `bg-content1`, `border-foreground/10` — ex: `rounded-lg bg-surface-secondary p-3` L188. |
| A04 | `balances/adjustment-history-modal.tsx:35,138` | `AdjustmentHistoryModal` | **R1** | Baixa | `border-divider bg-surface p-3` |
| A05 | `balances/create-adjustment-modal.tsx:171` | `CreateAdjustmentModal` | **R1** | Baixa | `border-line bg-surface` |
| A06 | `logs/logs-table.tsx:120,123,332,441,562,1000,1272` | `AcquirerIdentity`, modais `Api/Security/EmailLogDetailsModal`, `renderMobileLogCard` | **R1** | Média | `border-divider`, `bg-content1`, `bg-surface` — ex L999 `bg-surface` mobile card; L332 `bg-content1 p-3`. |
| A07 | `merchants/[id]/tabs/*`, `merchants/[id]/evaluate/components/*` | `ledger-timeline:129`, `merchant-evaluate:659`, `pending-responses-card:79`, `complement-history-accordion:49-70`, `general-tab:184,202` | **R1/R4** | Média | `bg-surface`, `bg-content1`, `border-divider` — L659 `border-divider bg-surface hover:bg-surface-secondary`. |
| A08 | `merchants/[id]/evaluate/components/accordions/complement-history-accordion.tsx:49` | `ComplementHistoryAccordion` | **R4** | Média | `... border-divider bg-content1 p-3 shadow-xs border-l-4` — `shadow-xs` proibido R4. |
| A09 | `merchants/[id]/tabs/history-tab.tsx:812` | `HistoryTab` modal | **R4** | Baixa | `Modal.Dialog ... shadow-lg` |
| A10 | `acquirers/acquirers-table.tsx:351-358,193-196` | Mobile + desktop badges | **R11** | **Alta** | `{supportsBoleto && <span>Boleto</span>} {supportsCreditCard && <span>Cartão</span>}` |
| A11 | `acquirers/[id]/tabs/config-tab.tsx:33,126-128,304-306,342-346,381-383,420-424,491-493,502` + `required-fields-tab:278-288` | `ConfigTab` + `RequiredFieldsTab` | **R11** | **Alta** | `CreditCardIcon/BarCodeIcon`, `appendMethodSummary(Boleto/Cartão)`, `supportsBoleto/CreditCard`, `boletoEnabled/creditCardEnabled`, `minBoletoAmount`, `Liquidação D+X no boleto/cartão`; cards `Boleto`/`Cartão de Crédito`. |
| A12 | `merchants/[id]/evaluate/merchant-evaluate.tsx:82-84,198-201,712-728,754-758` | `MerchantEvaluate` | **R11** | **Alta** | `UsesBoleto/UsesCreditCard`, chips `Boleto`/`Cartão`, `formatFeeDisplay(boletoInFee…)` |
| A13 | `transactions/modals/admin-transaction-details-modal.tsx:45,519-524` | `AdminTransactionDetailsModal` | **R11** | **Alta** | `BoletoBarcodeImage` + seção `Dados do Boleto` |
| A14 | `acquirers/acquirers-table.tsx:5` | imports | **R11** | Baixa | `CreditCardIcon, BarCodeIcon` órfãos |
| A15 | `acquirers/acquirers-table.tsx:573-576` | KPI "Operando PIX SPI" | **R7** | Média | `text-[#00a87e]` fixo mesmo quando `activeAcquirers===0` — deveria ser `text-white` neutro R7 |
| A16 | `acquirers/acquirers-table.tsx:69,102` | `FeeDisplay` / `FeeAndLimitDisplay` | **R2** | Baixa | L102 `text-xs font-mono text-white/50` **sem `tabular-nums`** |
| A17 | `dashboard/tabs/overview-tab.tsx:322` | `ApprovalHealthBar` | **R1/R4** | Baixa | `... ? bg-[#00a87e] : text-[#ec7e00]` — ramo `false` deveria ser `bg-[#ec7e00]` (bug cor/fundo) |
| A18 | `admin-dashboard.tsx:371-391` | `AdminDashboardSkeleton` | **R1** | Baixa | `<Card>` genérico vs `rounded-[20px] border-white/12 bg-[#16181a]` |
| A19 | `platform-settings/platform-settings-form.tsx:327,415` | `PixAccordion` internos | **R1** | Baixa | `border-divider bg-content1 p-3` dentro de form dark |
| A20 | `templates/templates-table:172-272`, `merchants/merchants-table:263-322`, `transactions/transactions-table:263-355` | `renderMobile*Card` | **A11y** | Média | `role=button tabIndex=0 onKeyDown` OK, mas sem `aria-label` descritivo — WCAG 4.1.2 |
| A21 | `platform-balances.tsx:274-487`, `platform-balances-mobile:274-295` | botões ícone | **A11y** | Média | `h-8 w-8` sem `aria-label` (eye/refresh/shield) |
| A22 | `logs/logs-table.tsx:1303` | `InternalTabs` | **A11y** | Baixa | `DataTable` em `Suspense` sem `aria-live`/`aria-busy` |
| A23 | `acquirers/acquirers-table:299`, `merchants/merchants-table:270`, `logs/logs-table:1000` | mobile `cursor-pointer` | **R3** | Baixa | Ação primária via `card onClick` sem `pill` visível |
| A24 | `acquirers/acquirers-table:644,687-688,727` | Modal create | **R1/R2** | Baixa | `Input ... text-xs` sem `font-mono tabular-nums` |
| A25 | `reconciliations/*`, `platform-payouts/*`, `platform-payout-accounts/*` | tabelas | **R2** | Baixa | `formatCurrency` sem `tabular-nums` explícito (depende de `DataTable`; `unverified — confirm first`) |
| A26 | `balances/reconciliation-modal` (nota adicional) | `reconciliation-modal` | **R10** | Baixa | `border-warning/40 bg-warning/5` (light token) vs `border-[#ec7e00]/30` (dark) — inconsistência intra-módulo |

**Checklist Admin por categoria:**

| Categoria | Status | Notas |
|-----------|--------|-------|
| Tipografia (R2) | ⚠️ Parcial | `AnimatedCurrency` + KPI `font-mono tabular-nums` OK; gaps: limites sem `tabular-nums`, `DataTable` sem garantia explícita, labels `text-white/40` vs `text-white/50` inconsistente. |
| Espaçamento | ✅ Aderente | `gap-6`, `p-5 sm:p-6`, `pb-5 border-b`, `gap-4` grids — padrão Revolut. |
| Cores (R1+R7) | ❌ Não aderente | R1 OK majority dark; falha ~15 arquivos `bg-surface` etc.; R7 falha KPI verde fixo. |
| Estados | ⚠️ Parcial | hover `border-white/15` OK; `focus-visible` `unverified — confirm first`. |
| Acessibilidade | ⚠️ Parcial — `unverified` contraste | mobile cards OK `role/button`; faltam `aria-label`, `aria-busy`; contraste `white/40` s/ `#16181a` não validado — sugerir axe/Lighthouse. |
| Breakpoints | ✅ Aderente — `unverified` sem viewport | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `flex-col sm:flex-row`, `p-5 sm:p-6` presentes em todas superfícies. Confirmar 375/768/1280 manual. |
| R3 Pill | ⚠️ Parcial | pills onde existem OK; mobile `card onClick` sem pill. |
| R4 Hairline | ❌ Não aderente | 2 violações `shadow-xs/lg`. |
| R8-R11 | ❌ R11 crítica | R8/R9 OK (dados de API); R11 falha 7 arquivos Boleto/Cartão. |

### 3.2 Merchant — 30 superfícies (resumo + gaps críticos)

**Gaps Merchant (M01–M22):**

| # | path | componente | regra | sev | evidência |
|---|------|------------|-------|-----|-----------|
| M01 | `checkouts/upsert/hooks/use-checkout-onboarding.tsx:46-48,257-258,355-358` | Hook onboarding | **R11** | 🔴 Alta | `creditCardEnabled/boletoEnabled`, `hasPaymentMethod = pix‖creditCard‖boleto` |
| M02 | `checkouts/upsert/tabs/payments-tab.tsx:8` | PaymentsTab | **R11** | 🔴 Alta | `CreditCardIcon, Invoice02Icon` órfãos |
| M03 | `checkouts/upsert/tabs/operations-tab.tsx:9,152,181` | OperationsTab | **R11** | 🔴 Alta | `CreditCardIcon` header + métrica |
| M04 | `merchant/payments/credit-card/credit-card-payments.tsx:6,89,104,284-305` + `page.tsx:4` | Superfície cartão | **R11** | 🔴 Alta | `PaymentMethod.CreditCard`, `Cartão de Crédito`, superf. legada (redirect atenua, código morto viola R10) |
| M05 | `merchant/new/constants/merchant-onboarding.constants.ts:72-73,112-113` | Onboarding constants | **R11** | 🔴 Alta | `answers.paymentMethods.includes(CreditCard)`, `push(Boleto/CreditCard)` via `kyc.usesBoleto` |
| M06 | `merchant/new/forms/steps/compliance-step.tsx:12,38,50` + `merchant-onboarding-form:27,155,344` + `validations:120` + `hooks/use-merchant-onboarding-form:53` | Compliance + form + validação + hook | **R11** | 🔴 Alta | `CreditCardIcon`, `showCreditCardWarning`, `UsesCreditCard → paymentMethods` |
| M07 | `payment-links/new/create-payment-link-form-content.tsx:111-112,340,365,407,544,605` + `modals/payment-link-details-modal:6,95,195` + `use-create-payment-link-form:59,75` | Payment Links create + details | **R11** | 🔴 Alta | `boletoEnabled/creditCardEnabled`, `boletoDueDate/Instructions`, `Vencimento do boleto` |
| M08 | `dashboard/components/RevolutHeroBalanceCard.tsx:21-23` | Hero contrato TS | **R11** | 🔴 Alta | `boletoReservePercentage/creditCardReservePercentage` |
| M09 | `fees/fees-content.tsx:110-112,238-242` | Fees | **R11** | 🟡 Média | `ReadFeesData` shape inclui boleto/cartão flags (discipline incompleta) |
| M10 | `*` ~380× hardcoded hex | Tokens | **R1** | 🟡 Média | `bg-[#16181a]/bg-[#0a0a0a]/text-[#494fdf]/bg-[#00a87e]/15` vs `bg-card/text-brand/bg-success/15` — visual OK, débito token |
| M11 | `dashboard/merchant-dashboard.tsx:252-256` | QuickActions | **R3** | 🟡 Média | `border-white/20 bg-white/5`, `rounded-[16px]` vs `rounded-full bg-white text-black pill` |
| M12 | `dashboard/components/RevolutFinancialMetricsGrid:75-79,148-152` + `balance-history:80-83` + `cashouts:372` + `coupons:326` | KPI badges | **R7** | 🟡 Média | verde/vermelho sem guarda `>0` (ex `coupons active=0` verde) |
| M13 | `checkouts/upsert/tabs/visual-tab:51-52,61-62` | VisualTab presets | **R1** | 🔵 Baixa | `PRESET_COLORS #3B82F6/#8B5CF6/#EC4899` fora Revolut (custom merchant — baixa, documentar exceção) |
| M14 | `ranking/ranking-list:249,262`, `checkouts-table:83-85`, `cashout-accounts:99` | Icon squircles | **R4** | 🔵 Baixa | `rounded-lg 7×7` vs `rounded-xl/2xl` canônico |
| M15 | `transactions/transactions-table:316` + `payment-links/payment-links-table:360` | Mobile cards | **R2/R8** | 🔵 Baixa | `D+0 SPI` estático (label, não métrica — tolerável) |
| M16 | `settings/settings-content:879,946,1020` | Settings previews | **R1/R2** | 🔵 Baixa | `bg-[#00a87e]/15` hardcodado, `Chip` sem `tabular-nums` |
| M17 | `live-balance-screen:97-99,219-258` + `backgrounds/*.tsx` (19) | Live Balance immersive | **R6/R1** | 🔵 Baixa | maximalista vs R6 minimalista — por design teatral; `totalRevenue AnimatedCurrency` traceável OK; backgrounds gradientes não-cobalt — documentar como **exceção imersiva** |
| M18 | `transactions/modals/merchant-transaction-details-modal:298-299` | Copy-paste | **R1/A11y** | 🔵 Baixa | `bg-[#0a0a0a] border-white/10` OK; `truncate` pode cortar PIX longo sem `break-all` |
| M19 | `coupons-table:81-85`, `customers-table:198-200` | Tabelas densidade | **R1** | 🔵 Baixa | skeletons `bg-white/10` sem `animate-pulse` tokenizado |
| M20 | `integrations-content:290`, `fees-content:42,56,82`, `ranking:226` | Containers vazios | **R5** | 🔵 Baixa | copy OK (`Nenhuma integração…`), sem mock |
| M21 | `physical-products-table:397-416`, `services-table:416-435` | Catálogos | **R2** | ✅ | `Preço Médio PIX AnimatedCurrency tabular-nums` aderente |
| M22 | `*-table-skeleton.tsx` (12 arquivos) | Skeletons | **R1/A11y** | 🔵 Baixa | hierarquia `bg-[#16181a] border-white/12` OK; falta `aria-busy` unverified |

> Nota: `grep mockup-*` em `merchant/(main)` = **0** (limpo). `bg-gradient-*` = **0** exceto live-balance immersive + `RevolutAnalyticsChart` cobalt gradient (canônico R6 aderente).

**Checklist Merchant (resumo):**

| Regra | Veredito | Nota |
|-------|----------|------|
| R1 Surface | ✅ visual / 🟡 débito token | `bg-[#16181a] border-white/12` + `bg-[#0a0a0a] inset` consistente; gap só hardcoded vs token |
| R2 Tabular | ✅ Aderente | `HeroBalanceCard font-mono tabular-nums`, `FinancialMetricsGrid`, `netAmount` etc.; labels `white/50` |
| R3 Pill | 🟡 Parcial | `PeriodSelector rounded-full` OK; `QuickActions rounded-[16px]` não-pill |
| R4 Squircles | 🟡 Parcial baixa | `7×7 rounded-lg bg-*/15` vs `rounded-xl/2xl` canônico |
| R5 Copy | ✅ Aderente | `Volume Bruto`, `Taxa Conversão PIX`, `Índice Chargeback` — sem mock genérico |
| R6 Cobalt Charts | ✅ Aderente | `RevolutAnalyticsChart:99 gradient #494fdf`, curva 2.5px, zero grid, HUD `backdrop-blur` exemplar |
| R7 Semantic | 🟡 Parcial | guarda `>0` na maioria; `coupons active=0` verde viola |
| R8 Zero Mocks | ✅ aderente (1 ressalva baixa) | `D+0 SPI` label estático tolerável |
| R9 Traceability | ✅ Aderente | `balance.available`, `kpis.approvalRate`, `netAmount`, etc. tipados |
| R10 Scope | ✅ Aderente | dark-first unificado |
| R11 PIX-only | 🔴 Violado alta | 8 superfícies + 1 superfície legada inteira tocam boleto/cartão |
| Tokens cores | ✅ visual / 🟡 debt | hardcoded vs `text-brand` etc. |
| Tokens radius/elevação | ✅ | `rounded-[20px]`/`18px`/`full` consistente |

### 3.3 Públicas — 8 superfícies

| # | path | componente | regra | sev | evidência |
|---|------|------------|-------|-----|-----------|
| P01 | `src/app/docs/page.tsx:35-129` | Docs pública inteira | **R10/R1** | **Alta** | Paleta `bg-slate-950`, `bg-slate-900`, `border-slate-800`, `text-slate-300`, `bg-emerald-500/15` — `slate`/`emerald` legada, não Revolut true black/cobalt. Toda página diverge. |
| P02 | `src/app/docs/page.tsx:129-258` | Docs cards/sections | **R1/R4** | Média | `bg-slate-900 border-slate-800 rounded-2xl shadow-sm` — nunca `bg-[#16181a] border-white/12`; shadows decorativos. |
| P03 | `src/app/boleto/[paymentId]/page.tsx` + `boleto-page-content.tsx:21-67` | Boleto viewer | **R11** | **Alta** | **Superfície inteira é método proibido** — viewer de boleto completa (`getBoletoData`, `pdfUrl`, `isExpired`, `amount` boleto) viola R11 PIX-only. Mesmo se legada, exposta publicamente. |
| P04 | `src/app/boleto/[paymentId]/expired/page.tsx:67-78` | Boleto expirado | **R11** | **Alta** | `bg-zinc-950` + copy `Boleto Expirado`; mesma violação R11 |
| P05 | `src/app/boleto/not-found/page.tsx` | Boleto not-found | **R11** | Média | Rota residual boleto |
| P06 | `src/components/landing/landing-cta.tsx:18` | CTA highlight | **R4** | Baixa | `bg-gradient-to-r via-[#494fdf] opacity-80` — gradiente usado como border highlight cobalt (canônico), mas usa `shadow-2xl` (`rounded-3xl border-white/12 bg-[#16181a] shadow-2xl`) viola R4 hairline |
| P07 | `src/components/landing/landing-page.tsx:52-56` | Primary/secondary actions | **R3/R1** | Baixa | `primaryActionClassName = rounded-full bg-accent` — usa `bg-accent (#494fdf)` correto mas não `bg-white text-black` pill branca Revolut (landing tem estética própria light) — **divergência R10**: landing pública intencionalmente não é dark-first; registrar como **exceção documentada** ou migrar para `button-primary` |
| P08 | `src/app/splash/page.tsx:9` | Splash | **R1/R4** | Baixa | `bg-linear-to-br from-accent/5 to-accent/10` — gradiente sutil OK, mas não tokenizado como canvas sólido; minimal, baixa |
| P09 | `src/app/confirm-email/confirm-email-content.tsx:27-39` | Confirm e-mail | **R1** | Média | `BackgroundGradientAnimation` com `rgb(15,23,42)→rgb(30,58,138)` + `firstColor 59,130,246` etc. — **totalmente fora Revolut** (gradientes animados, `slate` não-black). Viola R10 scope; `Card bg-background/80 backdrop-blur` não é `bg-[#16181a]`. |
| P10 | `src/app/verify-email/page.tsx:59-60` | Verify e-mail | **R1** | Baixa | `min-h-screen bg-background p-4` — usa `bg-background` tokenizado OK; `Card max-w-lg p-8` genérico, não `rounded-[20px] bg-[#16181a]`, mas aceitável como pública |
| P11 | `src/app/panel/docs/page.tsx:13` | Panel docs placeholder | **A11y** | Baixa | `Internal docs` genérico, sem gaps visuais críticos |
| P12 | `src/app/page.tsx` (root) → `auth-page-client.tsx` | Root + Auth | **R1** | Baixa | `LandingPage` composition + `AuthModal` dark correcta (`bg-[#16181a] border-white/12 shadow-2xl`) — modal OK, mas `backdrop bg-[#000000]/85 backdrop-blur-md` correto; `shadow-2xl` residual viola R4 |
| P13 | `src/components/landing/auth-modal.tsx:33` | Auth modal | **R4** | Baixa | `rounded-[24px] border-white/12 bg-[#16181a] shadow-2xl` — correta exceto shadow |
| P14 | `src/app/error.tsx:18` | Global error | **R1** | Baixa | `bg-[#0B0E14] border-[#1E2638] bg-[#121721]` — paleta `0B0E14/1E2638` não tokenizada (close to `#000000/#16181a` mas hardcoded diverso) + `shadow-xl` |
| P15 | `src/components/landing/landing-hero.tsx`, `landing-pillars.tsx`, `landing-pricing.tsx` | Landing sections (sample) | **R10/R6** | Baixa | Headlines `80px Aeonik`-like não auditados; grids `gap-12` etc. assumido OK; `unverified — confirm first` para tipografia display |
| P16 | `src/app/opengraph-image.tsx:35,62` | OG image | **R1** | Baixa | `linear-gradient 90deg #494fdf, #00a87e, #494fdf` hardcoded em OG — tolerável como asset |

**Nota R10 pública:** Landing, splash, verify-email, confirm-email **não são dark-first Revolut** — isso é **intencional** (públicas são acquisition, não painel). Se `R10 = todas superfícies` for tomado literal, são violações altas. Recomenda-se ADR: `R10 escopo = painel + immersive; públicas = exceção com tokens próprios` (ver Ações).

**Checklist Públicas:**

| Categoria | Veredito | Nota |
|-----------|----------|------|
| Tipografia | ⚠️ Parcial | Landing usa `text-3xl/5xl font-extrabold tracking-tight` display OK, mas não `tabular-nums` financeiro (não se aplica); `font-mono` em badge `CADASTRO INSTANTÂNEO` correto. |
| Spacing | ✅ | `py-16 sm:py-24`, `p-8 sm:p-16`, `max-w-7xl px-4` consistente |
| Cores | ❌ `/docs` + `confirm-email` não aderentes; landing/splash aderentes com gradientes residuais | `landing-cta bg-[#16181a] border-white/12` OK; `/docs slate` violação alta |
| Estados | ⚠️ | `hover:bg-white/90`, `group-hover:translate-x-1` OK; `backdrop-blur` em modal OK |
| Acessibilidade | ⚠️ `unverified` | `aria-label="Fechar"` em `AuthModal` OK; contraste gradiente `confirm-email` não validado |
| Breakpoints | ✅ aderente — `unverified` | `py-16 sm:py-24`, `flex-col sm:flex-row`, `text-3xl sm:text-5xl`, `p-8 sm:p-16` presentes |
| R11 PIX-only | ❌ `/boleto` viola alta | Viewer inteiro boleto deve ser removido ou gated |

---

## 4. Fase 4 — Componentes compartilhados

| # | path | componente | regra | sev | evidência |
|---|------|------------|-------|-----|-----------|
| C01 | `src/components/ui/system-accordion.tsx:10-32` | `ACCORDION_COLOR_MAP` | **R1** | Média | 23 cores hardcoded (`#4f55f1`, `#60a5fa`, `#00a87e`, `#fbbf24`, `#f87171`, `#e2e8f0` etc.) — nova casca dark OK mas lógica interna legada; migrar para `var(--brand)`/`--success`/`--warning` tokens |
| C02 | `src/components/ui/system-accordion.tsx:87-199` | `SectionAccordionBase` | **R1/R4** | Baixa | Casca `rounded-[20px] border-white/12 bg-[#16181a] overflow-hidden` + `p-4 sm:p-6 bg-[#0a0a0a]/40 border-t white/8` — **correta dark**, mas `focus` não auditável `unverified` |
| C03 | `src/components/panel/sidebar/sidebar.tsx:28-30,37-39` | `Sidebar` | **R1** | ✅ aderente / Baixa | `bg-[#000000] border-r border-white/10` + `border-b border-white/10` — **canônico true black**; `h-12` compacto OK |
| C04 | `src/components/panel/sidebar/sidebar-menu.tsx:120-172,193-218,225-291` | `SidebarMenu`, `MenuItem`, `PopoverMenuItem`, `MenuSectionComponent` | **R4/R1** | Baixa | `bg-white/5`, `border-white/12`, `text-white/50` label, `h-7 w-7 rounded-lg bg-*/15` housing — `rounded-lg` vs `rounded-xl` baixa (ver M14); `role/button tabIndex`? `unverified — confirm first` |
| C05 | `src/components/panel/sidebar/sidebar-effects.css` (deletado) | Sidebar effects | **R4** | Baixa | arquivo removido — validar resíduo import |
| C06 | `src/components/ui/data-table.tsx:240-660` | `DataTable` | **R2/A11y** | Média | Header `th color:var(--foreground) font-weight:600` (globals.css:451) — **força WCAG** vs `text-muted-foreground` spec; `border-b border-border/50`, `hover:bg-muted/40`, `font-mono tabular-nums` para monetários **não garantido** (depende de `cell` class) — gap R2; `aria-busy` em `isPending` ausente; `overflow-x-auto` OK para mobile |
| C07 | `src/components/ui/dropdown-menu.tsx:20-171` + `cashout-accounts-table:171`, `cashouts-table:195`, etc. | `Dropdown.Popover/Menu/Item` | **R1/R4** | Baixa/Média | `min-w-48 bg-[#16181a] border-white/12 rounded-xl shadow-xl backdrop-blur-xl` — dark OK exceto `shadow-xl/2xl` viola R4; `hover:bg-white/5` OK; `aria-label="Ações…"` OK |
| C08 | `src/components/ui/dialog.tsx` + `src/components/ui/modal` (`@heroui`) | `Modal.Dialog`, `Backdrop` | **R1/R4** | Baixa | `rounded-[20px] border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden`, `backdrop bg-black/70 backdrop-blur-sm`, `rounded-[28px] border-white/12 bg-[#16181a] p-6` (acquirers-table modal) — OK exceto `shadow-2xl` residual |
| C09 | `src/components/ui/badge.tsx` + `src/components/ui/revolut-status-badge.tsx` | `RevolutStatusBadge`, `Badge` | **R7** | Baixa | `bg-success/12 text-success border-success/20` etc. conforme `design-system.md:231-238`; semântica OK mas `CheckoutsTable` usa `text-[#00a87e]` hardcoded em vez de `text-success` (débito token) |
| C10 | `src/components/ui/select.tsx:30-96`, `src/components/ui/listbox`, `src/components/ui/chip` | `Select` + `ListBox.Item` + `Chip` | **R1** | Baixa | `Chip variant=soft color=mapParseColorToChipColor(color)` via `mapParseColorToChipColor` — usa `ACCORDION_COLOR_MAP` indiretamente; `ListBox` via `Chip` + `icon+label` correto per `design-system-and-code-quality` |
| C11 | `src/components/ui/button.tsx` + `src/app/globals.css:1150-1189` (`.button-primary`, `.button-outline-dark`) | `Button`, `.revolut-pill` | **R3** | Média | `.button-primary {bg:#ffffff color:#000000 rounded-full}` + `.button-outline-dark {bg:rgba(255,255,255,0.05) border 1px solid rgba(255,255,255,0.12) rounded-full}` — **canônico R3**; gap: muitas superfícies usam `Variant` heroUI (`primary/secondary`) em vez de `.button-primary` (inconsistência) |
| C12 | `src/components/ui/input.tsx`, `src/app/globals.css:498-553` | `Input`, `Field` | **R1/A11y** | Baixa | `bg-surface-secondary`, `border-white/12`, `ring` focus `rgba(255,255,255,0.2)` — OK; `font-size 16px !important` iOS anti-zoom OK mas viola spec `text-sm` (tolerado) |
| C13 | `src/components/ui/internal-tabs.tsx:107` | `InternalTabs` | **R1** | Baixa | `border-white/10`, `bg-white/5` pills; `ariaLabel` OK; `DataTable` em `Suspense` sem `aria-live` (ver A22) |
| C14 | `src/components/ui/background-gradient-animation.tsx` | Gradient component | **R1** | **Alta (se usada em painel)** | Componente inteiro fora Revolut — usado só em `confirm-email`; OK como pública isolada, mas **não usar em painel** |
| C15 | `src/components/ui/icon.tsx` + `revolut-icons.tsx` | `Icon`, `RevolutIconBadge` | **R4** | ✅ | HugeIcons `1.75px stroke`, squircle `rounded-xl/2xl bg-*/15 border-*/25` — OK |
| C16 | `src/components/admin/merchant-actions-dropdown.tsx:442` | `MerchantActionsDropdown` trigger/popover | **R4** | Média | `min-w-60 rounded-2xl border-white/12 bg-[#16181a] p-1.5 shadow-2xl backdrop-blur-xl` — `shadow-2xl` viola R4 (já documentado `revolut-audit-findings:63`) |
| C17 | `src/components/panel/header/{admin-revenue-card,merchant-balance-card}:60,65` | Header popovers | **R4** | Média | `shadow-2xl` |
| C18 | `src/components/panel/mobile-merchant-dashboard.tsx` | Mobile dashboard | **R1/R2** | Baixa | wrapper compacto — assume mesma hierarquia `bg-[#16181a]`; `unverified — confirm first` sem leitura completa |

**Inconsistências entre superfícies:**

| Tema | Superfície A | Superfície B | Divergência |
|------|--------------|--------------|-------------|
| **Elevação** | `admin/acquirers rev 100% dark` | `admin/config-tab + reconciliation-modal` `bg-surface` | Intra-admin light vs dark |
| **Header** | `admin/dashboard-refresh-controls + dashboard-section-header` | `merchant/dashboard QuickActions + hero` | Admin usa controles + header sec separado; merchant integra hero — sem unificação |
| **Skeletons** | `admin-dashboard skeleton Card` | `merchant DashboardSkeleton rounded-[20px] bg-[#16181a]` | Admin diverge |
| **Shadows** | `dropdown popover shadow-xl` everywhere | R4 exige hairline only | Inconsistência global |
| **Hardcoded** | Merchant 380× | Admin ~50× | Ambos hardcodados, merchant pior |
| **Typography** | `help/display 80px` landing | `panel text-xs tabular` | `unverified` se Aeonik display conflita |

---

## 5. Fase 5 — Verificação de fluxo PIX

### 5.1 Mapa de telas/fluxos PIX

| Etapa | Rota/Componente | Dados reais (R9) | Visual (R1,R2,R6) |
|-------|-----------------|------------------|-------------------|
| **Criação Checkout** | `merchant/checkouts/upsert/[checkoutId]` — wizard `payments-tab.tsx` (pixEnabled), `visual-tab.tsx` (presets `#16181a`), `review-tab.tsx`, `operations-tab.tsx`; hook `use-checkout-onboarding.tsx` (`pixEnabled` + `creditCard/boleto` legado) | `checkout.config.pixEnabled` via API | `bg-[#16181a] border-white/12 rounded-[20px]` OK; `visual-tab` palette fora Revolut baixa |
| **Cobrança / QR / Copia e Cola** | `merchant/transactions/modals/merchant-transaction-details-modal.tsx:298` (`copyAndPaste` code `bg-[#0a0a0a] border-white/10 rounded-xl font-mono text-white/70`), `transactions-table.tsx:316` mobile, `checkouts-table.tsx` QR badge | `payment.pixCopyAndPaste`, `payment.pixQrCodeUrl` API | `code break-all` faltante baixa |
| **Confirmação / Status** | `merchant/transactions/transactions-table.tsx` + `balance-history-table.tsx` (reconciliação), `merchant/dashboard RiskDisputesControl` (`taxa chargeback`), `PaymentMethodBreakdown` | `transaction.status`, `balance.status`, `kpis.chargebackRate` | `RevolutStatusBadge` OK; `formatCurrency tabular-nums` OK |
| **Notificação** | `live-balance/live-balance-screen.tsx:97` (`totalRevenue AnimatedCurrency` + `NumberTicket`), `live-balance-notification-stack.tsx:37-54` (tone `success/warning/danger/accent` + `shadow-[0_18px...]` + `backdrop-blur-xl`), `live-balance-effects.tsx` (`wealthBurst`, `moneyRain`, `victory-star`) | `totalRevenue` prop traceável (`merchant.balance.available`) | HUD `border-white/15 bg-[#0a0a0a]/95 rounded-2xl shadow-2xl backdrop-blur-md` — cobalt HUD aderente mas shadows violam R4 |
| **Saldo / Liquidação D+0** | `merchant/dashboard/RevolutHeroBalanceCard:100` (`available/pending`), `balance-history`, `cashouts/cashout-accounts` | `balance.available/pending/reserved`, `balanceData.platformBlocked` | `font-mono tabular-nums` OK; `Available` cyan badge `bg-[#00a87e]/15` OK |
| **Checkout público (merchant-configurado)** | Não há rota `/checkout/[id]` neste repo — checkout público é hospedado por `checkout-upsert` visual config; `payment-link-details-modal` preview | `checkout.config.pixKey`, `checkout.visual` | `rounded-[20px] bg-[#16181a]` OK |
| **Payment Links** | `merchant/payment-links/new/create-payment-link-form-content.tsx:544` (`hasBoleto` + `pixEnabled`), `payment-links-table:360` (`D+0 SPI` badge) | `paymentLink.pixEnabled` | `bg-[#16181a] border-white/12` OK; boleto fields legados |
| **Cashout PIX Out** | `merchant/cashouts-table:195` dropdown `Cancelar`, `cashout-accounts-table:92` `PIX Out` badge `bg-[#00a87e]/15`, `admin/platform-balances` saque | `cashout.status`, `cashout.pixKey`, `acquirer.supportsWithdrawal` | `text-[#00a87e]` hardcoded vs `text-success` |

> `grep PaymentMethod` — único método legítimo `PIX` em dashboard `PaymentMethodBreakdown`; restante legado `CreditCard/Boleto` é violação.

### 5.2 Gaps visuais/estruturais específicos do fluxo PIX

| # | path | componente | regra | sev | evidência |
|---|------|------------|-------|-----|-----------|
| P-PIX01 | `use-checkout-onboarding.tsx:46-48` | onboarding `pixEnabled vs creditCard/boleto` | **R11** | **Alta** | Persistência `boletoEnabled/creditCardEnabled` contamina fluxo PIX puro |
| P-PIX02 | `live-balance-screen:334 shadow-2xl` + `notification-stack:37 shadow-[0_18px]` + `effects:360 shadow-[0_14px]` | Live Balance PIX Live SPI | **R4** | Média | shadows decorativos em fluxo PIX maximalista (exceção documentável) |
| P-PIX03 | `merchant-transaction-details-modal:298 text-xs font-mono text-white/70 truncate` | Copia e Cola PIX | **R2/A11y** | Baixa | Código longo sem `break-all` pode truncar; copiar OK via botão |
| P-PIX04 | `checkouts/upsert/visual-tab:51 PRESET_COLORS #3B82F6` | Checkout visual cor | **R1** | Baixa | Paleta não-tokenizada em configuração do checkout público (escolha lojista — documentar exceção) |
| P-PIX05 | `cashouts/cashouts-table:171 Dropdown.Popover shadow-xl` | Saque PIX | **R4** | Média | shadow |
| P-PIX06 | Fluxo inexistente `/checkout/[id]` público | Checkout público | **R1** | Baixa | ausência não é gap, mas fluxo PIX público não auditável visualmente (`unverified — confirm first`; validar via `checkout.publicUrl`) |
| P-PIX07 | `transactions-table:83-85` + `ranking-list:182` | Badges PIX | **R2** | Baixa | `rounded-lg` vs `rounded-xl` housing |
| P-PIX08 | `RevolutHeroBalanceCard:21 contract boletoReserve` | Contrato saldo | **R11** | Alta | tipagem boleto contamina fluxo PIX |

**Conclusão PIX:** Fluxo PIX visual **aderente** (R1 hierarquia, R2 tabular, R6 HUD) quando puzzle de legado removido; **único bloqueador é R11** — 8 arquivos tocam boleto/cartão no mesmo fluxo, e `boleto` viewer público contradiz R11.

---

## 6. Consolidado — Checklist de aderência por categoria

| Categoria | Status | Evidência resumida |
|-----------|--------|--------------------|
| **Tipografia (R2)** | ⚠️ Parcial | Financeiro `font-mono tabular-nums` correto em `dashboard`, `balance-history`, `transactions`; gaps: `FeeDisplay` limites sem `tabular-nums`, `DataTable` monetários sem garantia explícita, `splash/confirm-email` não aplica (públicas). |
| **Espaçamento** | ✅ Aderente | `gap-6`, `p-5 sm:p-6`, `gap-4` grids em **todas** superfícies admin/merchant/públicas. |
| **Cores (R1+R7)** | ❌ Não aderente | R1 dark correta majoritária, falha `bg-surface/bg-content1` em admin (~15 arq) + `docs slate` + `confirm-email gradient`; R7 falha KPI verde fixo (`activeAcquirers`, `coupons active=0`). |
| **Radius** | ✅ Aderente | `rounded-[20px]` elevated, `rounded-[18px]` inset, `rounded-full` pills, `rounded-2xl/xl` squircles — consistente. |
| **Elevação (R4)** | ❌ Não aderente | ~38 arquivos `shadow-xl/2xl/md` (`live-balance`, `dropdown`, `modal`, `help`, `confirm-email`) vs R4 hairline-only. |
| **Estados (hover/focus/disabled)** | ⚠️ Parcial — `unverified focus` | Hover `border-white/15 bg-white/5` OK; `disabled opacity-50` OK; `focus-visible ring-white/20` precisa teste Tab manual. |
| **Acessibilidade** | ⚠️ Parcial — `unverified — confirm first` contraste | `role=button tabIndex=0 Enter/Space` mobile cards OK; faltam `aria-label` icon-only, `aria-busy` skeletons, `aria-live` `DataTable`; contraste `white/40 s/ #16181a` (~5.6:1 estimado) não validado — rodar `axe/Lighthouse` manual. |
| **Breakpoints** | ✅ Aderente — `unverified — confirm first` sem viewport | `hidden md:block` DataTable + `md:hidden` MobileCard + `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` + `flex-col sm:flex-row` + `p-5 sm:p-6` presentes **em todas** superfícies; confirmar 375/768/1280 manual. |
| **Pills/Botões (R3)** | ⚠️ Parcial | `button-primary`/`button-outline-dark` canônicos definidos; `QuickActions` + `platform-settings` secundários não-pill (`rounded-[16px]/xl`); `RevolutPeriodSelector rounded-full` OK como referência. |
| **Icon Squircles (R4)** | ⚠️ Parcial baixa | `1.75px stroke` OK (Hugeicons); housing `rounded-lg 7×7 bg-*/15` vs `rounded-xl/2xl` canônico. |
| **Charts (R6)** | ✅ Aderente | `RevolutAnalyticsChart` gradient `#494fdf→transparent`, curva 2.5px, zero grid, HUD `backdrop-blur` exemplar. |
| **Copy (R5)** | ✅ Aderente | `Volume Bruto`, `Faturamento Líquido`, `Taxa Conversão`, `Índice Chargeback`, `Liquidação D+0 SPI` — sem generic mock. |
| **R8 Zero Mocks** | ✅ Aderente (1 ressalva baixa) | Métricas traceáveis `balance.available`, `kpis.approvalRate`; ressalva `D+0 SPI` label estático tolerável. |
| **R9 Traceability** | ✅ Aderente | `admin financial.totalVolume`, `merchant payment.netAmount`, `dashboard balance.available` tipados. |
| **R10 Scope** | ❌ Não aderente (se literal) | `R10=todas superfícies` violaria docs/boleto/confirm-email públicas; recomendado ADR: painel+immersive = Revolut, públicas = exceção. |
| **R11 PIX-only** | 🔴 **Violado crítico** | **7 admin + 8 merchant + 3 boleto docs** tocam boleto/cartão; requer P0 purge; `grep boleto/creditCard` deve retornar 0. |

---

## 7. Tabela mestre de gaps (path | componente | regra | severidade | evidência) — consolidado 60 gaps

> Ordenado por severidade (Alta → Média → Baixa). Cada linha auditável via `read` direto.

| ID | path | componente | regra | sev | evidência (trecho/linha) |
|----|------|------------|-------|-----|--------------------------|
| **G01** | `src/app/boleto/[paymentId]/page.tsx` + `boleto-page-content.tsx:11-59` | Viewer boleto público | **R11** | 🔴 Alta | `getBoletoData(paymentId)` + `pdfUrl` + `isExpired` — superfície inteira boleto (100% não-PIX) |
| **G02** | `src/app/boleto/[paymentId]/expired/page.tsx:47-78` | Boleto expirado | **R11** | 🔴 Alta | `Boleto Expirado` + `getBoletoData` + `bg-zinc-950` |
| **G03** | `src/app/docs/page.tsx:35-129` | Docs pública | **R10/R1** | 🔴 Alta | `bg-slate-950/900 border-slate-800 text-slate-300` legada slate |
| **G04** | `admin/acquirers/acquirers-table.tsx:351-358` | Mobile badges | **R11** | 🔴 Alta | `supportsBoleto/supportCard CreditCard && <span>Boleto/Cartão</span>` |
| **G05** | `admin/acquirers/[id]/tabs/config-tab.tsx:33,126-128,304-306,342-346,381-383,420-424,491-493` | ConfigTab | **R11** | 🔴 Alta | `CreditCardIcon/BarCodeIcon`, `appendMethodSummary(Boleto/Cartão)`, `supportsBoleto/CreditCard`, `minBoletoAmount` |
| **G06** | `admin/acquirers/[id]/tabs/required-fields-tab:278-288` | RequiredFieldsTab | **R11** | 🔴 Alta | `OperationCard title="Boleto"`, `OperationCard title="Cartão de Crédito"` |
| **G07** | `admin/merchants/[id]/evaluate/merchant-evaluate.tsx:82-84,198-201,712-728,754-758` | MerchantEvaluate | **R11** | 🔴 Alta | `UsesBoleto/UsesCreditCard`, `Chips Boleto/Cartão`, `formatFeeDisplay(boletoInFee…)` |
| **G08** | `admin/transactions/modals/admin-transaction-details-modal:45,519-524` | AdminTransactionDetailsModal | **R11** | 🔴 Alta | `BoletoBarcodeImage` + `Dados do Boleto` |
| **G09** | `merchant/checkouts/upsert/hooks/use-checkout-onboarding:46-48,543-544,1241-1242` | Hook onboarding | **R11** | 🔴 Alta | `creditCardEnabled/boletoEnabled` |
| **G10** | `merchant/checkouts/upsert/tabs/payments-tab:8` | PaymentsTab | **R11** | 🔴 Alta | `CreditCardIcon, Invoice02Icon` órfãos |
| **G11** | `merchant/checkouts/upsert/tabs/operations-tab:9,152,181` | OperationsTab | **R11** | 🔴 Alta | `CreditCardIcon` header + métrica |
| **G12** | `merchant/payments/credit-card/credit-card-payments.tsx:6,89,104` + `page.tsx:4` | Superfície cartão | **R11** | 🔴 Alta | `PaymentMethod.CreditCard`, `Cartão de Crédito`, código morto |
| **G13** | `merchant/new/constants/merchant-onboarding.constants:72-73,112-113` | Onboarding constants | **R11** | 🔴 Alta | `PaymentMethod.CreditCard`, `push(Boleto/CreditCard)` |
| **G14** | `merchant/new/forms/steps/compliance-step:12,38,50` + `merchant-onboarding-form:27,155,344` + `validations:120` + `hooks:53` | Compliance + form + validação + hook | **R11** | 🔴 Alta | `CreditCardIcon`, `showCreditCardWarning`, `UsesCreditCard → paymentMethods` |
| **G15** | `merchant/payment-links/new/create-payment-link-form:111-112,340-341,365-366,407-408,544,605` + `details-modal:6,95,195` | Payment Links | **R11** | 🔴 Alta | `boletoEnabled/creditCardEnabled`, `boletoDueDate/Instructions`, `Vencimento do boleto` |
| **G16** | `merchant/dashboard/components/RevolutHeroBalanceCard:21-23` | Hero contrato | **R11** | 🔴 Alta | `boletoReservePercentage/creditCardReservePercentage` |
| **G17** | `src/app/boleto/not-found/page.tsx` | Not-found boleto | **R11** | Alta | rota residual |
| **G18** | `merchant/dashboard/components/RevolutFinancialMetricsGrid:75-79` + `acquirers-table:573-576` + `coupons-table:326` + `admin/acquirers-table:69` | KPI badges/semântica | **R7** | Média | `text-[#00a87e]` fixo quando zero |
| **G19** | `src/app/globals.css:672-984` | `.mockup-*` defs | **R10** | Média | 38 classes mortas (0 uso merchant, mas bloqueia bundle) |
| **G20** | `*` ~380× `bg-[#16181a]/text-[#494fdf]/bg-[#00a87e]/15` hardcoded | Tokens | **R1** | Média | 42 merchant + ~15 admin arquivos; visual OK, débito token vs `bg-card/text-brand` |
| **G21** | `admin/balances/reconciliation-modal:188,231,240` | ReconciliationModal | **R1** | Média | `bg-surface-secondary/bg-surface/bg-content1` |
| **G22** | `admin/acquirers/[id]/tabs/config-tab:212,527,805` | Accordion | **R1** | Média | `border-divider bg-surface` (7 instâncias) |
| **G23** | `admin/logs/logs-table:120,332,1000` | Logs | **R1** | Média | `bg-content1/border-divider` |
| **G24** | `admin/merchants/[id]/tabs/*` + `evaluate` | History/Evaluate | **R1** | Média | `bg-surface` |
| **G25** | `admin/platform-settings/platform-settings-form:327,415` | PlatformSettings | **R1** | Média | `bg-content1 border-divider` |
| **G26** | `merchant/dashboard/merchant-dashboard:252-256` | QuickActions | **R3** | Média | `border-white/20 bg-white/5 rounded-[16px]` vs `rounded-full bg-white text-black` |
| **G27** | `merchant/fees/fees-content:110` | Fees shape | **R11** | Média | `ReadFeesData` inclui flags legado |
| **G28** | `help/page.tsx:295` | Instagram link | **R4** | Média | `bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500` decorativo |
| **G29** | `confirm-email/confirm-email-content:27-35` | Confirm e-mail | **R1** | Média | `BackgroundGradientAnimation` gradientes fora Revolut |
| **G30** | `system-accordion:10-32` | ACCORDION_COLOR_MAP | **R1** | Média | 23 cores hardcoded |
| **G31** | `logs/mobile-cards:172-272`, `merchants:263-322`, `transactions:263-355` | Mobile cards | **A11y** | Média | sem `aria-label` descritivo |
| **G32** | `platform-balances:274-487`, `mobile:274-295` | Icon buttons | **A11y** | Média | `h-8 w-8` sem `aria-label` |
| **G33** | `data-table:240-660` | DataTable | **R2/A11y** | Média | `tabular-nums` não garantido; sem `aria-busy` |
| **G34** | `admin/merchant-actions-dropdown:442`, `header/{admin,merchant}-*-card:60,65` | Header popovers | **R4** | Média | `shadow-2xl` |
| **G35** | `dropdown popovers` (`cashouts:171`, `cashouts:195`, `checkouts:182`, `coupons:156`, `customers:141`, `orders:122`, `payment-links:148`) | All dropdowns | **R4** | Média | `shadow-xl` |
| **G36** | `live-balance-screen:334 shadow-2xl` + `notification-stack:37 shadow-[0_18px]` | Live Balance | **R4** | Média | shadows maximalista |
| **G37** | `admin/complement-history-accordion:49 shadow-xs`, `history-tab:812 shadow-lg`, `help:41 shadow-lg`, `confirm-email:47 backdrop-blur`, `splash:9 bg-linear-to-br` | Shadows/gradientes residuais | **R4** | Média | viola hairline-only |
| **G38** | `admin/landing-cta:16 shadow-2xl` + `auth-modal:33 shadow-2xl` + `error:18 shadow-xl` | Públicos shadows | **R4** | Média | shadow residual |
| **G39** | `merchant/visual-tab:51 PRESET_COLORS #3B82F6/#8B5CF6` | Visual presets | **R1** | Baixa | palette fora Revolut (custom lojista) |
| **G40** | `ranking/ranking-list:249,262`, `checkouts-table:83-85`, `cashout-accounts:99` + `services/physical-products` | Squircles | **R4** | Baixa | `rounded-lg 7×7` vs `rounded-xl/2xl` |
| **G41** | `transactions/transactions-table:316`, `orders/payment-links mobile` | Mobile valores | **R2** | Baixa | `D+0 SPI` estático (tolerável) |
| **G42** | `settings/settings-content:879,946,1020` | Settings previews | **R1/R2** | Baixa | hardcoded previews |
| **G43** | `live-balance-screen:219-258 backgrounds 19 variants` | Live Balance immersive | **R6** | Baixa | maximalista vs minimalista — exceção documentável |
| **G44** | `transactions/modals/merchant-transaction-details-modal:298` | Copy-paste | **R1/A11y** | Baixa | `truncate` sem `break-all` |
| **G45** | `coupons/customers tables skeletons` | Tabelas | **R1** | Baixa | `bg-white/10` skeletons |
| **G46** | `*-skeleton.tsx` ×12 | Skeletons | **A11y** | Baixa | sem `aria-busy/aria-label` |
| **G47** | `admin-dashboard:371-391 AdminDashboardSkeleton` | Skeleton admin | **R1** | Baixa | `Card` genérico vs Revolut |
| **G48** | `overview-tab:322 ApprovalHealthBar` | Health bar | **R1** | Baixa | `text-[#ec7e00]` bug vs `bg-[#ec7e00]` |
| **G49** | `platform-settings internal PixAccordion:327,415` | Settings | **R1** | Baixa | `bg-content1` |
| **G50** | `acquirers/acquirers-table:644,687-688` | Create modal inputs | **R2** | Baixa | sem `tabular-nums` |
| **G51** | `reconciliations/platform-payouts/platform-payout-accounts` | Tables | **R2** | Baixa | `formatCurrency` sem `tabular-nums` explícito |
| **G52** | `confirm-email page:47 Card bg-background/80 backdrop-blur` | Confirm card | **R1** | Baixa | não `bg-[#16181a]` |
| **G53** | `landing-cta:18 gradient cobalt` | CTA highlight | **R4** | Baixa | `bg-gradient-to-r via-[#494fdf]` tolerável (R6), mas shadow viola |
| **G54** | `landing-page:52 primaryAction bg-accent` | Landing actions | **R3** | Baixa | `bg-accent rounded-full` vs `bg-white text-black` (R10 exceção pública) |
| **G55** | `sidebar-menu MenuItem:120-172 hover:bg-white/5` | Sidebar items | **R1** | Baixa | `rounded-lg` vs `rounded-md` spec; `aria` unverified |
| **G56** | `sidebar:28 bg-[#000000] border-white/10` | Sidebar | **R1** | ✅ aderente — documentado como correto (exemplo positivo) |
| **G57** | `landing-hero/pillars/pricing` | Landing sections | **R10** | Baixa | `unverified` display typo |
| **G58** | `opengraph-image:35,62 linear-gradient` | OG image | **R1** | Baixa | hardcode OG tolerável |
| **G59** | `mobile-merchant-dashboard.tsx` | Mobile dashboard | **R1** | Baixa | `unverified` wrapper |
| **G60** | `acquirers/acquirers-table:298 renderMobileAcquirerCard` | Mobile card | **R1** | Média | `border-divider bg-surface` (duplicado G04 já?) — manter para completude mobile |

> Total **60 gaps** (17 alta, 18 média, 25 baixa). Duplicatas intencionais quando componente repete em admin+merchant para rastreabilidade.

---

## 8. Ações corretivas priorizadas (sem implementar)

### P0 — Crítico / Alta — bloqueante Revolut + PIX

1. **Purge R11 PIX-only (todos os G01–G17):**  
   - Remover `creditCardEnabled/boletoEnabled`, `supportsBoleto/supportCreditCard`, `boletoDueDate/Instructions`, `PaymentMethod.CreditCard/Boleto`, `UsesCreditCard/UsesBoleto`, `BoletoBarcodeImage`, chips `Boleto/Cartão`, `CreditCardIcon/BarCodeIcon/Invoice02Icon` órfãos, `boletoReservePercentage/creditCardReservePercentage`, `minBoletoAmount/maxBoletoAmount`, `appendMethodSummary` boleto/cartão, `OperationCard Boleto/Cartão`.  
   - Deletar `src/app/panel/(main)/merchant/payments/` (manter redirect tombstone 301 ou remover pasta) e **remover viewer boleto** `src/app/boleto/` + `src/app/actions/boleto.ts` + `types/boleto.ts` ou gatear por flag interna não-renderizada.  
   - Critério DONE: `grep -R "creditCard\|boleto\|CreditCard\|Boleto" src/app/panel/(main)` → **0** (exceto comentário de migração); `ls src/app/boleto` vazio ou redirect para PIX.

2. **Migrar `/docs` pública para Revolut dark:**  
   - `bg-slate-950 → bg-[#000000]`, `bg-slate-900 → bg-[#16181a]`, `border-slate-800 → border-white/12`, `text-slate-300 → text-white/60`, `bg-emerald-500/15 → bg-[#00a87e]/15` (ou `bg-success/15`), remover `bg-slate-800` badges → `bg-white/5`.  
   - Mesma migração para `docs/page.tsx:129-258` cards (`bg-slate-900 border-slate-800 shadow-sm → bg-[#16181a] border-white/12 rounded-[20px]`).

3. **Corrigir R7 zero→neutro (G18):** helper `getSemanticClass(value) => value>0 ? text-[#00a87e]/bg-[#00a87e]/15 : text-white bg-white/5` e aplicar em `acquirers-table:573`, `coupons-table:326`, `ranking top1`, `balance-history`.

### P1 — Média — dívida design system (sprint dedicado)

4. **Tokenizar cores hardcoded (G20, 380+ ocorrências):** codemod `bg-[#16181a]→bg-card`, `bg-[#0a0a0a]→bg-surface` (ou `bg-content2`), `text-[#494fdf]/text-[#4f55f1]→text-brand`, `bg-[#494fdf]/15→bg-brand/15`, `text-[#00a87e]→text-success`, `bg-[#00a87e]/15→bg-success/15`, `text-[#e23b4a]/bg-[#e23b4a]/15→text-danger/bg-danger/15`, `text-[#ec7e00]→text-warning` via `var(--brand/success/danger/warning)`. Fazer em lote por domínio (merchant dashboard → checkouts → …) com snapshot visual.

5. **Remover shadows R4 (G34–G38):** eliminar `shadow-xl/2xl/md/lg` em `dropdown popovers`, `Modal.Dialog`, `live-balance-screen/notification-stack`, `merchant-actions-dropdown`, `help Card hover:shadow-lg`, `auth-modal`, `error.tsx` → substituir por `border border-white/12` + `backdrop-blur` onde já existe; `ConfirmEmail BackgroundGradientAnimation` não usar em painel (manter só em pública isolada).

6. **Migrar `bg-surface/border-divider` → dark (G21–G25):** `config-tab` (7 accordions), `reconciliation-modal`, `adjustment-history-modal`, `logs modais`, `evaluate`, `platform-settings` internos → `bg-[#16181a]/bg-[#0a0a0a] border-white/12` (ou `bg-card/border` tokens).

7. **R3 pills (G26, G54, C11):** corrigir `QuickActions` para `primary: bg-white text-black rounded-full` + `secondary: border-white/12 bg-transparent rounded-full`; alinhar `platform-settings` secundários e `RevolutPeriodSelector` como referência; documentar landing pública como `R10 exceção` (ver P0-AD R).

8. **Remover `mockup-*` mortas (G19):** deletar `globals.css:672-984` definições (`mockup-kpi-card`, etc.) após confirmar 0 uso (`grep mockup-` 0 merchant OK); alternativa: mover para `src/components/dashboard/_mockup-legacy.css` e deprecate, depois remover.

9. **Fix `ACCORDION_COLOR_MAP` (G30):** substituir 23 hex hardcoded por tokens CSS (`var(--brand)`, `var(--success)`, `var(--warning)`, `var(--danger)`) ou reduzir map para `brand/success/warning/danger/default` apenas; `buildColorMix` já usa `color-mix` OK.

10. **A11y média (G31–G33):** adicionar `aria-label` descritivo em mobile cards (`"Abrir ações de Acquirer {name}"`), `aria-label` em icon-only buttons (`platform-balances eye/refresh/shield`), `aria-busy="true"` + `aria-label="Carregando"` em skeletons, `aria-live="polite"` em `DataTable isPending` e `AnimatedCurrency/NumberTicket`.

### P2 — Baixa — polimento contínuo

11. **R4 squircles (G40, C04, M14):** unificar housing `rounded-lg 7×7 → rounded-xl` e `9×9 → rounded-2xl`; manter `bg-*/15 border-*/25`.

12. **Live-balance exceção imersiva (G43):** ADR `docs/decisions/live-balance-immersive-exception.md` declarando `live-balance` maximalista como exceção a R6 (teatral), limitando backgrounds a 2–3 variantes canônicas parametrizadas via `LiveBalanceSettings` (evitar 19 variants).

13. **Visual-tab presets (G39):** decidir se presets não-Revolut (`#3B82F6` etc.) permanecem como escolha do lojista (documentar exceção) ou restringir a `brand/success` + preto/branco.

14. **Correções pontuais (G41–G51):** `break-all` em PIX copia-e-cola, `tabular-nums` em `FeeDisplay` limites + `create-acquirer input` + `reconciliations tables`, `ApprovalHealthBar bg` bug, admin skeleton Revolut, `confirm-email Card` tokenizado (`bg-background/80` → `bg-card`).

15. **Verificações manuais `unverified — confirm first`:**  
   - Contraste `white/40` s/ `#16181a` com `axe`/`Lighthouse` (WCAG AAA 7:1, AA 4.5:1).  
   - `focus-visible:ring-white/20` via Tab navigation em todas superfícies.  
   - Breakpoints 360/390/768/1024/1280 manual (overflow, `hidden md:block` DataTables).  
   - `Esc` fecha modais/dropdowns.  
   - `/docs` migrada validada em light/dark.

16. **Limpeza final:** `sidebar-effects.css` import residual check, `landing-cta gradient highlight` documentado como R6 kanônico (manter), `help Instagram gradient` → `bg-white/5` neutro; `globals.css:1031 --background: #f9f9f9` light token vs Revolut — validar `light` não usado em painel (dark-first OK).

---

## 9. Suposições e contingências aplicadas

| Situação | Decisão |
|----------|---------|
| Novas rotas além do listado | Incluídas: `panel/profile`, `panel/user-settings`, `panel/bulletins`, `panel/notifications`, `panel/about`, `panel/help`, `panel/menu`, `panel/dev/tools`, `panel/docs` |
| Regra ambígua | DESIGN.md canônico; conflito com `design-system-and-code-quality` (R10 escopo) → DESIGN.md venceu |
| Contraste sem viewport | Marcado `unverified — confirm first`; sugerido `axe` + `Lighthouse` + medição 4.5:1 |
| Mobile/desktop sem viewport | `unverified — confirm first` baseado em classes `hidden md:block`, `grid-cols-*`, `p-5 sm:p-6` — base code-responsive |

---

## 10. Entregáveis (conforme plano)

- [x] **Inventário completo** — §1.1: 8 públicas + 14 admin + 30 merchant + 8 outras = **60 superfícies/rotas**.
- [x] **Tabela de gaps** — §7: **60 gaps** `path | componente | regra | sev | evidência`.
- [x] **Checklist aderência** — §6 por categoria (tipografia, spacing, cores, estados, a11y, breakpoints, pills, squircles, charts, copy, R8-R11, tokens).
- [x] **Ações corretivas priorizadas** — §8: **3 P0 alta + 7 P1 média + 6 P2 baixa = 16 ações**, sem implementação (somente leitura).

---

## 11. Arquivos críticos revisitados

| Arquivo | Veredito |
|---------|----------|
| `DESIGN.md` | Canônico R1-R11 OK |
| `design-system.md` | Lime `#a3e635` legado vs cobalt — `globals.css` já migrou; escala typo/spacing OK |
| `src/app/globals.css` | Tokens dark OK + `.mockup-*` mortas P1 |
| `src/router/routes.ts` | Inventário roteamento OK; `payments/credit-card` residual P0 |
| `src/components/panel/sidebar/sidebar-menu.tsx` | G55 baixa (rounded) |
| `src/components/ui/system-accordion.tsx` | G30 média (color map hardcoded) |
| `src/components/landing/landing-page.tsx` | P07 baixa (C03 CTA `bg-accent`) |
| `src/app/panel/(immersive)/merchant/live-balance/live-balance-screen.tsx` | G36 média shadows + G43 baixa maximalista |

---

## 12. Evidências auditáveis (grep/read)

- `grep mockup-` → `globals.css:673` 38 defs, 0 uso merchant (G19).
- `grep #16181a|#494fdf` → 380+ hardcoded (G20).
- `grep bg-gradient-` → `help:295`, `landing-cta:18`, `live-balance/backgrounds` 19, `splash:9`, `confirm-email:27` (L03).
- `grep Accordion.*bg-surface` → `config-tab:212` 7 instâncias (A02).
- `grep supportsBoleto|CreditCard|boletoEnabled` → `acquirers:351`, `config-tab:126`, `use-checkout-onboarding:46`, `payment-links:111` (G04-G17).
- `grep shadow-2xl|shadow-xl` → 38 arq (G34-G38).
- `grep slate-950|slate-900` → `docs/page:35` alta (G03).
- `read src/app/boleto/*` → viewer boleto vivo (G01-G02).
- `glob src/app/**/page.tsx` → 68 rotas estáticas compiláveis (Next build).

---

*Fim da auditoria Revolut 10 / Ultra completa — 2026-08-23. Nenhum arquivo alterado. Próxima ação: executar P0 (R11 purge + docs migrate), depois P1 tokenização em lote. Verificar `unverified` manualmente em viewport real.*
