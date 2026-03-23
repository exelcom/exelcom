using GrcPlatform.IncidentManagement.Domain;
using GrcPlatform.IncidentManagement.Domain.Enums;
using GrcPlatform.IncidentManagement.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.IncidentManagement.Infrastructure;

public sealed class IncidentRepository(IncidentDbContext db) : IIncidentRepository
{
    public Task<Incident?> GetByIdAsync(Guid id, CancellationToken ct)
        => db.Incidents.Include(i => i.Actions).FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task<IReadOnlyList<Incident>> ListAsync(
        IncidentType? type, IncidentStatus? status, IncidentSeverity? severity, string? customerId, CancellationToken ct)
    {
        var query = db.Incidents.Include(i => i.Actions).AsNoTracking().AsQueryable();
        if (type is not null) query = query.Where(i => i.Type == type);
        if (status is not null) query = query.Where(i => i.Status == status);
        if (severity is not null) query = query.Where(i => i.Severity == severity);
        if (customerId == "__exelcom__")
            query = query.Where(i => i.CustomerId == null);
        else if (customerId is not null)
            query = query.Where(i => i.CustomerId == customerId);
        return await query.OrderByDescending(i => i.Severity).ThenByDescending(i => i.CreatedAt).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CustomerSummaryDto>> GetCustomerSummariesAsync(CancellationToken ct)
    {
        var result = new List<CustomerSummaryDto>();
        var openStatuses = new[] { IncidentStatus.New, IncidentStatus.Investigating, IncidentStatus.Contained };

        var internal_ = await db.Incidents.AsNoTracking().Where(i => i.CustomerId == null).ToListAsync(ct);
        if (internal_.Any())
            result.Add(new CustomerSummaryDto("__exelcom__", "Exelcom (Internal)",
                internal_.Count,
                internal_.Count(i => openStatuses.Contains(i.Status)),
                internal_.Count(i => i.Severity == IncidentSeverity.Critical)));

        var customers = await db.Incidents.AsNoTracking()
            .Where(i => i.CustomerId != null)
            .GroupBy(i => new { i.CustomerId, i.CustomerName })
            .Select(g => new { g.Key.CustomerId, g.Key.CustomerName, Items = g.ToList() })
            .ToListAsync(ct);

        foreach (var c in customers)
            result.Add(new CustomerSummaryDto(c.CustomerId!, c.CustomerName ?? c.CustomerId!,
                c.Items.Count,
                c.Items.Count(i => openStatuses.Contains(i.Status)),
                c.Items.Count(i => i.Severity == IncidentSeverity.Critical)));

        return result.OrderBy(r => r.CustomerName).ToList();
    }

    public async Task AddAsync(Incident incident, CancellationToken ct)
        => await db.Incidents.AddAsync(incident, ct);

    public void TrackNewActions(Incident incident)
    {
        foreach (var action in incident.Actions)
        {
            var entry = db.Entry(action);
            if (entry.State == EntityState.Detached)
                entry.State = EntityState.Added;
        }
    }

    public Task DeleteAsync(Incident incident, CancellationToken ct)
    {
        db.Incidents.Remove(incident);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    public async Task<string> NextReferenceNumberAsync(CancellationToken ct)
    {
        var param = new SqlParameter("@val", System.Data.SqlDbType.Int)
        {
            Direction = System.Data.ParameterDirection.Output
        };
        await db.Database.ExecuteSqlRawAsync("SELECT @val = NEXT VALUE FOR dbo.IncidentSequence", new[] { param }, ct);
        var seq = (int)param.Value;
        return $"INC-{DateTimeOffset.UtcNow.Year}-{seq:D4}";
    }
}
