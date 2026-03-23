using GrcPlatform.AssetInventory.Domain;
using GrcPlatform.AssetInventory.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GrcPlatform.AssetInventory.Infrastructure.Persistence;

public sealed class AssetDbContext(DbContextOptions<AssetDbContext> options) : DbContext(options)
{
    public DbSet<Asset> Assets => Set<Asset>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        var a = mb.Entity<Asset>();
        a.ToTable("Assets");
        a.HasKey(x => x.Id);

        a.Property(x => x.Name).HasMaxLength(200).IsRequired();
        a.Property(x => x.Description).HasMaxLength(2000);
        a.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
        a.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        a.Property(x => x.RiskRating).HasConversion<string>().HasMaxLength(16);
        a.Property(x => x.OwnerUserId).HasMaxLength(128).IsRequired();
        a.Property(x => x.CustodianUserId).HasMaxLength(128);
        a.Property(x => x.CreatedByUserId).HasMaxLength(128).IsRequired();
        a.Property(x => x.Location).HasMaxLength(200);
        a.Property(x => x.SerialNumber).HasMaxLength(100);
        a.Property(x => x.Manufacturer).HasMaxLength(100);
        a.Property(x => x.Model).HasMaxLength(100);
        a.Property(x => x.Version).HasMaxLength(50);
        a.Property(x => x.LinkedControlId).HasMaxLength(20);
        a.Property(x => x.CustomerId).HasMaxLength(100);
        a.Property(x => x.CustomerName).HasMaxLength(200);

        a.HasIndex(x => x.Type);
        a.HasIndex(x => x.Status);
        a.HasIndex(x => x.RiskRating);
        a.HasIndex(x => x.OwnerUserId);
        a.HasIndex(x => x.CustomerId);
    }
}
