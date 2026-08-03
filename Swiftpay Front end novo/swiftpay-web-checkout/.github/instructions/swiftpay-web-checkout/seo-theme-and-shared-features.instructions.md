---
description: "Use when working on SEO metadata, privacy rules, theme detection, tracking mode, and shared optional checkout features."
applyTo: 'core/checkout/metadata/**/*.ts, app/[checkoutId]/page.tsx, types/checkout.ts, components/tracking/**/*.tsx, templates/**/*.tsx'
---

## SEO e Open Graph (OG)

Cada checkout pode ter configurações completas de SEO/OG. A metadata é gerada via `generateMetadata`:

### Tipos (types/checkout.ts)

```typescript
interface CheckoutSeoConfig {
  title: string | null;
  description: string | null;
  keywords: string | null;
  robots: string | null;
  canonical: string | null;
  openGraph: CheckoutOpenGraphConfig | null;
  twitter: CheckoutTwitterConfig | null;
}

interface CheckoutOpenGraphConfig {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string | null;
  siteName: string | null;
  locale: string | null;
  type: 'website' | 'article' | 'product' | null;
}

interface CheckoutTwitterConfig {
  card: 'summary' | 'summary_large_image' | 'app' | 'player' | null;
  site: string | null;
  creator: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}
```

### Uso em page.tsx

```typescript
// app/[checkoutId]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const checkout = await getCheckoutData(params.checkoutId);
  const seo = checkout?.data?.config?.seo;
  
  return {
    title: seo?.title || checkout?.data?.name,
    description: seo?.description,
    openGraph: seo?.openGraph ? {
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      images: seo.openGraph.imageUrl ? [{ url: seo.openGraph.imageUrl }] : undefined,
    } : undefined,
    twitter: seo?.twitter ? {
      card: seo.twitter.card || 'summary_large_image',
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.imageUrl ? [seo.twitter.imageUrl] : undefined,
    } : undefined,
  };
}
```

### Regra de Privacidade para Payment Link (`/pay/[token]`)

- O metadata (`title`, `description`, `openGraph`, `twitter`) do link de pagamento **nunca** deve exibir nome da organização/merchant.
- Prioridade de conteúdo no metadata:
  1. `productName` (quando existir)
  2. `description` (quando existir)
  3. fallback neutro: `Link de pagamento` + valor formatado
- Quando não houver `productName` e `description`, usar texto genérico com o valor (sem qualquer referência a merchant/organização).

### Regra de Exibição de Taxas no Payment Link

- No `/pay/[token]`, a seção detalhada de taxa de processamento só pode aparecer quando `showFees = true`.
- Quando `passFeeToCustomer = true` e `showFees = false`, o valor final pode permanecer aplicado no total, porém a quebra/detalhamento de taxa não deve ser exibida.

---

## Detecção de Tema do Sistema

O loader e templates detectam automaticamente o tema do sistema (dark/light):

```typescript
// Detecção de tema
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  setTheme(mediaQuery.matches ? 'dark' : 'light');

  const handleChange = (e: MediaQueryListEvent) => {
    setTheme(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);
```

O `FullPageLoader` também detecta o tema para exibir loading com cores apropriadas.

---

## Funcionalidades Compartilhadas

As funcionalidades abaixo são **compartilhadas entre múltiplos templates**. Cada funcionalidade pode ser habilitada ou desabilitada por template através de flags no banco de dados.

## Tracking Integrations (estado atual)

- O runtime de templates nao injeta mais `TrackingProvider` por padrao.
- Enquanto esse modo estiver ativo, o checkout deve tratar tracking como opcional (`useTrackingOptional`) e nao depender de provider para renderizar/funcionar.
- Integracoes de tracking continuam no codigo-fonte para reativacao futura, mas o payload publico de checkout pode vir com `tracking = null`.

### 1. Prova Social (Social Proof)

Exibe notificações simuladas de compras recentes para criar confiança e urgência.

**Flag do Template:** `supportsSocialProof`

**Configurações do Checkout:**
- `socialProofEnabled`: boolean - Se está habilitado
- `socialProofSettings.intervalSeconds`: number - Intervalo entre notificações (padrão: 8)
- `socialProofSettings.durationMs`: number - Duração da notificação (padrão: 4000)
- `socialProofSettings.notifications`: array - Lista de notificações com `name`, `location`, `action`

**Tipos:**
```typescript
// types/social-proof.ts
interface SocialProofNotification {
  name: string;      // Ex: "Maria S."
  location: string;  // Ex: "São Paulo, SP"
  action: string;    // Ex: "acabou de comprar"
}

interface SocialProofConfig {
  enabled: boolean;
  intervalMs: number;
  durationMs: number;
  notifications: SocialProofNotification[];
}
```

**Uso no Template:**
```tsx
// templates/hero-pro/index.tsx
import { SocialProof } from './components/SocialProof';

export function HeroProTemplate({ checkout }: Props) {
  const socialProofConfig = checkout.config?.socialProof;

  return (
    <>
      {/* ... outros componentes ... */}
      
      <SocialProof
        notifications={socialProofConfig?.notifications ?? []}
        enabled={socialProofConfig?.enabled ?? false}
        intervalMs={socialProofConfig?.intervalMs ?? 8000}
        durationMs={socialProofConfig?.durationMs ?? 4000}
      />
    </>
  );
}
```

---

### 2. Timer de Urgência

Exibe um contador regressivo para criar senso de urgência.

**Flag do Template:** `supportsTimer`

**Configurações do Checkout:**
- `showTimer`: boolean - Se está habilitado
- `timerMinutes`: number - Tempo inicial em minutos
- `timerText`: string - Texto exibido junto ao timer

**Uso no Template:**
```tsx
{checkout.config?.showTimer && (
  <Timer
    minutes={checkout.config.timerMinutes ?? 15}
    text={checkout.config.timerText}
  />
)}
```

---

### 3. Cupons de Desconto

Permite que clientes apliquem cupons de desconto.

**Flag do Template:** `supportsCoupons`

**Configurações do Checkout:**
- `couponEnabled`: boolean - Se está habilitado

---

### 4. Cálculo de Frete

Permite cálculo automático de frete por CEP.

**Flag do Template:** `supportsShipping`

**Configurações do Checkout:**
- `shippingEnabled`: boolean - Se está habilitado

---
