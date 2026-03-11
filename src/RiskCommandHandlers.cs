using GrcPlatform.RiskManagement.Application.Interfaces;
using GrcPlatform.RiskManagement.Domain.Entities;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using MediatR;

namespace GrcPlatform.RiskManagement.Application.Risks.Commands;

public class CreateRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CreateRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(CreateRiskCommand request, CancellationToken cancellationToken)
    {
        var risk = Risk.Create(
            request.Title,
            request.Description,
            request.Category,
            request.Likelihood,
            request.Impact,
            currentUser.UserId,
            request.Owner,
            request.Department,
            request.ReviewDueDate,
            request.RegulatoryReference);

        await repository.AddAsync(risk, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return risk.ToDto();
    }
}

public class UpdateRiskAssessmentCommandHandler(IRiskRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<UpdateRiskAssessmentCommand, RiskDto>
{
    public async Task<RiskDto> Handle(UpdateRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdAsync(request.RiskId, cancellationToken)
            ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");

        risk.UpdateAssessment(request.Likelihood, request.Impact,
            request.ResidualLikelihood, request.ResidualImpact, currentUser.UserId);

        await repository.UpdateAsync(risk, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return risk.ToDto();
    }
}

public class AddRiskTreatmentCommandHandler(IRiskRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<AddRiskTreatmentCommand, RiskTreatmentDto>
{
    public async Task<RiskTreatmentDto> Handle(AddRiskTreatmentCommand request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdWithDetailsAsync(request.RiskId, cancellationToken)
            ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");

        risk.AddTreatment(request.Description, request.Type, request.Owner, request.DueDate, currentUser.UserId);
        await repository.SaveChangesAsync(cancellationToken);

        return risk.Treatments.Last().ToDto();
    }
}

public class CloseRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CloseRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(CloseRiskCommand request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdAsync(request.RiskId, cancellationToken)
            ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");

        risk.Close(request.Reason, currentUser.UserId);
        await repository.SaveChangesAsync(cancellationToken);
        return risk.ToDto();
    }
}

public class AcceptRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<AcceptRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(AcceptRiskCommand request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdAsync(request.RiskId, cancellationToken)
            ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");

        risk.Accept(request.Reason, currentUser.UserId);
        await repository.SaveChangesAsync(cancellationToken);
        return risk.ToDto();
    }
}

// Mapping extensions
public static class RiskMappingExtensions
{
    public static RiskDto ToDto(this Risk risk) => new(
        risk.Id, risk.Title, risk.Description,
        risk.Category.ToString(), risk.Status.ToString(),
        risk.InherentScore, risk.RiskRating, risk.ResidualScore,
        risk.Owner, risk.Department, risk.ReviewDueDate,
        risk.RegulatoryReference, risk.CreatedAt, risk.CreatedBy,
        risk.Treatments.Select(t => t.ToDto()).ToList());

    public static RiskTreatmentDto ToDto(this RiskTreatment t) => new(
        t.Id, t.Description, t.Type.ToString(), t.Owner,
        t.DueDate, t.IsCompleted, t.CompletedAt);

    public static RiskSummaryDto ToSummaryDto(this Risk risk) => new(
        risk.Id, risk.Title, risk.Category.ToString(),
        risk.Status.ToString(), risk.RiskRating,
        risk.InherentScore, risk.Owner, risk.ReviewDueDate);
}
