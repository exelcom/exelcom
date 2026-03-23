using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;

namespace GrcPlatform.NonconformityAndCorrectiveActions.Domain;

/// <summary>
/// Value object capturing the root-cause analysis for a nonconformity.
/// Stored as an owned entity (single table row alongside the NC).
/// </summary>
public sealed class RootCauseAnalysis
{
    public RcaMethod Method { get; private set; }
    public NcCauseCategory CauseCategory { get; private set; }
    public string CauseDescription { get; private set; } = default!;

    /// <summary>
    /// Up to 5 "Why" answers (5-Whys method). Stored as a JSON column.
    /// Empty when Fishbone method is selected.
    /// </summary>
    public string[] FiveWhys { get; private set; } = [];

    public string AnalystUserId { get; private set; } = default!;
    public DateTimeOffset CompletedAt { get; private set; }

    private RootCauseAnalysis() { }   // EF Core

    internal static RootCauseAnalysis Create(
        RcaMethod method,
        NcCauseCategory causeCategory,
        string causeDescription,
        string[] fiveWhys,
        string analystUserId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(causeDescription);
        ArgumentException.ThrowIfNullOrWhiteSpace(analystUserId);

        return new RootCauseAnalysis
        {
            Method = method,
            CauseCategory = causeCategory,
            CauseDescription = causeDescription,
            FiveWhys = fiveWhys,
            AnalystUserId = analystUserId,
            CompletedAt = DateTimeOffset.UtcNow,
        };
    }
}

/// <summary>
/// Value object capturing whether the corrective actions proved effective.
/// </summary>
public sealed class EffectivenessReview
{
    public bool IsEffective { get; private set; }
    public string ReviewNotes { get; private set; } = default!;
    public string ReviewerUserId { get; private set; } = default!;
    public DateTimeOffset ReviewedAt { get; private set; }

    private EffectivenessReview() { }   // EF Core

    internal static EffectivenessReview Create(
        bool isEffective,
        string reviewNotes,
        string reviewerUserId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewNotes);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewerUserId);

        return new EffectivenessReview
        {
            IsEffective = isEffective,
            ReviewNotes = reviewNotes,
            ReviewerUserId = reviewerUserId,
            ReviewedAt = DateTimeOffset.UtcNow,
        };
    }
}
