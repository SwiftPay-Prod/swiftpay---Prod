using System.Net.Http.Headers;
using Swiftpay.Application.Features.Auth.DTOs;

namespace Swiftpay.WebApi.Tests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_Should_ReturnOk_When_ValidRequest()
    {
        var email = $"admin-{Guid.NewGuid():N}@test.com";
        var request = new RegisterRequest(
            "Admin User", email, "Password123",
            "Test Company", Guid.NewGuid().ToString("N")[..14]);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Register_Should_ReturnBadRequest_When_DuplicateEmail()
    {
        var email = $"dup-{Guid.NewGuid():N}@test.com";
        var doc = Guid.NewGuid().ToString("N")[..14];
        var request = new RegisterRequest(
            "Admin User", email, "Password123",
            "Test Company", doc);

        await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_Should_ReturnOk_When_ValidCredentials()
    {
        var email = $"login-{Guid.NewGuid():N}@test.com";
        var register = new RegisterRequest(
            "Login User", email, "Password123",
            "Login Test Co", Guid.NewGuid().ToString("N")[..14]);
        await _client.PostAsJsonAsync("/api/v1/auth/register", register);

        var login = new LoginRequest(email, "Password123");
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        data.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        data.GetProperty("refreshToken").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_Should_ReturnUnauthorized_When_WrongPassword()
    {
        var email = $"wrong-{Guid.NewGuid():N}@test.com";
        var register = new RegisterRequest(
            "Login User", email, "Password123",
            "Login Test Co", Guid.NewGuid().ToString("N")[..14]);
        await _client.PostAsJsonAsync("/api/v1/auth/register", register);

        var login = new LoginRequest(email, "wrongpass");
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_Should_ReturnUnauthorized_When_UserNotFound()
    {
        var login = new LoginRequest($"nonexistent-{Guid.NewGuid():N}@test.com", "Password123");
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_Should_ReturnUnauthorized_When_NotAuthenticated()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_Should_ReturnOk_When_Authenticated()
    {
        var email = $"me-{Guid.NewGuid():N}@test.com";
        var register = new RegisterRequest(
            "Me User", email, "Password123",
            "Me Co", Guid.NewGuid().ToString("N")[..14]);
        var regResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", register);
        var regJson = await regResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = regJson.GetProperty("data").GetProperty("accessToken").GetString();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/v1/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
