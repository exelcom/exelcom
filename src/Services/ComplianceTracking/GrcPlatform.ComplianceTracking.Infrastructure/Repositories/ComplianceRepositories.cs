using GrcPlatform.ComplianceTracking.Domain.Entities;
using GrcPlatform.ComplianceTracking.Domain.Interfaces;
using GrcPlatform.ComplianceTracking.Infrastructure.Persistence;
using GrcPlatform.Shared;
using Microsoft.EntityFrameworkCore;
namespace GrcPlatform.ComplianceTracking.Infrastructure.Repositories;
public class ComplianceFrameworkRepository(ComplianceDbContext context) : IComplianceFrameworkRepository
{
    public async Task<ComplianceFramework?> GetByIdAsync(Guid id, CancellationToken ct=default) => await context.Frameworks.FirstOrDefaultAsync(f=>f.Id==id,ct);
    public async Task<ComplianceFramework?> GetByIdWithControlsAsync(Guid id, CancellationToken ct=default) => await context.Frameworks.Include(f=>f.Controls).FirstOrDefaultAsync(f=>f.Id==id,ct);
    public async Task<PagedResult<ComplianceFramework>> GetPagedAsync(int page, int pageSize, CancellationToken ct=default) { var q=context.Frameworks.Include(f=>f.Controls); var total=await q.CountAsync(ct); var items=await q.OrderBy(f=>f.Name).Skip((page-1)*pageSize).Take(pageSize).ToListAsync(ct); return PagedResult<ComplianceFramework>.Create(items,total,page,pageSize); }
    public async Task AddAsync(ComplianceFramework f, CancellationToken ct=default) => await context.Frameworks.AddAsync(f,ct);
    public async Task DeleteAsync(Guid id, string deletedBy, CancellationToken ct=default) { var f = await context.Frameworks.FindAsync(new object[]{id},ct); if(f!=null){f.IsDeleted=true;f.DeletedAt=DateTime.UtcNow;f.DeletedBy=deletedBy;await context.SaveChangesAsync(ct);} }
    public async Task<int> SaveChangesAsync(CancellationToken ct=default) => await context.SaveChangesAsync(ct);
}
public class ComplianceControlRepository(ComplianceDbContext context) : IComplianceControlRepository
{
    public async Task<ComplianceControl?> GetByIdAsync(Guid id, CancellationToken ct=default) => await context.Controls.FirstOrDefaultAsync(c=>c.Id==id,ct);
    public async Task<ComplianceControl?> GetByIdWithEvidenceAsync(Guid id, CancellationToken ct=default) => await context.Controls.Include(c=>c.Evidence).FirstOrDefaultAsync(c=>c.Id==id,ct);
    public async Task<List<ComplianceControl>> GetByFrameworkIdAsync(Guid frameworkId, CancellationToken ct=default) => await context.Controls.Where(c=>c.FrameworkId==frameworkId).OrderBy(c=>c.ControlId).ToListAsync(ct);
    public async Task DeleteAsync(Guid id, string deletedBy, CancellationToken ct=default) { var f = await context.Frameworks.FindAsync(new object[]{id},ct); if(f!=null){f.IsDeleted=true;f.DeletedAt=DateTime.UtcNow;f.DeletedBy=deletedBy;await context.SaveChangesAsync(ct);} }
    public async Task<int> SaveChangesAsync(CancellationToken ct=default) => await context.SaveChangesAsync(ct);
}

