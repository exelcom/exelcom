using GrcPlatform.PolicyManagement.Domain.Entities;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.Shared;
namespace GrcPlatform.PolicyManagement.Domain.Interfaces;
public interface IPolicyRepository
{
    Task<Policy?> GetByIdAsync(Guid id, CancellationToken ct=default);
    Task<Policy?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct=default);
    Task<PagedResult<Policy>> GetPagedAsync(int page, int pageSize, PolicyStatus? status=null, PolicyCategory? category=null, CancellationToken ct=default);
    Task AddAsync(Policy policy, CancellationToken ct=default);
    Task DeleteAsync(Guid id, string deletedBy, CancellationToken ct=default);
    Task<int> SaveChangesAsync(CancellationToken ct=default);
}

