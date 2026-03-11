using GrcPlatform.StatementOfApplicability.Domain.Enums;
namespace GrcPlatform.StatementOfApplicability.Domain.Entities;

public class AnnexAControl
{
    public Guid Id { get; private set; }
    public string ControlId { get; private set; } = string.Empty;
    public string ControlName { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public AnnexADomain Domain { get; private set; }
    public int SortOrder { get; private set; }
    public ControlApplicability Applicability { get; private set; } = ControlApplicability.Applicable;
    public string? JustificationForExclusion { get; private set; }
    public ImplementationStatus ImplementationStatus { get; private set; } = ImplementationStatus.NotStarted;
    public string? ImplementationNotes { get; private set; }
    public string? ResponsibleOwner { get; private set; }
    public DateTime? TargetDate { get; private set; }
    public DateTime? CompletedDate { get; private set; }
    public string? EvidenceReference { get; private set; }
    public string? UpdatedBy { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private AnnexAControl() { }

    public static AnnexAControl Create(string controlId, string controlName, string description, AnnexADomain domain, int sortOrder) =>
        new() { Id = Guid.NewGuid(), ControlId = controlId, ControlName = controlName, Description = description, Domain = domain, SortOrder = sortOrder, CreatedAt = DateTime.UtcNow };

    public void UpdateApplicability(ControlApplicability applicability, string? justification, string updatedBy)
    {
        Applicability = applicability;
        JustificationForExclusion = applicability == ControlApplicability.NotApplicable ? justification : null;
        if (applicability == ControlApplicability.NotApplicable) ImplementationStatus = ImplementationStatus.NotStarted;
        UpdatedBy = updatedBy; UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateImplementation(ImplementationStatus status, string? notes, string? owner, DateTime? targetDate, string? evidenceRef, string updatedBy)
    {
        ImplementationStatus = status; ImplementationNotes = notes; ResponsibleOwner = owner;
        TargetDate = targetDate; EvidenceReference = evidenceRef;
        if (status == ImplementationStatus.Verified || status == ImplementationStatus.Implemented) CompletedDate ??= DateTime.UtcNow;
        else CompletedDate = null;
        UpdatedBy = updatedBy; UpdatedAt = DateTime.UtcNow;
    }
}
