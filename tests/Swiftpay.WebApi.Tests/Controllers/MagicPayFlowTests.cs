using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Swiftpay.Application.Features.Auth.DTOs;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Domain.Entities;

namespace Swiftpay.WebApi.Tests.Controllers;

public class MagicPayFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public MagicPayFlowTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetTokenAsync()
    {
        var email = $"magicpay-{Guid.NewGuid():N}@test.com";
        var request = new RegisterRequest(
            "MagicPay User", email, "Password123",
            "MagicPay Co", Guid.NewGuid().ToString("N")[..14]);
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("data").GetProperty("accessToken").GetString()!;
    }

    private async Task<string> CreateLinkAsync(long amount)
    {
        var linkRes = await _client.PostAsJsonAsync("/api/v1/payment-links",
            new { title = "E2E Test", amount });
        var linkData = await linkRes.Content.ReadFromJsonAsync<JsonElement>();
        var linkId = linkData.GetProperty("data").GetGuid();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.PaymentLinks.FindAsync(linkId);
        return link!.Slug;
    }

    [Fact]
    public async Task PixPayment_Should_CreateAndConfirm()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var slug = await CreateLinkAsync(2990);

        var payRes = await _client.PostAsJsonAsync($"/api/v1/payment-links/{slug}/pay",
            new
            {
                method = "PIX",
                payerName = "John",
                payerTaxId = "12345678901",
                payerEmail = "john@test.com",
                payerPhone = "11999999999"
            });
        var payData = await payRes.Content.ReadFromJsonAsync<JsonElement>();
        payRes.StatusCode.Should().Be(HttpStatusCode.OK);
        payData.GetProperty("data").GetProperty("copyPaste").GetString().Should().NotBeNullOrEmpty();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var payment = db.Payments.Include(p => p.Pix).FirstOrDefault(p => p.Amount == 2990);
        payment.Should().NotBeNull();
        payment!.Method.Should().Be("PIX");
        payment.Amount.Should().Be(2990);
        payment.Pix.Should().NotBeNull();
        payment.Pix!.CopyAndPaste.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task BoletoPayment_Should_Create()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var slug = await CreateLinkAsync(5000);

        var payRes = await _client.PostAsJsonAsync($"/api/v1/payment-links/{slug}/pay",
            new
            {
                method = "BOLETO",
                payerName = "John",
                payerTaxId = "12345678901"
            });
        var payData = await payRes.Content.ReadFromJsonAsync<JsonElement>();
        payRes.StatusCode.Should().Be(HttpStatusCode.OK);
        payData.GetProperty("data").GetProperty("barcode").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CardPayment_Should_Create()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var slug = await CreateLinkAsync(10000);

        var payRes = await _client.PostAsJsonAsync($"/api/v1/payment-links/{slug}/pay",
            new
            {
                method = "CREDIT_CARD",
                cardToken = "mock_token",
                lastDigits = "1111",
                cardHolder = "JOHN DOE",
                installments = 3,
                payerName = "John",
                payerTaxId = "12345678901"
            });
        var payData = await payRes.Content.ReadFromJsonAsync<JsonElement>();
        payRes.StatusCode.Should().Be(HttpStatusCode.OK);
        payData.GetProperty("data").GetProperty("authorizationCode").GetString().Should().NotBeNullOrEmpty();
    }
}
