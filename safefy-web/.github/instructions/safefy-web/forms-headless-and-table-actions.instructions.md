---
description: "Use when implementing form performance, headless hooks for large modules, and standardized table action columns and internal navigation patterns."
applyTo: 'src/app/panel/**/*.tsx, src/components/**/*.tsx, src/hooks/**/*.ts, src/utils/**/*.ts'
---

## React 19 - Performance em Formulários

Os formulários são uma das principais fontes de problemas de performance. Siga estes padrões para evitar re-renders desnecessários.

### Anti-Patterns a Evitar

| ❌ Anti-Pattern | Problema | ✅ Solução |
|-----------------|----------|------------|
| `useState` para cada campo | Re-render a cada keystroke | Use `name=""` + `FormData` |
| `setTimeout` para debounce | Memory leaks, race conditions | Use `useDeferredValue` |
| Search customizado com `useState` | Complexidade, flickering | Use componente nativo ou `useDeferredValue` |
| `setError` manual | Estado extra desnecessário | Use `validationErrors` do Form |
| `onChange` em cada input | Controlled inputs desnecessários | Use `name=""` + `formData.get()` |
| `setState` síncrono em `useEffect` | React Compiler rejeita | Use `setState` apenas em callbacks assíncronos |
| `setIsLoading(true)` em useEffect | React Compiler rejeita | Derive `isLoading` de comparação de valores |
| `setResults([])` em early return | React Compiler rejeita | Derive `results` de condição no render |

### Padrão Correto: FormData + useActionState

```typescript
'use client';

import { useActionState } from 'react';
import { Form, TextField, Input, Label, FieldError, Button } from '@heroui/react';

interface FormState {
  errors: Record<string, string> | null;
}

function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      // ✅ Extrair dados via FormData - SEM useState para cada campo
      const name = formData.get('name') as string;
      const price = formData.get('price') as string;
      const type = formData.get('type') as string;

      // Validação
      if (!name?.trim()) {
        return { errors: { name: 'Nome é obrigatório' } };
      }

      const res = await createProduct({ name, price: Number(price), type });
      
      if (res?.error) {
        return { errors: { _form: res.error.message } };
      }

      onSuccess();
      return { errors: null };
    },
    { errors: null }
  );

  return (
    // ✅ Componente Form do HeroUI com validationErrors
    <Form action={formAction} validationErrors={state.errors ?? undefined}>
      {/* ✅ TextField com name="" - valor lido via FormData */}
      <TextField name="name" isRequired>
        <Label>Nome do produto</Label>
        <Input placeholder="Nome..." />
        <FieldError /> {/* Mostra erro automaticamente */}
      </TextField>

      <Button type="submit" isPending={isPending}>
        Salvar
      </Button>
    </Form>
  );
}
```

### Padrão para Debounce: useDeferredValue

Quando precisar fazer requisições baseadas em input (ex: preview de taxas, busca):

> **⚠️ REACT COMPILER**: O React Compiler **NÃO permite** `setState` síncrono dentro do corpo do `useEffect`. Isso inclui `setLoading(true)`, `setResults([])`, `setHasFetched(false)`, etc. Apenas `setState` dentro de callbacks assíncronos (`.then()`, `async/await`) são permitidos.

```typescript
'use client';

import { useState, useEffect, useDeferredValue } from 'react';

function SearchComponent() {
  const [searchValue, setSearchValue] = useState('');
  const [fetchedResults, setFetchedResults] = useState<Item[]>([]);
  
  const deferredSearch = useDeferredValue(searchValue);

  // ✅ Derivar isSearching - NÃO usar useState para isso
  const isSearching = searchValue.trim().length >= 1 && searchValue !== deferredSearch;
  
  // ✅ Derivar results - mostra apenas se termo válido
  const searchResults = deferredSearch.trim().length >= 1 ? fetchedResults : [];

  // ✅ useEffect SEM setState síncrono no corpo
  useEffect(() => {
    const term = deferredSearch.trim();
    
    // ✅ Early return SEM setState
    if (term.length < 1) {
      return;
    }

    let cancelled = false;

    // ✅ setState APENAS no callback assíncrono
    fetchData(term).then((response) => {
      if (!cancelled) {
        setFetchedResults(response?.data ?? []);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deferredSearch]);

  return (
    <Input
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
    />
  );
}
```

**Erros do React Compiler a evitar:**

```typescript
// ❌ ERRADO - setState síncrono no corpo do useEffect
useEffect(() => {
  setIsLoading(true);           // ❌ React Compiler REJEITA
  setHasFetched(false);         // ❌ React Compiler REJEITA
  
  if (term.length < 1) {
    setResults([]);              // ❌ React Compiler REJEITA mesmo em early return
    return;
  }
  
  fetchData().then(() => {
    setResults(data);            // ✅ OK - dentro de callback
    setIsLoading(false);         // ✅ OK - dentro de callback
  });
}, [term]);

// ✅ CORRETO - derivar estados, setState apenas em callbacks
const isLoading = searchValue !== deferredSearch;  // ✅ Derivado
const results = deferredSearch.length >= 1 ? fetchedResults : [];  // ✅ Derivado

useEffect(() => {
  if (deferredSearch.length < 1) return;  // ✅ Early return sem setState
  
  let cancelled = false;
  
  fetchData().then((data) => {
    if (!cancelled) setFetchedResults(data);  // ✅ setState em callback
  });
  
  return () => { cancelled = true; };
}, [deferredSearch]);
```

### Quando usar `useState` vs `name=""` + FormData

| Cenário | Abordagem |
|---------|-----------|
| Input simples (texto, número) | `name=""` + `FormData` |
| Input com máscara (currency, phone) | `useState` (necessário para NumericFormat) |
| Select simples | `name=""` + `FormData` |
| Select com renderização customizada | `useState` (para mostrar item selecionado) |
| Input que dispara API em tempo real | `useState` + `useDeferredValue` |
| Checkbox/Switch | `name=""` + `FormData` |

### Regras de Ouro

1. **Minimize `useState`** - Cada `useState` é um potencial re-render
2. **Use `useDeferredValue`** - Nunca use `setTimeout` para debounce
3. **Cleanup em `useEffect`** - Sempre retorne função de cleanup para APIs
4. **FormData no submit** - Extraia valores no `formAction`, não no estado
5. **`validationErrors` do Form** - Use para erros server-side

---

## Padrão Headless para Módulos Grandes

**Para módulos grandes (tabelas com muitos filtros, modais, ações), SEMPRE extraia a lógica para um Custom Hook**, separando inteligência (hook) de apresentação (componente).

### Quando Usar

| Critério | Usar Headless |
|----------|---------------|
| 5+ useStates no componente | ✅ Obrigatório |
| 2+ useEffects complexos | ✅ Obrigatório |
| Múltiplas modais no mesmo componente | ✅ Obrigatório |
| Filtros com debounce/async | ✅ Obrigatório |
| Componente > 200 linhas | ✅ Recomendado |
| Tabela admin com CRUD completo | ✅ Obrigatório |

### Estrutura

```
app/panel/admin/transactions/
├── page.tsx                    # Server Component ou Client
├── transactions-table.tsx      # Componente de apresentação (DUMB)
├── use-transactions-table.ts   # Custom Hook com toda lógica (SMART)
├── transactions-table-skeleton.tsx
└── modals/
```

### Estrutura do Hook

```typescript
// use-transactions-table.ts
interface FiltersState {
  search: string;
  status: PaymentStatus | 'all';
  // ... outros filtros
}

interface ModalState {
  isOpen: boolean;
  transactionPromise: TransactionPromise | null;
}

const initialFilters: FiltersState = { ... };
const initialModal: ModalState = { isOpen: false, transactionPromise: null };

export function useTransactionsTable() {
  // Estados agrupados
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [modal, setModal] = useState<ModalState>(initialModal);
  
  // Valores derivados
  const isLoading = fetchedParams !== currentParams;
  const hasFilters = filters.search !== '' || filters.status !== 'all';
  
  // Handlers
  const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  // ✅ Return categorizado
  return {
    data: { items, isLoading, isRefreshing, pageSizeValue },
    filters: { values: filters, hasFilters, updateFilter, clear: clearFilters },
    modal: { isOpen: modal.isOpen, transactionPromise: modal.transactionPromise, close: closeModal },
    actions: { refresh, openDetails, viewMerchant },
  };
}
```

### Componente de Apresentação (Dumb)

```typescript
// transactions-table.tsx
export function TransactionsTable() {
  const { data, filters, modal, actions } = useTransactionsTable();

  const columns = getColumns(actions.openDetails, actions.viewMerchant);

  return (
    <DataTable
      columns={columns}
      data={data.items.items}
      isLoading={data.isLoading}
      filters={{
        children: <FiltersContent filters={filters} />,
        hasFilters: filters.hasFilters,
        onClear: filters.clear,
        onRefresh: actions.refresh,
      }}
    />
  );
}
```

### Benefícios

1. **Testabilidade**: Hook pode ser testado isoladamente
2. **Manutenção**: Lógica centralizada, fácil de entender
3. **Reusabilidade**: Hook pode ser reutilizado em outros contextos
4. **Separação de Responsabilidades**: Componente só renderiza, hook só gerencia estado
5. **Performance**: Menos re-renders, estados agrupados

### Regras

1. **Agrupe estados relacionados** - Use objetos ao invés de múltiplos `useState`
2. **Return categorizado** - Organize por `data`, `filters`, `modal`, `actions`
3. **Valores iniciais externos** - Defina `initialFilters`, `initialModal` fora do hook
4. **useCallback para handlers** - Todos os handlers devem ser memoizados
5. **Valores derivados** - Compute `isLoading`, `hasFilters` no corpo do hook, não em `useMemo`

### Exemplo: Formulário Complexo Otimizado

```typescript
'use client';

import { useState, useEffect, useDeferredValue, useActionState } from 'react';
import { Form, TextField, Input, Label, Select, ListBox, FieldError } from '@heroui/react';
import { NumericFormat } from 'react-number-format';

function OptimizedProductForm({ categories, onSuccess }) {
  // ✅ Apenas estados REALMENTE necessários
  const [price, setPrice] = useState<number | undefined>(undefined); // NumericFormat precisa
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Select customizado
  
  // ✅ useDeferredValue para campos que disparam API
  const deferredPrice = useDeferredValue(price);

  const [state, formAction, isPending] = useActionState(
    async (_prev, formData: FormData) => {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      // price e selectedCategory vêm do estado (necessário)
      
      const res = await createProduct({
        name,
        description,
        price: price ? Math.round(price * 100) : null,
        categoryId: selectedCategory || null,
      });

      if (res?.error) return { errors: { _form: res.error.message } };
      onSuccess();
      return { errors: null };
    },
    { errors: null }
  );

  return (
    <Form action={formAction} validationErrors={state.errors ?? undefined}>
      {/* ✅ Campo simples - usa name="" */}
      <TextField name="name" isRequired>
        <Label>Nome</Label>
        <Input placeholder="Nome do produto" />
        <FieldError />
      </TextField>

      {/* ✅ Campo simples - usa name="" */}
      <TextField name="description">
        <Label>Descrição</Label>
        <Input placeholder="Descrição..." />
      </TextField>

      {/* ✅ Campo com máscara - precisa de useState */}
      <TextField>
        <Label>Preço</Label>
        <NumericFormat
          customInput={Input}
          prefix="R$ "
          value={price}
          onValueChange={(values) => setPrice(values.floatValue)}
        />
      </TextField>

      {/* ✅ Select com renderização customizada - precisa de useState */}
      <Select
        selectedKey={selectedCategory}
        onSelectionChange={(key) => setSelectedCategory(key as string)}
      >
        <Label>Categoria</Label>
        <Select.Trigger>
          <Select.Value placeholder="Selecione..." />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {categories.map((cat) => (
              <ListBox.Item key={cat.id}>{cat.name}</ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Button type="submit" isPending={isPending}>
        Criar
      </Button>
    </Form>
  );
}
```

---

### Padrão de Coluna de Ações em Tabelas

A coluna de ações em tabelas deve seguir regras específicas para garantir consistência e usabilidade.

**Regra fundamental:** O botão "Ver detalhes" (ícone Eye) **DEVE SEMPRE** aparecer diretamente na coluna de ações, **NUNCA** dentro de um Dropdown.

#### Estrutura padrão

```typescript
// ✅ CORRETO - Botões diretos com Tooltip
{
  key: 'actions',
  header: 'Ações',
  align: 'center',
  render: (item) => (
    <div className="flex items-center justify-center gap-1">
      <Tooltip>
        <Button isIconOnly variant="tertiary" onPress={() => handleView(item.id)}>
          <Eye className="icon-sm" />
          <Tooltip.Content>Ver detalhes</Tooltip.Content>
        </Button>
      </Tooltip>
      <Tooltip>
        <Button isIconOnly variant="tertiary" onPress={() => handleEdit(item.id)}>
          <PenNewSquare className="icon-sm" />
          <Tooltip.Content>Editar</Tooltip.Content>
        </Button>
      </Tooltip>
      <Tooltip>
        <Button isIconOnly variant="tertiary" className="text-danger" onPress={() => handleDelete(item.id)}>
          <TrashBin2 className="icon-sm" />
          <Tooltip.Content>Excluir</Tooltip.Content>
        </Button>
      </Tooltip>
    </div>
  ),
}

// ❌ ERRADO - "Ver detalhes" dentro de Dropdown
{
  key: 'actions',
  render: (item) => (
    <Dropdown>
      <Button isIconOnly variant="tertiary">
        <MenuDots className="icon-sm" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item key="view">Ver detalhes</Dropdown.Item>  {/* ❌ ERRADO */}
          <Dropdown.Item key="edit">Editar</Dropdown.Item>
          <Dropdown.Item key="delete">Excluir</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
}
```

#### Quando usar Dropdown

Use Dropdown **apenas** quando:
1. Há muitas ações (4+) e não cabem na coluna
2. Ações são raras ou secundárias (ex: "Arquivar", "Exportar")
3. **Nunca** para "Ver detalhes" - este deve ser sempre visível

#### Ícones padrão para ações

| Ação | Ícone | Import | Cor |
|------|-------|--------|-----|
| Ver detalhes | `ViewIcon` | `@hugeicons/core-free-icons` | default |
| Editar | `PencilEdit01Icon` | `@hugeicons/core-free-icons` | default |
| Excluir | `Delete02Icon` | `@hugeicons/core-free-icons` | `text-danger` |
| Aprovar | `CheckmarkCircle02Icon` | `@hugeicons/core-free-icons` | `text-success` |
| Rejeitar | `CancelCircleIcon` | `@hugeicons/core-free-icons` | `text-danger` |

---

### Padrão para Telas Internas com Navegação por Seções

Para telas internas (ex.: detalhes administrativos), use os seguintes padrões obrigatórios:

1. **Navegação principal da tela**: usar `Tabs` (HeroUI) para seções de primeiro nível.
2. **Navegação interna dentro de uma seção já tabulada**: **não** usar `Tabs` aninhado.
  - Use `TagGroup` (`selectionMode="single"`) para alternar sub-seções.
3. **Conteúdo sempre abaixo do seletor**:
  - Em navegação principal e interna, a lista de opções vem primeiro e o conteúdo renderiza abaixo.
4. **Consistência visual**:
  - Em sub-seções internas, preferir `TagGroup` com ícone + label em cada `Tag`.

---

### Padrão de Rodapé de Formulário (Save Footer)

Todo formulário administrativo com ação de salvar deve usar um rodapé padronizado e reutilizável.

**Componente padrão:** `FormSaveFooter`

Regras obrigatórias:

1. **Sempre exibir dicas** (texto curto orientativo sobre comportamento do formulário).
2. **Sempre exibir bloco de "Última atualização"**:
  - Se houver data, mostrar formatada.
  - Se não houver data, mostrar fallback (`Não disponível`).
3. **Botão de submit integrado ao rodapé**:
  - Deve usar estado de loading/pending.
  - Deve respeitar estado disabled por validação/alterações.
4. **Responsividade obrigatória**:
  - Mobile: layout em coluna (informações acima, botão abaixo).
  - Desktop: layout em linha com alinhamento horizontal.

Exemplo de uso:

```typescript
<FormSaveFooter
  submitLabel="Salvar configurações"
  isPending={isPending}
  isDisabled={!hasChanges || hasErrors}
  lastUpdated={lastUpdated}
  tips={['Campos vazios utilizam as configurações padrão da plataforma.']}
/>
```

> Este padrão substitui blocos ad-hoc de rodapé com ícones/data/botão implementados inline.

---

### Padrão de Espaçamento (Obrigatório)

Todos os espaçamentos devem comunicar hierarquia visual e contexto.

Regras obrigatórias:

1. **Usar apenas espaçamentos pares** nas classes utilitárias de layout (`gap-*`, `p*`, `m*`).
  - Preferir: `gap-2`, `gap-4`, `p-2`, `p-4`, `pb-4`.
  - Evitar valores ímpares para separação estrutural.
2. **Espaçamento semântico por contexto**:
  - Dentro de blocos de formulário (entre campos relacionados): `gap-2`.
  - Separação entre blocos distintos (ex.: conteúdo vs ações): `gap-4` ou `pb-4`.
3. **Ações primárias em mobile**:
  - Botões principais de ação (ex.: salvar formulário) devem usar largura total no mobile (`w-full`) e voltar ao tamanho natural em telas maiores (`sm:w-auto`).

---

### Client-Side Fetching (Padrão Legado)

> **⚠️ DEPRECADO**: Use o padrão React 19 com `use()` acima. Esta seção existe apenas para referência de código legado.

#### Por que Client-Side para Listagens? (Legado)

> **Nota de Migração**: Este padrão está sendo substituído pelo padrão React 19 com `use()`. Novos componentes devem usar o padrão documentado acima.

#### Quando usar SSR vs Client-Side (Legado)

> **Nota**: Com React 19, o padrão recomendado é Server Component + `use()` para todas as listagens.

| Cenário | Abordagem |
|---------|-----------|
| Páginas de listagem/tabelas | **React 19 com `use()`** |
| Dashboard com filtros | **React 19 com `use()`** |
| Páginas de autenticação | SSR |
| Dados sensíveis iniciais | SSR |
| Páginas estáticas | SSR |

#### Arquitetura Recomendada para Listagens

```
app/panel/admin/users/
├── page.tsx              # Client Component - busca dados e gerencia estado
└── users-table.tsx       # Client Component - tabela com DataTable
```

#### Exemplo Correto - Client-Side Fetching

```typescript
// ✅ page.tsx - Client Component para listagens
'use client';

import { useEffect, useState, useCallback, useRef, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUsers } from '@/app/actions/admin/users';
import { UsersTable } from './users-table';
import { UsersFilters, UserListData } from '@/types/admin/users';
import { Paginated } from '@/types/common';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<Paginated<UserListData>>({
    items: [],
    totalItems: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const lastParamsRef = useRef<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    const currentParams = searchParams.toString();

    if (!force && lastParamsRef.current === currentParams) {
      return;
    }

    lastParamsRef.current = currentParams;

    const filters: UsersFilters = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 10,
    };

    const response = await getUsers(filters);

    setData(response?.data ?? {
      items: [],
      totalItems: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  }, [searchParams]);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    lastParamsRef.current = null;
    startTransition(() => {
      fetchData(true);
    });
  }, [fetchData]);

  const filters: UsersFilters = {
    search: searchParams.get('search') || undefined,
    // ... outros filtros
  };

  return (
    <UsersTable
      data={data}
      filters={filters}
      onRefresh={handleRefresh}
      isRefreshing={isPending}
    />
  );
}
```

#### O que NÃO fazer

```typescript
// ❌ ERRADO - Não use SSR para listagens com filtros dinâmicos
// Isso causa lentidão na navegação e filtragem
export default async function UsersPage({ searchParams }: Props) {
  const response = await getUsers(searchParams);
  return <UsersTable data={response?.data} />;
}

// ❌ ERRADO - Não use isLoading com booleano simples
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  setIsLoading(true);
  getData().finally(() => setIsLoading(false));
}, []);
```

#### Benefícios

- **Performance**: Navegação instantânea entre páginas
- **UX**: Skeleton loading enquanto carrega dados
- **Reatividade**: Filtros atualizam a URL e disparam nova busca
- **Deduplicação**: `lastParamsRef` evita fetches duplicados

### Exemplo de Server Action

```typescript
// actions/user.ts
"use server";

import client from "@/clients/client";

export async function getUsers() {
  const response = await client.get("/users");
  return response?.data;
}

export async function createUser(data: CreateUserDTO) {
  const response = await client.post("/users", data);
  return response?.data;
}
```

### Uso em componentes

```typescript
// app/users/page.tsx
import { getUsers } from "@/app/actions/user";

export default async function UsersPage() {
  const users = await getUsers();
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

---
