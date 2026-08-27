## Contexto
Ticket pai: **U4**  
Spec: #119 (Pix Estático reutilizável — valor fixo, valor aberto e BR Code portável)

## O que este ticket faz
Cria o gerador offline de BR Code EMV para Pix Estático, com CRC16 e campo 54 condicional.

## Arquivos alterados
- `swiftpay-api-payment/Utils/PixStaticBrCodeGenerator.cs` (novo)

## Critérios de aceitação
- [x] Gera EMV válido para `StaticFixed` com valor
- [x] Gera EMV válido para `StaticOpen` sem valor
- [x] Gera EMV válido para `StaticPortable` sem depender de checkout
- [x] Build do backend sobe sem erro

## Dependências
- Bloqueado por: **U4**
