using GrcPlatform.ComplianceTracking.Domain.Entities;
using GrcPlatform.ComplianceTracking.Domain.Interfaces;
using GrcPlatform.Shared;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.ComplianceTracking.Infrastructure.Persistence;

public class ComplianceDbContext(DbContextOptions<ComplianceDbContext> options) : DbContext(options)
{
    public DbSet<ComplianceFramework> Frameworks => Set<ComplianceFramework>();
    public DbSet<ComplianceControl> Controls => Set<ComplianceControl>();
    public DbSet<ControlEvidence> Evidence => Set<ControlEvidence>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ComplianceFramework>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Name).HasMaxLength(200).IsRequired();
            e.Property(f => f.Version).HasMaxLength(50).IsRequired();
            e.Property(f => f.CreatedBy).HasMaxLength(200).IsRequired();
            e.HasQueryFilter(f => !f.IsDeleted);
            e.HasMany(f => f.Controls).WithOne().HasForeignKey(c => c.FrameworkId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Ignore(f => f.TotalControls);
            e.Ignore(f => f.ImplementedControls);
            e.Ignore(f => f.CompliancePercentage);
        });

        modelBuilder.Entity<ComplianceControl>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.ControlId).HasMaxLength(50).IsRequired();
            e.Property(c => c.Title).HasMaxLength(300).IsRequired();
            e.Property(c => c.Description).HasMaxLength(2000).IsRequired();
            e.Property(c => c.Owner).HasMaxLength(200);
            e.Property(c => c.CreatedBy).HasMaxLength(200).IsRequired();
            e.HasQueryFilter(c => !c.IsDeleted);
            e.HasMany(c => c.Evidence).WithOne().HasForeignKey(ev => ev.ControlId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Ignore(c => c.DomainEvents);
            e.HasIndex(c => new { c.FrameworkId, c.ControlId }).IsUnique();
            e.HasIndex(c => c.Status);
        });

        modelBuilder.Entity<ControlEvidence>(e =>
        {
            e.HasKey(ev => ev.Id);
            e.Property(ev => ev.FileName).HasMaxLength(500).IsRequired();
            e.Property(ev => ev.BlobUrl).HasMaxLength(2000).IsRequired();
            e.Property(ev => ev.CreatedBy).HasMaxLength(200).IsRequired();
        });
    }
}
