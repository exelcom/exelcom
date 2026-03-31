using GrcPlatform.CustomerPortal.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.CustomerPortal.API.Controllers;

[ApiController]
[Route("api/portal")]
public sealed class PortalController(PortalHandlers handlers) : ControllerBase
{
    // ── Public: Login ─────────────────────────────────────────────────────────

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var result = await handlers.LoginAsync(req, ct);
        if (result is null) return Unauthorized(new { message = "Invalid username or password." });
        return Ok(result);
    }

    // ── Admin: Account management ─────────────────────────────────────────────
    // These endpoints are called from the GRC admin frontend (GRC.Admin role)

    [HttpGet("accounts")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> List(CancellationToken ct)
        => Ok(await handlers.ListAccountsAsync(ct));

    [HttpGet("accounts/{id:guid}")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var account = await handlers.GetAccountAsync(id, ct);
        return account is null ? NotFound() : Ok(account);
    }

    [HttpPost("accounts")]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest req, CancellationToken ct)
    {
        try
        {
            var account = await handlers.CreateAccountAsync(req, ct);
            return CreatedAtAction(nameof(Get), new { id = account.Id }, account);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPut("accounts/{id:guid}")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccountRequest req, CancellationToken ct)
    {
        try { return Ok(await handlers.UpdateAccountAsync(id, req, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("accounts/{id:guid}/password")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        try { await handlers.ChangePasswordAsync(id, req, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("accounts/{id:guid}/activate")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        try { await handlers.SetActiveAsync(id, true, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("accounts/{id:guid}/deactivate")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        try { await handlers.SetActiveAsync(id, false, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("accounts/{id:guid}")]
    [Authorize(Roles = "GRC.Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await handlers.DeleteAccountAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
