using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrcPlatform.AssetInventory.Infrastructure.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder mb)
    {
        mb.CreateTable(
            name: "Assets",
            columns: table => new
            {
                Id               = table.Column<Guid>(nullable: false),
                Name             = table.Column<string>(maxLength: 200, nullable: false),
                Type             = table.Column<string>(maxLength: 30, nullable: false),
                Description      = table.Column<string>(maxLength: 2000, nullable: true),
                Status           = table.Column<string>(maxLength: 20, nullable: false),
                RiskRating       = table.Column<string>(maxLength: 16, nullable: false),
                OwnerUserId      = table.Column<string>(maxLength: 128, nullable: false),
                CustodianUserId  = table.Column<string>(maxLength: 128, nullable: true),
                CreatedByUserId  = table.Column<string>(maxLength: 128, nullable: false),
                Location         = table.Column<string>(maxLength: 200, nullable: true),
                SerialNumber     = table.Column<string>(maxLength: 100, nullable: true),
                Manufacturer     = table.Column<string>(maxLength: 100, nullable: true),
                Model            = table.Column<string>(maxLength: 100, nullable: true),
                Version          = table.Column<string>(maxLength: 50, nullable: true),
                LinkedControlId  = table.Column<string>(maxLength: 20, nullable: true),
                PurchaseDate     = table.Column<DateTimeOffset>(nullable: true),
                ExpiryDate       = table.Column<DateTimeOffset>(nullable: true),
                RetiredAt        = table.Column<DateTimeOffset>(nullable: true),
                CreatedAt        = table.Column<DateTimeOffset>(nullable: false),
                UpdatedAt        = table.Column<DateTimeOffset>(nullable: false),
            },
            constraints: table => table.PrimaryKey("PK_Assets", x => x.Id));

        mb.CreateIndex("IX_Assets_Type",       "Assets", "Type");
        mb.CreateIndex("IX_Assets_Status",     "Assets", "Status");
        mb.CreateIndex("IX_Assets_RiskRating", "Assets", "RiskRating");
        mb.CreateIndex("IX_Assets_OwnerUserId","Assets", "OwnerUserId");
    }

    protected override void Down(MigrationBuilder mb)
        => mb.DropTable(name: "Assets");
}
