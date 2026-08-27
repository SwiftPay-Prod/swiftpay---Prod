## Contexto
Spec: #119 (Pix Estático reutilizável — valor fixo, valor aberto e BR Code portável)

## O que este ticket faz
Adiciona o enum `PixLinkMode` na camada de domínio e estende a entidade `PaymentLink` com a propriedade `PixLinkMode` (default `Dynamic`).

## Arquivos alterados
- `swiftpay-api-core/Models/Enum/PixLinkMode.cs`
- `swiftpay-api-core/Models/Database/Primary/PaymentLink.cs`

## Critérios de aceitação
- [x] `PixLinkMode` existe com valores `Dynamic`, `StaticFixed`, `StaticOpen`, `StaticPortable`
- [x] `PaymentLink.PixLinkMode` existe e default = `Dynamic`
- [x] Build do backend sobe sem erro

## Dependências
- Bloqueado por: **nenhum**
