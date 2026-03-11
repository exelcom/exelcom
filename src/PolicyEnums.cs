using GrcPlatform.Shared;

namespace GrcPlatform.PolicyManagement.Domain.Enums;

public enum PolicyStatus
{
    Draft = 1,
    UnderReview = 2,
    Approved = 3,
    Published = 4,
    Retired = 5
}

public enum PolicyCategory
{
    InformationSecurity = 1,
    DataPrivacy = 2,
    RiskManagement = 3,
    BusinessContinuity = 4,
    HumanResources = 5,
    Legal = 6,
    Operational = 7
}

public enum AttestationStatus
{
    Pending = 1,
    Attested = 2,
    Declined = 3,
    Overdue = 4
}
