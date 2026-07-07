using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Constants;

public static class NotificationTemplates
{
    #region Routes

    public static class Routes
    {
        public const string Transactions = "/panel/merchant/transactions";
        public const string Cashouts = "/panel/merchant/cashouts";
    }

    #endregion

    #region Common

    public const string DefaultActionLabel = "Ver Detalhes";

    #endregion

    #region Payment Notifications

    public static class Payment
    {
        public static class Pending
        {
            public const string Title = "Pagamento pendente";

            public static string Message(long netAmount, string? method = null)
            {
                var amountText = FormatUtils.FormatCurrency(netAmount);

                return string.IsNullOrWhiteSpace(method)
                    ? $"Valor líquido: {amountText}."
                    : $"Valor líquido: {amountText} ({method}).";
            }
        }

        public static class Completed
        {
            public const string Title = "Venda aprovada";

            public static string Message(long netAmount)
                => $"Líquido recebido: {FormatUtils.FormatCurrency(netAmount)}.";
        }

        public static class Expired
        {
            public const string Title = "Venda expirada";

            public static string Message(long netAmount)
                => $"Venda de {FormatUtils.FormatCurrency(netAmount)} expirou.";
        }

        public static class Failed
        {
            public const string Title = "Venda falhou";

            public static string Message(long netAmount)
                => $"Erro na venda de {FormatUtils.FormatCurrency(netAmount)}.";
        }

        public static class Cancelled
        {
            public const string Title = "Venda cancelada";

            public static string Message(long netAmount)
                => $"Venda de {FormatUtils.FormatCurrency(netAmount)} cancelada.";
        }

        public static class Refunded
        {
            public const string Title = "Estorno realizado";

            public static string Message(long netAmount)
                => $"Estornado: {FormatUtils.FormatCurrency(netAmount)}.";

            public const string TitlePartial = "Estorno parcial";

            public static string MessagePartial(long refundedNetAmount)
                => $"Estorno parcial: {FormatUtils.FormatCurrency(refundedNetAmount)}.";
        }
    }

    #endregion

    #region Payout Notifications

    public static class Payout
    {
        public static class Pending
        {
            public const string Title = "Saque solicitado";

            public static string Message(long netAmount)
                => $"Saque líquido: {FormatUtils.FormatCurrency(netAmount)}.";
        }

        public static class Processing
        {
            public const string Title = "Saque em processamento";

            public static string Message(long netAmount)
                => $"Processando líquido de {FormatUtils.FormatCurrency(netAmount)}.";
        }

        public static class Completed
        {
            public const string Title = "Saque concluído";

            public static string Message(long netAmount)
                => $"Valor líquido enviado: {FormatUtils.FormatCurrency(netAmount)}.";

            public static string MessageWithAccount(long netAmount, string maskedAccount)
                => $"Líquido de {FormatUtils.FormatCurrency(netAmount)} enviado para {maskedAccount}.";
        }

        public static class Failed
        {
            public const string Title = "Falha no saque";

            public static string Message(long netAmount)
                => $"Erro no saque ({FormatUtils.FormatCurrency(netAmount)}). Saldo devolvido.";
        }

        public static class Rejected
        {
            public const string Title = "Saque rejeitado";

            public static string Message(long netAmount)
                => $"Saque de {FormatUtils.FormatCurrency(netAmount)} rejeitado. Saldo devolvido.";
        }

        public static class Cancelled
        {
            public const string Title = "Saque cancelado";

            public static string Message(long netAmount)
                => $"Cancelado: {FormatUtils.FormatCurrency(netAmount)}. Saldo devolvido.";
        }
    }

    #endregion
}
