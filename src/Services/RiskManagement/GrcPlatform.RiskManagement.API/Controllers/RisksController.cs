using GrcPlatform.RiskManagement.Application.Risks.Commands;
using GrcPlatform.RiskManagement.Application.Risks.Queries;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace GrcPlatform.RiskManagement.API.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class RisksController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<PagedResult<RiskSummaryDto>>> GetRisks([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] RiskStatus? status = null, [FromQuery] RiskCategory? category = null, [FromQuery] string? owner = null, CancellationToken ct = default) => Ok(await mediator.Send(new GetRisksQuery(page, pageSize, status, category, owner), ct));
    [HttpGet("{id:guid}")] public async Task<ActionResult<RiskDto>> GetRisk(Guid id, CancellationToken ct) { try { return Ok(await mediator.Send(new GetRiskByIdQuery(id), ct)); } catch (KeyNotFoundException) { return NotFound(); } }
    [HttpPost] public async Task<ActionResult<RiskDto>> CreateRisk([FromBody] CreateRiskCommand command, CancellationToken ct) { var r = await mediator.Send(command, ct); return CreatedAtAction(nameof(GetRisk), new { id = r.Id }, r); }
    [HttpPut("{id:guid}/assessment")] public async Task<ActionResult<RiskDto>> UpdateAssessment(Guid id, [FromBody] UpdateRiskAssessmentRequest req, CancellationToken ct) { try { return Ok(await mediator.Send(new UpdateRiskAssessmentCommand(id, Enum.Parse<RiskLikelihood>(req.Likelihood), Enum.Parse<RiskImpact>(req.Impact), req.ResidualLikelihood != null ? Enum.Parse<RiskLikelihood>(req.ResidualLikelihood) : null, req.ResidualImpact != null ? Enum.Parse<RiskImpact>(req.ResidualImpact) : null), ct)); } catch (KeyNotFoundException) { return NotFound(); } }
    [HttpPost("{id:guid}/treatments")] public async Task<ActionResult<RiskTreatmentDto>> AddTreatment(Guid id, [FromBody] AddTreatmentRequest req, CancellationToken ct) { try { return Ok(await mediator.Send(new AddRiskTreatmentCommand(id, req.Description, req.Type, req.Owner, req.DueDate), ct)); } catch (KeyNotFoundException) { return NotFound(); } }
    [HttpPost("{id:guid}/accept")] public async Task<ActionResult<RiskDto>> Accept(Guid id, [FromBody] ReasonRequest req, CancellationToken ct) { try { return Ok(await mediator.Send(new AcceptRiskCommand(id, req.Reason), ct)); } catch (KeyNotFoundException) { return NotFound(); } }
    [HttpPost("{id:guid}/close")] public async Task<ActionResult<RiskDto>> Close(Guid id, [FromBody] ReasonRequest req, CancellationToken ct) { try { return Ok(await mediator.Send(new CloseRiskCommand(id, req.Reason), ct)); } catch (KeyNotFoundException) { return NotFound(); } }
        [HttpPut("{id:guid}")] public async Task<ActionResult<RiskDto>> UpdateRisk(Guid id, [FromBody] UpdateRiskCommand cmd, CancellationToken ct) { try { return Ok(await mediator.Send(cmd with { RiskId = id }, ct)); } catch (KeyNotFoundException) { return NotFound(); } }
    [HttpDelete("{id:guid}")] public async Task<ActionResult> DeleteRisk(Guid id, CancellationToken ct) { await mediator.Send(new DeleteRiskCommand(id), ct); return NoContent(); }
    [HttpGet("overdue-reviews")] public async Task<ActionResult<List<RiskSummaryDto>>> GetOverdueReviews(CancellationToken ct) => Ok(await mediator.Send(new GetOverdueRiskReviewsQuery(), ct));
}
public record UpdateRiskAssessmentRequest(string Likelihood, string Impact, string? ResidualLikelihood, string? ResidualImpact);
public record AddTreatmentRequest(string Description, TreatmentType Type, string Owner, DateTime DueDate);
public record ReasonRequest(string Reason);




