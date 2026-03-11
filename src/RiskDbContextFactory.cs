using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GrcPlatform.RiskManagement.Infrastructure.Persistence;

public class RiskDbContextFactory : IDesignTimeDbContextFactory<RiskDbContext>
{
    public RiskDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RiskDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=sql-grc-exelcom-dev.database.windows.net;Database=RiskDb;Authentication=Active Directory Default;Encrypt=True;",
            sql => sql.EnableRetryOnFailure(3));
        return new RiskDbContext(optionsBuilder.Options);
    }
}
