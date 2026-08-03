---
description: "Use when editing checkout data flow, technology stack alignment, HeroUI component usage, and React 19 recommended patterns."
applyTo: 'app/**/*.tsx, components/**/*.tsx, templates/**/*.tsx, core/checkout/**/*.tsx, core/checkout/**/*.ts'
---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS DO CHECKOUT                          │
└─────────────────────────────────────────────────────────────────────────────┘

  1. Usuário acessa /{checkoutId}
           │
           ▼
  2. Server Action busca dados do checkout
     └── getCheckoutData(checkoutId)
           │
           ▼
  3. Dados incluem:
     ├── checkout.template.slug → Qual template usar
     ├── checkout.template.supports* → Quais features o template suporta
     └── checkout.config.* → Configurações específicas do checkout
           │
           ▼
  4. Template é carregado dinamicamente
     └── templates[template.slug]
           │
           ▼
  5. Template renderiza com as configurações
     └── Funcionalidades são condicionalmente exibidas
```

---

## Tecnologias Principais

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 16.x | App Router, SSR, Server Actions |
| **React** | 19.x | React Compiler habilitado |
| **HeroUI** | 3.x (beta) | Design System de componentes |
| **Tailwind CSS** | 4.x | Estilização utility-first |
| **TypeScript** | 5.x | Tipagem estática |

---

## Design System - HeroUI v3

Este projeto utiliza **HeroUI v3** para todos os componentes de UI.

### Documentação

- Documentação oficial: https://v3.heroui.com/docs/react/getting-started
- LLM Reference: https://v3.heroui.com/react/llms-full.txt

### Importação de Componentes

```typescript
import { Button, Select, ListBox, Modal, Chip, Input } from '@heroui/react';
```

### Sistema de Cores

O HeroUI v3 utiliza cores semânticas baseadas em OKLCH:

| Cor | Uso | Classes |
|-----|-----|---------|
| **Accent** | Cor principal da marca | `bg-accent`, `text-accent`, `border-accent` |
| **Success** | Estados de sucesso | `bg-success`, `text-success` |
| **Warning** | Estados de alerta | `bg-warning`, `text-warning` |
| **Danger** | Estados de erro | `bg-danger`, `text-danger` |
| **Surface** | Background de componentes | `bg-surface` |
| **Overlay** | Elementos flutuantes | `bg-overlay` |

### Componente Select

O Select do HeroUI v3 usa `value` + `onChange` para estado controlado:

```typescript
// ✅ CORRETO - Select controlado
<Select
  aria-label="Selecionar opção"
  value={selectedKey}
  onChange={(key) => {
    if (key) setSelectedKey(String(key));
  }}
>
  <Select.Trigger>
    <Select.Value />
    <Select.Indicator />
  </Select.Trigger>
  <Select.Popover>
    <ListBox>
      <ListBox.Item id="option1" textValue="Option 1">
        Option 1
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item id="option2" textValue="Option 2">
        Option 2
        <ListBox.ItemIndicator />
      </ListBox.Item>
    </ListBox>
  </Select.Popover>
</Select>

// ✅ CORRETO - Select não controlado
<Select defaultValue="option1" placeholder="Select one">
  ...
</Select>

// ❌ DEPRECADO - selectedKey/onSelectionChange (API antiga)
<Select
  selectedKey={value}
  onSelectionChange={(key) => setValue(key)}
>
```

**Props importantes:**
- `value` / `defaultValue` - Valor selecionado (Key | null)
- `onChange` - Callback quando seleção muda (key: Key | null) => void
- `placeholder` - Texto quando nada selecionado
- `selectionMode="multiple"` - Para seleção múltipla
- `isDisabled` - Desabilitar select
- `isRequired` - Campo obrigatório

### Componente Button

```typescript
<Button variant="primary" onPress={handleClick}>
  Ação
</Button>

<Button variant="secondary" isDisabled={isPending}>
  Cancelar
</Button>

<Button isIconOnly variant="tertiary">
  <Icon className="icon-md" />
</Button>
```

**Variantes:** `primary`, `secondary`, `tertiary`, `ghost`, `outline`

### Componente Modal

```typescript
<Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
  <Modal.Container size="lg" placement="center" scroll="outside">
    <Modal.Dialog className="max-w-md">
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>Título</Modal.Heading>
      </Modal.Header>
      <Modal.Body>
        {/* Conteúdo */}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="tertiary" onPress={() => setIsOpen(false)}>
          Cancelar
        </Button>
        <Button variant="primary" onPress={handleSubmit}>
          Confirmar
        </Button>
      </Modal.Footer>
    </Modal.Dialog>
  </Modal.Container>
</Modal.Backdrop>
```

**Importante:** Use `scroll="outside"` no Container para modais com scroll.

### Componente Chip

```typescript
<Chip variant="primary" color="success">
  Aprovado
</Chip>

<Chip variant="primary" color="danger">
  Rejeitado
</Chip>
```

---
