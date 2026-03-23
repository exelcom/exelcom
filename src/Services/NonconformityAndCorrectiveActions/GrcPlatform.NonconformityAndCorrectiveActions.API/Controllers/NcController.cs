using GrcPlatform.NonconformityAndCorrectiveActions.Application;
using GrcPlatform.NonconformityAndCorrectiveActions.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.NonconformityAndCorrectiveActions.API.Controllers;

[ApiController]
[Route("api/nonconformities")]
[Produces("application/json")]
public sealed class NcController(NcHandlers handlers) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<NonconformityDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] NcStatus? status,
        [FromQuery] NcSeverity? severity,
        CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new ListNonconformitiesQuery(status, severity), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new GetNonconformityQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Raise(
        [FromBody] RaiseNonconformityCommand command,
        CancellationToken ct)
    {
        var result = await handlers.HandleAsync(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateNcRequest request,
        CancellationToken ct)
    {
        try
        {
            var result = await handlers.HandleAsync(
                new UpdateNonconformityCommand(
                    id, request.Source, request.ClauseReference, request.Severity,
                    request.Title, request.Description, request.EvidenceReference),
                ct);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await handlers.HandleAsync(new DeleteNonconformityCommand(id), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/rca")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordRca(
        Guid id, [FromBody] RecordRcaRequest request, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(
            new RecordRcaCommand(id, request.Method, request.CauseCategory,
                request.CauseDescription, request.FiveWhys, request.AnalystUserId), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/corrective-actions")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddCorrectiveAction(
        Guid id, [FromBody] AddCaRequest request, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(
            new AddCorrectiveActionCommand(id, request.Description, request.OwnerUserId, request.DueDate), ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/corrective-actions/{caId:guid}")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCorrectiveAction(
        Guid id, Guid caId, [FromBody] AddCaRequest request, CancellationToken ct)
    {
        try
        {
            var result = await handlers.HandleAsync(
                new UpdateCorrectiveActionCommand(id, caId, request.Description, request.OwnerUserId, request.DueDate), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/corrective-actions/{caId:guid}/implement")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkImplemented(
        Guid id, Guid caId, [FromBody] MarkImplementedRequest request, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(
            new MarkCaImplementedCommand(id, caId, request.VerifiedByUserId), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/close")]
    [ProducesResponseType<NonconformityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Close(
        Guid id, [FromBody] CloseNcRequest request, CancellationToken ct)
    {
        try
        {
            var result = await handlers.HandleAsync(
                new CloseNonconformityCommand(id, request.IsEffective, request.ReviewNotes, request.ReviewerUserId), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }
}

// ── Request bodies ────────────────────────────────────────────────────────────

public sealed record UpdateNcRequest(
    NcSource Source,
    string? ClauseReference,
    NcSeverity Severity,
    string Title,
    string Description,
    string? EvidenceReference);

public sealed record RecordRcaRequest(
    RcaMethod Method,
    NcCauseCategory CauseCategory,
    string CauseDescription,
    string[] FiveWhys,
    string AnalystUserId);

public sealed record AddCaRequest(
    string Description,
    string OwnerUserId,
    DateTimeOffset DueDate);

public sealed record MarkImplementedRequest(string VerifiedByUserId);

public sealed record CloseNcRequest(
    bool IsEffective,
    string ReviewNotes,
    string ReviewerUserId);
