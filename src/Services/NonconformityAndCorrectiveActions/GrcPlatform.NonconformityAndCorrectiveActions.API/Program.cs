using System.Text.Json.Serialization;
using GrcPlatform.NonconformityAndCorrectiveActions.Application;
using GrcPlatform.NonconformityAndCorrectiveActions.Domain;
using GrcPlatform.NonconformityAndCorrectiveActions.Infrastructure;
using GrcPlatform.NonconformityAndCorrectiveActions.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GRC – Nonconformity & Corrective Actions", Version = "v1" });
});

builder.Services.AddDbContext<NcDbContext>(opts =>
    opts.UseSqlServer(
        builder.Configuration.GetConnectionString("NcDb"),
        sql => sql.MigrationsAssembly(
            typeof(NcDbContext).Assembly.FullName)));

builder.Services.AddScoped<INonconformityRepository, NcRepository>();
builder.Services.AddScoped<NcHandlers>();

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("Startup");
    try
    {
        logger.LogInformation("Running EF Core migrations...");
        var db = scope.ServiceProvider.GetRequiredService<NcDbContext>();

        // If migration is recorded as applied but Nonconformities table is missing,
        // delete the stale history record so EF re-runs it on a fresh database.
        await db.Database.ExecuteSqlRawAsync(@"
            IF OBJECT_ID('__EFMigrationsHistory') IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Nonconformities')
                DELETE FROM [__EFMigrationsHistory]
                WHERE [MigrationId] = '20260313000000_InitialCreate'
        ");

        await db.Database.MigrateAsync();

        // Ensure NcSequence exists — may be missing if migration ran against a partially
        // initialised database where the sequence DDL was skipped.
        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (
                SELECT 1 FROM sys.sequences
                WHERE name = 'NcSequence' AND schema_id = SCHEMA_ID('dbo')
            )
            BEGIN
                CREATE SEQUENCE [dbo].[NcSequence] AS int START WITH 1 INCREMENT BY 1;
            END
        ");

        logger.LogInformation("EF Core migrations completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "EF Core migration FAILED.");
        throw;
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.MapControllers();
app.Run();
