using FastEndpoints;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.DevTools.CreateBulletin;

public sealed class CreateBulletinEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateBulletinRequest, CreateBulletinResponse>
{
    public override void Configure()
    {
        Post("bulletins");
        Group<DevToolsGroup>();
    }

    public override async Task HandleAsync(CreateBulletinRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateBulletinResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var userName = EndpointUtils.GetUserName(User);

        var bulletin = new Bulletin
        {
            Id = Guid.CreateVersion7(),
            Title = req.Title.Trim(),
            Content = req.Content,
            ExpiresAt = DateTime.UtcNow.AddDays(req.ExpiresInDays),
            CreatedByUserId = userId.Value
        };

        dbContext.Bulletins.Add(bulletin);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new CreateBulletinResponse
        {
            Data = new BulletinData
            {
                Id = bulletin.Id,
                Title = bulletin.Title,
                Content = bulletin.Content,
                ExpiresAt = bulletin.ExpiresAt,
                CreatedAt = bulletin.CreatedAt,
                CreatedByUserName = userName
            },
            Message = "Informativo criado com sucesso!"
        }, 201, ct);
    }
}
