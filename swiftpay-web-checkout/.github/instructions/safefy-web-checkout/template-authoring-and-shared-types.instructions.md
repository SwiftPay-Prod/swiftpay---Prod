---
description: "Use when creating new checkout templates, defining supported feature flags, and maintaining shared checkout type contracts."
applyTo: 'templates/**/*.tsx, templates/**/*.ts, types/**/*.ts, core/checkout/runtime/templates/**/*.ts, core/checkout/runtime/templates/**/*.tsx'
---

## Criando um Novo Template

Ao criar um novo template, siga este checklist:

### 1. Pergunte quais funcionalidades o template vai suportar

- [ ] Prova Social (Social Proof)?
- [ ] Timer de Urgência?
- [ ] Cupons de Desconto?
- [ ] Cálculo de Frete?

### 2. Crie a estrutura de pastas

```
templates/
└── nome-do-template/
    ├── index.tsx              # Componente principal (export default)
    └── components/            # Componentes específicos
```

### 3. Implemente o componente principal

```tsx
// templates/nome-do-template/index.tsx
import type { CheckoutData } from '@/types/checkout';

interface TemplateProps {
  checkout: CheckoutData;
}

export default function NomeDoTemplate({ checkout }: TemplateProps) {
  const { config } = checkout;
  
  // Extrair configurações de funcionalidades
  const socialProofConfig = config?.socialProof;
  const showTimer = config?.showTimer;
  const couponEnabled = config?.couponEnabled;
  const shippingEnabled = config?.shippingEnabled;
  
  return (
    <div>
      {/* Implementação do template */}
      
      {/* Funcionalidades condicionais */}
      {socialProofConfig?.enabled && (
        <SocialProof {...socialProofConfig} />
      )}
      
      {showTimer && (
        <Timer minutes={config.timerMinutes} text={config.timerText} />
      )}
    </div>
  );
}
```

### 4. Alinhe suporte de funcionalidades com o backend

- O template criado no frontend deve ter correspondência com o cadastro/configuração de template no backend.
- Capacidades (`supportsCoupons`, `supportsShipping`, `supportsTimer`, `supportsSocialProof`) devem ser tratadas como contrato de domínio, não como valor hardcoded em instructions.
- A fonte de verdade é o código/entidade atual do backend e os tipos compartilhados consumidos pelo checkout runtime.

### 5. Registre o template no runtime

```tsx
// core/checkout/runtime/templates/registry.ts
registerTemplate('nome-do-template', {
  render: NomeDoTemplate,
  // metadata opcional do runtime
});
```

Não adicionar lógica de seleção de template em `app/[checkoutId]/page.tsx`; a resolução deve permanecer centralizada no runtime (`resolve-checkout-template`).

---

## Tipos Compartilhados

### CheckoutData (types/checkout.ts)

- Não replique contratos completos de `CheckoutData`, `CheckoutConfig` e `CheckoutTemplate` nas instructions.
- Importe e use os tipos diretamente de `types/checkout.ts`.
- Ao evoluir contrato de tipos compartilhados, ajuste runtime/templates no código e mantenha este arquivo apenas com regras e decisões arquiteturais.

---

## Boas Práticas

1. **Componentes Reutilizáveis**: Se um componente pode ser usado em múltiplos templates, considere movê-lo para uma pasta compartilhada `components/shared/`.

2. **Props Opcionais**: Sempre trate as configurações como potencialmente nulas/undefined.

3. **Valores Padrão**: Use valores padrão sensatos quando a configuração não existir.

4. **Animações**: Use CSS/Tailwind para animações simples. Para animações complexas, prefira Framer Motion.

5. **Responsividade**: Todos os templates devem ser responsivos (mobile-first).

6. **Acessibilidade**: Use `aria-labels` e roles semânticos onde apropriado.

---
