using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.CircuitBreaker;
using Polly.Timeout;

namespace swiftpay_api_payment.Extensions;

public static class HttpClientResilienceExtensions
{
    public static IServiceCollection AddAcquirerHttpClient<TClient, TImplementation>(
        this IServiceCollection services,
        string clientName,
        Action<HttpClient>? configureClient = null)
        where TClient : class
        where TImplementation : class, TClient
    {
        services.AddHttpClient<TClient, TImplementation>(clientName, client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            configureClient?.Invoke(client);
        })
        .AddResilienceHandler($"{clientName}-resilience", ConfigureResiliencePipeline);
        
        return services;
    }

    private static void ConfigureResiliencePipeline(ResiliencePipelineBuilder<HttpResponseMessage> builder)
    {
        builder.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            FailureRatio = 0.5,
            MinimumThroughput = 5,
            SamplingDuration = TimeSpan.FromSeconds(30),
            BreakDuration = TimeSpan.FromSeconds(30),
            ShouldHandle = static args => 
            {
                var shouldHandle = args.Outcome.Result?.IsSuccessStatusCode == false
                    && args.Outcome.Result?.StatusCode >= System.Net.HttpStatusCode.InternalServerError
                    || args.Outcome.Exception is HttpRequestException or TimeoutRejectedException;
                    
                return ValueTask.FromResult(shouldHandle);
            }
        });

        builder.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            BackoffType = DelayBackoffType.Exponential,
            Delay = TimeSpan.FromMilliseconds(500),
            UseJitter = true,
            ShouldHandle = static args =>
            {
                var shouldRetry = args.Outcome.Result?.StatusCode >= System.Net.HttpStatusCode.InternalServerError
                    || args.Outcome.Exception is HttpRequestException or TimeoutRejectedException;
                    
                return ValueTask.FromResult(shouldRetry);
            }
        });

        builder.AddTimeout(new TimeoutStrategyOptions
        {
            Timeout = TimeSpan.FromSeconds(15)
        });
    }

    public static IServiceCollection AddWebhookHttpClient(this IServiceCollection services)
    {
        services.AddHttpClient("webhooks", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "SwiftPay-Webhook/1.0");
        })
        .AddResilienceHandler("webhook-resilience", builder =>
        {
            builder.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
            {
                FailureRatio = 0.8,
                MinimumThroughput = 10,
                SamplingDuration = TimeSpan.FromMinutes(1),
                BreakDuration = TimeSpan.FromMinutes(1),
                ShouldHandle = static args =>
                {
                    var shouldHandle = args.Outcome.Exception is HttpRequestException;
                    return ValueTask.FromResult(shouldHandle);
                }
            });

            builder.AddRetry(new HttpRetryStrategyOptions
            {
                MaxRetryAttempts = 3,
                BackoffType = DelayBackoffType.Exponential,
                Delay = TimeSpan.FromSeconds(2),
                UseJitter = false,
                ShouldHandle = static args =>
                {
                    var shouldRetry = args.Outcome.Result?.StatusCode >= System.Net.HttpStatusCode.InternalServerError
                        || args.Outcome.Exception is HttpRequestException or TimeoutRejectedException;
                        
                    return ValueTask.FromResult(shouldRetry);
                }
            });

            builder.AddTimeout(TimeSpan.FromSeconds(10));
        });
        
        return services;
    }
}
