using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;

namespace GrcPlatform.NonconformityAndCorrectiveActions.Domain;

/// <summary>
/// Aggregate root representing a single nonconformity raised against an ISO/IEC 27001 clause
/// or Annex A control, together with its root-cause analysis and corrective action plan.
/// </summary>
public sealed class Nonconformity
{
    public Guid Id { get; private set; }

    public string ReferenceNumber { get; private set; } = default!;
    public NcSource Source { get; private set; }
    public string? ClauseReference { get; private set; }
    public NcSeverity Severity { get; private set; }
    public string Title { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public string? EvidenceReference { get; private set; }
    public string RaisedByUserId { get; private set; } = default!;
    public DateTimeOffset RaisedAt { get; private set; }
    public RootCauseAnalysis? RootCauseAnalysis { get; private set; }
    public NcStatus Status { get; private set; }
    public EffectivenessReview? EffectivenessReview { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<CorrectiveAction> _correctiveActions = [];
    public IReadOnlyCollection<CorrectiveAction> CorrectiveActions => _correctiveActions.AsReadOnly();

    private Nonconformity() { }   // EF Core

    public static Nonconformity Raise(
        string referenceNumber,
        NcSource source,
        string? clauseReference,
        NcSeverity severity,
        string title,
        string description,
        string? evidenceReference,
        string raisedByUserId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(raisedByUserId);

        return new Nonconformity
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = referenceNumber,
            Source = source,
            ClauseReference = clauseReference,
            Severity = severity,
            Title = title,
            Description = description,
            EvidenceReference = evidenceReference,
            RaisedByUserId = raisedByUserId,
            RaisedAt = DateTimeOffset.UtcNow,
            Status = NcStatus.Open,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    /// <summary>Update editable fields (admin). Status must be transitioned via dedicated methods.</summary>
    public void UpdateDetails(
        NcSource source,
        string? clauseReference,
        NcSeverity severity,
        string title,
        string description,
        string? evidenceReference)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);

        Source = source;
        ClauseReference = clauseReference;
        Severity = severity;
        Title = title;
        Description = description;
        EvidenceReference = evidenceReference;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>Advance status to UnderAnalysis and record RCA.</summary>
    public void RecordRootCauseAnalysis(
        RcaMethod method,
        NcCauseCategory causeCategory,
        string causeDescription,
        string[] fiveWhys,
        string analystUserId)
    {
        RootCauseAnalysis = RootCauseAnalysis.Create(
            method, causeCategory, causeDescription, fiveWhys, analystUserId);
        Status = NcStatus.UnderAnalysis;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public CorrectiveAction AddCorrectiveAction(
        string description,
        string ownerUserId,
        DateTimeOffset dueDate)
    {
        var ca = CorrectiveAction.Create(Id, description, ownerUserId, dueDate);
        _correctiveActions.Add(ca);
        Status = NcStatus.CorrectiveActionInProgress;
        UpdatedAt = DateTimeOffset.UtcNow;
        return ca;
    }

    public void UpdateCorrectiveAction(
        Guid correctiveActionId,
        string description,
        string ownerUserId,
        DateTimeOffset dueDate)
    {
        var ca = _correctiveActions.FirstOrDefault(c => c.Id == correctiveActionId)
            ?? throw new InvalidOperationException($"Corrective action {correctiveActionId} not found.");
        ca.UpdateDetails(description, ownerUserId, dueDate);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkCorrectiveActionImplemented(Guid correctiveActionId, string verifiedByUserId)
    {
        var ca = _correctiveActions.FirstOrDefault(c => c.Id == correctiveActionId)
            ?? throw new InvalidOperationException($"Corrective action {correctiveActionId} not found.");
        ca.MarkImplemented(verifiedByUserId);
        UpdatedAt = DateTimeOffset.UtcNow;
        if (_correctiveActions.All(c => c.Status == CaStatus.Implemented))
            Status = NcStatus.AwaitingEffectivenessReview;
    }

    public void CloseWithEffectivenessReview(
        bool isEffective,
        string reviewNotes,
        string reviewerUserId)
    {
        if (Status != NcStatus.AwaitingEffectivenessReview)
            throw new InvalidOperationException(
                $"Cannot close NC in status '{Status}'. All corrective actions must be implemented first.");
        EffectivenessReview = EffectivenessReview.Create(isEffective, reviewNotes, reviewerUserId);
        Status = isEffective ? NcStatus.Closed : NcStatus.Open;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
