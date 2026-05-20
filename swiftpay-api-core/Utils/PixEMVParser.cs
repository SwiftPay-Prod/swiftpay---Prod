namespace safefy_api_core.Utils;

/// <summary>
/// Utilitário para extrair dados de payloads PIX no formato EMV (ISO 18004 / BR Code).
/// </summary>
public static class PixEMVParser
{
    private static readonly HashSet<string> HostPrefixNoise = new(StringComparer.OrdinalIgnoreCase)
    {
        "qrcode",
        "brcode",
        "www",
        "api",
        "pix",
        "pay"
    };

    /// <summary>
    /// Extrai o Merchant Name do payload PIX (tag 59 no BR Code/EMV).
    /// </summary>
    public static string? ExtractMerchantName(string? copyAndPaste)
    {
        if (string.IsNullOrWhiteSpace(copyAndPaste))
            return null;

        return ParseTag(copyAndPaste.Trim(), "59");
    }

    /// <summary>
    /// Extrai a nominal operacional do payload PIX a partir do domínio da URL da tag 26/subtag 25.
    /// Ex.: qrcode.somossimpay.com.br -> somossimpay
    /// </summary>
    public static string? ExtractProcessingNominal(string? copyAndPaste)
    {
        if (string.IsNullOrWhiteSpace(copyAndPaste))
            return null;

        var payload = copyAndPaste.Trim();
        var merchantAccountInfo = ParseTag(payload, "26");
        if (string.IsNullOrWhiteSpace(merchantAccountInfo))
            return null;

        var urlCandidate = ParseNestedTag(merchantAccountInfo, "25") ?? merchantAccountInfo;
        var domain = ExtractHost(urlCandidate.Trim().ToLowerInvariant());
        if (string.IsNullOrWhiteSpace(domain))
            return null;

        var marker = "qrcode.";
        var markerIndex = domain.IndexOf(marker, StringComparison.Ordinal);
        if (markerIndex >= 0)
        {
            var start = markerIndex + marker.Length;
            var end = domain.IndexOf('.', start);
            if (end > start)
            {
                return domain.Substring(start, end - start).Trim();
            }
        }

        if (domain.EndsWith(".com.br", StringComparison.Ordinal))
        {
            var parts = domain.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 3)
                return ResolveNominalFromHostParts(parts, defaultIndexFromEnd: 3);
        }

        var defaultParts = domain.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (defaultParts.Length >= 2)
            return ResolveNominalFromHostParts(defaultParts, defaultIndexFromEnd: 2);

        return null;
    }

    /// <summary>
    /// Compatibilidade retroativa: historicamente este método retornava a tag 59.
    /// </summary>
    public static string? ExtractNominal(string? copyAndPaste) => ExtractMerchantName(copyAndPaste);

    private static string? ParseNestedTag(string payload, string tag)
    {
        int pos = 0;

        while (pos < payload.Length - 3)
        {
            if (pos + 2 > payload.Length)
                break;

            var currentTag = payload.Substring(pos, 2);
            pos += 2;

            if (pos + 2 > payload.Length)
                break;

            if (!int.TryParse(payload.Substring(pos, 2), out var length))
                break;

            pos += 2;

            if (pos + length > payload.Length)
                break;

            var value = payload.Substring(pos, length);
            pos += length;

            if (currentTag == tag)
                return value;
        }

        return null;
    }

    private static string? ParseTag(string payload, string tag)
    {
        int pos = 0;

        while (pos < payload.Length - 3)
        {
            if (pos + 2 > payload.Length)
                break;

            var currentTag = payload.Substring(pos, 2);

            pos += 2;

            if (pos + 2 > payload.Length)
                break;

            if (!int.TryParse(payload.Substring(pos, 2), out var length))
                break;

            pos += 2;

            if (pos + length > payload.Length)
                break;

            var value = payload.Substring(pos, length);
            pos += length;

            if (currentTag == tag)
                return value;
        }

        return null;
    }

    private static string? ResolveNominalFromHostParts(string[] parts, int defaultIndexFromEnd)
    {
        var candidateIndex = parts.Length - defaultIndexFromEnd;
        if (candidateIndex < 0 || candidateIndex >= parts.Length)
            return null;

        var candidate = parts[candidateIndex].Trim();
        if (!string.IsNullOrWhiteSpace(candidate) && !HostPrefixNoise.Contains(candidate))
            return candidate;

        for (var i = parts.Length - 1; i >= 0; i--)
        {
            var part = parts[i].Trim();
            if (string.IsNullOrWhiteSpace(part) || HostPrefixNoise.Contains(part))
                continue;

            if (part.Equals("com", StringComparison.OrdinalIgnoreCase)
                || part.Equals("br", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return part;
        }

        return null;
    }

    private static string ExtractHost(string candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
            return string.Empty;

        if (Uri.TryCreate(candidate, UriKind.Absolute, out var absolute))
            return absolute.Host;

        if (Uri.TryCreate($"https://{candidate}", UriKind.Absolute, out var withScheme))
            return withScheme.Host;

        var slashIndex = candidate.IndexOf('/');
        return slashIndex > 0 ? candidate[..slashIndex] : candidate;
    }
}
