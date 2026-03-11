using GrcPlatform.StatementOfApplicability.Domain.Entities;
namespace GrcPlatform.StatementOfApplicability.Domain.Interfaces;
public interface ISoaRepository
{
    Task<List<AnnexAControl>> GetAllAsync(CancellationToken ct = default);
    Task<AnnexAControl?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(AnnexAControl control, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
public interface ICurrentUserService
{
    string UserId { get; }
    string UserEmail { get; }
    bool IsAuthenticated { get; }
}
