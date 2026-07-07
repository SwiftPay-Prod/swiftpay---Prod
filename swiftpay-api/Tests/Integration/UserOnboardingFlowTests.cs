using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using swiftpay_api.Tests.Fixtures;
using swiftpay_api.Tests.Models;

namespace swiftpay_api.Tests.Integration;

public class UserOnboardingFlowTests : IClassFixture<SafefyApiFactory>
{
    private readonly SafefyApiFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public UserOnboardingFlowTests(SafefyApiFactory factory)
    {
        _factory = factory;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    
    
    
    
    [Fact]
    public async Task CompleteUserOnboardingFlow_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // ---------------------------------------------------------------
        // Step 1: Criar conta de usuário
        // ---------------------------------------------------------------
        var signUpRequest = new
        {
            name = "Maria Santos",
            email = "maria@empresa.com.br",
            password = "Senha@123"
        };

        var signUpResponse = await client.PostAsJsonAsync("/v1/auth/signup", signUpRequest);
        var signUpContent = await signUpResponse.Content.ReadAsStringAsync();
        signUpResponse.StatusCode.Should().BeOneOf([HttpStatusCode.OK, HttpStatusCode.Created], 
            $"SignUp failed with: {signUpContent}");

        var signUpResult = await signUpResponse.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        signUpResult.Should().NotBeNull();
        signUpResult!.Data.Should().NotBeNull();

        // ---------------------------------------------------------------
        // Step 2: Fazer login para obter o token
        // ---------------------------------------------------------------
        var signInRequest = new
        {
            email = "maria@empresa.com.br",
            password = "Senha@123"
        };

        var signInResponse = await client.PostAsJsonAsync("/v1/auth/signin", signInRequest);
        var signInContent = await signInResponse.Content.ReadAsStringAsync();
        signInResponse.StatusCode.Should().Be(HttpStatusCode.OK, 
            because: $"SignIn failed with: {signInContent}");

        var signInResult = JsonSerializer.Deserialize<AuthResponse>(signInContent, _jsonOptions);
        signInResult.Should().NotBeNull(because: $"Could not deserialize: {signInContent}");
        signInResult!.Data.Should().NotBeNull(because: $"Data is null in: {signInContent}");
        signInResult.Data.Should().NotBeNull(because: $"Data.Data is null in: {signInContent}");
        signInResult.Data!.Tokens.Should().NotBeNull(because: $"Tokens is null in: {signInContent}");
        signInResult.Data!.Tokens!.AccessToken.Should().NotBeNullOrEmpty(because: $"Token is null in: {signInContent}");

        var userToken = signInResult.Data.Tokens.AccessToken;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        // ---------------------------------------------------------------
        // Step 3: Criar uma nova organização (Merchant)
        // ---------------------------------------------------------------
        var createMerchantRequest = new
        {
            name = "Empresa da Maria"
        };

        var createMerchantResponse = await client.PostAsJsonAsync("/v1/merchant", createMerchantRequest);
        var createMerchantContent = await createMerchantResponse.Content.ReadAsStringAsync();
        createMerchantResponse.StatusCode.Should().Be(HttpStatusCode.Created, 
            because: $"CreateMerchant failed. Token: {userToken?.Substring(0, Math.Min(20, userToken?.Length ?? 0))}... Response: {createMerchantContent}");

        var createMerchantResult = JsonSerializer.Deserialize<MerchantResponse>(createMerchantContent, _jsonOptions);
        createMerchantResult.Should().NotBeNull();
        createMerchantResult!.Data.Should().NotBeNull();
        createMerchantResult.Data.Should().NotBeNull();

        var merchantId = createMerchantResult.Data!.Id;
        merchantId.Should().NotBeEmpty();

        // ---------------------------------------------------------------
        // Step 4: Preencher dados do onboarding
        // ---------------------------------------------------------------
        
        // Step 4.1: Atualizar informações básicas
        var updateBasicInfoRequest = new
        {
            name = "Empresa da Maria LTDA",
            email = "contato@empresadamaria.com.br",
            whatsApp = "+5511988887777"
        };

        var updateBasicInfoResponse = await client.PatchAsJsonAsync($"/v1/merchant/{merchantId}", updateBasicInfoRequest);
        updateBasicInfoResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Step 4.2: Atualizar endereço
        var updateAddressRequest = new
        {
            address = "Rua das Flores",
            addressNumber = "123",
            addressComplement = "Sala 45",
            neighborhood = "Centro",
            city = "São Paulo",
            state = "SP",
            postalCode = "01234-567",
            country = "Brasil"
        };

        var updateAddressResponse = await client.PatchAsJsonAsync($"/v1/merchant/{merchantId}", updateAddressRequest);
        updateAddressResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Step 4.3: Preencher dados do KYC/Documentos
        var updateKycRequest = new
        {
            legalName = "Empresa da Maria LTDA",
            documentType = "CNPJ",
            documentNumber = "12.345.678/0001-90",
            identityDocumentType = "RG",
            identityDocumentNumber = "12.345.678-9",
            operationType = "White",
            businessDescription = "Loja de roupas e acessórios femininos",
            website = "https://empresadamaria.com.br",
            expectedMonthlyVolume = 25000.00
        };

        var updateKycResponse = await client.PatchAsJsonAsync($"/v1/merchant/{merchantId}", updateKycRequest);
        updateKycResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // ---------------------------------------------------------------
        // Step 5: Submeter para análise
        // ---------------------------------------------------------------
        var submitResponse = await client.PostAsJsonAsync($"/v1/merchant/{merchantId}/submit", new { });
        submitResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var submitResult = await submitResponse.Content.ReadFromJsonAsync<MerchantResponse>(_jsonOptions);
        submitResult.Should().NotBeNull();
        submitResult!.Data.Should().NotBeNull();
        submitResult.Data.Should().NotBeNull();
        submitResult.Data!.KycStatus.Should().Be("Pending");

        // ---------------------------------------------------------------
        // Step 6: Login como Admin e aprovar o cadastro
        // ---------------------------------------------------------------
        
        // Step 6.1: Login como admin padrão do sistema
        var adminSignInRequest = new
        {
            email = "admin@swiftpay.com.br",
            password = "Admin@123"
        };

        var adminSignInResponse = await client.PostAsJsonAsync("/v1/auth/signin", adminSignInRequest);
        adminSignInResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var adminSignInResult = await adminSignInResponse.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        adminSignInResult.Should().NotBeNull();
        adminSignInResult!.Data.Should().NotBeNull();
        adminSignInResult.Data.Should().NotBeNull();
        adminSignInResult.Data!.Tokens.Should().NotBeNull();
        adminSignInResult.Data!.Tokens!.AccessToken.Should().NotBeNullOrEmpty();

        var adminToken = adminSignInResult.Data.Tokens.AccessToken;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // Step 6.2: Listar organizações pendentes
        var listMerchantsResponse = await client.GetAsync("/v1/admin/merchants?page=1&pageSize=10&kycStatus=Pending");
        listMerchantsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Step 6.3: Aprovar o cadastro da organização
        var evaluateRequest = new
        {
            status = "Approved",
            reason = "Documentação completa e válida."
        };

        var evaluateResponse = await client.PostAsJsonAsync($"/v1/admin/merchant/{merchantId}/evaluate", evaluateRequest);
        evaluateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var evaluateResult = await evaluateResponse.Content.ReadFromJsonAsync<MerchantResponse>(_jsonOptions);
        evaluateResult.Should().NotBeNull();
        evaluateResult!.Data.Should().NotBeNull();
        evaluateResult.Data.Should().NotBeNull();
        evaluateResult.Data!.KycStatus.Should().Be("Approved");
        evaluateResult.Data!.Status.Should().Be("Active");

        // ---------------------------------------------------------------
        // Step 7: Gerar credenciais de API
        // ---------------------------------------------------------------
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        var createSandboxCredentialsRequest = new
        {
            environment = "Sandbox"
        };

        var createSandboxCredentialsResponse = await client.PostAsJsonAsync($"/v1/merchant/{merchantId}/api-credentials", createSandboxCredentialsRequest);
        createSandboxCredentialsResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var sandboxCredentialsResult = await createSandboxCredentialsResponse.Content.ReadFromJsonAsync<ApiCredentialResponse>(_jsonOptions);
        sandboxCredentialsResult.Should().NotBeNull();
        sandboxCredentialsResult!.Data.Should().NotBeNull();
        sandboxCredentialsResult.Data.Should().NotBeNull();
        sandboxCredentialsResult.Data!.ClientId.Should().NotBeNullOrEmpty();
        sandboxCredentialsResult.Data!.ClientSecret.Should().NotBeNullOrEmpty();
        sandboxCredentialsResult.Data!.Environment.Should().Be("Sandbox");
    }

    
    
    
    
    [Fact]
    public async Task UserOnboardingFlow_WithComplementRequest_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // ---------------------------------------------------------------
        // Step 1: Criar usuário e fazer login
        // ---------------------------------------------------------------
        var signUpRequest = new { name = "João Silva", email = "joao@empresa.com.br", password = "Senha@123" };
        var signUpResponse = await client.PostAsJsonAsync("/v1/auth/signup", signUpRequest);
        signUpResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var signInRequest = new { email = "joao@empresa.com.br", password = "Senha@123" };
        var signInResponse = await client.PostAsJsonAsync("/v1/auth/signin", signInRequest);
        signInResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var signInResult = await signInResponse.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        signInResult.Should().NotBeNull();
        signInResult!.Data.Should().NotBeNull();
        signInResult.Data.Should().NotBeNull();
        
        var userToken = signInResult!.Data!.Tokens!.AccessToken;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        // ---------------------------------------------------------------
        // Step 2: Criar merchant e preencher dados
        // ---------------------------------------------------------------
        var createMerchantResponse = await client.PostAsJsonAsync("/v1/merchant", new { name = "Empresa do João" });
        createMerchantResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createMerchantResult = await createMerchantResponse.Content.ReadFromJsonAsync<MerchantResponse>(_jsonOptions);
        createMerchantResult.Should().NotBeNull();
        createMerchantResult!.Data.Should().NotBeNull();
        createMerchantResult.Data.Should().NotBeNull();
        
        var merchantId = createMerchantResult!.Data!.Id;

        var updateAllRequest = new
        {
            name = "Empresa do João LTDA",
            email = "contato@empresadojoao.com.br",
            whatsApp = "+5511999998888",
            address = "Av. Brasil",
            addressNumber = "500",
            neighborhood = "Centro",
            city = "Rio de Janeiro",
            state = "RJ",
            postalCode = "20000-000",
            country = "Brasil",
            legalName = "Empresa do João LTDA",
            documentType = "CNPJ",
            documentNumber = "98.765.432/0001-10",
            identityDocumentType = "CNH",
            identityDocumentNumber = "123456789",
            operationType = "Black",
            businessDescription = "Consultoria empresarial",
            website = "https://empresadojoao.com.br",
            expectedMonthlyVolume = 100000.00
        };
        var updateResponse = await client.PatchAsJsonAsync($"/v1/merchant/{merchantId}", updateAllRequest);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // ---------------------------------------------------------------
        // Step 3: Submeter para análise
        // ---------------------------------------------------------------
        var submitResponse = await client.PostAsJsonAsync($"/v1/merchant/{merchantId}/submit", new { });
        submitResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // ---------------------------------------------------------------
        // Step 4: Admin solicita complemento
        // ---------------------------------------------------------------
        var adminSignInResponse = await client.PostAsJsonAsync("/v1/auth/signin", new { email = "admin@swiftpay.com.br", password = "Admin@123" });
        adminSignInResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var adminSignInResult = await adminSignInResponse.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        adminSignInResult.Should().NotBeNull();
        adminSignInResult!.Data.Should().NotBeNull();
        adminSignInResult.Data.Should().NotBeNull();
        
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSignInResult!.Data!.Tokens!.AccessToken);

        var complementRequest = new
        {
            status = "Complement",
            reason = "Precisamos de documentos adicionais.",
            pendingItems = new[]
            {
                new
                {
                    type = "Document",
                    title = "Comprovante de endereço",
                    description = "Por favor, envie um comprovante de endereço com data inferior a 3 meses."
                }
            }
        };

        var complementResponse = await client.PostAsJsonAsync($"/v1/admin/merchant/{merchantId}/evaluate", complementRequest);
        complementResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var complementResult = await complementResponse.Content.ReadFromJsonAsync<MerchantResponse>(_jsonOptions);
        complementResult.Should().NotBeNull();
        complementResult!.Data.Should().NotBeNull();
        complementResult.Data.Should().NotBeNull();
        complementResult!.Data!.KycStatus.Should().Be("Complement");
    }

    
    
    
    
    [Fact]
    public async Task UserOnboardingFlow_WithRejection_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // ---------------------------------------------------------------
        // Step 1: Criar usuário e fazer login
        // ---------------------------------------------------------------
        var signUpRequest = new { name = "Ana Costa", email = "ana@empresa.com.br", password = "Senha@123" };
        var signUpResponse = await client.PostAsJsonAsync("/v1/auth/signup", signUpRequest);
        signUpResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var signInRequest = new { email = "ana@empresa.com.br", password = "Senha@123" };
        var signInResponse = await client.PostAsJsonAsync("/v1/auth/signin", signInRequest);
        signInResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var signInResult = await signInResponse.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        signInResult.Should().NotBeNull();
        signInResult!.Data.Should().NotBeNull();
        signInResult.Data.Should().NotBeNull();
        
        var userToken = signInResult!.Data!.Tokens!.AccessToken;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        // ---------------------------------------------------------------
        // Step 2: Criar merchant e preencher dados
        // ---------------------------------------------------------------
        var createMerchantResponse = await client.PostAsJsonAsync("/v1/merchant", new { name = "Empresa da Ana" });
        createMerchantResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createMerchantResult = await createMerchantResponse.Content.ReadFromJsonAsync<MerchantResponse>(_jsonOptions);
        createMerchantResult.Should().NotBeNull();
        createMerchantResult!.Data.Should().NotBeNull();
        createMerchantResult.Data.Should().NotBeNull();
        
        var merchantId = createMerchantResult!.Data!.Id;

        var updateAllRequest = new
        {
            name = "Empresa da Ana LTDA",
            email = "contato@empresadaana.com.br",
            whatsApp = "+5511977776666",
            address = "Rua do Comércio",
            addressNumber = "200",
            neighborhood = "Vila Mariana",
            city = "São Paulo",
            state = "SP",
            postalCode = "04000-000",
            country = "Brasil",
            legalName = "Empresa da Ana LTDA",
            documentType = "CNPJ",
            documentNumber = "11.222.333/0001-44",
            identityDocumentType = "RG",
            identityDocumentNumber = "99.888.777-6",
            operationType = "White",
            businessDescription = "Loja de artesanato",
            expectedMonthlyVolume = 15000.00
        };
        var updateResponse = await client.PatchAsJsonAsync($"/v1/merchant/{merchantId}", updateAllRequest);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // ---------------------------------------------------------------
        // Step 3: Submeter para análise
        // ---------------------------------------------------------------
        var submitResponse = await client.PostAsJsonAsync($"/v1/merchant/{merchantId}/submit", new { });
        submitResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // ---------------------------------------------------------------
        // Step 4: Admin rejeita o cadastro
        // ---------------------------------------------------------------
        var adminSignInResponse = await client.PostAsJsonAsync("/v1/auth/signin", new { email = "admin@swiftpay.com.br", password = "Admin@123" });
        adminSignInResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var adminSignInResult = await adminSignInResponse.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        adminSignInResult.Should().NotBeNull();
        adminSignInResult!.Data.Should().NotBeNull();
        adminSignInResult.Data.Should().NotBeNull();
        
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSignInResult!.Data!.Tokens!.AccessToken);

        var rejectRequest = new
        {
            status = "Rejected",
            reason = "Documentos ilegíveis ou inválidos."
        };

        var rejectResponse = await client.PostAsJsonAsync($"/v1/admin/merchant/{merchantId}/evaluate", rejectRequest);
        rejectResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var rejectResult = await rejectResponse.Content.ReadFromJsonAsync<MerchantResponse>(_jsonOptions);
        rejectResult.Should().NotBeNull();
        rejectResult!.Data.Should().NotBeNull();
        rejectResult.Data.Should().NotBeNull();
        rejectResult!.Data!.KycStatus.Should().Be("Rejected");
        rejectResult.Data!.Status.Should().Be("Draft");
    }
}
