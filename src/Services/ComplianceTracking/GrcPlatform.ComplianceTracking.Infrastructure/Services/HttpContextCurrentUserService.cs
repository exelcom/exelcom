using GrcPlatform.ComplianceTracking.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace GrcPlatform.ComplianceTracking.Infrastructure.Services;

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

    public bool IsAuthenticated =>
        httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
