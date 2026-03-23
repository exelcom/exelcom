using GrcPlatform.IncidentManagement.Domain;
using GrcPlatform.IncidentManagement.Domain.Enums;


namespace GrcPlatform.IncidentManagement.Application;

// ── Email notification interface (implemented in Infrastructure) ────────────
public interface IIncidentEmailService
{
    Task SendIncidentReportedAsync(string toEmail, string customerName, string refNum, string title,
        Domain.Enums.IncidentSeverity severity, Domain.Enums.IncidentStatus status,
        string type, DateTimeOffset occurredAt, string? description);
    Task SendStatusChangedAsync(string toEmail, string customerName, string refNum, string title,
        Domain.Enums.IncidentSeverity severity, Domain.Enums.IncidentStatus newStatus,
        string type, DateTimeOffset occurredAt, string? assignedTo);
    Task SendActionAssignedAsync(string toEmail, string customerName, string refNum,
        string incidentTitle, string actionType, string actionDescription,
        string assignedTo, DateTimeOffset? dueDate);
    Task SendPostIncidentReviewAsync(string toEmail, string customerName, string refNum,
        string incidentTitle, string summary, string rootCause, string lessonsLearned,
        string? recommendations, DateTimeOffset reviewedAt);
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public sealed record IncidentActionDto(
    Guid Id, ActionType Type, string Description, string AssignedToUserId,
    ActionStatus Status, bool IsOverdue, DateTimeOffset? DueDate,
    DateTimeOffset? CompletedAt, string? CompletedByUserId, string? Notes);

public sealed record PostIncidentReviewDto(
    string Summary, string RootCause, string LessonsLearned, string? Recommendations,
    string ReviewerUserId, DateTimeOffset ReviewedAt);

public sealed record IncidentDto(
    Guid Id, string ReferenceNumber, IncidentType Type, IncidentSeverity Severity,
    IncidentStatus Status, string Title, string Description, string? ImpactDescription,
    DateTimeOffset OccurredAt, DateTimeOffset? DetectedAt, DateTimeOffset? ContainedAt,
    DateTimeOffset? ResolvedAt, DateTimeOffset? ClosedAt,
    string ReportedByUserId, string? AssignedToUserId,
    string? CustomerId, string? CustomerName, string? ContactEmail,
    string? LinkedControlId, string? AffectedAssetIds,
    IReadOnlyCollection<IncidentActionDto> Actions,
    PostIncidentReviewDto? PostIncidentReview,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public sealed record IncidentStatsDto(
    int Total, int New, int Investigating, int Contained,
    int Resolved, int Closed, int Critical, int High, int OverdueActions);

// ── Commands ──────────────────────────────────────────────────────────────────

public sealed record ReportIncidentCommand(
    IncidentType Type, IncidentSeverity Severity, string Title, string Description,
    string? ImpactDescription, DateTimeOffset OccurredAt, DateTimeOffset? DetectedAt,
    string ReportedByUserId, string? AssignedToUserId,
    string? CustomerId, string? CustomerName, string? ContactEmail,
    string? LinkedControlId, string? AffectedAssetIds);

public sealed record UpdateIncidentCommand(
    Guid Id, IncidentType Type, IncidentSeverity Severity, string Title, string Description,
    string? ImpactDescription, DateTimeOffset OccurredAt, DateTimeOffset? DetectedAt,
    string? AssignedToUserId, string? CustomerId, string? CustomerName, string? ContactEmail,
    string? LinkedControlId, string? AffectedAssetIds);

public sealed record DeleteIncidentCommand(Guid Id);
public sealed record BeginInvestigationCommand(Guid Id, string? AssignedToUserId);
public sealed record MarkContainedCommand(Guid Id);
public sealed record MarkResolvedCommand(Guid Id);
public sealed record CloseIncidentCommand(Guid Id);
public sealed record AddActionCommand(Guid IncidentId, ActionType Type, string Description, string AssignedToUserId, DateTimeOffset? DueDate, string? Notes);
public sealed record UpdateActionCommand(Guid IncidentId, Guid ActionId, ActionType Type, string Description, string AssignedToUserId, DateTimeOffset? DueDate, string? Notes);
public sealed record CompleteActionCommand(Guid IncidentId, Guid ActionId, string CompletedByUserId, string? Notes);
public sealed record RecordPostIncidentReviewCommand(Guid IncidentId, string Summary, string RootCause, string LessonsLearned, string? Recommendations, string ReviewerUserId);
public sealed record GetIncidentQuery(Guid Id);
public sealed record ListIncidentsQuery(IncidentType? Type = null, IncidentStatus? Status = null, IncidentSeverity? Severity = null, string? CustomerId = null);

// ── Handlers ──────────────────────────────────────────────────────────────────

public sealed class IncidentHandlers(IIncidentRepository repo, IIncidentEmailService? emailService = null)
{
    public async Task<IncidentDto> HandleAsync(ReportIncidentCommand cmd, CancellationToken ct = default)
    {
        var refNum = await repo.NextReferenceNumberAsync(ct);
        var incident = Incident.Report(refNum, cmd.Type, cmd.Severity, cmd.Title, cmd.Description,
            cmd.ImpactDescription, cmd.OccurredAt, cmd.DetectedAt, cmd.ReportedByUserId,
            cmd.AssignedToUserId, cmd.CustomerId, cmd.CustomerName, cmd.ContactEmail,
            cmd.LinkedControlId, cmd.AffectedAssetIds);
        await repo.AddAsync(incident, ct);
        await repo.SaveChangesAsync(ct);

        // Fire-and-forget email notification
        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail))
            _ = emailService.SendIncidentReportedAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title, incident.Severity, incident.Status,
                incident.Type.ToString(), incident.OccurredAt, incident.Description);

        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(UpdateIncidentCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.Id, ct);
        incident.UpdateDetails(cmd.Type, cmd.Severity, cmd.Title, cmd.Description, cmd.ImpactDescription,
            cmd.OccurredAt, cmd.DetectedAt, cmd.AssignedToUserId, cmd.CustomerId, cmd.CustomerName,
            cmd.ContactEmail, cmd.LinkedControlId, cmd.AffectedAssetIds);
        await repo.SaveChangesAsync(ct);
        return incident.ToDto();
    }

    public async Task HandleAsync(DeleteIncidentCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.Id, ct);
        await repo.DeleteAsync(incident, ct);
        await repo.SaveChangesAsync(ct);
    }

    public async Task<IncidentDto> HandleAsync(BeginInvestigationCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.Id, ct);
        incident.BeginInvestigation(cmd.AssignedToUserId);
        await repo.SaveChangesAsync(ct);

        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail))
            _ = emailService.SendStatusChangedAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title, incident.Severity, incident.Status,
                incident.Type.ToString(), incident.OccurredAt, incident.AssignedToUserId);

        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(MarkContainedCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.Id, ct);
        incident.MarkContained();
        await repo.SaveChangesAsync(ct);

        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail))
            _ = emailService.SendStatusChangedAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title, incident.Severity, incident.Status,
                incident.Type.ToString(), incident.OccurredAt, incident.AssignedToUserId);

        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(MarkResolvedCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.Id, ct);
        incident.MarkResolved();
        await repo.SaveChangesAsync(ct);

        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail))
            _ = emailService.SendStatusChangedAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title, incident.Severity, incident.Status,
                incident.Type.ToString(), incident.OccurredAt, incident.AssignedToUserId);

        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(CloseIncidentCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.Id, ct);
        incident.Close();
        await repo.SaveChangesAsync(ct);

        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail))
            _ = emailService.SendStatusChangedAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title, incident.Severity, incident.Status,
                incident.Type.ToString(), incident.OccurredAt, incident.AssignedToUserId);

        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(AddActionCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.IncidentId, ct);
        var action = incident.AddAction(cmd.Type, cmd.Description, cmd.AssignedToUserId, cmd.DueDate, cmd.Notes);
        repo.TrackNewActions(incident);
        await repo.SaveChangesAsync(ct);

        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail))
            _ = emailService.SendActionAssignedAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title,
                action.Type.ToString(), action.Description,
                action.AssignedToUserId, action.DueDate);

        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(UpdateActionCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.IncidentId, ct);
        incident.UpdateAction(cmd.ActionId, cmd.Type, cmd.Description, cmd.AssignedToUserId, cmd.DueDate, cmd.Notes);
        await repo.SaveChangesAsync(ct);
        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(CompleteActionCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.IncidentId, ct);
        incident.CompleteAction(cmd.ActionId, cmd.CompletedByUserId, cmd.Notes);
        await repo.SaveChangesAsync(ct);
        return incident.ToDto();
    }

    public async Task<IncidentDto> HandleAsync(RecordPostIncidentReviewCommand cmd, CancellationToken ct = default)
    {
        var incident = await RequireAsync(cmd.IncidentId, ct);
        incident.RecordPostIncidentReview(cmd.Summary, cmd.RootCause, cmd.LessonsLearned, cmd.Recommendations, cmd.ReviewerUserId);
        await repo.SaveChangesAsync(ct);

        if (emailService is not null && !string.IsNullOrWhiteSpace(incident.ContactEmail) && incident.PostIncidentReview is not null)
            _ = emailService.SendPostIncidentReviewAsync(
                incident.ContactEmail, incident.CustomerName ?? "Customer",
                incident.ReferenceNumber, incident.Title,
                incident.PostIncidentReview.Summary, incident.PostIncidentReview.RootCause,
                incident.PostIncidentReview.LessonsLearned, incident.PostIncidentReview.Recommendations,
                incident.PostIncidentReview.ReviewedAt);

        return incident.ToDto();
    }

    public async Task<IncidentDto?> HandleAsync(GetIncidentQuery query, CancellationToken ct = default)
    {
        var incident = await repo.GetByIdAsync(query.Id, ct);
        return incident?.ToDto();
    }

    public async Task<IReadOnlyList<IncidentDto>> HandleAsync(ListIncidentsQuery query, CancellationToken ct = default)
    {
        var incidents = await repo.ListAsync(query.Type, query.Status, query.Severity, query.CustomerId, ct);
        return incidents.Select(i => i.ToDto()).ToList();
    }

    public async Task<IncidentStatsDto> GetStatsAsync(string? customerId, CancellationToken ct = default)
    {
        var all = await repo.ListAsync(null, null, null, customerId, ct);
        return new IncidentStatsDto(
            Total: all.Count,
            New: all.Count(i => i.Status == IncidentStatus.New),
            Investigating: all.Count(i => i.Status == IncidentStatus.Investigating),
            Contained: all.Count(i => i.Status == IncidentStatus.Contained),
            Resolved: all.Count(i => i.Status == IncidentStatus.Resolved),
            Closed: all.Count(i => i.Status == IncidentStatus.Closed),
            Critical: all.Count(i => i.Severity == IncidentSeverity.Critical),
            High: all.Count(i => i.Severity == IncidentSeverity.High),
            OverdueActions: all.SelectMany(i => i.Actions).Count(a => a.IsOverdue));
    }

    public Task<IReadOnlyList<CustomerSummaryDto>> GetCustomerSummariesAsync(CancellationToken ct)
        => repo.GetCustomerSummariesAsync(ct);

    private async Task<Incident> RequireAsync(Guid id, CancellationToken ct)
        => await repo.GetByIdAsync(id, ct)
           ?? throw new KeyNotFoundException($"Incident {id} not found.");
}

file static class IncidentMappingExtensions
{
    internal static IncidentDto ToDto(this Incident i) => new(
        i.Id, i.ReferenceNumber, i.Type, i.Severity, i.Status,
        i.Title, i.Description, i.ImpactDescription,
        i.OccurredAt, i.DetectedAt, i.ContainedAt, i.ResolvedAt, i.ClosedAt,
        i.ReportedByUserId, i.AssignedToUserId,
        i.CustomerId, i.CustomerName, i.ContactEmail,
        i.LinkedControlId, i.AffectedAssetIds,
        i.Actions.Select(a => a.ToDto()).ToList(),
        i.PostIncidentReview?.ToDto(),
        i.CreatedAt, i.UpdatedAt);

    private static IncidentActionDto ToDto(this IncidentAction a) => new(
        a.Id, a.Type, a.Description, a.AssignedToUserId,
        a.Status, a.IsOverdue, a.DueDate, a.CompletedAt, a.CompletedByUserId, a.Notes);

    private static PostIncidentReviewDto ToDto(this PostIncidentReview r) => new(
        r.Summary, r.RootCause, r.LessonsLearned, r.Recommendations, r.ReviewerUserId, r.ReviewedAt);
}
