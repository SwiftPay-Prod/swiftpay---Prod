# Relatório Final de Auditoria — Revolut 10 / Ultra
> Data: 2026-08-23
> Escopo: todas as superfícies SwiftPay (admin, merchant, públicas, componentes compartilhados)
> Método: leitura estática + varredura de padrões legados + checagem TypeScript
> Restrição: somente leitura e documentação; nenhuma alteração de código

## 1. Inventário de rotas e superfícies
### Públicas
| Rota | Arquivo(s) | Status |
|---|---|---|
| `/` | `src/components/landing/landing-page.tsx`, `landing-cta.tsx`, `landing-hero.tsx` | Auditada |
| `/docs` | `src/app/docs/page.tsx` | Auditada |
| `/boleto/[paymentId]` | `src/app/boleto/[paymentId]/boleto-page-content.tsx` | Auditada |
| Auth modal | `src/components/landing/auth-modal.tsx` | Auditada |

### Painel Admin
| Rota | Arquivo(s) | Status |
|---|---|---|
| Dashboard | `src/app/panel/(main)/admin/dashboard/admin-dashboard.tsx` | Auditada |
| Merchants | `src/app/panel/(main)/admin/merchants/[id]/tabs/settings-tab.tsx` | Auditada |
| Acquirers | `src/app/panel/(main)/admin/acquirers/[id]/tabs/config-tab.tsx`, `general-tab.tsx` | Auditada |
| Platform Settings | `src/app/panel/(main)/admin/platform-settings/platform-settings-form.tsx` | Auditada |
| Templates | `src/app/panel/(main)/admin/templates/templates-table.tsx` | Auditada |
| Transactions | `src/app/panel/(main)/admin/transactions/transactions-table.tsx` | Auditada |
| Payouts/Logs/Users/etc | Várias tabelas em `admin/*` | Auditada |

### Painel Merchant
| Rota | Arquivo(s) | Status |
|---|---|---|
| Dashboard | `src/app/panel/(main)/merchant/dashboard/merchant-dashboard.tsx`, `components/*` | Auditada |
| Payment Links | `src/app/panel/(main)/merchant/payment-links/**` | Auditada |
| Checkouts | `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/**` | Auditada |
| Orders/Products/etc | Várias tabelas em `merchant/*` | Auditada |
| Live Balance | `src/app/panel/(immersive)/merchant/live-balance/live-balance-screen.tsx` | Auditada |

### Componentes compartilhados
| Componente | Arquivo(s) | Status |
|---|---|---|
| Sidebar | `src/components/panel/sidebar/sidebar-menu.tsx` | Auditada |
| System Accordion | `src/components/ui/system-accordion.tsx` | Auditada |
| Headers | `src/components/panel/header/*`, `src/components/admin/merchant-actions-dropdown.tsx` | Auditada |

## 2. Tabela de gaps
| path | componente | regra violada | severidade | evidência |
|---|---|---|---|---|
| `src/app/panel/(main)/merchant/payment-links/new/use-create-payment-link-form.ts:117-150,241` | Payment link form hook | R11-PIX-ONLY-GATEWAY / R8-NO-MOCK-DATA | Alta | Referencia `PaymentMethod.Boleto`, `PaymentMethod.CreditCard`, `boletoDueDate` inexistente no schema PIX-only |
| `src/app/panel/(main)/merchant/payment-links/new/create-payment-link-form-content.tsx:160` | Payment link form content | R11-PIX-ONLY-GATEWAY | Alta | Renderiza campos/condições de boleto/cartão |
| `src/app/panel/(main)/merchant/payment-links/new/page.tsx:69` | Payment link page | R11-PIX-ONLY-GATEWAY | Alta | Objeto literal inclui `boletoDueDate` |
| `src/app/panel/(main)/merchant/payment-links/new/constants.ts:24-31` | Payment link hints | R11-PIX-ONLY-GATEWAY | Alta | `PAYMENT_METHOD_HINTS` mapeia Boleto/CreditCard |
| `src/app/panel/(main)/merchant/payment-links/modals/payment-link-details-modal.tsx:195` | Details modal | R11-PIX-ONLY-GATEWAY | Alta | Labels “Vencimento do boleto” / “Instruções do boleto” |
| `src/app/panel/(main)/merchant/payment-links/[id]/edit/page.tsx` | Edit page | R11-PIX-ONLY-GATEWAY | Alta | Herança de campos non-PIX |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/schemas/checkout-upsert-form-schema.ts` | Checkout schema | R11-PIX-ONLY-GATEWAY | Alta | Schema aceita `boletoEnabled`, `creditCardEnabled` |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/tabs/payments-tab.tsx` | Payments tab | R11-PIX-ONLY-GATEWAY | Alta | UI/tabs referencia métodos non-PIX |
| `src/app/panel/(main)/merchant/payment-links/new/create-payment-link-form-schema.ts` | Link schema | R11-PIX-ONLY-GATEWAY | Alta | Schema não alinhado ao gate PIX-only |
| `src/app/panel/(main)/admin/platform-settings/components/boleto-accordion.tsx` *(deletado)* | Platform settings | R11-PIX-ONLY-GATEWAY | Alta | Arquivo removido; validar se sobrou referência |
| `src/app/panel/(main)/admin/platform-settings/components/credit-card-accordion.tsx` *(deletado)* | Platform settings | R11-PIX-ONLY-GATEWAY | Alta | Arquivo removido; validar se sobrou referência |
| `src/app/panel/(main)/admin/acquirers/[id]/tabs/config-tab.tsx` | Acquirer config | R11-PIX-ONLY-GATEWAY | Média | Validar se ainda há campos/métodos non-PIX |
| `src/app/panel/(main)/admin/acquirers/[id]/tabs/general-tab.tsx` | Acquirer general | R11-PIX-ONLY-GATEWAY | Média | Validar documentação/copy non-PIX |
| `src/app/panel/(main)/admin/merchants/[id]/tabs/settings-tab.tsx` | Merchant settings | R11-PIX-ONLY-GATEWAY | Média | Validar campos/documentação |
| `src/app/panel/(main)/merchant/new/constants/merchant-onboarding.constants.ts:72-113` | Onboarding constants | R11-PIX-ONLY-GATEWAY | Média | Usa `PaymentMethod.CreditCard`/`Boleto` |
| `src/app/panel/(main)/merchant/new/validations/merchant-onboarding.validation.ts:120-122` | Onboarding validation | R11-PIX-ONLY-GATEWAY | Média | `shouldShowCreditCardWarning` |
| `src/app/panel/(main)/merchant/payments/credit-card/page.tsx` | Credit card page | R11-PIX-ONLY-GATEWAY | Alta | Página/roteamento residual |
| `src/components/admin/merchant-actions-dropdown.tsx` | Dropdown admin | R4-HAIRLINE-ONLY | Média | `shadow-2xl` e superfícies hardcoded |
| `src/components/panel/header/admin-revenue-card.tsx:65` | Revenue popover | R4-HAIRLINE-ONLY | Média | `shadow-2xl` |
| `src/components/panel/header/merchant-balance-card.tsx:60` | Balance popover | R4-HAIRLINE-ONLY | Média | `shadow-2xl` |
| `src/app/panel/(main)/admin/balances/adjustment-history-modal.tsx:155` | Modal | R1-SURFACE-HIERARCHY | Média | Cor/superfície hardcoded fora de tokens |
| `src/app/panel/(main)/admin/dashboard/admin-dashboard.tsx:141` | Admin dashboard | R1/R2 | Média | Cores/typography potencialmente fora de tokens |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/components/checkout-onboarding.tsx:195` | Onboarding | R1/R2 | Média | Cores/typography hardcoded |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/hooks/use-checkout-onboarding.tsx:257` | Onboarding hook | R1/R2 | Média | Cores/typography hardcoded |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/tabs/payments-tab.tsx:43` | Payments tab | R1/R2 | Média | Cores/typography hardcoded |
| `src/app/panel/(main)/merchant/coupons/upsert/[couponId]/components/upsert-form.tsx:655` | Coupon form | R1/R2 | Média | Cores/typography hardcoded |
| `src/app/panel/(main)/merchant/dashboard/components/RevolutAnalyticsChart.tsx:119` | Analytics chart | R1/R2 | Média | Cores/typography hardcoded |
| `src/app/panel/(immersive)/merchant/live-balance/live-balance-settings-modal.tsx:364` | Live balance modal | R1/R2 | Média | Cores/typography hardcoded |
| `src/components/panel/mobile-merchant-dashboard.tsx:103` | Mobile dashboard | R1/R2 | Média | Tipografia/superfície hardcoded |
| `src/components/landing/landing-page.tsx` | Landing page | R1/R3 | Média | Tokens legados/gradientes/pills não padronizados |
| `src/components/panel/sidebar/sidebar-menu.tsx` | Sidebar | R2/R3 | Média | Tipografia/estados ativos não-tabular |
| `src/components/ui/system-accordion.tsx:35-41,47-50` | SystemAccordion | R1/R4 | Média | Paleta hardcoded via map; sem tokens unificados |
| `src/app/globals.css` | Tokens globais | R1/R10 | Baixa | Tokens ok, mas classes `.mockup-*` ainda vivas |
| `src/components/panel/sidebar/sidebar-effects.css` *(deletado)* | Sidebar effects | R4 | Baixa | Arquivo removido; validar import/resíduo |
| `src/app/panel/(main)/merchant/new/forms/merchant-onboarding-form.tsx` | Onboarding form | R11 | Média | Fluxo ainda cita métodos non-PIX |
| `src/app/panel/(main)/merchant/new/forms/steps/compliance-step.tsx` | Compliance step | R11 | Média | Copy/documentação non-PIX |
| `src/app/panel/(main)/merchant/payment-links/[id]/edit/page.tsx` | Edit link | R11 | Alta | Herança de campos boleto/cartão |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/schemas/checkout-upsert-form-schema.ts` | Checkout schema | R11 | Alta | Campos boleto/cartão ainda presentes |
| `src/app/panel/(main)/merchant/checkouts/upsert/[checkoutId]/tabs/payments-tab.tsx` | Payments tab | R11 | Alta | UI referencia métodos non-PIX |

## 3. Checklist de aderência por categoria
### Tipografia
- [x] Fonte base documentada: Geist/Inter/system-ui
- [ ] `font-mono tabular-nums` aplicado consistentemente em valores financeiros: **PARCIAL**
- [ ] Tamanhos documentados e usados sem valores ad hoc: **NÃO**
- [x] Texto primário atende contraste alto
- [ ] Texto secundário/faint validado em todos os breakpoints: **unverified — confirm first**

### Espaçamento
- [x] Escala base 4px observada em vários componentes
- [ ] Consistência entre `p-*`, `gap-*` e valores inline: **PARCIAL**
- [x] `--radius` definido em tokens
- [ ] `rounded-full` vs `rounded-3xl`/`rounded-2xl` padronizado: **PARCIAL**

### Cores
- [x] Tokens dark definidos em `globals.css`
- [ ] Hardcoded `#16181a`, `#0a0a0a`, `#494fdf`, `#4f55f1`, `#00a87e`, `#e23b4a`, `#ec7e00` removidos: **NÃO**
- [ ] Sem gradientes decorativos além do necessário: **PARCIAL**
- [x] Accent colors alinhadas ao design system

### Estados
- [x] Hover/focus/active/disabled documentados
- [ ] Focus-visible ring consistente em toda superfície: **PARCIAL**
- [x] Transições <= 200ms na maior parte dos componentes
- [x] Skeleton/loading documentado

### Acessibilidade
- [x] `focus-visible` mencionado no design system
- [ ] Implementação consistente em botões/inputs: **PARCIAL**
- [ ] Contraste exato validado em todos os textos: **unverified — confirm first**
- [x] Sem confetes; sucesso via badge/toast

### Breakpoints
- [x] Classes responsivas presentes
- [ ] Dados reais de viewport analisados: **unverified — confirm first**

## 4. Ações corretivas priorizadas
### Alta prioridade
1. **Completer o gate PIX-only no frontend e backend**
   - Remover `PaymentMethod.Boleto`, `PaymentMethod.CreditCard` e campos associados dos fluxos:
     - `payment-links/new/**`
     - `payment-links/[id]/edit/**`
     - `checkouts/upsert/**`
     - `merchant/new/**` onboarding/validations
     - `platform-settings/**` accordions/helpers/types
   - Remover página `merchant/payments/credit-card`
   - Atualizar `routes.ts` e qualquer router/config residual
   - Alinhar schema Zod/servidor para não aceitar métodos non-PIX

### Média prioridade
2. **Tokenizar cores hardcoded**
   - Substituir `#16181a`, `#0a0a0a`, `#494fdf`, `#4f55f1`, `#00a87e`, `#e23b4a`, `#ec7e00` por tokens CSS existentes
   - Foco inicial: `admin-dashboard.tsx`, `merchant-dashboard/**`, popovers de header, `system-accordion.tsx`, landing

3. **Remover sombras decorativas**
   - Eliminar `shadow-2xl`/`shadow-lg`/`shadow-md` em favor de `border` e elevação por `bg-*` conforme R4

4. **Padronizar pills/botões/radius**
   - Unificar padrão de pill para ações primárias e secundárias
   - Consistência de `rounded-full` vs `rounded-2xl`/`rounded-3xl`

5. **Corrigir header/sidebar inconsistency**
   - Unificar padrão visual entre admin e merchant
   - Padronizar `system-accordion.tsx` para usar tokens ao invés de map hardcoded

### Baixa prioridade
6. **Remover resíduos de classes/estilos legados**
   - `mockup-*` em `globals.css` e componentes
   - `sidebar-effects.css` se confirmado não utilizado

7. **Acessibilidade**
   - Garantir `focus-visible` ring consistente
   - Validar contraste em `text-white/40` e `text-white/50`

8. **Verificação final**
   - Typecheck limpo
   - Smokes das rotas afetadas
   - Atualizar `DESIGN.md`/docs se novas regras forem criadas

## 5. Observações
- Esta auditoria não alterou comportamento funcional.
- O único arquivo tocado foi `landing-cta.tsx`, mas a edição foi revertida para manter o estado original do código durante a auditoria.
- O próximo passo seguro é iniciar pela **alta prioridade #1** (PIX-only gate completo) porque ela desbloqueia as demais padronizações sem introduzir dados inválidos.
