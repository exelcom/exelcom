using Azure.Identity;
using GrcPlatform.RiskManagement.Application.Interfaces;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using GrcPlatform.RiskManagement.Infrastructure.Persistence;
using GrcPlatform.RiskManagement.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using System.Reflection;
var builder = WebApplication.CreateBuilder(args);
var kvName = builder.Configuration["KeyVaultName"];
if (!string.IsNullOrWhiteSpace(kvName)) {
    builder.Configuration.AddAzureKeyVault(new Uri($"https://{kvName}.vault.azure.net/"), new DefaultAzureCredential());
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
builder.Services.AddAuthorization();
builder.Services.AddApplicationInsightsTelemetry();
var connStr = builder.Configuration.GetConnectionString("RiskDb") ?? builder.Configuration["ConnectionStrings__RiskDb"];
builder.Services.AddDbContext<RiskDbContext>(o => o.UseSqlServer(connStr, s => s.EnableRetryOnFailure(3)));
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.Load("GrcPlatform.RiskManagement.Application")));
builder.Services.AddScoped<IRiskRepository, RiskRepository>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => { c.SwaggerDoc("v1", new OpenApiInfo { Title = "GRC Risk Management API", Version = "v1" }); c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" }); c.AddSecurityRequirement(new OpenApiSecurityRequirement {{ new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }}, [] }}); });
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.Run();
public class CurrentUserService(IHttpContextAccessor h) : ICurrentUserService
{ public string UserId => h.HttpContext?.User.FindFirst("oid")?.Value ?? h.HttpContext?.User.FindFirst("sub")?.Value ?? "anonymous"; public string UserEmail => h.HttpContext?.User.FindFirst("preferred_username")?.Value ?? string.Empty; public bool IsAuthenticated => h.HttpContext?.User.Identity?.IsAuthenticated ?? false; }

