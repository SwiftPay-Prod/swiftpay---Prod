using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.Bulletins.MarkBulletinAsRead;

public sealed class MarkBulletinAsReadEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<MarkBulletinAsReadRequest, MarkBulletinAsReadResponse>
{
    public override void Configure()
    {
        Post("bulletins/{bulletinId:guid}/read");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(MarkBulletinAsReadRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new MarkBulletinAsReadResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var bulletinExists = await dbContext.Bulletins
            .AnyAsync(b => b.Id == req.BulletinId, ct);

        if (!bulletinExists)
        {
            await Send.ResponseAsync(new MarkBulletinAsReadResponse
            {
                Error = new("Informativo não encontrado.")
            }, 404, ct);
            return;
        }

        var alreadyRead = await dbContext.BulletinReads
            .AnyAsync(br => br.BulletinId == req.BulletinId && br.UserId == userId.Value, ct);

        if (alreadyRead)
        {
            await Send.OkAsync(new MarkBulletinAsReadResponse
            {
                Message = "Informativo já foi marcado como lido."
            }, ct);
            return;
        }

        var bulletinRead = new BulletinRead
        {
            Id = Guid.CreateVersion7(),
            BulletinId = req.BulletinId,
            UserId = userId.Value,
            ReadAt = DateTime.UtcNow
        };

        dbContext.BulletinReads.Add(bulletinRead);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new MarkBulletinAsReadResponse
        {
            Message = "Informativo marcado como lido."
        }, ct);
    }
}
