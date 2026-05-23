using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.GatewayTransactionId).HasMaxLength(100);
        builder.Property(x => x.PixKey).HasMaxLength(100);

        builder.ComplexProperty(x => x.Amount, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("Amount").IsRequired();
        });

        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Method).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => x.PaymentLinkId);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
