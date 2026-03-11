using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.RiskManagement.Domain.Events;
using GrcPlatform.Shared;

namespace GrcPlatform.RiskManagement.Domain.Entities;

public class Risk : BaseAuditableEntity
{
    private readonly List<RiskTreatment> _treatments = [];
    private readonly List<RiskReview> _reviews = [];
    private readonly List<IDomainEvent> _domainEvents = [];

    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public RiskCategory Category { get; private set; }
    public RiskStatus Status { get; private set; }
    public RiskLikelihood InherentLikelihood { get; private set; }
    public RiskImpact InherentImpact { get; private set; }
    public RiskLikelihood? ResidualLikelihood { get; private set; }
    public RiskImpact? ResidualImpact { get; private set; }
    public string? Owner { get; private set; }
    public string? Department { get; private set; }
    public DateTime? ReviewDueDate { get; private set; }
    public string? RegulatoryReference { get; private set; }

    public int InherentScore => (int)InherentLikelihood * (int)InherentImpact;
    public int? ResidualScore => ResidualLikelihood.HasValue && ResidualImpact.HasValue
        ? (int)ResidualLikelihood.Value * (int)ResidualImpact.Value
        : null;
    public string RiskRating => InherentScore switch
    {
        >= 20 => "Critical",
        >= 12 => "High",
        >= 6  => "Medium",
        _     => "Low"
    };

    public IReadOnlyList<RiskTreatment> Treatments => _treatments.AsReadOnly();
    public IReadOnlyList<RiskReview> Reviews => _reviews.AsReadOnly();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    // EF Core constructor
    private Risk() { }

    public static Risk Create(
        string title,
        string description,
        RiskCategory category,
        RiskLikelihood likelihood,
        RiskImpact impact,
        string createdBy,
        string? owner = null,
        string? department = null,
        DateTime? reviewDueDate = null,
        string? regulatoryReference = null)
    {
        var risk = new Risk
        {
            Title = title,
            Description = description,
            Category = category,
            Status = RiskStatus.Identified,
            InherentLikelihood = likelihood,
            InherentImpact = impact,
            Owner = owner,
            Department = department,
            ReviewDueDate = reviewDueDate,
            RegulatoryReference = regulatoryReference,
            CreatedBy = createdBy
        };

        risk._domainEvents.Add(new RiskCreatedEvent(risk.Id, title, createdBy));
        return risk;
    }

    public void UpdateAssessment(
        RiskLikelihood likelihood,
        RiskImpact impact,
        RiskLikelihood? residualLikelihood,
        RiskImpact? residualImpact,
        string updatedBy)
    {
        InherentLikelihood = likelihood;
        InherentImpact = impact;
        ResidualLikelihood = residualLikelihood;
        ResidualImpact = residualImpact;
        Status = RiskStatus.Assessed;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddTreatment(string description, TreatmentType type, string owner, DateTime dueDate, string createdBy)
    {
        var treatment = RiskTreatment.Create(Id, description, type, owner, dueDate, createdBy);
        _treatments.Add(treatment);
        Status = RiskStatus.Mitigating;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = createdBy;
    }

    public void Accept(string reason, string updatedBy)
    {
        Status = RiskStatus.Accepted;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
        _domainEvents.Add(new RiskStatusChangedEvent(Id, RiskStatus.Accepted, reason, updatedBy));
    }

    public void Close(string reason, string updatedBy)
    {
        Status = RiskStatus.Closed;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
        _domainEvents.Add(new RiskStatusChangedEvent(Id, RiskStatus.Closed, reason, updatedBy));
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}
