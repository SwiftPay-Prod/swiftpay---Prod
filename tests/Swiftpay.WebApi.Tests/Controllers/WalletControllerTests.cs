using System.Net.Http.Headers;
using Swiftpay.Application.Features.Auth.DTOs;

namespace Swiftpay.WebApi.Tests.Controllers;

public class WalletControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public WalletControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetTokenAsync()
    {
        var email = $"wallet-{Guid.NewGuid():N}@test.com";
        var request = new RegisterRequest(
            "Wallet User", email, "Password123",
            "Wallet Co", Guid.NewGuid().ToString("N")[..14]);
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("data").GetProperty("data").GetProperty("accessToken").GetString()!;
    }

    [Fact]
    public async Task GetBalance_Should_ReturnOk_When_Authenticated()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/wallet/balance");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        data.GetProperty("success").GetBoolean().Should().BeTrue();
        var balance = data.GetProperty("data");
        balance.GetProperty("available").GetInt64().Should().Be(0);
        balance.GetProperty("pending").GetInt64().Should().Be(0);
    }

    [Fact]
    public async Task GetBalance_Should_ReturnUnauthorized_When_NotAuthenticated()
    {
        var response = await _client.GetAsync("/api/v1/wallet/balance");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTransactions_Should_ReturnPagedResult()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/wallet/transactions?page=1&limit=25");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").GetProperty("items").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetTransactions_Should_ReturnUnauthorized_When_NotAuthenticated()
    {
        var response = await _client.GetAsync("/api/v1/wallet/transactions?page=1&limit=25");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
