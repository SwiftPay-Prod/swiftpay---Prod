# SWIFTPAY — Mapa do Frontend

> **Data de análise:** 21/05/2026

---

## 1. Visão Geral

Dois frontends Next.js 16 + React 19, compartilhando stack mas com propósitos distintos.

| Frontend | Propósito | Porta dev | Porta container |
|----------|-----------|-----------|-----------------|
| **swiftpay-web** | Painel administrativo (merchants + admins) | 5001 | 3000 |
| **swiftpay-web-checkout** | Checkout público (comprador final) | 5002 | 3000 |

**Stack compartilhada:** Next.js 16 (App Router), React 19.2, HeroUI v3, Tailwind CSS v4, TypeScript 5.9 strict, Axios, SignalR, Zod 4, Framer Motion

---

## 2. swiftpay-web — Painel Administrativo

### 2.1 Árvore de Rotas (App Router)

```
src/app/
├── (public)
│   ├── page.tsx                          # Login / Signup
│   ├── splash/page.tsx                   # Splash (PWA)
│   ├── confirm-email/page.tsx            # Confirmação de email
│   └── boleto/[paymentId]/page.tsx       # Boleto público (subdomínio)
│
├── panel/
│   ├── layout.tsx                        # Root Layout (Server Component)
│   │
│   ├── (auth-status)/                    # Rotas de verificação
│   │   ├── verify-email/
│   │   └── onboarding/                   # Onboarding do usuário
│   │
│   ├── (immersive)/                      # Tela cheia
│   │   └── merchant/live-balance/        # Saldo animado (Three.js)
│   │
│   └── (main)/                           # Painel principal autenticado
│       ├── layout.tsx                    # PanelLayout wrapper
│       ├── merchant/                     # 25 seções
│       │   ├── dashboard/                # KPIs, gráficos
│       │   ├── payments/                 # Lista de pagamentos
│       │   ├── payment-links/            # Links de pagamento
│       │   ├── cashouts/                 # Saques
│       │   ├── cashout-accounts/         # Contas de saque
│       │   ├── balance-history/          # Histórico de saldo
│       │   ├── transactions/             # Transações
│       │   ├── orders/                   # Pedidos
│       │   ├── products/                 # Produtos (físico, digital, serviço)
│       │   ├── digital-products/         # Itens digitais
│       │   ├── physical-products/        # Produtos físicos
│       │   ├── services/                 # Serviços
│       │   ├── checkouts/                # Config de checkout
│       │   ├── customers/                # Clientes
│       │   ├── coupons/                  # Cupons
│       │   ├── api-credentials/          # Chaves API
│       │   ├── fees/                     # Taxas
│       │   ├── integrations/             # Integrações (tracking)
│       │   ├── email-templates/          # Templates de email
│       │   ├── settings/                 # Configurações gerais
│       │   ├── achievements/             # Conquistas
│       │   ├── ranking/                  # Ranking
│       │   ├── review/                   # Revisão (KYC)
│       │   ├── new/                      # Novo merchant (onboarding)
│       │   └── demo/                     # Demo
│       │
│       ├── admin/                        # 14 seções
│       │   ├── dashboard/                # Dashboard admin
│       │   ├── users/                    # Gestão de usuários
│       │   ├── merchants/                # Gestão de merchants
│       │   ├── acquirers/                # Gestão de adquirentes
│       │   ├── balances/                 # Saldos da plataforma
│       │   ├── payouts/                  # Saques (avaliação)
│       │   ├── platform-payouts/         # Payouts da plataforma
│       │   ├── platform-payout-accounts/ # Contas de payout
│       │   ├── platform-settings/        # Config da plataforma
│       │   ├── reconciliations/          # Reconciliações
│       │   ├── referrals/                # Indicações (admin)
│       │   ├── templates/                # Templates de checkout
│       │   ├── transactions/             # Transações (admin)
│       │   └── logs/                     # Logs
│       │
│       ├── profile/                      # Perfil do usuário
│       ├── security/                     # Segurança, dispositivos
│       ├── notifications/                # Notificações
│       ├── referrals/                    # Indicações (usuário)
│       ├── achievements/                 # Conquistas do usuário
│       ├── bulletins/                    # Informativos
│       ├── help/                         # Central de ajuda
│       ├── docs/                         # Documentação
│       └── about/                        # Sobre
```

### 2.2 Sistema de Roteamento Customizado

```typescript
// src/router/routes.ts — Rotas tipadas
Routes.panel.merchant.dashboard()
Routes.panel.merchant.payments.list()
Routes.panel.merchant.checkouts.upsert('new')
Routes.panel.admin.users.list()
// etc.

// src/router/router.ts — ROUTES_CONFIG (60+ rotas)
interface RouteConfig {
  path: string;
  title: string;
  type: RouteType;      // Public | Private | Open
  access?: RouteAccess;  // God | Admin | Merchant
  icon?: IconName;
  section?: MenuSection;
  order?: number;
}

// src/router/route-guard.ts — Validação de acesso
validateRouteAccess(path, context)
canAccessRoute(config, user, merchant)
shouldShowInMenu(config, user, merchant)
getPageTitle(path)
```

**Seções do Menu:** Admin, Vendas, Financeiro, Configurações, Suporte

### 2.3 Contextos (12) — Grafo de Dependência

```
Providers
├── theme-provider (next-themes, dark mode default)
├── router-provider (react-aria-components)
├── auth-hub-provider (SignalR auth events)
├── bulletin-provider (informativos)
└── dashboard-hub-provider (SignalR dashboard)
    │
    └── panel-providers.tsx
        ├── session-config-context
        ├── public-config-context
        ├── user-context (dados do usuário logado)
        ├── admin-context (contexto administrativo)
        ├── merchant-context (merchant selecionado, saldo)
        ├── environment-context (Sandbox/Production)
        ├── signalr-context (WebSocket principal)
        ├── notification-context (notificações merchant)
        ├── user-notification-context (notificações user)
        ├── push-notification-context (FCM)
        ├── layout-context (estado do layout)
        └── sidebar-context (expansão do menu)
```

**MerchantContext** — O mais crítico: gerencia `selectedMerchantId`, lista de merchants, refresh de saldo, nível.

### 2.4 Componentes UI (58)

| Categoria | Componentes |
|-----------|------------|
| **Data Display** | `data-table`, `data-links`, `detail-components`, `expandable-list`, `inline-list`, `json-code-block`, `section-header` |
| **Forms/Inputs** | `async-autocomplete`, `async-combobox`, `async-multi-combobox`, `combobox-filter`, `currency-cents-input`, `international-phone-input`, `json-editor-input`, `multi-select-chips`, `rich-text-editor`, `search-filter`, `select-filter` |
| **Layout** | `form-page-header`, `form-page-skeleton`, `form-save-footer`, `horizontal-steps`, `vertical-steps`, `wizard-stepper`, `page-header`, `review-step-layout`, `internal-tabs`, `internal-tabs-list`, `internal-tag-tabs`, `system-accordion` |
| **Feedback** | `confetti`, `swiftpay-toaster`, `confirmation-modal`, `empty-state`, `unsaved-changes-alert`, `progress-bar` |
| **Buttons/Actions** | `async-button`, `table-id-cell` |
| **Visualization** | `animated-currency`, `animated-number`, `chart`, `background-gradient-animation`, `boleto-barcode-image`, `number-ticket` |
| **Image/Document** | `image-uploader`, `single-image-upload`, `document-viewer` |
| **Date/Time** | `date-time-picker`, `formatted-date`, `relative-time`, `time-remaining` |
| **Mobile** | `mobile-bottom-sheet`, `mobile-menu-page` |
| **Specialized** | `icon`, `swiftpay-brand-logo`, `avatar-user`, `bulletin-reactions`, `theme-toggle` |

### 2.5 Server Actions (75+ mapeadas)

| Domínio | Arquivos | Qtd |
|---------|----------|-----|
| `admin/` | acquirers, automatic-cashouts, cashouts, dashboard, logs, merchants, platform-payouts, platform-settings, ranking, reconciliation, referrals, templates, transactions, upload, users, wayne-protocol | 16 |
| `merchant/` | achievements, api-credentials, automatic-cashouts, balance, balance-history, cashout-accounts, cashouts, checkouts, coupons, crud, customers, dashboard, digital-items, email-templates, integrations, notifications, orders, payment-links, payments, products, settings, upload, delete-file | 23 |
| **Root** | auth, address, boleto, files, session, user | 6 |

### 2.6 Sistema de Tipos (60+ enums)

Arquivo `src/types/enums.ts` — 622 linhas, 66 enums. Destaques:
`UserRole`, `UserStatus`, `MerchantStatus`, `MerchantKycStatus`, `PaymentStatus`, `PaymentMethod`, `OrderStatus`, `ProductType`, `CurrencyType`, `PayoutStatus`, `PixKeyType`, `NotificationStatusType`, `WebhookAuthMode`, `AcquirerType`, `CheckoutColorMode`, `FeeMode`, `ApiEnvironment`, `AchievementType`, `LedgerTransactionOperation`, `ReferralCommissionStatus`, ...

### 2.7 Parse System (18 parsers)

Arquivos em `src/parse/`: `achievement`, `acquirer`, `automatic-cashout`, `checkout`, `checkout-template`, `coupon`, `customer`, `email-block`, `email-template`, `logs`, `merchant`, `notification`, `order`, `payment`, `product`, `reconciliation`, `table`, `user`

```typescript
interface TParse {
  label: string;         // Texto em PT-BR
  color: ParseColor;     // 'default' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger'
  description?: string;
  icon?: ReactNode;
}
```

### 2.8 SignalR — Eventos em Tempo Real

**Hub:** `/hubs/notifications` via `signalr-context`

| Evento (Server → Client) | Handler |
|--------------------------|---------|
| `EmailVerified` | Recarrega sessão |
| `UserStatusChanged` | Atualiza status no header |
| `NotificationReceived` | Toast + som + badge |
| `UserNotificationReceived` | Toast + som + badge |
| `DeviceRevoked` | Modal de dispositivo revogado |
| `DashboardUpdated` | Refresh dos KPIs |
| `MerchantDashboardUpdated` | Refresh do dashboard merchant |
| `AdminDashboardUpdated` | Refresh do dashboard admin |
| `AcquirerDashboardUpdated` | Refresh do dashboard adquirente |

### 2.9 Autenticação

**Cookies httpOnly:** `swiftpay_access_token`, `swiftpay_refresh_token`, `swiftpay_user_info`

**Fluxo:**
```
Login → API Route Handler → JWT token → cookie
  → Axios interceptor adiciona Authorization header
  → Refresh automático via x-new-token header no response
  → Middleware (proxy.ts) valida sessão por cookie
  → SignalR Hub autentica via ?access_token= query string
```

### 2.10 Firebase / Push

- Project: `swiftpaya405c`
- VAPID key configurada
- Service worker: `public/firebase-messaging-sw.js`
- Detecção de PWA (iOS e Android)
- Suporte foreground/background

### 2.11 Live Balance (Experiência Imersiva)

- Rota: `/panel/merchant/live-balance`
- 16+ backgrounds animados com Three.js + partículas
- Efeitos: `celestial-ink`, `cyber-grid`, `beach-escape`, `tidal`, `cosmic-pulse`, `gold-dynasty`, `fireflies`, `firestorm`, `neural-flow`, `scanline`, `starfield-burst`, etc.
- Configurações persistidas em `localStorage`

---

## 3. swiftpay-web-checkout — Checkout Público

### 3.1 Rotas

| Rota | Renderiza | Modo |
|------|-----------|------|
| `/` | 404 | — |
| `/[checkoutId]` | Resolve 3 fluxos | Principal |
| `/[checkoutId]` (prefix `pay_`) | Payment Link Template | Token |
| `/[checkoutId]` (GUID) | Payment Link View | PaymentId |
| `/[checkoutId]` (shortId) | Checkout Runtime (hero-pro) | Checkout |
| `/sandbox/[checkoutId]` | Checkout Runtime (sandbox) | Dev |
| `/pay/[token]` | Payment Link (legacy, SEO) | Token |

### 3.2 Template Runtime Architecture

```
core/checkout/
├── metadata/build-checkout-metadata.ts    # SEO/OG/Twitter
├── runtime/
│   ├── types.ts                           # CheckoutTemplateModule contract
│   ├── registry.ts                        # Template registry
│   ├── resolve-checkout-template.ts       # Resolution by code
│   ├── normalize-template-code.ts         # Code normalization
│   └── render-checkout-runtime.tsx        # Render orchestrator
```

```typescript
interface CheckoutTemplateModule {
  code: string;
  aliases?: string[];
  render: (input: CheckoutTemplateRenderInput) => ReactNode;
}
```

### 3.3 Templates (3 registrados)

| Template | Pasta | Funcionalidades |
|----------|-------|-----------------|
| **hero-pro** | `templates/hero-pro/` | Formulário completo: ID, entrega, pagamento (PIX/CC/Boleto), prova social, timer, cupons, tema dark/light |
| **payment-link-fixed** | `templates/payment-link-fixed/` | Fluxo de payment link: seleção de método, QR Code, cartão, boleto, polling de status |
| **payment-link-view** | `templates/payment-link-view/` | Visualização de cobrança: PIX (QR + copia/cola), boleto (código de barras + linha digitável), impressão A4 |

### 3.4 Hooks do Checkout

| Hook | Função |
|------|--------|
| `useCheckoutCalculation` | Cálculo de valores via API com debounce + AbortController |
| `useGroupedProducts` | Agrupamento de produtos por productId, seleção de variante |
| `useOrderRecovery` | Recuperação de pedido por orderId da URL, reativação de expirado |
| `useOrderReservation` | Reserva de estoque com sessionId, timer de expiração |
| `usePaymentStatusHub` | Conexão SignalR para status em tempo real |

### 3.5 Tracking (9 plataformas)

```
TrackingProvider → orquestra todos os trackers
  ├── Facebook Pixel + CAPI (Server API)
  ├── Google Tag Manager
  ├── TikTok Pixel
  ├── Kwai Pixel
  ├── Pinterest Tag
  ├── Taboola Pixel
  ├── Microsoft Clarity
  ├── Utmify
  └── Otimizey
```

**Eventos padronizados (6):**
`pageEntered` → `contentLoaded` → `initiateCheckout` → `addPaymentInfo` → `clickedPurchase` → `purchaseCompleted`

---

## 4. Configuração dos Frontends

### swiftpay-web (`next.config.ts`)
- React Compiler: `true`
- Server Actions: `bodySizeLimit: 10mb`
- Output: `standalone`
- Build ID: `NEXT_BUILD_ID` → `DO_GIT_COMMIT_SHA` → `GITHUB_SHA` → fallback

### swiftpay-web-checkout (`next.config.ts`)
- Server Actions: `bodySizeLimit: 10mb`
- Output: `standalone`
- Build ID: estático `swiftpay-web-checkout-stable-build`
- Rewrites: `/api/payment/:path*` → Payment API URL
