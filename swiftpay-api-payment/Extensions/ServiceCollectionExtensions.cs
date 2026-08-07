using swiftpay_api_payment.Clients.Accithus;
using swiftpay_api_payment.Clients.ActivePayments;
using swiftpay_api_payment.Clients.Bankizi;
using swiftpay_api_payment.Clients.Coldfy;
using swiftpay_api_payment.Clients.HeartPay;
using swiftpay_api_payment.Clients.HunterPay;
using swiftpay_api_payment.Clients.MagicPay;
using swiftpay_api_payment.Clients.IHubBanking;
using swiftpay_api_payment.Clients.Pluggou;
using swiftpay_api_payment.Clients.Rapdyn;
using swiftpay_api_payment.Clients.AkkadPag;
using swiftpay_api_payment.Clients.FlevoPay;
using System.Net.Http.Headers;
using swiftpay_api_payment.Endpoints.Checkout.Calculate;
using swiftpay_api_payment.Endpoints.Checkout.CreateOrder;
using swiftpay_api_payment.Endpoints.Checkout.Get;
using swiftpay_api_payment.Endpoints.Checkout.GetOrder;
using swiftpay_api_payment.Endpoints.Checkout.ReactivateOrder;
using swiftpay_api_payment.Endpoints.Checkout.ReserveOrder;
using swiftpay_api_payment.Endpoints.Checkout.UpdateOrder;
using swiftpay_api_payment.Endpoints.Checkout.ValidateCoupon;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Interfaces.Internal.Submerchants;
using swiftpay_api_payment.Interfaces.Transactions;
using swiftpay_api_payment.Providers;
using swiftpay_api_payment.Services;
using swiftpay_api_payment.Services.Acquirers;
using swiftpay_api_payment.Services.Helpers;
using swiftpay_api_payment.Services.Internal;
using swiftpay_api_payment.Services.Internal.Submerchants;
using swiftpay_api_payment.Services.Sandbox;
using swiftpay_api_payment.Services.Transactions;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Extensions;
using swiftpay_api_core.Services;

namespace swiftpay_api_payment.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCoreServices(this IServiceCollection services)
    {
        services.AddEnvironmentProvider();

        services.AddLogServices();
        services.AddLedgerService();
        services.AddGeoLocationService();
        services.AddNotificationService();
        services.AddEmailService();
        services.AddEmailTemplateService();
        services.AddLedgerRepository();
        services.AddMerchantCalculationService();
        services.AddCalculationService();
        services.AddScoped<IReferralCommissionCompilationService, ReferralCommissionCompilationService>();
        services.AddAchievementService();
        services.AddScoped<IWayneProtocolService, WayneProtocolService>();

        services.AddScoped<IEmailTemplateProvider, EmailTemplateProvider>();
        services.AddScoped<IStockService, StockService>();

        return services;
    }

    public static IServiceCollection AddInternalServices(this IServiceCollection services)
    {
        services.AddSwiftPayDataProtection();
        services.AddHttpClient("utmify-integration", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddScoped<ITokenService, Services.Internal.TokenService>();
        services.AddScoped<IRateLimitService, Services.Internal.RateLimitService>();
        services.AddScoped<IAcquirerConfigService, Services.Internal.AcquirerConfigService>();
        services.AddScoped<ISubmerchantProviderAdapter, AccithusSubmerchantProviderAdapter>();
        services.AddScoped<ISubmerchantProviderAdapterFactory, SubmerchantProviderAdapterFactory>();
        services.AddScoped<ISubmerchantProviderPolicyService, SubmerchantProviderPolicyService>();
        services.AddScoped<ISubmerchantValidationService, SubmerchantValidationService>();
        services.AddScoped<ISubmerchantOrchestrationService, SubmerchantOrchestrationService>();
        services.AddScoped<ITransactionTrackingIntegrationService, TransactionTrackingIntegrationService>();
        services.AddScoped<IWebhookService, WebhookService>();
        services.AddScoped<ICashoutWebhookService, CashoutWebhookService>();
        services.AddScoped<IPlatformPayoutWebhookService, Services.PlatformPayoutWebhookService>();

        return services;
    }

    public static IServiceCollection AddAcquirerServices(this IServiceCollection services)
    {
        services.AddAcquirerHttpClient<IActivePaymentsClient, ActivePaymentsClient>("activepayments");
        services.AddAcquirerHttpClient<IBankiziClient, BankiziClient>("bankizi");
        services.AddAcquirerHttpClient<IIHubBankingClient, IHubBankingClient>("ihubbanking");
        services.AddAcquirerHttpClient<IRapdynClient, RapdynClient>("rapdyn");
        services.AddAcquirerHttpClient<IColdfyClient, ColdfyClient>("coldfy");
        services.AddAcquirerHttpClient<IPluggouClient, PluggouClient>("pluggou");
        services.AddAcquirerHttpClient<IHunterPayClient, HunterPayClient>("hunterpay");
        services.AddAcquirerHttpClient<IHeartPayClient, HeartPayClient>("heartpay");
        services.AddAcquirerHttpClient<IAccithusClient, AccithusClient>("accithus");
        services.AddAcquirerHttpClient<IMagicPayClient, MagicPayClient>("magicpay");
        services.AddHttpClient<IAkkadPagClient, AkkadPagClient>((sp, client) =>
        {
            client.BaseAddress = new Uri("https://api.akkadpag.com/v1/");
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        });
        services.AddHttpClient<IFlevoPayClient, FlevoPayClient>((sp, client) =>
        {
            client.BaseAddress = new Uri("https://app.flevopay.com.br/api/v1/");
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        });

        services.AddScoped<IAcquirerService, ActivePaymentsService>();
        services.AddScoped<IAcquirerService, BankiziService>();
        services.AddScoped<IAcquirerService, IHubBankingService>();
        services.AddScoped<IAcquirerService, RapdynService>();
        services.AddScoped<IAcquirerService, ColdfyService>();
        services.AddScoped<IAcquirerService, PluggouService>();
        services.AddScoped<IAcquirerService, HunterPayService>();
        services.AddScoped<IAcquirerService, HeartPayService>();
        services.AddScoped<IAcquirerService, AccithusService>();
        services.AddScoped<IAcquirerService, MagicPayService>();
        services.AddScoped<IAcquirerService, AkkadPagService>();
        services.AddScoped<IAcquirerService, FlevoPayService>();
        services.AddScoped<IAcquirerServiceFactory, AcquirerServiceFactory>();

        return services;
    }

    public static IServiceCollection AddPaymentServices(this IServiceCollection services)
    {
        services.AddScoped<IPixService, PixService>();
        services.AddScoped<IWithdrawService, WithdrawService>();
        services.AddScoped<ICashoutService, CashoutService>();
        services.AddScoped<IPaymentProcessingService, PaymentProcessingService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IDigitalDeliveryService, DigitalDeliveryService>();
        services.AddScoped<IAcquirerNominalTrackingService, AcquirerNominalTrackingService>();

        return services;
    }

    public static IServiceCollection AddSandboxServices(this IServiceCollection services)
    {
        services.AddScoped<ISandboxService, SandboxService>();

        return services;
    }

    public static IServiceCollection AddPaymentMethodServices(this IServiceCollection services)
    {
        services.AddScoped<IPaymentMethodService, PixTransactionService>();
        services.AddScoped<IPaymentMethodService, CreditCardTransactionService>();
        services.AddScoped<IPaymentMethodService, BoletoTransactionService>();
        services.AddScoped<IPaymentMethodServiceFactory, PaymentMethodServiceFactory>();

        return services;
    }

    public static IServiceCollection AddCheckoutHandlers(this IServiceCollection services)
    {
        services.AddScoped<GetCheckoutHandler>();
        services.AddScoped<CalculateHandler>();
        services.AddScoped<ValidateCouponHandler>();
        services.AddScoped<CreateOrderHandler>();
        services.AddScoped<GetOrderHandler>();
        services.AddScoped<UpdateOrderHandler>();
        services.AddScoped<ReserveOrderHandler>();
        services.AddScoped<ReactivateOrderHandler>();

        return services;
    }
}
