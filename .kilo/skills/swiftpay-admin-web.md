# Swiftpay Admin Web (Next.js)

## Sub-skills
- **swiftpay-signalr** — real-time dashboard updates
- **swiftpay-webhooks** — webhook configuration UI
- **dotnet/dotnet-webapi** — consuming REST APIs

## Stack
- Next.js 16, React 19, TypeScript
- Tailwind v4 (monocrom preto e branco)
- `@tanstack/react-query` para data fetching
- SignalR para tempo real

## UI/UX Identity
- **Monocrom preto e branco**: Sem cores além de preto, branco e tons de cinza
- Tipografia limpa com Inter
- Cards com bordas finas e sombras sutis
- Ícones minimalistas (Lucide)
- Tabelas com linhas divisórias e hover states

## Project Structure
```
web/src/
├── app/
│   ├── auth/login/           ← Página de login
│   ├── dashboard/            ← Páginas protegidas
│   │   ├── page.tsx          ← Home (stats + KPIs)
│   │   ├── wallet/           ← Carteira (saldo, extrato)
│   │   ├── transactions/     ← Transações
│   │   ├── payment-links/    ← Links de pagamento
│   │   ├── withdrawals/      ← Saques
│   │   └── settings/         ← Configurações (webhooks, API keys)
│   ├── layout.tsx            ← Root layout with Providers
│   └── providers.tsx         ← QueryClient + AuthProvider
├── lib/
│   ├── api-client.ts         ← ÚNICO ponto de contato HTTP
│   ├── auth-context.tsx      ← JWT auth context
│   └── types.ts              ← Domain types
└── middleware.ts              ← Route protection
```

## Data Fetching Pattern
```typescript
// Always use React Query
export function useTransactions(page: number) {
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: () => api.transactions.list(page),
  });
}

// Mutations via React Query
export function useCreatePaymentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.paymentLinks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
    },
  });
}
```

## Authentication Flow
1. User logs in → API returns JWT
2. Token stored in `localStorage` + React Context
3. `api-client.ts` attaches `Authorization: Bearer` header
4. `useAuth()` hook provides user state + login/logout
5. After mount, calls `GET /auth/me` to validate token

## Key Rules
- **Zero business logic in frontend**: Only API calls and rendering
- **Single API client**: All HTTP calls through `lib/api-client.ts`
- **Types mirror backend**: Independent TypeScript types (not auto-generated)
- **Loading states**: Every data fetch has loading/error/empty states
- **Monocrom theme**: CSS custom properties for consistent black/white/gray palette
- **Responsive**: Dashboard works on desktop and tablet
- **PWA**: Optional, can be added via next-pwa
