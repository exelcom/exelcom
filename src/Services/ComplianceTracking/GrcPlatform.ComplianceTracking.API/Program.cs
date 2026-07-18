using Azure.Identity;
using GrcPlatform.ComplianceTracking.Application.Compliance.Commands;
using GrcPlatform.ComplianceTracking.Application.Interfaces;
using GrcPlatform.ComplianceTracking.Domain.Interfaces;
using GrcPlatform.ComplianceTracking.Infrastructure.Persistence;
using GrcPlatform.ComplianceTracking.Infrastructure.Repositories;
using GrcPlatform.ComplianceTracking.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var kvName = builder.Configuration["KeyVaultName"];
if (!string.IsNullOrWhiteSpace(kvName))
    builder.Configuration.AddAzureKeyVault(new Uri($"https://{kvName}.vault.azure.net/"), new DefaultAzureCredential());

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"https://login.microsoftonline.com/{builder.Configuration["AzureAd__TenantId"]}/v2.0";
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidAudience = builder.Configuration["AzureAd__Audience"]
        };
    });
builder.Services.AddAuthorization();

var connStr = builder.Configuration.GetConnectionString("ComplianceDb")
    ?? builder.Configuration["ConnectionStrings__ComplianceDb"];
builder.Services.AddDbContext<ComplianceDbContext>(o =>
    o.UseSqlServer(connStr, s => s.EnableRetryOnFailure(3)));

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(CreateFrameworkCommand).Assembly));

builder.Services.AddScoped<IComplianceFrameworkRepository, ComplianceFrameworkRepository>();
builder.Services.AddScoped<IComplianceControlRepository, ComplianceControlRepository>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, HttpContextCurrentUserService>();

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GRC Compliance Tracking API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }},
        []
    }});
});

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



