using swiftpay_api_payment.Clients.ActivePayments.Models;

namespace swiftpay_api_payment.Clients.ActivePayments;

internal static class ActivePaymentsResponseParser
{
    public static string BuildErrorMessage(ActivePaymentsErrorData? error)
    {
        if (error == null)
            return "Erro desconhecido.";

        if (error.Details == null || error.Details.Count == 0)
            return error.Message ?? "Erro ao processar requisicao.";

        var detailMessages = error.Details
            .Where(d => !string.IsNullOrWhiteSpace(d.Field) && !string.IsNullOrWhiteSpace(d.Message))
            .Select(d => $"{d.Field}: {d.Message}")
            .ToList();

        if (detailMessages.Count == 0)
            return error.Message ?? "Erro ao processar requisicao.";

        return string.Join(" | ", detailMessages);
    }
}
