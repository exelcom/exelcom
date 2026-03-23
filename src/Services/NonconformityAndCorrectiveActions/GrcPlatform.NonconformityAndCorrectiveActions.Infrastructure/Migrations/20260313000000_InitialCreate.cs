using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrcPlatform.NonconformityAndCorrectiveActions.Infrastructure.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Reference number sequence
        migrationBuilder.CreateSequence<int>(
            name: "NcSequence",
            schema: "dbo");

        // Main NC table (includes owned RCA and EffectivenessReview columns)
        migrationBuilder.CreateTable(
            name: "Nonconformities",
            columns: table => new
            {
                Id                  = table.Column<Guid>(nullable: false),
                ReferenceNumber     = table.Column<string>(maxLength: 20, nullable: false),
                Source              = table.Column<string>(maxLength: 40, nullable: false),
                ClauseReference     = table.Column<string>(maxLength: 20, nullable: true),
                Severity            = table.Column<string>(maxLength: 16, nullable: false),
                Title               = table.Column<string>(maxLength: 200, nullable: false),
                Description         = table.Column<string>(maxLength: 4000, nullable: false),
                EvidenceReference   = table.Column<string>(maxLength: 512, nullable: true),
                RaisedByUserId      = table.Column<string>(maxLength: 128, nullable: false),
                RaisedAt            = table.Column<DateTimeOffset>(nullable: false),
                Status              = table.Column<string>(maxLength: 40, nullable: false),
                UpdatedAt           = table.Column<DateTimeOffset>(nullable: false),
                // Owned: RootCauseAnalysis
                Rca_Method          = table.Column<string>(maxLength: 20, nullable: true),
                Rca_CauseCategory   = table.Column<string>(maxLength: 20, nullable: true),
                Rca_CauseDescription= table.Column<string>(maxLength: 4000, nullable: true),
                Rca_FiveWhys        = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Rca_AnalystUserId   = table.Column<string>(maxLength: 128, nullable: true),
                Rca_CompletedAt     = table.Column<DateTimeOffset>(nullable: true),
                // Owned: EffectivenessReview
                Er_IsEffective      = table.Column<bool>(nullable: true),
                Er_ReviewNotes      = table.Column<string>(maxLength: 4000, nullable: true),
                Er_ReviewerUserId   = table.Column<string>(maxLength: 128, nullable: true),
                Er_ReviewedAt       = table.Column<DateTimeOffset>(nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Nonconformities", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Nonconformities_ReferenceNumber",
            table: "Nonconformities",
            column: "ReferenceNumber",
            unique: true);

        // Corrective actions child table
        migrationBuilder.CreateTable(
            name: "CorrectiveActions",
            columns: table => new
            {
                Id                  = table.Column<Guid>(nullable: false),
                NonconformityId     = table.Column<Guid>(nullable: false),
                Description         = table.Column<string>(maxLength: 2000, nullable: false),
                OwnerUserId         = table.Column<string>(maxLength: 128, nullable: false),
                DueDate             = table.Column<DateTimeOffset>(nullable: false),
                Status              = table.Column<string>(maxLength: 20, nullable: false),
                ImplementedAt       = table.Column<DateTimeOffset>(nullable: true),
                ImplementedByUserId = table.Column<string>(maxLength: 128, nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CorrectiveActions", x => x.Id);
                table.ForeignKey(
                    name: "FK_CorrectiveActions_Nonconformities_NonconformityId",
                    column: x => x.NonconformityId,
                    principalTable: "Nonconformities",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CorrectiveActions_NonconformityId",
            table: "CorrectiveActions",
            column: "NonconformityId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CorrectiveActions");
        migrationBuilder.DropTable(name: "Nonconformities");
        migrationBuilder.DropSequence(name: "NcSequence", schema: "dbo");
    }
}
