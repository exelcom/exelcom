namespace GrcPlatform.NonconformityAndCorrectiveActions.Domain;

public interface INonconformityRepository
{
    Task<Nonconformity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Nonconformity>> ListAsync(
        Domain.Enums.NcStatus? status,
        Domain.Enums.NcSeverity? severity,
        CancellationToken ct);
    Task AddAsync(Nonconformity nc, CancellationToken ct);
    Task DeleteAsync(Nonconformity nc, CancellationToken ct);
    void TrackNewCorrectiveActions(Nonconformity nc);
    Task SaveChangesAsync(CancellationToken ct);
    Task<string> NextReferenceNumberAsync(CancellationToken ct);
}
