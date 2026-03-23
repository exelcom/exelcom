using GrcPlatform.IncidentManagement.Domain.Enums;

namespace GrcPlatform.IncidentManagement.Domain;

public sealed class IncidentAction
{
    public Guid Id { get; private set; }
    public Guid IncidentId { get; private set; }
    public ActionType Type { get; private set; }
    public string Description { get; private set; } = default!;
    public string AssignedToUserId { get; private set; } = default!;
    public ActionStatus Status { get; private set; }
    public DateTimeOffset? DueDate { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public string? CompletedByUserId { get; private set; }
    public string? Notes { get; private set; }
    public bool IsOverdue => Status != ActionStatus.Completed && DueDate.HasValue && DueDate.Value < DateTimeOffset.UtcNow;

    private IncidentAction() { }

    internal static IncidentAction Create(Guid incidentId, ActionType type, string description,
        string assignedToUserId, DateTimeOffset? dueDate, string? notes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(assignedToUserId);
        return new IncidentAction
        {
            Id = Guid.NewGuid(), IncidentId = incidentId, Type = type, Description = description,
            AssignedToUserId = assignedToUserId, Status = ActionStatus.Pending, DueDate = dueDate, Notes = notes,
        };
    }

    internal void UpdateDetails(ActionType type, string description, string assignedToUserId,
        DateTimeOffset? dueDate, string? notes)
    { Type = type; Description = description; AssignedToUserId = assignedToUserId; DueDate = dueDate; Notes = notes; }

    internal void MarkCompleted(string completedByUserId, string? notes)
    {
        Status = ActionStatus.Completed; CompletedAt = DateTimeOffset.UtcNow;
        CompletedByUserId = completedByUserId;
        if (notes is not null) Notes = notes;
    }
}

public sealed class PostIncidentReview
{
    public string Summary { get; private set; } = default!;
    public string RootCause { get; private set; } = default!;
    public string LessonsLearned { get; private set; } = default!;
    public string? Recommendations { get; private set; }
    public string ReviewerUserId { get; private set; } = default!;
    public DateTimeOffset ReviewedAt { get; private set; }

    private PostIncidentReview() { }

    internal static PostIncidentReview Create(string summary, string rootCause, string lessonsLearned,
        string? recommendations, string reviewerUserId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(summary);
        ArgumentException.ThrowIfNullOrWhiteSpace(rootCause);
        ArgumentException.ThrowIfNullOrWhiteSpace(lessonsLearned);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewerUserId);
        return new PostIncidentReview
        {
            Summary = summary, RootCause = rootCause, LessonsLearned = lessonsLearned,
            Recommendations = recommendations, ReviewerUserId = reviewerUserId,
            ReviewedAt = DateTimeOffset.UtcNow,
        };
    }
}

public sealed class Incident
{
    public Guid Id { get; private set; }
    public string ReferenceNumber { get; private set; } = default!;
    public IncidentType Type { get; private set; }
    public IncidentSeverity Severity { get; private set; }
    public IncidentStatus Status { get; private set; }
    public string Title { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public string? ImpactDescription { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public DateTimeOffset? DetectedAt { get; private set; }
    public DateTimeOffset? ContainedAt { get; private set; }
    public DateTimeOffset? ResolvedAt { get; private set; }
    public DateTimeOffset? ClosedAt { get; private set; }
    public string ReportedByUserId { get; private set; } = default!;
    public string? AssignedToUserId { get; private set; }
    public string? CustomerId { get; private set; }
    public string? CustomerName { get; private set; }
    /// <summary>Customer contact email for notifications — from Dynamics 365 CRM or manually entered.</summary>
    public string? ContactEmail { get; private set; }
    public string? LinkedControlId { get; private set; }
    public string? AffectedAssetIds { get; private set; }

    private readonly List<IncidentAction> _actions = [];
    public IReadOnlyCollection<IncidentAction> Actions => _actions.AsReadOnly();
    public PostIncidentReview? PostIncidentReview { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Incident() { }

    public static Incident Report(
        string referenceNumber, IncidentType type, IncidentSeverity severity,
        string title, string description, string? impactDescription,
        DateTimeOffset occurredAt, DateTimeOffset? detectedAt,
        string reportedByUserId, string? assignedToUserId,
        string? customerId, string? customerName, string? contactEmail,
        string? linkedControlId, string? affectedAssetIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(reportedByUserId);
        return new Incident
        {
            Id = Guid.NewGuid(), ReferenceNumber = referenceNumber,
            Type = type, Severity = severity, Status = IncidentStatus.New,
            Title = title, Description = description, ImpactDescription = impactDescription,
            OccurredAt = occurredAt, DetectedAt = detectedAt,
            ReportedByUserId = reportedByUserId, AssignedToUserId = assignedToUserId,
            CustomerId = string.IsNullOrWhiteSpace(customerId) ? null : customerId.Trim(),
            CustomerName = string.IsNullOrWhiteSpace(customerName) ? null : customerName.Trim(),
            ContactEmail = string.IsNullOrWhiteSpace(contactEmail) ? null : contactEmail.Trim(),
            LinkedControlId = linkedControlId, AffectedAssetIds = affectedAssetIds,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    public void UpdateDetails(
        IncidentType type, IncidentSeverity severity,
        string title, string description, string? impactDescription,
        DateTimeOffset occurredAt, DateTimeOffset? detectedAt,
        string? assignedToUserId, string? customerId, string? customerName, string? contactEmail,
        string? linkedControlId, string? affectedAssetIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        Type = type; Severity = severity; Title = title; Description = description;
        ImpactDescription = impactDescription; OccurredAt = occurredAt; DetectedAt = detectedAt;
        AssignedToUserId = assignedToUserId;
        CustomerId = string.IsNullOrWhiteSpace(customerId) ? null : customerId.Trim();
        CustomerName = string.IsNullOrWhiteSpace(customerName) ? null : customerName.Trim();
        ContactEmail = string.IsNullOrWhiteSpace(contactEmail) ? null : contactEmail.Trim();
        LinkedControlId = linkedControlId; AffectedAssetIds = affectedAssetIds;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void BeginInvestigation(string? assignedToUserId)
    {
        if (Status != IncidentStatus.New)
            throw new InvalidOperationException($"Cannot begin investigation from status '{Status}'.");
        Status = IncidentStatus.Investigating;
        if (assignedToUserId is not null) AssignedToUserId = assignedToUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkContained()
    {
        if (Status != IncidentStatus.Investigating)
            throw new InvalidOperationException($"Cannot mark contained from status '{Status}'.");
        Status = IncidentStatus.Contained; ContainedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkResolved()
    {
        if (Status != IncidentStatus.Contained)
            throw new InvalidOperationException($"Cannot mark resolved from status '{Status}'.");
        Status = IncidentStatus.Resolved; ResolvedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Close()
    {
        if (Status != IncidentStatus.Resolved)
            throw new InvalidOperationException($"Cannot close from status '{Status}'. Incident must be resolved first.");
        Status = IncidentStatus.Closed; ClosedAt = DateTimeOffset.UtcNow; UpdatedAt = DateTimeOffset.UtcNow;
    }

    public IncidentAction AddAction(ActionType type, string description, string assignedToUserId,
        DateTimeOffset? dueDate, string? notes)
    {
        var action = IncidentAction.Create(Id, type, description, assignedToUserId, dueDate, notes);
        _actions.Add(action); UpdatedAt = DateTimeOffset.UtcNow;
        return action;
    }

    public void UpdateAction(Guid actionId, ActionType type, string description,
        string assignedToUserId, DateTimeOffset? dueDate, string? notes)
    {
        var action = _actions.FirstOrDefault(a => a.Id == actionId)
            ?? throw new InvalidOperationException($"Action {actionId} not found.");
        action.UpdateDetails(type, description, assignedToUserId, dueDate, notes);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void CompleteAction(Guid actionId, string completedByUserId, string? notes)
    {
        var action = _actions.FirstOrDefault(a => a.Id == actionId)
            ?? throw new InvalidOperationException($"Action {actionId} not found.");
        action.MarkCompleted(completedByUserId, notes); UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordPostIncidentReview(string summary, string rootCause, string lessonsLearned,
        string? recommendations, string reviewerUserId)
    {
        if (Status != IncidentStatus.Resolved && Status != IncidentStatus.Closed)
            throw new InvalidOperationException("Post-incident review can only be recorded for resolved or closed incidents.");
        PostIncidentReview = PostIncidentReview.Create(summary, rootCause, lessonsLearned, recommendations, reviewerUserId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
