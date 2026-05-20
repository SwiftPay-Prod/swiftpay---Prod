---
description: "Use when building detail or form modals using React 19 patterns with use(), Suspense, and useActionState in HeroUI."
applyTo: 'src/app/panel/**/*.tsx, src/components/**/*.tsx, src/components/ui/**/*.tsx'
---

## React 19 - Padrão de Modais

Modais que carregam dados ou possuem formulários devem seguir o padrão React 19 com `use()` + `Suspense` + `useActionState`.

### Quando usar Modal vs Página Dedicada

**Cadastros longos ou complexos DEVEM usar páginas dedicadas** em vez de modais. Seguir esta regra para formulários que:

| Critério | Usar Modal | Usar Página (/new, /edit) |
|----------|------------|---------------------------|
| Campos simples (2-5 inputs) | ✅ | ❌ |
| Campos complexos (6+ inputs) | ❌ | ✅ |
| Upload de múltiplas imagens | ❌ | ✅ |
| Múltiplas seções/cards | ❌ | ✅ |
| Formulário com variantes/itens aninhados | ❌ | ✅ |
| Apenas visualização de dados | ✅ | ❌ |
| Confirmação de ação | ✅ | ❌ |

**Exemplos que DEVEM usar páginas dedicadas:**
- Criar/Editar Produto (múltiplas imagens, variantes, categorias)
- Criar/Editar Cliente (dados pessoais, endereço, metadados)
- Criar/Editar Cupom (desconto, limites, validade, escopo)
- Criar Pedido (busca cliente, adicionar produtos, cálculos)
- Criar/Editar Template (descrições, features, fees, tracking)

**Exemplos que PODEM usar modais:**
- Visualizar detalhes de transação (read-only)
- Confirmar exclusão
- Criar checkout (poucos campos)
- Selecionar template (lista de opções)

**Padrão de páginas de formulário:**
```typescript
// pages devem usar FormPageHeader com router.back()
import { FormPageHeader } from '@/components/ui/form-page-header';

export default function NewProductPage() {
  const router = useRouter();
  
  return (
    <FormPageHeader
      title="Novo Produto"
      description="Cadastre um novo produto"
      backLabel="Voltar"
      onBack={() => router.back()}
    />
  );
}
```

### Princípios

1. **Promise criada no evento** - O componente pai cria a Promise no handler de abertura, nunca no render
2. **`use()` para dados** - Modal usa `use(promise)` para consumir dados
3. **`Suspense` com skeleton** - Fallback enquanto carrega
4. **`useActionState` para formulários** - Substitui `useTransition` + `useState` para envio
5. **`scroll="outside"`** - Modais usam scroll externo, sem `overflow-y-auto` ou `max-h` no Dialog

### Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PADRÃO DE MODAIS REACT 19                                │
└─────────────────────────────────────────────────────────────────────────────┘

    Componente Pai (ex: transactions-table.tsx)
           │
           ├── const [dataPromise, setDataPromise] = useState(null)
           ├── const [isOpen, setIsOpen] = useState(false)
           │
           ├── function handleOpenModal() {
           │       setDataPromise(fetchData())  ← Promise criada no EVENTO
           │       setIsOpen(true)
           │   }
           │
           └── <Modal 
                  isOpen={isOpen}
                  dataPromise={dataPromise}
                  onOpenChange={handleClose}
               />
                    │
                    └── Modal.Body
                          │
                          └── <Suspense fallback={<Skeleton />}>
                                    │
                                    └── <Content dataPromise={dataPromise} />
                                              │
                                              └── const data = use(dataPromise)
```

### Modal de Visualização (Detalhes)

```typescript
'use client';

import { Suspense, use } from 'react';
import { Modal, Skeleton } from '@heroui/react';
import type { ApiResponse } from '@/types/common';

type DataPromise = Promise<ApiResponse<PaymentDetails>>;

interface DetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dataPromise: DataPromise | null;
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
    </div>
  );
}

function DetailsContent({ dataPromise }: { dataPromise: DataPromise }) {
  const response = use(dataPromise);
  const data = response?.data;

  if (response?.error) {
    return <p className="text-danger">{response.error.message}</p>;
  }

  if (!data) {
    return <p className="text-muted">Dados não encontrados</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Renderizar dados */}
    </div>
  );
}

export function DetailsModal({ isOpen, onOpenChange, dataPromise }: DetailsModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-3xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Detalhes</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {dataPromise && (
              <Suspense fallback={<ContentSkeleton />}>
                <DetailsContent dataPromise={dataPromise} />
              </Suspense>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
```

### Modal de Formulário (Criar/Editar)

```typescript
'use client';

import { useState, useTransition, useRef, Suspense, use, useActionState } from 'react';
import { Modal, Button, TextField, Input, Skeleton, Label } from '@heroui/react';
import { Alert01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import type { ApiResponse, Paginated } from '@/types/common';

interface FormState {
  error: string | null;
}

type DependenciesPromise = Promise<ApiResponse<Paginated<Customer>>>;

interface FormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  dependenciesPromise: DependenciesPromise | null;
}

function FormContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-16 rounded-lg" />
    </div>
  );
}

function FormContent({ 
  dependenciesPromise, 
  onClose, 
  onSuccess 
}: { 
  dependenciesPromise: DependenciesPromise;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // ✅ use() para consumir dados de dependências
  const response = use(dependenciesPromise);
  const customers = response?.data?.items ?? [];

  // ✅ useActionState para gerenciar formulário
  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const name = formData.get('name') as string;

      if (!name.trim()) return { error: 'Nome é obrigatório' };

      const res = await createItem({ name: name.trim() });

      if (res?.error) return { error: res.error.message };

      toast.success(res?.message || 'Criado com sucesso!');
      onSuccess();
      onClose();
      return { error: null };
    },
    { error: null }
  );

  return (
    <form action={formAction}>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          {/* ✅ name="" no TextField para ler via formData.get() */}
          <TextField aria-label="Nome" name="name">
            <Label>Nome</Label>
            <Input placeholder="Digite o nome..." />
          </TextField>

          {state.error && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <Icon icon={Alert01Icon} className="icon-sm" />
              <span>{state.error}</span>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
          Cancelar
        </Button>
        {/* ✅ type="submit" para integrar com form action */}
        <AsyncButton type="submit" variant="primary" isPending={isPending}>
          Criar
        </AsyncButton>
      </Modal.Footer>
    </form>
  );
}

export function FormModal({ 
  isOpen, 
  onOpenChange, 
  onSuccess, 
  dependenciesPromise 
}: FormModalProps) {
  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Novo Item</Modal.Heading>
          </Modal.Header>
          {dependenciesPromise && (
            <Suspense
              fallback={
                <Modal.Body>
                  <FormContentSkeleton />
                </Modal.Body>
              }
            >
              <FormContent
                dependenciesPromise={dependenciesPromise}
                onClose={handleClose}
                onSuccess={onSuccess}
              />
            </Suspense>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
```

### Componente Pai (Tabela)

```typescript
'use client';

import { useState } from 'react';
import { getPaymentDetails } from '@/app/actions/merchant/payments';
import { listCustomers } from '@/app/actions/merchant/customers';
import { DetailsModal } from './details-modal';
import { FormModal } from './form-modal';
import type { PaymentDetails } from '@/types/merchant/payments';
import type { MinimalCustomer } from '@/types/merchant/customers';
import type { ApiResponse, Paginated } from '@/types/common';

type PaymentPromise = Promise<ApiResponse<PaymentDetails>>;
type CustomersPromise = Promise<ApiResponse<Paginated<MinimalCustomer>>>;

export function DataTable({ merchantId, environment }: Props) {
  // Estados das modais
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paymentPromise, setPaymentPromise] = useState<PaymentPromise | null>(null);
  const [customersPromise, setCustomersPromise] = useState<CustomersPromise | null>(null);

  // ✅ Promise criada no evento de abertura
  function handleOpenDetails(paymentId: string) {
    setPaymentPromise(getPaymentDetails(merchantId, paymentId));
    setIsDetailsOpen(true);
  }

  function handleCloseDetails() {
    setIsDetailsOpen(false);
    setPaymentPromise(null);
  }

  function handleOpenForm() {
    setCustomersPromise(listCustomers(merchantId, { environment }));
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setCustomersPromise(null);
  }

  function handleFormSuccess() {
    handleCloseForm();
    // Refresh data...
  }

  return (
    <>
      {/* Tabela com botões que chamam handleOpenDetails/handleOpenForm */}

      <DetailsModal
        isOpen={isDetailsOpen}
        onOpenChange={handleCloseDetails}
        paymentPromise={paymentPromise}
      />

      <FormModal
        isOpen={isFormOpen}
        onOpenChange={handleCloseForm}
        onSuccess={handleFormSuccess}
        customersPromise={customersPromise}
      />
    </>
  );
}
```

### Regras de Modais

| ✅ FAZER | ❌ NÃO FAZER |
|----------|--------------|
| `scroll="outside"` no Container | `overflow-y-auto` no Body |
| `max-w-{size}` no Dialog | `max-h-{size}` no Dialog |
| Promise criada no evento (handler) | Promise criada no render (`useMemo`) |
| `use(promise)` para consumir dados | `useEffect` para carregar dados |
| `useActionState` para formulários | `useTransition` + `useState` + `setError` |
| `name=""` nos inputs + `formData.get()` | `useState` + `onChange` para cada input |
| `type="submit"` no botão de ação | `onPress={handleSubmit}` manual |
| `{promise && <Suspense>...}` | Renderizar Suspense sem verificar promise |

### Configuração do Modal.Container

```typescript
// ✅ Correto - scroll outside sem limitar altura
<Modal.Container size="lg" placement="center" scroll="outside">
  <Modal.Dialog className="max-w-3xl">
    {/* Sem overflow-y-auto, sem max-h */}
  </Modal.Dialog>
</Modal.Container>

// ❌ Errado - limitar altura e scroll interno
<Modal.Container size="lg" placement="center" scroll="inside">
  <Modal.Dialog className="max-h-[90vh] max-w-3xl">
    <Modal.Body className="overflow-y-auto">
      ...
    </Modal.Body>
  </Modal.Dialog>
</Modal.Container>
```

### Padrão de Header para Modais de Detalhes

Todas as modais de visualização de detalhes devem seguir o mesmo padrão de header:

```typescript
<Modal.Header>
  <Modal.Icon className="bg-accent text-accent-foreground">
    <SeuIcone className="icon-md" />
  </Modal.Icon>
  <Modal.Heading>Título da Modal</Modal.Heading>
  <p className="text-sm text-muted">Descrição breve do conteúdo</p>
</Modal.Header>
```

**Componentes obrigatórios:**
1. **`Modal.Icon`** - Ícone representativo com fundo accent
2. **`Modal.Heading`** - Título principal
3. **Descrição** - Parágrafo com `text-sm text-muted`

**Ícones por tipo de modal:**

| Modal | Ícone | Import |
|-------|-------|--------|
| Transação | `CreditCardIcon` | `@hugeicons/core-free-icons` |
| Saque/Cashout | `Wallet01Icon` | `@hugeicons/core-free-icons` |
| Cliente | `UserCircleIcon` | `@hugeicons/core-free-icons` |
| Produto | `PackageIcon` | `@hugeicons/core-free-icons` |
| QR Code PIX | `Wallet01Icon` | `@hugeicons/core-free-icons` |

**Exemplo completo:**

```typescript
import { CreditCardIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

// ✅ Header padronizado para modal de detalhes
<Modal.Header>
  <Modal.Icon className="bg-accent text-accent-foreground">
    <Icon icon={CreditCardIcon} className="icon-md" />
  </Modal.Icon>
  <Modal.Heading>Detalhes da Transação</Modal.Heading>
  <p className="text-sm text-muted">Informações completas da transação</p>
</Modal.Header>

// ❌ Header sem ícone (não padronizado)
<Modal.Header>
  <Modal.Heading>Detalhes da Transação</Modal.Heading>
  <p className="text-sm text-muted font-mono">{transactionId}</p>
</Modal.Header>
```

**Regra para Suspense fallback:**

O fallback do Suspense deve ter o mesmo header da modal carregada:

```typescript
<Suspense
  fallback={
    <>
      <Modal.Header>
        <Modal.Icon className="bg-accent text-accent-foreground">
          <Icon icon={CreditCardIcon} className="icon-md" />
        </Modal.Icon>
        <Modal.Heading>Detalhes da Transação</Modal.Heading>
        <p className="text-sm text-muted">Informações completas da transação</p>
      </Modal.Header>
      <Modal.Body>
        <ContentSkeleton />
      </Modal.Body>
    </>
  }
>
  <ModalContent transactionPromise={transactionPromise} />
</Suspense>
```

---
