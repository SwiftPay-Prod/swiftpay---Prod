# Swiftpay — Vercel Dashboard UI Design

## Objetivo
Redesenhar todo o admin dashboard no estilo Vercel Dashboard: fundo escuro, sidebar preta, dark/light toggle, documentação completa.

## Abordagem
shadcn/ui + next-themes + CSS custom properties com as cores exatas do Vercel.

## Paleta de Cores (Vercel Dark)

| Token | Cor | Uso |
|-------|-----|-----|
| `--background` | `#0a0a0a` | Fundo da página |
| `--card` | `#111111` | Cards/containers |
| `--sidebar` | `#000000` | Sidebar |
| `--border` | `#1f1f1f` | Bordas |
| `--foreground` | `#fafafa` | Texto primário |
| `--muted-foreground` | `#a1a1aa` | Texto secundário |
| `--accent` | `#1a1a1a` | Hover |
| `--ring` | `#333333` | Focus ring |

## Estrutura de Páginas
- **Layout**: Sidebar escura `w-56` + conteúdo principal
- **Login**: Centralizado, card escuro
- **Dashboard**: Cards de estatísticas + gráfico
- **Payment Links**: shadcn Table + Badge
- **Carteira**: Cards de saldo + transações recentes
- **Transações**: Table com paginação
- **Saques**: Formulário + histórico
- **Config/Webhooks**: Formulário + listagem
- **API Keys**: Criar, exibir, copiar, deletar
- **Documentação**: Sidebar de navegação + conteúdo com exemplos

## Documentação
Conteúdo expandido com:
- Autenticação (Bearer token, como obter)
- Pagamentos (PIX, Boleto, Cartão)
- Webhooks (configuração, assinatura HMAC, retry)
- SDKs (curl, Node.js, Python, C#)
- Erros (códigos HTTP, mensagens)
- Split de pagamentos
- API Keys (como gerar, escopos)

## Implementação
1. Instalar next-themes
2. Configurar CSS variables dark/light (Vercel cores)
3. Adicionar ThemeToggle no sidebar
4. Refazer layout com sidebar preta
5. Atualizar todas as páginas com shadcn
6. Expandir documentação
7. Testes + commit
