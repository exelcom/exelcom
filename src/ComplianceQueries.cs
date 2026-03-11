using GrcPlatform.ComplianceTracking.Application.Compliance.Commands;
using GrcPlatform.ComplianceTracking.Domain.Interfaces;
using GrcPlatform.Shared;
using MediatR;

namespace GrcPlatform.ComplianceTracking.Application.Compliance.Queries;

public record GetFrameworkByIdQuery(Guid FrameworkId) : IRequest<FrameworkDto>;
public record GetFrameworksQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResult<FrameworkSummaryDto>>;
public record GetControlsByFrameworkQuery(Guid FrameworkId) : IRequest<List<ControlSummaryDto>>;
public record GetControlByIdQuery(Guid ControlId) : IRequest<ControlDto>;

public class GetFrameworkByIdQueryHandler(IComplianceFrameworkRepository repository)
    : IRequestHandler<GetFrameworkByIdQuery, FrameworkDto>
{
    public async Task<FrameworkDto> Handle(GetFrameworkByIdQuery request, CancellationToken ct)
    {
        var framework = await repository.GetByIdWithControlsAsync(request.FrameworkId, ct)
            ?? throw new KeyNotFoundException($"Framework {request.FrameworkId} not found");
        return framework.ToDto();
    }
}

public class GetFrameworksQueryHandler(IComplianceFrameworkRepository repository)
    : IRequestHandler<GetFrameworksQuery, PagedResult<FrameworkSummaryDto>>
{
    public async Task<PagedResult<FrameworkSummaryDto>> Handle(GetFrameworksQuery request, CancellationToken ct)
    {
        var result = await repository.GetPagedAsync(request.Page, request.PageSize, ct);
        var dtos = result.Items.Select(f => f.ToSummaryDto()).ToList();
        return PagedResult<FrameworkSummaryDto>.Create(dtos, result.TotalCount, result.Page, result.PageSize);
    }
}

public class GetControlsByFrameworkQueryHandler(IComplianceControlRepository repository)
    : IRequestHandler<GetControlsByFrameworkQuery, List<ControlSummaryDto>>
{
    public async Task<List<ControlSummaryDto>> Handle(GetControlsByFrameworkQuery request, CancellationToken ct)
    {
        var controls = await repository.GetByFrameworkIdAsync(request.FrameworkId, ct);
        return controls.Select(c => c.ToSummaryDto()).ToList();
    }
}

public class GetControlByIdQueryHandler(IComplianceControlRepository repository)
    : IRequestHandler<GetControlByIdQuery, ControlDto>
{
    public async Task<ControlDto> Handle(GetControlByIdQuery request, CancellationToken ct)
    {
        var control = await repository.GetByIdWithEvidenceAsync(request.ControlId, ct)
            ?? throw new KeyNotFoundException($"Control {request.ControlId} not found");
        return control.ToDto();
    }
}
