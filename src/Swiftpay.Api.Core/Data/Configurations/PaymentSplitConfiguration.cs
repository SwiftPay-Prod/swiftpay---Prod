using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentSplitConfiguration : IEntityTypeConfiguration<PaymentSplit>
{
    public void Configure(EntityTypeBuilder<PaymentSplit> builder)
    {
        builder.ToTable("PaymentSplits");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.RecipientId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(10).IsRequired();

        builder.HasOne(x => x.Payment)
            .WithMany(p => p.Splits)
            .HasForeignKey(x => x.PaymentId);
    }
}
