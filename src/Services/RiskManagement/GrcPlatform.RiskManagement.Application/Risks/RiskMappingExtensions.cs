using GrcPlatform.RiskManagement.Application.Risks.Commands;
using GrcPlatform.RiskManagement.Domain.Entities;

namespace GrcPlatform.RiskManagement.Application.Risks;

/// <summary>
/// Extension methods to map domain entities → DTOs.
/// Used by both query and command handlers.
/// </summary>
public static class RiskMappingExtensions
{
    public static RiskDto ToDto(this Risk risk) => new(
        Id:                   risk.Id,
        Title:                risk.Title,
        Description:          risk.Description,
        Category:             risk.Category.ToString(),
        Status:               risk.Status.ToString(),
        InherentScore:        risk.InherentScore,
        RiskRating:           risk.RiskRating.ToString(),
        ResidualScore:        risk.ResidualScore,
        Owner:                risk.Owner,
        Department:           risk.Department,
        ReviewDueDate:        risk.ReviewDueDate,
        RegulatoryReference:  risk.RegulatoryReference,
        CreatedAt:            risk.CreatedAt,
        CreatedBy:            risk.CreatedBy,
        Treatments:           risk.Treatments.Select(t => t.ToDto()).ToList()
    );

    public static RiskSummaryDto ToSummaryDto(this Risk risk) => new(
        Id:            risk.Id,
        Title:         risk.Title,
        Category:      risk.Category.ToString(),
        Status:        risk.Status.ToString(),
        RiskRating:    risk.RiskRating.ToString(),
        InherentScore: risk.InherentScore,
        Owner:         risk.Owner,
        ReviewDueDate: risk.ReviewDueDate
    );

    public static RiskTreatmentDto ToDto(this RiskTreatment t) => new(
        Id:          t.Id,
        Description: t.Description,
        Type:        t.Type.ToString(),
        Owner:       t.Owner,
        DueDate:     t.DueDate,
        IsCompleted: t.IsCompleted,
        CompletedAt: t.CompletedAt
    );
}
