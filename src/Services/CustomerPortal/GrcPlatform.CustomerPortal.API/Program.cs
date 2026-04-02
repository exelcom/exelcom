using System.Text;
using System.Text.Json.Serialization;
using GrcPlatform.CustomerPortal.Application;
using GrcPlatform.CustomerPortal.Domain;
using GrcPlatform.CustomerPortal.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "GRC – Customer Portal", Version = "v1" }));

builder.Services.AddDbContext<PortalDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("PortalDb")));

builder.Services.AddScoped<IPortalAccountRepository, PortalRepository>();

// JWT options
var jwtOpts = new JwtOptions
{
    Secret   = builder.Configuration["Jwt:Secret"] ?? builder.Configuration["Jwt__Secret"] ?? "",
    Issuer   = builder.Configuration["Jwt:Issuer"] ?? "grc-platform",
    Audience = builder.Configuration["Jwt:Audience"] ?? "grc-customer-portal",
    ExpiryHours = int.TryParse(builder.Configuration["Jwt:ExpiryHours"], out var h) ? h : 8,
};
builder.Services.AddSingleton(jwtOpts);
builder.Services.AddScoped<PortalHandlers>();

// JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidIssuer              = jwtOpts.Issuer,
            ValidateAudience         = true,
            ValidAudience            = jwtOpts.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOpts.Secret)),
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.FromMinutes(5),
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(_ => true)
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Schema initialisation
_ = Task.Run(async () =>
{
    await Task.Delay(3000);
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<PortalDbContext>();
        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PortalAccounts')
            BEGIN
                CREATE TABLE [PortalAccounts] (
                    [Id]                    uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
                    [Username]              nvarchar(100)    NOT NULL,
                    [PasswordHash]          nvarchar(200)    NOT NULL,
                    [CrmCustomerId]         nvarchar(100)    NOT NULL,
                    [GrcCustomerId]         nvarchar(100)    NOT NULL,
                    [CustomerName]          nvarchar(200)    NOT NULL,
                    [ParentGrcCustomerId]   nvarchar(100)    NULL,
                    [IsActive]              bit              NOT NULL DEFAULT 1,
                    [CreatedAt]             datetimeoffset   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                    [UpdatedAt]             datetimeoffset   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                    [LastLoginAt]           datetimeoffset   NULL
                );
                CREATE UNIQUE INDEX [IX_PortalAccounts_Username]      ON [PortalAccounts] ([Username]);
                CREATE INDEX        [IX_PortalAccounts_GrcCustomerId]  ON [PortalAccounts] ([GrcCustomerId]);
                CREATE INDEX        [IX_PortalAccounts_Parent]         ON [PortalAccounts] ([ParentGrcCustomerId]);
            END
        ");
        logger.LogInformation("PortalAccounts schema ready.");
    }
    catch (Exception ex) { logger.LogCritical(ex, "Schema init failed."); }
});

app.Run();


