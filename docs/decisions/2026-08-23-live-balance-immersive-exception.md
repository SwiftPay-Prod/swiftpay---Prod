# ADR: Exceção imersiva live-balance (R6/R1)

- **Data:** 2026-08-23
- **Status:** Aceita
- **Contexto:** Auditoria Revolut 10/Ultra (addendum exaustivo 2026-08-23 + V2) e fechamento do Shard E.

## Decisão

As superfícies de `src/app/panel/(immersive)/merchant/live-balance/` — especificamente as 19 backgrounds com `linear-gradient`/`radial-gradient` em `live-balance/backgrounds/*` — e os presets `PRESET_COLORS` de `visual-tab.tsx` são **exceção deliberada** às regras R6 (sem gradientes decorativos) e R1 (hex canônico → token).

Justificativa:

1. O live-balance é uma **superfície teatral imersiva**: o objetivo do produto é impacto visual em tela compartilhada/projetada, não densidade informacional.
2. Os presets `PRESET_COLORS` são escolhas de marca do lojista para o checkout dele (item P2-12 da auditoria) — cor de terceiro, fora do tema runtime do painel.
3. As sombras R4 (`shadow-xl|2xl|lg|md`) dessas superfícies foram removidas nas fases P1; os `shadow-[...]` arbitrários das animações (moedas, notas, confete) permanecem como parte coreográfica das animações, cobertos por esta exceção.

## Diretriz

- Limitar as variantes de background a **2–3 opções ativas**, controladas via `LiveBalanceSettings`.
- Novos backgrounds só entram substituindo um existente; o catálogo não cresce ilimitadamente.
- Componentes funcionais do live-balance (pills, botões, notificações) seguem as regras normais: tokens semânticos, sem sombra R4, sem hex cru. A exceção cobre apenas decoração teatral.

## Consequências

- `grep -rEn "shadow-(xl|2xl|lg|md)" src --include="*.tsx"` mantém hits somente em `live-balance/backgrounds/*`, `live-balance-effects.tsx` (animações) e `opengraph-image.tsx`.
- Hex canônicos crus permanecem apenas onde a auditoria registrou exceção (`opengraph-image.tsx`, `PRESET_COLORS`).
