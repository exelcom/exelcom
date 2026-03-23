using GrcPlatform.StatementOfApplicability.Application;
using GrcPlatform.StatementOfApplicability.Domain.Interfaces;
using GrcPlatform.StatementOfApplicability.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Text.Json.Serialization;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
builder.Services.AddAuthorization();
builder.Services.AddApplicationInsightsTelemetry();
var connStr = builder.Configuration.GetConnectionString("SoaDb") ?? builder.Configuration["ConnectionStrings__SoaDb"];
builder.Services.AddDbContext<SoaDbContext>(o => o.UseSqlServer(connStr, s => s.EnableRetryOnFailure(3)));
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.Load("GrcPlatform.StatementOfApplicability.Application")));
builder.Services.AddScoped<ISoaRepository, SoaRepository>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GRC Statement of Applicability API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {{ new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }}, [] }});
});
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<SoaDbContext>();
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
{
    public string UserId => h.HttpContext?.User.FindFirst("oid")?.Value ?? h.HttpContext?.User.FindFirst("sub")?.Value ?? "anonymous";
    public string UserEmail => h.HttpContext?.User.FindFirst("preferred_username")?.Value ?? string.Empty;
    public bool IsAuthenticated => h.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
