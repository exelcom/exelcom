using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace GrcPlatform.ComplianceTracking.Infrastructure.Persistence;
public class ComplianceDbContextFactory : IDesignTimeDbContextFactory<ComplianceDbContext>
{
    public ComplianceDbContext CreateDbContext(string[] args)
    { var o=new DbContextOptionsBuilder<ComplianceDbContext>(); o.UseSqlServer("Server=sql-grc-exelcom-dev.database.windows.net;Database=ComplianceDb;Authentication=Active Directory Default;Encrypt=True;"); return new ComplianceDbContext(o.Options); }
}
