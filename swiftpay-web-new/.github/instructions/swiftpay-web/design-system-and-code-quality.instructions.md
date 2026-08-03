---
description: "Use when applying HeroUI v3, Tailwind v4 semantics, coding best practices, and utility usage conventions in swiftpay-web."
applyTo: 'src/**/*.tsx, src/**/*.ts, src/app/globals.css, src/components/**/*.tsx'
---

## Design System - HeroUI

### Biblioteca de UI
- Utilize **HeroUI v3** para todos os componentes de UI
- Documentação: https://v3.heroui.com/docs/react/getting-started
- **LLM Reference (prioridade para consultas)**: https://v3.heroui.com/react/llms-full.txt
- Versão: 3.x (beta) com Tailwind CSS v4

### Tailwind CSS v4
Este projeto utiliza **Tailwind CSS v4**. Sempre use a sintaxe moderna do Tailwind v4:

| ❌ Evitar (v3 / Arbitrary) | ✅ Usar (v4) |
|---------------------------|--------------|
| `flex-shrink-0` | `shrink-0` |
| `flex-grow` | `grow` |
| `max-w-[200px]` | `max-w-50` |
| `max-w-[140px]` | `max-w-35` |
| `max-w-[120px]` | `max-w-30` |
| `h-[34px]` | `h-8.5` |
| `w-[34px]` | `w-8.5` |
| `border-warning/20` | `border-warning-soft-hover` |

**Regras:**
- Prefira classes semânticas do Tailwind v4 em vez de valores arbitrários (`[]`)
- Use valores decimais para tamanhos intermediários (ex: `h-8.5` = 34px)
- Use classes de cores com sufixos semânticos (`-soft`, `-hover`, `-soft-hover`)
- Consulte a escala de espaçamento do Tailwind v4: `1 = 4px`, então `max-w-50 = 200px`

### Tema Customizado
- Suporta **dark mode** (padrão) e **light mode** via next-themes

### Sistema de Cores HeroUI v3

O HeroUI v3 utiliza um sistema de cores baseado em **OKLCH** (perceptualmente uniforme) e **semântico** (baseado em intenção).

#### Cores Semânticas (Intent-based)

| Cor | Uso | Classe CSS |
|-----|-----|------------|
| **Accent** | Cor principal da marca (antigo "primary") | `bg-accent`, `text-accent`, `border-accent` |
| **Success** | Estados de sucesso | `bg-success`, `text-success` |
| **Warning** | Estados de alerta | `bg-warning`, `text-warning` |
| **Danger** | Estados de erro | `bg-danger`, `text-danger` |
| **Secondary** | Ações secundárias | `bg-secondary`, `text-secondary` |

#### Sistema de Camadas (Surfaces)

| Camada | Uso | Classe CSS |
|--------|-----|------------|
| **Background** | Nível mais baixo (fundo da página) | `bg-background` |
| **Surface** | Componentes como cards e inputs | `bg-surface` |
| **Overlay** | Elementos flutuantes (modais, tooltips) | `bg-overlay` |
| **Content1/2/3** | Camadas de conteúdo com profundidade | `bg-content1`, `bg-content2` |

#### Pares Foreground/Background

Toda cor de fundo tem uma cor de "frente" correspondente para garantir contraste WCAG:

```typescript
// ✅ Correto - O HeroUI gerencia automaticamente o contraste
<Button color="primary">Texto</Button>

// As variáveis CSS correspondentes:
// --accent (fundo do botão)
// --accent-foreground (texto/ícone dentro do botão)
```

#### Regras de Uso de Cores

```typescript
// ❌ NUNCA usar bg-primary (não existe no HeroUI v3)
<div className="bg-primary">...</div>

// ✅ Usar bg-accent para cor principal
<div className="bg-accent">...</div>

// ❌ NUNCA usar cores hardcoded
<div className="bg-blue-500">...</div>

// ✅ Usar cores semânticas
<div className="bg-accent">...</div>
<div className="bg-success">...</div>
```

#### Variantes de Cores

O HeroUI gera automaticamente variantes para estados:

| Variante | Uso |
|----------|-----|
| `accent` | Cor base |
| `accent-foreground` | Texto sobre accent |
| `accent-soft` | Versão suave (para backgrounds leves) |
| `accent-soft-foreground` | Texto sobre accent-soft |

### Importação de Componentes

```typescript
// Importação do pacote principal
import { Button, Card } from "@heroui/react";
```

### Padrão obrigatório de Select com ListBox

Sempre que usar `Select`, o conteúdo do `ListBox` deve renderizar o item com `Chip` contendo **cor**, **label** e **icon**. O `ListBox.Item` deve receber `key`, `id` e `textValue`. Não use estruturas diferentes para itens de `Select`.

Exigências:
- `ListBox` deve mapear opções com `Chip`
- `Chip` deve receber `variant="primary"` e `color` via `mapParseColorToChipColor(...)`
- Sempre renderizar `{opt.icon}` e `{opt.label}` dentro do `Chip`
- Manter `ListBox.ItemIndicator` dentro do item

---

## Boas Práticas de Código

### Configuração TypeScript
- **Target ES2017**: Use features modernas do JavaScript compatíveis com ES2017
- **Strict mode**: Todas as verificações rígidas do TypeScript estão ativadas
- **Module Resolution**: Utilize `bundler` para resolução de módulos
- **Path Mapping**: Use o alias `@/*` para importações do diretório `src/`
- **React JSX**: Configure JSX com `react-jsx` (sem necessidade de importar React)

### Importações e Módulos
- Use o alias `@/` para importações de arquivos dentro de `src/`
- Prefira importações explícitas sobre wildcards
- Mantenha consistência entre importações absolutas e relativas usando o alias
- **Não crie arquivos `index.ts`** - Importe diretamente do arquivo fonte. Use index.ts apenas quando estritamente necessário para re-exportações de bibliotecas

### Exemplos de Importação

```typescript
// ✅ Correto - usando alias
import { Button } from '@heroui/react';
import { getUserData } from '@/actions/user';
import { MerchantData } from '@/types/merchant';

// ❌ Evitar - path relativo longo
import { getUserData } from '../../../actions/user';
```

### Sem Comentários
- **Não adicione comentários no código**
- O código deve ser auto explicativo através de nomes claros de variáveis, funções e tipos
- Use nomes descritivos que expressem a intenção do código
- Se o código precisar de comentários para ser entendido, refatore-o

### Nomes Descritivos
- Funções: use verbos que descrevam a ação (`createMerchant`, `listPayments`, `getMerchantBalance`)
- Variáveis: use nomes que indiquem o conteúdo (`merchantId`, `isLoading`, `notificationCount`)
- Tipos/Interfaces: use nomes que descrevam a estrutura (`MerchantData`, `CreateApiCredentialRequest`)

### Verificações de Tipo
- Aproveite o `strict: true` para detectar erros em tempo de compilação
- Use tipagem explícita quando a inferência não for clara
- Evite `any` - prefira `unknown` quando necessário

### React Hooks - Boas Práticas
- **Nunca chame `setState` diretamente dentro de `useEffect`** - Isso causa renders em cascata e problemas de performance
- Se precisar derivar estado de outro estado, compute o valor durante o render ao invés de usar `useEffect`
- Use `useMemo` para valores computados que dependem de estado
- Leia: https://react.dev/learn/you-might-not-need-an-effect

```typescript
// ❌ Evitar - setState dentro de useEffect
useEffect(() => {
  if (data) {
    setComputedValue(calculateValue(data));
  }
}, [data]);

// ✅ Correto - valor computado durante render
const computedValue = data ? calculateValue(data) : defaultValue;

// ✅ Correto - useMemo para cálculos pesados
const computedValue = useMemo(() => {
  return data ? calculateValue(data) : defaultValue;
}, [data]);
```

### Botões com Ações Assíncronas
- **Todo botão que executa uma chamada assíncrona DEVE ter estado de loading**
- Use `useTransition` do React para gerenciar o estado `isPending`
- Passe `isPending` para a prop do botão para mostrar o loading

```typescript
// ✅ Correto - Botão com loading
const [isPending, startTransition] = useTransition();

function handleSubmit() {
  startTransition(async () => {
    const response = await createMerchant(data);
    // ...
  });
}

<Button isPending={isPending} onPress={handleSubmit}>
  Salvar
</Button>
```

### Funções Auxiliares (Utils)
- **Toda função auxiliar reutilizável deve ser criada em `src/utils/`**
- Organize por domínio: `currency.ts`, `datetime.ts`, `document.ts`, etc.
- Importe usando o alias `@/utils/{arquivo}`
- Evite funções duplicadas em componentes - sempre verifique se já existe no utils

```typescript
// ✅ Correto - Importar do utils
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';

// ❌ Errado - Definir função local duplicada
function formatCurrency(value: number) { ... }
```

| Arquivo Utils | Funções |
|---------------|---------|
| `currency.ts` | `formatCurrency`, `formatCurrencyCompact` |
| `datetime.ts` | `formatDate`, `formatRelativeTime` |
| `document.ts` | `formatDocument` |
| `input-masks.ts` | `formatPhone`, `formatCpf`, `formatCnpj` |
| `validations.ts` | Validações de formulários |

---
