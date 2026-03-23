using GrcPlatform.AssetInventory.Domain;
using GrcPlatform.AssetInventory.Domain.Enums;
using GrcPlatform.AssetInventory.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.AssetInventory.Infrastructure;

public sealed class AssetRepository(AssetDbContext db) : IAssetRepository
{
    public Task<Asset?> GetByIdAsync(Guid id, CancellationToken ct)
        => db.Assets.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<IReadOnlyList<Asset>> ListAsync(
        AssetType? type, AssetStatus? status, RiskRating? riskRating, string? customerId, CancellationToken ct)
    {
        var query = db.Assets.AsNoTracking().AsQueryable();
        if (type is not null) query = query.Where(a => a.Type == type);
        if (status is not null) query = query.Where(a => a.Status == status);
        if (riskRating is not null) query = query.Where(a => a.RiskRating == riskRating);
        if (customerId == "__exelcom__")
            query = query.Where(a => a.CustomerId == null);
        else if (customerId is not null)
            query = query.Where(a => a.CustomerId == customerId);
        return await query.OrderByDescending(a => a.RiskRating)
                          .ThenBy(a => a.Name)
                          .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CustomerSummaryDto>> GetCustomerSummariesAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var in30 = now.AddDays(30);

        // Exelcom internal
        var internal_ = await db.Assets.AsNoTracking()
            .Where(a => a.CustomerId == null)
            .ToListAsync(ct);

        var result = new List<CustomerSummaryDto>();

        if (internal_.Any())
            result.Add(new CustomerSummaryDto(
                "__exelcom__", "Exelcom (Internal)",
                internal_.Count,
                internal_.Count(a => a.Status == AssetStatus.Active),
                internal_.Count(a => a.RiskRating == RiskRating.Critical),
                internal_.Count(a => a.ExpiryDate.HasValue && a.ExpiryDate.Value <= in30 && a.ExpiryDate.Value >= now && a.Status == AssetStatus.Active)));

        // External customers
        var customers = await db.Assets.AsNoTracking()
            .Where(a => a.CustomerId != null)
            .GroupBy(a => new { a.CustomerId, a.CustomerName })
            .Select(g => new { g.Key.CustomerId, g.Key.CustomerName, Assets = g.ToList() })
            .ToListAsync(ct);

        foreach (var c in customers)
        {
            result.Add(new CustomerSummaryDto(
                c.CustomerId!,
                c.CustomerName ?? c.CustomerId!,
                c.Assets.Count,
                c.Assets.Count(a => a.Status == AssetStatus.Active),
                c.Assets.Count(a => a.RiskRating == RiskRating.Critical),
                c.Assets.Count(a => a.ExpiryDate.HasValue && a.ExpiryDate.Value <= in30 && a.ExpiryDate.Value >= now && a.Status == AssetStatus.Active)));
        }

        return result.OrderBy(r => r.CustomerName).ToList();
    }

    public async Task AddAsync(Asset asset, CancellationToken ct)
        => await db.Assets.AddAsync(asset, ct);

    public Task DeleteAsync(Asset asset, CancellationToken ct)
    {
        db.Assets.Remove(asset);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct)
        => db.SaveChangesAsync(ct);
}
