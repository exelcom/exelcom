using Microsoft.EntityFrameworkCore.Design;
using GrcPlatform.PolicyManagement.Domain.Entities;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using GrcPlatform.Shared;
using Microsoft.EntityFrameworkCore;
namespace GrcPlatform.PolicyManagement.Infrastructure.Persistence;
public class PolicyDbContext(DbContextOptions<PolicyDbContext> options) : DbContext(options)
{
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<PolicyVersion> PolicyVersions => Set<PolicyVersion>();
    public DbSet<PolicyAttestation> Attestations => Set<PolicyAttestation>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Policy>(e => {
            e.HasKey(p=>p.Id); e.Property(p=>p.Title).HasMaxLength(300).IsRequired(); e.Property(p=>p.Owner).HasMaxLength(200); e.Property(p=>p.CreatedBy).HasMaxLength(200).IsRequired();
            e.HasQueryFilter(p=>!p.IsDeleted);
            e.HasMany(p=>p.Versions).WithOne().HasForeignKey(v=>v.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p=>p.Attestations).WithOne().HasForeignKey(a=>a.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.Ignore(p=>p.CurrentVersion); e.HasIndex(p=>p.Status); e.HasIndex(p=>p.Category);
        });
        modelBuilder.Entity<PolicyVersion>(e => { e.HasKey(v=>v.Id); e.Property(v=>v.Content).IsRequired(); e.Property(v=>v.ChangeNotes).HasMaxLength(1000).IsRequired(); e.Property(v=>v.CreatedBy).HasMaxLength(200).IsRequired(); });
        modelBuilder.Entity<PolicyAttestation>(e => { e.HasKey(a=>a.Id); e.Property(a=>a.UserId).HasMaxLength(200).IsRequired(); e.Property(a=>a.UserEmail).HasMaxLength(300).IsRequired(); e.Property(a=>a.CreatedBy).HasMaxLength(200).IsRequired(); e.HasIndex(a=>new{a.PolicyId,a.UserId}); });
    }
}
public class PolicyDbContextFactory : IDesignTimeDbContextFactory<PolicyDbContext>
{
    public PolicyDbContext CreateDbContext(string[] args)
    { var o=new DbContextOptionsBuilder<PolicyDbContext>(); o.UseSqlServer("Server=sql-grc-exelcom-dev.database.windows.net;Database=PolicyDb;Authentication=Active Directory Default;Encrypt=True;"); return new PolicyDbContext(o.Options); }
}
public class PolicyRepository(PolicyDbContext context) : IPolicyRepository
{
    public async Task<Policy?> GetByIdAsync(Guid id, CancellationToken ct=default) => await context.Policies.FirstOrDefaultAsync(p=>p.Id==id,ct);
    public async Task<Policy?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct=default) => await context.Policies.Include(p=>p.Versions).Include(p=>p.Attestations).FirstOrDefaultAsync(p=>p.Id==id,ct);
    public async Task<PagedResult<Policy>> GetPagedAsync(int page, int pageSize, PolicyStatus? status=null, PolicyCategory? category=null, CancellationToken ct=default)
    { var q=context.Policies.Include(p=>p.Versions).AsQueryable(); if(status.HasValue) q=q.Where(p=>p.Status==status.Value); if(category.HasValue) q=q.Where(p=>p.Category==category.Value); var total=await q.CountAsync(ct); var items=await q.OrderByDescending(p=>p.CreatedAt).Skip((page-1)*pageSize).Take(pageSize).ToListAsync(ct); return PagedResult<Policy>.Create(items,total,page,pageSize); }
    public async Task AddAsync(Policy policy, CancellationToken ct=default) => await context.Policies.AddAsync(policy,ct);
    public async Task DeleteAsync(Guid id, string deletedBy, CancellationToken ct=default) { var p = await context.Policies.FindAsync(new object[]{id},ct); if(p!=null){p.IsDeleted=true;p.DeletedAt=DateTime.UtcNow;p.DeletedBy=deletedBy;await context.SaveChangesAsync(ct);} }
    public async Task<int> SaveChangesAsync(CancellationToken ct=default) => await context.SaveChangesAsync(ct);
}


