using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Settings;
using System.Text.RegularExpressions;
using Npgsql;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.CreateCheckout;

public sealed class CreateCheckoutEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateCheckoutRequest, CreateCheckoutResponse>
{
    private const string DefaultCheckoutPrimaryColor = "#059669";

    public override void Configure()
    {
        Post("{merchantId:guid}/checkouts");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateCheckoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateCheckoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new CreateCheckoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var slug = GenerateSlug(req.Name);
        var environment = environmentProvider.CurrentEnvironment;

        // Verifica unicidade global do slug (índice único em todo o banco, não por ambiente)
        var slugExists = await dbContext.Checkouts
            .IgnoreQueryFilters()
            .AnyAsync(c => c.Slug == slug, ct);

        if (slugExists)
        {
            // Gera slug único adicionando sufixo aleatório
            var baseSlug = slug;
            do
            {
                slug = $"{baseSlug}-{Guid.NewGuid().ToString()[..6]}";
                slugExists = await dbContext.Checkouts
                    .IgnoreQueryFilters()
                    .AnyAsync(c => c.Slug == slug, ct);
            } while (slugExists);
        }

        // Gera ShortId único para a URL do checkout
        string shortId;
        bool shortIdExists;
        do
        {
            shortId = CryptoUtils.GenerateShortId();
            shortIdExists = await dbContext.Checkouts
                .IgnoreQueryFilters()
                .AnyAsync(c => c.ShortId == shortId, ct);
        } while (shortIdExists);

        var checkout = new Checkout
        {
            MerchantId = req.MerchantId,
            CheckoutTemplateId = null,
            Name = req.Name.Trim(),
            Slug = slug,
            ShortId = shortId,
            Status = CheckoutStatus.Draft,
            Environment = environment
        };

        var config = new CheckoutConfig
        {
            CheckoutId = checkout.Id,
            PixEnabled = true,
            CreditCardEnabled = false,
            BoletoEnabled = false,
            PixExpirationMinutes = 30,
            CouponEnabled = false,
            ShippingEnabled = false,
            RequireCustomerAddress = false,
            RequireCustomerDocument = false,
            PrimaryColor = DefaultCheckoutPrimaryColor,
            ColorMode = CheckoutColorMode.Single
        };

        checkout.Config = config;

        dbContext.Checkouts.Add(checkout);

        const int MaxSlugRetries = 5;
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                await dbContext.SaveChangesAsync(ct);
                break;
            }
            catch (DbUpdateException ex) when (attempt < MaxSlugRetries && IsUniqueSlugViolation(ex))
            {
                // Race: o slug foi tomado entre o check e o insert. Gera outro e tenta de novo.
                slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";
                dbContext.ChangeTracker.Clear();

                checkout = new Checkout
                {
                    MerchantId = req.MerchantId,
                    CheckoutTemplateId = null,
                    Name = req.Name.Trim(),
                    Slug = slug,
                    ShortId = shortId,
                    Status = CheckoutStatus.Draft,
                    Environment = environment
                };
                var newConfig = new CheckoutConfig
                {
                    PixEnabled = true,
                    CreditCardEnabled = false,
                    BoletoEnabled = false,
                    PixExpirationMinutes = 30,
                    CouponEnabled = false,
                    ShippingEnabled = false,
                    RequireCustomerAddress = false,
                    RequireCustomerDocument = false,
                    PrimaryColor = DefaultCheckoutPrimaryColor,
                    ColorMode = CheckoutColorMode.Single
                };
                checkout.Config = newConfig;
                dbContext.Checkouts.Add(checkout);
            }
            catch (DbUpdateException ex) when (attempt >= MaxSlugRetries && IsUniqueSlugViolation(ex))
            {
                await Send.ResponseAsync(new CreateCheckoutResponse
                {
                    Error = new("Não foi possível criar o checkout: conflito de identificador. Tente novamente.")
                }, 409, ct);
                return;
            }
        }

        await Send.ResponseAsync(new CreateCheckoutResponse
        {
            Data = CheckoutMapper.ToData(checkout, platformSettings.Value.CheckoutBaseUrl),
            Message = "Checkout criado com sucesso!"
        }, 201, ct);
    }

    private static bool IsUniqueSlugViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException
        {
            SqlState: "23505",
            ConstraintName: "IX_Checkouts_Slug"
        };
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[áàâãäå]", "a");
        slug = Regex.Replace(slug, @"[éèêë]", "e");
        slug = Regex.Replace(slug, @"[íìîï]", "i");
        slug = Regex.Replace(slug, @"[óòôõö]", "o");
        slug = Regex.Replace(slug, @"[úùûü]", "u");
        slug = Regex.Replace(slug, @"[ç]", "c");
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');
        return slug;
    }
}
