using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Acquirer;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Acquirers.CreateAcquirerAccessAccount;

public sealed class CreateAcquirerAccessAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateAcquirerAccessAccountRequest, CreateAcquirerAccessAccountResponse>
{
    public override void Configure()
    {
        Post("acquirers/access-accounts");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreateAcquirerAccessAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateAcquirerAccessAccountResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new CreateAcquirerAccessAccountResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var accessAccounts = acquirer.AccessAccounts?.ToList() ?? [];
        if (accessAccounts.Count >= 20)
        {
            await Send.ResponseAsync(new CreateAcquirerAccessAccountResponse
            {
                Error = new("A adquirente já possui o limite máximo de 20 contas de acesso.")
            }, 400, ct);
            return;
        }

        accessAccounts.Add(new AcquirerPortalAccessAccount
        {
            Login = req.Login.Trim(),
            Password = req.Password.Trim(),
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim()
        });

        acquirer.AccessAccounts = accessAccounts;
        acquirer.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new CreateAcquirerAccessAccountResponse
        {
            Data = new CreateAcquirerAccessAccountData
            {
                AcquirerId = acquirer.Id,
                AccessAccounts = acquirer.AccessAccounts
            },
            Message = "Conta de acesso adicionada com sucesso."
        }, ct);
    }
}
