using GrcPlatform.RiskManagement.Domain.Entities;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using GrcPlatform.RiskManagement.Infrastructure.Persistence;
using GrcPlatform.Shared;
using Microsoft.EntityFrameworkCore;
namespace GrcPlatform.RiskManagement.Infrastructure.Repositories;
public class RiskRepository(RiskDbContext context) : IRiskRepository
{
    public async Task<Risk?> GetByIdAsync(Guid id, CancellationToken ct = default) => await context.Risks.FirstOrDefaultAsync(r => r.Id == id, ct);
    public async Task<Risk?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default) => await context.Risks.Include(r => r.Treatments).Include(r => r.Reviews).FirstOrDefaultAsync(r => r.Id == id, ct);
    public async Task<PagedResult<Risk>> GetPagedAsync(int page, int pageSize, RiskStatus? status = null, RiskCategory? category = null, string? owner = null, CancellationToken ct = default)
    {
        var q = context.Risks.AsQueryable();
        if (status.HasValue) q = q.Where(r => r.Status == status.Value);
        if (category.HasValue) q = q.Where(r => r.Category == category.Value);
        if (!string.IsNullOrEmpty(owner)) q = q.Where(r => r.Owner == owner);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(r => r.CreatedAt).Skip((page-1)*pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Risk>.Create(items, total, page, pageSize);
    }
    public async Task<List<Risk>> GetOverdueReviewsAsync(CancellationToken ct = default) => await context.Risks.Where(r => r.ReviewDueDate.HasValue && r.ReviewDueDate.Value < DateTime.UtcNow && r.Status != RiskStatus.Closed).OrderBy(r => r.ReviewDueDate).ToListAsync(ct);
    public async Task AddAsync(Risk risk, CancellationToken ct = default) => await context.Risks.AddAsync(risk, ct);
    public Task UpdateAsync(Risk risk, CancellationToken ct = default) { context.Risks.Update(risk); return Task.CompletedTask; }
    public async Task DeleteAsync(Guid id, string deletedBy, CancellationToken cancellationToken = default)
    {
        var risk = await context.Risks.FindAsync(new object[] { id }, cancellationToken);
        if (risk != null) { risk.IsDeleted = true; risk.DeletedAt = DateTime.UtcNow; risk.DeletedBy = deletedBy; await context.SaveChangesAsync(cancellationToken); }
    }
        public async Task<int> SaveChangesAsync(CancellationToken ct = default) => await context.SaveChangesAsync(ct);
}


