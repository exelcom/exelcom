using System.Text.Json.Serialization;
using GrcPlatform.AssetInventory.Application;
using GrcPlatform.AssetInventory.Domain;
using GrcPlatform.AssetInventory.Infrastructure;
using GrcPlatform.AssetInventory.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GRC – Asset Inventory", Version = "v1" });
});

builder.Services.AddDbContext<AssetDbContext>(opts =>
    opts.UseSqlServer(
        builder.Configuration.GetConnectionString("AssetDb"),
        sql => sql.MigrationsAssembly(typeof(AssetDbContext).Assembly.FullName)));

builder.Services.AddScoped<IAssetRepository, AssetRepository>();
builder.Services.AddScoped<AssetHandlers>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.MapControllers();

// Run migration in background after app starts
_ = Task.Run(async () =>
{
    await Task.Delay(3000);
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("Startup");
    try
    {
        logger.LogInformation("Running EF Core migrations (background)...");
        var db = scope.ServiceProvider.GetRequiredService<AssetDbContext>();

        await db.Database.EnsureCreatedAsync();

        // Clear stale migration history if tables missing
        try
        {
            await db.Database.ExecuteSqlRawAsync(@"
                IF OBJECT_ID('__EFMigrationsHistory') IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Assets')
                    DELETE FROM [__EFMigrationsHistory]
                    WHERE [MigrationId] = '20260317000000_InitialCreate'
            ");
        }
        catch { }

        // Ensure CustomerId / CustomerName columns exist (idempotent)
        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'CustomerId'
            )
            BEGIN
                ALTER TABLE [Assets] ADD [CustomerId] nvarchar(100) NULL;
                ALTER TABLE [Assets] ADD [CustomerName] nvarchar(200) NULL;
                CREATE INDEX [IX_Assets_CustomerId] ON [Assets] ([CustomerId]);
            END
        ");

        await db.Database.MigrateAsync();
        logger.LogInformation("EF Core migrations completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "EF Core migration FAILED.");
    }
});

app.Run();
