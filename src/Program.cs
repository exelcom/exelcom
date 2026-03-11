using Azure.Identity;
using GrcPlatform.ComplianceTracking.Application.Interfaces;
using GrcPlatform.ComplianceTracking.Domain.Interfaces;
using GrcPlatform.ComplianceTracking.Infrastructure.Persistence;
using GrcPlatform.ComplianceTracking.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    var kvName = builder.Configuration["KeyVaultName"]!;
    builder.Configuration.AddAzureKeyVault(
        new Uri($"https://{kvName}.vault.azure.net/"), new DefaultAzureCredential());
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
builder.Services.AddAuthorization();
builder.Services.AddApplicationInsightsTelemetry();

builder.Services.AddDbContext<ComplianceDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("ComplianceDb")
            ?? builder.Configuration["connstr-compliancedb"],
        sql => sql.EnableRetryOnFailure(3)));

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(Assembly.Load("GrcPlatform.ComplianceTracking.Application")));

builder.Services.AddScoped<IComplianceFrameworkRepository, ComplianceFrameworkRepository>();
builder.Services.AddScoped<IComplianceControlRepository, ComplianceControlRepository>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GRC Compliance Tracking API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference
            { Type = ReferenceType.SecurityScheme, Id = "Bearer" }}, []
    }});
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
     .AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddHealthChecks().AddDbContextCheck<ComplianceDbContext>();

var app = builder.Build();

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<ComplianceDbContext>().Database.MigrateAsync();
}

app.Run();

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public string UserId => httpContextAccessor.HttpContext?.User.FindFirst("oid")?.Value
        ?? httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value ?? "anonymous";
    public string UserEmail => httpContextAccessor.HttpContext?.User.FindFirst("preferred_username")?.Value ?? string.Empty;
    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
