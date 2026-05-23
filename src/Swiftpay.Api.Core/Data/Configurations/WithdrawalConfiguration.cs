using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class WithdrawalConfiguration : IEntityTypeConfiguration<Withdrawal>
{
    public void Configure(EntityTypeBuilder<Withdrawal> builder)
    {
        builder.ToTable("Withdrawals");
        builder.HasKey(x => x.Id);

        builder.ComplexProperty(x => x.Amount, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("Amount").IsRequired();
        });

        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.PixKey).HasMaxLength(100).IsRequired();
        builder.Property(x => x.PixKeyType).HasMaxLength(20).IsRequired();

        builder.HasIndex(x => x.CompanyId);
        builder.Property(x => x.RequestedAt).HasDefaultValueSql("NOW()");
    }
}
