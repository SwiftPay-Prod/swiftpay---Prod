# Swiftpay — Vercel Dashboard UI

> **REQUIRED SUB-SKILL:** subagent-driven-development

**Goal:** Redesign admin dashboard as Vercel Dashboard clone — dark theme, sidebar preta, dark/light toggle, documentação expandida.

**Tech Stack:** next-themes, shadcn/ui, Tailwind v4, Lucide icons

---

### Task 1: Install next-themes + configurar CSS Vercel

**Files:**
- Install: `next-themes`
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/layout.tsx`
- Create: `web/src/components/theme-toggle.tsx`

- [ ] **Step 1: Install next-themes**

```bash
cd /home/matspectrum-ai/OpenGateway/web
npm install next-themes 2>&1 | tail -3
```

- [ ] **Step 2: Update globals.css with Vercel colors**

Write `web/src/app/globals.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius: 0.5rem;
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.97 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.92 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #111111;
  --card-foreground: #fafafa;
  --popover: #111111;
  --popover-foreground: #fafafa;
  --primary: #fafafa;
  --primary-foreground: #0a0a0a;
  --secondary: #1a1a1a;
  --secondary-foreground: #fafafa;
  --muted: #1a1a1a;
  --muted-foreground: #a1a1aa;
  --accent: #1a1a1a;
  --accent-foreground: #fafafa;
  --destructive: #7f1d1d;
  --destructive-foreground: #fafafa;
  --border: #1f1f1f;
  --input: #1f1f1f;
  --ring: #333333;
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 3: Update layout with ThemeProvider**

Write `web/src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = { title: "Swiftpay", description: "Payment Gateway" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn(fontSans.variable, fontMono.variable)} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create ThemeToggle component**

Write `web/src/components/theme-toggle.tsx`:
```typescript
'use client';
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-zinc-400 hover:text-white hover:bg-zinc-800">
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/globals.css web/src/app/layout.tsx web/src/components/
git commit -m "feat: add next-themes with Vercel dark/light colors and ThemeToggle"
```

---

### Task 2: Refazer layout sidebar Vercel

**Files:**
- Modify: `web/src/app/dashboard/layout.tsx`

- [ ] **Step 1: Rewrite dashboard layout with Vercel-style sidebar**

Write `web/src/app/dashboard/layout.tsx` with:
- Sidebar: `bg-[#0a0a0a]` no dark, `bg-white` no light
- Logo + Swiftpay no topo
- Links: Dashboard, Carteira, Payment Links, Transactions, Saques, Config, API Keys, Documentação
- No final: ThemeToggle + user email + Sair
- Conteúdo: flex-1 com padding

- [ ] **Step 2: Commit**

```bash
git add web/src/app/dashboard/layout.tsx
git commit -m "feat: vercel-style dark sidebar with theme toggle"
```

---

### Task 3: Atualizar páginas com tema Vercel

**Files:**
- Modify: `web/src/app/dashboard/page.tsx`
- Modify: `web/src/app/dashboard/wallet/page.tsx`
- Modify: `web/src/app/dashboard/transactions/page.tsx`
- Modify: `web/src/app/dashboard/payment-links/page.tsx`
- Modify: `web/src/app/dashboard/withdrawals/page.tsx`
- Modify: `web/src/app/dashboard/settings/webhooks/page.tsx`
- Modify: `web/src/app/dashboard/settings/api-keys/page.tsx`

- [ ] **Step 1: Update all pages to use dark-compatible shadcn components**

Each page uses: `Card`, `Table`, `Badge`, `Button` (shadcn) with dark mode support via CSS variables.

- [ ] **Step 2: Commit**

```bash
git add web/src/app/dashboard/
git commit -m "feat: update all dashboard pages with Vercel-style dark theme"
```

---

### Task 4: Expandir documentação

**Files:**
- Modify: `web/src/app/dashboard/settings/documentation/page.tsx`

- [ ] **Step 1: Rewrite documentation page**

Write comprehensive documentation with sections:
1. Introdução — o que é a API, base URL, formato
2. Autenticação — Bearer token, API Keys
3. Pagamentos PIX — criar, status, webhook, refund
4. Pagamentos Boleto — criar, linha digitável, vencimento
5. Pagamentos Cartão — tokenização, parcelas
6. Split de Pagamentos — divisão entre recebedores
7. Saques — solicitar, status
8. Webhooks — configurar URL, assinatura HMAC, retry
9. SDKs — exemplos em curl, Node.js, Python, C#
10. Erros — códigos HTTP, mensagens, troubleshooting
11. Rate Limits — limites por rota

Cada seção com: descrição, endpoint, exemplo de requisição, exemplo de resposta, campos.

- [ ] **Step 2: Commit**

```bash
git add web/src/app/dashboard/settings/documentation/page.tsx
git commit -m "feat: comprehensive API documentation with SDK examples and troubleshooting"
```

---

### Task 5: Build + push

- [ ] **Step 1: Build and verify**

```bash
cd /home/matspectrum-ai/OpenGateway/web
npm run build 2>&1 | tail -15
```

- [ ] **Step 2: Push**

```bash
cd /home/matspectrum-ai/OpenGateway
git push origin main 2>&1
```
