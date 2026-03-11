using GrcPlatform.PolicyManagement.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace GrcPlatform.PolicyManagement.Infrastructure.Services;

public class HttpContextCurrentUserService(IHttpContextAccessor httpContextAccessor)
    : ICurrentUserService
{
    public string? UserId =>
        httpContextAccessor.HttpContext?.User?.FindFirst("oid")?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value
        ?? httpContextAccessor.HttpContext?.User?.Identity?.Name
        ?? "system";
}
