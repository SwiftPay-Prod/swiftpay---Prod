using System.Security.Cryptography;
using System.Text;

namespace safefy_api_payment.Endpoints.Acquirers.Bankizi.Utils;

public static class BankiziWebhookUtils
{
    public static string GenerateEndToEndId()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = Guid.NewGuid().ToString("N")[..6].ToUpper();
        return $"E00000000{timestamp}{random}";
    }
}
