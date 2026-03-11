using GrcPlatform.PolicyManagement.Application.Policies.Commands;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.PolicyManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PoliciesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<PolicySummaryDto>>> GetPolicies(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] PolicyStatus? status = null, [FromQuery] PolicyCategory? category = null,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetPoliciesQuery(page, pageSize, status, category), ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PolicyDto>> GetPolicy(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new GetPolicyByIdQuery(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<ActionResult<PolicyDto>> CreatePolicy(
        [FromBody] CreatePolicyCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetPolicy), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/versions")]
    public async Task<ActionResult<PolicyDto>> AddVersion(
        Guid id, [FromBody] AddVersionRequest request, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new AddPolicyVersionCommand(id, request.Content, request.ChangeNotes), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<PolicyDto>> Approve(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new ApprovePolicyCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<PolicyDto>> Publish(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new PublishPolicyCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/retire")]
    public async Task<ActionResult<PolicyDto>> Retire(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new RetirePolicyCommand(id), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/attestations")]
    public async Task<ActionResult<AttestationDto>> RequestAttestation(
        Guid id, [FromBody] AttestationRequest request, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new RequestAttestationCommand(id, request.UserId, request.UserEmail, request.DueDate), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record AddVersionRequest(string Content, string ChangeNotes);
public record AttestationRequest(string UserId, string UserEmail, DateTime DueDate);
