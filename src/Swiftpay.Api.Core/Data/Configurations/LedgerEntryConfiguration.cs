using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class LedgerEntryConfiguration : IEntityTypeConfiguration<LedgerEntry>
{
    public void Configure(EntityTypeBuilder<LedgerEntry> builder)
    {
        builder.ToTable("LedgerEntries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasMaxLength(40);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(255);
        builder.HasIndex(x => x.AccountId);
        builder.Property(x => x.Timestamp).HasDefaultValueSql("NOW()");
    }
}
