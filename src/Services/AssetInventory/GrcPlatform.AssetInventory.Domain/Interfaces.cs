using GrcPlatform.AssetInventory.Domain.Enums;

namespace GrcPlatform.AssetInventory.Domain;

public interface IAssetRepository
{
    Task<Asset?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Asset>> ListAsync(AssetType? type, AssetStatus? status, RiskRating? riskRating, string? customerId, CancellationToken ct);
    Task<IReadOnlyList<CustomerSummaryDto>> GetCustomerSummariesAsync(CancellationToken ct);
    Task AddAsync(Asset asset, CancellationToken ct);
    Task DeleteAsync(Asset asset, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}

public sealed record CustomerSummaryDto(
    string CustomerId,
    string CustomerName,
    int Total,
    int Active,
    int Critical,
    int ExpiringWithin30Days);
