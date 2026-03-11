using GrcPlatform.ComplianceTracking.Domain.Entities;
using GrcPlatform.Shared;
namespace GrcPlatform.ComplianceTracking.Domain.Interfaces;
public interface IComplianceFrameworkRepository
{
    Task<ComplianceFramework?> GetByIdAsync(Guid id, CancellationToken ct=default);
    Task<ComplianceFramework?> GetByIdWithControlsAsync(Guid id, CancellationToken ct=default);
    Task<PagedResult<ComplianceFramework>> GetPagedAsync(int page, int pageSize, CancellationToken ct=default);
    Task AddAsync(ComplianceFramework framework, CancellationToken ct=default);
    Task DeleteAsync(Guid id, string deletedBy, CancellationToken ct=default);
    Task<int> SaveChangesAsync(CancellationToken ct=default);
}
public interface IComplianceControlRepository
{
    Task<ComplianceControl?> GetByIdAsync(Guid id, CancellationToken ct=default);
    Task<ComplianceControl?> GetByIdWithEvidenceAsync(Guid id, CancellationToken ct=default);
    Task<List<ComplianceControl>> GetByFrameworkIdAsync(Guid frameworkId, CancellationToken ct=default);
    Task DeleteAsync(Guid id, string deletedBy, CancellationToken ct=default);
    Task<int> SaveChangesAsync(CancellationToken ct=default);
}

