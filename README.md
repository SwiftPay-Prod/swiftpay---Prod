# SWIFTPAY

Plataforma brasileira de gateway de pagamentos white-label com foco em PIX, cartão de crédito e boleto.

## Arquitetura

```
swiftpay/
├── swiftpay-api-core/           # .NET 10 - Biblioteca compartilhada (entidades, serviços, ledger)
├── swiftpay-api/                # .NET 10 - API de gestão (FastEndpoints)
├── swiftpay-api-payment/        # .NET 10 - Gateway de pagamentos (FastEndpoints)
├── swiftpay-web/                # Next.js 16 - Painel administrativo (React 19)
└── swiftpay-web-checkout/       # Next.js 16 - Checkout público (React 19)
```

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | .NET 10, C# |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **ORM** | Entity Framework Core 10 + Npgsql |
| **Banco** | PostgreSQL 17 |
| **Cache** | Valkey (Redis-compatível) |
| **Mensageria** | RabbitMQ + MassTransit |
| **Tempo Real** | SignalR |
| **Background Jobs** | Hangfire |
| **UI** | HeroUI v3, Tailwind CSS v4 |
| **Armazenamento** | S3 (DigitalOcean Spaces) |
| **Push Notifications** | Firebase Cloud Messaging |
| **Observability** | Grafana |

## Funcionalidades

- ⚡ Pagamentos PIX com QR Code dinâmico
- 💳 Cartão de crédito com parcelamento
- 📄 Boleto bancário
- 🔗 Links de pagamento compartilháveis
- 🛒 Checkout público multi-template
- 📊 Dashboard em tempo real
- 💰 Sistema de ledger contábil (dupla entrada)
- 🔄 Saques automáticos e manuais
- 🏆 Programa de indicações com comissionamento
- 🎯 Metas e conquistas (gamificação)
- 🔌 9 adquirentes integradas (arquitetura plugável)
- 🌙 Tema dark/light
- 📱 PWA (Progressive Web App)
- 🔔 Notificações push (FCM) e em tempo real (SignalR)
- 📈 Tracking multi-plataforma (Facebook, TikTok, Google, etc.)

## Pré-requisitos

- Node.js 20+
- .NET 10 SDK
- Docker e Docker Compose
- PostgreSQL 17
- Valkey/Redis

## Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/matspectrum-ai/SWIFTPAY.git
cd SWIFTPAY

# Inicie a infraestrutura
cd swiftpay-api
docker compose -f docker-compose.development.yaml up -d

# Execute as APIs
cd ../swiftpay-api-core && dotnet build
cd ../swiftpay-api && dotnet run
cd ../swiftpay-api-payment && dotnet run

# Execute os frontends
cd ../swiftpay-web && npm install && npm run dev
cd ../swiftpay-web-checkout && npm install && npm run dev
```

## Licença

MIT
