using GrcPlatform.PolicyManagement.Application.Interfaces;
using GrcPlatform.PolicyManagement.Application.Policies.Commands;
using GrcPlatform.PolicyManagement.Domain.Entities;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using MediatR;

namespace GrcPlatform.PolicyManagement.Application.Policies.Commands;

// ── Attestation handlers ──────────────────────────────────────────────────────

public class RequestAttestationCommandHandler(
    IPolicyRepository policyRepo,
    IAttestationRepository attestationRepo,
    ICurrentUserService currentUser)
    : IRequestHandler<RequestAttestationCommand, AttestationDto>
{
    public async Task<AttestationDto> Handle(RequestAttestationCommand request, CancellationToken ct)
    {
        // Verify policy exists and is published
        var policy = await policyRepo.GetByIdAsync(request.PolicyId, ct)
            ?? throw new KeyNotFoundException($"Policy {request.PolicyId} not found");

        var attestation = PolicyAttestation.Create(
            request.PolicyId, request.UserId, request.UserEmail,
            request.DueDate, currentUser.UserId);

        await attestationRepo.AddAsync(attestation, ct);
        await attestationRepo.SaveChangesAsync(ct);
        return attestation.ToDto();
    }
}

public class SubmitAttestationCommandHandler(IAttestationRepository attestationRepo)
    : IRequestHandler<SubmitAttestationCommand, AttestationDto>
{
    public async Task<AttestationDto> Handle(SubmitAttestationCommand request, CancellationToken ct)
    {
        var attestation = await attestationRepo.GetByIdAsync(request.AttestationId, ct)
            ?? throw new KeyNotFoundException($"Attestation {request.AttestationId} not found");

        if (request.Attested)
            attestation.Attest(request.Notes ?? string.Empty);
        else
            attestation.Decline(request.Notes ?? "No reason provided");

        await attestationRepo.SaveChangesAsync(ct);
        return attestation.ToDto();
    }
}
