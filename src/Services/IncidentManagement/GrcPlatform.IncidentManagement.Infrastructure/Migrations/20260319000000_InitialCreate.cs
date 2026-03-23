using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrcPlatform.IncidentManagement.Infrastructure.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder mb)
    {
        mb.Sql(@"
            IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'IncidentSequence' AND schema_id = SCHEMA_ID('dbo'))
                CREATE SEQUENCE [dbo].[IncidentSequence] AS int START WITH 1 INCREMENT BY 1;
        ");

        mb.CreateTable(
            name: "Incidents",
            columns: table => new
            {
                Id                  = table.Column<Guid>(nullable: false),
                ReferenceNumber     = table.Column<string>(maxLength: 20, nullable: false),
                Type                = table.Column<string>(maxLength: 20, nullable: false),
                Severity            = table.Column<string>(maxLength: 16, nullable: false),
                Status              = table.Column<string>(maxLength: 20, nullable: false),
                Title               = table.Column<string>(maxLength: 200, nullable: false),
                Description         = table.Column<string>(maxLength: 4000, nullable: false),
                ImpactDescription   = table.Column<string>(maxLength: 2000, nullable: true),
                OccurredAt          = table.Column<DateTimeOffset>(nullable: false),
                DetectedAt          = table.Column<DateTimeOffset>(nullable: true),
                ContainedAt         = table.Column<DateTimeOffset>(nullable: true),
                ResolvedAt          = table.Column<DateTimeOffset>(nullable: true),
                ClosedAt            = table.Column<DateTimeOffset>(nullable: true),
                ReportedByUserId    = table.Column<string>(maxLength: 128, nullable: false),
                AssignedToUserId    = table.Column<string>(maxLength: 128, nullable: true),
                CustomerId          = table.Column<string>(maxLength: 100, nullable: true),
                CustomerName        = table.Column<string>(maxLength: 200, nullable: true),
                LinkedControlId     = table.Column<string>(maxLength: 20, nullable: true),
                AffectedAssetIds    = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Pir_Summary         = table.Column<string>(maxLength: 2000, nullable: true),
                Pir_RootCause       = table.Column<string>(maxLength: 2000, nullable: true),
                Pir_LessonsLearned  = table.Column<string>(maxLength: 2000, nullable: true),
                Pir_Recommendations = table.Column<string>(maxLength: 2000, nullable: true),
                Pir_ReviewerUserId  = table.Column<string>(maxLength: 128, nullable: true),
                Pir_ReviewedAt      = table.Column<DateTimeOffset>(nullable: true),
                CreatedAt           = table.Column<DateTimeOffset>(nullable: false),
                UpdatedAt           = table.Column<DateTimeOffset>(nullable: false),
            },
            constraints: table => { table.PrimaryKey("PK_Incidents", x => x.Id); });

        mb.CreateIndex("IX_Incidents_ReferenceNumber", "Incidents", "ReferenceNumber", unique: true);
        mb.CreateIndex("IX_Incidents_Status",     "Incidents", "Status");
        mb.CreateIndex("IX_Incidents_Severity",   "Incidents", "Severity");
        mb.CreateIndex("IX_Incidents_CustomerId", "Incidents", "CustomerId");

        mb.CreateTable(
            name: "IncidentActions",
            columns: table => new
            {
                Id                = table.Column<Guid>(nullable: false),
                IncidentId        = table.Column<Guid>(nullable: false),
                Type              = table.Column<string>(maxLength: 20, nullable: false),
                Description       = table.Column<string>(maxLength: 2000, nullable: false),
                AssignedToUserId  = table.Column<string>(maxLength: 128, nullable: false),
                Status            = table.Column<string>(maxLength: 20, nullable: false),
                DueDate           = table.Column<DateTimeOffset>(nullable: true),
                CompletedAt       = table.Column<DateTimeOffset>(nullable: true),
                CompletedByUserId = table.Column<string>(maxLength: 128, nullable: true),
                Notes             = table.Column<string>(maxLength: 2000, nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_IncidentActions", x => x.Id);
                table.ForeignKey("FK_IncidentActions_Incidents_IncidentId", x => x.IncidentId,
                    "Incidents", "Id", onDelete: ReferentialAction.Cascade);
            });

        mb.CreateIndex("IX_IncidentActions_IncidentId", "IncidentActions", "IncidentId");
    }

    protected override void Down(MigrationBuilder mb)
    {
        mb.DropTable("IncidentActions");
        mb.DropTable("Incidents");
        mb.Sql("DROP SEQUENCE IF EXISTS [dbo].[IncidentSequence]");
    }
}
