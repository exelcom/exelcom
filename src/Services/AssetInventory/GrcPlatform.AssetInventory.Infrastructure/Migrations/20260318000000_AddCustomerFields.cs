using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrcPlatform.AssetInventory.Infrastructure.Migrations;

public partial class AddCustomerFields : Migration
{
    protected override void Up(MigrationBuilder mb)
    {
        mb.AddColumn<string>(
            name: "CustomerId",
            table: "Assets",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: true);

        mb.AddColumn<string>(
            name: "CustomerName",
            table: "Assets",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: true);

        mb.CreateIndex(
            name: "IX_Assets_CustomerId",
            table: "Assets",
            column: "CustomerId");
    }

    protected override void Down(MigrationBuilder mb)
    {
        mb.DropIndex(name: "IX_Assets_CustomerId", table: "Assets");
        mb.DropColumn(name: "CustomerId", table: "Assets");
        mb.DropColumn(name: "CustomerName", table: "Assets");
    }
}
