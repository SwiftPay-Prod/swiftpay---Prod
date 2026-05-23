using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentPixConfiguration : IEntityTypeConfiguration<PaymentPix>
{
    public void Configure(EntityTypeBuilder<PaymentPix> builder)
    {
        builder.ToTable("PaymentPix");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TxId).HasMaxLength(100);
        builder.Property(x => x.CopyAndPaste).HasMaxLength(500);
        builder.Property(x => x.EndToEndId).HasMaxLength(100);
        builder.Property(x => x.PixKey).HasMaxLength(100);
        builder.Property(x => x.PixKeyType).HasMaxLength(20);
        builder.Property(x => x.PayerName).HasMaxLength(255);
        builder.Property(x => x.PayerDocument).HasMaxLength(18);
    }
}
