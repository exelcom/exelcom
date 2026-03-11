using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GrcPlatform.AuditManagement.Infrastructure.Persistence;

public class AuditDbContextFactory : IDesignTimeDbContextFactory<AuditDbContext>
{
    public AuditDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AuditDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=sql-grc-exelcom-dev.database.windows.net;Database=AuditDb;Authentication=Active Directory Default;Encrypt=True;",
            sql => sql.EnableRetryOnFailure(3));
        return new AuditDbContext(optionsBuilder.Options);
    }
}
