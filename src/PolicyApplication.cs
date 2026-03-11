using GrcPlatform.PolicyManagement.Domain.Entities;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using GrcPlatform.Shared;
using MediatR;

namespace GrcPlatform.PolicyManagement.Application.Policies.Commands;

// --- Commands ---
public record CreatePolicyCommand(string Title, string Description, PolicyCategory Category,
    string Content, string? Owner, string? Department, bool RequiresAttestation,
    DateTime? ReviewDueDate) : IRequest<PolicyDto>;

public record AddPolicyVersionCommand(Guid PolicyId, string Content,
    string ChangeNotes) : IRequest<PolicyDto>;

public record ApprovePolicyCommand(Guid PolicyId) : IRequest<PolicyDto>;
public record PublishPolicyCommand(Guid PolicyId) : IRequest<PolicyDto>;
public record RetirePolicyCommand(Guid PolicyId) : IRequest<PolicyDto>;

public record RequestAttestationCommand(Guid PolicyId, string UserId,
    string UserEmail, DateTime DueDate) : IRequest<AttestationDto>;

public record SubmitAttestationCommand(Guid AttestationId, bool Attested,
    string Notes) : IRequest<AttestationDto>;

// --- DTOs ---
public record PolicyDto(Guid Id, string Title, string Description, string Category,
    string Status, string? Owner, string? Department, bool RequiresAttestation,
    DateTime? ReviewDueDate, DateTime? ApprovedAt, string? ApprovedBy,
    int VersionCount, string? CurrentVersionContent, DateTime CreatedAt);

public record PolicySummaryDto(Guid Id, string Title, string Category,
    string Status, string? Owner, DateTime? ReviewDueDate, int VersionCount);

public record AttestationDto(Guid Id, Guid PolicyId, string UserId,
    string UserEmail, string Status, DateTime DueDate, DateTime? AttestedAt);

// --- Interfaces ---
public interface ICurrentUserService
{
    string UserId { get; }
    string UserEmail { get; }
}

// --- Handlers ---
public class CreatePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CreatePolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(CreatePolicyCommand request, CancellationToken ct)
    {
        var policy = Policy.Create(request.Title, request.Description, request.Category,
            request.Content, request.Owner, request.Department, request.RequiresAttestation,
            request.ReviewDueDate, currentUser.UserId);
        await repository.AddAsync(policy, ct);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}

public class ApprovePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<ApprovePolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(ApprovePolicyCommand request, CancellationToken ct)
    {
        var policy = await repository.GetByIdAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");
        policy.Approve(currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}

public class PublishPolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<PublishPolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(PublishPolicyCommand request, CancellationToken ct)
    {
        var policy = await repository.GetByIdAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");
        policy.Publish(currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}

public class AddPolicyVersionCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<AddPolicyVersionCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(AddPolicyVersionCommand request, CancellationToken ct)
    {
        var policy = await repository.GetByIdWithDetailsAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");
        policy.AddVersion(request.Content, request.ChangeNotes, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}

// --- Queries ---
public record GetPoliciesQuery(int Page = 1, int PageSize = 20,
    PolicyStatus? Status = null, PolicyCategory? Category = null) : IRequest<PagedResult<PolicySummaryDto>>;
public record GetPolicyByIdQuery(Guid PolicyId) : IRequest<PolicyDto>;

public class GetPoliciesQueryHandler(IPolicyRepository repository)
    : IRequestHandler<GetPoliciesQuery, PagedResult<PolicySummaryDto>>
{
    public async Task<PagedResult<PolicySummaryDto>> Handle(GetPoliciesQuery request, CancellationToken ct)
    {
        var result = await repository.GetPagedAsync(request.Page, request.PageSize,
            request.Status, request.Category, ct);
        var dtos = result.Items.Select(p => p.ToSummaryDto()).ToList();
        return PagedResult<PolicySummaryDto>.Create(dtos, result.TotalCount, result.Page, result.PageSize);
    }
}

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

// --- Mapping ---
public static class PolicyMappingExtensions
{
    public static PolicyDto ToDto(this Policy p) => new(
        p.Id, p.Title, p.Description, p.Category.ToString(), p.Status.ToString(),
        p.Owner, p.Department, p.RequiresAttestation, p.ReviewDueDate,
        p.ApprovedAt, p.ApprovedBy, p.Versions.Count,
        p.CurrentVersion?.Content, p.CreatedAt);

    public static PolicySummaryDto ToSummaryDto(this Policy p) => new(
        p.Id, p.Title, p.Category.ToString(), p.Status.ToString(),
        p.Owner, p.ReviewDueDate, p.Versions.Count);

    public static AttestationDto ToDto(this PolicyAttestation a) => new(
        a.Id, a.PolicyId, a.UserId, a.UserEmail,
        a.Status.ToString(), a.DueDate, a.AttestedAt);
}
