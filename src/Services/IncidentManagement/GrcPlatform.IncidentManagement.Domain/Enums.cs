namespace GrcPlatform.IncidentManagement.Domain.Enums;

public enum IncidentType
{
    Security,       // Breach, malware, unauthorised access
    IT,             // Outage, failure, degraded service
    Physical,       // Theft, damage, environmental
    PrivacyBreach,  // Data breach, privacy violation
}

public enum IncidentSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

public enum IncidentStatus
{
    New,
    Investigating,
    Contained,
    Resolved,
    Closed,
}

public enum ActionType
{
    Containment,
    Remediation,
    Communication,
    Evidence,
    Other,
}

public enum ActionStatus
{
    Pending,
    InProgress,
    Completed,
}
