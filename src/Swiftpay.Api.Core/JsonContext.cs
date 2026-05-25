using System.Text.Json.Serialization;
using Swiftpay.Api.Core.Messages;

namespace Swiftpay.Api.Core;

[JsonSerializable(typeof(PaymentCompletedMessage))]
[JsonSerializable(typeof(PaymentPendingMessage))]
[JsonSerializable(typeof(SendWebhookMessage))]
internal partial class SwiftpayJsonContext : JsonSerializerContext
{
}
