using GrcPlatform.ComplianceTracking.Domain.Entities;
using GrcPlatform.ComplianceTracking.Domain.Enums;
using GrcPlatform.ComplianceTracking.Domain.Interfaces;
using GrcPlatform.Shared;
using MediatR;

namespace GrcPlatform.ComplianceTracking.Application.Compliance.Commands;

// --- Commands ---
public record CreateFrameworkCommand(string Name, string Description,
    FrameworkType Type, string Version) : IRequest<FrameworkDto>;

public record UpdateControlImplementationCommand(Guid ControlId, ControlStatus Status,
    CompliancePosture Posture, string? Notes, string? Owner,
    DateTime? NextReviewDate) : IRequest<ControlDto>;

public record AddControlEvidenceCommand(Guid ControlId, string FileName,
    string BlobUrl, EvidenceType Type, string Description) : IRequest<EvidenceDto>;

// --- DTOs ---
public record FrameworkDto(Guid Id, string Name, string Description, string Type,
    string Version, bool IsActive, int TotalControls, int ImplementedControls,
    double CompliancePercentage, DateTime CreatedAt);

public record FrameworkSummaryDto(Guid Id, string Name, string Type, string Version,
    double CompliancePercentage, int TotalControls, int ImplementedControls);

public record ControlDto(Guid Id, Guid FrameworkId, string ControlId, string Title,
    string Description, string Status, string? Posture, string? Owner,
    string? ImplementationNotes, DateTime? LastAssessedAt, DateTime? NextReviewDate,
    List<EvidenceDto> Evidence);

public record ControlSummaryDto(Guid Id, string ControlId, string Title,
    string Status, string? Posture, string? Owner, DateTime? NextReviewDate);

public record EvidenceDto(Guid Id, string FileName, string BlobUrl,
    string Type, string Description, DateTime UploadedAt);

// --- Handlers ---
public class CreateFrameworkCommandHandler(IComplianceFrameworkRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<CreateFrameworkCommand, FrameworkDto>
{
    public async Task<FrameworkDto> Handle(CreateFrameworkCommand request, CancellationToken ct)
    {
        var framework = ComplianceFramework.Create(request.Name, request.Description,
            request.Type, request.Version, currentUser.UserId);
        await repository.AddAsync(framework, ct);
        await repository.SaveChangesAsync(ct);
        return framework.ToDto();
    }
}

public class UpdateControlImplementationCommandHandler(
    IComplianceControlRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<UpdateControlImplementationCommand, ControlDto>
{
    public async Task<ControlDto> Handle(UpdateControlImplementationCommand request, CancellationToken ct)
    {
        var control = await repository.GetByIdWithEvidenceAsync(request.ControlId, ct)
            ?? throw new KeyNotFoundException($"Control {request.ControlId} not found");

        control.UpdateImplementation(request.Status, request.Posture, request.Notes,
            request.Owner, request.NextReviewDate, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return control.ToDto();
    }
}

public class AddControlEvidenceCommandHandler(
    IComplianceControlRepository repository, ICurrentUserService currentUser)
    : IRequestHandler<AddControlEvidenceCommand, EvidenceDto>
{
    public async Task<EvidenceDto> Handle(AddControlEvidenceCommand request, CancellationToken ct)
    {
        var control = await repository.GetByIdWithEvidenceAsync(request.ControlId, ct)
            ?? throw new KeyNotFoundException($"Control {request.ControlId} not found");

        control.AddEvidence(request.FileName, request.BlobUrl, request.Type,
            request.Description, currentUser.UserId);
        await repository.SaveChangesAsync(ct);
        return control.Evidence.Last().ToDto();
    }
}

// --- Mapping ---
public static class ComplianceMappingExtensions
{
    public static FrameworkDto ToDto(this ComplianceFramework f) => new(
        f.Id, f.Name, f.Description, f.Type.ToString(), f.Version, f.IsActive,
        f.TotalControls, f.ImplementedControls, f.CompliancePercentage, f.CreatedAt);

    public static FrameworkSummaryDto ToSummaryDto(this ComplianceFramework f) => new(
        f.Id, f.Name, f.Type.ToString(), f.Version,
        f.CompliancePercentage, f.TotalControls, f.ImplementedControls);

    public static ControlDto ToDto(this ComplianceControl c) => new(
        c.Id, c.FrameworkId, c.ControlId, c.Title, c.Description,
        c.Status.ToString(), c.Posture?.ToString(), c.Owner,
        c.ImplementationNotes, c.LastAssessedAt, c.NextReviewDate,
        c.Evidence.Select(e => e.ToDto()).ToList());

    public static ControlSummaryDto ToSummaryDto(this ComplianceControl c) => new(
        c.Id, c.ControlId, c.Title, c.Status.ToString(),
        c.Posture?.ToString(), c.Owner, c.NextReviewDate);

    public static EvidenceDto ToDto(this ControlEvidence e) => new(
        e.Id, e.FileName, e.BlobUrl, e.Type.ToString(), e.Description, e.UploadedAt);
}
