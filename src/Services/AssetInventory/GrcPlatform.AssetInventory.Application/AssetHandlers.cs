using GrcPlatform.AssetInventory.Domain;
using GrcPlatform.AssetInventory.Domain.Enums;

namespace GrcPlatform.AssetInventory.Application;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public sealed record AssetDto(
    Guid Id,
    AssetType Type,
    string Name,
    string? Description,
    string? CustomerId,
    string? CustomerName,
    AssetStatus Status,
    RiskRating RiskRating,
    string OwnerUserId,
    string? CustodianUserId,
    string? Location,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    string? Version,
    DateTimeOffset? PurchaseDate,
    DateTimeOffset? ExpiryDate,
    DateTimeOffset? RetiredAt,
    string? LinkedControlId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    string CreatedByUserId);

public sealed record AssetStatsDto(
    int Total,
    int Active,
    int Inactive,
    int Retired,
    int Disposed,
    int Critical,
    int High,
    int Medium,
    int Low,
    int ExpiringWithin30Days);

// ── Commands ──────────────────────────────────────────────────────────────────

public sealed record CreateAssetCommand(
    AssetType Type,
    string Name,
    string? Description,
    string? CustomerId,
    string? CustomerName,
    RiskRating RiskRating,
    string OwnerUserId,
    string? CustodianUserId,
    string? Location,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    string? Version,
    DateTimeOffset? PurchaseDate,
    DateTimeOffset? ExpiryDate,
    string? LinkedControlId,
    string CreatedByUserId);

public sealed record UpdateAssetCommand(
    Guid Id,
    AssetType Type,
    string Name,
    string? Description,
    string? CustomerId,
    string? CustomerName,
    RiskRating RiskRating,
    AssetStatus Status,
    string OwnerUserId,
    string? CustodianUserId,
    string? Location,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    string? Version,
    DateTimeOffset? PurchaseDate,
    DateTimeOffset? ExpiryDate,
    string? LinkedControlId);

public sealed record DeleteAssetCommand(Guid Id);
public sealed record GetAssetQuery(Guid Id);
public sealed record ListAssetsQuery(
    AssetType? Type = null,
    AssetStatus? Status = null,
    RiskRating? RiskRating = null,
    string? CustomerId = null);

// ── Handlers ──────────────────────────────────────────────────────────────────

public sealed class AssetHandlers(IAssetRepository repo)
{
    public async Task<AssetDto> HandleAsync(CreateAssetCommand cmd, CancellationToken ct = default)
    {
        var asset = Asset.Create(
            cmd.Type, cmd.Name, cmd.Description,
            cmd.CustomerId, cmd.CustomerName,
            cmd.RiskRating, cmd.OwnerUserId, cmd.CustodianUserId, cmd.Location,
            cmd.SerialNumber, cmd.Manufacturer, cmd.Model, cmd.Version,
            cmd.PurchaseDate, cmd.ExpiryDate, cmd.LinkedControlId, cmd.CreatedByUserId);
        await repo.AddAsync(asset, ct);
        await repo.SaveChangesAsync(ct);
        return asset.ToDto();
    }

    public async Task<AssetDto> HandleAsync(UpdateAssetCommand cmd, CancellationToken ct = default)
    {
        var asset = await RequireAsync(cmd.Id, ct);
        asset.Update(
            cmd.Type, cmd.Name, cmd.Description,
            cmd.CustomerId, cmd.CustomerName,
            cmd.RiskRating, cmd.Status,
            cmd.OwnerUserId, cmd.CustodianUserId, cmd.Location,
            cmd.SerialNumber, cmd.Manufacturer, cmd.Model, cmd.Version,
            cmd.PurchaseDate, cmd.ExpiryDate, cmd.LinkedControlId);
        await repo.SaveChangesAsync(ct);
        return asset.ToDto();
    }

    public async Task HandleAsync(DeleteAssetCommand cmd, CancellationToken ct = default)
    {
        var asset = await RequireAsync(cmd.Id, ct);
        await repo.DeleteAsync(asset, ct);
        await repo.SaveChangesAsync(ct);
    }

    public async Task<AssetDto?> HandleAsync(GetAssetQuery query, CancellationToken ct = default)
    {
        var asset = await repo.GetByIdAsync(query.Id, ct);
        return asset?.ToDto();
    }

    public async Task<IReadOnlyList<AssetDto>> HandleAsync(ListAssetsQuery query, CancellationToken ct = default)
    {
        var assets = await repo.ListAsync(query.Type, query.Status, query.RiskRating, query.CustomerId, ct);
        return assets.Select(a => a.ToDto()).ToList();
    }

    public async Task<AssetStatsDto> GetStatsAsync(string? customerId, CancellationToken ct = default)
    {
        var all = await repo.ListAsync(null, null, null, customerId, ct);
        var now = DateTimeOffset.UtcNow;
        var in30 = now.AddDays(30);
        return new AssetStatsDto(
            Total: all.Count,
            Active: all.Count(a => a.Status == AssetStatus.Active),
            Inactive: all.Count(a => a.Status == AssetStatus.Inactive),
            Retired: all.Count(a => a.Status == AssetStatus.Retired),
            Disposed: all.Count(a => a.Status == AssetStatus.Disposed),
            Critical: all.Count(a => a.RiskRating == RiskRating.Critical),
            High: all.Count(a => a.RiskRating == RiskRating.High),
            Medium: all.Count(a => a.RiskRating == RiskRating.Medium),
            Low: all.Count(a => a.RiskRating == RiskRating.Low),
            ExpiringWithin30Days: all.Count(a => a.ExpiryDate.HasValue && a.ExpiryDate.Value <= in30 && a.ExpiryDate.Value >= now && a.Status == AssetStatus.Active));
    }

    public Task<IReadOnlyList<CustomerSummaryDto>> GetCustomerSummariesAsync(CancellationToken ct)
        => repo.GetCustomerSummariesAsync(ct);

    private async Task<Asset> RequireAsync(Guid id, CancellationToken ct)
        => await repo.GetByIdAsync(id, ct)
           ?? throw new KeyNotFoundException($"Asset {id} not found.");
}

// ── Mapping ───────────────────────────────────────────────────────────────────

file static class AssetMappingExtensions
{
    internal static AssetDto ToDto(this Asset a) => new(
        a.Id, a.Type, a.Name, a.Description,
        a.CustomerId, a.CustomerName,
        a.Status, a.RiskRating,
        a.OwnerUserId, a.CustodianUserId, a.Location,
        a.SerialNumber, a.Manufacturer, a.Model, a.Version,
        a.PurchaseDate, a.ExpiryDate, a.RetiredAt, a.LinkedControlId,
        a.CreatedAt, a.UpdatedAt, a.CreatedByUserId);
}
