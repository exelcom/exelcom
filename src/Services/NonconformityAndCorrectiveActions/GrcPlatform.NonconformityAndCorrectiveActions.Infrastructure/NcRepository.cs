using GrcPlatform.NonconformityAndCorrectiveActions.Domain;
using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;
using GrcPlatform.NonconformityAndCorrectiveActions.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.NonconformityAndCorrectiveActions.Infrastructure;

public sealed class NcRepository(NcDbContext db) : INonconformityRepository
{
    public Task<Nonconformity?> GetByIdAsync(Guid id, CancellationToken ct)
        => db.Nonconformities
             .Include(n => n.CorrectiveActions)
             .FirstOrDefaultAsync(n => n.Id == id, ct);

    public async Task<IReadOnlyList<Nonconformity>> ListAsync(
        NcStatus? status, NcSeverity? severity, CancellationToken ct)
    {
        var query = db.Nonconformities
                      .Include(n => n.CorrectiveActions)
                      .AsNoTracking()
                      .AsQueryable();
        if (status is not null) query = query.Where(n => n.Status == status);
        if (severity is not null) query = query.Where(n => n.Severity == severity);
        return await query.OrderByDescending(n => n.RaisedAt).ToListAsync(ct);
    }

    public async Task AddAsync(Nonconformity nc, CancellationToken ct)
        => await db.Nonconformities.AddAsync(nc, ct);

    public Task DeleteAsync(Nonconformity nc, CancellationToken ct)
    {
        db.Nonconformities.Remove(nc);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Explicitly marks any untracked CorrectiveActions as Added so EF inserts them
    /// rather than trying to update them. Call after domain methods that add new CAs.
    /// </summary>
    public void TrackNewCorrectiveActions(Nonconformity nc)
    {
        foreach (var ca in nc.CorrectiveActions)
        {
            var entry = db.Entry(ca);
            if (entry.State == EntityState.Detached)
                entry.State = EntityState.Added;
        }
    }

    public Task SaveChangesAsync(CancellationToken ct)
        => db.SaveChangesAsync(ct);

    public async Task<string> NextReferenceNumberAsync(CancellationToken ct)
    {
        var param = new SqlParameter("@val", System.Data.SqlDbType.Int)
        {
            Direction = System.Data.ParameterDirection.Output
        };
        await db.Database.ExecuteSqlRawAsync(
            "SELECT @val = NEXT VALUE FOR dbo.NcSequence",
            new[] { param },
            ct);
        var seq = (int)param.Value;
        return $"NC-{DateTimeOffset.UtcNow.Year}-{seq:D4}";
    }
}
