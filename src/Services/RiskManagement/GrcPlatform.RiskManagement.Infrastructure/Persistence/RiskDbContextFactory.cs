using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace GrcPlatform.RiskManagement.Infrastructure.Persistence;
public class RiskDbContextFactory : IDesignTimeDbContextFactory<RiskDbContext>
{
    public RiskDbContext CreateDbContext(string[] args)
    {
        var o = new DbContextOptionsBuilder<RiskDbContext>();
        o.UseSqlServer("Server=sql-grc-exelcom-dev.database.windows.net;Database=RiskDb;Authentication=Active Directory Default;Encrypt=True;");
        return new RiskDbContext(o.Options);
    }
}
