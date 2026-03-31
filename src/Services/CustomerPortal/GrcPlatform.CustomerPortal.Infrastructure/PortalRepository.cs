using GrcPlatform.CustomerPortal.Domain;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.CustomerPortal.Infrastructure;

public sealed class PortalDbContext(DbContextOptions<PortalDbContext> options) : DbContext(options)
{
    public DbSet<PortalAccount> PortalAccounts => Set<PortalAccount>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<PortalAccount>(e =>
        {
            e.ToTable("PortalAccounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.CrmCustomerId).HasMaxLength(100).IsRequired();
            e.Property(x => x.GrcCustomerId).HasMaxLength(100).IsRequired();
            e.Property(x => x.CustomerName).HasMaxLength(200).IsRequired();
            e.Property(x => x.ParentGrcCustomerId).HasMaxLength(100);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.GrcCustomerId);
            e.HasIndex(x => x.ParentGrcCustomerId);
        });
    }
}

public sealed class PortalRepository(PortalDbContext db) : IPortalAccountRepository
{
    public Task<PortalAccount?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.PortalAccounts.FirstOrDefaultAsync(a => a.Id == id, ct);

    public Task<PortalAccount?> GetByUsernameAsync(string username, CancellationToken ct = default)
        => db.PortalAccounts.FirstOrDefaultAsync(a => a.Username == username, ct);

    public async Task<IReadOnlyList<PortalAccount>> ListAsync(CancellationToken ct = default)
        => await db.PortalAccounts.OrderBy(a => a.CustomerName).ToListAsync(ct);

    public async Task<IReadOnlyList<PortalAccount>> GetChildAccountsAsync(string parentGrcCustomerId, CancellationToken ct = default)
        => await db.PortalAccounts.Where(a => a.ParentGrcCustomerId == parentGrcCustomerId && a.IsActive).ToListAsync(ct);

    public async Task AddAsync(PortalAccount account, CancellationToken ct = default)
        => await db.PortalAccounts.AddAsync(account, ct);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => db.SaveChangesAsync(ct);

    public Task DeleteAsync(PortalAccount account, CancellationToken ct = default)
    {
        db.PortalAccounts.Remove(account);
        return Task.CompletedTask;
    }
}
