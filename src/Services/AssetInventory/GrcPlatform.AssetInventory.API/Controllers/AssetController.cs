using GrcPlatform.AssetInventory.Application;
using GrcPlatform.AssetInventory.Domain;
using GrcPlatform.AssetInventory.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GrcPlatform.AssetInventory.API.Controllers;

[ApiController]
[Route("api/assets")]
[Produces("application/json")]
public sealed class AssetController(AssetHandlers handlers) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AssetDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] AssetType? type,
        [FromQuery] AssetStatus? status,
        [FromQuery] RiskRating? riskRating,
        [FromQuery] string? customerId,
        CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new ListAssetsQuery(type, status, riskRating, customerId), ct);
        return Ok(result);
    }

    [HttpGet("stats")]
    [ProducesResponseType<AssetStatsDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Stats([FromQuery] string? customerId, CancellationToken ct)
    {
        var result = await handlers.GetStatsAsync(customerId, ct);
        return Ok(result);
    }

    [HttpGet("customers")]
    [ProducesResponseType<IReadOnlyList<CustomerSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Customers(CancellationToken ct)
    {
        var result = await handlers.GetCustomerSummariesAsync(ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AssetDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new GetAssetQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType<AssetDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateAssetRequest request, CancellationToken ct)
    {
        var result = await handlers.HandleAsync(new CreateAssetCommand(
            request.Type, request.Name, request.Description,
            request.CustomerId, request.CustomerName,
            request.RiskRating, request.OwnerUserId, request.CustodianUserId, request.Location,
            request.SerialNumber, request.Manufacturer, request.Model, request.Version,
            request.PurchaseDate, request.ExpiryDate, request.LinkedControlId,
            request.CreatedByUserId), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AssetDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssetRequest request, CancellationToken ct)
    {
        try
        {
            var result = await handlers.HandleAsync(new UpdateAssetCommand(
                id, request.Type, request.Name, request.Description,
                request.CustomerId, request.CustomerName,
                request.RiskRating, request.Status,
                request.OwnerUserId, request.CustodianUserId, request.Location,
                request.SerialNumber, request.Manufacturer, request.Model, request.Version,
                request.PurchaseDate, request.ExpiryDate, request.LinkedControlId), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await handlers.HandleAsync(new DeleteAssetCommand(id), ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public sealed record CreateAssetRequest(
    AssetType Type, string Name, string? Description,
    string? CustomerId, string? CustomerName,
    RiskRating RiskRating, string OwnerUserId, string? CustodianUserId,
    string? Location, string? SerialNumber, string? Manufacturer,
    string? Model, string? Version,
    DateTimeOffset? PurchaseDate, DateTimeOffset? ExpiryDate,
    string? LinkedControlId, string CreatedByUserId);

public sealed record UpdateAssetRequest(
    AssetType Type, string Name, string? Description,
    string? CustomerId, string? CustomerName,
    RiskRating RiskRating, AssetStatus Status,
    string OwnerUserId, string? CustodianUserId,
    string? Location, string? SerialNumber, string? Manufacturer,
    string? Model, string? Version,
    DateTimeOffset? PurchaseDate, DateTimeOffset? ExpiryDate,
    string? LinkedControlId);
