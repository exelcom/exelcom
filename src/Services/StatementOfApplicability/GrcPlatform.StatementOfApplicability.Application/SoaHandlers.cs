using GrcPlatform.StatementOfApplicability.Domain.Entities;
using GrcPlatform.StatementOfApplicability.Domain.Enums;
using GrcPlatform.StatementOfApplicability.Domain.Interfaces;
using MediatR;

namespace GrcPlatform.StatementOfApplicability.Application;

// DTOs
public record ControlDto(
    Guid Id, string ControlId, string ControlName, string Description,
    string Domain, int SortOrder,
    string Applicability, string? JustificationForExclusion,
    string ImplementationStatus, string? ImplementationNotes,
    string? ResponsibleOwner, DateTime? TargetDate, DateTime? CompletedDate,
    string? EvidenceReference, string? UpdatedBy, DateTime? UpdatedAt);

public record ControlSummaryDto(
    Guid Id, string ControlId, string ControlName, string Domain,
    string Applicability, string ImplementationStatus, string? ResponsibleOwner);

public record SoaStatsDto(
    int TotalControls, int ApplicableControls, int NotApplicableControls,
    int NotStarted, int InProgress, int Implemented, int Verified,
    double CompliancePercentage);

// Queries
public record GetAllControlsQuery : IRequest<List<ControlSummaryDto>>;
public record GetControlByIdQuery(Guid Id) : IRequest<ControlDto>;
public record GetSoaStatsQuery : IRequest<SoaStatsDto>;

// Commands
public record UpdateApplicabilityCommand(Guid Id, string Applicability, string? Justification) : IRequest<ControlDto>;
public record UpdateImplementationCommand(Guid Id, string Status, string? Notes, string? Owner, DateTime? TargetDate, string? EvidenceRef) : IRequest<ControlDto>;

// Mappings
public static class SoaMappings
{
    public static ControlDto ToDto(this AnnexAControl c) => new(
        c.Id, c.ControlId, c.ControlName, c.Description, c.Domain.ToString(), c.SortOrder,
        c.Applicability.ToString(), c.JustificationForExclusion,
        c.ImplementationStatus.ToString(), c.ImplementationNotes,
        c.ResponsibleOwner, c.TargetDate, c.CompletedDate,
        c.EvidenceReference, c.UpdatedBy, c.UpdatedAt);

    public static ControlSummaryDto ToSummaryDto(this AnnexAControl c) => new(
        c.Id, c.ControlId, c.ControlName, c.Domain.ToString(),
        c.Applicability.ToString(), c.ImplementationStatus.ToString(), c.ResponsibleOwner);
}

// Query Handlers
public class GetAllControlsHandler(ISoaRepository repo) : IRequestHandler<GetAllControlsQuery, List<ControlSummaryDto>>
{
    public async Task<List<ControlSummaryDto>> Handle(GetAllControlsQuery _, CancellationToken ct) =>
        (await repo.GetAllAsync(ct)).OrderBy(c => c.SortOrder).Select(c => c.ToSummaryDto()).ToList();
}

public class GetControlByIdHandler(ISoaRepository repo) : IRequestHandler<GetControlByIdQuery, ControlDto>
{
    public async Task<ControlDto> Handle(GetControlByIdQuery request, CancellationToken ct)
    {
        var c = await repo.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException($"Control {request.Id} not found");
        return c.ToDto();
    }
}

public class GetSoaStatsHandler(ISoaRepository repo) : IRequestHandler<GetSoaStatsQuery, SoaStatsDto>
{
    public async Task<SoaStatsDto> Handle(GetSoaStatsQuery _, CancellationToken ct)
    {
        var all = await repo.GetAllAsync(ct);
        var applicable = all.Where(c => c.Applicability == ControlApplicability.Applicable).ToList();
        var implemented = applicable.Count(c => c.ImplementationStatus == ImplementationStatus.Implemented || c.ImplementationStatus == ImplementationStatus.Verified);
        var pct = applicable.Count > 0 ? Math.Round((double)implemented / applicable.Count * 100, 1) : 0;
        return new SoaStatsDto(all.Count, applicable.Count,
            all.Count(c => c.Applicability == ControlApplicability.NotApplicable),
            applicable.Count(c => c.ImplementationStatus == ImplementationStatus.NotStarted),
            applicable.Count(c => c.ImplementationStatus == ImplementationStatus.InProgress),
            applicable.Count(c => c.ImplementationStatus == ImplementationStatus.Implemented),
            applicable.Count(c => c.ImplementationStatus == ImplementationStatus.Verified),
            pct);
    }
}

// Command Handlers
public class UpdateApplicabilityHandler(ISoaRepository repo, ICurrentUserService user) : IRequestHandler<UpdateApplicabilityCommand, ControlDto>
{
    public async Task<ControlDto> Handle(UpdateApplicabilityCommand request, CancellationToken ct)
    {
        var c = await repo.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException();
        c.UpdateApplicability(Enum.Parse<ControlApplicability>(request.Applicability), request.Justification, user.UserId);
        await repo.UpdateAsync(c, ct);
        await repo.SaveChangesAsync(ct);
        return c.ToDto();
    }
}

public class UpdateImplementationHandler(ISoaRepository repo, ICurrentUserService user) : IRequestHandler<UpdateImplementationCommand, ControlDto>
{
    public async Task<ControlDto> Handle(UpdateImplementationCommand request, CancellationToken ct)
    {
        var c = await repo.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException();
        c.UpdateImplementation(Enum.Parse<ImplementationStatus>(request.Status), request.Notes, request.Owner, request.TargetDate, request.EvidenceRef, user.UserId);
        await repo.UpdateAsync(c, ct);
        await repo.SaveChangesAsync(ct);
        return c.ToDto();
    }
}
