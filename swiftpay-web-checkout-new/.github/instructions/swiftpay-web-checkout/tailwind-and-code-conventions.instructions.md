---
description: "Use when applying Tailwind v4 conventions, project coding standards, and async interaction patterns in checkout UI."
applyTo: '**/*.tsx, **/*.ts, **/*.css'
---

## React 19 - Padrões

Com React 19 e React Compiler habilitado, siga estes padrões:

### ✅ FAZER

| Padrão | Descrição |
|--------|-----------|
| Funções fora do componente | React Compiler otimiza automaticamente |
| `useTransition` | Para ações assíncronas sem bloquear UI |
| Estado derivado | Computar valores no render quando possível |

### ❌ NÃO FAZER

| Anti-padrão | Por que evitar |
|-------------|----------------|
| `useMemo`/`useCallback` manual | React Compiler faz automaticamente |
| `useState` para cada campo de form | Use `name=""` + FormData |
| `setTimeout` para debounce | Use `useDeferredValue` |

### Exemplo de Formulário Otimizado

```typescript
'use client';

import { useActionState } from 'react';
import { Form, TextField, Input, Button } from '@heroui/react';

function MyForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev, formData: FormData) => {
      const name = formData.get('name') as string;
      
      if (!name?.trim()) {
        return { errors: { name: 'Nome é obrigatório' } };
      }
      
      const res = await submitForm({ name });
      if (res?.error) return { errors: { _form: res.error.message } };
      
      onSuccess();
      return { errors: null };
    },
    { errors: null }
  );

  return (
    <Form action={formAction} validationErrors={state.errors ?? undefined}>
      <TextField name="name" isRequired>
        <Input placeholder="Nome..." />
      </TextField>
      <Button type="submit" isPending={isPending}>
        Enviar
      </Button>
    </Form>
  );
}
```

---

## Tailwind CSS v4

Este projeto usa Tailwind CSS v4. Use a sintaxe moderna:

| ❌ Evitar (v3) | ✅ Usar (v4) |
|----------------|--------------|
| `flex-shrink-0` | `shrink-0` |
| `flex-grow` | `grow` |
| `max-w-[200px]` | `max-w-50` |
| `h-[34px]` | `h-8.5` |

**Regras:**
- Prefira classes semânticas em vez de valores arbitrários (`[]`)
- Use valores decimais para tamanhos intermediários (ex: `h-8.5` = 34px)
- Escala de espaçamento: `1 = 4px`, então `max-w-50 = 200px`

---

## Convenções de Código

- Use TypeScript strict
- Prefira composição sobre herança
- Nomeie componentes de funcionalidade de forma descritiva (SocialProof, Timer, CouponInput)
- Mantenha os componentes pequenos e focados
- Use os tipos definidos em `types/` ao invés de criar novos
- **Não adicione comentários no código** - código deve ser auto explicativo
- **Todo botão assíncrono deve ter estado de loading** - use `isPending` do `useTransition` ou `useActionState`