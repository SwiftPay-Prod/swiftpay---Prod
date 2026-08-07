---
description: "Use when working with enum parse mappings, auth route guards, onboarding routing, and session or proxy authentication behavior."
applyTo: 'src/parse/**/*.ts, src/parse/**/*.tsx, src/auth/**/*.ts, src/proxy.ts, src/app/panel/**/*.tsx'
---

## Sistema de Parse (Enums para UI)

A pasta `src/parse/` contém Records que convertem enums para objetos com informações de UI (label, cor, descrição, ícone).

### Estrutura TParse

```typescript
// src/parse/types.ts
export type ParseColor = 
  | 'default' 
  | 'accent' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger';

export type ChipColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface TParse {
  label: string;
  color: ParseColor;
  description?: string;
  icon?: ReactNode;
}
```

### Funções Utilitárias

```typescript
// Converte ParseColor para cores aceitas pelo Chip do HeroUI
import { mapParseColorToChipColor } from '@/parse';

<Chip variant="primary" color={mapParseColorToChipColor(parse.color)}>
  {parse.label}
</Chip>

// Gera options para Select a partir de um parse
import { parseToSelectOptions, userRoleParse } from '@/parse';

const roleOptions = parseToSelectOptions(userRoleParse, 'Todos os cargos');
// Resultado: [{ value: 'all', label: 'Todos os cargos' }, { value: 'God', label: 'Administrador' }, ...]
```

### Nomenclatura

- **Nome da variável**: `{entidade}{Campo}Parse`
- **Tipo**: `Record<EnumType, TParse>`

### Exemplo de Uso

```typescript
// src/parse/merchant.tsx
export const merchantKycStatusParse: Record<MerchantKycStatus, TParse> = {
  Draft: {
    label: 'Rascunho',
    color: 'default',
    description: 'O cadastro ainda está sendo preenchido.',
    icon: <PenNewSquare size={18} />,
  },
  UnderReview: {
    label: 'Em Análise',
    color: 'warning',
    description: 'Sua organização está em análise pela nossa equipe.',
    icon: <Hourglass size={18} />,
  },
  Approved: {
    label: 'Aprovado',
    color: 'success',
    description: 'Sua organização foi aprovada.',
    icon: <CheckCircle size={18} />,
  },
  // ...
};
```

### Uso nos Componentes

```typescript
// ✅ Correto - Acessar direto pelo enum
import { merchantKycStatusParse } from '@/parse';

function StatusChip({ status }: { status: MerchantKycStatus }) {
  const parse = merchantKycStatusParse[status];
  
  return (
    <Chip variant="primary" color={parse.color}>
      {parse.icon}
      {parse.label}
    </Chip>
  );
}

// ✅ Correto - Acessar label apenas
const label = merchantKycStatusParse[status].label;

// ❌ Evitar - Criar funções ou Records separados para labels/cores
const LABELS: Record<Status, string> = {...};
const COLORS: Record<Status, string> = {...};
```

### Parse Disponíveis

| Arquivo | Exports |
|---------|---------|
| `merchant.tsx` | `merchantStatusParse`, `merchantKycStatusParse`, `merchantDocumentTypeParse`, `merchantIdentityDocumentTypeParse`, `merchantOperationTypeParse`, `merchantApiCredentialEnvironmentParse`, `merchantApiCredentialStatusParse` |
| `payment.tsx` | `paymentEnvironmentParse`, `paymentMethodParse`, `paymentStatusParse`, `payoutStatusParse`, `payoutAccountStatusParse`, `payoutReviewActionParse`, `pixKeyTypeParse`, `feeChargeModeParse` |
| `user.tsx` | `userRoleParse`, `userStatusParse`, `emailVerifiedParse` |

### Logs Admin - Webhook de adquirente

- A tela de logs admin (`/panel/admin/logs`) deve expor a aba `AcquirerWebhook` para visualizar entradas da tabela dedicada `AcquirerWebhookLogs`.
- Essa aba deve permitir filtro por adquirente (código/tipo), busca textual em payload/headers e visualização detalhada de metadados da requisição.

### Regras

1. **Sempre use parse para converter enums em UI** - Não crie Records separados para labels, cores ou ícones
2. **Importe de `@/parse`** - Use o barrel export
3. **Mantenha o arquivo atualizado** - Ao adicionar novos enums, crie o parse correspondente
4. **Use o componente Icon** - Todos os ícones devem ser importados de `@hugeicons/core-free-icons` e usados com `<Icon icon={NomeDoIcon} />`
5. **Nunca hardcode traduções na UI** - Sempre utilize o sistema de parse para labels e traduções. Se precisar traduzir um valor (enum, boolean, status), crie ou utilize um parse existente

---

## Sistema de Autenticação

### Rotas Públicas
- `/` - Landing page e modal de autenticação
- `/verify-email` - Verificação do e-mail Firebase antes da emissão do JWT da plataforma

### Rotas Privadas
- `/panel/*` - Todas as rotas dentro do painel requerem o cookie `swiftpay_access_token`
- `/panel/verify-email` - Fluxo legado para sessões da plataforma ainda não verificadas

### Firebase Auth
- E-mail/senha e Google devem autenticar primeiro no Firebase Client SDK.
- O frontend deve enviar o Firebase ID token somente para os proxies same-origin:
  - `POST /api/auth/firebase-signin` -> `POST /v1/auth/firebase-signin`
  - `POST /api/auth/firebase-signup` -> `POST /v1/auth/firebase-signup`
- Somente o backend valida o ID token, provisiona/localiza o usuário e emite o JWT SwiftPay.
- Os proxies Next.js gravam o JWT em cookie `httpOnly`; componentes client nunca persistem o JWT da plataforma.
- Cadastro por e-mail sem verificação não recebe JWT. A confirmação ocorre em `/verify-email` e o usuário autentica novamente depois.
- Recuperação de senha usa `sendPasswordResetEmail` do Firebase. Não manter fallbacks, usuários ou merchants simulados.
- Firebase Auth usa um app Firebase nomeado e separado do app legado de Messaging. Configure `NEXT_PUBLIC_FIREBASE_AUTH_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` e `NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID`; o project ID deve ser o mesmo validado pelo backend.

### Proxy (Guard de Rotas)
- O arquivo `src/proxy.ts` gerencia a autenticação das rotas.
- Usuários não autenticados são redirecionados para `/`.
- Usuários autenticados acessando rotas públicas de autenticação são redirecionados para `/panel/dashboard`.

### Cookies de Autenticação
- `swiftpay_access_token` - Token de acesso da plataforma (`httpOnly`)
- `swiftpay_access_token_expires_at` - Expiração usada pelo frontend
- `swiftpay_device_id` - Identificador do dispositivo confiável

### Onboarding de Usuário (pós-verificação)
- Fluxo dedicado: onboarding de usuário é separado do onboarding de organização (merchant).
- Rota de onboarding do usuário: `/panel/onboarding` (fora de `(main)`, dentro de `(auth-status)`).
- Ordem de gate no proxy:
  - Sem JWT da plataforma -> `/`
  - Sessão legada com `emailVerified = false` -> `/panel/verify-email`
  - Se `emailVerified = true` e `userOnboardingCompleted = false` -> `/panel/onboarding`
  - Após concluir onboarding -> fluxo padrão de merchant/admin.
- A tela de onboarding deve usar `SystemAccordion` em uma única página, com stepper no topo e bloqueio progressivo por etapa.
- Persistência via actions/endpoints:
  - `getUserOnboarding` -> `GET /v1/users/onboarding`
  - `updateUserOnboarding` -> `PATCH /v1/users/onboarding`

### Onboarding de organização (merchant)
- A implementação do onboarding de organização deve ficar dentro de `src/app/panel/(main)/merchant/new/`.
- Como a rota pública existente é apenas `/panel/merchant/new`, não manter um módulo paralelo em `src/app/panel/(main)/merchant/onboarding/`.
- Componentes, hooks, validações, tipos e constantes desse fluxo devem ser co-localizados sob `merchant/new`.

### Complemento de KYC por campo (merchant)

- Quando a organização estiver em `KycStatus = Complement`, a tela `/panel/merchant/new` deve permanecer acessível para correção.
- Pendências de KYC devem expor metadados `fieldKey`, `title` e `description` para orientar a correção.
- No onboarding em modo complemento com `fieldKey` pendente, inputs/uploads não solicitados devem ficar bloqueados no frontend.
- A UX deve destacar claramente o campo solicitado e a mensagem textual de correção nos cards e labels de pendência.

### Avaliação de KYC da organização (admin)

- A tela de avaliação em `src/app/panel/(main)/admin/merchants/[id]/evaluate/` deve reutilizar o conjunto `OrganizationAccordions` como fonte de verdade para os dados da organização.
- Os títulos dos accordions devem seguir os nomes das etapas do onboarding:
  - `Informações básicas`
  - `Endereço`
  - `Compliance`
  - `Documentos`
  - `Revisão e envio`
- Labels exibidos no admin devem manter a mesma nomenclatura dos campos do onboarding do merchant.
- O card de decisão deve ser componentizado e oferecer ação explícita para cancelar a decisão selecionada.
- No fluxo de `Complement`, novos itens pendentes devem ser inseridos no topo da lista.
- O editor de itens pendentes deve usar accordions por item, iniciando aberto por padrão, com ação de confirmação que fecha o item e exibe estado confirmado.
- O histórico de complementos deve exibir comparação de valores (`Valor anterior` e `Novo valor`) quando houver resposta da organização.

### Live Balance (filtro de Total de Vendas)

- A tela `/panel/merchant/live-balance` deve usar filtro próprio para calcular o valor principal (`Total de Vendas`), sem depender do filtro salvo no dashboard do merchant.
- O filtro do `Total de Vendas` deve ser configurável dentro da modal de configurações da própria live (`Configurar Live Balance`), com suporte a períodos prontos e período personalizado.
- O filtro padrão da live deve iniciar como `Todo o período`.
- O estado desse filtro deve ser persistido junto com as demais preferências de live balance no `BaseLocalStorage.liveBalanceSettings`.

---
