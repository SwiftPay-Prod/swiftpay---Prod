using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentBoletoConfiguration : IEntityTypeConfiguration<PaymentBoleto>
{
    public void Configure(EntityTypeBuilder<PaymentBoleto> builder)
    {
        builder.ToTable("PaymentBoletos");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Barcode).HasMaxLength(255);
        builder.Property(x => x.BoletoUrl).HasMaxLength(500);
    }
}
