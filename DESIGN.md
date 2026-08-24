---
version: 1.0
name: SwiftPay Design System — 100% Front
description: |
  SwiftPay Design System — 100% Front — Revolut 10 / Ultra specification for
  all front-end surfaces. Marketing primitives canonical in design.md; App
  surfaces (Merchant Panel, Admin Panel, Checkout, Auth, Shared shell) canonical
  here. True black canvas (#000000) + cobalt-violet (#494fdf) + elevated
  graphite (#16181a) + hairline rgba(255,255,255,0.12) remain the single source
  for every surface. Aeonik Pro 500 display + Inter 400/600 body + Geist Mono
  tabular remain the typographic stack.

colors:
  canvas: "#000000"
  canvas-light: "#ffffff"
  surface-elevated: "#16181a"
  surface-deep: "#0a0a0a"
  surface-soft: "#f4f4f4"
  surface-card: "#ffffff"
  hairline: "rgba(255, 255, 255, 0.12)"
  hairline-subtle: "rgba(255, 255, 255, 0.06)"
  hairline-light: "#e2e2e7"
  hairline-strong: "#191c1f"
  primary: "#494fdf"
  primary-bright: "#4f55f1"
  primary-deep: "#3a40c4"
  on-primary: "#ffffff"
  text-primary: "#ffffff"
  text-muted: "rgba(255, 255, 255, 0.60)"
  text-faint: "rgba(255, 255, 255, 0.40)"
  ink: "#191c1f"
  body: "#1f2226"
  charcoal: "#3a3d40"
  mute: "#505a63"
  accent-green: "#00a87e"
  accent-teal: "#00a87e"
  accent-blue-link: "#376cd5"
  accent-light-blue: "#007bc2"
  accent-light-green: "#428619"
  accent-green-text: "#006400"
  accent-yellow: "#b09000"
  accent-warning: "#ec7e00"
  accent-pink: "#e61e49"
  accent-danger: "#e23b4a"
  accent-deep-red: "#8b0000"
  accent-brown: "#936d62"
  link: "#376cd5"

typography:
  display-xxl:
    fontFamily: Aeonik Pro
    fontSize: 136px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: -2.72px
  display-xl:
    fontFamily: Aeonik Pro
    fontSize: 80px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: -0.8px
  display-lg:
    fontFamily: Aeonik Pro
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.21
    letterSpacing: -0.48px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
  mono-tabular:
    fontFamily: Geist Mono
    fontWeight: 600
    letterSpacing: -0.02em
    features: tabular-nums

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 20px
  xl: 28px
  full: 9999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 14px
  lg: 16px
  xl: 24px
  xxl: 32px
  xxxl: 48px
  block: 80px
  section: 88px
  band: 120px

rules:
  - id: R1-SURFACE-HIERARCHY
    rule: "True black #000000 background for canvas, #16181a for elevated cards, #0a0a0a for inset tiles, 1px borders with rgba(255, 255, 255, 0.12)."
  - id: R2-TYPOGRAPHY-TABULAR
    rule: "All financial amounts and rates must use tabular monospace numbers (font-mono tabular-nums). Labels must be strictly neutral (text-white/50)."
  - id: R3-PILL-ACTIONS
    rule: "Primary action must be a solid white rounded-full pill with black text (button-primary). Secondary actions use dark outline pills with 1px border."
  - id: R4-ICONOGRAPHY-SQUIRCLES
    rule: "All icons must have a geometric 1.75px stroke with rounded caps, housed in rounded-2xl or rounded-xl squircles with subtle 15% opacity backgrounds."
  - id: R5-NO-GENERIC-MOCK-COPY
    rule: "Use strict, professional financial terminology (Taxa de Conversão, Volume Bruto, Faturamento Líquido, Índice de Chargeback). No generic placeholder phrases."
  - id: R6-MINIMALIST-COBALT-CHARTS
    rule: "Charts must feature smooth Cobalt Violet gradients (#494fdf to transparent) with 2.5px curves, zero heavy Cartesian gridlines, and floating dark glass HUD tooltips."
  - id: R7-SEMANTIC-COLOR-DISCIPLINE
    rule: "Alert colors (red, amber, green) activate strictly on real events (> 0). Zero values are rendered in neutral clean white."
  - id: R8-ZERO-MOCKS-IN-PRODUCTION
    rule: "Every number, percentage, currency value, count, rate, and metric displayed in the UI MUST come from a real API response or be computed exclusively from real API fields (e.g. totalVolume / completedTransactions). Hardcoded values, synthetic estimations (e.g. volume * 0.98), static placeholder text posing as live data (e.g. 'Instantâneo (< 3s)'), and artificial badges (e.g. 'PIX D+0 Ativo', '100% Volume') are strictly PROHIBITED. If the backend does not provide a metric, the UI must either omit the field or display a neutral empty state — never fabricate data."
  - id: R9-REAL-DATA-TRACEABILITY
    rule: "Every visual metric MUST be traceable to a named API field or a deterministic computation of named API fields. When creating or modifying a dashboard component, the developer MUST be able to name the exact API property (e.g. kpis.approvalRate, balance.available, item.transactionCount) for every displayed value. Any value without a traceable API source is a mock and violates R8."
  - id: R10-REVOLUT-SCOPE
    rule: "The Revolut 10 / Ultra design system applies to all SwiftPay surfaces: merchant dashboard, admin panel, checkout public, sidebar, and all secondary screens."
  - id: R11-PIX-ONLY-GATEWAY
    rule: "SwiftPay operates as a 100% PIX-only payment gateway. The dashboard, checkout, and all merchant-facing surfaces MUST NOT reference credit cards, boletos, or any payment method other than PIX. All payment method UI, terminology, and metrics assume exclusive PIX infrastructure (QR Code, Copia e Cola, SPI/Banco Central settlement)."
  - id: R12-SHELL-LAYOUT
    rule: "Shell: sidebar expanded MUST use flex items-center justify-start (icon + label row, gap 8-10px, w240), collapsed MUST use flex items-center justify-center (icon only, w64). App nav-bar height is h64 with background {colors.canvas} (#000000) and border-b border-white/10. Panel layout canvas is {colors.canvas} true black; elevated cards sit on {colors.surface-elevated} (#16181a). Applies to merchant panel, admin panel, and shared panel-layout."
  - id: R13-DATA-TABULAR
    rule: "Data: every monetary value, rate, count, and ledger amount MUST use tabular-nums + font-mono (Geist Mono) with font-variant-numeric: tabular-nums and letter-spacing -0.02em. Labels remain Inter body-sm neutral text-white/50 or text-white/60. Applies to kpi-card, data-table, ranking-row, ledger, and RevolutHeroBalanceCard."
  - id: R14-FORMS-INPUTS
    rule: "Forms: text-input MUST be h56 (56px) with rounded {rounded.md} (12px), padding 14px 16px, background {colors.canvas-light} on light or var(--field-background) on dark, border hairline. File-upload, billing-step, and auth inputs reuse the same h56 + rounded-md geometry. Checkout customer form and merchant settings forms canonical."
  - id: R15-CHECKOUT-DATA-URL
    rule: "Checkout: no-img-element is permitted ONLY for base64 data URLs (qrCodeDataUrl, barcodeDataUrl, PixResult). Checkout hero-pro and payment-link-view MUST keep eslint-disable no-img-element with comment 'data URL'. All other images MUST use next/image. Printable-boleto is out of scope (PIX-only R11) but heredity pattern kept for audit."
---

## Overview

Marketing primitives (`{colors.canvas-dark}` / `{colors.canvas-light}`, `{typography.display-xxl}`, `{rounded.full}` pills, `{rounded.lg}` 20px cards, `{spacing.section}` 88px bands) remain canonical in `design.md`. This file is canonical for **App Surfaces**: every logged-in and public-app surface (Merchant Panel, Admin Panel, Checkout, Auth, Shared shell). Marketing and App share the same token dictionary — no fork. `design.md` owns storytelling bands; this file owns the dark operational canvas.

Split: `design.md` = catalogue + hero bands (636 lines, no merchant/panel/checkout duplication); `DESIGN.md` = app shell + data + forms + checkout + auth (this file). Audit crosses both via `npx @google/design.md lint design.md DESIGN.md` or manual `grep -E "orphaned|missing"`.

## Elevation & Depth

App elevation reuses marketing levels 0–3 but on a dark ladder:

| Level | Treatment | Use |
|---|---|---|
| 0 — flat | `{colors.canvas}` #000000, no shadow, no border | Panel canvas, page background (merchant dashboard, admin dashboard, merchant transactions, merchant settings) |
| 1 — hairline | 1px `border-white/10` or `border-white/12` | Dividers (`border-b border-white/10`), card outlines |
| 2 — surface elevated | `{colors.surface-elevated}` #16181a on `{colors.canvas}` | KPI cards, chart cards, table cards, `RevolutHeroBalanceCard` |
| 3 — featured surface | `{colors.primary}` #494fdf on `{colors.canvas}` | Featured CTAs, accent glow `bg-brand/10 blur-3xl` behind hero |

No drop shadows. Depth registers via luminance shift (`#000000` → `#16181a`) and hairline borders.

## App Surfaces

> Canonical for all logged-in and public-app front-end. Marketing primitives referenced from `design.md`; do not duplicate. Each component lists literal token bindings for `backgroundColor`, `rounded`, `typography`, and geometry so `grep` audits are deterministic.

### Shell

App shell is the frame for every `src/app/panel/**` route (merchant and admin) and shared `src/components/panel/**`.

**`nav-bar-app`** — top bar (merchant + admin)
- `backgroundColor: "{colors.canvas}"` (#000000), `textColor: "{colors.on-dark}"` (#ffffff), `typography: "{typography.button-md}"`, `height: 64px`, `rounded: "{rounded.none}"`, `border-b: "1px solid {colors.hairline-dark}"` (`rgba(255,255,255,0.12)` or `border-white/10` tolerance). Sticky top-0, z-40. Left: logo/wordmark. Center: breadcrumb or workspace switcher. Right: notifications + user menu. Used by `src/components/panel/panel-header.tsx` (verify `h64` and `border-b border-white/10`).

**`sidebar`** — navigation rail
- Expanded: `width: 240px` (`w240`), `backgroundColor: "{colors.canvas}"` (#000000), `border-r: "1px solid {colors.hairline-dark}"`, items `flex items-center justify-start gap-2.5 px-3 py-2 rounded-full` (see `src/components/panel/sidebar/sidebar-menu.tsx:138-145`). Collapsed: `width: 64px` (`w64`), same items `flex items-center justify-center`. Active item: `bg-white text-black rounded-full`; inactive: `text-white/60 hover:text-white hover:bg-white/5`. Applies to merchant sidebar and admin sidebar identically. **R12** is the gate.

**`panel-layout`** — page container
- `backgroundColor: "{colors.canvas}"` (#000000), `minHeight: "100dvh"`, content `maxWidth: 1280px` centered, `padding: 24px` (mobile 16px), `gap: 24px` between sections. Canvas prove: `src/app/panel/(main)/merchant/dashboard/merchant-dashboard.tsx:63` `flex flex-col gap-6 text-white` sobre `.dark --background #000000`. Merchant panel and admin panel share layout; admin `dashboard/admin-dashboard.tsx` identical canvas.

### Data

Data surfaces render money, rates, and rankings. Every numeric value obeys **R13** (`tabular-nums` + `font-mono`).

**`kpi-card`** — metric tile (merchant dashboard, admin dashboard, merchant balances, admin balances)
- `backgroundColor: "{colors.surface-elevated}"` (#16181a), `border: "1px solid {colors.hairline}"` (`border-white/12` exact, `border-white/10` tolerated 0.02 delta), `rounded: "{rounded.lg}"` (20px → `rounded-[20px]`), `padding: "24px 28px"` (`p-6 sm:p-7`, 32px marketing spec tolerated 4–8px dense), `typographyLabel: "{typography.caption}"` (`text-[11px] uppercase tracking-widest text-white/60`), `typographyValue: "{typography.mono-tabular}"` (`font-mono text-3xl sm:text-5xl tabular-nums tracking-tight`). Icon squircle `h-8 w-8 rounded-xl bg-white/5`. Example: `src/app/panel/(main)/merchant/dashboard/components/RevolutFinancialMetricsGrid.tsx`, `src/app/panel/(main)/merchant/dashboard/components/RevolutHeroBalanceCard.tsx:48-100` with `ambient glow bg-brand/10 blur-3xl` decorative.

**`data-table`** — ledger/table (merchant transactions, merchant orders, merchant customers, admin merchants, admin users)
- Header: `typography: "{typography.body-sm}"` semibold `text-foreground` (see `globals.css th` fix), `border-b: {colors.hairline-dark}`. Row: `height: 56px` min, `hover:bg-white/[0.03]`, `border-b border-white/5`. Cell values: `font-mono tabular-nums` when numeric; labels `text-white/60`. Empty state `text-foreground` neutral, never mock. Pagination summary `text-muted-foreground`. Uses `rounded-[20px] border border-white/12 bg-card` wrapper when card-lifted.

**`ranking-row`** — ranked list row (merchant ranking, merchant cashouts, admin referrals)
- `height: 56px`, `rounded: "{rounded.lg}"` when card, `rank: font-mono tabular-nums text-white/40`, `value: font-mono tabular-nums font-semibold text-white`. Row gap `16px` (`{spacing.lg}`).

**`ledger`** — balance breakdown (RevolutHeroBalanceCard, platform-balances)
- `available: font-mono text-3xl sm:text-5xl font-extrabold tabular-nums`, `pending/reserved: text-xs font-mono text-white/60` with `blurClass visual-blur` toggle. Badge semantic: `border-success/20 bg-success/10 rounded-full` for live/PIX, not marketing `badge-feature bg-primary`.

### Forms

**`text-input`** — default input (merchant settings, admin settings, auth forms, checkout customer step, merchant checkouts upsert, merchant products)
- `backgroundColor: "{colors.canvas-light}"` light / `var(--field-background)` (#161616) dark, `textColor: "{colors.ink}"` / `var(--field-foreground)`, `typography: "{typography.body-md}"`, `rounded: "{rounded.md}"` (12px → `rounded-md` / `var(--field-radius) 0.375rem` with 12px alias for app), `padding: "14px 16px"`, `height: 56px` (`h-14`), `border: "1px solid {colors.hairline-light}"` / `border-white/12` dark, `placeholder: var(--field-placeholder) #999999`. **R14**. Verify `src/components/auth/forms/*` reuse this geometry (signin, signup, forgot, reset, device-verification). Button inside forms is `h-12` (`h-12`) when primary? Auth today `h-9` → migrate to `h-12` if gap found but preserve `useState(() => getOrCreateDeviceId())` lazy init pattern.

**`file-upload`** — product image / document upload (merchant products physical/digital/services, merchant checkouts products tab)
- `border: "1px dashed border-white/15"`, `rounded: "{rounded.lg}"` (20px), `bg: bg-card` or `bg-surface-deep`, `minHeight: 160px`, `typography: "{typography.body-sm}"` for hint `text-white/50 font-mono` where numeric.

**`billing-step`** — stepped form (merchant checkouts upsert tabs: seo/visual/products/payments/tracking/customer)
- Tab list `rounded-full` pills (`{rounded.full}`), active `bg-white text-black`, inactive `text-white/60`. Panel card `rounded-[20px] border border-white/12 bg-card p-6 sm:p-7`. Mirrors Data kpi-card geometry.

### Checkout

Public checkout surfaces: `swiftpay-web-checkout/templates/hero-pro/index.tsx` (~900 lines) and `payment-link-view`. Must remain PIX-only per **R11**.

**`checkout-hero-pro`** — checkout page (hero-pro template)
- Canvas `bg #000000` outer, card `bg-white p-4 rounded-xl` (light card for QR legibility) inset on dark. QR image is `qrCodeDataUrl` base64 data URL rendered via `<img>` with `eslint-disable no-img-element` + comment `data URL` (**R15** allows exception). Do NOT migrate to `next/image` for data URLs. `hero-pro/theme.css` must align with `canvas-dark` background. Preserve PixResult base64 pattern.

**`payment-link-view`** — payment link public view
- Same QR data URL exception (**R15**). `bg-white` QR tile with `rounded-xl` and `p-4` for contrast scanning. Amount `font-mono tabular-nums` (**R13** even on light).

**`printable-boleto`** — legacy heredity (PIX-only gateway means boleto is out of scope, kept for audit trace)
- If referenced, must be gated behind PIX check; no boleto UI in merchant or checkout per **R11**.

### Auth

Auth forms live in `src/components/auth/forms/*` (signin, signup, forgot-password, reset-password, device-verification) and `src/app/(auth)/**`.

**`auth-card`** — form container
- `backgroundColor: "{colors.surface-elevated}"` or `bg-card` on dark, `rounded: "{rounded.lg}"` (20px), `border: "1px solid {colors.hairline}"`, `padding: "32px"` (`p-8`) on desktop, `24px` mobile. Title `typography: "{typography.heading-md}"` (24px 500) or `text-xl font-bold tracking-tight text-white` (dashboard tolerance) .

**`auth-input`** — reuses `text-input` spec (**R14**): `h56 rounded-md 12px p14x16`. Submit button: `variant: default` on light is `bg-brand` cobalt; on dark shell use `bg-white text-black rounded-full h-12` (marketing-primary) — document tradeoff: `src/components/ui/button.tsx` `default` is `bg-accent` cobalt today; app surfaces may use `bg-white text-black` via `button-primary` utility class or new `variant: marketing-primary`. Do not break callers (`grep -rn "variant.*default"` must still work — see globals phase).

Verify auth preserves lazy device id: `useState(() => getOrCreateDeviceId())` (Fase 3 lint).

## Gold Reference — /panel/merchant/dashboard

**Status: FROZEN. 90–95% Revolut 10 Ultra conformance, deltas are intentional app-density micro-tweaks documented below. Do not rework without ADR.**

**Paths**
- `src/app/panel/(main)/merchant/dashboard/merchant-dashboard.tsx:42-166` (DashboardContent + shell)
- `src/app/panel/(main)/merchant/dashboard/components/RevolutHeroBalanceCard.tsx:48-100` (hero card + ambient glow)
- `src/app/panel/(main)/merchant/dashboard/components/RevolutFinancialMetricsGrid.tsx`
- `src/app/panel/(main)/merchant/dashboard/components/RevolutAnalyticsChart.tsx`

**Evidence**
- Canvas/Shell `merchant-dashboard.tsx:63` `flex flex-col gap-6 text-white` sobre `.dark --background #000000` (`canvas-dark`); `border-white/10` (0.10) vs spec `hairline-dark 0.12` delta 0.02 acceptable; `RevolutHeroBalanceCard.tsx:50` `border-white/12` (0.12 exact) OK.
- Hero `RevolutHeroBalanceCard.tsx:48-100` `rounded-[20px]` = `{rounded.lg}` 20px OK, `bg-card #16181a` `surface-elevated` OK, `p-6 sm:p-7` vs spec `32px` delta 4–8px tolerable density app, `ambient glow bg-brand/10 blur-3xl` correct, `text-[11px] uppercase tracking-widest text-white/60` vs `caption 13px` 2px smaller tweak mobile intentional, `font-mono text-3xl sm:text-5xl tabular` vs `display-lg 48px Aeonik` — swap Mono tabular correct for values (**R13** `tabular-nums`), `Badge` `border-success/20 bg-success/10 rounded-full` semantic financial correct (not marketing `badge-feature bg-primary`).
- Toolbar `merchant-dashboard.tsx:65-78` `h1 text-xl font-bold tracking-tight text-white` vs `heading-md 24px 500` 4px smaller/weight 700 vs 500 scale app, `RevolutPeriodSelector` `rounded-full` (`{rounded.full}`) OK.
- Grid `RevolutFinancialMetricsGrid` + `RevolutAnalyticsChart` + `PaymentMethodBreakdown` + `RiskDisputesControl` + `QuickActions:168-224` `lg:grid-cols-3 gap-5` (20px) vs spec `xxl 32px` 12px smaller — density dashboard intentional; `QuickActions` `variant default` today `bg-accent` cobalt vs app spec `bg-card` — functions but documented as `button-dark` app.
- Footer `merchant-dashboard.tsx:114-163` `border-t border-white/10 pt-4 text-xs text-white/50 font-mono` vs spec `footer bg #000000 text on-dark-mute 0.72 body-sm 14px` 12px vs 14px 0.22 delta, `font-mono` correct for metadata **R13**, `button-outline-dark text-xs py-1.5 px-3` vs spec `48px` but footer is tertiary.

**Tolerance (intentional, frozen)**
- 2–4px typography downsizing vs marketing display scale (Aeonik → Geist Mono for values).
- 12px grid gap (`gap-5`) vs `{spacing.xxl}` 32px — dashboard density.
- `border-white/10` vs `0.12` hairline-dark — 0.02 tolerance.
- `p-6 sm:p-7` vs `32px` — 4–8px tolerance.

**Rollout convention**
- Reuse `Revolut-*` prefix for all merchant/admin dashboard components (merchant dashboard, admin dashboard, merchant balances, admin balances, merchant ranking). Do not create new visual patterns outside this family.
- Every other merchant route (21 routes beyond dashboard: checkouts/upsert/[checkoutId] tabs seo/visual/products/payments/tracking/customer, products physical/digital/services, orders, customers, transactions, payment-links, cashouts, fees, settings, review, ranking) and admin routes (15 routes: dashboard/admin-dashboard.tsx, merchants/[id], users/[id], balances, acquirers, referrals, platform-settings) MUST reuse `text-white` + `border-white/10` + `rounded-[20px] bg-card` where card-lifted. If `grep -rn "bg-white text-black" src/app/panel` finds usage outside marketing, migrate to `bg-card`.

## Verification

- `grep -c "merchant" DESIGN.md` ≥ 5, `grep "App Surfaces" DESIGN.md` hit, `grep -c "R12\|R13\|R14\|R15" DESIGN.md` = 4.
- `read src/app/panel/(main)/merchant/dashboard/merchant-dashboard.tsx:63` contains `text-white` + `border-white/10` + `RevolutHeroBalanceCard`.
- `grep -c "visual-blur" src/app/panel/(main)/merchant/dashboard/components/RevolutHeroBalanceCard.tsx` = 1.
- Cross-lint: `npx @google/design.md lint design.md DESIGN.md` → 0 warnings (or `grep -E "orphaned|missing"` manual if lint not installed → `unverified — confirm first`).

## Iteration Guide (App)

1. Focus on ONE App component at a time. Most app surfaces share `{colors.canvas}` + `{colors.surface-elevated}` with `{rounded.lg}` 20px cards and `{rounded.full}` pills.
2. Reference app tokens literally (`{colors.canvas}`, `{colors.surface-elevated}`, `{rounded.lg}`, `{typography.body-sm}`, `RevolutHeroBalanceCard`) — do not paraphrase.
3. Run `npx @google/design.md lint DESIGN.md` after App edits; orphaned-tokens warnings catch unused entries.
4. Add new App variants as separate entries (`kpi-card-live`, `data-table-empty`, `auth-input-error`) — do not bury in prose.
5. Default money to `font-mono tabular-nums`; labels to `text-white/50`.
6. Keep `{colors.primary}` scarce in app — one cobalt accent per viewport (`bg-brand/10` glow or chart line), not a theme.
## Known Gaps & Dívida Aceita

- **Orphaned 24 (design.md lint)**: `colors.primary-deep/body/charcoal/mute/ash/stone/surface-card/deep/hairline/divider/accent-*` definidos em `design.md` mas não referenciados por componente. Intencional: paleta de `8` accents vive **dentro de mockups/ilustrações** (`product-mockup`, `feature-card` photography) nunca como `button surface` per `Don'ts`. Lint `orphaned-tokens 24` permanece `0 errors` — não bloqueia. Se ilustração for padronizada, token vira componente e warning some.
- **R4 squircles**: `Revolut*` `1.75px stroke rounded-xl/2xl bg-white/15` é canonical para **KPI/metrics/data** (dashboard, tables, ranking). `landing` e `auth` usam `HugeIcons` com `stroke 2px` intencionalmente — marketing editorial vs operational app. Não migrar sem ADR.
- **R14 h56**: `auth/forms` agora `h-14 rounded-[12px]` via `InputGroup className` (11 inputs) + `device-verification OTP` excluído (6 dígitos, não text-input). `checkout hero-pro` mantém `oklch` theme (delta `#000000` aceitável) — inputs já `h-14` via `theme.css`.

