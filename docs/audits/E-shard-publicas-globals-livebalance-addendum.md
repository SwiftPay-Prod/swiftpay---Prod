# Shard E — Públicas, globals.css e live-balance (Addendum de fechamento)

- **Data:** 2026-08-23
- **Ref:** `revolut-10-ultra-full-audit-v2-871-871.md` (Shard E), addendum exaustivo 2026-08-23
- **Status:** Fechado. Selo pós-purge: **860/860** (ver `certified-files.txt`; os 15 arquivos boleto foram removidos no purge P0 — commits `26172e2`, `4c5886c`).

## Gaps do shard E — resolução item a item

### Públicas

| Gap | Arquivo | Status |
|---|---|---|
| `shadow-xl` no card de erro | `src/app/error.tsx:18` | RESOLVIDO (Fase 2) |
| Hex cru `bg-[#121721]`, `border-[#1E2638]`, `bg-[#0B0E14]` | `src/app/error.tsx:17-18` | RESOLVIDO (Fase 2 → `bg-background`, `bg-card`, `border-white/12`) |
| Sombras em cards/botões da landing | `landing-hero.tsx:53`, `landing-cta.tsx:16,37`, `landing-developer.tsx:130`, `landing-page.tsx:118`, `landing-pricing.tsx:51,129`, `landing-security.tsx:17`, `auth-modal.tsx:33` | RESOLVIDO (Fase 2) |
| Hex `via-[#494fdf]` no CTA | `landing-cta.tsx:18` | RESOLVIDO (Fase 3 → `via-brand`) |
| Fundo translúcido do card | `src/app/confirm-email/confirm-email-content.tsx:47` | RESOLVIDO (Fase 4 → `bg-card`) |

### globals.css

| Gap | Status |
|---|---|
| Tokens `--brand`/`--brand-soft` definidos (`#494fdf`) e mapeados em `@theme` como `--color-brand` | CONFIRMADO — migração dos consumidores concluída (Fase 3); nenhum valor novo inventado |

### live-balance

| Gap | Arquivo | Status |
|---|---|---|
| `shadow-2xl` / `shadow-lg` nos pills | `live-balance-screen.tsx:334,339` | RESOLVIDO (Fase 2) |
| Hex cru `bg-[#00a87e]` | `live-balance-screen.tsx:335` | RESOLVIDO (Fase 3 → `bg-success`) |
| Sombras nas notificações overlay | `live-balance-notification-stack.tsx` (10 classes) | RESOLVIDO (Fase 2) |
| Sombras/gradientes teatrais das animações e backgrounds | `live-balance-effects.tsx`, `backgrounds/*` (19 arquivos) | EXCEÇÃO — ADR `docs/decisions/2026-08-23-live-balance-immersive-exception.md` |
| Hex de imagem OG gerada server-side | `opengraph-image.tsx` (5 hex) | EXCEÇÃO documentada — fora do tema runtime |

## Gates de fechamento

- `grep -rEn "shadow-(xl|2xl|lg|md)" src --include="*.tsx"` → apenas hits em `live-balance/backgrounds/*` + animações cobertas pelo ADR e `opengraph-image.tsx`.
- `grep -rEn "#(a78bfa|60a5fa|38bdf8|e2e8f0|cbd5e1)" src/components/ui/system-accordion.tsx` → 0 (entradas violet/blue/sky/mauve/slate removidas; consumers migrados para `"accent"` ou sem prop).
- `grep -rnE "bg-\[#16181a\]|bg-\[#0B0E14\]" src --include="*.tsx"` → 0.
- `grep -rn "aria-busy" src --include="*.tsx"` → 6 ocorrências (data-table, logs-table, wrappers).
