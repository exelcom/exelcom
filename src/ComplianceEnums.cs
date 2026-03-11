namespace GrcPlatform.ComplianceTracking.Domain.Enums;

public enum FrameworkType
{
    ISO27001 = 1,
    SOC2 = 2,
    NIST = 3,
    PCIDSS = 4,
    GDPR = 5,
    AustralianPrivacyAct = 6,
    APRA = 7,
    Custom = 99
}

public enum ControlStatus
{
    NotImplemented = 1,
    InProgress = 2,
    Implemented = 3,
    Verified = 4,
    NotApplicable = 5
}

public enum CompliancePosture
{
    NonCompliant = 1,
    PartiallyCompliant = 2,
    Compliant = 3,
    Exceeds = 4
}

public enum EvidenceType
{
    Document = 1,
    Screenshot = 2,
    LogFile = 3,
    PolicyDocument = 4,
    TestResult = 5,
    Attestation = 6
}
