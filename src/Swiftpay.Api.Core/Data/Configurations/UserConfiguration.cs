using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.PasswordHash).IsRequired();

        builder.Property(x => x.Email)
            .HasConversion(
                v => v.Address,
                v => Email.Create(v))
            .HasColumnName("Email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.CompanyId);

        builder.HasOne(x => x.Company)
            .WithMany(c => c.Users)
            .HasForeignKey(x => x.CompanyId);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
