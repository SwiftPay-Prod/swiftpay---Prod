using System.Net.Http.Headers;
using Swiftpay.Application.Features.Auth.DTOs;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.WebApi.Tests.Controllers;

public class PaymentLinksControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PaymentLinksControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetTokenAsync()
    {
        var email = $"pl-{Guid.NewGuid():N}@test.com";
        var request = new RegisterRequest(
            "PL User", email, "Password123",
            "PL Test Co", Guid.NewGuid().ToString("N")[..14]);
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("data").GetProperty("data").GetProperty("accessToken").GetString()!;
    }

    [Fact]
    public async Task Create_Should_ReturnOk_When_Authenticated()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreatePaymentLinkRequest(
            "Test Link", "Description", 3000,
            null, null, false, false,
            null, null, null, null,
            null, null);

        var response = await _client.PostAsJsonAsync("/api/v1/payment-links", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        data.GetProperty("success").GetBoolean().Should().BeTrue();
        data.GetProperty("data").GetGuid().Should().NotBeEmpty();
    }

    [Fact]
    public async Task Create_Should_ReturnUnauthorized_When_NotAuthenticated()
    {
        var request = new CreatePaymentLinkRequest(
            "Unauthorized", null, 1000,
            null, null, false, false,
            null, null, null, null, null, null);

        var response = await _client.PostAsJsonAsync("/api/v1/payment-links", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetById_Should_ReturnNotFound_When_LinkDoesNotExist()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/v1/payment-links/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_Should_ReturnOk_When_LinkExists()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreatePaymentLinkRequest(
            "Get Test", "Get Desc", 5000,
            null, null, false, false,
            null, null, null, null, null, null);
        var createResponse = await _client.PostAsJsonAsync("/api/v1/payment-links", createRequest);
        var createJson = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var linkId = createJson.GetProperty("data").GetProperty("data").GetGuid();

        var response = await _client.GetAsync($"/api/v1/payment-links/{linkId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task List_Should_ReturnPagedResult()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreatePaymentLinkRequest(
            "List Test", "List Desc", 2000,
            null, null, false, false,
            null, null, null, null, null, null);
        await _client.PostAsJsonAsync("/api/v1/payment-links", createRequest);

        var response = await _client.GetAsync("/api/v1/payment-links?page=1&limit=25");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").GetProperty("items").GetArrayLength().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task List_Should_ReturnUnauthorized_When_NotAuthenticated()
    {
        var response = await _client.GetAsync("/api/v1/payment-links?page=1&limit=25");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
