using GrcPlatform.AuditManagement.Domain.Entities;
using GrcPlatform.AuditManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.AuditManagement.Application.Audits.Commands;

// --- Interface ---
public interface ICurrentUserService { string UserId { get; } string UserEmail { get; } }
public interface IAuditRepository
{
    Task<Audit?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Audit?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<Audit>> GetPagedAsync(int page, int pageSize, AuditStatus? status, CancellationToken ct = default);
    Task AddAsync(Audit audit, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

// --- Commands ---
public record CreateAuditCommand(string Title, string Scope, AuditType Type,
    string LeadAuditor, DateTime StartDate, DateTime EndDate) : IRequest<AuditDto>;
public record StartAuditCommand(Guid AuditId) : IRequest<AuditDto>;
public record CloseAuditCommand(Guid AuditId, string ExecutiveSummary) : IRequest<AuditDto>;
public record AddFindingCommand(Guid AuditId, string Title, string Description,
    FindingSeverity Severity, string? Recommendation, DateTime RemediationDueDate) : IRequest<FindingDto>;
public record UpdateFindingStatusCommand(Guid AuditId, Guid FindingId,
    FindingStatus Status, string? ManagementResponse, string? Owner) : IRequest<FindingDto>;
public record RequestEvidenceCommand(Guid AuditId, string Title, string Description,
    string RequestedFrom, DateTime DueDate) : IRequest<EvidenceRequestDto>;

// --- Queries ---
public record GetAuditsQuery(int Page = 1, int PageSize = 20,
    AuditStatus? Status = null) : IRequest<PagedResult<AuditSummaryDto>>;
public record GetAuditByIdQuery(Guid AuditId) : IRequest<AuditDto>;

// --- DTOs ---
public record AuditDto(Guid Id, string Title, string Scope, string Type, string Status,
    string LeadAuditor, DateTime PlannedStartDate, DateTime PlannedEndDate,
    DateTime? ActualStartDate, DateTime? ActualEndDate, string? ExecutiveSummary,
    int TotalFindings, int OpenFindings, int CriticalFindings,
    List<FindingDto> Findings, List<EvidenceRequestDto> EvidenceRequests, DateTime CreatedAt);

public record AuditSummaryDto(Guid Id, string Title, string Type, string Status,
    string LeadAuditor, DateTime PlannedEndDate, int OpenFindings, int CriticalFindings);

public record FindingDto(Guid Id, string Title, string Description, string Severity,
    string Status, string? Recommendation, string? ManagementResponse,
    string? Owner, DateTime RemediationDueDate, DateTime? ResolvedAt);

public record EvidenceRequestDto(Guid Id, string Title, string Description,
    string RequestedFrom, string Status, DateTime DueDate, string? BlobUrl);

// --- Handlers ---
public class CreateAuditCommandHandler(IAuditRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CreateAuditCommand, AuditDto>
{
    public async Task<AuditDto> Handle(CreateAuditCommand request, CancellationToken ct)
    {
        var audit = Audit.Create(request.Title, request.Scope, request.Type,
            request.LeadAuditor, request.StartDate, request.EndDate, currentUser.UserId);
        await repository.AddAsync(audit, ct);
        await repository.SaveChangesAsync(ct);
        return audit.ToDto();
    }
}

public class StartAuditCommandHandler(IAuditRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<StartAuditCommand, AuditDto>
{
    public async Task<AuditDto> Handle(StartAuditCommand request, CancellationToken ct)
    {
        var audit = await repository.GetByIdAsync(request.AuditId, ct)
            ?? throw new KeyNotFoundException($"Audit {request.AuditId} not found");
        audit.Start(currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return audit.ToDto();
    }
}

public class AddFindingCommandHandler(IAuditRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<AddFindingCommand, FindingDto>
{
    public async Task<FindingDto> Handle(AddFindingCommand request, CancellationToken ct)
    {
        var audit = await repository.GetByIdWithDetailsAsync(request.AuditId, ct)
            ?? throw new KeyNotFoundException($"Audit {request.AuditId} not found");
        var finding = audit.AddFinding(request.Title, request.Description, request.Severity,
            request.Recommendation, request.RemediationDueDate, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return finding.ToDto();
    }
}

public class CloseAuditCommandHandler(IAuditRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CloseAuditCommand, AuditDto>
{
    public async Task<AuditDto> Handle(CloseAuditCommand request, CancellationToken ct)
    {
        var audit = await repository.GetByIdAsync(request.AuditId, ct)
            ?? throw new KeyNotFoundException($"Audit {request.AuditId} not found");
        audit.Close(request.ExecutiveSummary, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return audit.ToDto();
    }
}

public class GetAuditsQueryHandler(IAuditRepository repository)
    : IRequestHandler<GetAuditsQuery, PagedResult<AuditSummaryDto>>
{
    public async Task<PagedResult<AuditSummaryDto>> Handle(GetAuditsQuery request, CancellationToken ct)
    {
        var result = await repository.GetPagedAsync(request.Page, request.PageSize, request.Status, ct);
        return PagedResult<AuditSummaryDto>.Create(
            result.Items.Select(a => a.ToSummaryDto()).ToList(),
            result.TotalCount, result.Page, result.PageSize);
    }
}

public class GetAuditByIdQueryHandler(IAuditRepository repository)
    : IRequestHandler<GetAuditByIdQuery, AuditDto>
{
    public async Task<AuditDto> Handle(GetAuditByIdQuery request, CancellationToken ct)
    {
        var audit = await repository.GetByIdWithDetailsAsync(request.AuditId, ct)
            ?? throw new KeyNotFoundException($"Audit {request.AuditId} not found");
        return audit.ToDto();
    }
}

// --- Mapping ---
public static class AuditMappingExtensions
{
    public static AuditDto ToDto(this Audit a) => new(
        a.Id, a.Title, a.Scope, a.Type.ToString(), a.Status.ToString(), a.LeadAuditor,
        a.PlannedStartDate, a.PlannedEndDate, a.ActualStartDate, a.ActualEndDate,
        a.ExecutiveSummary, a.Findings.Count, a.OpenFindings, a.CriticalFindings,
        a.Findings.Select(f => f.ToDto()).ToList(),
        a.EvidenceRequests.Select(e => e.ToDto()).ToList(), a.CreatedAt);

    public static AuditSummaryDto ToSummaryDto(this Audit a) => new(
        a.Id, a.Title, a.Type.ToString(), a.Status.ToString(), a.LeadAuditor,
        a.PlannedEndDate, a.OpenFindings, a.CriticalFindings);

    public static FindingDto ToDto(this AuditFinding f) => new(
        f.Id, f.Title, f.Description, f.Severity.ToString(), f.Status.ToString(),
        f.Recommendation, f.ManagementResponse, f.Owner, f.RemediationDueDate, f.ResolvedAt);

    public static EvidenceRequestDto ToDto(this EvidenceRequest e) => new(
        e.Id, e.Title, e.Description, e.RequestedFrom,
        e.Status.ToString(), e.DueDate, e.BlobUrl);
}
