using safefy_api_core.Models.Database;

namespace safefy_api_core.Interfaces;

public interface INotificationRepository
{
    Task AddAsync(Notification notification);
    Task SaveChangesAsync();
}
