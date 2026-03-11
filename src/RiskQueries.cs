using GrcPlatform.RiskManagement.Application.Risks.Commands;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using GrcPlatform.Shared;
using MediatR;

namespace GrcPlatform.RiskManagement.Application.Risks.Queries;

// --- Queries ---
public record GetRiskByIdQuery(Guid RiskId) : IRequest<RiskDto>;
public record GetRisksQuery(int Page = 1, int PageSize = 20,
    RiskStatus? Status = null, RiskCategory? Category = null,
    string? Owner = null) : IRequest<PagedResult<RiskSummaryDto>>;
public record GetOverdueRiskReviewsQuery : IRequest<List<RiskSummaryDto>>;

// --- Handlers ---
public class GetRiskByIdQueryHandler(IRiskRepository repository)
    : IRequestHandler<GetRiskByIdQuery, RiskDto>
{
    public async Task<RiskDto> Handle(GetRiskByIdQuery request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdWithDetailsAsync(request.RiskId, cancellationToken)
            ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");
        return risk.ToDto();
    }
}

public class GetRisksQueryHandler(IRiskRepository repository)
    : IRequestHandler<GetRisksQuery, PagedResult<RiskSummaryDto>>
{
    public async Task<PagedResult<RiskSummaryDto>> Handle(GetRisksQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            request.Page, request.PageSize, request.Status, request.Category, request.Owner, cancellationToken);

        var dtos = result.Items.Select(r => r.ToSummaryDto()).ToList();
        return PagedResult<RiskSummaryDto>.Create(dtos, result.TotalCount, result.Page, result.PageSize);
    }
}

public class GetOverdueRiskReviewsQueryHandler(IRiskRepository repository)
    : IRequestHandler<GetOverdueRiskReviewsQuery, List<RiskSummaryDto>>
{
    public async Task<List<RiskSummaryDto>> Handle(GetOverdueRiskReviewsQuery request, CancellationToken cancellationToken)
    {
        var risks = await repository.GetOverdueReviewsAsync(cancellationToken);
        return risks.Select(r => r.ToSummaryDto()).ToList();
    }
}
