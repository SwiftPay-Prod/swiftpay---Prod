using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class WithdrawalConfiguration : IEntityTypeConfiguration<Withdrawal>
{
    public void Configure(EntityTypeBuilder<Withdrawal> builder)
    {
        builder.ToTable("Withdrawals");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasConversion(
                v => v.AmountInCents,
                v => new Money(v))
            .HasColumnName("Amount")
            .IsRequired();

        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.PixKey).HasMaxLength(100).IsRequired();
        builder.Property(x => x.PixKeyType).HasMaxLength(20).IsRequired();

        builder.HasIndex(x => x.CompanyId);
        builder.Property(x => x.RequestedAt).HasDefaultValueSql("NOW()");
    }
}
