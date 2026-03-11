using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.Shared;

namespace GrcPlatform.RiskManagement.Domain.Entities;

public class RiskTreatment : BaseEntity
{
    public Guid RiskId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public TreatmentType Type { get; private set; }
    public string Owner { get; private set; } = string.Empty;
    public DateTime DueDate { get; private set; }
    public bool IsCompleted { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? CompletionNotes { get; private set; }

    private RiskTreatment() { }

    public static RiskTreatment Create(Guid riskId, string description, TreatmentType type,
        string owner, DateTime dueDate, string createdBy) => new()
    {
        RiskId = riskId,
        Description = description,
        Type = type,
        Owner = owner,
        DueDate = dueDate,
        CreatedBy = createdBy
    };

    public void Complete(string notes, string completedBy)
    {
        IsCompleted = true;
        CompletedAt = DateTime.UtcNow;
        CompletionNotes = notes;
        UpdatedBy = completedBy;
        UpdatedAt = DateTime.UtcNow;
    }
}

public class RiskReview : BaseEntity
{
    public Guid RiskId { get; private set; }
    public string ReviewedBy { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;
    public DateTime ReviewedAt { get; private set; }
    public DateTime? NextReviewDate { get; private set; }

    private RiskReview() { }

    public static RiskReview Create(Guid riskId, string reviewedBy, string notes,
        DateTime? nextReviewDate, string createdBy) => new()
    {
        RiskId = riskId,
        ReviewedBy = reviewedBy,
        Notes = notes,
        ReviewedAt = DateTime.UtcNow,
        NextReviewDate = nextReviewDate,
        CreatedBy = createdBy
    };
}
