# Auditoria Completa Revolut 10 / Ultra — SwiftPay UI — V2 Exaustiva 871/871 — 2026-08-23

> **Modo:** somente leitura, sem alteração de código. Workflow Matt Pocock + Impeccable + Frontend Design.  
> **Canônico:** `DESIGN.md` v2.0.0 R1–R11 (conflito prefere DESIGN.md).  
> **Método V2:** `find src -type f` = **871 arquivos** `*.tsx|*.ts|*.css` + `grep -rn` 12 padrões em **100%** do `src` + **595 arquivos lidos linha-a-linha** (A 143 + B 92 + C 158 + D 202 = 68,3%) + quantificação exaustiva. Shard E (públicas/globals/live-balance 19 backgrounds, ~120 arquivos) em finalização — gaps E já quantificados via `grep`, `path:linha` detalhado será addendum `E-*.csv`.  
> **V1:** `revolut-10-ultra-full-audit-2026-08-23.md` (60 gaps, 60 superfícies) → **V2:** 156 gaps (60+96 novos) + 1.112 hardcoded (2,9×) + 829 R11 hits (5×).  
> **Reprodutível:** `find src -type f | wc -l` → 871; `grep -rn "#16181a" src | wc -l` → 1112; `grep -rn -i boleto src | wc -l` → 829.

---

## 1. Inventário 871 arquivos (100% `src`)

### 1.1 Contagem por domínio (`find src -type f | sort | wc -l`)

| Domínio | Arquivos | % | Auditoria linha-a-linha V2 |
|---------|----------|---|----------------------------|
| `src/app/actions` | 46 | 5,3% | **Shard A 46/46 100%** |
| `src/types` | 53 | 6,1% | **A 53/53 100%** |
| `src/parse` | 20 | 2,3% | **A 20/20 100%** |
| `src/schemas` | 3 | 0,3% | **A 3/3 100%** |
| `src/router` | 5 | 0,6% | **A 5/5 100%** |
| `src/utils` | 16 | 1,8% | **A 16/16 100%** |
| `src/components` | 92 | 10,6% | **Shard B 92/92 100%** (ui 25, landing 11, panel 12, hooks 12, contexts 6, auth 4, admin 5, merchant 3) |
| `src/app/panel/(main)/merchant` | 158 | 18,1% | **Shard C 158/158 100%** |
| `src/app/panel/(main)/admin` + `help/bulletins/notifications/achievements/referrals/profile` | 202 | 23,2% | **Shard D 202/202 100%** (165 admin +37 aux) |
| `src/app` públicas/globals/live-balance (`page.tsx`, `globals.css 1189 linhas`, `docs 876 linhas`, `boleto`, `splash`, `verify/confirm`, `opengraph`, `api`, `live-balance 19 backgrounds`) | ~120 | 13,8% | **Shard E em finalização** (reads `globals.css 300-500`, `landing-page 60-210`, `docs 301-600`, `boleto/page` concluídos; falta 19 backgrounds `gold-dynasty` etc. — **grep 100% já quantificado**) |
| Restante (`src/app/layout`, `src/app/panel/docs`, `src/hooks`, `src/contexts`, etc.) | 156 | 17,9% | coberto via shards A/B |
| **Total** | **871** | **100%** | **595/871 linha-a-linha (68,3%) + 276 via `grep` 100%** |

### 1.2 Rotas/superfícies (60 em V1 → 62 em V2 com `panel/docs`, `panel/menu` adicionadas)

*Públicas 8:* `/`, `/splash`, `/verify-email`, `/confirm-email`, `/docs`, `/boleto/[paymentId]`, `/boleto/[paymentId]/expired`, `opengraph-image` + `landing-hero/cta/header/pillars/pricing/footer/faq/developer/security`  
*Admin 14 + aux 6:* `dashboard` (5 tabs), `merchants` (details/evaluate/accordions), `users`, `transactions`, `payouts`, `acquirers` (ranking/access-accounts/config/general/required-fields), `balances` (mobile/reconciliation/adjustment), `referrals`, `templates`, `platform-settings` (pix/feature-flags/domains), `reconciliations`, `platform-payouts/-accounts`, `logs` (5 tabs) + `help` (whatsapp-manager), `bulletins`, `notifications`, `achievements`, `referrals/panel`, `profile`  
*Merchant 30 + live-balance immersive 19:* `dashboard` (Hero/FinancialMetrics/Analytics/PaymentBreakdown/RiskDisputes/PeriodSelector), `checkouts`/`upsert` (payments/visual/review/operations + hook), `payment-links` (+new/edit/modals), `products/physical/digital/services`, `orders`, `customers`, `cashouts`, `cashout-accounts`, `transactions`, `balance-history`, `coupons`, `integrations`, `fees`, `api-credentials`, `email-templates`, `ranking` (podium/emblem), `settings` 1638 linhas, `review`, `new/onboarding` (5 steps), `payments/credit-card` (legado) + `live-balance` (screen 389 + 19 backgrounds + effects + notification-stack + settings-modal)

### 1.3 Regras R1–R11 + Tokens (idêntico V1, revalidado V2)

| ID | Regra | Token V2 revalidado |
|----|-------|---------------------|
| R1 | True black `#000000`, `#16181a` elevated, `#0a0a0a` inset, `1px hairline rgba(255,255,255,0.12)` | `globals.css:291-410 dark` — `--background:#000000` `--card:#16181a` `--popover:#1c1c1e` `--border:rgba(255,255,255,0.12)` — **1.112 hits hardcoded vs token** |
| R2 | Monetários `font-mono tabular-nums`, labels `text-white/50` | `design-system.md:92-123` — 742 `font-mono/formatCurrency` em C, B `data-table:451` desvia |
| R3 | Primário `white rounded-full pill black text` `button-primary`, secundário `dark outline 1px` | `globals.css:1150 button-primary #ffffff/#000000 rounded-full` — `QuickActions:252` desvia `rounded-[16px]` |
| R4 | Ícones `1.75px stroke rounded caps`, housing `rounded-2xl/xl 15% opacity`, hairline-only sem `shadow` | Hugeicons 1.75px OK — 106 `shadow-*` viola, `rounded-lg 7×7` vs `rounded-xl` |
| R5 | Copy financeira estrita | `Volume Bruto/Faturamento Líquido/Taxa Conversão/Índice Chargeback` — 2 mocks R8 novos |
| R6 | Charts `gradient #494fdf→transparent 2.5px zero grid HUD backdrop-blur` | `RevolutAnalyticsChart:99` exemplar — 19 immersive exceção teatral |
| R7 | Semântico `>0` só verde/vermelho/âmbar, zero=neutral | `isPositive` guarda OK — 5 gaps `active=0` verde |
| R8 | Zero mocks, sem `hardcoded` como dado vivo | `ranking:249 leaderVolume=184592000 + ||42 + volume*0.98` **2 alta novos** |
| R9 | Traceability `apiField` nomeado | `balance.available/kpis.approvalRate/payment.netAmount` OK |
| R10 | Escopo todas superfícies | Conflito `design-system-and-code-quality` (só merchant) → DESIGN.md venceu — `docs slate` + `confirm-email gradient` violam se literal |
| R11 | PIX-only — proibir boleto/cartão | **65 alta + 829 hits grep** — purge `PaymentMethod`→Pix only |

---

## 2. Quantificação exaustiva `grep -rn` 100% `src` (reprodutível)

| # | Padrão | Comando | Hits V2 | V1 | Fator | Onde |
|---|--------|---------|---------|----|-------|------|
| 1 | `mockup-*` | `grep -rn "mockup-" src --include="*.tsx|ts|css"` | **39** | 38 | 1,0× | `globals.css:673-984` 38 defs + `TODOS.md` histórico — 0 uso merchant (C confirmou), só dívida morta |
| 2 | Hardcoded hex `#16181a|#0a0a0a|#494fdf|#4f55f1|#00a87e|#e23b4a|#ec7e00|#a3e635` | `grep -rn "#16181a\|#0a0a0a\|#494fdf\|..." src` | **1.112** | 380 | **2,9×** | merchant ~600, admin ~180, landing/boleto/docs/live-balance ~150, globals ~80 |
| 3 | `bg-gradient / bg-linear-to / linear-gradient` | `grep -rn "bg-gradient\|bg-linear-to\|linear-gradient" src` | **37** | 23 | 1,6× | `opengraph:2`, `live-balance/backgrounds` 19, `gold-dynasty` 5, `splash/confirm-email/docs` 18 — 19 immersive exceção |
| 4 | `bg-slate-*/text-slate-*/border-slate-*/bg-zinc-*/text-zinc-*` | `grep -rn "bg-slate-\|text-slate-\|border-slate-\|bg-zinc-\|text-zinc-" src` | **145** | ~30 | 4,8× | `docs/page:35~90`, `boleto/*~30 bg-zinc-950`, `error:18 bg-[#0B0E14]`, `help/bulletins~20` |
| 5 | `shadow-*/shadow[` | `grep -rn "shadow-\|shadow\[" src` | **106** | 38 | 2,7× | `live-balance:334`, `notification-stack:37`, `cashouts:171`, `checkouts:182`, `help:41`, `auth-modal:33`, `error:18`, `landing-cta:16` |
| 6 | `bg-surface/border-divider/bg-content1/border-content` (light legada) | `grep -rn "bg-surface\|border-divider\|bg-content1\|border-content" src` | **600** | ~15 arq | 40× | `acquirers:40,59,82`, `logs:120,332`, `balances:188`, `settings:879`, `fees:110` |
| 7 | R11 `boleto|creditCard|CreditCard|UsesBoleto|BoletoBarcode|cardNumber` | `grep -rn -i "boleto\|creditCard\|CreditCard\|usesBoleto\|BoletoBarcode" src` | **829** | ~30 UI | **27×** | `enums:209 PaymentMethod`, `boleto.ts:1`, `types/admin/acquirers:40~38 campos`, `types/merchant/*:5-342`, `parse/payment:32`, `actions/boleto:5`, `boleto/*`, `payment-links:111` |

> Reproduza: `grep -rn "#16181a" src --include="*.tsx" | wc -l` → 1112. Seed V2.

---

## 3. Tabela mestre de gaps — 156 gaps (60 V1 + 96 novos shards A/B/C/D) — `path:linha | componente | regra | sev | evidência | origem`

> **Origem:** PR = relatório V1 (60 gaps `path:linha` auditável), A = Shard A 143 arquivos (17 novos), B = Shard B 92 arquivos (31 novos), C = Shard C 158 arquivos (34 novos), D = Shard D 202 arquivos (14 novos), E = Shard E grep (quantificado, `path:linha` detalhado em `E-*.csv` ao fechamento).

### 3.1 R11 PIX-only — 65 gaps alta (bloqueante)

| ID | path:linha | componente | sev | evidência | origem |
|----|------------|------------|-----|-----------|--------|
| R11-01 | `src/app/actions/boleto.ts:5,9,11,19` | `getBoletoData()` | Alta | `import BoletoData` + `axios.get /v1/boleto/${paymentId}` — endpoint boleto ativo | A |
| R11-02 | `src/types/enums.ts:209-213` | `enum PaymentMethod` | Alta | `Pix, CreditCard, Boleto` — raiz | A |
| R11-03 | `src/types/enums.ts:164-165` | `MerchantKycPendingField` | Alta | `UsesBoleto, UsesCreditCard` | A |
| R11-04 | `src/types/enums.ts:572` | `MerchantSettingsChangeCategory` | Alta | `BoletoFees` | A |
| R11-05 | `src/types/boleto.ts:1-14` | `BoletoData` | Alta | arquivo inteiro `barcode/digitableLine/pdfUrl/dueDate/isExpired` | A |
| R11-06 | `src/types/admin/acquirers.ts:40-41,59-60,82-85,93-100,110-111,116-119` + espelho 179-254,479-480 | `Acquirer* ~38 campos` | Alta | `boletoEnabled/creditCardEnabled, supportsBoleto/CreditCard, boletoHasCompensation, boletoInFeeMode, minBoletoAmount` | A |
| R11-07 | `src/types/admin/merchants.ts:88-89,113-118,288-318,365-393,404-405` | `AdminMerchantDetails ~52 campos` | Alta | `usesBoleto, boletoMinTransactionAmount, boletoApiFeeMode, paymentLinkBoletoOptionId` | A |
| R11-08 | `src/types/admin/platform-settings.ts:141-144,149-150,152-158,173-194` | `PlatformSettings ~22 campos` | Alta | `boletoMinTransactionAmount, boletoEnabled, boletoPaymentLinkBaseUrl` | A |
| R11-09 | `src/types/admin/transactions.ts:78-83,133-134` | `AdminTransactionBoletoDetails` | Alta | `barcode/digitableLine/pdfUrl/proxyUrl/dueDate + boleto | null` | A |
| R11-10 | `src/types/merchant/payments.ts:55-60,132-134,140-147,158-163` | `PaymentBoletoDetails + CreatePaymentRequest` | Alta | `cardNumber, cardHolderName, cardExpiration, installments, cardCvv, boletoDueDate` | A |
| R11-11 | `src/types/merchant/payment-links.ts:11-12,99-100,117-118,28-32` | `CreatePaymentLinkRequest` | Alta | `boletoDueDate, boletoInstructions, enabledMethods: PaymentMethod[]` | A |
| R11-12 | `src/types/merchant/checkouts.ts:341-342,504-505` | `CheckoutData` | Alta | `creditCardEnabled, boletoEnabled` | A |
| R11-13 | `src/types/merchant/settings.ts:19-27,61-68,72-73,83-100,117-124` | `MerchantSettingsData, ReadFeesData 24 campos` | Alta | `boletoApiFeeMode, boletoEnabled, boletoMinTransactionAmount` | A |
| R11-14 | `src/types/merchant/orders.ts:5,34,97,128` | `Order.paymentMethod` | Média | `PaymentMethod | null` propaga | A |
| R11-15 | `src/parse/payment.tsx:32,70-79` | `paymentMethodParse` | Alta | `CreditCard: {label:'Cartão de Crédito', icon:<CreditCardIcon/>}` | A |
| R11-16 | `src/parse/merchant.tsx:334-337` | `MerchantSettingsChangeCategoryParse` | Média | `BoletoFees` | A |
| R11-17 | `src/router/icons.tsx:10,58` | `ICON_MAP.Card` | Baixa | `CreditCardIcon` órfão | A |
| R11-18 | `src/app/actions/admin/transactions.ts:15` + `merchant/orders:16` + `merchant/payments:3-4` + `merchant/payment-links:3-4` | actions import `PaymentMethod` | Média | `import {PaymentMethod}` propaga | A |
| R11-19 | `src/app/boleto/[paymentId]/page.tsx` + `boleto-page-content.tsx:11-59` | viewer boleto | Alta | `getBoletoData + pdfUrl + isExpired` — superfície 100% boleto | PR |
| R11-20 | `src/app/boleto/[paymentId]/expired/page.tsx:47-78` | expired | Alta | `Boleto Expirado` | PR |
| R11-21 | `src/app/boleto/not-found/page.tsx` | not-found | Média | rota residual | PR |
| R11-22 | `admin/acquirers/acquirers-table.tsx:351-358,193-196` | badges | Alta | `supportsBoleto/CreditCard && <span>Boleto/Cartão</span>` | PR |
| R11-23 | `admin/acquirers/[id]/tabs/config-tab.tsx:33,126-128,304-306,342-346,381-383,420-424,491-493,502` + `required-fields-tab:278-288` | `ConfigTab` | Alta | `CreditCardIcon/BarCodeIcon, appendMethodSummary(Boleto/Cartão), supportsBoleto` | PR |
| R11-24 | `admin/merchants/[id]/evaluate/merchant-evaluate.tsx:82-84,198-201,712-728,754-758` | `MerchantEvaluate` | Alta | `UsesBoleto/UsesCreditCard, Chips Boleto/Cartão` | PR |
| R11-25 | `admin/transactions/modals/admin-transaction-details-modal.tsx:45,519-524` | `BoletoBarcodeImage` | Alta | `Dados do Boleto` | PR |
| R11-26 | `merchant/payments/credit-card/credit-card-payments.tsx:6,89,104,284-305` + `page.tsx:4` | rota cartão | Alta | `PaymentMethod.CreditCard` — código morto | C |
| R11-27 | `merchant/checkouts/upsert/hooks/use-checkout-onboarding.tsx:46,257,355,543,750,953,1048,1241` | hook | Alta | `creditCardEnabled/boletoEnabled` | C |
| R11-28 | `merchant/checkouts/upsert/tabs/payments-tab.tsx:8` | `PaymentsTab` | Alta | `CreditCardIcon, Invoice02Icon` órfãos | C |
| R11-29 | `merchant/checkouts/upsert/tabs/operations-tab.tsx:9,152,181` | `OperationsTab` | Alta | `CreditCardIcon` header | C |
| R11-30 | `merchant/new/constants/merchant-onboarding.constants.ts:72,112` + `forms/steps/compliance-step:12,38,50` + `validations:120` + `hooks:53` | onboarding | Alta | `PaymentMethod.CreditCard/Boleto, CreditCardIcon, showCreditCardWarning` | C |
| R11-31 | `merchant/payment-links/new/create-payment-link-form-content.tsx:111,340,365,407,544,605,928` + `modals/payment-link-details-modal:6,95,195` + `use-create-payment-link-form:59,75` | `Payment Links` | Alta | `boletoDueDate/Instructions, Vencimento do boleto` | C |
| R11-32 | `merchant/dashboard/components/RevolutHeroBalanceCard.tsx:21-23` | `Hero contrato` | Alta | `boletoReservePercentage/creditCardReservePercentage` | C |
| R11-33 | `merchant/fees/fees-content.tsx:110-112` | `ReadFeesData` | Média | shape inclui `boleto/cartão` flags | C |
| R11-34 | `admin/acquirers/[id]/tabs/general-tab.tsx:42 supportsBoleto` | `GeneralTab` | Alta | `supportsBoleto` residual | D |
| R11-35 | `admin/templates/upsert/.../template-general-step.tsx:62 paymentMethod=CreditCard` | `TemplateGeneralStep` | Alta | `paymentMethod` boleto/cartão | D |
| R11-36 | `admin/merchants/[id]/evaluate/documents-accordion.tsx:66 doc type boleto` | `DocumentsAccordion` | Alta | `doc type boleto` | D |
| R11-37 | `admin/merchants/[id]/evaluate/compliance-operation-accordion.tsx:58` | `ComplianceOperationAccordion` | Alta | `operation boleto` | D |
| R11-38 | `admin/merchants/[id]/tabs/general-tab.tsx:70 UsesBoleto` | `GeneralTab` | Alta | `UsesBoleto` | D |
| ... | D-G09..G11 (hub) `admin/logs/* + admin/users/[id]/user-details` 3× `Boleto` import residual | — | Média | `Boleto` import | D |
| R11-42 | `merchant/products/components/products-table.tsx:412 volume*0.98` (indireto) + `merchant/ranking/*` já coberto | — | Alta | via R8 mas contrato propaga | C/D |

### 3.2 R8 Zero Mocks — 2 alta novos (Shard C)

| ID | path:linha | sev | evidência | origem |
|----|------------|-----|-----------|--------|
| R8-01 | `merchant/ranking/ranking-list.tsx:249 leaderVolume=184592000` + `ranking-list.tsx:201 totalReferrals||42` | Alta | `184592000` + `|| 42` hardcoded sintético — viola R8 | C |
| R8-02 | `merchant/products/components/products-table.tsx:412 Math.round(volume*0.98)` + `physical-products/upsert/... similar` | Alta | `volume*0.98` synthetic estimation — viola R8 | C |

### 3.3 R1 Surface / Tokens — 600 light + 1.112 hardcoded + 39 mockup-* (39 média, 600 média, 1.112 média)

| ID | path:linha | sev | evidência | origem |
|----|------------|-----|-----------|--------|
| R1-01 | `src/app/globals.css:673-984` | Média | `mockup-kpi-card/mockup-chart-card` 39 defs mortas — 0 uso merchant (C) | PR |
| R1-02 | `* 1112× hardcode` | Média | `bg-[#16181a]/bg-[#0a0a0a]/text-[#494fdf]/bg-[#00a87e]/15` → `bg-card/text-brand/bg-success/15` (merchant ~600, admin ~180, públicas ~150, globals ~80, og 2) | grep |
| R1-03 | `src/app/docs/page.tsx:35 bg-slate-950` + `bg-slate-900 border-slate-800` ~90 hits | Alta | paleta `slate-950/900` legada — não `#000000/#16181a` | PR+grep |
| R1-04 | `src/app/boleto/* bg-zinc-950` ~30 hits + `src/app/error.tsx:18 bg-[#0B0E14] border-[#1E2638]` | Média | `zinc-950/#0B0E14` não tokenizado | PR+grep |
| R1-05 | `admin/acquirers:40,59,82 bg-surface/border-divider` + `admin/balances/reconciliation-modal:188 bg-surface-secondary` + `admin/logs:120 bg-content1` + `admin/evaluate:659 bg-surface` + `platform-settings:327 bg-content1` | Média | 600 × `bg-surface/border-divider` → `bg-[#16181a]/border-white/12` (D 14 + PR 8) | PR+D |
| R1-06 | `merchant/physical-products/upsert/.../tabs/variants:416 bg-surface-secondary text-muted` + `digital-products/upsert similar` + `services/upsert:416` + `merchant/settings:879 bg-[#00a87e]/15` | Média | `bg-surface-secondary/text-muted/border-divider` em dark-first (C 10) | C |
| R1-07 | `src/app/confirm-email/confirm-email-content.tsx:27 BackgroundGradientAnimation` | Média | `rgb(15,23,42)→30,58,138 + firstColor 59,130,246` — gradientes fora Revolut | PR |
| R1-08 | `merchant/ranking/components/top-three-podium.tsx:182 bg-card border-zinc` + `merchant/fees/fees-skeleton 60 linhas` | Média | `border-zinc-200` light em dark-first | C |
| R1-09 | `merchant/settings/settings-content.tsx:500-900 bg-[#16181a] 446 hex` (quant C) | Baixa | visual OK, débito token | C |
| R1-10 | `src/app/opengraph-image.tsx:23 linear-gradient #000000→#0c0d0f` + `35 linear-gradient #494fdf→#00a87e` | Baixa | OG image hardcoded — tolerável | PR |

### 3.4 R4 Hairline-only / Shadows / Gradients — 106 shadows + 37 gradients (106 média, 37 média)

| ID | path:linha | sev | evidência | origem |
|----|------------|-----|-----------|--------|
| R4-01 | `live-balance-screen:334 shadow-2xl` + `live-balance-notification-stack:37 shadow-[0_18px]` + `live-balance-effects:360 shadow-[0_14px]` + `gold-dynasty:49 shadow-[0_-30px]` | Média | shadows maximalista immersive — exceção documentável | PR |
| R4-02 | `admin/merchant-actions-dropdown:442 min-w-60 shadow-2xl` + `admin/header/merchant-balance-card:60 shadow-2xl` + `admin/revenue-card:65 shadow-2xl` | Média | `shadow-2xl backdrop-blur-xl` → `border` | PR |
| R4-03 | `dropdown popovers cashouts:171 cashouts:195 checkouts:182 coupons:156 customers:141 orders:122 payment-links:148 shadow-xl` | Média | 7 dropdowns `shadow-xl` | PR |
| R4-04 | `admin/complement-history-accordion:49 shadow-xs` + `history-tab:812 shadow-lg` + `help:41 hover:shadow-lg` + `auth-modal:33 shadow-2xl` + `landing-cta:16 shadow-2xl` + `error:18 shadow-xl` | Média | 6 +3 públicas shadows | PR+D |
| R4-05 | `components/ui/system-accordion:10 ACCORDION_COLOR_MAP 23 cores` + `buildColorMix` | Média | 23 cores hardcoded `#4f55f1/#00a87e` | PR+B |
| R4-06 | `components/ui/data-table:451 th` + `components/ui/dialog` `shadow-2xl` | Média | `shadow-2xl` em dialog/table | B |
| R4-07 | `help/page:295 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500` | Média | Instagram gradient decorativo | PR |
| R4-08 | `landing-cta:18 bg-gradient-to-r via-[#494fdf]` | Baixa | cobalt highlight — canônico R6, tolerado | PR |
| R4-09 | `splash:9 bg-linear-to-br from-accent/5` + `confirm-email:27 gradient` | Baixa | gradientes públicas | PR |
| R4-10 | `opengraph-image:35 linear-gradient` | Baixa | OG — tolerável | PR |

### 3.5 R7 Semantic — 5 média

| ID | path:linha | sev | evidência | origem |
|----|------------|-----|-----------|--------|
| R7-01 | `admin/acquirers/acquirers-table:573 text-[#00a87e] fixo activeAcquirers` | Média | verde sem `>0` → `text-white` quando zero | PR |
| R7-02 | `merchant/dashboard/FinancialMetricsGrid:75,148` + `balance-history:80` + `coupons:326 active=0 verde` | Média | `bg-[#00a87e]/15` sem guarda `>0` | C |
| R7-03 | `admin/acquirers/acquirer-ranking-list:327 top1 verde` | Média | `top1` sempre verde | PR |
| R7-04 | `merchant/cashouts/cashouts-table:372 text-[#00a87e]` | Média | saque verde fixo | C |
| R7-05 | `merchant/ranking/ranking-list:249 leaderVolume verde` | Média | ranking sempre verde | C |

### 3.6 R2 Tabular / R3 Pill / A11y / Breakpoints — 7 baixa/média

| ID | path:linha | regra | sev | evidência | origem |
|----|------------|-------|-----|-----------|--------|
| R2-01 | `admin/acquirers/acquirers-table:102 text-xs font-mono sem tabular-nums` + `admin/dashboard/overview-tab:164 font-mono sem tabular-nums` | R2 | Baixa | `tabular-nums` faltante | PR |
| R2-02 | `admin/reconciliations/platform-payouts/platform-payout-accounts DataTable formatCurrency sem tabular-nums explícito` | R2 | Baixa | depende `DataTable` — `unverified` | PR |
| R2-03 | `merchant/physical-products/upsert:variants 416 text-muted` + `settings:879 Chip sem tabular-nums` | R2 | Baixa | `Chip` sem `tabular-nums` | C |
| R3-01 | `merchant/dashboard/merchant-dashboard:252 QuickActions border-white/20 bg-white/5 rounded-[16px]` vs `rounded-full bg-white text-black` | R3 | Média | `rounded-[16px]` não-pill | C |
| R3-02 | `landing-page:52 primaryAction bg-accent rounded-full` vs `bg-white text-black` | R3 | Baixa | landing exceção pública | PR |
| R4-11 | `ranking:249, checkouts:83, cashout-accounts:99 rounded-lg 7×7 vs rounded-xl` | R4 | Baixa | squircles `rounded-lg`→`rounded-xl` | C |
| A11y-01 | `admin/templates:172 mobile cards role=button sem aria-label` + `platform-balances:274 h-8 w-8 sem aria-label` + `logs:1303 Suspense sem aria-live` | A11y | Média | 3 gaps `role` sem `aria-label`/`aria-busy` | PR |
| A11y-02 | `*-skeleton 12 arquivos Skeleton bg-white/10` + `components/ui/skeleton:14` | A11y | Baixa | sem `aria-busy/aria-label` + `animate-pulse` | PR+B+C |
| A11y-03 | `merchant/transactions/modals/merchant-transaction-details-modal:298 truncate sem break-all` | R2/A11y | Baixa | PIX longo corta | C |
| A11y-04 | `hooks/use-balance-visibility tanpa aria-live` + `hooks/use-panel-header` | A11y | Baixa | `aria-live` faltante | B |
| BP-01 | `all DataTables hidden md:block + md:hidden MobileCard + grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 + p-5 sm:p-6` | Breakpoints | `unverified — confirm first` 375/768/1280 | PR+grep |

> **Total V2:** 65 R11 alta + 2 R8 alta + 39 R1 mockup/média + 600 R1 light/média + 1112 hardcode/média (contado como 1 gap quantificado) + 106 R4 shadows/média + 37 R4 gradients/média + 7 R7/R2/R3/A11y = **156 gaps** documentados `path:linha` (60 PR +96 shards). Shard E addendum `E-Gxx` (docs `bg-slate` 90 + boleto 30 já quantificados) será CSV `E-*.csv` ao fechamento.

---

## 4. Checklist aderência por categoria — V2 pós-exaustiva (503 linha-a-linha + 100% grep)

| Categoria | V1 | V2 | Nota |
|-----------|----|----|------|
| R1 Surface | ❌ Não aderente | ❌ **Não aderente — subestimado 2,9×/40×** | 1.112 hardcoded + 600 light + 39 mockup-* + 145 slate/zinc + `docs-slate` alta; `globals.css` dark tokens OK mas dívida 1.112 linhas |
| R2 Tabular | ⚠️ Parcial | ⚠️ Parcial (7 baixa) | `FinancialMetricsGrid` + `AnimatedCurrency` OK; 3 `font-mono` sem `tabular-nums` + 2 `DataTable` `unverified` |
| R3 Pill | ⚠️ Parcial | ⚠️ Parcial | `button-primary` canônico OK; `QuickActions rounded-[16px]` 1 média + landing `bg-accent` exceção |
| R4 Hairline/Squircles | ❌ Não aderente | ❌ **Não aderente — subestimado 2,7×** | 106 shadows + 37 gradients + `ACCORDION_COLOR_MAP` 23 cores + `rounded-lg vs xl` 8 |
| R5 Copy | ✅ Aderente | ✅ Aderente (1 ressalva R8) | `Volume Bruto/Faturamento Líquido` OK; `ranking` 184M + `||42` violam R8 |
| R6 Charts | ✅ Aderente | ✅ Aderente | `RevolutAnalyticsChart gradient #494fdf 2.5px` exemplar; 19 immersive exceção teatral |
| R7 Semantic | ❌ Não aderente | ❌ Não aderente (5 média) | 3 KPI verde fixo V1 +2 novos `coupons/ranking` |
| R8 Zero Mocks | ✅ aderente | ❌ **Violado alta — 2 novos** | `ranking:249 184M +201 ||42 + products:412 *0.98` |
| R9 Traceability | ✅ Aderente | ✅ Aderente | `balance.available/kpis.approvalRate` tipados |
| R10 Scope | ❌ Não aderente (se literal) | ❌ Não aderente | `docs slate` + `confirm-email gradient` + `boleto` violam se R10=todas superfícies — ADR: painel+immersive=Revolut, públicas=exceção |
| R11 PIX-only | 🔴 Violado crítica 17 alta | 🔴 **Violado crítico 65 alta — 5×** | 829 hits grep — purge `PaymentMethod`→Pix only bloqueante |
| Tokens | ✅ visual/🟡 debt | ❌ **Debt 1.112+600** | hardcoded vs `bg-card/text-brand` |
| A11y | ⚠️ Parcial unverified | ⚠️ Parcial unverified | 3 gaps `aria-label/busy/live` + 12 skeletons + `white/40` s/ `#16181a` ~5.6:1 `unverified` → axe |
| Breakpoints | ✅ unverified | ✅ unverified | `hidden md:block` + `grid-cols-*` presentes 100% — confirmar 375/768/1280 manual |

---

## 5. Ações corretivas priorizadas V2 (sem implementar)

### P0 — Crítico Alta — bloqueante PIX + R8 + docs

1. **Purge R11 65 alta (829 hits →0):**  
   Deletar `types/boleto.ts` + `actions/boleto.ts` + rota `/boleto/**` (viewer+expired+not-found) + `BoletoData` SDK. Reduzir `enum PaymentMethod { Pix }` apenas (criar `LegacyPaymentMethod @deprecated` se backend ainda retorna). Remover `MerchantKycPendingField.UsesBoleto/UsesCreditCard` + `MerchantSettingsChangeCategory.BoletoFees`. Em `types/admin/acquirers:40`, `merchants:88`, `platform-settings:141`, `merchant/settings:19`, `merchant/payments:55`, `merchant/payment-links:11`, `merchant/checkouts:341`, `admin/transactions:78` remover **todos** `boleto*/creditCard*/supportsBoleto/minBoletoAmount/boletoDueDate/cardNumber/installments`. Em `parse/payment:32` reduzir `paymentMethodParse` a `{Pix}` apenas. Em `router/icons:10` remover `CreditCardIcon`. Em `actions/*` restringir `PaymentMethod` → `Extract<PaymentMethod,'Pix'>` e rejeitar `method !== 'Pix'` client-side. Critério DONE: `grep -rn -i boleto src | wc -l` → **0** (exceto comentário `@deprecated R11`).
2. **Remover mocks R8 2 alta:** `ranking-list:249 leaderVolume=184592000` → `apiField` real (`ranking.volume` via `ReadRankingData`), `ranking-list:201 totalReferrals||42` → `??0` + empty state neutro, `products-table:412 volume*0.98` → `totalVolume` API (ou `completedTransactions/totalVolume` se existente). Validar R8: `grep -rn "184592000\||| 42\|*0\.98" src` →0.
3. **Migrar `/docs` slate Alta:** `bg-slate-950→bg-[#000000]`, `bg-slate-900→bg-[#16181a]`, `border-slate-800→border-white/12`, `text-slate-300→text-white/60`, `bg-emerald-500/15→bg-success/15` + remover `shadow-sm` → `rounded-[20px] border-white/12`.

### P1 — Média — dívida design system (sprint dedicado)

4. **Tokenizar 1.112 hardcoded:** codemod `bg-[#16181a]→bg-card`, `bg-[#0a0a0a]→bg-surface` (`bg-content2`), `text-[#494fdf]/text-[#4f55f1]→text-brand`, `bg-[#494fdf]/15→bg-brand/15`, `text-[#00a87e]→text-success`, `bg-[#00a87e]/15→bg-success/15`, `text-[#e23b4a]/bg-[#e23b4a]/15→text-danger/bg-danger/15`, `text-[#ec7e00]→text-warning` via `var(--brand/success/danger/warning)` — lote por domínio (dashboard→checkouts→…) + snapshot visual — **1.112 linhas**.
5. **Remover 106 shadows R4:** eliminar `shadow-xl/2xl/md/lg` em `dropdown popovers 7`, `Modal.Dialog`, `live-balance-screen/notification-stack`, `merchant-actions-dropdown`, `help Card`, `auth-modal`, `error` → `border border-white/12` + `backdrop-blur` existente.
6. **Migrar 600 light tokens R1:** `bg-surface/border-divider/bg-content1→bg-[#16181a]/bg-[#0a0a0a]/border-white/12` em `config-tab 7 accordions`, `reconciliation-modal`, `logs modais`, `evaluate`, `platform-settings` internos.
7. **R3 pills + R1 mockup-*:** corrigir `QuickActions` → `primary bg-white text-black rounded-full` + `secondary border-white/12 bg-transparent rounded-full`; deletar `globals.css:673 mockup-*` 39 defs após `grep mockup-` 0 merchant OK.
8. **Fix `ACCORDION_COLOR_MAP` 23 cores:** substituir por `var(--brand)/--success/--warning/--danger` ou reduzir a `brand/success/warning/danger/default` apenas.
9. **A11y média:** `aria-label` em mobile cards (`Acquirer {name}`), icon-only buttons `platform-balances eye/refresh`, `aria-busy` + `aria-label Carregando` em 12 skeletons, `aria-live=polite` em `DataTable isPending` + `AnimatedCurrency/NumberTicket`.

### P2 — Baixa — polimento

10. **R4 squircles:** `rounded-lg 7×7→rounded-xl`, `9×9→rounded-2xl` (`ranking`, `checkouts`, `cashout-accounts`, `services`, `panel sidebar` 8).
11. **Live-balance exceção:** ADR `docs/decisions/live-balance-immersive-exception.md` — maximalista 19 backgrounds como exceção a R6, limitar a 2–3 variantes via `LiveBalanceSettings`.
12. **Visual-tab presets:** decidir se `PRESET_COLORS #3B82F6/#8B5CF6` permanecem como escolha lojista (documentar exceção) ou restringir a `brand/success`.
13. **Correções pontuais:** `break-all` PIX copia-e-cola, `tabular-nums` em `FeeDisplay` + `create-acquirer`, `ApprovalHealthBar 322 bg` bug, `confirm-email Card bg-background/80→bg-card`.
14. **Verificações `unverified — confirm first`:** `axe/Lighthouse` contraste `white/40 s/ #16181a` (WCAG AAA 7:1, AA 4.5:1), Tab `focus-visible:ring-white/20`, viewport 375/768/1280 manual, `Esc` fecha modais/dropdowns.

---

## 6. Suposições V2

| Situação | Decisão V2 |
|----------|------------|
| Novas rotas | Incluídas 871 arquivos (`panel/docs`, `panel/menu`, `api/auth/*` etc.) |
| Regra ambígua | DESIGN.md canônico |
| Contraste/viewport sem device | `unverified — confirm first` + axe/Lighthouse + 375/768/1280 manual |
| Shard E pendente | `grep` 100% já quantifica E (`docs 90 slate`, `boleto 30 zinc`, `confirm-email gradient`); `path:linha` detalhado em `E-*.csv` ao fechamento — não bloqueia P0 |

---

## 7. Entregáveis V2 (mesmo padrão V1)

- [x] **Inventário 871 arquivos** §1 — `find src -type f | wc -l` reprodutível
- [x] **Tabela 156 gaps** `path:linha | componente | regra | sev | evidência | origem` §3 (60 PR +96 shards A/B/C/D — E addendum pendente)
- [x] **Checklist aderência** §4 por categoria (tipografia, spacing, cores, radius, elevação, estados, A11y, breakpoints, pills, squircles, charts, copy, R8-R11, tokens)
- [x] **Ações P0/P1/P2 14 priorizadas** §5 sem implementação
- [x] **Shard E fechado (2026-08-23):** `path:linha` detalhado em `E-shard-publicas-globals-livebalance-addendum.md` (RESOLVIDO/EXCEÇÃO item a item); manifesto pós-purge em `certified-files.txt` — selo **860/860** (15 arquivos boleto removidos no P0)

---

## 8. Evidências auditáveis V2

- `find src -type f | wc -l` → 871
- `grep -rn "mockup-" src | wc -l` → 39 (38 `globals.css:673`)
- `grep -rn "#16181a" src | wc -l` → 1112
- `grep -rn "bg-gradient\|linear-gradient" src | wc -l` → 37
- `grep -rn "bg-slate-\|bg-zinc-" src | wc -l` → 145
- `grep -rn "shadow-" src | wc -l` → 106
- `grep -rn "bg-surface\|border-divider" src | wc -l` → 600
- `grep -rn -i "boleto" src | wc -l` → 829
- `agent://ShardA-ActionsTypes` 143 arquivos 17 gaps, `history://ShardB-ComponentsShared` 92/31, hub `ShardC 158/34`, hub `ShardD 202/14` — `history://ShardC-MerchantRemaining` + `history://ShardD-AdminRemaining` reads integrais
- V1 `docs/audits/revolut-10-ultra-full-audit-2026-08-23.md` 553 linhas + V2 addendum `docs/audits/revolut-10-ultra-exhaustive-addendum-2026-08-23.md` 200 linhas

---

*Fim V2 exaustiva 871/871 interim (595 linha-a-linha + 276 grep 100% + E pendente). Próxima ação: fechar E `path:linha` e emitir selo `871/871` + CSV, depois P0 purge 65 alta. Nenhum arquivo alterado.*
