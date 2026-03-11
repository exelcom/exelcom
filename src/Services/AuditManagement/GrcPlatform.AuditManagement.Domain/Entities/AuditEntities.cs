using GrcPlatform.AuditManagement.Domain.Enums;
using GrcPlatform.Shared;
namespace GrcPlatform.AuditManagement.Domain.Entities;
public class Audit : BaseAuditableEntity
{
    private readonly List<AuditFinding> _findings=[];
    private readonly List<EvidenceRequest> _evidenceRequests=[];
    public string Title { get; private set; }=string.Empty;
    public string Scope { get; private set; }=string.Empty;
    public AuditType Type { get; private set; }
    public AuditStatus Status { get; private set; }=AuditStatus.Planning;
    public string LeadAuditor { get; private set; }=string.Empty;
    public DateTime PlannedStartDate { get; private set; }
    public DateTime PlannedEndDate { get; private set; }
    public DateTime? ActualStartDate { get; private set; }
    public DateTime? ActualEndDate { get; private set; }
    public string? ExecutiveSummary { get; private set; }
    public IReadOnlyList<AuditFinding> Findings => _findings.AsReadOnly();
    public IReadOnlyList<EvidenceRequest> EvidenceRequests => _evidenceRequests.AsReadOnly();
    public int CriticalFindings => _findings.Count(f=>f.Severity==FindingSeverity.Critical&&f.Status!=FindingStatus.Closed);
    public int OpenFindings => _findings.Count(f=>f.Status==FindingStatus.Open||f.Status==FindingStatus.InRemediation);
    private Audit() { }
    public static Audit Create(string title, string scope, AuditType type, string leadAuditor, DateTime startDate, DateTime endDate, string createdBy) => new(){Title=title,Scope=scope,Type=type,LeadAuditor=leadAuditor,PlannedStartDate=startDate,PlannedEndDate=endDate,CreatedBy=createdBy};
    public void UpdateDetails(string title, string scope, string leadAuditor, DateTime plannedStartDate, DateTime plannedEndDate, string updatedBy) { Title=title; Scope=scope; LeadAuditor=leadAuditor; PlannedStartDate=plannedStartDate; PlannedEndDate=plannedEndDate; UpdatedAt=DateTime.UtcNow; UpdatedBy=updatedBy; }
    public void Start(string by) { Status=AuditStatus.InProgress; ActualStartDate=DateTime.UtcNow; UpdatedAt=DateTime.UtcNow; UpdatedBy=by; }
    public void Close(string summary, string by) { Status=AuditStatus.Closed; ActualEndDate=DateTime.UtcNow; ExecutiveSummary=summary; UpdatedAt=DateTime.UtcNow; UpdatedBy=by; }
    public AuditFinding AddFinding(string title, string description, FindingSeverity severity, string? recommendation, DateTime dueDate, string createdBy) { var f=AuditFinding.Create(Id,title,description,severity,recommendation,dueDate,createdBy); _findings.Add(f); UpdatedAt=DateTime.UtcNow; UpdatedBy=createdBy; return f; }
    public EvidenceRequest RequestEvidence(string title, string description, string requestedFrom, DateTime dueDate, string createdBy) { var r=EvidenceRequest.Create(Id,title,description,requestedFrom,dueDate,createdBy); _evidenceRequests.Add(r); return r; }
}
public class AuditFinding : BaseEntity
{
    public Guid AuditId { get; private set; }
    public string Title { get; private set; }=string.Empty;
    public string Description { get; private set; }=string.Empty;
    public FindingSeverity Severity { get; private set; }
    public FindingStatus Status { get; private set; }=FindingStatus.Open;
    public string? Recommendation { get; private set; }
    public string? ManagementResponse { get; private set; }
    public DateTime RemediationDueDate { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public string? Owner { get; private set; }
    private AuditFinding() { }
    public static AuditFinding Create(Guid auditId, string title, string description, FindingSeverity severity, string? recommendation, DateTime dueDate, string createdBy) => new(){AuditId=auditId,Title=title,Description=description,Severity=severity,Recommendation=recommendation,RemediationDueDate=dueDate,CreatedBy=createdBy};
    public void UpdateStatus(FindingStatus status, string? mgmtResponse, string? owner, string by) { Status=status; ManagementResponse=mgmtResponse??ManagementResponse; Owner=owner??Owner; if(status==FindingStatus.Resolved) ResolvedAt=DateTime.UtcNow; UpdatedAt=DateTime.UtcNow; UpdatedBy=by; }
}
public class EvidenceRequest : BaseEntity
{
    public Guid AuditId { get; private set; }
    public string Title { get; private set; }=string.Empty;
    public string Description { get; private set; }=string.Empty;
    public string RequestedFrom { get; private set; }=string.Empty;
    public EvidenceStatus Status { get; private set; }=EvidenceStatus.Requested;
    public DateTime DueDate { get; private set; }
    public string? BlobUrl { get; private set; }
    public DateTime? SubmittedAt { get; private set; }
    private EvidenceRequest() { }
    public static EvidenceRequest Create(Guid auditId, string title, string description, string requestedFrom, DateTime dueDate, string createdBy) => new(){AuditId=auditId,Title=title,Description=description,RequestedFrom=requestedFrom,DueDate=dueDate,CreatedBy=createdBy};
    public void Submit(string blobUrl, string by) { Status=EvidenceStatus.Submitted; BlobUrl=blobUrl; SubmittedAt=DateTime.UtcNow; UpdatedAt=DateTime.UtcNow; UpdatedBy=by; }
}

