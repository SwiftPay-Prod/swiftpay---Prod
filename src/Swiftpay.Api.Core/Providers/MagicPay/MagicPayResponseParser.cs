using System.Text.Json;
using Swiftpay.Api.Core.Providers.MagicPay.Models;

namespace Swiftpay.Api.Core.Providers.MagicPay;

public class MagicPayResponseParser
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public PixGenerationResult ParseCreatePaymentResponse(string json)
    {
        try
        {
            var resp = JsonSerializer.Deserialize<MagicPayPaymentResponse>(json, JsonOptions);

            if (resp?.Error != null)
                return new PixGenerationResult(false, null, null, null, $"{resp.Error}: {resp.Message}");

            return new PixGenerationResult(true, resp!.Id, null, resp.Data?.Copypaste, null,
                Barcode: resp.Data?.Barcode, BoletoUrl: resp.Data?.BoletoUrl,
                AuthorizationCode: resp.AuthorizationCode);
        }
        catch (Exception ex)
        {
            return new PixGenerationResult(false, null, null, null, ex.Message);
        }
    }

    public PixRefundResult ParseRefundResponse(string json)
    {
        try
        {
            var resp = JsonSerializer.Deserialize<MagicPayPaymentResponse>(json, JsonOptions);
            if (resp?.Error != null) return new PixRefundResult(false, $"{resp.Error}: {resp.Message}");
            return new PixRefundResult(true, null);
        }
        catch (Exception ex) { return new PixRefundResult(false, ex.Message); }
    }

    public PixStatusResult ParseGetPaymentStatusResponse(string json)
    {
        try
        {
            var resp = JsonSerializer.Deserialize<MagicPayPaymentResponse>(json, JsonOptions);
            if (resp?.Error != null)
                return new PixStatusResult(false, "ERROR", null, null, null, null, $"{resp.Error}: {resp.Message}");
            return new PixStatusResult(true, resp!.Status ?? "PENDING", resp.Data?.E2E, resp.Payer?.Name, null, null, null);
        }
        catch (Exception ex)
        {
            return new PixStatusResult(false, "ERROR", null, null, null, null, ex.Message);
        }
    }
}
