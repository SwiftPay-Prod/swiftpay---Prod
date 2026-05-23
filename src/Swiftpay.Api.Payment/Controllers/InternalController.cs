using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Payment.Controllers;

[ApiController]
[Route("api/v1/internal")]
public class InternalController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPublishEndpoint _publish;

    public InternalController(AppDbContext db, IPublishEndpoint publish)
    {
        _db = db;
        _publish = publish;
    }

    [HttpPost("magicpay/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> MagicPayWebhook([FromBody] JsonElement payload, CancellationToken ct)
    {
        var status = payload.GetProperty("status").GetString();
        var externalRef = payload.TryGetProperty("externalRef", out var extRef) ? extRef.GetString() : null;

        if (externalRef == null)
            return BadRequest("Missing externalRef");

        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.ExternalId == externalRef, ct);
        if (payment == null) return NotFound();

        payment.Status = status;
        if (status == "PAID")
        {
            payment.PaidAt = DateTime.UtcNow;
            if (payload.TryGetProperty("data", out var data) && data.TryGetProperty("e2e", out var e2e))
            {
                if (payment.Pix != null) payment.Pix.EndToEndId = e2e.GetString();
            }
        }
        await _db.SaveChangesAsync(ct);

        if (status == "PAID")
        {
            await _publish.Publish(new PaymentCompletedMessage(
                payment.Id, payment.MerchantId, payment.MerchantAcquirerId, "PAID", payment.Amount,
                payment.MerchantSettlementAmount, payment.AcquirerFee,
                payment.Environment), ct);
        }

        return Ok();
    }
}
