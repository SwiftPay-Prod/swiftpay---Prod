---
description: "Padrao oficial para integrar nova adquirente (acquirer): estrutura de arquivos, contrato de webhook, parsing, conversores de status, autenticacao e checklist de rollout."
applyTo: '**/Clients/**/**/*.cs, **/Endpoints/Acquirers/**/*.cs, **/EndpointsGroups/Acquirers/*.cs, **/Services/Acquirers/**/*.cs, **/Services/Helpers/WebhookFieldResolver.cs, **/Extensions/ServiceCollectionExtensions.cs'
---

# Padrao de Integracao de Adquirentes

Este arquivo centraliza as regras para criar, manter e evoluir integracoes de adquirentes na swiftpay-api-payment.

Objetivo:
- Garantir consistencia entre providers.
- Reduzir regressao em webhook/parsing.
- Facilitar manutencao quando novas adquirentes forem adicionadas.

## 1. Estrutura obrigatoria por adquirente

Cada adquirente deve seguir separacao por responsabilidade:

- Clients:
  - `Clients/{Acquirer}/{Acquirer}Client.cs`: transporte HTTP apenas.
  - `Clients/{Acquirer}/{Acquirer}ResponseParser.cs`: parsing de response e erro.
  - `Clients/{Acquirer}/Models/**`: contracts tipados (request/response/webhook).
- Services:
  - `Services/Acquirers/{Acquirer}Service.cs`: orquestracao de dominio e mapeamento para contratos internos.
  - `Services/Acquirers/Utils/{Acquirer}StatusConverter.cs`: mapeamento de status.
- Endpoints:
  - `Endpoints/Acquirers/{Acquirer}/Webhook/*`: recepcao e processamento de webhook.
  - `EndpointsGroups/Acquirers/{Acquirer}Group.cs`: grupo de rota.

Padrao de nomenclatura de pastas e arquivos (obrigatorio):
- Nomes de pasta de adquirente em PascalCase e identicos entre camadas (`Clients`, `Endpoints/Acquirers`, `EndpointsGroups/Acquirers`, `Services/Acquirers`).
- Em `Clients/{Acquirer}/Models`, usar subpastas canonicas:
  - `Transactions/`
  - `Withdrawals/`
  - `Webhook/`
- Para payloads de transacao especificos do provider (ex.: boleto, charge, pix), e permitido manter subpastas especificas, desde que a modelagem de operacoes equivalentes siga nomes canonicos para transacao e saque.
- Evitar variacoes de operacao equivalente para a mesma finalidade (`Withdraw`, `Withdrawal`, `Transfers`, `Transaction` singular).
- Arquivos de request/response de saque devem usar prefixo `Withdrawal` no nome do arquivo.

## 2. Regras do arquivo *Client.cs (transporte HTTP)

O `*Client.cs` deve conter somente:
- Montagem de request HTTP (`HttpMethod`, URL, headers, body).
- Envio da chamada (`HttpClient`).
- Tratamento de status HTTP (success/failure).
- Delegacao para parser dedicado.

Nao deve conter:
- `Parse*` de payload de negocio.
- utilitarios JSON locais (`ReadString`, `ExtractPayload`, `TryGetPropertyInsensitive`, etc.).
- regra de negocio de status.

## 3. Regras do arquivo *ResponseParser.cs

O parser dedicado deve conter:
- `Parse*` para cada resposta externa (charge, payout, boleto, etc.).
- `ExtractErrorMessage` e `ExtractErrorCode` da adquirente.
- normalizacao de aliases de payload da propria adquirente.

Reuso obrigatorio:
- Utilitarios JSON compartilhados em `Clients/Common/AcquirerJsonReader.cs`.

## 4. Models tipados e enums de webhook

Obrigatorio:
- Request/Response models dedicados por endpoint externo.
- Campos de `event`, `type`, `status`, tipo de chave PIX e documento devem ser enum tipado.
- Cada enum externo deve ter `JsonConverter` dedicado por adquirente.

Nao permitido:
- `JsonElement` como contrato final de payload de webhook quando o contrato e conhecido.
- strings cruas para evento/status em contrato conhecido.

Compatibilidade:
- Conversores devem mapear aliases comuns (ex.: `cancelled` e `canceled`, `PayInCompleted`, etc.).

## 5. Webhook: resolucao de campos e fallback

Toda resolucao de campos de webhook deve usar `Services/Helpers/WebhookFieldResolver`.

Obrigatorio:
- fallback por aliases de identificador (`id`, `transactionId`, `txId`, `correlationID`, `reference_code`, etc.).
- suporte a payload aninhado (`data.data`, `data.data.data`) quando o provider variar estrutura.
- quando enum vier `Unknown`, manter fallback por identificador para nao interromper processamento.

Padrao de classificacao:
- classificar tipo de webhook por `event/type` quando conhecido.
- se desconhecido, cair para heuristica por identificadores disponiveis.

## 6. Status converter por adquirente

Cada adquirente deve ter conversor dedicado em `Services/Acquirers/Utils`:
- `ToPaymentStatus(...)`
- `ToWithdrawStatus(...)`
- `ToPayoutStatus(...)`

Nao manter mapeamento inline em endpoint ou service.

## 7. HeartPay como referencia canônica

Para HeartPay, o padrao vigente e:
- `Clients/HeartPay/HeartPayClient.cs` com foco em transporte HTTP.
- `Clients/HeartPay/HeartPayResponseParser.cs` com parsing dedicado.
- `Clients/Common/AcquirerJsonReader.cs` para utilitarios JSON.
- `Endpoints/Acquirers/HeartPay/Webhook/HeartPayWebhookEndpoint.cs` usando `WebhookFieldResolver` para fallback e cadeia aninhada.

Esse desenho deve ser replicado para novas adquirentes.

## 8. Checklist obrigatorio ao adicionar nova adquirente

Sempre atualizar:
- `swiftpay-api-core/Models/Database/Primary/Acquirer.cs` (enum `AcquirerType`)
- `swiftpay-api-core/Constants/SystemIds.cs` (SystemAcquirerIds)
- `swiftpay-api-core/Utils/AcquirerRequiredFieldsDefaults.cs`
- `swiftpay-api/Database/PrimaryDbInitialize.cs` (seed)
- `swiftpay-api-payment/Extensions/ServiceCollectionExtensions.cs` (DI)
- `swiftpay-api-payment/Services/Acquirers/Utils/AcquirerWebhookUtils.cs` (rota webhook)
- `swiftpay-api-payment/EndpointsGroups/Acquirers/*Group.cs`
- `swiftpay-api-payment/Endpoints/Acquirers/{Acquirer}/Webhook/*`

## 9. Autenticacao de webhook

Configurar no seed:
- `WebhookAuthMode`
- `WebhookToken`

Se houver header customizado de autenticacao:
- ajustar `AcquirerWebhookAuthPreProcessor`.

## 10. Testes minimos obrigatorios

Adicionar ou ajustar:
- testes de converter em `Tests/Integration/AcquirerStatusMappingTests.cs`.
- testes de parser utilitario comum (quando aplicavel) em `Tests/Unit/Clients/Common/*`.
- testes de aliases relevantes de evento/status do provider.

## 11. Sugestoes de melhoria (recomendadas)

- Criar `*WebhookFixture.json` por adquirente com payload real e legado para teste de regressao.
- Adicionar teste de contrato por provider que valida identificadores minimos (transaction/payout id) antes de processar dominio.
- Implementar lint interno (script CI) para impedir metodos `Parse*` dentro de `*Client.cs`.
- Consolidar mensagens de erro de integracao por provider para facilitar auditoria admin.

## 12. Submerchant IP: documentos KYC com URL assinada (obrigatorio)

Para adquirentes com `ProviderCategory = PaymentInstitution` que exigem KYC de submerchant:

- Nunca enviar URL privada bruta de storage (`private/...`) para endpoint de documentos do provider.
- Antes do submit de documentos, gerar URL assinada com validade de `1 ano` (`31536000` segundos).
- A API principal (`swiftpay-api`) deve enviar `fileUrl` assinado e `expiresAt` no payload interno para a API de pagamentos.
- Quando houver URL cacheada com TTL menor que o solicitado, a URL deve ser regenerada para cumprir o TTL minimo exigido.
- O adapter/provider deve propagar `fileUrl` e `expiresAt` recebidos, sem reescrever para URL privada.
