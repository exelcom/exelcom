using GrcPlatform.AuditManagement.Application.Audits.Commands;
using GrcPlatform.AuditManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.AuditManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditSummaryDto>>> GetAudits(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] AuditStatus? status = null, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetAuditsQuery(page, pageSize, status), ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AuditDto>> GetAudit(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new GetAuditByIdQuery(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<ActionResult<AuditDto>> CreateAudit(
        [FromBody] CreateAuditCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetAudit), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/start")]
    public async Task<ActionResult<AuditDto>> StartAudit(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new StartAuditCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/close")]
    public async Task<ActionResult<AuditDto>> CloseAudit(
        Guid id, [FromBody] CloseAuditRequest request, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new CloseAuditCommand(id, request.ExecutiveSummary), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/findings")]
    public async Task<ActionResult<FindingDto>> AddFinding(
        Guid id, [FromBody] AddFindingRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await mediator.Send(new AddFindingCommand(
                id, request.Title, request.Description, request.Severity,
                request.Recommendation, request.RemediationDueDate), ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/evidence-requests")]
    public async Task<ActionResult<EvidenceRequestDto>> RequestEvidence(
        Guid id, [FromBody] RequestEvidenceRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await mediator.Send(new RequestEvidenceCommand(
                id, request.Title, request.Description, request.RequestedFrom, request.DueDate), ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record CloseAuditRequest(string ExecutiveSummary);
public record AddFindingRequest(string Title, string Description, FindingSeverity Severity,
    string? Recommendation, DateTime RemediationDueDate);
public record RequestEvidenceRequest(string Title, string Description,
    string RequestedFrom, DateTime DueDate);
