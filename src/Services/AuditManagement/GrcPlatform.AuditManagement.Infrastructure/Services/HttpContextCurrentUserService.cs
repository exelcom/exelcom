using GrcPlatform.AuditManagement.Application.Audits.Commands;
using Microsoft.AspNetCore.Http;

namespace GrcPlatform.AuditManagement.Infrastructure.Services;

public class HttpContextCurrentUserService(IHttpContextAccessor httpContextAccessor)
    : ICurrentUserService
{
    public string UserId =>
        httpContextAccessor.HttpContext?.User?.FindFirst("oid")?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value
        ?? httpContextAccessor.HttpContext?.User?.Identity?.Name
        ?? "system";

    public string UserEmail =>
        httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("preferred_username")?.Value
        ?? "system@grc.local";
}
