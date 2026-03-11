using GrcPlatform.ComplianceTracking.Application.Compliance.Commands;
using GrcPlatform.ComplianceTracking.Application.Compliance.Queries;
using GrcPlatform.ComplianceTracking.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.ComplianceTracking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComplianceController(IMediator mediator) : ControllerBase
{
    [HttpGet("frameworks")]
    public async Task<ActionResult<PagedResult<FrameworkSummaryDto>>> GetFrameworks(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetFrameworksQuery(page, pageSize), ct));

    [HttpGet("frameworks/{id:guid}")]
    public async Task<ActionResult<FrameworkDto>> GetFramework(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new GetFrameworkByIdQuery(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("frameworks")]
    public async Task<ActionResult<FrameworkDto>> CreateFramework(
        [FromBody] CreateFrameworkCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetFramework), new { id = result.Id }, result);
    }

    [HttpGet("frameworks/{frameworkId:guid}/controls")]
    public async Task<ActionResult<List<ControlSummaryDto>>> GetControls(
        Guid frameworkId, CancellationToken ct)
        => Ok(await mediator.Send(new GetControlsByFrameworkQuery(frameworkId), ct));

    [HttpGet("controls/{id:guid}")]
    public async Task<ActionResult<ControlDto>> GetControl(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new GetControlByIdQuery(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("controls/{id:guid}/implementation")]
    public async Task<ActionResult<ControlDto>> UpdateControlImplementation(
        Guid id, [FromBody] UpdateControlRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await mediator.Send(new UpdateControlImplementationCommand(
                id, request.Status, request.Posture, request.Notes,
                request.Owner, request.NextReviewDate), ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("controls/{id:guid}/evidence")]
    public async Task<ActionResult<EvidenceDto>> AddEvidence(
        Guid id, [FromBody] AddEvidenceRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await mediator.Send(new AddControlEvidenceCommand(
                id, request.FileName, request.BlobUrl, request.Type, request.Description), ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record UpdateControlRequest(ControlStatus Status, CompliancePosture Posture,
    string? Notes, string? Owner, DateTime? NextReviewDate);
public record AddEvidenceRequest(string FileName, string BlobUrl,
    EvidenceType Type, string Description);
