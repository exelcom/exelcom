namespace GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;

public enum NcSource
{
    InternalAudit,
    ExternalAudit,
    CustomerComplaint,
    IncidentReview,
    ManagementReview,
    SelfAssessment,
    SupplierAudit,
    RegulatoryInspection,
}

public enum NcSeverity
{
    Minor = 1,    // Observation / opportunity for improvement
    Major = 2,    // Single control failure, no systemic breach
    Critical = 3, // Systemic failure / regulatory breach potential
}

public enum NcStatus
{
    Open,
    UnderAnalysis,
    CorrectiveActionInProgress,
    AwaitingEffectivenessReview,
    Closed,
}

public enum CaStatus
{
    Open,
    InProgress,
    Implemented,
}

public enum RcaMethod
{
    FiveWhys,
    Fishbone,   // Ishikawa
}

public enum NcCauseCategory
{
    People,
    Process,
    Technology,
    Environment,
}
