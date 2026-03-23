using GrcPlatform.IncidentManagement.Domain;
using GrcPlatform.IncidentManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.IncidentManagement.Infrastructure.Persistence;

public sealed class IncidentDbContext(DbContextOptions<IncidentDbContext> options) : DbContext(options)
{
    public DbSet<Incident> Incidents => Set<Incident>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        var inc = mb.Entity<Incident>();
        inc.ToTable("Incidents");
        inc.HasKey(x => x.Id);
        inc.Property(x => x.ReferenceNumber).HasMaxLength(20).IsRequired();
        inc.HasIndex(x => x.ReferenceNumber).IsUnique();
        inc.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        inc.Property(x => x.Severity).HasConversion<string>().HasMaxLength(16);
        inc.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        inc.Property(x => x.Title).HasMaxLength(200).IsRequired();
        inc.Property(x => x.Description).HasMaxLength(4000).IsRequired();
        inc.Property(x => x.ImpactDescription).HasMaxLength(2000);
        inc.Property(x => x.ReportedByUserId).HasMaxLength(128).IsRequired();
        inc.Property(x => x.AssignedToUserId).HasMaxLength(128);
        inc.Property(x => x.CustomerId).HasMaxLength(100);
        inc.Property(x => x.CustomerName).HasMaxLength(200);
        inc.Property(x => x.LinkedControlId).HasMaxLength(20);
        inc.Property(x => x.AffectedAssetIds).HasColumnType("nvarchar(max)");
        inc.HasIndex(x => x.Status);
        inc.HasIndex(x => x.Severity);
        inc.HasIndex(x => x.CustomerId);

        inc.HasMany(x => x.Actions)
           .WithOne()
           .HasForeignKey(a => a.IncidentId)
           .OnDelete(DeleteBehavior.Cascade);

        var act = mb.Entity<IncidentAction>();
        act.ToTable("IncidentActions");
        act.HasKey(x => x.Id);
        act.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        act.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        act.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        act.Property(x => x.AssignedToUserId).HasMaxLength(128).IsRequired();
        act.Property(x => x.CompletedByUserId).HasMaxLength(128);
        act.Property(x => x.Notes).HasMaxLength(2000);

        inc.OwnsOne(x => x.PostIncidentReview, pir =>
        {
            pir.Property(r => r.Summary).HasMaxLength(2000).HasColumnName("Pir_Summary");
            pir.Property(r => r.RootCause).HasMaxLength(2000).HasColumnName("Pir_RootCause");
            pir.Property(r => r.LessonsLearned).HasMaxLength(2000).HasColumnName("Pir_LessonsLearned");
            pir.Property(r => r.Recommendations).HasMaxLength(2000).HasColumnName("Pir_Recommendations");
            pir.Property(r => r.ReviewerUserId).HasMaxLength(128).HasColumnName("Pir_ReviewerUserId");
            pir.Property(r => r.ReviewedAt).HasColumnName("Pir_ReviewedAt");
        });

        mb.HasSequence<int>("IncidentSequence", schema: "dbo").StartsAt(1).IncrementsBy(1);
    }
}
