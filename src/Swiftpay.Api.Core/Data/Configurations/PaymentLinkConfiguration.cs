using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentLinkConfiguration : IEntityTypeConfiguration<PaymentLink>
{
    public void Configure(EntityTypeBuilder<PaymentLink> builder)
    {
        builder.ToTable("PaymentLinks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.Slug).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Theme).HasMaxLength(50);
        builder.Property(x => x.PrimaryColor).HasMaxLength(7);
        builder.Property(x => x.CtaText).HasMaxLength(100);
        builder.Property(x => x.SuccessMessage).HasMaxLength(500);
        builder.Property(x => x.SuccessUrl).HasMaxLength(2000);
        builder.Property(x => x.CancelUrl).HasMaxLength(2000);

        builder.ComplexProperty(x => x.Amount, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("Amount").IsRequired();
        });
        builder.Property(x => x.AmountMin)
            .HasConversion(
                v => v.HasValue ? v.Value.AmountInCents : (long?)null,
                v => v.HasValue ? new Money(v.Value) : (Money?)null)
            .HasColumnName("AmountMin");
        builder.Property(x => x.AmountMax)
            .HasConversion(
                v => v.HasValue ? v.Value.AmountInCents : (long?)null,
                v => v.HasValue ? new Money(v.Value) : (Money?)null)
            .HasColumnName("AmountMax");

        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.UsesCount).HasDefaultValue(0);
        builder.Property(x => x.RequireDocument).HasDefaultValue(false);
        builder.Property(x => x.RequirePhone).HasDefaultValue(false);

        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.CompanyId);
        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
    }
}
