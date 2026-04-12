using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GrcPlatform.CustomerPortal.Application;

namespace GrcPlatform.CustomerPortal.API.Controllers;

[ApiController]
[Route("api/portal")]
public class PortalController : ControllerBase
{
    private readonly PortalHandlers handlers;
    private readonly IHttpClientFactory httpClientFactory;
    private readonly IConfiguration config;

    public PortalController(PortalHandlers handlers, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        this.handlers = handlers;
        this.httpClientFactory = httpClientFactory;
        this.config = config;
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        try
        {
            var result = await handlers.LoginAsync(req, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }
    }

    // ── Accounts (admin) ──────────────────────────────────────────────────────
    [HttpGet("accounts")]
    [AllowAnonymous]
    public async Task<IActionResult> List(CancellationToken ct)
        => Ok(await handlers.ListAccountsAsync(ct));

    [HttpGet("accounts/{id:guid}")]
    [AllowAnonymous]
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
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("accounts/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccountRequest req, CancellationToken ct)
    {
        await handlers.UpdateAccountAsync(id, req, ct);
        return NoContent();
    }

    [HttpPost("accounts/{id:guid}/password")]
    [AllowAnonymous]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        await handlers.ChangePasswordAsync(id, req, ct);
        return NoContent();
    }

    [HttpPatch("accounts/{id:guid}/active")]
    [AllowAnonymous]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest req, CancellationToken ct)
    {
        await handlers.SetActiveAsync(id, req.IsActive, ct);
        return NoContent();
    }

    [HttpDelete("accounts/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await handlers.DeleteAccountAsync(id, ct);
        return NoContent();
    }

    // ── MFA ──────────────────────────────────────────────────────────────────
    [HttpPost("mfa/setup/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> MfaSetup(Guid id, CancellationToken ct)
    {
        var result = await handlers.SetupMfaAsync(id, ct);
        return Ok(result);
    }

    [HttpPost("mfa/verify/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> MfaVerify(Guid id, [FromBody] MfaVerifyRequest req, CancellationToken ct)
    {
        var success = await handlers.VerifyAndEnableMfaAsync(id, req.Code, ct);
        return success ? Ok(new { message = "MFA enabled successfully" }) : BadRequest(new { message = "Invalid code" });
    }

    [HttpDelete("mfa/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> MfaDisable(Guid id, CancellationToken ct)
    {
        await handlers.DisableMfaAsync(id, ct);
        return NoContent();
    }

    [HttpGet("mfa/status/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> MfaStatus(Guid id, CancellationToken ct)
    {
        var status = await handlers.GetMfaStatusAsync(id, ct);
        return Ok(status);
    }

    // ── Data proxies ──────────────────────────────────────────────────────────
    [HttpGet("data/incidents")]
    [Authorize]
    public async Task<IActionResult> GetIncidents(CancellationToken ct)
    {
        var customerId = User.FindFirst("grc_customer_id")?.Value ?? User.FindFirst("customer_scope")?.Value ?? "";
        var client = httpClientFactory.CreateClient("internal");
        var url = $"{config["Services:Incident"]}/api/incidents?customerId={customerId}";
        var response = await client.GetAsync(url, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpGet("data/assets")]
    [Authorize]
    public async Task<IActionResult> GetAssets(CancellationToken ct)
    {
        var customerId = User.FindFirst("grc_customer_id")?.Value ?? User.FindFirst("customer_scope")?.Value ?? "";
        var client = httpClientFactory.CreateClient("internal");
        var url = $"{config["Services:Asset"]}/api/assets?customerId={customerId}";
        var response = await client.GetAsync(url, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpGet("data/nonconformities")]
    [Authorize]
    public async Task<IActionResult> GetNonconformities(CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var url = $"{config["Services:Nonconformity"]}/api/nonconformities";
        var response = await client.GetAsync(url, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpGet("data/soa")]
    [Authorize]
    public async Task<IActionResult> GetSoa(CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var url = $"{config["Services:Soa"]}/api/soa";
        var response = await client.GetAsync(url, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpPost("data/incidents/{id}/investigate")]
    [Authorize]
    public async Task<IActionResult> InvestigateIncident(Guid id, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var response = await client.PostAsync($"{config["Services:Incident"]}/api/incidents/{id}/investigate", null, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpPost("data/incidents/{id}/contain")]
    [Authorize]
    public async Task<IActionResult> ContainIncident(Guid id, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var response = await client.PostAsync($"{config["Services:Incident"]}/api/incidents/{id}/contain", null, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpPost("data/incidents/{id}/resolve")]
    [Authorize]
    public async Task<IActionResult> ResolveIncident(Guid id, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var response = await client.PostAsync($"{config["Services:Incident"]}/api/incidents/{id}/resolve", null, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpPost("data/incidents/{id}/close")]
    [Authorize]
    public async Task<IActionResult> CloseIncident(Guid id, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var response = await client.PostAsync($"{config["Services:Incident"]}/api/incidents/{id}/close", null, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpPost("data/incidents/{id}/actions")]
    [Authorize]
    public async Task<IActionResult> AddIncidentAction(Guid id, [FromBody] object body, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("internal");
        var json = System.Text.Json.JsonSerializer.Serialize(body);
        var httpContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{config["Services:Incident"]}/api/incidents/{id}/actions", httpContent, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

}


