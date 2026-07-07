using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Database;

/// <summary>
/// DbContext dedicado para logs de segurança e API.
/// Conecta-se a um banco de dados PostgreSQL separado para melhor
/// performance e isolamento dos dados operacionais.
/// </summary>
public class LogDbContext : DbContext
{
    public LogDbContext(DbContextOptions<LogDbContext> options) : base(options)
    {
    }

    public DbSet<SecurityLogEntry> SecurityLogs { get; set; }
    public DbSet<ApiLogEntry> ApiLogs { get; set; }
    public DbSet<EmailLogEntry> EmailLogs { get; set; }
    public DbSet<AcquirerWebhookLogEntry> AcquirerWebhookLogs { get; set; }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ============================================
        // SecurityLogEntry Configuration
        // ============================================
        modelBuilder.Entity<SecurityLogEntry>(entity =>
        {
            entity.ToTable("SecurityLogs");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.Action)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(100); // IPv6 + safety margin for edge cases

            entity.Property(e => e.UserAgent)
                .HasMaxLength(1000);

            entity.Property(e => e.Location)
                .HasMaxLength(500);

            entity.Property(e => e.Details)
                .HasMaxLength(5000);

            entity.Property(e => e.ServiceName)
                .HasMaxLength(100);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ServiceName);
            
            entity.HasIndex(e => new { e.UserId, e.Action, e.CreatedAt });
        });

        // ============================================
        // ApiLogEntry Configuration
        // ============================================
        modelBuilder.Entity<ApiLogEntry>(entity =>
        {
            entity.ToTable("ApiLogs");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.HttpMethod)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.Endpoint)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Action)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(100); // IPv6 + safety margin for edge cases

            entity.Property(e => e.UserAgent)
                .HasMaxLength(1000);

            entity.Property(e => e.Location)
                .HasMaxLength(500);

            entity.Property(e => e.Details)
                .HasMaxLength(10000);

            entity.Property(e => e.ErrorCode)
                .HasMaxLength(100);

            entity.Property(e => e.RequestBody)
                .HasColumnType("text");

            entity.Property(e => e.ResponseBody)
                .HasColumnType("text");

            entity.Property(e => e.AcquirerType)
                .HasMaxLength(100);

            entity.Property(e => e.ResourceType)
                .HasMaxLength(100);

            entity.HasIndex(e => e.MerchantId);
            entity.HasIndex(e => e.CredentialId);
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.StatusCode);
            entity.HasIndex(e => e.AcquirerId);
            entity.HasIndex(e => e.AcquirerType);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IpAddress);

            entity.HasIndex(e => new { e.MerchantId, e.Action, e.CreatedAt });
            entity.HasIndex(e => new { e.MerchantId, e.StatusCode, e.CreatedAt });
        });

        // ============================================
        // AcquirerWebhookLogEntry Configuration
        // ============================================
        modelBuilder.Entity<AcquirerWebhookLogEntry>(entity =>
        {
            entity.ToTable("AcquirerWebhookLogs");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.AcquirerType)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.AcquirerCode)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.HttpMethod)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.Endpoint)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.QueryString)
                .HasColumnType("text");

            entity.Property(e => e.RequestHeaders)
                .HasColumnType("text");

            entity.Property(e => e.RequestBody)
                .HasColumnType("text");

            entity.Property(e => e.IpAddress)
                .HasMaxLength(100);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(1000);

            entity.Property(e => e.Location)
                .HasMaxLength(500);

            entity.Property(e => e.CorrelationId)
                .HasMaxLength(200);

            entity.Property(e => e.ContentType)
                .HasMaxLength(200);

            entity.HasIndex(e => e.AcquirerId);
            entity.HasIndex(e => e.AcquirerType);
            entity.HasIndex(e => e.AcquirerCode);
            entity.HasIndex(e => e.StatusCode);
            entity.HasIndex(e => e.IpAddress);
            entity.HasIndex(e => e.CreatedAt);

            entity.HasIndex(e => new { e.AcquirerType, e.CreatedAt });
        });

        // ============================================
        // EmailLogEntry Configuration
        // ============================================
        modelBuilder.Entity<EmailLogEntry>(entity =>
        {
            entity.ToTable("EmailLogs");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.To)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Subject)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Template)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(2000);

            entity.Property(e => e.Parameters)
                .HasColumnType("text");

            entity.Property(e => e.ServiceName)
                .HasMaxLength(100);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(100); // IPv6 + safety margin for edge cases

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.MerchantId);
            entity.HasIndex(e => e.Template);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);

            entity.HasIndex(e => new { e.UserId, e.Template, e.CreatedAt });
        });

        base.OnModelCreating(modelBuilder);
    }
}
