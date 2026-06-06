using System.Text.Json;
using Swiftpay.Api.Core.Providers.Coratri.Models;

namespace Swiftpay.Api.Core.Providers.Coratri;

public class CoratriResponseParser
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public PixGenerationResult ParseCreatePixResponse(string json)
    {
        try
        {
            var resp = JsonSerializer.Deserialize<CoratriPixResponse>(json, JsonOptions);
            if (resp?.Status != "success")
                return new PixGenerationResult(false, null, null, null, resp?.Message ?? "Unknown error");

            return new PixGenerationResult(
                Success: true,
                TransactionId: resp.TransactionId,
                QrCodePayload: resp.QrCode,
                CopyAndPaste: resp.QrCode,
                ErrorMessage: null,
                QrCodeBase64: resp.QrCodeImageUrl,
                Barcode: null,
                BoletoUrl: null,
                AuthorizationCode: null);
        }
        catch (Exception ex)
        {
            return new PixGenerationResult(false, null, null, null, ex.Message);
        }
    }
}
