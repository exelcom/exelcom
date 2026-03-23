namespace GrcPlatform.AssetInventory.Domain.Enums;

public enum AssetType
{
    Hardware,
    Software,
    CloudService,
    DataAsset,
    MobileDevice,
    VideoConference,
    CollaborationLicense,
}

public enum AssetStatus
{
    Active,
    Inactive,
    Retired,
    Disposed,
}

public enum RiskRating
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}
