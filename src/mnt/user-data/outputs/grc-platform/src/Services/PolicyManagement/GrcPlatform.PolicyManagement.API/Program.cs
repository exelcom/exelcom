using Azure.Identity;
using GrcPlatform.PolicyManagement.Application.Policies.Commands;
using GrcPlatform.PolicyManagement.Domain.Interfaces;
using GrcPlatform.PolicyManagement.Infrastructure.Persistence;
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

builder.Services.AddDbContext<PolicyDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("PolicyDb")
            ?? builder.Configuration["connstr-policydb"],
        sql => sql.EnableRetryOnFailure(3)));

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(Assembly.Load("GrcPlatform.PolicyManagement.Application")));

builder.Services.AddScoped<IPolicyRepository, PolicyRepository>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GRC Policy Management API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{ new OpenApiSecurityScheme { Reference = new OpenApiReference
        { Type = ReferenceType.SecurityScheme, Id = "Bearer" }}, [] }});
});
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
     .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<PolicyDbContext>();

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
    await scope.ServiceProvider.GetRequiredService<PolicyDbContext>().Database.MigrateAsync();
}
app.Run();

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public string UserId => httpContextAccessor.HttpContext?.User.FindFirst("oid")?.Value ?? "anonymous";
    public string UserEmail => httpContextAccessor.HttpContext?.User.FindFirst("preferred_username")?.Value ?? string.Empty;
}
