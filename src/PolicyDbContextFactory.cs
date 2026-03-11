using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GrcPlatform.PolicyManagement.Infrastructure.Persistence;

public class PolicyDbContextFactory : IDesignTimeDbContextFactory<PolicyDbContext>
{
    public PolicyDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<PolicyDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=sql-grc-exelcom-dev.database.windows.net;Database=PolicyDb;Authentication=Active Directory Default;Encrypt=True;",
            sql => sql.EnableRetryOnFailure(3));
        return new PolicyDbContext(optionsBuilder.Options);
    }
}
