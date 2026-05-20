using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using safefy_api_payment.Tests.Fixtures;
using safefy_api_payment.Tests.Models;
using safefy_api_payment.Interfaces;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Services;

namespace safefy_api_payment.Tests.Integration;

/// <summary>
/// Testes de integração cobrindo o fluxo completo do Ledger.
///
/// Verifica a correção dos saldos e totais históricos após cada operação financeira.
/// CleanupPaymentsAsync() zeroa accounts e KPIs, garantindo isolamento total entre testes.
///
/// Taxas configuradas no TestDataSeeder:
///   - PIX API: 1.5% (150 bps)  →  Amount=10000 → Fee=150, NetAmount=9850
///                                   Amount=5000  → Fee=75,  NetAmount=4925
///                                   Amount=9850  → Fee=147, NetAmount=9703
///   - Saque (Withdrawal): não configurado → Fee=0 → NetAmount=Amount
/// </summary>
public class LedgerFlowTests : IClassFixture<PaymentApiFactory>
{
    private readonly PaymentApiFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly JsonSerializerOptions _jsonRequestOptions;

    public LedgerFlowTests(PaymentApiFactory factory)
    {
        _factory = factory;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        _jsonRequestOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    // ===================================================================
    // GRUPO 1 — Pagamento: Complete
    // ===================================================================

    [Fact]
    public async Task Ledger_CompletePayment_AvailableIncreasesAndFeeIsCorrect()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var balance = await GetBalanceAsync(client);

        // Amount=10000, fee=1.5% → fee=150, net=9850
        payment.Fee.Should().Be(150);
        payment.NetAmount.Should().Be(9850);
        balance.Balance!.Available.Should().Be(9850);
        balance.Balance.Reserved.Should().Be(0);
        balance.Totals!.LifetimeVolume.Should().Be(10000);
        balance.Totals.LifetimePayouts.Should().Be(0);
        balance.Totals.LifetimeRefunds.Should().Be(0);
    }

    [Fact]
    public async Task Ledger_CompleteMultiplePayments_BalanceAccumulatesCorrectly()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var p1 = await CreatePaymentAsync(client, 10000);
        var p2 = await CreatePaymentAsync(client, 10000);
        var p3 = await CreatePaymentAsync(client, 10000);

        await SimulatePaymentAsync(client, p1.Id, "complete");
        await SimulatePaymentAsync(client, p2.Id, "complete");
        await SimulatePaymentAsync(client, p3.Id, "complete");

        var balance = await GetBalanceAsync(client);

        // 3 × netAmount=9850 = 29550
        balance.Balance!.Available.Should().Be(29550);
        balance.Balance.Reserved.Should().Be(0);
        balance.Totals!.LifetimeVolume.Should().Be(30000);
    }

    [Fact]
    public async Task Ledger_CompletePayments_DifferentAmounts_FeesAreCorrect()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        // Verifica cálculo de taxa para diferentes valores
        // fee = floor(amount * 150 / 10000)
        var cases = new[] { (amount: 5000L, expectedFee: 75L), (amount: 25000L, expectedFee: 375L), (amount: 100000L, expectedFee: 1500L) };

        foreach (var (amount, expectedFee) in cases)
        {
            var payment = await CreatePaymentAsync(client, amount);
            payment.Fee.Should().Be(expectedFee, because: $"fee for amount={amount} should be {expectedFee}");
            payment.NetAmount.Should().Be(amount - expectedFee);
        }
    }

    // ===================================================================
    // GRUPO 2 — Pagamento: Expire e Fail não afetam Available
    // ===================================================================

    [Fact]
    public async Task Ledger_ExpiredPayment_DoesNotAffectAvailableBalance()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        // Completa um pagamento para ter saldo
        var completed = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, completed.Id, "complete");

        // Expira outro pagamento — não deve alterar o saldo
        var expired = await CreatePaymentAsync(client, 8000);
        await SimulatePaymentAsync(client, expired.Id, "expire");

        var balance = await GetBalanceAsync(client);
        balance.Balance!.Available.Should().Be(9850);
        balance.Totals!.LifetimeVolume.Should().Be(10000);  // Apenas o completado conta
    }

    [Fact]
    public async Task Ledger_FailedPayment_DoesNotAffectAvailableBalance()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var completed = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, completed.Id, "complete");

        var failed = await CreatePaymentAsync(client, 5000);
        await SimulatePaymentAsync(client, failed.Id, "fail");

        var balance = await GetBalanceAsync(client);
        balance.Balance!.Available.Should().Be(9850);
        balance.Totals!.LifetimeVolume.Should().Be(10000);
    }

    // ===================================================================
    // GRUPO 3 — Pagamento: Estorno (Refund)
    // ===================================================================

    [Fact]
    public async Task Ledger_RefundPayment_DecreasesAvailableAndUpdatesLifetimeRefunds()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var afterComplete = await GetBalanceAsync(client);
        afterComplete.Balance!.Available.Should().Be(9850);

        await SimulatePaymentAsync(client, payment.Id, "refund");

        var afterRefund = await GetBalanceAsync(client);

        // Estorna netAmount=9850 do Available
        afterRefund.Balance!.Available.Should().Be(0);
        afterRefund.Balance.Reserved.Should().Be(0);

        // LifetimeRefunds += amount (gross=10000)
        afterRefund.Totals!.LifetimeRefunds.Should().Be(10000);

        // LifetimeVolume -= amount (net balance = 0)
        afterRefund.Totals.LifetimeVolume.Should().Be(0);
    }

    // ===================================================================
    // GRUPO 4 — Saque: Criação (Available → Reserved)
    // ===================================================================

    [Fact]
    public async Task Ledger_CreateCashout_TransfersAmountFromAvailableToReserved()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var beforeCashout = await GetBalanceAsync(client);
        beforeCashout.Balance!.Available.Should().Be(9850);
        beforeCashout.Balance.Reserved.Should().Be(0);

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();
        cashout!.Amount.Should().Be(5000);
        cashout.Fee.Should().Be(0);       // Withdrawal fee não configurado
        cashout.NetAmount.Should().Be(5000);

        var afterCashout = await GetBalanceAsync(client);
        afterCashout.Balance!.Available.Should().Be(4850);   // 9850 - 5000
        afterCashout.Balance.Reserved.Should().Be(5000);
    }

    [Fact]
    public async Task Ledger_CreateCashout_WithInsufficientBalance_ReturnsBadRequest()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        // Sem nenhum pagamento → Available = 0
        var response = await PostJsonAsync(client, "/v1/cashouts", new
        {
            Amount = 5000,
            PixKeyType = "Email",
            PixKey = "test@safefy.com"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var balance = await GetBalanceAsync(client);
        balance.Balance!.Available.Should().Be(0);
        balance.Balance.Reserved.Should().Be(0);
    }

    // ===================================================================
    // GRUPO 5 — Saque: Concluído (Reserved → PayoutsOut + LifetimePayouts)
    // ===================================================================

    [Fact]
    public async Task Ledger_CompleteCashout_ClearsReservedAndIncrementsLifetimePayouts()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();
        var cashoutId = cashout!.Id;
        await SimulateCashoutAsync(client, cashout!.Id, "complete");

        var balance = await GetBalanceAsync(client);

        // Reserved zerado, Available intacto (nunca voltou)
        balance.Balance!.Available.Should().Be(4850);
        balance.Balance.Reserved.Should().Be(0);

        // LifetimePayouts += netAmount do cashout (5000 com fee=0)
        balance.Totals!.LifetimePayouts.Should().Be(5000);
    }

    [Fact]
    public async Task Ledger_CompleteCashout_WithEntireNetAmount_BalanceReachesZero()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        // Saca exatamente o saldo disponível
        var cashout = await CreateCashoutAsync(client, 9850);
        cashout.Should().NotBeNull();
        await SimulateCashoutAsync(client, cashout!.Id, "complete");

        var balance = await GetBalanceAsync(client);

        balance.Balance!.Available.Should().Be(0);
        balance.Balance.Reserved.Should().Be(0);
        balance.Totals!.LifetimePayouts.Should().Be(9850);
    }

    // ===================================================================
    // GRUPO 6 — Saque: Falha e Rejeição (Reserved → Available restaurado)
    // ===================================================================

    [Fact]
    public async Task Ledger_FailCashout_RestoresFullAmountToAvailable()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();

        await SimulateCashoutAsync(client, cashout!.Id, "fail");

        var balance = await GetBalanceAsync(client);
        balance.Balance!.Available.Should().Be(9850);   // Restaurado ao estado pré-saque
        balance.Balance.Reserved.Should().Be(0);
        balance.Totals!.LifetimePayouts.Should().Be(0); // Saque falhou, não incrementa
    }

    [Fact]
    public async Task Ledger_RejectCashout_RestoresFullAmountToAvailable()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();

        await SimulateCashoutAsync(client, cashout!.Id, "reject");

        var balance = await GetBalanceAsync(client);
        balance.Balance!.Available.Should().Be(9850);
        balance.Balance.Reserved.Should().Be(0);
        balance.Totals!.LifetimePayouts.Should().Be(0);
    }

    // ===================================================================
    // GRUPO 7 — Fluxo Completo: Múltiplos Pagamentos e Saques
    // ===================================================================

    [Fact]
    public async Task Ledger_FullCycle_MultiplePaymentsAndCashouts_ConsistentBalance()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        // 3 pagamentos → Available = 3 × 9850 = 29550, LifetimeVolume = 30000
        var p1 = await CreatePaymentAsync(client, 10000);
        var p2 = await CreatePaymentAsync(client, 10000);
        var p3 = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, p1.Id, "complete");
        await SimulatePaymentAsync(client, p2.Id, "complete");
        await SimulatePaymentAsync(client, p3.Id, "complete");

        var afterPayments = await GetBalanceAsync(client);
        afterPayments.Balance!.Available.Should().Be(29550);

        // Primeiro saque: 10000 (fee=0, net=10000)
        var c1 = await CreateCashoutAsync(client, 10000);
        c1.Should().NotBeNull();
        await SimulateCashoutAsync(client, c1!.Id, "complete");

        var afterFirstCashout = await GetBalanceAsync(client);
        afterFirstCashout.Balance!.Available.Should().Be(19550);  // 29550 - 10000
        afterFirstCashout.Balance.Reserved.Should().Be(0);

        // Segundo saque: 15000 (fee=0, net=15000)  
        var c2 = await CreateCashoutAsync(client, 15000);
        c2.Should().NotBeNull();
        await SimulateCashoutAsync(client, c2!.Id, "complete");

        var afterSecondCashout = await GetBalanceAsync(client);
        afterSecondCashout.Balance!.Available.Should().Be(4550);  // 19550 - 15000
        afterSecondCashout.Balance.Reserved.Should().Be(0);

        // Totais acumulados
        afterSecondCashout.Totals!.LifetimeVolume.Should().Be(30000);
        afterSecondCashout.Totals.LifetimePayouts.Should().Be(25000);  // 10000 + 15000
        afterSecondCashout.Totals.LifetimeRefunds.Should().Be(0);
    }

    [Fact]
    public async Task Ledger_MixedScenario_SomeSucceedSomeFail_BalanceIsConsistent()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        // 2 pagamentos completados
        var p1 = await CreatePaymentAsync(client, 10000);
        var p2 = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, p1.Id, "complete");
        await SimulatePaymentAsync(client, p2.Id, "complete");

        // 1 pagamento expirado (não deve afetar saldo)
        var p3 = await CreatePaymentAsync(client, 5000);
        await SimulatePaymentAsync(client, p3.Id, "expire");

        var balanceCheck = await GetBalanceAsync(client);
        balanceCheck.Balance!.Available.Should().Be(19700);  // 2 × 9850
        balanceCheck.Totals!.LifetimeVolume.Should().Be(20000);

        // Saque que falha (deve restaurar)
        var c1 = await CreateCashoutAsync(client, 5000);
        c1.Should().NotBeNull();
        await SimulateCashoutAsync(client, c1!.Id, "fail");

        // Saque que conclui
        var c2 = await CreateCashoutAsync(client, 8000);
        c2.Should().NotBeNull();
        await SimulateCashoutAsync(client, c2!.Id, "complete");

        var finalBalance = await GetBalanceAsync(client);
        finalBalance.Balance!.Available.Should().Be(11700);  // 19700 - 8000
        finalBalance.Balance.Reserved.Should().Be(0);
        finalBalance.Totals!.LifetimePayouts.Should().Be(8000);
        finalBalance.Totals.LifetimeRefunds.Should().Be(0);
    }

    // ===================================================================
    // GRUPO 8 — Idempotência
    // ===================================================================

    [Fact]
    public async Task Ledger_DoubleCompleteSimulate_SecondAttemptFailsNoDoubleCredit()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var after1st = await GetBalanceAsync(client);
        after1st.Balance!.Available.Should().Be(9850);

        // Segunda simulação deve retornar 400 (já completado)
        var secondSimulate = await PostJsonAsync(client, $"/v1/transactions/{payment.Id}/simulate", new { Action = "complete" });
        secondSimulate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Saldo não deve ter dobrado
        var after2nd = await GetBalanceAsync(client);
        after2nd.Balance!.Available.Should().Be(9850);
        after2nd.Totals!.LifetimeVolume.Should().Be(10000);
    }

    [Fact]
    public async Task Ledger_DoubleCashoutComplete_SecondAttemptFailsBalanceUnchanged()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();
        await SimulateCashoutAsync(client, cashout!.Id, "complete");

        var after1st = await GetBalanceAsync(client);
        after1st.Balance!.Available.Should().Be(4850);
        after1st.Balance.Reserved.Should().Be(0);
        after1st.Totals!.LifetimePayouts.Should().Be(5000);

        // Segunda simulação deve retornar 400 (cashout já completado)
        var secondSimulate = await PostJsonAsync(client, $"/v1/cashouts/{cashout.Id}/simulate", new { Action = "complete" });
        secondSimulate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var after2nd = await GetBalanceAsync(client);
        after2nd.Balance!.Available.Should().Be(4850);      // Inalterado
        after2nd.Totals!.LifetimePayouts.Should().Be(5000); // Não duplicou
    }

    [Fact]
    public async Task Ledger_FailCashoutAfterCompletion_DoesNotInflateAvailableBalance()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();
        await SimulateCashoutAsync(client, cashout!.Id, "complete");

        var afterComplete = await GetBalanceAsync(client);
        afterComplete.Balance!.Available.Should().Be(4850);
        afterComplete.Balance.Reserved.Should().Be(0);
        afterComplete.Totals!.LifetimePayouts.Should().Be(5000);

        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(ApiEnvironment.Sandbox);
        using var scope = _factory.Services.CreateScope();
        var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();

        var ledgerResult = await ledgerService.RecordWithdrawalFailedAsync(
            TestDataSeeder.TestMerchantId,
            cashout.Id,
            TestDataSeeder.TestMerchantAcquirerId,
            cashout.Amount,
            cashout.Fee,
            "forced failure after completion");

        ledgerResult.Success.Should().BeFalse();
        ledgerResult.ErrorMessage.Should().NotBeNull();

        var afterInvalidFail = await GetBalanceAsync(client);
        afterInvalidFail.Balance!.Available.Should().Be(4850);
        afterInvalidFail.Balance.Reserved.Should().Be(0);
        afterInvalidFail.Totals!.LifetimePayouts.Should().Be(5000);
    }

    [Fact]
    public async Task Ledger_NonTerminalWebhookStatus_DoesNotChangeBalance()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();
        var client = await CreateAuthenticatedClientAsync();

        var payment = await CreatePaymentAsync(client, 10000);
        await SimulatePaymentAsync(client, payment.Id, "complete");

        var cashout = await CreateCashoutAsync(client, 5000);
        cashout.Should().NotBeNull();
        var cashoutId = cashout!.Id;

        var beforeWebhook = await GetBalanceAsync(client);
        beforeWebhook.Balance!.Available.Should().Be(4850);
        beforeWebhook.Balance.Reserved.Should().Be(5000);

        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(ApiEnvironment.Sandbox);
        using var scope = _factory.Services.CreateScope();
        var cashoutService = scope.ServiceProvider.GetRequiredService<ICashoutService>();

        var result = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.ActivePayments,
                TxId = $"PAYOUT{cashoutId:N}".ToUpperInvariant()[..36],
                Status = PayoutStatus.Processing,
                ExternalId = $"PAYOUT{cashoutId}"
            });

        result.Success.Should().BeTrue();
        result.PayoutId.Should().BeNull();

        var afterWebhook = await GetBalanceAsync(client);
        afterWebhook.Balance!.Available.Should().Be(4850);
        afterWebhook.Balance.Reserved.Should().Be(5000);
    }

    // ===================================================================
    // Métodos Auxiliares
    // ===================================================================

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private async Task<string> GetAccessTokenAsync(HttpClient client)
    {
        return await _factory.GetOrCacheTokenAsync(client);
    }

    private async Task<BalanceData> GetBalanceAsync(HttpClient client)
    {
        var response = await client.GetAsync("/v1/balance");
        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, because: $"Get balance failed: {content}");
        var result = JsonSerializer.Deserialize<GetBalanceResponse>(content, _jsonOptions);
        result!.Data.Should().NotBeNull(because: $"Balance data was null. Response: {content}");
        return result.Data!;
    }

    private async Task<PaymentData> CreatePaymentAsync(HttpClient client, long amount)
    {
        var request = new
        {
            Method = "pix",
            Amount = amount,
            Currency = "BRL",
            ExternalId = $"ledger_test_{Guid.NewGuid():N}"
        };
        var response = await PostJsonAsync(client, "/v1/transactions", request);
        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, because: $"Create payment failed: {content}");
        var result = JsonSerializer.Deserialize<PaymentResponse>(content, _jsonOptions);
        result!.Data.Should().NotBeNull();
        return result.Data!;
    }

    private async Task SimulatePaymentAsync(HttpClient client, Guid paymentId, string action)
    {
        var response = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", new { Action = action });
        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, because: $"Simulate payment '{action}' failed: {content}");
    }

    private async Task<CashoutData?> CreateCashoutAsync(HttpClient client, long amount)
    {
        var request = new
        {
            Amount = amount,
            PixKeyType = "Email",
            PixKey = "test@safefy.com"
        };
        var response = await PostJsonAsync(client, "/v1/cashouts", request);
        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, because: $"Create cashout failed: {content}");
        var result = JsonSerializer.Deserialize<CreateCashoutResponse>(content, _jsonOptions);
        return result?.Data;
    }

    private async Task SimulateCashoutAsync(HttpClient client, Guid cashoutId, string action)
    {
        var response = await PostJsonAsync(client, $"/v1/cashouts/{cashoutId}/simulate", new { Action = action.ToLower() });
        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, because: $"Simulate cashout '{action}' failed: {content}");
    }

    private async Task<HttpResponseMessage> PostJsonAsync<T>(HttpClient client, string url, T content)
    {
        var jsonContent = JsonContent.Create(content, options: _jsonRequestOptions);
        return await client.PostAsync(url, jsonContent);
    }
}
