using GrcPlatform.RiskManagement.Application.Risks.Commands;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using GrcPlatform.Shared;
using MediatR;
namespace GrcPlatform.RiskManagement.Application.Risks.Queries;
public record GetRiskByIdQuery(Guid RiskId) : IRequest<RiskDto>;
public record GetRisksQuery(int Page = 1, int PageSize = 20, RiskStatus? Status = null, RiskCategory? Category = null, string? Owner = null) : IRequest<PagedResult<RiskSummaryDto>>;
public record GetOverdueRiskReviewsQuery : IRequest<List<RiskSummaryDto>>;
public class GetRiskByIdQueryHandler(IRiskRepository repository) : IRequestHandler<GetRiskByIdQuery, RiskDto>
{ public async Task<RiskDto> Handle(GetRiskByIdQuery request, CancellationToken ct) { var r = await repository.GetByIdWithDetailsAsync(request.RiskId, ct) ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found"); return r.ToDto(); } }
public class GetRisksQueryHandler(IRiskRepository repository) : IRequestHandler<GetRisksQuery, PagedResult<RiskSummaryDto>>
{ public async Task<PagedResult<RiskSummaryDto>> Handle(GetRisksQuery request, CancellationToken ct) { var result = await repository.GetPagedAsync(request.Page, request.PageSize, request.Status, request.Category, request.Owner, ct); return PagedResult<RiskSummaryDto>.Create(result.Items.Select(r => r.ToSummaryDto()).ToList(), result.TotalCount, result.Page, result.PageSize); } }
public class GetOverdueRiskReviewsQueryHandler(IRiskRepository repository) : IRequestHandler<GetOverdueRiskReviewsQuery, List<RiskSummaryDto>>
{ public async Task<List<RiskSummaryDto>> Handle(GetOverdueRiskReviewsQuery request, CancellationToken ct) { var risks = await repository.GetOverdueReviewsAsync(ct); return risks.Select(r => r.ToSummaryDto()).ToList(); } }
