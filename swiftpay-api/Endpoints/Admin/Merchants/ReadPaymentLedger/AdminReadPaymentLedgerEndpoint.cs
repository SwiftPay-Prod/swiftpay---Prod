using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadPaymentLedger;

public sealed class AdminReadPaymentLedgerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<AdminReadPaymentLedgerRequest, AdminReadPaymentLedgerResponse>
{
    public override void Configure()
    {
        Get("/merchant/{merchantId:guid}/payments/{paymentId:guid}/ledger");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(AdminReadPaymentLedgerRequest req, CancellationToken ct)
    {
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new AdminReadPaymentLedgerResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var payment = await dbContext.Payments
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.PaymentId && p.MerchantId == req.MerchantId, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new AdminReadPaymentLedgerResponse
            {
                Error = new("Pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var entries = await dbContext.LedgerTransactions
            .AsNoTracking()
            .Where(lt => lt.PaymentId == req.PaymentId)
            .SelectMany(lt => lt.LedgerEntries)
            .Include(e => e.Account)
            .OrderBy(e => e.Timestamp)
            .ToListAsync(ct);

        var totalPlatformFee = payment.PlatformFee + payment.CheckoutTemplateFee;

        var data = new AdminPaymentLedgerData
        {
            PaymentId = req.PaymentId,
            Amount = payment.Amount,
            PlatformFee = totalPlatformFee,
            AcquirerFee = payment.AcquirerFee,
            NetAmount = payment.NetAmount,
            Profit = totalPlatformFee - payment.AcquirerFee,
            Entries = entries.Select(e => new AdminLedgerEntryData
            {
                Id = e.Id,
                TransactionId = e.LedgerTransactionId,
                Type = e.Type,
                Amount = e.Amount,
                Timestamp = e.Timestamp,
                Description = e.Description,
                Account = new AdminLedgerAccountData
                {
                    Id = e.AccountId,
                    Type = e.Account.Type
                }
            }).ToList()
        };

        await Send.ResponseAsync(new AdminReadPaymentLedgerResponse
        {
            Data = data
        }, cancellation: ct);
    }
}
