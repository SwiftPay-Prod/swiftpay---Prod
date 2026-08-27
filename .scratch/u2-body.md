## Contexto
Ticket pai: **U1**  
Spec: #119 (Pix Estático reutilizável — valor fixo, valor aberto e BR Code portável)

## O que este ticket faz
Atualiza os modelos internos para aceitar modo estático e valor opcional, relaxando validações quando não for dinâmico.

## Arquivos alterados
- `swiftpay-api-payment/Endpoints/Internal/PaymentLinks/Create/CreatePaymentLinkInternalModels.cs`
- `swiftpay-api-payment/Endpoints/Internal/PaymentLinks/Create/CreatePaymentLinkInternalEndpoint.cs`

## Critérios de aceitação
- [x] `CreatePaymentLinkInternalRequest` aceita `Amount` nullable + `PixLinkMode`
- [x] Validação de valor só roda em `Dynamic`
- [x] Para estático, `ExpiresAt` é forçado como `null`
- [x] `PaymentLink` criado com `PixLinkMode` correto
- [x] Build do backend sobe sem erro

## Dependências
- Bloqueado por: **U1**
