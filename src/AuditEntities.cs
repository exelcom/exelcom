using GrcPlatform.AuditManagement.Domain.Enums;
using GrcPlatform.Shared;

namespace GrcPlatform.AuditManagement.Domain.Entities;

public class Audit : BaseAuditableEntity
{
    private readonly List<AuditFinding> _findings = [];
    private readonly List<EvidenceRequest> _evidenceRequests = [];

    public string Title { get; private set; } = string.Empty;
    public string Scope { get; private set; } = string.Empty;
    public AuditType Type { get; private set; }
    public AuditStatus Status { get; private set; } = AuditStatus.Planning;
    public string LeadAuditor { get; private set; } = string.Empty;
    public DateTime PlannedStartDate { get; private set; }
    public DateTime PlannedEndDate { get; private set; }
    public DateTime? ActualStartDate { get; private set; }
    public DateTime? ActualEndDate { get; private set; }
    public string? ExecutiveSummary { get; private set; }

    public IReadOnlyList<AuditFinding> Findings => _findings.AsReadOnly();
    public IReadOnlyList<EvidenceRequest> EvidenceRequests => _evidenceRequests.AsReadOnly();

    public int CriticalFindings => _findings.Count(f => f.Severity == FindingSeverity.Critical && f.Status != FindingStatus.Closed);
    public int OpenFindings => _findings.Count(f => f.Status == FindingStatus.Open || f.Status == FindingStatus.InRemediation);

    private Audit() { }

    public static Audit Create(string title, string scope, AuditType type, string leadAuditor,
        DateTime startDate, DateTime endDate, string createdBy) => new()
    {
        Title = title, Scope = scope, Type = type, LeadAuditor = leadAuditor,
        PlannedStartDate = startDate, PlannedEndDate = endDate, CreatedBy = createdBy
    };

    public void Start(string startedBy)
    {
        Status = AuditStatus.InProgress;
        ActualStartDate = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = startedBy;
    }

    public void CompleteFieldwork(string completedBy)
    {
        Status = AuditStatus.FieldworkComplete;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = completedBy;
    }

    public void Close(string executiveSummary, string closedBy)
    {
        Status = AuditStatus.Closed;
        ActualEndDate = DateTime.UtcNow;
        ExecutiveSummary = executiveSummary;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = closedBy;
    }

    public AuditFinding AddFinding(string title, string description, FindingSeverity severity,
        string? recommendation, DateTime remediationDueDate, string createdBy)
    {
        var finding = AuditFinding.Create(Id, title, description, severity, recommendation, remediationDueDate, createdBy);
        _findings.Add(finding);
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = createdBy;
        return finding;
    }

    public EvidenceRequest RequestEvidence(string title, string description,
        string requestedFrom, DateTime dueDate, string createdBy)
    {
        var request = EvidenceRequest.Create(Id, title, description, requestedFrom, dueDate, createdBy);
        _evidenceRequests.Add(request);
        return request;
    }
}

public class AuditFinding : BaseEntity
{
    public Guid AuditId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public FindingSeverity Severity { get; private set; }
    public FindingStatus Status { get; private set; } = FindingStatus.Open;
    public string? Recommendation { get; private set; }
    public string? ManagementResponse { get; private set; }
    public DateTime RemediationDueDate { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public string? Owner { get; private set; }

    private AuditFinding() { }

    public static AuditFinding Create(Guid auditId, string title, string description,
        FindingSeverity severity, string? recommendation, DateTime dueDate, string createdBy) => new()
    {
        AuditId = auditId, Title = title, Description = description, Severity = severity,
        Recommendation = recommendation, RemediationDueDate = dueDate, CreatedBy = createdBy
    };

    public void UpdateStatus(FindingStatus status, string? managementResponse, string? owner, string updatedBy)
    {
        Status = status;
        ManagementResponse = managementResponse ?? ManagementResponse;
        Owner = owner ?? Owner;
        if (status == FindingStatus.Resolved) ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
    }
}

public class EvidenceRequest : BaseEntity
{
    public Guid AuditId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string RequestedFrom { get; private set; } = string.Empty;
    public EvidenceStatus Status { get; private set; } = EvidenceStatus.Requested;
    public DateTime DueDate { get; private set; }
    public string? BlobUrl { get; private set; }
    public DateTime? SubmittedAt { get; private set; }

    private EvidenceRequest() { }

    public static EvidenceRequest Create(Guid auditId, string title, string description,
        string requestedFrom, DateTime dueDate, string createdBy) => new()
    {
        AuditId = auditId, Title = title, Description = description,
        RequestedFrom = requestedFrom, DueDate = dueDate, CreatedBy = createdBy
    };

    public void Submit(string blobUrl, string submittedBy)
    {
        Status = EvidenceStatus.Submitted;
        BlobUrl = blobUrl;
        SubmittedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = submittedBy;
    }

    public void Accept(string acceptedBy) { Status = EvidenceStatus.Accepted; UpdatedBy = acceptedBy; UpdatedAt = DateTime.UtcNow; }
    public void Reject(string rejectedBy) { Status = EvidenceStatus.Rejected; UpdatedBy = rejectedBy; UpdatedAt = DateTime.UtcNow; }
}
