using GrcPlatform.PolicyManagement.Application.Policies.Commands;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using GrcPlatform.Shared;
using MediatR;

namespace GrcPlatform.PolicyManagement.Application.Policies.Queries;

public record GetPolicyByIdQuery(Guid PolicyId) : IRequest<PolicyDto>;

public record GetPoliciesQuery(
    int Page = 1,
    int PageSize = 20,
    PolicyStatus? Status = null,
    PolicyCategory? Category = null) : IRequest<PagedResult<PolicySummaryDto>>;

public class GetPolicyByIdQueryHandler(IPolicyRepository repository)
    : IRequestHandler<GetPolicyByIdQuery, PolicyDto>
{
    public async Task<PolicyDto> Handle(GetPolicyByIdQuery request, CancellationToken ct)
    {
        var policy = await repository.GetByIdWithDetailsAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");
        return policy.ToDto();
    }
}

public class GetPoliciesQueryHandler(IPolicyRepository repository)
    : IRequestHandler<GetPoliciesQuery, PagedResult<PolicySummaryDto>>
{
    public async Task<PagedResult<PolicySummaryDto>> Handle(GetPoliciesQuery request, CancellationToken ct)
    {
        var result = await repository.GetPagedAsync(
            request.Page, request.PageSize, request.Status, request.Category, ct);
        return PagedResult<PolicySummaryDto>.Create(
            result.Items.Select(p => p.ToSummaryDto()).ToList(),
            result.TotalCount, result.Page, result.PageSize);
    }
}
