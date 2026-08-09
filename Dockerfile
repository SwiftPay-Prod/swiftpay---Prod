# Estágio 1: Instalação de dependências
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Estágio 2: Build da aplicação
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis públicas são incorporadas aos bundles client pelo Next.js durante o build.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PAYMENT_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DOCS_URL
ARG NEXT_PUBLIC_FIREBASE_AUTH_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYMENT_API_URL=$NEXT_PUBLIC_PAYMENT_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL
ENV NEXT_PUBLIC_FIREBASE_AUTH_API_KEY=$NEXT_PUBLIC_FIREBASE_AUTH_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN test -n "$NEXT_PUBLIC_FIREBASE_AUTH_API_KEY" \
    && test -n "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
    && test -n "$NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID"
RUN npm run build

# Estágio 3: Runner (Produção)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# IMPORTANTE: Copiar os arquivos para a pasta standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN apk add --no-cache curl

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O comando correto para standalone mode
CMD ["node", "server.js"]