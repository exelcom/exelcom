using GrcPlatform.ComplianceTracking.Application.Compliance.Commands;
using GrcPlatform.ComplianceTracking.Application.Compliance.Queries;
using GrcPlatform.ComplianceTracking.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.ComplianceTracking.Api.Controllers;

// ── Frameworks ───────────────────────────────────────────────────────────────

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class FrameworksController(IMediator mediator) : ControllerBase
{
    /// <summary>Get a paged list of compliance frameworks.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<FrameworkSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFrameworks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetFrameworksQuery(page, pageSize), cancellationToken);
        return Ok(result);
    }

    /// <summary>Get a single framework by ID, including all controls.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(FrameworkDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFramework(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new GetFrameworkByIdQuery(id), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Create a new compliance framework.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(FrameworkDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateFramework(
        [FromBody] CreateFrameworkCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetFramework), new { id = result.Id }, result);
    }    [HttpPut("{id:guid}")] public async Task<ActionResult<FrameworkDto>> UpdateFramework(Guid id, [FromBody] UpdateFrameworkCommand cmd, CancellationToken ct) { try { return Ok(await mediator.Send(cmd with { FrameworkId = id }, ct)); } catch (KeyNotFoundException) { return NotFound(); } }

    [HttpDelete("{id:guid}")] public async Task<ActionResult> DeleteFramework(Guid id, CancellationToken ct) { await mediator.Send(new DeleteFrameworkCommand(id), ct); return NoContent(); }



    /// <summary>Get all controls for a specific framework.</summary>
    [HttpGet("{id:guid}/controls")]
    [ProducesResponseType(typeof(List<ControlSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetControls(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetControlsByFrameworkQuery(id), cancellationToken);
        return Ok(result);
    }
}

// ── Controls ─────────────────────────────────────────────────────────────────

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ControlsController(IMediator mediator) : ControllerBase
{
    /// <summary>Get a single control by ID, including evidence.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ControlDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetControl(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new GetControlByIdQuery(id), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Update the implementation status and posture of a control.</summary>
    [HttpPut("{id:guid}/implementation")]
    [ProducesResponseType(typeof(ControlDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateImplementation(
        Guid id,
        [FromBody] UpdateImplementationRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new UpdateControlImplementationCommand(
                id,
                request.Status,
                request.Posture,
                request.Notes,
                request.Owner,
                request.NextReviewDate);

            var result = await mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Add evidence to a control.</summary>
    [HttpPost("{id:guid}/evidence")]
    [ProducesResponseType(typeof(EvidenceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddEvidence(
        Guid id,
        [FromBody] AddEvidenceRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new AddControlEvidenceCommand(
                id,
                request.FileName,
                request.BlobUrl,
                request.Type,
                request.Description);

            var result = await mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetControl), new { id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

// ── Request body records ──────────────────────────────────────────────────────

public record UpdateImplementationRequest(
    ControlStatus Status,
    CompliancePosture Posture,
    string? Notes,
    string? Owner,
    DateTime? NextReviewDate
);

public record AddEvidenceRequest(
    string FileName,
    string BlobUrl,
    EvidenceType Type,
    string Description
);



