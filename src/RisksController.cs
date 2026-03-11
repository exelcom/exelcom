using GrcPlatform.RiskManagement.Application.Risks.Commands;
using GrcPlatform.RiskManagement.Application.Risks.Queries;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.RiskManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RisksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<RiskSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<RiskSummaryDto>>> GetRisks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RiskStatus? status = null,
        [FromQuery] RiskCategory? category = null,
        [FromQuery] string? owner = null,
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetRisksQuery(page, pageSize, status, category, owner), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RiskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskDto>> GetRisk(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new GetRiskByIdQuery(id), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    [ProducesResponseType(typeof(RiskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RiskDto>> CreateRisk(
        [FromBody] CreateRiskCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetRisk), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}/assessment")]
    [ProducesResponseType(typeof(RiskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskDto>> UpdateAssessment(
        Guid id, [FromBody] UpdateRiskAssessmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new UpdateRiskAssessmentCommand(
                id, request.Likelihood, request.Impact,
                request.ResidualLikelihood, request.ResidualImpact), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/treatments")]
    [ProducesResponseType(typeof(RiskTreatmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskTreatmentDto>> AddTreatment(
        Guid id, [FromBody] AddTreatmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new AddRiskTreatmentCommand(
                id, request.Description, request.Type, request.Owner, request.DueDate), cancellationToken);
            return CreatedAtAction(nameof(GetRisk), new { id }, result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/accept")]
    [ProducesResponseType(typeof(RiskDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<RiskDto>> AcceptRisk(
        Guid id, [FromBody] ReasonRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new AcceptRiskCommand(id, request.Reason), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(typeof(RiskDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<RiskDto>> CloseRisk(
        Guid id, [FromBody] ReasonRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await mediator.Send(new CloseRiskCommand(id, request.Reason), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("overdue-reviews")]
    [ProducesResponseType(typeof(List<RiskSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RiskSummaryDto>>> GetOverdueReviews(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetOverdueRiskReviewsQuery(), cancellationToken);
        return Ok(result);
    }
}

// Request models (separate from commands to keep API layer clean)
public record UpdateRiskAssessmentRequest(
    RiskLikelihood Likelihood,
    RiskImpact Impact,
    RiskLikelihood? ResidualLikelihood,
    RiskImpact? ResidualImpact);

public record AddTreatmentRequest(
    string Description,
    TreatmentType Type,
    string Owner,
    DateTime DueDate);

public record ReasonRequest(string Reason);
