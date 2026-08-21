# 0002: .NET 10 com Arquitetura Limpa e FastEndpoints

Os serviços de backend são divididos em `swiftpay-api-core` (domínio, entidades EF Core e contratos compartilhados), `swiftpay-api` (regras de negócio, hubs SignalR e administração) e `swiftpay-api-payment` (motor de pagamentos e webhooks).
Adotamos .NET 10 com FastEndpoints em substituição a controllers tradicionais para obter máxima performance de throughput, tipagem estrita com REPR (Request-Endpoint-Response) e compilação nativa otimizada.
