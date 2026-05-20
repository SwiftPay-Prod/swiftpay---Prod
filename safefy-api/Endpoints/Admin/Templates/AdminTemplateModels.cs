using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Templates;

// ========== Admin Template Data (for CRUD operations) ==========

public sealed class AdminTemplateData
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public CheckoutTemplateType Type { get; set; }
    public string Name { get; set; } = null!;
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public string? BestFor { get; set; }
    public string? ThumbnailUrl { get; set; }
    public List<string> PreviewImages { get; set; } = [];
    public List<string> Features { get; set; } = [];
    
    /// <summary>
    /// Modo de cobrança da taxa do template por transação.
    /// Null indica template gratuito (sem taxa adicional).
    /// </summary>
    public FeeChargeMode? FeeMode { get; set; }
    
    /// <summary>
    /// Taxa fixa do template em centavos
    /// </summary>
    public long FeeFixed { get; set; }
    
    /// <summary>
    /// Taxa percentual do template em basis points (150 = 1.5%)
    /// </summary>
    public int FeePercentage { get; set; }
    
    public bool IsActive { get; set; }
    public int UsageCount { get; set; }
    public int ActiveCheckouts { get; set; }
    public bool SupportsCoupons { get; set; }
    public bool SupportsShipping { get; set; }
    public bool SupportsTimer { get; set; }
    public bool SupportsSocialProof { get; set; }
    
    // Tracking support
    public bool SupportsClarity { get; set; }
    public bool SupportsFacebookPixel { get; set; }
    public bool SupportsGoogleTagManager { get; set; }
    public bool SupportsTikTok { get; set; }
    public bool SupportsKwai { get; set; }
    public bool SupportsPinterest { get; set; }
    public bool SupportsTaboola { get; set; }
    public bool SupportsUtmify { get; set; }
    public bool SupportsOtimizey { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// ========== Admin Template Minimal (for listings) ==========

public sealed class AdminMinimalTemplate
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public CheckoutTemplateType Type { get; set; }
    public string Name { get; set; } = null!;
    public string? ShortDescription { get; set; }
    public string? ThumbnailUrl { get; set; }
    public FeeChargeMode? FeeMode { get; set; }
    public long FeeFixed { get; set; }
    public int FeePercentage { get; set; }
    public bool IsActive { get; set; }
    public int UsageCount { get; set; }
    public int ActiveCheckouts { get; set; }
    public bool SupportsCoupons { get; set; }
    public bool SupportsTimer { get; set; }
    public bool SupportsSocialProof { get; set; }
    
    // Tracking support
    public bool SupportsClarity { get; set; }
    public bool SupportsFacebookPixel { get; set; }
    public bool SupportsGoogleTagManager { get; set; }
    public bool SupportsTikTok { get; set; }
    public bool SupportsKwai { get; set; }
    public bool SupportsPinterest { get; set; }
    public bool SupportsTaboola { get; set; }
    public bool SupportsUtmify { get; set; }
    public bool SupportsOtimizey { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
