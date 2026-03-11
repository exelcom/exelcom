using GrcPlatform.RiskManagement.Domain.Entities;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using GrcPlatform.RiskManagement.Infrastructure.Persistence;
using GrcPlatform.Shared;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.RiskManagement.Infrastructure.Repositories;

public class RiskRepository(RiskDbContext context) : IRiskRepository
{
    public async Task<Risk?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await context.Risks.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<Risk?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
        => await context.Risks
            .Include(r => r.Treatments)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<PagedResult<Risk>> GetPagedAsync(int page, int pageSize,
        RiskStatus? status = null, RiskCategory? category = null,
        string? owner = null, CancellationToken cancellationToken = default)
    {
        var query = context.Risks.AsQueryable();

        if (status.HasValue) query = query.Where(r => r.Status == status.Value);
        if (category.HasValue) query = query.Where(r => r.Category == category.Value);
        if (!string.IsNullOrEmpty(owner)) query = query.Where(r => r.Owner == owner);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.InherentScore)
            .ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<Risk>.Create(items, totalCount, page, pageSize);
    }

    public async Task<List<Risk>> GetOverdueReviewsAsync(CancellationToken cancellationToken = default)
        => await context.Risks
            .Where(r => r.ReviewDueDate.HasValue
                && r.ReviewDueDate.Value < DateTime.UtcNow
                && r.Status != RiskStatus.Closed)
            .OrderBy(r => r.ReviewDueDate)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(Risk risk, CancellationToken cancellationToken = default)
        => await context.Risks.AddAsync(risk, cancellationToken);

    public Task UpdateAsync(Risk risk, CancellationToken cancellationToken = default)
    {
        context.Risks.Update(risk);
        return Task.CompletedTask;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await context.SaveChangesAsync(cancellationToken);
}
