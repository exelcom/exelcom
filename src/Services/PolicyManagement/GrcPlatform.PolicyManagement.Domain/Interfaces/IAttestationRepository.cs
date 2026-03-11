using GrcPlatform.PolicyManagement.Domain.Entities;

namespace GrcPlatform.PolicyManagement.Domain.Interfaces;

public interface IAttestationRepository
{
    Task<PolicyAttestation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<PolicyAttestation>> GetByPolicyIdAsync(Guid policyId, CancellationToken ct = default);
    Task<List<PolicyAttestation>> GetPendingForUserAsync(string userId, CancellationToken ct = default);
    Task AddAsync(PolicyAttestation attestation, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
