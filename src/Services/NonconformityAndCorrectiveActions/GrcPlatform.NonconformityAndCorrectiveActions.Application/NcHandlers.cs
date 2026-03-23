using GrcPlatform.NonconformityAndCorrectiveActions.Domain;
using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;

namespace GrcPlatform.NonconformityAndCorrectiveActions.Application;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public sealed record CorrectiveActionDto(
    Guid Id,
    string Description,
    string OwnerUserId,
    DateTimeOffset DueDate,
    CaStatus Status,
    bool IsOverdue,
    DateTimeOffset? ImplementedAt,
    string? ImplementedByUserId);

public sealed record RcaDto(
    RcaMethod Method,
    NcCauseCategory CauseCategory,
    string CauseDescription,
    string[] FiveWhys,
    string AnalystUserId,
    DateTimeOffset CompletedAt);

public sealed record EffectivenessReviewDto(
    bool IsEffective,
    string ReviewNotes,
    string ReviewerUserId,
    DateTimeOffset ReviewedAt);

public sealed record NonconformityDto(
    Guid Id,
    string ReferenceNumber,
    NcSource Source,
    string? ClauseReference,
    NcSeverity Severity,
    string Title,
    string Description,
    string? EvidenceReference,
    string RaisedByUserId,
    DateTimeOffset RaisedAt,
    NcStatus Status,
    DateTimeOffset UpdatedAt,
    RcaDto? RootCauseAnalysis,
    IReadOnlyCollection<CorrectiveActionDto> CorrectiveActions,
    EffectivenessReviewDto? EffectivenessReview);

// ── Commands ──────────────────────────────────────────────────────────────────

public sealed record RaiseNonconformityCommand(
    NcSource Source,
    string? ClauseReference,
    NcSeverity Severity,
    string Title,
    string Description,
    string? EvidenceReference,
    string RaisedByUserId);

public sealed record UpdateNonconformityCommand(
    Guid NonconformityId,
    NcSource Source,
    string? ClauseReference,
    NcSeverity Severity,
    string Title,
    string Description,
    string? EvidenceReference);

public sealed record DeleteNonconformityCommand(Guid NonconformityId);

public sealed record RecordRcaCommand(
    Guid NonconformityId,
    RcaMethod Method,
    NcCauseCategory CauseCategory,
    string CauseDescription,
    string[] FiveWhys,
    string AnalystUserId);

public sealed record AddCorrectiveActionCommand(
    Guid NonconformityId,
    string Description,
    string OwnerUserId,
    DateTimeOffset DueDate);

public sealed record UpdateCorrectiveActionCommand(
    Guid NonconformityId,
    Guid CorrectiveActionId,
    string Description,
    string OwnerUserId,
    DateTimeOffset DueDate);

public sealed record MarkCaImplementedCommand(
    Guid NonconformityId,
    Guid CorrectiveActionId,
    string VerifiedByUserId);

public sealed record CloseNonconformityCommand(
    Guid NonconformityId,
    bool IsEffective,
    string ReviewNotes,
    string ReviewerUserId);

// ── Queries ───────────────────────────────────────────────────────────────────

public sealed record GetNonconformityQuery(Guid Id);

public sealed record ListNonconformitiesQuery(
    NcStatus? Status = null,
    NcSeverity? Severity = null);

// ── Handlers ──────────────────────────────────────────────────────────────────

public sealed class NcHandlers(INonconformityRepository repo)
{
    public async Task<NonconformityDto> HandleAsync(
        RaiseNonconformityCommand cmd,
        CancellationToken ct = default)
    {
        var refNum = await repo.NextReferenceNumberAsync(ct);
        var nc = Nonconformity.Raise(
            refNum, cmd.Source, cmd.ClauseReference, cmd.Severity,
            cmd.Title, cmd.Description, cmd.EvidenceReference, cmd.RaisedByUserId);
        await repo.AddAsync(nc, ct);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task<NonconformityDto> HandleAsync(
        UpdateNonconformityCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        nc.UpdateDetails(cmd.Source, cmd.ClauseReference, cmd.Severity,
            cmd.Title, cmd.Description, cmd.EvidenceReference);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task HandleAsync(
        DeleteNonconformityCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        await repo.DeleteAsync(nc, ct);
        await repo.SaveChangesAsync(ct);
    }

    public async Task<NonconformityDto> HandleAsync(
        RecordRcaCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        nc.RecordRootCauseAnalysis(cmd.Method, cmd.CauseCategory,
            cmd.CauseDescription, cmd.FiveWhys, cmd.AnalystUserId);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task<NonconformityDto> HandleAsync(
        AddCorrectiveActionCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        nc.AddCorrectiveAction(cmd.Description, cmd.OwnerUserId, cmd.DueDate);
        repo.TrackNewCorrectiveActions(nc);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task<NonconformityDto> HandleAsync(
        UpdateCorrectiveActionCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        nc.UpdateCorrectiveAction(cmd.CorrectiveActionId, cmd.Description, cmd.OwnerUserId, cmd.DueDate);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task<NonconformityDto> HandleAsync(
        MarkCaImplementedCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        nc.MarkCorrectiveActionImplemented(cmd.CorrectiveActionId, cmd.VerifiedByUserId);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task<NonconformityDto> HandleAsync(
        CloseNonconformityCommand cmd,
        CancellationToken ct = default)
    {
        var nc = await RequireAsync(cmd.NonconformityId, ct);
        nc.CloseWithEffectivenessReview(cmd.IsEffective, cmd.ReviewNotes, cmd.ReviewerUserId);
        await repo.SaveChangesAsync(ct);
        return nc.ToDto();
    }

    public async Task<NonconformityDto?> HandleAsync(
        GetNonconformityQuery query,
        CancellationToken ct = default)
    {
        var nc = await repo.GetByIdAsync(query.Id, ct);
        return nc?.ToDto();
    }

    public async Task<IReadOnlyList<NonconformityDto>> HandleAsync(
        ListNonconformitiesQuery query,
        CancellationToken ct = default)
    {
        var ncs = await repo.ListAsync(query.Status, query.Severity, ct);
        return ncs.Select(n => n.ToDto()).ToList();
    }

    private async Task<Nonconformity> RequireAsync(Guid id, CancellationToken ct)
        => await repo.GetByIdAsync(id, ct)
           ?? throw new KeyNotFoundException($"Nonconformity {id} not found.");
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

file static class NcMappingExtensions
{
    internal static NonconformityDto ToDto(this Nonconformity nc) => new(
        nc.Id, nc.ReferenceNumber, nc.Source, nc.ClauseReference, nc.Severity,
        nc.Title, nc.Description, nc.EvidenceReference, nc.RaisedByUserId,
        nc.RaisedAt, nc.Status, nc.UpdatedAt,
        nc.RootCauseAnalysis?.ToDto(),
        nc.CorrectiveActions.Select(c => c.ToDto()).ToList(),
        nc.EffectivenessReview?.ToDto());

    private static RcaDto ToDto(this RootCauseAnalysis rca) => new(
        rca.Method, rca.CauseCategory, rca.CauseDescription,
        rca.FiveWhys, rca.AnalystUserId, rca.CompletedAt);

    private static CorrectiveActionDto ToDto(this CorrectiveAction ca) => new(
        ca.Id, ca.Description, ca.OwnerUserId, ca.DueDate,
        ca.Status, ca.IsOverdue, ca.ImplementedAt, ca.ImplementedByUserId);

    private static EffectivenessReviewDto ToDto(this EffectivenessReview er) => new(
        er.IsEffective, er.ReviewNotes, er.ReviewerUserId, er.ReviewedAt);
}
