# SwiftPay Design System (Revolut-Inspired)

## Design Philosophy

SwiftPay adopts a calm, high-contrast, data-dense fintech visual language inspired by Revolut and Stripe. It avoids AI-generated starter templates, decorative blobs, icons in colored circles, and bubbly cards.

---

## 🎨 Color Palette & Tokens

### Dark Mode (Primary Mode)
- **Background (`--background`)**: `#0B0E14` (Deep Charcoal / Obsidian)
- **Elevated Surface (`--surface` / `--card`)**: `#121721` (Crisp elevated card)
- **Secondary Surface (`--surface-secondary`)**: `#1B2230` (Inputs, search bars & inner containers)
- **Borders (`--border`)**: `#1E2638` (Crisp 1px border)
- **Foreground Text (`--foreground`)**: `#F4F5F7` (Bright silver-white, 12.5:1 contrast)
- **Secondary Text (`--muted-foreground`)**: `#94A3B8` (Prata legível, 8.2:1 contrast)
- **Brand Accent (`--brand` / `--accent`)**: `#A3E635` (Lime Neon, used with restraint for CTAs, active tabs & positive trends)
- **Brand Soft (`--brand-soft`)**: `rgba(163, 230, 53, 0.12)`
- **Success (`--success`)**: `#A3E635` / `#10B981`
- **Danger (`--danger`)**: `#EF4444`
- **Warning (`--warning`)**: `#F59E0B`

### Light Mode
- **Background (`--background`)**: `#F7F9FC` (Ultra-clean off-white)
- **Elevated Surface (`--surface` / `--card`)**: `#FFFFFF` (Pure white)
- **Secondary Surface (`--surface-secondary`)**: `#EDF1F7` (Light gray container)
- **Borders (`--border`)**: `#E2E8F0`
- **Foreground Text (`--foreground`)**: `#0B0E14` (Deep charcoal)
- **Secondary Text (`--muted-foreground`)**: `#475569` (Slate-600)
- **Brand Accent (`--brand`)**: `#4D7C0F` / `#65A30D`

---

## 📐 Typography & Hierarchy

- **Display & Headings**: Geist / System Sans (`font-sans`), `font-bold tracking-tight`.
- **Financial Values & Code**: Geist Mono / Monospace (`font-mono`), tabular numbers (`tabular-nums`).
- **Scale**:
  - Hero KPI / Balance: `text-3xl sm:text-4xl font-extrabold tracking-tight`
  - Section Title: `text-base sm:text-lg font-bold tracking-tight`
  - Body Text: `text-sm text-foreground`
  - Secondary Label / Caption: `text-xs text-muted-foreground font-medium`

---

## 🧩 Components & Layout

### 1. Cards & Containers
- `rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm`
- No heavy drop-shadows or 32px bubbly radii. Clean 16px radius (`rounded-2xl`).

### 2. Navigation & Sidebar
- Dark charcoal sidebar (`bg-[#090C10] border-r border-border`).
- Active items: `bg-brand/12 text-brand rounded-xl font-semibold` (No 3px left border).

### 3. Tables & Data Grids
- Headers (`th`): `text-xs font-bold text-foreground uppercase tracking-wider h-11 border-b border-border`
- Rows (`tr`): `border-b border-border/40 hover:bg-surface-secondary/50 transition-colors`
- Pagination: `text-xs text-muted-foreground font-medium`

### 4. Buttons & Controls
- Primary Button: `bg-primary text-primary-foreground font-semibold rounded-xl px-4 py-2 hover:opacity-90 active:scale-[0.98] transition-all`
- Secondary Button: `bg-surface-secondary text-foreground border border-border hover:bg-surface-secondary/80 rounded-xl px-4 py-2`

---

## 🚫 AI Slop Blacklist (Prohibited Patterns)

1. ❌ Icons in colored circles as section decoration.
2. ❌ Generic 3-column card grids with duplicate icon-title-description blocks.
3. ❌ Colored left-borders on cards or sidebar items (`border-left: 3px solid`).
4. ❌ Bubbly border radius > 20px on standard cards and inputs.
5. ❌ Low-contrast text on dark backgrounds (`text-zinc-600` / `text-foreground/30`).
6. ❌ Decorative background blobs, floating SVG circles, or artificial shimmers.
