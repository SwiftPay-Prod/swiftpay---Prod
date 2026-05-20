using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Admin.Transactions.ReadTransactionLedger;

public sealed class AdminReadTransactionLedgerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<AdminReadTransactionLedgerRequest, AdminReadTransactionLedgerResponse>
{
    public override void Configure()
    {
        Get("/transactions/{transactionId:guid}/ledger");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(AdminReadTransactionLedgerRequest req, CancellationToken ct)
    {
        var payment = await dbContext.Payments
            .AsNoTracking()
            .Include(p => p.Merchant)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.TransactionId, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new AdminReadTransactionLedgerResponse
            {
                Error = new("Transação não encontrada.")
            }, 404, ct);
            return;
        }

        var entries = await dbContext.LedgerEntries
            .AsNoTracking()
            .Include(e => e.Account)
            .Include(e => e.LedgerTransaction)
            .Where(e => e.LedgerTransaction.PaymentId == req.TransactionId)
            .OrderBy(e => e.Timestamp)
            .ToListAsync(ct);

        var totalPlatformFee = payment.PlatformFee + payment.CheckoutTemplateFee;

        var data = new AdminTransactionLedgerData
        {
            PaymentId = payment.Id,
            MerchantId = payment.MerchantId,
            MerchantName = payment.Merchant?.Name,
            Amount = payment.Amount,
            PlatformFee = totalPlatformFee,
            AcquirerFee = payment.AcquirerFee,
            NetAmount = payment.NetAmount,
            Profit = totalPlatformFee - payment.AcquirerFee,
            Entries = entries.Select(e => new AdminTransactionLedgerEntryData
            {
                Id = e.Id,
                TransactionId = e.LedgerTransactionId,
                Type = e.Type,
                Amount = e.Amount,
                Timestamp = e.Timestamp,
                Description = e.Description,
                Account = new AdminTransactionLedgerAccountData
                {
                    Id = e.AccountId,
                    Type = e.Account.Type
                }
            }).ToList()
        };

        await Send.ResponseAsync(new AdminReadTransactionLedgerResponse
        {
            Data = data
        }, cancellation: ct);
    }
}
