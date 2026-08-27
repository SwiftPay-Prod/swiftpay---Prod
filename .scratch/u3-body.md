## Contexto
Ticket pai: **U2**  
Spec: #119 (Pix Estático reutilizável — valor fixo, valor aberto e BR Code portável)

## O que este ticket faz
Expõe o modo estático na API pública do merchant e repassa o campo ao fluxo interno.

## Arquivos alterados
- `swiftpay-api/Models/PaymentApi/PaymentLinkModels.cs`
- `swiftpay-api/Endpoints/Merchants/Payments/CreatePaymentLink/CreatePaymentLinkEndpoint.cs`
- `swiftpay-api/Endpoints/Merchants/Payments/CreatePaymentLink/CreatePaymentLinkModels.cs` (se necessário)

## Critérios de aceitação
- [x] `CreatePaymentLinkApiInput` aceita `PixLinkMode` + `Amount` nullable
- [x] Endpoint merchant repassa `PixLinkMode` para API interna
- [x] Build do backend sobe sem erro

## Dependências
- Bloqueado por: **U2**
