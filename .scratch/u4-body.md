## Contexto
Ticket pai: **U3**  
Spec: #119 (Pix Estático reutilizável — valor fixo, valor aberto e BR Code portável)

## O que este ticket faz
Adiciona branch no endpoint de start para Pix Estático, gerando BR Code offline sem depender de adquirente/TransactionService.

## Arquivos alterados
- `swiftpay-api-payment/Endpoints/PaymentLinks/Start/StartPaymentLinkEndpoint.cs`
- `swiftpay-api-payment/Endpoints/PaymentLinks/Start/StartPaymentLinkModels.cs`

## Critérios de aceitação
- [x] `StaticFixed` retorna EMV com campo 54 preenchido
- [x] `StaticOpen` retorna EMV sem campo 54
- [x] Resposta não contém `PaymentId` nem `ExpiresAt` para estáticos
- [x] Build do backend sobe sem erro

## Dependências
- Bloqueado por: **U3**
