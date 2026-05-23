using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class LedgerTransactionConfiguration : IEntityTypeConfiguration<LedgerTransaction>
{
    public void Configure(EntityTypeBuilder<LedgerTransaction> builder)
    {
        builder.ToTable("LedgerTransactions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasMaxLength(40);
        builder.Property(x => x.Operation).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(500);
        builder.HasIndex(x => x.PaymentId);
        builder.HasIndex(x => x.PayoutId);
        builder.HasIndex(x => new { x.PaymentId, x.Operation, x.Status });
        builder.HasMany(x => x.Entries).WithOne(e => e.Transaction).HasForeignKey(e => e.LedgerTransactionId);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
