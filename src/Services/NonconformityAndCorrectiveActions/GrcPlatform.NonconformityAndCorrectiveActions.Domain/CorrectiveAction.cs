using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;

namespace GrcPlatform.NonconformityAndCorrectiveActions.Domain;

/// <summary>
/// A single corrective action belonging to a <see cref="Nonconformity"/>.
/// Owned entity — only persisted via the NC aggregate.
/// </summary>
public sealed class CorrectiveAction
{
    public Guid Id { get; private set; }
    public Guid NonconformityId { get; private set; }
    public string Description { get; private set; } = default!;
    public string OwnerUserId { get; private set; } = default!;
    public DateTimeOffset DueDate { get; private set; }
    public CaStatus Status { get; private set; }
    public DateTimeOffset? ImplementedAt { get; private set; }
    public string? ImplementedByUserId { get; private set; }

    private CorrectiveAction() { }   // EF Core

    internal static CorrectiveAction Create(
        Guid nonconformityId,
        string description,
        string ownerUserId,
        DateTimeOffset dueDate)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(ownerUserId);
        return new CorrectiveAction
        {
            Id = Guid.NewGuid(),
            NonconformityId = nonconformityId,
            Description = description,
            OwnerUserId = ownerUserId,
            DueDate = dueDate,
            Status = CaStatus.Open,
        };
    }

    internal void UpdateDetails(string description, string ownerUserId, DateTimeOffset dueDate)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(ownerUserId);
        Description = description;
        OwnerUserId = ownerUserId;
        DueDate = dueDate;
    }

    internal void MarkImplemented(string verifiedByUserId)
    {
        Status = CaStatus.Implemented;
        ImplementedAt = DateTimeOffset.UtcNow;
        ImplementedByUserId = verifiedByUserId;
    }

    /// <summary>True when past due and not yet implemented.</summary>
    public bool IsOverdue => Status != CaStatus.Implemented && DueDate < DateTimeOffset.UtcNow;
}
