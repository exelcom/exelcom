using GrcPlatform.RiskManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace GrcPlatform.RiskManagement.Infrastructure.Persistence;
public class RiskDbContext(DbContextOptions<RiskDbContext> options) : DbContext(options)
{
    public DbSet<Risk> Risks => Set<Risk>();
    public DbSet<RiskTreatment> RiskTreatments => Set<RiskTreatment>();
    public DbSet<RiskReview> RiskReviews => Set<RiskReview>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Risk>(e => {
            e.HasKey(r => r.Id); e.Property(r => r.Title).HasMaxLength(200).IsRequired(); e.Property(r => r.Description).HasMaxLength(2000).IsRequired();
            e.Property(r => r.Owner).HasMaxLength(200); e.Property(r => r.Department).HasMaxLength(200); e.Property(r => r.RegulatoryReference).HasMaxLength(500);
            e.Property(r => r.CreatedBy).HasMaxLength(200).IsRequired(); e.Property(r => r.UpdatedBy).HasMaxLength(200);
            e.HasQueryFilter(r => !r.IsDeleted);
            e.HasMany(r => r.Treatments).WithOne().HasForeignKey(t => t.RiskId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(r => r.Reviews).WithOne().HasForeignKey(rv => rv.RiskId).OnDelete(DeleteBehavior.Cascade);
            e.Ignore(r => r.DomainEvents); e.Ignore(r => r.RiskRating); e.Ignore(r => r.InherentScore); e.Ignore(r => r.ResidualScore);
            e.HasIndex(r => r.Status); e.HasIndex(r => r.Category); e.HasIndex(r => r.Owner); e.HasIndex(r => r.ReviewDueDate);
        });
        modelBuilder.Entity<RiskTreatment>(e => { e.HasKey(t => t.Id); e.Property(t => t.Description).HasMaxLength(1000).IsRequired(); e.Property(t => t.Owner).HasMaxLength(200).IsRequired(); e.Property(t => t.CreatedBy).HasMaxLength(200).IsRequired(); });
        modelBuilder.Entity<RiskReview>(e => { e.HasKey(r => r.Id); e.Property(r => r.Notes).HasMaxLength(2000).IsRequired(); e.Property(r => r.ReviewedBy).HasMaxLength(200).IsRequired(); });
    }
}
