using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Logs.ReadListLogs;

public sealed class ReadListLogsEndpoint(
    LogDbContext logDbContext,
    PrimaryDbContext primaryDbContext
) : Endpoint<ReadListLogsRequest, ReadListLogsResponse>
{
    public override void Configure()
    {
        Get("logs");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        switch (req.Type)
        {
            case AdminLogType.Security:
                await HandleSecurityLogsAsync(req, ct);
                return;

            case AdminLogType.Email:
                await HandleEmailLogsAsync(req, ct);
                return;

            case AdminLogType.AcquirerWebhook:
                await HandleAcquirerWebhookLogsAsync(req, ct);
                return;

            default:
                await HandleApiLogsAsync(req, ct);
                return;
        }
    }

    private async Task HandleApiLogsAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        var query = logDbContext.ApiLogs.AsNoTracking();

        if (req.MerchantId.HasValue)
        {
            query = query.Where(l => l.MerchantId == req.MerchantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.AcquirerType))
        {
            query = query.Where(l => l.AcquirerType == req.AcquirerType);
        }

        if (req.StatusCode.HasValue)
        {
            query = query.Where(l => l.StatusCode == req.StatusCode.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Action))
        {
            query = query.Where(l => l.Action == req.Action);
        }

        if (req.StartDate.HasValue)
        {
            var startUtc = EnsureUtc(req.StartDate.Value);
            query = query.Where(l => l.CreatedAt >= startUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endUtc = EnsureUtc(req.EndDate.Value);
            query = query.Where(l => l.CreatedAt <= endUtc);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(l =>
                (l.Endpoint != null && l.Endpoint.ToLower().Contains(search)) ||
                (l.Details != null && l.Details.ToLower().Contains(search)) ||
                (l.ResponseBody != null && l.ResponseBody.ToLower().Contains(search)) ||
                (l.ErrorCode != null && l.ErrorCode.ToLower().Contains(search)) ||
                (l.AcquirerType != null && l.AcquirerType.ToLower().Contains(search))
            );
        }

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var merchantIds = logs
            .Select(l => l.MerchantId)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        var merchantInfo = merchantIds.Count == 0
            ? new Dictionary<Guid, (string? Name, string? Document)>()
            : await primaryDbContext.Merchants
                .AsNoTracking()
                .Where(m => merchantIds.Contains(m.Id))
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    Document = m.MerchantKyc != null ? m.MerchantKyc.DocumentNumber : null
                })
                .ToDictionaryAsync(m => m.Id, m => (m.Name, m.Document), ct);

        var items = logs
            .Select(log =>
            {
                merchantInfo.TryGetValue(log.MerchantId, out var info);
                return AdminLogMapper.ToApiData(log, info.Name, info.Document);
            })
            .ToList();

        await Send.ResponseAsync(new ReadListLogsResponse
        {
            Data = new Paginated<AdminLogEntryData>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, cancellation: ct);
    }

    private async Task HandleSecurityLogsAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        var query = logDbContext.SecurityLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(req.Action) && Enum.TryParse<SecurityLogAction>(req.Action, out var action))
        {
            query = query.Where(l => l.Action == action);
        }

        if (req.StartDate.HasValue)
        {
            var startUtc = EnsureUtc(req.StartDate.Value);
            query = query.Where(l => l.CreatedAt >= startUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endUtc = EnsureUtc(req.EndDate.Value);
            query = query.Where(l => l.CreatedAt <= endUtc);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(l =>
                (l.UserEmail != null && l.UserEmail.ToLower().Contains(search)) ||
                (l.Details != null && l.Details.ToLower().Contains(search))
            );
        }

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = logs.Select(AdminLogMapper.ToSecurityData).ToList();

        await Send.ResponseAsync(new ReadListLogsResponse
        {
            Data = new Paginated<AdminLogEntryData>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, cancellation: ct);
    }

    private async Task HandleEmailLogsAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        var query = logDbContext.EmailLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(req.Action))
        {
            query = query.Where(l => l.Template == req.Action);
        }

        if (req.MerchantId.HasValue)
        {
            query = query.Where(l => l.MerchantId == req.MerchantId.Value);
        }

        if (req.StartDate.HasValue)
        {
            var startUtc = EnsureUtc(req.StartDate.Value);
            query = query.Where(l => l.CreatedAt >= startUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endUtc = EnsureUtc(req.EndDate.Value);
            query = query.Where(l => l.CreatedAt <= endUtc);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(l =>
                (l.To != null && l.To.ToLower().Contains(search)) ||
                (l.Subject != null && l.Subject.ToLower().Contains(search)) ||
                (l.Template != null && l.Template.ToLower().Contains(search)) ||
                (l.ErrorMessage != null && l.ErrorMessage.ToLower().Contains(search))
            );
        }

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var merchantIds = logs
            .Select(l => l.MerchantId)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var merchantInfo = merchantIds.Count == 0
            ? new Dictionary<Guid, (string? Name, string? Document)>()
            : await primaryDbContext.Merchants
                .AsNoTracking()
                .Where(m => merchantIds.Contains(m.Id))
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    Document = m.MerchantKyc != null ? m.MerchantKyc.DocumentNumber : null
                })
                .ToDictionaryAsync(m => m.Id, m => (m.Name, m.Document), ct);

        var items = logs
            .Select(log =>
            {
                if (!log.MerchantId.HasValue)
                {
                    return AdminLogMapper.ToEmailData(log, null, null);
                }

                merchantInfo.TryGetValue(log.MerchantId.Value, out var info);
                return AdminLogMapper.ToEmailData(log, info.Name, info.Document);
            })
            .ToList();

        await Send.ResponseAsync(new ReadListLogsResponse
        {
            Data = new Paginated<AdminLogEntryData>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, cancellation: ct);
    }

    private async Task HandleAcquirerWebhookLogsAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        var query = logDbContext.AcquirerWebhookLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(req.AcquirerType))
        {
            query = query.Where(l => l.AcquirerType == req.AcquirerType || l.AcquirerCode == req.AcquirerType);
        }

        if (req.StatusCode.HasValue)
        {
            query = query.Where(l => l.StatusCode == req.StatusCode.Value);
        }

        if (req.StartDate.HasValue)
        {
            var startUtc = EnsureUtc(req.StartDate.Value);
            query = query.Where(l => l.CreatedAt >= startUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endUtc = EnsureUtc(req.EndDate.Value);
            query = query.Where(l => l.CreatedAt <= endUtc);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(l =>
                l.AcquirerType.ToLower().Contains(search)
                || l.AcquirerCode.ToLower().Contains(search)
                || l.Endpoint.ToLower().Contains(search)
                || (l.RequestBody != null && l.RequestBody.ToLower().Contains(search))
                || (l.RequestHeaders != null && l.RequestHeaders.ToLower().Contains(search))
                || (l.IpAddress != null && l.IpAddress.ToLower().Contains(search))
            );
        }

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var acquirerIds = logs
            .Where(l => l.AcquirerId.HasValue)
            .Select(l => l.AcquirerId!.Value)
            .Distinct()
            .ToList();

        var acquirerCodes = logs
            .Select(l => l.AcquirerCode)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var acquirerCodesLower = acquirerCodes
            .Select(code => code.ToLowerInvariant())
            .Distinct()
            .ToList();

        var acquirerTypes = logs
            .Select(l => l.AcquirerType)
            .Where(type => !string.IsNullOrWhiteSpace(type))
            .Select(type => type!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var acquirerTypeEnums = acquirerTypes
            .Select(type => Enum.TryParse<AcquirerType>(type, true, out var parsedType)
                ? (AcquirerType?)parsedType
                : null)
            .Where(type => type.HasValue)
            .Select(type => type!.Value)
            .Distinct()
            .ToList();

        var acquirerLookup = new List<(Guid Id, string Code, string Type, string? DisplayName, string? LogoUrl)>();

        if (acquirerIds.Count > 0 || acquirerCodesLower.Count > 0 || acquirerTypeEnums.Count > 0)
        {
            acquirerLookup = await primaryDbContext.Acquirers
                .AsNoTracking()
                .Where(a => acquirerIds.Contains(a.Id)
                    || acquirerCodesLower.Contains(a.Code.ToLower())
                    || acquirerTypeEnums.Contains(a.Type))
                .Select(a => new ValueTuple<Guid, string, string, string?, string?>(
                    a.Id,
                    a.Code,
                    a.Type.ToString(),
                    string.IsNullOrWhiteSpace(a.DisplayName) ? a.Name : a.DisplayName,
                    a.LogoUrl))
                .ToListAsync(ct);
        }

        var byId = acquirerLookup
            .ToDictionary(a => a.Id, a => (a.DisplayName, a.LogoUrl));

        var byCode = acquirerLookup
            .GroupBy(a => a.Code, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => (g.First().DisplayName, g.First().LogoUrl), StringComparer.OrdinalIgnoreCase);

        var byType = acquirerLookup
            .GroupBy(a => a.Type, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => (g.First().DisplayName, g.First().LogoUrl), StringComparer.OrdinalIgnoreCase);

        var items = logs
            .Select(log =>
            {
                (string? DisplayName, string? LogoUrl) acquirerInfo = (null, null);

                if (log.AcquirerId.HasValue && byId.TryGetValue(log.AcquirerId.Value, out var fromId))
                {
                    acquirerInfo = fromId;
                }
                else if (!string.IsNullOrWhiteSpace(log.AcquirerCode) && byCode.TryGetValue(log.AcquirerCode.Trim(), out var fromCode))
                {
                    acquirerInfo = fromCode;
                }
                else if (!string.IsNullOrWhiteSpace(log.AcquirerType) && byType.TryGetValue(log.AcquirerType.Trim(), out var fromType))
                {
                    acquirerInfo = fromType;
                }

                return AdminLogMapper.ToAcquirerWebhookData(log, acquirerInfo.DisplayName, acquirerInfo.LogoUrl);
            })
            .ToList();

        await Send.ResponseAsync(new ReadListLogsResponse
        {
            Data = new Paginated<AdminLogEntryData>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, cancellation: ct);
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
