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

            return new PixGenerationResult(true, resp!.Id, null, resp.Data?.Copypaste, null);
        }
        catch (Exception ex)
        {
            return new PixGenerationResult(false, null, null, null, ex.Message);
        }
    }
}
