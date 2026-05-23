using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentCreditCardConfiguration : IEntityTypeConfiguration<PaymentCreditCard>
{
    public void Configure(EntityTypeBuilder<PaymentCreditCard> builder)
    {
        builder.ToTable("PaymentCreditCards");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CardToken).HasMaxLength(500);
        builder.Property(x => x.LastDigits).HasMaxLength(4);
        builder.Property(x => x.CardHolder).HasMaxLength(100);
        builder.Property(x => x.AuthorizationCode).HasMaxLength(50);
        builder.Property(x => x.Tid).HasMaxLength(50);

        builder.HasOne(x => x.Payment)
            .WithMany()
            .HasForeignKey(x => x.PaymentId);
    }
}
