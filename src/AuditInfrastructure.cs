using GrcPlatform.AuditManagement.Application.Audits.Commands;
using GrcPlatform.AuditManagement.Domain.Entities;
using GrcPlatform.AuditManagement.Domain.Enums;
using GrcPlatform.Shared;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.AuditManagement.Infrastructure.Persistence;

public class AuditDbContext(DbContextOptions<AuditDbContext> options) : DbContext(options)
{
    public DbSet<Audit> Audits => Set<Audit>();
    public DbSet<AuditFinding> Findings => Set<AuditFinding>();
    public DbSet<EvidenceRequest> EvidenceRequests => Set<EvidenceRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Audit>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Title).HasMaxLength(300).IsRequired();
            e.Property(a => a.LeadAuditor).HasMaxLength(200).IsRequired();
            e.Property(a => a.CreatedBy).HasMaxLength(200).IsRequired();
            e.HasQueryFilter(a => !a.IsDeleted);
            e.HasMany(a => a.Findings).WithOne().HasForeignKey(f => f.AuditId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(a => a.EvidenceRequests).WithOne().HasForeignKey(er => er.AuditId).OnDelete(DeleteBehavior.Cascade);
            e.Ignore(a => a.CriticalFindings);
            e.Ignore(a => a.OpenFindings);
            e.HasIndex(a => a.Status);
        });

        modelBuilder.Entity<AuditFinding>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Title).HasMaxLength(300).IsRequired();
            e.Property(f => f.CreatedBy).HasMaxLength(200).IsRequired();
            e.HasIndex(f => f.Severity);
            e.HasIndex(f => f.Status);
        });

        modelBuilder.Entity<EvidenceRequest>(e =>
        {
            e.HasKey(er => er.Id);
            e.Property(er => er.Title).HasMaxLength(300).IsRequired();
            e.Property(er => er.RequestedFrom).HasMaxLength(200).IsRequired();
            e.Property(er => er.CreatedBy).HasMaxLength(200).IsRequired();
        });
    }
}

public class AuditRepository(AuditDbContext context) : IAuditRepository
{
    public async Task<Audit?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Audits.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<Audit?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
        => await context.Audits
            .Include(a => a.Findings)
            .Include(a => a.EvidenceRequests)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<PagedResult<Audit>> GetPagedAsync(int page, int pageSize,
        AuditStatus? status, CancellationToken ct = default)
    {
        var query = context.Audits
            .Include(a => a.Findings)
            .Include(a => a.EvidenceRequests)
            .AsQueryable();
        if (status.HasValue) query = query.Where(a => a.Status == status.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(a => a.PlannedEndDate)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Audit>.Create(items, total, page, pageSize);
    }

    public async Task AddAsync(Audit audit, CancellationToken ct = default)
        => await context.Audits.AddAsync(audit, ct);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await context.SaveChangesAsync(ct);
}
