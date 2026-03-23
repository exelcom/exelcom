using GrcPlatform.AssetInventory.Domain.Enums;

namespace GrcPlatform.AssetInventory.Domain;

/// <summary>
/// Represents an information asset in the Exelcom asset inventory.
/// Covers hardware, software, cloud services, data assets, mobile devices,
/// video conferencing equipment, and collaboration licenses.
/// Assets may belong to Exelcom internally or be managed on behalf of external customers.
/// </summary>
public sealed class Asset
{
    public Guid Id { get; private set; }

    // ── Identity ─────────────────────────────────────────────────────────────
    public string Name { get; private set; } = default!;
    public AssetType Type { get; private set; }
    public string? Description { get; private set; }

    // ── Customer / tenancy ────────────────────────────────────────────────────
    /// <summary>Null = Exelcom internal asset. Non-null = managed on behalf of this customer.</summary>
    public string? CustomerId { get; private set; }
    public string? CustomerName { get; private set; }

    // ── Classification ────────────────────────────────────────────────────────
    public AssetStatus Status { get; private set; }
    public RiskRating RiskRating { get; private set; }

    // ── Ownership ─────────────────────────────────────────────────────────────
    public string OwnerUserId { get; private set; } = default!;
    public string? CustodianUserId { get; private set; }
    public string? Location { get; private set; }

    // ── Technical details ─────────────────────────────────────────────────────
    public string? SerialNumber { get; private set; }
    public string? Manufacturer { get; private set; }
    public string? Model { get; private set; }
    public string? Version { get; private set; }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    public DateTimeOffset? PurchaseDate { get; private set; }
    public DateTimeOffset? ExpiryDate { get; private set; }
    public DateTimeOffset? RetiredAt { get; private set; }

    // ── Compliance linkage ────────────────────────────────────────────────────
    public string? LinkedControlId { get; private set; }

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public string CreatedByUserId { get; private set; } = default!;

    private Asset() { } // EF Core

    public static Asset Create(
        AssetType type,
        string name,
        string? description,
        string? customerId,
        string? customerName,
        RiskRating riskRating,
        string ownerUserId,
        string? custodianUserId,
        string? location,
        string? serialNumber,
        string? manufacturer,
        string? model,
        string? version,
        DateTimeOffset? purchaseDate,
        DateTimeOffset? expiryDate,
        string? linkedControlId,
        string createdByUserId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(ownerUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);

        return new Asset
        {
            Id = Guid.NewGuid(),
            Type = type,
            Name = name,
            Description = description,
            CustomerId = string.IsNullOrWhiteSpace(customerId) ? null : customerId.Trim(),
            CustomerName = string.IsNullOrWhiteSpace(customerName) ? null : customerName.Trim(),
            Status = AssetStatus.Active,
            RiskRating = riskRating,
            OwnerUserId = ownerUserId,
            CustodianUserId = custodianUserId,
            Location = location,
            SerialNumber = serialNumber,
            Manufacturer = manufacturer,
            Model = model,
            Version = version,
            PurchaseDate = purchaseDate,
            ExpiryDate = expiryDate,
            LinkedControlId = linkedControlId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            CreatedByUserId = createdByUserId,
        };
    }

    public void Update(
        AssetType type,
        string name,
        string? description,
        string? customerId,
        string? customerName,
        RiskRating riskRating,
        AssetStatus status,
        string ownerUserId,
        string? custodianUserId,
        string? location,
        string? serialNumber,
        string? manufacturer,
        string? model,
        string? version,
        DateTimeOffset? purchaseDate,
        DateTimeOffset? expiryDate,
        string? linkedControlId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(ownerUserId);

        Type = type;
        Name = name;
        Description = description;
        CustomerId = string.IsNullOrWhiteSpace(customerId) ? null : customerId.Trim();
        CustomerName = string.IsNullOrWhiteSpace(customerName) ? null : customerName.Trim();
        RiskRating = riskRating;
        Status = status;
        OwnerUserId = ownerUserId;
        CustodianUserId = custodianUserId;
        Location = location;
        SerialNumber = serialNumber;
        Manufacturer = manufacturer;
        Model = model;
        Version = version;
        PurchaseDate = purchaseDate;
        ExpiryDate = expiryDate;
        LinkedControlId = linkedControlId;

        if (status == AssetStatus.Retired && RetiredAt is null)
            RetiredAt = DateTimeOffset.UtcNow;

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
