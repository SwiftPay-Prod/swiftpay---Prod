---
description: "Use when editing shared enums, parse mappings, template parse extensions with icons, and checkout formatter utilities."
applyTo: 'types/enums.ts, parse/**/*.ts, parse/**/*.tsx, utils/formatters.ts, templates/**/*.ts, templates/**/*.tsx'
---

## Enums Compartilhados (types/enums.ts)

Os enums são compartilhados entre **todos os templates**. Ficam em `types/enums.ts`:

```typescript
// types/enums.ts
export type PaymentMethod = 'Pix' | 'CreditCard' | 'Boleto';
export type PaymentStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Expired' | 'Failed' | 'Refunded' | 'PartiallyRefunded';
export type ProductType = 'Physical' | 'Digital' | 'Service';
export type ThemeMode = 'light' | 'dark';
export type CheckoutColorMode = 'Single' | 'Gradient';
export type SocialProofPosition = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';
export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Elo' | 'Hipercard';
export type PixKeyType = 'Cpf' | 'Cnpj' | 'Email' | 'Phone' | 'Random';
```

**Regra**: Templates **NÃO devem** definir enums próprios. Sempre importar de `@/types/enums`.

---

## Parse de Enums (parse/)

O sistema de parse converte enums em objetos de UI (label, description). Fica em `parse/`:

```typescript
// parse/types.ts
export interface TParse {
  label: string;
  description?: string;
}

// parse/payment-method.ts
export const paymentMethodParse: Record<PaymentMethod, TParse> = {
  Pix: { label: 'PIX', description: 'Pagamento instantâneo' },
  CreditCard: { label: 'Cartão de Crédito', description: 'Pague em até 12x' },
  Boleto: { label: 'Boleto', description: 'Vencimento em 3 dias' },
};
```

**Regra**: O parse compartilhado **NÃO inclui ícones**. Ícones são específicos de cada template.

---

## Parse com Ícones (template/parse.tsx)

Cada template pode estender o parse compartilhado adicionando ícones:

```typescript
// templates/hero-pro/parse.tsx
import { paymentMethodParse as basePaymentMethodParse } from '@/parse';
import type { PaymentMethod, TParse } from './types';

interface TParseWithIcon extends TParse {
  icon?: ReactNode;
  className?: string;
}

export const paymentMethodParse: Record<PaymentMethod, TParseWithIcon> = {
  Pix: {
    ...basePaymentMethodParse.Pix,
    icon: <Icon icon={QrCodeIcon} className="icon-md" />,
  },
  // ...
};
```

---

## Formatadores (utils/formatters.ts)

Funções de formatação compartilhadas entre templates:

```typescript
// utils/formatters.ts
export function formatCurrency(valueInCents: number): string;
export function formatCPF(value: string): string;
export function formatPhone(value: string): string;
export function formatCEP(value: string): string;
export function formatCardNumber(value: string): string;
export function formatCardExpiry(value: string): string;
export function generateInstallmentOptions(totalAmount: number, maxInstallments?: number): InstallmentOption[];
```

---
