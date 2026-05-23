using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Method).HasMaxLength(20).IsRequired();
        builder.Property(x => x.ExternalId).HasMaxLength(100);
        builder.Property(x => x.AcquirerPaymentId).HasMaxLength(100);
        builder.Property(x => x.NotificationUrl).HasMaxLength(500);
        builder.Property(x => x.FailureReason).HasMaxLength(500);
        builder.Property(x => x.Environment).HasMaxLength(20).IsRequired();

        builder.HasIndex(x => x.AcquirerPaymentId);
        builder.HasIndex(x => x.ExternalId);
        builder.HasIndex(x => x.MerchantId);

        builder.HasOne(x => x.Pix)
            .WithOne(p => p.Payment)
            .HasForeignKey<PaymentPix>(p => p.PaymentId);

        builder.HasOne(x => x.Boleto)
            .WithOne(p => p.Payment)
            .HasForeignKey<PaymentBoleto>(p => p.PaymentId);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
