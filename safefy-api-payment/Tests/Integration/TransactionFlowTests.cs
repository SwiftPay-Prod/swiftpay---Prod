using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using safefy_api_payment.Tests.Fixtures;
using safefy_api_payment.Tests.Models;

namespace safefy_api_payment.Tests.Integration;

/// <summary>
/// Testes de integração para o fluxo completo de transações.
/// Testa criação, consulta, simulação e todos os possíveis status.
/// </summary>
public class TransactionFlowTests : IClassFixture<PaymentApiFactory>
{
    private readonly PaymentApiFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly JsonSerializerOptions _jsonRequestOptions;

    public TransactionFlowTests(PaymentApiFactory factory)
    {
        _factory = factory;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        _jsonRequestOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    private async Task<HttpResponseMessage> PostJsonAsync<T>(HttpClient client, string url, T content)
    {
        var jsonContent = JsonContent.Create(content, options: _jsonRequestOptions);
        return await client.PostAsync(url, jsonContent);
    }

    private Task<string> GetAccessTokenAsync(HttpClient client)
        => _factory.GetOrCacheTokenAsync(client);

    // ===================================================================
    // Testes de Autenticação
    // ===================================================================

    [Fact]
    public async Task Auth_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();

        var tokenRequest = new
        {
            GrantType = "client_credentials",
            PublicKey = TestDataSeeder.TestClientId,
            SecretKey = TestDataSeeder.TestClientSecret
        };

        // Act
        var response = await client.PostAsJsonAsync("/v1/auth/token", tokenRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var tokenResult = JsonSerializer.Deserialize<TokenResponse>(content, _jsonOptions);
        tokenResult.Should().NotBeNull();
        tokenResult!.Data.Should().NotBeNull();
        tokenResult.Data!.AccessToken.Should().NotBeNullOrEmpty();
        tokenResult.Data.TokenType.Should().Be("Bearer");
        tokenResult.Data.ExpiresIn.Should().BeGreaterThan(0);
        tokenResult.Data.Environment.Should().Be("Sandbox");
    }

    [Fact]
    public async Task Auth_WithInvalidCredentials_ShouldReturn401()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();

        var tokenRequest = new
        {
            GrantType = "client_credentials",
            PublicKey = "invalid_client",
            SecretKey = "invalid_secret"
        };

        // Act
        var response = await client.PostAsJsonAsync("/v1/auth/token", tokenRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ===================================================================
    // Testes de Criação de Transação PIX
    // ===================================================================

    [Fact]
    public async Task CreateTransaction_Pix_WithValidData_ShouldReturnPendingPayment()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 10000, // R$ 100,00
            Currency = "BRL",
            Description = "Teste de pagamento PIX",
            ExternalId = $"test_{Guid.NewGuid():N}",
            PixExpirationMinutes = 30
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created, 
            because: $"Create payment failed: {content}");

        var paymentResult = JsonSerializer.Deserialize<PaymentResponse>(content, _jsonOptions);
        paymentResult.Should().NotBeNull();
        paymentResult!.Data.Should().NotBeNull();

        var payment = paymentResult.Data!;
        payment.Id.Should().NotBeEmpty();
        payment.Amount.Should().Be(10000);
        payment.Status.Should().Be("Pending");
        payment.Environment.Should().Be("Sandbox");
        payment.Method.Should().Be("Pix");
        payment.Currency.Should().Be("BRL");
        payment.Fee.Should().BeGreaterThan(0);
        payment.NetAmount.Should().BeLessThan(payment.Amount);

        // PIX Data
        payment.Pix.Should().NotBeNull();
        payment.Pix!.TxId.Should().NotBeNullOrEmpty();
        payment.Pix.QrCode.Should().NotBeNullOrEmpty();
        payment.Pix.CopyAndPaste.Should().NotBeNullOrEmpty();
        payment.Pix.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithMinimumAmount_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 100, // R$ 1,00 (mínimo da adquirente)
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created, 
            because: $"Response: {content}");

        var paymentResult = JsonSerializer.Deserialize<PaymentResponse>(content, _jsonOptions);
        paymentResult!.Data!.Amount.Should().Be(100);
        paymentResult.Data.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithMaximumAmount_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 100000000, // R$ 1.000.000,00 (máximo)
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created, 
            because: $"Response: {content}");
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithZeroAmount_ShouldReturn400()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 0,
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithExceedingAmount_ShouldReturn400()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 100000001, // Acima do limite
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithDuplicateExternalId_ShouldReturn409()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var externalId = $"duplicate_{Guid.NewGuid():N}";
        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL",
            ExternalId = externalId
        };

        // Primeiro pagamento - deve sucesso
        var firstResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Segundo pagamento com mesmo external_id - deve falhar
        var secondResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithCustomer_ShouldLinkCustomer()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 15000,
            Currency = "BRL",
            CustomerId = TestDataSeeder.TestCustomerId
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created, 
            because: $"Response: {content}");

        var paymentResult = JsonSerializer.Deserialize<PaymentResponse>(content, _jsonOptions);
        paymentResult!.Data!.CustomerId.Should().Be(TestDataSeeder.TestCustomerId);
    }

    [Fact]
    public async Task CreateTransaction_Pix_WithInvalidCustomer_ShouldReturn400()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 15000,
            Currency = "BRL",
            CustomerId = Guid.NewGuid() // Customer não existe
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTransaction_WithoutToken_ShouldReturn401()
    {
        // Arrange
        var client = _factory.CreateClient();

        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ===================================================================
    // Testes de Métodos de Pagamento Não Disponíveis
    // ===================================================================

    [Fact]
    public async Task CreateTransaction_CreditCard_ShouldReturn400_NotAvailable()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "credit_card",
            Amount = 10000,
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTransaction_Boleto_ShouldReturn400_NotAvailable()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "boleto",
            Amount = 10000,
            Currency = "BRL"
        };

        // Act
        var response = await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ===================================================================
    // Testes de Consulta de Transação
    // ===================================================================

    [Fact]
    public async Task GetTransaction_ExistingTransaction_ShouldReturnData()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar um pagamento primeiro
        var createRequest = new
        {
            Method = "pix",
            Amount = 8000,
            Currency = "BRL",
            Description = "Pagamento para consulta"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Act - Consultar o pagamento
        var getResponse = await client.GetAsync($"/v1/transactions/{paymentId}");
        var content = await getResponse.Content.ReadAsStringAsync();

        // Assert
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var paymentResult = JsonSerializer.Deserialize<PaymentResponse>(content, _jsonOptions);
        paymentResult.Should().NotBeNull();
        paymentResult!.Data.Should().NotBeNull();
        paymentResult.Data!.Id.Should().Be(paymentId);
        paymentResult.Data.Amount.Should().Be(8000);
        paymentResult.Data.Description.Should().Be("Pagamento para consulta");
    }

    [Fact]
    public async Task GetTransaction_NonExistingTransaction_ShouldReturn404()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var fakeId = Guid.NewGuid();

        // Act
        var response = await client.GetAsync($"/v1/transactions/{fakeId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ===================================================================
    // Testes de Simulação de Transação (Status)
    // ===================================================================

    [Fact]
    public async Task SimulateTransaction_Complete_ShouldChangeStatusToCompleted()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar pagamento pendente
        var createRequest = new
        {
            Method = "pix",
            Amount = 25000,
            Currency = "BRL"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;
        createResult.Data.Status.Should().Be("Pending");

        // Act - Simular pagamento completo
        var simulateRequest = new { Action = "complete" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", simulateRequest);
        var content = await simulateResponse.Content.ReadAsStringAsync();

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var simulateResult = JsonSerializer.Deserialize<SimulateTransactionResponse>(content, _jsonOptions);
        simulateResult.Should().NotBeNull();
        simulateResult!.Data.Should().NotBeNull();
        simulateResult.Data!.Status.Should().Be("Completed");
        simulateResult.Data.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task SimulateTransaction_Expire_ShouldChangeStatusToExpired()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar pagamento pendente
        var createRequest = new
        {
            Method = "pix",
            Amount = 12000,
            Currency = "BRL"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Act - Simular expiração
        var simulateRequest = new { Action = "expire" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", simulateRequest);
        var content = await simulateResponse.Content.ReadAsStringAsync();

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var simulateResult = JsonSerializer.Deserialize<SimulateTransactionResponse>(content, _jsonOptions);
        simulateResult.Should().NotBeNull();
        simulateResult!.Data.Should().NotBeNull();
        simulateResult.Data!.Status.Should().Be("Expired");
    }

    [Fact]
    public async Task SimulateTransaction_Fail_ShouldChangeStatusToFailed()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar pagamento pendente
        var createRequest = new
        {
            Method = "pix",
            Amount = 12000,
            Currency = "BRL"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Act - Simular falha
        var simulateRequest = new { Action = "fail" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", simulateRequest);
        var content = await simulateResponse.Content.ReadAsStringAsync();

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var simulateResult = JsonSerializer.Deserialize<SimulateTransactionResponse>(content, _jsonOptions);
        simulateResult.Should().NotBeNull();
        simulateResult!.Data.Should().NotBeNull();
        simulateResult.Data!.Status.Should().Be("Failed");
    }

    [Fact]
    public async Task SimulateTransaction_AlreadyCompleted_ShouldReturn400()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar e completar pagamento
        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Completar o pagamento
        await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", new { Action = "complete" });

        // Act - Tentar simular novamente
        var simulateRequest = new { Action = "complete" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", simulateRequest);

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SimulateTransaction_AlreadyExpired_ShouldReturn400()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar e expirar pagamento
        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Expirar o pagamento
        await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", new { Action = "expire" });

        // Act - Tentar simular completar
        var simulateRequest = new { Action = "complete" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", simulateRequest);

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SimulateTransaction_InvalidAction_ShouldReturn400()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Act
        var simulateRequest = new { Action = "invalid_action" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", simulateRequest);

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SimulateTransaction_NonExistingTransaction_ShouldReturn404()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var fakeId = Guid.NewGuid();

        // Act
        var simulateRequest = new { Action = "complete" };
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{fakeId}/simulate", simulateRequest);

        // Assert
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ===================================================================
    // Teste de Fluxo Completo
    // ===================================================================

    [Fact]
    public async Task FullTransactionFlow_FromCreationToCompletion_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // ---------------------------------------------------------------
        // Step 1: Criar transação PIX
        // ---------------------------------------------------------------
        var createRequest = new
        {
            Method = "pix",
            Amount = 50000, // R$ 500,00
            Currency = "BRL",
            Description = "Pagamento de teste - Fluxo completo",
            ExternalId = $"order_{Guid.NewGuid():N}",
            Metadata = "{\"order_id\": 12345}"
        };

        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        // Validar estado inicial
        createResult.Data.Status.Should().Be("Pending");
        createResult.Data.Amount.Should().Be(50000);
        createResult.Data.Pix.Should().NotBeNull();
        createResult.Data.Pix!.QrCode.Should().NotBeNullOrEmpty();

        // ---------------------------------------------------------------
        // Step 2: Consultar transação (ainda pendente)
        // ---------------------------------------------------------------
        var getResponse1 = await client.GetAsync($"/v1/transactions/{paymentId}");
        getResponse1.StatusCode.Should().Be(HttpStatusCode.OK);

        var getResult1 = await getResponse1.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        getResult1!.Data!.Status.Should().Be("Pending");
        getResult1.Data.CompletedAt.Should().BeNull();

        // ---------------------------------------------------------------
        // Step 3: Simular pagamento (webhook da adquirente)
        // ---------------------------------------------------------------
        var simulateResponse = await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", new { Action = "complete" });
        simulateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var simulateResult = await simulateResponse.Content.ReadFromJsonAsync<SimulateTransactionResponse>(_jsonOptions);
        simulateResult!.Data!.Status.Should().Be("Completed");

        // ---------------------------------------------------------------
        // Step 4: Consultar transação após conclusão
        // ---------------------------------------------------------------
        var getResponse2 = await client.GetAsync($"/v1/transactions/{paymentId}");
        getResponse2.StatusCode.Should().Be(HttpStatusCode.OK);

        var getResult2 = await getResponse2.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        
        // Validar estado final
        getResult2!.Data!.Status.Should().Be("Completed");
        getResult2.Data.CompletedAt.Should().NotBeNull();
        
        // Validar cálculo de taxas
        getResult2.Data.Fee.Should().BeGreaterThan(0);
        getResult2.Data.NetAmount.Should().Be(getResult2.Data.Amount - getResult2.Data.Fee);
    }

    // ===================================================================
    // Testes de Cálculo de Taxas
    // ===================================================================

    [Fact]
    public async Task TransactionFee_IsCalculatedCorrectly()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var amounts = new[] { 1000, 10000, 50000, 100000 };

        foreach (var amount in amounts)
        {
            var createRequest = new
            {
                Method = "pix",
                Amount = amount,
                Currency = "BRL"
            };

            // Act
            var response = await PostJsonAsync(client, "/v1/transactions", createRequest);
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            
            var result = await response.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);

            // Assert
            result!.Data!.Fee.Should().BeGreaterThan(0, $"Fee should be calculated for amount {amount}");
            result.Data.NetAmount.Should().Be(result.Data.Amount - result.Data.Fee);
            result.Data.NetAmount.Should().BePositive();
        }
    }

    // ===================================================================
    // Testes de Listagem de Transações
    // ===================================================================

    [Fact]
    public async Task ListTransactions_ShouldReturnPaginatedResults()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar alguns pagamentos para listar
        for (int i = 0; i < 3; i++)
        {
            var createRequest = new
            {
                Method = "pix",
                Amount = 1000 * (i + 1),
                Currency = "BRL"
            };
            await PostJsonAsync(client, "/v1/transactions", createRequest);
        }

        // Act
        var response = await client.GetAsync("/v1/transactions?page=1&pageSize=10");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var result = JsonSerializer.Deserialize<PaginatedPaymentResponse>(content, _jsonOptions);
        result.Should().NotBeNull();
        result!.Data.Should().NotBeNull();
        result.Data!.Items.Should().NotBeNull();
        result.Data.Items!.Count.Should().BeGreaterThanOrEqualTo(3);
        result.Data.TotalItems.Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public async Task ListTransactions_WithStatusFilter_ShouldReturnFilteredResults()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar pagamento e completar
        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL"
        };
        var createResponse = await PostJsonAsync(client, "/v1/transactions", createRequest);
        var createResult = await createResponse.Content.ReadFromJsonAsync<PaymentResponse>(_jsonOptions);
        var paymentId = createResult!.Data!.Id;

        await PostJsonAsync(client, $"/v1/transactions/{paymentId}/simulate", new { Action = "complete" });

        // Act - Filtrar por status completed
        var response = await client.GetAsync("/v1/transactions?status=Completed");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var result = JsonSerializer.Deserialize<PaginatedPaymentResponse>(content, _jsonOptions);
        result!.Data!.Items.Should().OnlyContain(p => p.Status == "Completed");
    }

    [Fact]
    public async Task ListTransactions_WithMethodFilter_ShouldReturnOnlyPixTransactions()
    {
        // Arrange
        var client = _factory.CreateClient();
        await _factory.SeedTestDataAsync();
        var token = await GetAccessTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Criar pagamento PIX
        var createRequest = new
        {
            Method = "pix",
            Amount = 5000,
            Currency = "BRL"
        };
        await PostJsonAsync(client, "/v1/transactions", createRequest);

        // Act - Filtrar por método pix
        var response = await client.GetAsync("/v1/transactions?method=Pix");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"Response: {content}");

        var result = JsonSerializer.Deserialize<PaginatedPaymentResponse>(content, _jsonOptions);
        result!.Data!.Items.Should().OnlyContain(p => p.Method == "Pix");
    }

    [Fact]
    public async Task ListTransactions_WithoutToken_ShouldReturn401()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/v1/transactions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
