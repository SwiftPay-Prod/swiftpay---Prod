---
description: "Use when editing checkout visual config rules, coding practices, dependency policy, logging policy, and boleto due date constraints."
applyTo: 'Endpoints/**/*.cs, Services/**/*.cs, Validators/**/*.cs, Models/**/*.cs'
---

## Checkout Config - Visual

- **`BackgroundColor` foi removido** do `CheckoutConfig`.
- **`ColorMode`** define se o checkout usa cor única ou gradiente:
    - `Single` → usa apenas `PrimaryColor`
    - `Gradient` → usa `PrimaryColor` + `SecondaryColor`

---

## Boas Práticas

1. **Logs**: Sempre logar requests e responses de integrações (mascarando dados sensíveis)
2. **Error Handling**: Tratar erros de API externa e retornar mensagens amigáveis ao usuário
3. **Tradução de Erros**: Traduzir mensagens de erro em inglês para português
4. **Sealed Classes**: Usar `sealed` em classes que não serão herdadas
5. **Nullable**: Usar tipos nullable (`?`) para propriedades opcionais de responses
6. **Options Pattern**: Nunca chamar configurações diretamente, sempre usar `IOptions<T>`

---

## Regras de Dependências

> **⚠️ IMPORTANTE**: **NÃO UTILIZAR pacotes em versão beta, preview, rc ou qualquer versão pré-release**. A aplicação requer máxima estabilidade e segurança. Sempre utilize apenas versões estáveis (stable/GA) dos pacotes NuGet.

---

## Regras de Logging

## Boleto - Vencimento obrigatório D+2

- Na criação de transação com método `Boleto`, `BoletoDueDate` é obrigatório.
- O vencimento mínimo aceito é `D+2` (data atual + 2 dias).
- Não usar fallback automático para preencher vencimento quando o campo vier ausente.

O sistema de logging segue uma filosofia clara de separação:

**1. ILogger (.NET) - Apenas para Erros Técnicos**
- Use **apenas** `LogError` para registrar erros que quebram o sistema
- Erros de integração com serviços externos (APIs de adquirentes)
- Exceções não tratadas em catch blocks
- **NUNCA** use `LogInformation`, `LogDebug` ou `LogWarning` em código de produção

```csharp
// ✅ CORRETO - Apenas LogError
catch (Exception ex)
{
    logger.LogError(ex, "Error processing payment: PaymentId={PaymentId}", paymentId);
    throw;
}

// ❌ ERRADO - Não usar LogInformation, LogDebug, LogWarning
logger.LogInformation("Payment created: {PaymentId}", payment.Id);
logger.LogDebug("Processing request for {MerchantId}", merchantId);
logger.LogWarning("Rate limit exceeded for {MerchantId}", merchantId);
```

**2. IApiLogService (Banco de Dados) - Para Operações de Negócio Críticas**

| Ação | Enum | Descrição |
|------|------|-----------|
| `CreateTransaction` | `ApiLogAction.CreateTransaction` | Criação de transação/pagamento |
| `CreateCashout` | `ApiLogAction.CreateCashout` | Criação de saque |
| `CancelCashout` | `ApiLogAction.CancelCashout` | Cancelamento de saque |
| `CreateCustomer` | `ApiLogAction.CreateCustomer` | Criação de cliente |
| `UpdateCustomer` | `ApiLogAction.UpdateCustomer` | Atualização de cliente |

**Operações que NÃO devem ter log no banco:**
- Operações de leitura (GET, List)
- Consultas de status
- Simulações em ambiente Sandbox

**Erros de integração com adquirentes (obrigatório):**
- Todo erro retornado pelos clients de adquirentes deve ser registrado via `IApiLogService`
- Use `ApiLogAction.AcquirerRequestFailed` e `ApiLogStatus.Failed`
- Sempre salvar `StatusCode`, `ResponseBody`, `ErrorCode`, `AcquirerId`, `AcquirerType` e `MerchantId`
- Esses logs alimentam a tela de auditoria do admin no safefy-web

**Payload mínimo obrigatório para erros de adquirente/saque:**
- `RequestBody` com payload enviado (sanitizado/mascarado para campos sensíveis)
- `ResponseBody` bruto retornado pela adquirente
- `ResponseTimeMs` da chamada HTTP externa
- Metadados de credenciais utilizadas (ao menos nomes/chaves, nunca valores sensíveis)
- Contexto operacional (`operation`, `endpoint`, `resourceId`, `resourceType`)

**Exemplo de uso do ApiLogService:**
```csharp
// No endpoint de criação
await apiLogService.LogAsync(new ApiLogInput
{
    Action = ApiLogAction.CreateCashout,
    Status = ApiLogStatus.Success,
    ResourceId = result.Payout.Id,
    ResourceType = ApiLogResourceType.Payout,
    StatusCode = 201
});
```

---
