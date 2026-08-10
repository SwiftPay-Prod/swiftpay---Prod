using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using swiftpay_api.Tests.Fixtures;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Tests.Integration;

public sealed class AuthEmailIntentContractTests(SwiftPayApiFactory factory)
    : IClassFixture<SwiftPayApiFactory>
{
    [Fact]
    public async Task ForgotPassword_ShouldNotDistinguishExistingAndMissingAccounts()
    {
        var existingEmail = $"existing-{Guid.NewGuid():N}@example.com";
        var missingEmail = $"missing-{Guid.NewGuid():N}@example.com";

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            await dbContext.Database.EnsureCreatedAsync();
            dbContext.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Name = "Anonymous Contract",
                Email = existingEmail,
                Password = "not-used",
                ReferralCode = $"T{Guid.NewGuid():N}"[..12]
            });
            await dbContext.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        var existingResponse = await client.PostAsJsonAsync(
            "/v1/auth/forgot-password",
            new { email = existingEmail });
        var missingResponse = await client.PostAsJsonAsync(
            "/v1/auth/forgot-password",
            new { email = missingEmail });

        Assert.Equal(HttpStatusCode.Accepted, existingResponse.StatusCode);
        Assert.Equal(existingResponse.StatusCode, missingResponse.StatusCode);
        Assert.Equal(
            await existingResponse.Content.ReadAsStringAsync(),
            await missingResponse.Content.ReadAsStringAsync());
    }
}
