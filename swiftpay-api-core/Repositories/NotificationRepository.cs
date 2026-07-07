using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Repositories;

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
