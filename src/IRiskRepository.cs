using GrcPlatform.RiskManagement.Domain.Entities;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.Shared;

namespace GrcPlatform.RiskManagement.Domain.Interfaces;

public interface IRiskRepository
{
    Task<Risk?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Risk?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<Risk>> GetPagedAsync(int page, int pageSize, RiskStatus? status = null,
        RiskCategory? category = null, string? owner = null, CancellationToken cancellationToken = default);
    Task<List<Risk>> GetOverdueReviewsAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Risk risk, CancellationToken cancellationToken = default);
    Task UpdateAsync(Risk risk, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
