using Microsoft.EntityFrameworkCore;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api_core.Repositories;

public class NotificationRepository(DbContext dbContext) : INotificationRepository
{
    public async Task AddAsync(Notification notification)
    {
        await dbContext.Set<Notification>().AddAsync(notification);
    }

    public async Task SaveChangesAsync()
    {
        await dbContext.SaveChangesAsync();
    }
}
