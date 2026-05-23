using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Document).HasMaxLength(18).IsRequired();
        builder.Property(x => x.KycStatus).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.Document).IsUnique();
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
