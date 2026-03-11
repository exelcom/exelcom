using GrcPlatform.PolicyManagement.Application.Interfaces;
using GrcPlatform.PolicyManagement.Domain.Entities;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using MediatR;

namespace GrcPlatform.PolicyManagement.Application.Policies.Commands;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record PolicyDto(
    Guid Id, string Title, string Description, string Category, string Status,
    string? Owner, string? Department, bool RequiresAttestation,
    DateTime? ReviewDueDate, DateTime? ApprovedAt, string? ApprovedBy,
    DateTime CreatedAt, string CreatedBy,
    PolicyVersionDto? CurrentVersion, int TotalVersions, int TotalAttestations);

public record PolicySummaryDto(
    Guid Id, string Title, string Category, string Status,
    string? Owner, string? Department, DateTime? ReviewDueDate, DateTime CreatedAt);

public record PolicyVersionDto(
    Guid Id, int VersionNumber, string Content, string ChangeNotes, DateTime CreatedAt);

public record AttestationDto(
    Guid Id, Guid PolicyId, string UserId, string UserEmail,
    string Status, DateTime DueDate, DateTime? AttestedAt, string? Notes);

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreatePolicyCommand(
    string Title, string Description, PolicyCategory Category, string Content,
    string? Owner, string? Department, bool RequiresAttestation,
    DateTime? ReviewDueDate) : IRequest<PolicyDto>;

public record AddPolicyVersionCommand(
    Guid PolicyId, string Content, string ChangeNotes) : IRequest<PolicyDto>;

public record ApprovePolicyCommand(Guid PolicyId) : IRequest<PolicyDto>;

public record PublishPolicyCommand(Guid PolicyId) : IRequest<PolicyDto>;

public record RetirePolicyCommand(Guid PolicyId) : IRequest<PolicyDto>;

public record RequestAttestationCommand(
    Guid PolicyId, string UserId, string UserEmail, DateTime DueDate) : IRequest<AttestationDto>;

public record SubmitAttestationCommand(
    Guid AttestationId, bool Attested, string? Notes) : IRequest<AttestationDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class CreatePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CreatePolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(CreatePolicyCommand request, CancellationToken ct)
    {
        var policy = Policy.Create(
            request.Title, request.Description, request.Category, request.Content,
            request.Owner, request.Department, request.RequiresAttestation,
            request.ReviewDueDate, currentUser.UserId);
        await repository.AddAsync(policy, ct);
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

public class ApprovePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<ApprovePolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(ApprovePolicyCommand request, CancellationToken ct)
    {
        var policy = await repository.GetByIdWithDetailsAsync(request.PolicyId, ct)
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
        var policy = await repository.GetByIdWithDetailsAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");
        policy.Publish(currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}

public class RetirePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<RetirePolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(RetirePolicyCommand request, CancellationToken ct)
    {
        var policy = await repository.GetByIdWithDetailsAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");
        policy.Retire(currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}

// ── Mapping extensions ────────────────────────────────────────────────────────

public static class PolicyMappingExtensions
{
    public static PolicyDto ToDto(this Policy p) => new(
        p.Id, p.Title, p.Description, p.Category.ToString(), p.Status.ToString(),
        p.Owner, p.Department, p.RequiresAttestation,
        p.ReviewDueDate, p.ApprovedAt, p.ApprovedBy,
        p.CreatedAt, p.CreatedBy,
        p.CurrentVersion?.ToVersionDto(),
        p.Versions.Count,
        p.Attestations.Count);

    public static PolicySummaryDto ToSummaryDto(this Policy p) => new(
        p.Id, p.Title, p.Category.ToString(), p.Status.ToString(),
        p.Owner, p.Department, p.ReviewDueDate, p.CreatedAt);

    public static PolicyVersionDto ToVersionDto(this PolicyVersion v) => new(
        v.Id, v.VersionNumber, v.Content, v.ChangeNotes, v.CreatedAt);

    public static AttestationDto ToDto(this PolicyAttestation a) => new(
        a.Id, a.PolicyId, a.UserId, a.UserEmail,
        a.Status.ToString(), a.DueDate, a.AttestedAt, a.Notes);
}

public record DeletePolicyCommand(Guid PolicyId) : IRequest;
public class DeletePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser) : IRequestHandler<DeletePolicyCommand>
{
    public async Task Handle(DeletePolicyCommand request, CancellationToken ct)
    {
        await repository.DeleteAsync(request.PolicyId, currentUser.UserId, ct);
    }
}

public record UpdatePolicyCommand(Guid PolicyId, string Title, string? Description, PolicyCategory Category, string? Owner, string? Department, bool RequiresAttestation, DateTime? ReviewDueDate) : IRequest<PolicyDto>;
public class UpdatePolicyCommandHandler(IPolicyRepository repository, ICurrentUserService currentUser) : IRequestHandler<UpdatePolicyCommand, PolicyDto>
{
    public async Task<PolicyDto> Handle(UpdatePolicyCommand request, CancellationToken ct)
    {
        var policy = await repository.GetByIdWithDetailsAsync(request.PolicyId, ct) ?? throw new KeyNotFoundException();
        policy.UpdateDetails(request.Title, request.Description, (PolicyCategory)request.Category, request.Owner, request.Department, request.RequiresAttestation, request.ReviewDueDate, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return policy.ToDto();
    }
}




