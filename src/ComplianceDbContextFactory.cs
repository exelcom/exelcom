using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GrcPlatform.ComplianceTracking.Infrastructure.Persistence;

public class ComplianceDbContextFactory : IDesignTimeDbContextFactory<ComplianceDbContext>
{
    public ComplianceDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ComplianceDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=sql-grc-exelcom-dev.database.windows.net;Database=ComplianceDb;Authentication=Active Directory Default;Encrypt=True;",
            sql => sql.EnableRetryOnFailure(3));
        return new ComplianceDbContext(optionsBuilder.Options);
    }
}
