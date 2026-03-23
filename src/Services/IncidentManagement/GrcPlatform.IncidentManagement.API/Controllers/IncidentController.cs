using GrcPlatform.IncidentManagement.Application;
using GrcPlatform.IncidentManagement.Domain;
using GrcPlatform.IncidentManagement.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.IncidentManagement.API.Controllers;

[ApiController]
[Route("api/incidents")]
[Produces("application/json")]
public sealed class IncidentController(IncidentHandlers handlers) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] IncidentType? type, [FromQuery] IncidentStatus? status, [FromQuery] IncidentSeverity? severity, [FromQuery] string? customerId, CancellationToken ct)
        => Ok(await handlers.HandleAsync(new ListIncidentsQuery(type, status, severity, customerId), ct));

    [HttpGet("stats")]
    public async Task<IActionResult> Stats([FromQuery] string? customerId, CancellationToken ct)
        => Ok(await handlers.GetStatsAsync(customerId, ct));

    [HttpGet("customers")]
    public async Task<IActionResult> Customers(CancellationToken ct)
        => Ok(await handlers.GetCustomerSummariesAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new GetIncidentQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Report([FromBody] ReportIncidentRequest request, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new ReportIncidentCommand(
            request.Type, request.Severity, request.Title, request.Description, request.ImpactDescription,
            request.OccurredAt, request.DetectedAt, request.ReportedByUserId, request.AssignedToUserId,
            request.CustomerId, request.CustomerName, request.ContactEmail, request.LinkedControlId, request.AffectedAssetIds), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateIncidentRequest request, CancellationToken ct)
    {
        try
        {
            var result = await handlers.HandleAsync(new UpdateIncidentCommand(
                id, request.Type, request.Severity, request.Title, request.Description, request.ImpactDescription,
                request.OccurredAt, request.DetectedAt, request.AssignedToUserId,
                request.CustomerId, request.CustomerName, request.ContactEmail, request.LinkedControlId, request.AffectedAssetIds), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await handlers.HandleAsync(new DeleteIncidentCommand(id), ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Status transitions ────────────────────────────────────────────────────

    [HttpPost("{id:guid}/investigate")]
    public async Task<IActionResult> BeginInvestigation(Guid id, [FromBody] AssignRequest? request, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new BeginInvestigationCommand(id, request?.AssignedToUserId), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/contain")]
    public async Task<IActionResult> MarkContained(Guid id, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new MarkContainedCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/resolve")]
    public async Task<IActionResult> MarkResolved(Guid id, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new MarkResolvedCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> Close(Guid id, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new CloseIncidentCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/actions")]
    public async Task<IActionResult> AddAction(Guid id, [FromBody] ActionRequest request, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new AddActionCommand(id, request.Type, request.Description, request.AssignedToUserId, request.DueDate, request.Notes), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("{id:guid}/actions/{actionId:guid}")]
    public async Task<IActionResult> UpdateAction(Guid id, Guid actionId, [FromBody] ActionRequest request, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new UpdateActionCommand(id, actionId, request.Type, request.Description, request.AssignedToUserId, request.DueDate, request.Notes), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/actions/{actionId:guid}/complete")]
    public async Task<IActionResult> CompleteAction(Guid id, Guid actionId, [FromBody] CompleteActionRequest request, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new CompleteActionCommand(id, actionId, request.CompletedByUserId, request.Notes), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    // ── Post-incident review ──────────────────────────────────────────────────

    [HttpPost("{id:guid}/review")]
    public async Task<IActionResult> RecordReview(Guid id, [FromBody] PostIncidentReviewRequest request, CancellationToken ct)
    {
        try { return Ok(await handlers.HandleAsync(new RecordPostIncidentReviewCommand(id, request.Summary, request.RootCause, request.LessonsLearned, request.Recommendations, request.ReviewerUserId), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }
}

// ── Request bodies ────────────────────────────────────────────────────────────

public sealed record ReportIncidentRequest(
    IncidentType Type, IncidentSeverity Severity, string Title, string Description,
    string? ImpactDescription, DateTimeOffset OccurredAt, DateTimeOffset? DetectedAt,
    string ReportedByUserId, string? AssignedToUserId,
    string? CustomerId, string? CustomerName, string? ContactEmail, string? LinkedControlId, string? AffectedAssetIds);

public sealed record UpdateIncidentRequest(
    IncidentType Type, IncidentSeverity Severity, string Title, string Description,
    string? ImpactDescription, DateTimeOffset OccurredAt, DateTimeOffset? DetectedAt,
    string? AssignedToUserId, string? CustomerId, string? CustomerName,
    string? ContactEmail, string? LinkedControlId, string? AffectedAssetIds);

public sealed record AssignRequest(string? AssignedToUserId);

public sealed record ActionRequest(
    ActionType Type, string Description, string AssignedToUserId,
    DateTimeOffset? DueDate, string? Notes);

public sealed record CompleteActionRequest(string CompletedByUserId, string? Notes);

public sealed record PostIncidentReviewRequest(
    string Summary, string RootCause, string LessonsLearned,
    string? Recommendations, string ReviewerUserId);
