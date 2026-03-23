using GrcPlatform.IncidentManagement.Domain.Enums;

namespace GrcPlatform.IncidentManagement.Domain;

public interface IIncidentRepository
{
    Task<Incident?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Incident>> ListAsync(IncidentType? type, IncidentStatus? status, IncidentSeverity? severity, string? customerId, CancellationToken ct);
    Task<IReadOnlyList<CustomerSummaryDto>> GetCustomerSummariesAsync(CancellationToken ct);
    Task AddAsync(Incident incident, CancellationToken ct);
    void TrackNewActions(Incident incident);
    Task DeleteAsync(Incident incident, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
    Task<string> NextReferenceNumberAsync(CancellationToken ct);
}

public sealed record CustomerSummaryDto(
    string CustomerId,
    string CustomerName,
    int Total,
    int Open,
    int Critical);
