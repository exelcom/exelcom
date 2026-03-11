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
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Risk>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Title).HasMaxLength(200).IsRequired();
            entity.Property(r => r.Description).HasMaxLength(2000).IsRequired();
            entity.Property(r => r.Owner).HasMaxLength(200);
            entity.Property(r => r.Department).HasMaxLength(200);
            entity.Property(r => r.RegulatoryReference).HasMaxLength(500);
            entity.Property(r => r.CreatedBy).HasMaxLength(200).IsRequired();
            entity.Property(r => r.UpdatedBy).HasMaxLength(200);

            entity.HasQueryFilter(r => !r.IsDeleted);

            entity.HasMany(r => r.Treatments)
                  .WithOne()
                  .HasForeignKey(t => t.RiskId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(r => r.Reviews)
                  .WithOne()
                  .HasForeignKey(rv => rv.RiskId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Ignore(r => r.DomainEvents);

            entity.HasIndex(r => r.Status);
            entity.HasIndex(r => r.Category);
            entity.HasIndex(r => r.Owner);
            entity.HasIndex(r => r.ReviewDueDate);
        });

        modelBuilder.Entity<RiskTreatment>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Description).HasMaxLength(1000).IsRequired();
            entity.Property(t => t.Owner).HasMaxLength(200).IsRequired();
            entity.Property(t => t.CreatedBy).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<RiskReview>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Notes).HasMaxLength(2000).IsRequired();
            entity.Property(r => r.ReviewedBy).HasMaxLength(200).IsRequired();
        });
    }
}
