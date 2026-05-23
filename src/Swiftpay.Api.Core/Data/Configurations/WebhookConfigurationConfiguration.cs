using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class WebhookConfigurationConfiguration : IEntityTypeConfiguration<WebhookConfiguration>
{
    public void Configure(EntityTypeBuilder<WebhookConfiguration> builder)
    {
        builder.ToTable("WebhookConfigurations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Url).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Secret).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Events).HasMaxLength(500).IsRequired();

        builder.HasIndex(x => x.MerchantId);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
