using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Models.SignalR;

public sealed class PaymentStatusChangedPayload
{
	[JsonPropertyName("paymentId")]
	public Guid PaymentId { get; set; }

	[JsonPropertyName("status")]
	public PaymentStatus Status { get; set; }
}
