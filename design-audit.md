# SwiftPay — Design Audit Completo

**Data:** Agosto 2026  
**Auditor:** v0 (Principal Product Designer + Senior Frontend Engineer)  
**Escopo:** Todo o frontend — landing page, painel do merchant, painel admin, fluxos de auth

---

## 1. Sistema de Cores

### Pontos Fortes
- O sistema dark mode está bem definido: fundo `#0b0e14` (Obsidian Profundo), card `#121721`, borda `#2a2f3c`.
- A cor brand `#a3e635` (verde lima) é distintiva e tem contraste adequado sobre fundos escuros.
- Tokens semânticos bem nomeados: `--brand`, `--brand-soft`, `--accent`, `--surface`, etc.

### Inconsistências e Problemas
- **`--color-muted` aponta para `--muted-foreground`** em vez de `--muted`. Linha 27 do `globals.css`: `--color-muted: var(--muted-foreground)` — isso inverte a intenção semântica do token e pode causar backgrounds usando cor de texto.
- **`--scrollbar` e `--scrollbar-thumb` divergem**: variáveis `--scrollbar-thumb` e `--scrollbar-track` são usadas no CSS de scrollbar mas nunca definidas nos temas; só `--scrollbar` está definido. Resultado: scrollbar provavelmente transparente em vários navegadores.
- **Light mode sem `--default-50` a `--default-900`**: o dark mode tem a escala completa HeroUI, mas o light mode não. Componentes HeroUI que dependem dessa escala podem ter cores incorretas no tema claro.
- **`--secondary-soft` e `--secondary-soft-hover` diferem semanticamente entre temas**: no light usa `--secondary` como base, no dark usa `--accent`. Botões secondary provavelmente aparecem com cores diferentes entre os temas.
- **`--success` é a mesma cor que `--accent`** em ambos os temas. Não há diferenciação visual entre estado de sucesso e elemento de ênfase de marca.
- **`--danger` idêntico em ambos os temas** (`#ef4444`) — sem ajuste de luminosidade para dark mode, o vermelho pode perder contraste sobre fundos muito escuros.

---

## 2. Tipografia

### Pontos Fortes
- Uso consistente da fonte Geist (variable font), carregada via `@font-face` com `font-display: swap`.
- Geist Mono disponível para valores numéricos (KPIs, balances) — boa decisão de produto.
- `font-family` aplicada ao `body` via `var(--font-sans)`.

### Inconsistências
- **`html` recebe `@apply font-sans` no globals.css** mas o layout root já declara `className="... font-sans"` no `<html>`. Duplicação que pode gerar conflito de especificidade.
- **Tamanhos de fonte inconsistentes**: `.mockup-kpi-label` usa `0.6875rem` (11px), `.mockup-kpi-sec-label` usa `0.625rem` (10px), `.mockup-toolbar-label` usa `0.6875rem`. Há pelo menos 3 tamanhos de label de KPI diferentes em uso.
- **`font-size: 16px !important` em iOS** para inputs (correto para evitar zoom), mas isso afeta o visual de inputs menores que deveriam ter 14px — necessário remover o `!important` e resolver com `transform: scale()` em vez disso, ou aceitar o tamanho 16px globalmente em mobile.
- **Sem escala tipográfica documentada** — o projeto usa tamanhos ad hoc (11px, 12px, 13px, 14px, 16px, 18px, 24px, 28px) sem um sistema claro de `text-xs/sm/base/lg/xl`.

---

## 3. Espaçamento

### Inconsistências
- **Mistura de `gap`, `padding`, e `margin` sem padrão claro**: alguns componentes usam `p-6`, outros `padding: 24px` inline nas classes mockup. Duplicação do mesmo valor em dois sistemas.
- **Classes mockup (.mockup-kpi-card, etc.) no globals.css** — estilos de componentes específicos de dashboard vivem no CSS global em vez de serem co-localizados com os componentes. Isso torna difícil saber quais componentes usam essas classes.
- **`pb-24 md:pb-0`** no wrapper principal do painel: padding bottom grande para compensar navegação mobile — solução frágil que pode quebrar em viewports intermediárias (ex: tablets em landscape).

---

## 4. Grid e Layout

### Pontos Fortes
- Layout principal com `flex h-dvh` + sidebar fixa + área de conteúdo scrollável é correto.
- `overflow-y-auto overflow-x-hidden` no wrapper de conteúdo previne scroll horizontal indesejado.

### Inconsistências
- **`.mockup-kpi-grid` e `.mockup-kpi-grid-secondary` são idênticos** (ambos `repeat(4, 1fr)` com `gap: 16px`). Um é redundante.
- **`.mockup-chart-grid-3` é uma classe modificadora** que deve ser usada em conjunto com `.mockup-chart-grid`, porém isso não está documentado — padrão frágil que pode ser usado isoladamente.
- **Sem breakpoints responsivos nas classes mockup** — todos os grids mockup têm colunas fixas (4, 2, 3) sem responsividade. Em mobile ficam overflow ou comprimidos.

---

## 5. Hierarquia Visual e de Informação

### Problemas
- **Cards de KPI têm `::before` com gradiente de accent** que só aparece no hover. Essa animação é sutil ao ponto de ser imperceptível — e o gradiente desaparece assim que o mouse sai.
- **`.mockup-chart-title::before`** usa um marcador vertical de 4×12px com cor accent. Visualmente coerente, mas o posicionamento com `padding-left: 12px` + `position: absolute` pode colidir com o texto em títulos longos.
- **Headers de seção** (`dashboard-section-header`) precisam ser verificados — existe um componente dedicado para isso, o que é bom, mas sua consistência com o restante das páginas de admin precisa de revisão.
- **Páginas de admin e merchant têm estruturas de header diferentes**: admin usa `dashboard-refresh-controls` + `dashboard-section-header`; merchant provavelmente tem padrão diferente. Sem unificação.

---

## 6. Acessibilidade (WCAG AA)

### Problemas Críticos
- **`--field-placeholder: #64748b` no light mode**: o globals.css documenta contraste de 5.4:1, o que é adequado para WCAG AA (4.5:1 mínimo). OK.
- **`--muted-foreground: #475569` no light mode**: documentado como 7.0:1. OK.
- **`--secondary: #4b5563` no light mode sobre `--background: #fbfcf9`**: contraste ~7.1:1. OK.
- **`--secondary: #64748b` no dark mode sobre `--background: #0b0e14`**: ~5.2:1 — borderline AA mas aceitável. Pode falhar em texto menor que 14px bold.
- **Scrollbar thumb/track não definidos** — pode causar scrollbars invisíveis dependendo do OS/browser, reduzindo affordance de scroll para usuários com necessidades motoras.
- **`tabIndex` e `role` nos componentes de sidebar** precisam ser auditados — o sidebar tem items clicáveis (`mockup-sidebar-item`) sem `role="button"` explícito na versão CSS pura.
- **`transform: translateX(2px)` no hover de sidebar** — movimento de 2px no hover é sutil demais para ser útil como feedback e pode causar layout shift em grids adjacentes.

### Atenção
- **`userScalable: false`** está definido no viewport — isso viola WCAG 1.4.4 (Resize Text) ao impedir zoom manual. Recomendado remover ou usar `maximum-scale: 5`.
- **Inputs com `font-size: 16px !important`** no iOS: correto para evitar auto-zoom, mas o `!important` torna difícil sobrescrever quando necessário.

---

## 7. Ícones

### Inconsistências
- **Classes de tamanho definidas**: `.icon-xxs` (12px) até `.icon-2xl` (48px) — bom sistema declarativo.
- **Não há evidência de que todos os ícones usem essas classes** — sem verificar cada componente, há risco de tamanhos hardcoded inline (`w-4 h-4`, `size-5`, etc.) coexistindo com as classes `.icon-*`.
- **Biblioteca de ícones não identificada** — o projeto parece usar Lucide React (comum em shadcn/ui), mas não está explicitamente confirmado no audit sem verificar os imports.

---

## 8. Sombras e Elevação

### Problemas
- **Ausência de sombras no dark mode**: `box-shadow: none` nos cards é intencional (bordas definem a elevação), o que é correto para dark mode. Porém ao hover o card ganha `box-shadow: 0 4px 12px rgba(0,0,0,0.06)` — com 6% de opacidade preta sobre fundo escuro, a sombra é invisível.
- **Hover shadow no light mode** (`0 4px 12px rgba(0,0,0,0.06)`) também é muito sutil — 6% opacidade raramente é percebível.
- **Nenhuma escala de elevação definida** como design token — sombras são valores ad hoc em diferentes classes.

---

## 9. Bordas e Border Radius

### Pontos Fortes
- `--radius: 0.5rem` e `--field-radius: 0.5rem` definidos como tokens.
- Uso consistente de `border: 1px solid var(--border)` nos cards.

### Problemas
- **`.dropdown__popover`, `.select__popover`, etc. usam `border-radius: var(--radius-xl)`** — mas `--radius-xl` não está definido nos tokens do tema (apenas `--radius`). Isso pode causar fallback para 0 ou valor inválido em alguns browsers.
- **`border-radius: 8px` hardcoded** em várias classes mockup (sidebar items, botões, selects) em vez de `var(--radius)`. Se o radius do tema for alterado, esses elementos não acompanham.
- **`border-radius: 6px`** em badges e outros elementos — terceiro valor de radius não definido como token.

---

## 10. Motion e Animações

### Pontos Fortes
- Animações nomeadas e semânticas: `sidebarFadeSlideIn`, `shimmer`, `exchange-pop`, `balance-slide-in`.
- Transições curtas e adequadas: `160ms ease` para interações de campo, `200ms ease` para hover de cards.
- `transition: all` evitado — transições são específicas (cor, shadow, transform).

### Problemas
- **`animate-first` a `animate-fifth` e `animate-aurora`** são definidos como tokens de animação mas parecem ser usados apenas no background da landing page. Durações muito longas (20-60 segundos) podem ser problema de performance em devices menos potentes.
- **Sem `prefers-reduced-motion`** em nenhuma parte do CSS — usuários com configuração de motion reduzido verão todas as animações.
- **`animate-shimmer`** (2s infinite) em elementos de loading é correto, mas sem `will-change: transform` pode causar repaint em elementos não compostos.

---

## 11. Estados Vazios, de Loading e de Erro

### Problemas Identificados
- **`achievements-page-skeleton.tsx` existe** — bom uso de skeletons para a página de conquistas.
- **`logs-table-skeleton.tsx` e `acquirers-table-skeleton.tsx` existem** — padrão de skeleton está presente em partes do admin.
- **Inconsistência**: nem todas as páginas têm skeletons. Páginas como `about/page.tsx` são estáticas sem loading state, mas outras dependem de dados sem skeleton equivalente.
- **`error.tsx` e `global-error.tsx` existem** — error boundaries implementados no nível de app. Não há evidência de error states a nível de componente (ex: erro de fetch em uma tabela mostrando estado de erro inline).
- **Estados vazios**: `[data-slot="empty-state"]` tem estilo definido no CSS global mas a consistência de uso nos componentes precisa ser verificada.

---

## 12. Responsividade e Mobile UX

### Problemas
- **`pb-24 md:pb-0`** para compensar nav mobile bottom — a nav inferior mobile não está visível na estrutura de arquivos. Se existir, o padding é correto; se não existir, o padding é desnecessário e adiciona espaço morto no mobile.
- **Grids de dashboard com colunas fixas** (`repeat(4, 1fr)`) sem breakpoints responsivos nas classes mockup. Em mobile esses grids vão gerar scroll horizontal ou colunas de 60px.
- **Tabelas sem estratégia de responsividade explícita**: o CSS global define estilos para `td` e `th` mas não há estratégia de scroll horizontal ou reflow para tabelas em mobile.
- **`overflow-x: hidden` no wrapper principal** pode esconder conteúdo em mobile se algum elemento tiver width > 100%.
- **Tabs com `flex-wrap: nowrap` + scroll horizontal** — implementado corretamente via `[data-slot="tab-list-container"]`.
- **`@media (display-mode: standalone)`** para PWA: altura de backdrop ajustada para fill-available — correto para PWA em iOS.

---

## 13. Navegação

### Pontos Fortes
- Sidebar com estado expandido/colapsado persistido em cookie — boa UX.
- `getPageTitle(pathname)` para título dinâmico no header — consistente.

### Problemas
- **`sidebar-effects.css`** existe como arquivo separado — animações do sidebar estão em um arquivo CSS isolado em vez de co-localizadas no componente. Possível duplicação com `sidebarFadeSlideIn` já definido no globals.css.
- **`ranking-effects.css`** outro arquivo CSS isolado para efeitos da página de ranking — mesmo problema de co-localização.
- **Não há `aria-current="page"`** visível no sistema de navegação baseado em classes CSS (`.active`) — screen readers não identificam o item de navegação atual.

---

## 14. Tabelas

### Problemas
- **`th` e `[role="columnheader"]` têm `color: var(--foreground) !important`** — o `!important` indica override de algum estilo de biblioteca. Verificar se o HeroUI sobrescreve a cor dos headers de tabela de forma inadequada, e corrigir na origem em vez de usar `!important`.
- **`font-weight: 600 !important`** nos headers — mesmo problema.
- Sem estratégia documentada de `min-width` por coluna — tabelas com muitas colunas podem comprimir demais em telas médias.

---

## 15. Formulários

### Pontos Fortes
- `background-color: var(--surface-secondary)` em inputs — diferenciação visual do fundo de formulários.
- `-webkit-text-fill-color` corretamente definido para evitar override do browser em autofill.
- Placeholder com cor semântica e contraste adequado.

### Problemas
- **`transition: all 160ms`** em inputs de senha/texto — `transition: all` é mais custoso que transições específicas.
- **`input:not(.kbar-search-input)`** — seletor de exclusão indica que o kbar tem estilo diferente. Verificar se o kbar está visualmente consistente com o resto do sistema de inputs.
- **`--field-background: #ffffff` no light mode** vs `background-color: var(--surface-secondary)` no CSS — conflito entre o token definido e o estilo aplicado. O token `--field-background` não está sendo usado onde esperado.

---

## 16. Modais

### Pontos Fortes
- Correção de altura de backdrop para `100dvh` com fallback para `100vh` — correto.
- Classe `.modal__body` com `padding/margin: 4px / -4px` para conteúdo scrollável sem cortar shadows — técnica correta.

### Problemas
- **`[data-slot='backdrop']` com altura forçada** via CSS global pode conflitar com modais que têm altura intencional menor (ex: tooltips com backdrop).
- **Sem `focus-trap` verificado** — modais acessíveis precisam de focus trap. Se o HeroUI já provê isso, OK; se não, é gap de acessibilidade.

---

## 17. Gráficos

- O projeto usa **Recharts via shadcn/ui charts** — biblioteca adequada e integrada.
- `dashboard-chart-config.ts` existe para configuração centralizada de cores de gráficos — boa prática.
- **Sem tema de cores de gráfico para dark mode verificado** — se as cores de gráfico são hardcoded em vez de usar tokens, elas podem ser ilegíveis no dark mode.

---

## 18. Consistência de Componentes

### Problemas Sistêmicos
- **Duas linguagens de componentes**: HeroUI (`data-slot`, `[role="columnheader"]`) e shadcn/ui (`components.json` confirmado). Mistura de dois sistemas de componentes cria inconsistência de API, estilos, e comportamento de acessibilidade.
- **Classes `.mockup-*` no globals.css**: mais de 30 classes de componentes de dashboard definidas no CSS global. Isso acopla estilos a nomes de classe mágicos, dificulta refactoring, e não beneficia de code-splitting.
- **`--radius-xl` referenciado mas não definido** como token — fallback imprevisível.

---

## 19. Performance (causada por UI)

### Problemas
- **`body { height: 100dvh }`**: limita a altura do body ao viewport — pode causar problemas com content overflow em páginas longas fora do panel.
- **Animações de fundo (`animate-first` a `animate-aurora`, 20-60s infinite)** na landing page: múltiplos elementos com transforms e rotações contínuas sem `will-change`. Em dispositivos móveis isso pode reduzir FPS significativamente.
- **`filter: drop-shadow` no logo do sidebar** com hover — `filter` força composite layer, OK para elemento pequeno.
- **Múltiplos contextos de provider aninhados** (8+ providers no PanelProviders): cada re-render de contexto superior pode cascatear re-renders. Verificar se os contextos internos (ex: `NotificationProvider`) usam `useMemo` nos values.
- **`transition: all`** em alguns lugares — sempre prefer transições específicas.
- **`color-mix()`** usado extensivamente em pseudo-elementos e hovers — boa prática moderna, suportado em todos os browsers modernos.

---

## 20. Dashboard Density

- **Admin dashboard**: estrutura com tabs (Financial, Growth, Overview, Transactions, Users/Orgs) — boa separação de informação densa.
- **KPI cards em grid de 4 colunas**: densidade adequada para desktop, problemática para mobile.
- **`dashboard-refresh-controls.tsx`**: existe componente de refresh — bom para dados em tempo real.
- **Live Balance** com backgrounds imersivos: feature premium diferenciada, mas os múltiplos arquivos de background (17 variantes) aumentam o bundle inicial se não forem lazy-loaded.

---

## Resumo das Prioridades

### Crítico (corrigir antes de qualquer release)
1. `--color-muted` apontando para `--muted-foreground` — semanticamente errado
2. `--scrollbar-thumb` e `--scrollbar-track` não definidos — scrollbars possivelmente invisíveis
3. `--radius-xl` referenciado mas não definido — border-radius imprevisível em popovers
4. `userScalable: false` — viola WCAG 1.4.4
5. `prefers-reduced-motion` ausente em todo o CSS

### Alto (próxima sprint)
6. Escala tipográfica não padronizada — definir sistema claro
7. Grids de dashboard sem responsividade — quebram em mobile
8. Classes `.mockup-*` em globals.css — migrar para componentes
9. Mistura de HeroUI + shadcn/ui sem estratégia clara de unificação
10. `border-radius: 8px` hardcoded em vez de `var(--radius)`

### Médio (backlog de qualidade)
11. `transition: all` em inputs — substituir por transições específicas
12. Hover shadows com opacidade muito baixa — imperceptíveis
13. Sidebar sem `aria-current="page"` — acessibilidade de navegação
14. Live Balance backgrounds sem lazy loading — bundle size
15. `--field-background` token não utilizado onde deveria

---

*Audit gerado em modo estático — análise baseada em inspeção de código fonte. Para completar a auditoria recomenda-se executar Lighthouse, axe-core, e testes manuais em dispositivos reais.*
