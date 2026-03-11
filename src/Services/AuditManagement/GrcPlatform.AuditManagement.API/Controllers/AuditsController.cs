using GrcPlatform.AuditManagement.Application.Audits.Commands;
using GrcPlatform.AuditManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.AuditManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuditsController(IMediator mediator) : ControllerBase
{
    /// <summary>Get a paged list of audits, optionally filtered by status.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAudits(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] AuditStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetAuditsQuery(page, pageSize, status), cancellationToken);
        return Ok(result);
    }

    /// <summary>Get a single audit by ID, including findings and evidence requests.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuditDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAudit(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new GetAuditByIdQuery(id), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Audit {id} not found" });
        }
    }

    /// <summary>Create a new audit (starts in Planning status).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(AuditDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAudit(
        [FromBody] CreateAuditCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAudit), new { id = result.Id }, result);
    }

    /// <summary>Start an audit (Planning → InProgress).</summary>
    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(typeof(AuditDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartAudit(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new StartAuditCommand(id), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Audit {id} not found" });
        }
    }

    /// <summary>Close an audit with an executive summary.</summary>
    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(typeof(AuditDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseAudit(
        Guid id,
        [FromBody] CloseAuditRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(
                new CloseAuditCommand(id, request.ExecutiveSummary), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Audit {id} not found" });
        }
    }

    /// <summary>Add a finding to an audit.</summary>
    [HttpPost("{id:guid}/findings")]
    [ProducesResponseType(typeof(FindingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddFinding(
        Guid id,
        [FromBody] AddFindingRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(
                new AddFindingCommand(
                    id,
                    request.Title,
                    request.Description,
                    request.Severity,
                    request.Recommendation,
                    request.RemediationDueDate),
                cancellationToken);
            return CreatedAtAction(nameof(GetAudit), new { id }, result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Audit {id} not found" });
        }
    }
    [HttpPut("{id:guid}")] public async Task<ActionResult<AuditDto>> UpdateAudit(Guid id, [FromBody] UpdateAuditCommand cmd, CancellationToken ct) { try { return Ok(await mediator.Send(cmd with { AuditId = id }, ct)); } catch (KeyNotFoundException) { return NotFound(); } }

    [HttpDelete("{id:guid}")] public async Task<ActionResult> DeleteAudit(Guid id, CancellationToken ct) { await mediator.Send(new DeleteAuditCommand(id), ct); return NoContent(); }
}
// ── Request body records ──────────────────────────────────────────────────────

public record CloseAuditRequest(string ExecutiveSummary);

public record AddFindingRequest(
    string Title,
    string Description,
    FindingSeverity Severity,
    string? Recommendation,
    DateTime RemediationDueDate);



