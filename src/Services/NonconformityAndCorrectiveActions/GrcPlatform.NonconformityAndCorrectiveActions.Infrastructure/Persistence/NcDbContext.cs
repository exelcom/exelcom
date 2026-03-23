using GrcPlatform.NonconformityAndCorrectiveActions.Domain;
using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace GrcPlatform.NonconformityAndCorrectiveActions.Infrastructure.Persistence;

public sealed class NcDbContext(DbContextOptions<NcDbContext> options) : DbContext(options)
{
    public DbSet<Nonconformity> Nonconformities => Set<Nonconformity>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        var nc = mb.Entity<Nonconformity>();
        nc.ToTable("Nonconformities");
        nc.HasKey(x => x.Id);

        nc.Property(x => x.ReferenceNumber).HasMaxLength(20).IsRequired();
        nc.HasIndex(x => x.ReferenceNumber).IsUnique();

        nc.Property(x => x.Source).HasConversion<string>().HasMaxLength(40);
        nc.Property(x => x.Severity).HasConversion<string>().HasMaxLength(16);
        nc.Property(x => x.Status).HasConversion<string>().HasMaxLength(40);
        nc.Property(x => x.ClauseReference).HasMaxLength(20);
        nc.Property(x => x.Title).HasMaxLength(200).IsRequired();
        nc.Property(x => x.Description).HasMaxLength(4000).IsRequired();
        nc.Property(x => x.EvidenceReference).HasMaxLength(512);
        nc.Property(x => x.RaisedByUserId).HasMaxLength(128).IsRequired();

        // ── Corrective Actions ────────────────────────────────────────────────
        nc.HasMany(x => x.CorrectiveActions)
          .WithOne()
          .HasForeignKey(c => c.NonconformityId)
          .OnDelete(DeleteBehavior.Cascade);

        var ca = mb.Entity<CorrectiveAction>();
        ca.ToTable("CorrectiveActions");
        ca.HasKey(x => x.Id);
        ca.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        ca.Property(x => x.OwnerUserId).HasMaxLength(128).IsRequired();
        ca.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        ca.Property(x => x.ImplementedByUserId).HasMaxLength(128);

        // ── Root-Cause Analysis (owned, same table as NC) ─────────────────────
        nc.OwnsOne(x => x.RootCauseAnalysis, rca =>
        {
            rca.Property(r => r.Method).HasConversion<string>().HasMaxLength(20)
               .HasColumnName("Rca_Method");
            rca.Property(r => r.CauseCategory).HasConversion<string>().HasMaxLength(20)
               .HasColumnName("Rca_CauseCategory");
            rca.Property(r => r.CauseDescription).HasMaxLength(4000)
               .HasColumnName("Rca_CauseDescription");
            rca.Property(r => r.AnalystUserId).HasMaxLength(128)
               .HasColumnName("Rca_AnalystUserId");
            rca.Property(r => r.CompletedAt).HasColumnName("Rca_CompletedAt");

            // Store FiveWhys as a JSON array column
            rca.Property(r => r.FiveWhys)
               .HasColumnName("Rca_FiveWhys")
               .HasColumnType("nvarchar(max)")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                   v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? Array.Empty<string>(),
                   new ValueComparer<string[]>(
                       (a, b) => a != null && b != null && a.SequenceEqual(b),
                       v => v.Aggregate(0, (a, s) => HashCode.Combine(a, s.GetHashCode())),
                       v => v.ToArray()));
        });

        // ── Effectiveness Review (owned, same table as NC) ────────────────────
        nc.OwnsOne(x => x.EffectivenessReview, er =>
        {
            er.Property(e => e.ReviewNotes).HasMaxLength(4000).HasColumnName("Er_ReviewNotes");
            er.Property(e => e.ReviewerUserId).HasMaxLength(128).HasColumnName("Er_ReviewerUserId");
            er.Property(e => e.ReviewedAt).HasColumnName("Er_ReviewedAt");
            er.Property(e => e.IsEffective).HasColumnName("Er_IsEffective");
        });

        // ── Reference number sequence ─────────────────────────────────────────
        mb.HasSequence<int>("NcSequence", schema: "dbo")
          .StartsAt(1)
          .IncrementsBy(1);
    }
}
