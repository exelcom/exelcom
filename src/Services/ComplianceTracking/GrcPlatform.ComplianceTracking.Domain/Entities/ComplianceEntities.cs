using GrcPlatform.ComplianceTracking.Domain.Enums;
using GrcPlatform.ComplianceTracking.Domain.Events;
using GrcPlatform.Shared;
namespace GrcPlatform.ComplianceTracking.Domain.Entities;
public class ComplianceFramework : BaseAuditableEntity
{
    private readonly List<ComplianceControl> _controls = [];
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public FrameworkType Type { get; private set; }
    public string Version { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public IReadOnlyList<ComplianceControl> Controls => _controls.AsReadOnly();
    public int TotalControls => _controls.Count(c => c.Status != ControlStatus.NotApplicable);
    public int ImplementedControls => _controls.Count(c => c.Status == ControlStatus.Implemented || c.Status == ControlStatus.Verified);
    public double CompliancePercentage => TotalControls == 0 ? 0 : Math.Round((double)ImplementedControls / TotalControls * 100, 1);
    private ComplianceFramework() { }
    public static ComplianceFramework Create(string name, string description, FrameworkType type, string version, string createdBy) => new() { Name=name, Description=description, Type=type, Version=version, CreatedBy=createdBy };
    public void UpdateDetails(string name, string description, string version, bool isActive, string updatedBy) { Name=name; Description=description; Version=version; IsActive=isActive; UpdatedAt=DateTime.UtcNow; UpdatedBy=updatedBy; }
    public void AddControl(string controlId, string title, string description, string? guidance, string createdBy) { _controls.Add(ComplianceControl.Create(Id, controlId, title, description, guidance, createdBy)); UpdatedAt=DateTime.UtcNow; UpdatedBy=createdBy; }
}
public class ComplianceControl : BaseAuditableEntity
{
    private readonly List<ControlEvidence> _evidence = [];
    private readonly List<IDomainEvent> _domainEvents = [];
    public Guid FrameworkId { get; private set; }
    public string ControlId { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string? Guidance { get; private set; }
    public ControlStatus Status { get; private set; } = ControlStatus.NotImplemented;
    public CompliancePosture? Posture { get; private set; }
    public string? Owner { get; private set; }
    public string? ImplementationNotes { get; private set; }
    public DateTime? LastAssessedAt { get; private set; }
    public DateTime? NextReviewDate { get; private set; }
    public IReadOnlyList<ControlEvidence> Evidence => _evidence.AsReadOnly();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    private ComplianceControl() { }
    public static ComplianceControl Create(Guid frameworkId, string controlId, string title, string description, string? guidance, string createdBy) => new() { FrameworkId=frameworkId, ControlId=controlId, Title=title, Description=description, Guidance=guidance, CreatedBy=createdBy };
    public void UpdateImplementation(ControlStatus status, CompliancePosture posture, string? notes, string? owner, DateTime? nextReviewDate, string updatedBy) { var prev=Status; Status=status; Posture=posture; ImplementationNotes=notes; Owner=owner; NextReviewDate=nextReviewDate; LastAssessedAt=DateTime.UtcNow; UpdatedAt=DateTime.UtcNow; UpdatedBy=updatedBy; if(prev!=status) _domainEvents.Add(new ControlStatusChangedEvent(Id,FrameworkId,prev,status,updatedBy)); }
    public void AddEvidence(string fileName, string blobUrl, EvidenceType type, string description, string uploadedBy) { _evidence.Add(ControlEvidence.Create(Id,fileName,blobUrl,type,description,uploadedBy)); UpdatedAt=DateTime.UtcNow; UpdatedBy=uploadedBy; }
    public void ClearDomainEvents() => _domainEvents.Clear();
}
public class ControlEvidence : BaseEntity
{
    public Guid ControlId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string BlobUrl { get; private set; } = string.Empty;
    public EvidenceType Type { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public DateTime UploadedAt { get; private set; } = DateTime.UtcNow;
    private ControlEvidence() { }
    public static ControlEvidence Create(Guid controlId, string fileName, string blobUrl, EvidenceType type, string description, string uploadedBy) => new() { ControlId=controlId, FileName=fileName, BlobUrl=blobUrl, Type=type, Description=description, CreatedBy=uploadedBy };
}

