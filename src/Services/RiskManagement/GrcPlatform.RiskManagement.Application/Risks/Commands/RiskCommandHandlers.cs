using GrcPlatform.RiskManagement.Application.Interfaces;
using GrcPlatform.RiskManagement.Domain.Entities;
using GrcPlatform.RiskManagement.Domain.Enums;
using GrcPlatform.RiskManagement.Domain.Interfaces;
using MediatR;
namespace GrcPlatform.RiskManagement.Application.Risks.Commands;
public class CreateRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<CreateRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(CreateRiskCommand request, CancellationToken cancellationToken)
    {
        var risk = Risk.Create(request.Title, request.Description, request.Category, request.Likelihood, request.Impact, currentUser.UserId, request.Owner, request.Department, request.ReviewDueDate, request.RegulatoryReference);
        await repository.AddAsync(risk, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return risk.ToDto();
    }
}
public class UpdateRiskAssessmentCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<UpdateRiskAssessmentCommand, RiskDto>
{
    public async Task<RiskDto> Handle(UpdateRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdAsync(request.RiskId, cancellationToken) ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");
        risk.UpdateAssessment(request.Likelihood, request.Impact, request.ResidualLikelihood, request.ResidualImpact, currentUser.UserId);
        await repository.UpdateAsync(risk, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return risk.ToDto();
    }
}
public class AddRiskTreatmentCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<AddRiskTreatmentCommand, RiskTreatmentDto>
{
    public async Task<RiskTreatmentDto> Handle(AddRiskTreatmentCommand request, CancellationToken cancellationToken)
    {
        var risk = await repository.GetByIdWithDetailsAsync(request.RiskId, cancellationToken) ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found");
        risk.AddTreatment(request.Description, request.Type, request.Owner, request.DueDate, currentUser.UserId);
        await repository.SaveChangesAsync(cancellationToken);
        return risk.Treatments.Last().ToDto();
    }
}
public class CloseRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<CloseRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(CloseRiskCommand request, CancellationToken cancellationToken)
    { var risk = await repository.GetByIdAsync(request.RiskId, cancellationToken) ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found"); risk.Close(request.Reason, currentUser.UserId); await repository.SaveChangesAsync(cancellationToken); return risk.ToDto(); }
}
public class AcceptRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<AcceptRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(AcceptRiskCommand request, CancellationToken cancellationToken)
    { var risk = await repository.GetByIdAsync(request.RiskId, cancellationToken) ?? throw new KeyNotFoundException($"Risk {request.RiskId} not found"); risk.Accept(request.Reason, currentUser.UserId); await repository.SaveChangesAsync(cancellationToken); return risk.ToDto(); }
}
public record DeleteRiskCommand(Guid RiskId) : IRequest;
public class DeleteRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<DeleteRiskCommand>
{
    public async Task Handle(DeleteRiskCommand request, CancellationToken cancellationToken)
    {
        await repository.DeleteAsync(request.RiskId, currentUser.UserId, cancellationToken);
    }
}
public static class RiskMappingExtensions
{
    public static RiskDto ToDto(this Risk r) => new(r.Id, r.Title, r.Description, r.Category.ToString(), r.Status.ToString(), r.InherentScore, r.RiskRating, r.ResidualScore, r.Owner, r.Department, r.ReviewDueDate, r.RegulatoryReference, r.CreatedAt, r.CreatedBy, r.Treatments.Select(t => t.ToDto()).ToList());
    public static RiskTreatmentDto ToDto(this RiskTreatment t) => new(t.Id, t.Description, t.Type.ToString(), t.Owner, t.DueDate, t.IsCompleted, t.CompletedAt);
    public static RiskSummaryDto ToSummaryDto(this Risk r) => new(r.Id, r.Title, r.Category.ToString(), r.Status.ToString(), r.RiskRating, r.InherentScore, r.Owner, r.ReviewDueDate);
}


public record UpdateRiskCommand(Guid RiskId, string Title, string Description, RiskCategory Category, string? Owner, string? Department, string? RegulatoryReference, DateTime? ReviewDueDate) : IRequest<RiskDto>;
public class UpdateRiskCommandHandler(IRiskRepository repository, ICurrentUserService currentUser) : IRequestHandler<UpdateRiskCommand, RiskDto>
{
    public async Task<RiskDto> Handle(UpdateRiskCommand request, CancellationToken ct)
    {
        var risk = await repository.GetByIdAsync(request.RiskId, ct) ?? throw new KeyNotFoundException();
        risk.UpdateDetails(request.Title, request.Description, request.Category, request.Owner, request.Department, request.RegulatoryReference, request.ReviewDueDate, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return await repository.GetByIdAsync(request.RiskId, ct) is { } updated ? updated.ToDto() : throw new KeyNotFoundException();
    }
}


