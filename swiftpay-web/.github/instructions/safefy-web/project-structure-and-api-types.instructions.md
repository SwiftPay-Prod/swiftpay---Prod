---
description: "Use when editing project structure conventions, API typing strategy, response contracts, and Server Action return types."
applyTo: 'src/types/**/*.ts, src/app/actions/**/*.ts, src/services/**/*.ts, src/app/**/*.ts, src/app/**/*.tsx'
---

## Estrutura do Projeto

Estrutura canônica (evolutiva):
- `src/app`: rotas e composição de páginas
- `src/app/actions`: Server Actions por domínio
- `src/types`: contratos de API e tipos compartilhados
- `src/services`: clientes HTTP e integrações
- `src/parse`: mapeamentos de enums para UI

Evite manter árvore completa de diretórios nas instructions, pois ela muda com frequência. Use os caminhos acima como guia de organização.

---

## Sistema de Tipos para API

### Regra Fundamental

> **⚠️ Não crie type aliases para Response types.** Use `ApiResponse<T>` diretamente nos return types das actions para melhor visibilidade da estrutura de resposta.

### Estrutura de Tipos

Organize os tipos em arquivos por domínio:

```
src/types/
├── common.ts          # ApiResponse, Paginated, PaginationParams
├── enums.ts           # Todos os enums
├── auth.ts            # Tipos de autenticação
├── user.ts            # Tipos do usuário logado
├── files.ts           # Tipos de arquivos
├── admin/             # Tipos de endpoints admin
│   ├── users.ts
│   ├── merchants.ts
│   ├── transactions.ts
│   └── ...
└── merchant/          # Tipos de endpoints merchant
    ├── crud.ts
    ├── payments.ts
    └── ...
```

### Padrão de Nomenclatura

| Tipo | Nomenclatura | Uso |
|------|--------------|-----|
| **Minimal** | `AdminMinimal{Entidade}` ou `Minimal{Entidade}` | Listagens (dados resumidos) |
| **Details** | `Admin{Entidade}Details` ou `{Entidade}Details` | Detalhes (dados completos) |
| **Data** | `{Entidade}Data` | Dados genéricos ou retorno de ações |
| **Request** | `{Acao}{Entidade}Request` | Payload de requisição |

### Exemplo de Organização de Tipos

Use exemplos genéricos de padrão, sem congelar contratos de uma entidade específica:

```typescript
import { PaginationParams, ApiResponse, Paginated } from '@/types/common';

export interface MinimalEntity {
  id: string;
}

export interface EntityDetails extends MinimalEntity {
  // campos detalhados
}

export interface ReadListEntityRequest extends PaginationParams {
  search?: string | null;
}
```

Observação: o padrão obrigatório continua sendo usar `ApiResponse<T>` diretamente no retorno de actions públicas, sem aliases dedicados para "Response".

### Padrão de Server Actions

Use `ApiResponse<T>` diretamente no return type para melhor visibilidade:

```typescript
// src/app/actions/{dominio}/{recurso}.ts
"use server";

import client from "@/services/client";
import { ApiResponse, Paginated } from "@/types/common";

export async function listEntities(
  params?: { page?: number; pageSize?: number }
): Promise<ApiResponse<Paginated<{ id: string }>>> {
  const response = await client.get<ApiResponse<Paginated<{ id: string }>>>("/v1/example", {
    params,
  });
  return response?.data;
}
```

### Benefícios

1. **Visibilidade**: O desenvolvedor vê imediatamente `Paginated<AdminMinimalUser>` ou `AdminUserDetails`
2. **Consistência**: Todos os endpoints seguem o mesmo padrão
3. **Manutenção**: Menos tipos para manter, menos indireções
4. **IntelliSense**: Melhor autocompletar no editor

### Tipos Base (common.ts)

```typescript
// src/types/common.ts
export interface ApiResponse<T> {
  data: T | null;
  message: string | null;
  error: { message: string } | null;
}

export interface Paginated<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
```

---
