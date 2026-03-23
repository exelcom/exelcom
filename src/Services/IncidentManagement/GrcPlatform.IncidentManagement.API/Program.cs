using System.Text.Json.Serialization;
using GrcPlatform.IncidentManagement.Application;
using GrcPlatform.IncidentManagement.Domain;
using GrcPlatform.IncidentManagement.Infrastructure;
using GrcPlatform.IncidentManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GRC – Incident Management", Version = "v1" });
});

builder.Services.AddDbContext<IncidentDbContext>(opts =>
    opts.UseSqlServer(
        builder.Configuration.GetConnectionString("IncidentDb"),
        sql => sql.MigrationsAssembly(typeof(IncidentDbContext).Assembly.FullName)));

builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();

// Register Graph email service if config is present
var graphOpts = new GraphEmailOptions
{
    TenantId     = builder.Configuration["Graph__TenantId"] ?? "",
    ClientId     = builder.Configuration["Graph__ClientId"] ?? "",
    ClientSecret = builder.Configuration["Graph__ClientSecret"] ?? "",
    SenderEmail  = builder.Configuration["Graph__SenderEmail"] ?? "",
    PortalUrl    = builder.Configuration["Graph__PortalUrl"] ?? "",
};

if (!string.IsNullOrWhiteSpace(graphOpts.TenantId) && !string.IsNullOrWhiteSpace(graphOpts.ClientSecret))
{
    builder.Services.AddSingleton(graphOpts);
    builder.Services.AddSingleton<GrcPlatform.IncidentManagement.Application.IIncidentEmailService, IncidentEmailService>();
    builder.Services.AddScoped<IncidentHandlers>(sp =>
        new IncidentHandlers(
            sp.GetRequiredService<IIncidentRepository>(),
            sp.GetRequiredService<GrcPlatform.IncidentManagement.Application.IIncidentEmailService>()));
}
else
{
    builder.Services.AddScoped<IncidentHandlers>();
}

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.MapControllers();

// Create schema directly via SQL
_ = Task.Run(async () =>
{
    await Task.Delay(3000);
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        logger.LogInformation("Initialising database schema...");
        var db = scope.ServiceProvider.GetRequiredService<IncidentDbContext>();

        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'IncidentSequence' AND schema_id = SCHEMA_ID('dbo'))
                CREATE SEQUENCE [dbo].[IncidentSequence] AS int START WITH 1 INCREMENT BY 1;
        ");

        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Incidents')
            BEGIN
                CREATE TABLE [Incidents] (
                    [Id]                  uniqueidentifier NOT NULL PRIMARY KEY,
                    [ReferenceNumber]     nvarchar(20)     NOT NULL,
                    [Type]                nvarchar(20)     NOT NULL,
                    [Severity]            nvarchar(16)     NOT NULL,
                    [Status]              nvarchar(20)     NOT NULL,
                    [Title]               nvarchar(200)    NOT NULL,
                    [Description]         nvarchar(4000)   NOT NULL,
                    [ImpactDescription]   nvarchar(2000)   NULL,
                    [OccurredAt]          datetimeoffset   NOT NULL,
                    [DetectedAt]          datetimeoffset   NULL,
                    [ContainedAt]         datetimeoffset   NULL,
                    [ResolvedAt]          datetimeoffset   NULL,
                    [ClosedAt]            datetimeoffset   NULL,
                    [ReportedByUserId]    nvarchar(128)    NOT NULL,
                    [AssignedToUserId]    nvarchar(128)    NULL,
                    [CustomerId]          nvarchar(100)    NULL,
                    [CustomerName]        nvarchar(200)    NULL,
                    [ContactEmail]        nvarchar(256)    NULL,
                    [LinkedControlId]     nvarchar(20)     NULL,
                    [AffectedAssetIds]    nvarchar(max)    NULL,
                    [Pir_Summary]         nvarchar(2000)   NULL,
                    [Pir_RootCause]       nvarchar(2000)   NULL,
                    [Pir_LessonsLearned]  nvarchar(2000)   NULL,
                    [Pir_Recommendations] nvarchar(2000)   NULL,
                    [Pir_ReviewerUserId]  nvarchar(128)    NULL,
                    [Pir_ReviewedAt]      datetimeoffset   NULL,
                    [CreatedAt]           datetimeoffset   NOT NULL,
                    [UpdatedAt]           datetimeoffset   NOT NULL
                );
                CREATE UNIQUE INDEX [IX_Incidents_ReferenceNumber] ON [Incidents] ([ReferenceNumber]);
                CREATE INDEX [IX_Incidents_Status]     ON [Incidents] ([Status]);
                CREATE INDEX [IX_Incidents_Severity]   ON [Incidents] ([Severity]);
                CREATE INDEX [IX_Incidents_CustomerId] ON [Incidents] ([CustomerId]);
            END
        ");

        // Add ContactEmail column if table existed before this update
        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Incidents' AND COLUMN_NAME = 'ContactEmail'
            )
            BEGIN
                ALTER TABLE [Incidents] ADD [ContactEmail] nvarchar(256) NULL;
            END
        ");

        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'IncidentActions')
            BEGIN
                CREATE TABLE [IncidentActions] (
                    [Id]                uniqueidentifier NOT NULL PRIMARY KEY,
                    [IncidentId]        uniqueidentifier NOT NULL,
                    [Type]              nvarchar(20)     NOT NULL,
                    [Description]       nvarchar(2000)   NOT NULL,
                    [AssignedToUserId]  nvarchar(128)    NOT NULL,
                    [Status]            nvarchar(20)     NOT NULL,
                    [DueDate]           datetimeoffset   NULL,
                    [CompletedAt]       datetimeoffset   NULL,
                    [CompletedByUserId] nvarchar(128)    NULL,
                    [Notes]             nvarchar(2000)   NULL,
                    CONSTRAINT [FK_IncidentActions_Incidents] FOREIGN KEY ([IncidentId])
                        REFERENCES [Incidents]([Id]) ON DELETE CASCADE
                );
                CREATE INDEX [IX_IncidentActions_IncidentId] ON [IncidentActions] ([IncidentId]);
            END
        ");

        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '__EFMigrationsHistory')
                CREATE TABLE [__EFMigrationsHistory] ([MigrationId] nvarchar(150) NOT NULL PRIMARY KEY, [ProductVersion] nvarchar(32) NOT NULL);
            IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260319000000_InitialCreate')
                INSERT INTO [__EFMigrationsHistory] VALUES ('20260319000000_InitialCreate', '8.0.11');
        ");

        logger.LogInformation("Database schema initialised successfully.");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "Database schema initialisation FAILED.");
    }
});

app.Run();
