---
description: "Use when editing environment variable policy, SSR and Server Actions boundaries, checkout lifecycle rules, and transaction visualization integration in swiftpay-web."
applyTo: '.env.example, src/services/client.ts, src/app/actions/**/*.ts, src/auth/**/*.ts, src/app/panel/**/*.tsx'
---

# Copilot Instructions

## Variáveis de Ambiente

## Saque Automático - Regra de Frequência Minutely

- A opção de frequência `Minutely` (a cada minuto) é restrita a usuários com role `God`.
- Em telas de configuração de saque automático, usuários sem role `God` não devem visualizar essa opção no `Select` de frequência.
- O frontend deve manter o ocultamento da opção por role e o backend permanece como fonte de verdade para bloqueio de persistência.

Este projeto utiliza dois arquivos de configuração de ambiente:

### `.env.example`
- Arquivo versionado no Git
- Contém apenas as **chaves** das variáveis de ambiente, sem valores
- Serve como documentação das variáveis necessárias para o projeto
- Ao adicionar uma nova variável de ambiente, sempre atualize este arquivo

### `.env.local`
- Arquivo **ignorado** pelo Git (não deve ser commitado)
- Contém as variáveis de ambiente com valores reais para desenvolvimento local
- Cada desenvolvedor deve criar este arquivo copiando o `.env.example` e preenchendo os valores

### Exemplo de uso

```bash
# .env.example (sem valores)
API_URL=

# .env.local (com valores)
API_URL=https://swiftpay-api-staging.up.railway.app
```

### Regras importantes

1. **Nunca commite valores sensíveis** - Credenciais, tokens e URLs de produção devem ficar apenas no `.env.local`
2. **Mantenha o `.env.example` atualizado** - Sempre que adicionar uma nova variável, adicione a chave no `.env.example`
3. **Variáveis server-side** - Por padrão, as variáveis de ambiente são apenas server-side (sem prefixo `NEXT_PUBLIC_`)
4. **Use o prefixo `NEXT_PUBLIC_`** - Apenas para variáveis que precisam ser acessíveis no cliente (browser)

---

## Arquitetura de Requisições à API

## Checkout Merchant - Fluxo sem Publicar/Desativar

- O ciclo de vida da tela de checkout do merchant deve usar somente:
  - Criar
  - Editar
  - Deletar
- Depois de criar, o checkout deve iniciar em `Draft`.
- Em `Draft`, o checkout não deve expor link público nem ficar acessível no runtime público.
- O checkout só deve mudar para `Active` quando a configuração for concluída com os requisitos mínimos atendidos.
- Requisitos mínimos para ativação:
  - template definido
  - ao menos um método de pagamento ativo
- A cor primária deve usar fallback padrão da plataforma (`#1886ed`) quando não houver configuração manual.
- A edição deve seguir salvamento explícito pelo usuário, sem auto-save silencioso.
- Não exibir ações de publicar, ativar, despublicar ou desativar no painel de checkout.

## Link de Visualização de Transação

- As telas de transações de merchant e admin devem exibir ação de copiar `transactionVisualizationUrl` na listagem e no detalhe da transação.
- A origem do link deve ser resolvida no backend (`swiftpay-api`) e não montada no frontend.
- Em dados de boleto do painel, priorizar `pdfUrl` da adquirente e não depender de `proxyUrl` para abertura.

## Transações Admin - Reprocessamento e Webhook Forçado

- O fluxo de `Reprocessar transação` no admin deve permanecer estritamente por `targetStatus` (`Completed`/`Failed`), sem inferência de status via payload bruto.
- O envio de payload bruto da adquirente deve ocorrer em ação separada de `Forçar webhook da adquirente`.
- Para `Forçar webhook`, o frontend deve enviar `acquirerType` e `payloadJson` ao endpoint dedicado (`/v1/admin/transactions/{transactionId}/dev/force-acquirer-webhook`).

### Server-Side Rendering (SSR)
- Requisições ao backend devem ser feitas via SSR apenas quando necessário por questões de segurança (ex: páginas de autenticação, dados sensíveis)
- Para páginas de listagem com filtros dinâmicos, prefira client-side fetching para melhor UX
- Use Server Actions para todas as operações de dados

### Server Actions
- Utilize Server Actions do Next.js para comunicação com a API
- As actions devem ficar em arquivos com a diretiva `"use server"` no topo
- Organize as actions em `app/actions/` ou em arquivos `actions.ts` junto aos componentes

### Axios
- Use o cliente axios configurado em `services/client.ts` para fazer as requisições
- O axios já está configurado com a baseURL da API

---
