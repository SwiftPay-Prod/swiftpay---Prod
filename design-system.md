# SwiftPay Design System

> Dark mode first. High contrast. Data dense. No decorative noise.
> Reference quality: Stripe, Linear, Vercel, Mercury, Revolut, Arc Browser, Raycast.

---

## Princípios

1. **Contraste antes de cor** — legibilidade é inegociável. Todo texto principal passa WCAG AAA (7:1). Texto secundário passa AA (4.5:1).
2. **Estrutura, não decoração** — bordas e espaçamento comunicam hierarquia, não `shadow-md` nem glassmorphism.
3. **Uma cor de marca, usada com precisão** — lime-green (`#a3e635`) aparece em ações primárias, indicadores ativos e dados positivos. Em nenhum lugar mais.
4. **Densidade informacional** — cada pixel justifica presença. Sem cards grandes e vazios.
5. **Motion propositivo** — transições existem para orientar, não entreter. Duração máxima: 200ms.

---

## Tokens de Cor

### Paleta Base (Dark Mode — padrão)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `oklch(0.11 0.008 240)` | Fundo raiz da aplicação |
| `--foreground` | `oklch(0.97 0.004 240)` | Texto primário |
| `--card` | `oklch(0.145 0.010 240)` | Superfície de card/painel |
| `--card-foreground` | `oklch(0.97 0.004 240)` | Texto dentro de cards |
| `--popover` | `oklch(0.175 0.012 240)` | Dropdowns, tooltips, popovers |
| `--popover-foreground` | `oklch(0.97 0.004 240)` | Texto em popovers |
| `--border` | `oklch(0.22 0.012 240)` | Bordas de cards, inputs, divisores |
| `--input` | `oklch(0.175 0.012 240)` | Background de campos de input |
| `--ring` | `oklch(0.83 0.22 115)` | Focus ring (lime-green) |
| `--muted` | `oklch(0.18 0.010 240)` | Superfícies secundárias/muted |
| `--muted-foreground` | `oklch(0.62 0.010 240)` | Texto secundário (labels, captions) |

### Cor de Marca

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `oklch(0.83 0.22 115)` | Lime-green — CTAs, estados ativos |
| `--primary-foreground` | `oklch(0.11 0.008 240)` | Texto sobre fundo primary |
| `--brand` | `#a3e635` (hex) | Referência rápida para CSS manual |
| `--brand-soft` | `color-mix(in srgb, #a3e635 10%, transparent)` | Backgrounds suaves com brand |

### Semântica

| Token | Valor dark | Uso |
|---|---|---|
| `--success` | `oklch(0.83 0.22 115)` | Mesma cor da brand — pagamento ok |
| `--success-foreground` | `oklch(0.11 0.008 240)` | |
| `--destructive` | `oklch(0.65 0.22 27)` | Erros, cancelamentos, chargeback |
| `--destructive-foreground` | `oklch(0.97 0.004 240)` | |
| `--warning` | `oklch(0.78 0.17 65)` | Alertas, pendências |
| `--warning-foreground` | `oklch(0.11 0.008 240)` | |

### Sidebar

| Token | Valor dark | Uso |
|---|---|---|
| `--sidebar` | `oklch(0.095 0.007 240)` | Fundo da sidebar (mais escuro que background) |
| `--sidebar-foreground` | `oklch(0.92 0.005 240)` | Texto na sidebar |
| `--sidebar-primary` | `oklch(0.83 0.22 115)` | Item ativo na sidebar |
| `--sidebar-primary-foreground` | `oklch(0.11 0.008 240)` | |
| `--sidebar-accent` | `oklch(0.155 0.010 240)` | Hover de item na sidebar |
| `--sidebar-accent-foreground` | `oklch(0.83 0.22 115)` | Texto do item ativo |
| `--sidebar-border` | `oklch(0.175 0.010 240)` | Divisor da sidebar |

### Charts (escala monocromática da brand)

| Token | Valor |
|---|---|
| `--chart-1` | `oklch(0.83 0.22 115)` |
| `--chart-2` | `oklch(0.72 0.19 115)` |
| `--chart-3` | `oklch(0.60 0.16 115)` |
| `--chart-4` | `oklch(0.48 0.13 115)` |
| `--chart-5` | `oklch(0.38 0.10 115)` |

### Light Mode (inversão fiel)

| Token | Valor |
|---|---|
| `--background` | `oklch(0.98 0.003 240)` |
| `--foreground` | `oklch(0.12 0.010 240)` |
| `--card` | `oklch(1 0 0)` |
| `--border` | `oklch(0.90 0.006 240)` |
| `--primary` | `oklch(0.48 0.18 115)` |
| `--primary-foreground` | `oklch(1 0 0)` |
| `--muted-foreground` | `oklch(0.50 0.010 240)` |

---

## Tipografia

### Famílias

| Papel | Família | Weights usados |
|---|---|---|
| Interface / corpo | **Geist** (self-hosted) | 400, 500, 600 |
| Dados / monospace | **Geist Mono** (self-hosted) | 400, 500, 600 |

**Regra:** nunca mais de duas famílias. Sem fonte de display decorativa.

### Escala de Texto

| Classe | `font-size` | `line-height` | `letter-spacing` | Uso |
|---|---|---|---|---|
| `text-xs` | 11px | 16px | +0.02em | Labels, captions, badges |
| `text-sm` | 13px | 20px | 0 | Corpo padrão, células de tabela |
| `text-base` | 15px | 24px | -0.01em | Subtítulos, valores em destaque |
| `text-lg` | 17px | 28px | -0.02em | Títulos de seção |
| `text-xl` | 20px | 28px | -0.03em | Títulos de página |
| `text-2xl` | 24px | 32px | -0.04em | KPIs, valores monetários grandes |
| `text-3xl` | 30px | 36px | -0.05em | Hero headings |
| `text-4xl+` | 40px+ | 1.1 | -0.06em | Apenas landing page |

### Regras Tipográficas

- **Dados monetários** sempre em Geist Mono com `tabular-nums`
- **Labels de campo** em `text-xs` + `font-medium` + `tracking-wide` + uppercase
- **Headings de seção** em `text-sm` + `font-semibold` + uppercase + `letter-spacing: 0.08em`
- **Corpo** em `text-sm` com `leading-relaxed`
- **Nunca** bold + gradient em texto corrido

---

## Escala de Espaçamento

Baseada em múltiplos de 4px (Tailwind padrão).

| Escala | px | Uso |
|---|---|---|
| `1` | 4px | Gap mínimo entre ícone e label |
| `2` | 8px | Padding interno de badge, gap de linha |
| `3` | 12px | Padding de botão compacto |
| `4` | 16px | Padding de item de lista, gap padrão |
| `5` | 20px | Gap entre seções internas de card |
| `6` | 24px | Padding interno de card |
| `8` | 32px | Espaço entre cards num grid |
| `10` | 40px | Padding de header, espaço de seção |
| `12` | 48px | Margem entre grupos de conteúdo |
| `16` | 64px | Espaço de seção em página |

---

## Radius

Estratégia: **raio pequeno e consistente** — transmite precisão técnica, não produto de consumo.

| Token | Valor | Uso |
|---|---|---|
| `--radius` (base) | `0.375rem` (6px) | Padrão do sistema |
| `--radius-sm` | `0.25rem` (4px) | Badges, tags inline |
| `--radius-md` | `0.375rem` (6px) | Inputs, selects, botões |
| `--radius-lg` | `0.5rem` (8px) | Cards, painéis |
| `--radius-xl` | `0.75rem` (12px) | Modais, popovers |
| `--radius-2xl` | `1rem` (16px) | Sheets, drawers |

**Proibido:** `rounded-full` em cards ou containers. Apenas em avatares e indicadores de status.

---

## Elevação

Sem `box-shadow` decorativo. Hierarquia comunicada por `border` + `background` distintos.

| Nível | Background | Border | Uso |
|---|---|---|---|
| 0 — Fundo | `--background` | nenhuma | Página raiz |
| 1 — Superfície | `--card` | `1px solid --border` | Cards, tabelas, painéis |
| 2 — Sobreposição | `--popover` | `1px solid --border` | Dropdowns, tooltips |
| 3 — Modal | `--popover` | `1px solid var(--border)` + `inset 0 0 0 1px oklch(1 0 0 / 0.04)` | Modais, dialogs |

**Regra:** sombra existe apenas para contexto de modal/overlay — `0 8px 32px oklch(0 0 0 / 0.4)`. Em nenhum outro lugar.

---

## Componentes

### Button

```
default:   bg-primary text-primary-foreground
           hover: bg-primary/85
           active: scale(0.99)
           focus: ring-2 ring-ring/40

outline:   border-border bg-transparent text-foreground
           hover: bg-muted

ghost:     bg-transparent text-muted-foreground
           hover: bg-muted text-foreground

destructive: bg-destructive/12 text-destructive border-destructive/20
           hover: bg-destructive/20
```

Radius: `--radius-md` (6px)
Height: `h-8` (sm), `h-9` (default), `h-10` (lg)
Font: `text-sm font-medium`

### Card

```
background: var(--card)
border: 1px solid var(--border)
border-radius: var(--radius-lg)  /* 8px */
padding: 20px 24px
```

**Sem** `shadow-md`. **Sem** `ring-1 ring-foreground/5`. A borda já é suficiente.

Hover state (interativo): `border-color` transiciona para `oklch(0.83 0.22 115 / 0.35)`.

### Input / Field

```
background: var(--input)
border: 1px solid var(--border)
border-radius: var(--radius-md)
height: h-9
font-size: text-sm
color: var(--foreground)
placeholder: var(--muted-foreground)

focus: border-ring, ring-2 ring-ring/20
error: border-destructive, ring-2 ring-destructive/20
```

### Badge

```
default:     bg-primary/15 text-primary border border-primary/20
success:     bg-success/12 text-success border border-success/20
destructive: bg-destructive/12 text-destructive border border-destructive/20
warning:     bg-warning/12 text-warning border border-warning/20
outline:     border-border text-foreground
muted:       bg-muted text-muted-foreground border-transparent
```

Font: `text-xs font-medium`
Radius: `--radius-sm` (4px)
Height: `h-5`

### Table

```
header row: bg-transparent, border-b border-border
            text: text-xs font-semibold uppercase tracking-wide text-muted-foreground

body row:   border-b border-border/50
            hover: bg-muted/40
            
cell:       text-sm text-foreground
            dados monetários: font-mono tabular-nums
```

### KPI Card (Dashboard)

```
background: var(--card)
border: 1px solid var(--border)
border-radius: var(--radius-lg)
padding: 20px 24px

label:  text-xs font-semibold uppercase tracking-widest text-muted-foreground
value:  text-2xl font-semibold font-mono tabular-nums text-foreground
        letter-spacing: -0.04em
delta:  text-xs text-success (positivo) | text-destructive (negativo)
```

**Sem** barra colorida no topo. **Sem** ícone decorativo grande. Se tem ícone, é 14px ao lado do label.

### Sidebar Item

```
default: text-sm font-medium text-muted-foreground
         padding: 6px 10px
         border-radius: var(--radius-md)
         gap: 8px (ícone + label)

hover:   bg-sidebar-accent text-sidebar-foreground
         transition: 120ms ease

active:  bg-sidebar-accent text-sidebar-primary font-semibold
         borda lateral NÃO usada (sem left-border accent)
```

---

## Estados de Interação

| Estado | Regra |
|---|---|
| Hover | `background` levemente mais claro, `150ms ease` |
| Focus-visible | `ring-2 ring-ring/40 outline-none` |
| Active/pressed | `scale(0.99)` + `150ms` |
| Disabled | `opacity-50 pointer-events-none` |
| Loading | Skeleton com `animate-pulse` em `--muted` |
| Error | `border-destructive ring-destructive/20` |
| Success | Sem confetes. Badge `success` ou toast. |

---

## Motion

**Princípio:** o usuário nunca deve esperar por animação.

| Tipo | Duração | Easing | Uso |
|---|---|---|---|
| Micro (hover, focus) | 120ms | `ease` | Cores, bordas |
| Entrada de elemento | 160ms | `ease-out` | Fade + slide 4px |
| Saída de elemento | 120ms | `ease-in` | Fade + slide inverso |
| Modal open | 180ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Scale 0.97 → 1 |
| Toast | 200ms | `ease-out` | Slide from bottom |
| Skeleton | 1.5s | `ease-in-out` infinite | Pulse |

**Proibido:** `transition-all`, duração > 300ms em interações, animações de loop em UI de dados.

---

## Acessibilidade

- Todos os textos principais: contraste ≥ 7:1 (WCAG AAA)
- Textos secundários (`muted-foreground`): contraste ≥ 4.5:1 (WCAG AA)
- Focus ring visível em todos os elementos interativos: `ring-2 ring-ring/40`
- Nunca transmitir estado somente por cor — sempre acompanhar com ícone ou texto
- Inputs sempre com `<label>` associado via `htmlFor` ou `aria-label`
- Tabelas com `<th scope="col">` e cabeçalhos descritivos
- Skeleton loaders com `aria-busy="true"` no container
- Erros de formulário com `aria-describedby` apontando para a mensagem
- Modais com `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Tecla Escape fecha modais e dropdowns

---

## Ícones

- Biblioteca: **Lucide** ou **HugeIcons** (já instalada) — tamanhos 14, 16, 20px
- **Nunca** use emoji como ícone funcional
- Ícones decorativos: `aria-hidden="true"`
- Ícones funcionais isolados (botões icon-only): `aria-label` obrigatório
- Stroke width: 1.5px (padrão Lucide) — não ajustar por estética
- Cor: herda `currentColor` — nunca cor hardcoded
- Tamanhos padrão:
  - `size-3` (12px): inline em badges
  - `size-4` (16px): botões, inputs, listas
  - `size-5` (20px): headers de card, items de nav
  - `size-6` (24px): apenas em contextos de destaque

---

## Layout

### Grid do Painel

```
sidebar: 220px fixo (largura única)
main: flex-1 com overflow-y-auto
header: 52px fixo no topo
conteúdo: max-w-7xl mx-auto px-6 py-6
```

### Grids de KPI

```
4 colunas: grid-cols-4 gap-4 (desktop)
           grid-cols-2 gap-3 (tablet)
           grid-cols-1 gap-3 (mobile)
```

### Grids de Charts

```
2 colunas: grid-cols-2 gap-4 (desktop)
           grid-cols-1 gap-4 (mobile)
```

### Tabelas

- `overflow-x-auto` no container para mobile
- Colunas monetárias: `text-right font-mono`
- Colunas de status: largura fixa `w-24`
- Colunas de ação: `w-10` + sticky right opcional

---

## Regras de Dark Mode

1. `--background` é o nível mais escuro — nunca colocar `--card` como fundo de página
2. Sidebar é mais escura que o background (cria separação sem borda visível na junção)
3. Popovers e dropdowns são mais claros que cards — hierarquia clara
4. Nunca usar `white/5` ou `white/10` direto — sempre usar tokens semânticos
5. Imagens e assets devem ter variante dark quando necessário (logo, ilustrações)
6. Ícones NÃO recebem cor branca hardcoded — usam `text-foreground` ou `currentColor`

---

*Versão 1.0 — SwiftPay Design System — 2026*
