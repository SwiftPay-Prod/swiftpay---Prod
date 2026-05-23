using Microsoft.EntityFrameworkCore;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Tests;

public class TestAppDbContext : AppDbContext
{
    public TestAppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<PaymentLink>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasConversion(
                v => v.AmountInCents,
                v => new Money(v));
        });

        builder.Entity<Transaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasConversion(
                v => v.AmountInCents,
                v => new Money(v));
        });

        builder.Entity<Withdrawal>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasConversion(
                v => v.AmountInCents,
                v => new Money(v));
        });

        builder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).HasConversion(
                v => v.Address,
                v => Email.Create(v));
            e.HasOne(x => x.Company).WithMany(c => c.Users).HasForeignKey(x => x.CompanyId);
        });

        builder.Entity<Company>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasMany(x => x.Users).WithOne(u => u.Company).HasForeignKey(u => u.CompanyId);
        });
    }
}
