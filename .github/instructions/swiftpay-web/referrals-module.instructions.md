---
description: "Use when implementing referral panel flows, referral actions, and commission withdrawal user experience in swiftpay-web."
applyTo: 'src/app/panel/**/referrals/**/*.tsx, src/app/actions/user.ts, src/types/**/*.ts, src/components/**/*.tsx'
---

## Indique e Ganhe (Fase Inicial)

Foi adicionada a tela inicial de indicação no painel do usuário:

- Rota: `/panel/referrals`
- Actions: `getMyReferrals` e `generateMyReferralLink` em `src/app/actions/user.ts`
- Endpoints consumidos: `GET /v1/users/referrals` e `POST /v1/users/referrals/generate`
- Navegação: menu de **Conta** no sidebar-user-info (junto de Segurança e Configurações)

Dados exibidos na tela:

- `referralCode`
- `referralLink`
- `referralDurationMonths`
- `referralCommissionPercentage`
- Lista de `referredUsers` com `name`, `email`, `status` e `referredAt`

Regras de saque de comissão no frontend:

- Solicitações com status `Requested` devem permitir ação de cancelamento pelo usuário
- Ao cancelar, o valor deve voltar para o saldo disponível e a UI deve permitir nova solicitação imediatamente
- Quando a solicitação for rejeitada pelo admin, a UI deve exibir o motivo de análise e refletir saldo liberado para novo saque

Regras de UI desta fase:

- Exibir status da conta indicada usando `userStatusParse`
- Exibir estado vazio quando não houver indicados
- Exibir cartão de regras com duração (meses) e comissão (%) efetivas
- Exibir aviso de que contas indicadas `Inactive`/`Suspended` congelam ganhos até reativação
- Não mostrar link permanente por padrão quando `referralCode` estiver vazio
- Exibir botão para gerar link permanente e só mostrar código/link após a geração manual

Regras de signup por link de indicação:

- Ao acessar a tela de cadastro com `?refCode=...`, o campo de código deve ser exibido como **somente leitura**
- O usuário **não pode editar** o `refCode` no formulário
- A tela deve exibir apenas o `ownerName` (nome do dono do código) resolvido pelo endpoint público
- Se o código for inválido, o cadastro não deve prosseguir com esse código
- O cadastro de novo usuário deve exigir `WhatsApp` com DDI usando o input internacional padrão da plataforma