---
description: "Use when implementing React 19 data flow with use(), Suspense, transitions, and App Router list or table performance patterns."
applyTo: 'src/app/panel/**/*.tsx, src/components/**/*.tsx, src/hooks/**/*.ts'
---

## React 19 - Padrões Avançados de Performance

Este projeto utiliza **React 19** com **React Compiler** habilitado. Siga os padrões abaixo para máxima performance.

### Tecnologias Ativas

| Tecnologia | Versão | Configuração |
|------------|--------|--------------|
| React | 19.x | - |
| Next.js | 16.x | App Router |
| React Compiler | Habilitado | `next.config.ts: reactCompiler: true` |

### Hook `use()` para Data Fetching

O React 19 introduziu o hook `use()` que permite "desembrulhar" Promises diretamente no render. **Este é o padrão preferido** para páginas com listagens.

#### Arquitetura Recomendada

```
app/panel/merchant/transactions/
├── page.tsx                        # Server Component - cria Promise e Suspense
├── transactions-table.tsx          # Client Component - usa use() para unwrap
└── transactions-table-skeleton.tsx # Skeleton para fallback do Suspense
```

#### Server Component (page.tsx)

```typescript
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { listMerchantPayments } from '@/app/actions/merchant/payments';
import { TransactionsTable } from './transactions-table';
import { TransactionsTableSkeleton } from './transactions-table-skeleton';
import { Routes } from '@/router/routes';
import type { ReadListPaymentsRequest } from '@/types/merchant/payments';
import type { PaymentMethod, PaymentStatus } from '@/types/enums';

export type Filters = Omit<ReadListPaymentsRequest, 'merchantId'>;

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const merchant = await getSelectedMerchant();
  const environment = await getSelectedEnvironment();

  if (!merchant) {
    redirect(Routes.panel.merchant.new);
  }

  const filters: Filters = {
    status: params.status as PaymentStatus,
    method: params.method as PaymentMethod,
    environment,
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 10,
  };

  // ✅ Cria a Promise SEM await - passa para o Client Component
  const dataPromise = listMerchantPayments(merchant.id, filters);

  // ✅ Key no Suspense = skeleton instantâneo ao mudar filtros
  const suspenseKey = JSON.stringify(filters);

  return (
    <Suspense key={suspenseKey} fallback={<TransactionsTableSkeleton pageSize={filters.pageSize} />}>
      <TransactionsTable
        fetchPromise={dataPromise}
        merchantId={merchant.id}
        filters={filters}
      />
    </Suspense>
  );
}
```

#### Client Component (table.tsx)

```typescript
'use client';

import { use, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Paginated, ApiResponse } from '@/types/common';
import type { MinimalPayment } from '@/types/merchant/payments';
import type { Filters } from './page';

type DataPromise = Promise<ApiResponse<Paginated<MinimalPayment>>>;

interface TableProps {
  fetchPromise: DataPromise;
  merchantId: string;
  filters: Filters;
}

// ✅ Funções auxiliares FORA do componente (React Compiler otimiza)
function getColumns(config: ColumnConfig): DataTableColumn<MinimalPayment>[] {
  // ... definição das colunas
}

export function TransactionsTable({ fetchPromise, merchantId, filters }: TableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ✅ use() desembrulha a Promise - suspende até resolver
  const { data } = use(fetchPromise) ?? { data: null };
  const items = data ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

  // ✅ Função centralizada de navegação
  function navigate(newParams: Record<string, string | number | undefined | null>) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === 'all' || (key === 'pageSize' && value === 10)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Remove page ao mudar outros filtros
      if (!('page' in newParams)) params.delete('page');

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleRefresh() {
    startTransition(() => router.refresh());
  }

  // ✅ Chama função externa - React Compiler otimiza automaticamente
  const columns = getColumns({ /* config */ });

  return (
    <DataTable
      columns={columns}
      data={items.items}
      isLoading={isPending}
      pagination={{
        page: items.page,
        pageSize: items.pageSize,
        totalItems: items.totalItems,
        totalPages: items.totalPages,
        onPageChange: (page) => navigate({ page }),
        isNavigating: isPending,
      }}
    />
  );
}
```

### Regras do React 19 + React Compiler

#### ✅ FAZER

| Padrão | Descrição |
|--------|-----------|
| `use(promise)` | Desembrulhar Promises no render |
| `<Suspense key={...}>` | Key baseada nos filtros para skeleton instantâneo |
| Funções fora do componente | `getColumns()`, helpers - React Compiler otimiza |
| `useTransition` | Para navegação e refresh sem bloquear UI |
| `{ scroll: false }` | Em `router.push()` para evitar scroll ao topo |
| Função `navigate()` centralizada | Uma função para todas as navegações de filtros |
| `import type` | Para tipos quando `verbatimModuleSyntax` está ativo |

#### ❌ NÃO FAZER

| Anti-padrão | Por que evitar |
|-------------|----------------|
| `useEffect` para fetch | Desnecessário com `use()` |
| `useState` para dados da API | Use `use()` para unwrap Promise |
| `useMemo`/`useCallback` manual | React Compiler faz automaticamente |
| `await` na Promise do Server Component | Perde streaming - passe Promise direto |
| `isLoading` com `useState` | Use `isPending` do `useTransition` |
| Múltiplos arquivos (container + table) | Un arquivo só - componente único |

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT 19 DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    Server Component (page.tsx)
           │
           ├── await searchParams (Next.js 15+)
           ├── await getSelectedMerchant() (cookies)
           ├── await getSelectedEnvironment() (cookies)
           │
           ├── const dataPromise = fetchData(...) ← SEM await!
           │
           └── <Suspense key={JSON.stringify(filters)}>
                    │
                    └── <ClientTable fetchPromise={dataPromise} />
                              │
                              └── const { data } = use(fetchPromise)
                                        │
                                        └── Render com dados
```

### Suspense Key Strategy

A `key` no `<Suspense>` é **crítica** para UX:

```typescript
// ✅ Key baseada nos filtros = skeleton instantâneo ao mudar filtros
const suspenseKey = JSON.stringify(filters);

<Suspense key={suspenseKey} fallback={<Skeleton />}>
  <Table fetchPromise={promise} />
</Suspense>
```

**Como funciona:**
1. Usuário muda filtro → URL muda
2. `filters` muda → `suspenseKey` muda
3. React desmonta o Suspense antigo, monta novo
4. Skeleton aparece **instantaneamente**
5. Promise resolve → dados aparecem

### Navegação com `useTransition`

```typescript
const [isPending, startTransition] = useTransition();

function navigate(newParams: Record<string, string | number | undefined | null>) {
  startTransition(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // ✅ scroll: false evita pular para topo
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  });
}

// Uso
<SelectFilter onChange={(key) => navigate({ status: key })} />
<Pagination onPageChange={(page) => navigate({ page })} />
```

### React Compiler - Otimizações Automáticas

Com React Compiler habilitado:

```typescript
// ❌ NÃO FAÇA - React Compiler já otimiza
const columns = useMemo(() => getColumns(config), [deps]);
const handleClick = useCallback(() => { ... }, [deps]);

// ✅ FAÇA - Deixe o Compiler trabalhar
const columns = getColumns(config);
function handleClick() { ... }
```

**Importante:** Se o React Compiler reclamar de dependências incorretas no `useMemo`/`useCallback`, **remova o hook** - o Compiler faz melhor.

### Environment via SSR (Cookies)

O environment selecionado é armazenado em cookie para acesso SSR:

```typescript
// session.ts (Server Actions)
export async function setSelectedEnvironment(environment: PaymentEnvironment): Promise<void>;
export async function getSelectedEnvironment(): Promise<PaymentEnvironment>;

// EnvironmentContext (Client - sync com cookie)
const setEnvironment = useCallback(async (env: PaymentEnvironment) => {
  localStorage.setItem(STORAGE_KEY, env);      // Client cache
  await setSelectedEnvironment(env);            // Cookie (SSR)
  window.location.reload();
}, []);
```

---
