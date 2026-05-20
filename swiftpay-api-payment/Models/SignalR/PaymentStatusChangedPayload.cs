using System.Text.Json.Serialization;
using safefy_api_core.Models.Database;

namespace safefy_api_payment.Models.SignalR;

public sealed class PaymentStatusChangedPayload
{
	[JsonPropertyName("paymentId")]
	public Guid PaymentId { get; set; }

	[JsonPropertyName("status")]
	public PaymentStatus Status { get; set; }
}
