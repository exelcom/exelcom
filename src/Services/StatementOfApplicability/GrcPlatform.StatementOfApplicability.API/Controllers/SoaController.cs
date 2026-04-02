using GrcPlatform.StatementOfApplicability.Application;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.StatementOfApplicability.API.Controllers;

[ApiController]
[Route("api/soa")]
[Authorize]
public class SoaController(IMediator mediator) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<ControlSummaryDto>>> GetAll(CancellationToken ct) =>
        Ok(await mediator.Send(new GetAllControlsQuery(), ct));

    [AllowAnonymous]

    [HttpGet("stats")]
    public async Task<ActionResult<SoaStatsDto>> GetStats(CancellationToken ct) =>
        Ok(await mediator.Send(new GetSoaStatsQuery(), ct));

    [AllowAnonymous]

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ControlDto>> GetById(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new GetControlByIdQuery(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("{id:guid}/applicability")]
    public async Task<ActionResult<ControlDto>> UpdateApplicability(Guid id, [FromBody] UpdateApplicabilityRequest req, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new UpdateApplicabilityCommand(id, req.Applicability, req.Justification), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("{id:guid}/implementation")]
    public async Task<ActionResult<ControlDto>> UpdateImplementation(Guid id, [FromBody] UpdateImplementationRequest req, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new UpdateImplementationCommand(id, req.Status, req.Notes, req.Owner, req.TargetDate, req.EvidenceRef), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record UpdateApplicabilityRequest(string Applicability, string? Justification);
public record UpdateImplementationRequest(string Status, string? Notes, string? Owner, DateTime? TargetDate, string? EvidenceRef);

