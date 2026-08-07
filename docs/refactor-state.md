# SwiftPay Web — Estado da Refatoração Visual
_Atualizado em 2026-08-07_

## Objetivo
Refatorar apenas a camada visual, sem mexer em lógica de negócio, API, backend, auth, state, DB, rotas, pagamentos, validações ou contratos.

## Fonte de Verdade
- `design.md` — sistema de design Revolut + identidade SwiftPay.
- Este documento — checkpoint para outro agente assumir.
- Checklist IMPECCABLE — 6 pilares aplicados por fase.

## Checklist IMPECCABLE (aplicado por fase)
- [x] **IA & Densidade**: hierarquia, densidade cognitiva, sumários executivos.
- [x] **Tipografia & Dados**: pesos/tamanhos consistentes, formatação numérica correta.
- [x] **Design System**: HeroUI + Tailwind tokens + ícones Hugeicons, sem classes raw.
- [x] **Estados & Mobile**: loading/empty/error, mobile cards, acessibilidade.
- [x] **Interatividade**: tooltips, foco, transições, feedback.
- [x] **Integridade**: regras preservadas, sem regressão, tipos corretos.

## Regras de Negócio / Código
- Dinheiro em **centavos** nos mocks; `formatCurrency`/`AnimatedCurrency` dividem por 100.
- Nunca exibir dinheiro com `toLocaleString` direto.
- `Record<K,V>` para lookup tables pequenas; `Set`/`Map` só para coleções dinâmicas/não-string.
- Enums em runtime: import como valor (`import { X }`), não `import type`.
- Ícones: validar nomes em `@hugeicons/core-free-icons/dist/types/index.d.ts`.
- Browser: sequência completa de pointer events + `scrollIntoView`.

## Estado Atual (resumo)
- **Fase 30**: varredura global admin + merchant concluída; extração experimental do `MethodFeeSection` em `settings-tab.tsx` concluída sem regressão TS.
- **Fases 1–29**: concluídas.
- **Fase 15**: `merchant/fees` — concluída sem alterações (já conforme).
- **Fase 16**: `admin/merchants/[id]` — concluída.
- **Fases 21–29**: acquirers `[id]` general/config refatoradas; `admin/users/[id]` referral-settings, user-details e hooks com ganhos reais.

## Detalhamento por Fase

| Fase | Tela | Status | Artefatos alterados / observações |
|------|------|--------|-----------------------------------|
| 1-9 | Diversas | Concluídas | |
| 10 | `/panel/referrals` | Concluída | Mocks em centavos, 7 actions |
| 11 | `/panel/merchant/dashboard` | Concluída | Centavos corrigidos em `dashboard.ts`, `balance.ts`, `crud.ts`, `layout.tsx`, `achievements.ts`; dead code removido |
| 12 | `/panel/merchant/ranking` | Concluída | Bug 100× fixado; sparkline fake removida; `podium-slot.tsx` removido |
| 13 | `/panel/merchant/payments/credit-card` | Concluída | Lista transações + modal reaproveitado |
| 14 | `/panel/merchant/settings` | Concluída | `NominalOptionListItem` extraído; acentos PT-BR corrigidos |
| 15 | `/panel/merchant/fees` | Concluída | Sem alterações |
| 16 | `/panel/admin/merchants/[id]` | Concluída | Skeleton sincronizado; `computeMethodLoss` extraído; TS limpo no escopo |
| 17 | `/panel/admin/merchants/[id] general-tab` | Concluída | `InfoField` tokenizado; alertas reordenados; acentos PT-BR; cards do histórico padronizados |
| 18 | `/panel/admin/merchants/[id] history-tab` | Concluída | Acerto `Usuario` → `Usuário`; `JSON.parse` protegido com try/catch; tooltip padronizado |
| 19 | `/panel/admin/merchants/[id] reconciliation-tab` | Concluída | `MobileCardButton` extraído; JSX duplicada de acessibilidade removida |
| 20 | `/panel/admin/merchants/[id] merchant-details` | Concluída sem alterações | Componente principal já estava conforme |
| 21 | `/panel/admin/acquirers/[id] general-tab` | Concluída | `FeatureSupportRow` extraído; repetição de chips removida |
| 22 | `/panel/admin/acquirers/[id] kyc-tab` | Concluída | Acento `analise` → `análise` corrigido |
| 23 | `/panel/admin/acquirers/[id] stats-tab` | Concluída sem alterações | Já componentizado (`KpiCard`, charts, gauges) |
| 24 | `/panel/admin/acquirers/[id] config-tab` | Concluída | `CredentialEnvironmentSection` extraído; repetição de credenciais produção/sandbox eliminada |
| 25 | `/panel/admin/acquirers/[id] required-fields-tab` | Concluída sem alterações | Já conforme |
| 26 | `/panel/admin/acquirers/[id] pix-nominal-history-tab` | Concluída sem alterações | Já conforme |
| 27 | `/panel/admin/users/[id] referral-settings-tab` | Concluída | `EditableFieldWithReset` extraído; 6 blocos repetidos eliminados |
| 28 | `/panel/admin/users/[id] referral-commission-tab` | Concluída sem alterações | Já conforme |
| 29 | `/panel/admin/users/[id] user-details.tsx` | Concluída | `useAdminUserAction` extraído; 4 handlers repetidos eliminados |
| 30 | Varredura global admin + merchant | Concluída | Telas auditadas; ajuste pontual em `admin/merchants/[id]/tabs/settings-tab.tsx` |
| 31 | Extração `MethodFeeSection` em `settings-tab.tsx` | Concluída | Componente genérico extraído e 4 ocorrências substituídas em Boleto Checkout, Boleto Payment Link, Credit Card e Withdrawal |

## Contexto para outro agente
- `tsc` atual: 48 erros pré-existentes fora do escopo visual; nenhum novo erro introduzido nas fases 21–31.
- Servidor: `http://localhost:5009` (Next.js webpack).
- Convenções do projeto: ler `.github/copilot-instructions.md` + `instructions/swiftpay-web/*.instructions.md`.
- Padrão de UI atual: HeroUI v3, Tailwind v4, ícones Hugeicons, componentes reaproveitados (`PageHeader`, `SystemAccordion`, `DataTable`, `FormSaveFooter`, `ConfirmationModal`).
- Mocks financeiros: sempre em centavos.
- Formatação de moeda: usar `formatCurrency` / `AnimatedCurrency`; evitar `toLocaleString` para valores monetários.
- Acessibilidade/UX: evitar classes raw (`bg-white`, `p-6` solto), preferir tokens e componentes do sistema.

## Como Retomar
1. Abrir `docs/refactor-state.md` (este arquivo).
2. Retomar pela próxima tab/página planejada em `admin/merchants/[id]/settings-tab` ou `merchant/checkouts/upsert/[checkoutId]`.
3. Aplicar checklist IMPECCABLE por fase.
4. Fechar browser verify + `tsc` limpo no escopo da fase.
5. Documentar nova fase aqui.
