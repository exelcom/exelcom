using GrcPlatform.PolicyManagement.Application.Policies.Commands;
using GrcPlatform.PolicyManagement.Application.Policies.Queries;
using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.PolicyManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PoliciesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPolicies([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] PolicyStatus? status = null, [FromQuery] PolicyCategory? category = null, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetPoliciesQuery(page, pageSize, status, category), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPolicy(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new GetPolicyByIdQuery(id), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> CreatePolicy([FromBody] CreatePolicyCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetPolicy), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePolicy(Guid id, [FromBody] UpdatePolicyRequest req, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new UpdatePolicyCommand(id, req.Title, req.Description, Enum.Parse<PolicyCategory>(req.Category), req.Owner, req.Department, req.RequiresAttestation, req.ReviewDueDate), ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePolicy(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeletePolicyCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/versions")]
    public async Task<IActionResult> AddVersion(Guid id, [FromBody] AddVersionRequest request, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new AddPolicyVersionCommand(id, request.Content, request.ChangeNotes), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApprovePolicy(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new ApprovePolicyCommand(id), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishPolicy(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new PublishPolicyCommand(id), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/retire")]
    public async Task<IActionResult> RetirePolicy(Guid id, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new RetirePolicyCommand(id), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/attestations")]
    public async Task<IActionResult> RequestAttestation(Guid id, [FromBody] RequestAttestationRequest request, CancellationToken ct)
    {
        try { return CreatedAtAction(nameof(GetPolicy), new { id }, await mediator.Send(new RequestAttestationCommand(id, request.UserId, request.UserEmail, request.DueDate), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AttestationsController(IMediator mediator) : ControllerBase
{
    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> SubmitAttestation(Guid id, [FromBody] SubmitAttestationRequest request, CancellationToken ct)
    {
        try { return Ok(await mediator.Send(new SubmitAttestationCommand(id, request.Attested, request.Notes), ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

public record UpdatePolicyRequest(string Title, string? Description, string Category, string? Owner, string? Department, bool RequiresAttestation, DateTime? ReviewDueDate);
public record AddVersionRequest(string Content, string ChangeNotes);
public record RequestAttestationRequest(string UserId, string UserEmail, DateTime DueDate);
public record SubmitAttestationRequest(bool Attested, string? Notes);


