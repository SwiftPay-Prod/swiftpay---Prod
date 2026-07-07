namespace swiftpay_api_core.Models.Database;

/// <summary>
/// SEO and Open Graph configuration stored as JSONB
/// </summary>
public class SeoConfig
{
    // ==========================================
    // META TAGS
    // ==========================================
    
    /// <summary>
    /// Page title for search engines
    /// </summary>
    public string? MetaTitle { get; set; }
    
    /// <summary>
    /// Page description for search engines
    /// </summary>
    public string? MetaDescription { get; set; }
    
    /// <summary>
    /// Keywords for search engines (comma-separated)
    /// </summary>
    public string? MetaKeywords { get; set; }
    
    /// <summary>
    /// Canonical URL for the page
    /// </summary>
    public string? CanonicalUrl { get; set; }
    
    /// <summary>
    /// Robots meta tag value (e.g., "index, follow")
    /// </summary>
    public string? Robots { get; set; }

    // ==========================================
    // OPEN GRAPH
    // ==========================================
    
    /// <summary>
    /// Open Graph configuration
    /// </summary>
    public OpenGraphConfig? OpenGraph { get; set; }

    // ==========================================
    // TWITTER CARD
    // ==========================================
    
    /// <summary>
    /// Twitter Card configuration
    /// </summary>
    public TwitterCardConfig? Twitter { get; set; }
}

/// <summary>
/// Open Graph meta configuration
/// </summary>
public class OpenGraphConfig
{
    /// <summary>
    /// og:title - Title for social sharing
    /// </summary>
    public string? Title { get; set; }
    
    /// <summary>
    /// og:description - Description for social sharing
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// og:image - Image URL for social sharing
    /// </summary>
    public string? ImageUrl { get; set; }
    
    /// <summary>
    /// og:image:width - Image width in pixels
    /// </summary>
    public int? ImageWidth { get; set; }
    
    /// <summary>
    /// og:image:height - Image height in pixels
    /// </summary>
    public int? ImageHeight { get; set; }
    
    /// <summary>
    /// og:image:alt - Image alt text
    /// </summary>
    public string? ImageAlt { get; set; }
    
    /// <summary>
    /// og:site_name - Site name
    /// </summary>
    public string? SiteName { get; set; }
    
    /// <summary>
    /// og:locale - Locale (e.g., "pt_BR")
    /// </summary>
    public string? Locale { get; set; }
    
    /// <summary>
    /// og:type - Type of content (website, article, product)
    /// </summary>
    public string? Type { get; set; }
}

/// <summary>
/// Twitter Card meta configuration
/// </summary>
public class TwitterCardConfig
{
    /// <summary>
    /// twitter:card - Card type (summary, summary_large_image, app, player)
    /// </summary>
    public string? Card { get; set; }
    
    /// <summary>
    /// twitter:site - @username of website
    /// </summary>
    public string? Site { get; set; }
    
    /// <summary>
    /// twitter:creator - @username of content creator
    /// </summary>
    public string? Creator { get; set; }
    
    /// <summary>
    /// twitter:title - Title for Twitter card
    /// </summary>
    public string? Title { get; set; }
    
    /// <summary>
    /// twitter:description - Description for Twitter card
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// twitter:image - Image URL for Twitter card
    /// </summary>
    public string? ImageUrl { get; set; }
}
