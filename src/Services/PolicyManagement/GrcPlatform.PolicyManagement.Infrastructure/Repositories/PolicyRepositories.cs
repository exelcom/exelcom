using GrcPlatform.PolicyManagement.Domain.Entities;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using GrcPlatform.PolicyManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.PolicyManagement.Infrastructure.Repositories;

public class AttestationRepository(PolicyDbContext context) : IAttestationRepository
{
    public async Task<PolicyAttestation?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Attestations.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<List<PolicyAttestation>> GetByPolicyIdAsync(Guid policyId, CancellationToken ct = default)
        => await context.Attestations
            .Where(a => a.PolicyId == policyId)
            .OrderBy(a => a.DueDate)
            .ToListAsync(ct);

    public async Task<List<PolicyAttestation>> GetPendingForUserAsync(string userId, CancellationToken ct = default)
        => await context.Attestations
            .Where(a => a.UserId == userId && a.Status == AttestationStatus.Pending)
            .OrderBy(a => a.DueDate)
            .ToListAsync(ct);

    public async Task AddAsync(PolicyAttestation attestation, CancellationToken ct = default)
        => await context.Attestations.AddAsync(attestation, ct);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await context.SaveChangesAsync(ct);
}
