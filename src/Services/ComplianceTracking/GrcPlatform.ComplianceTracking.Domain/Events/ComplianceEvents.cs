using GrcPlatform.ComplianceTracking.Domain.Enums;
namespace GrcPlatform.ComplianceTracking.Domain.Events;
public interface IDomainEvent { Guid EventId { get; } DateTime OccurredAt { get; } }
public record ControlStatusChangedEvent(Guid ControlId, Guid FrameworkId, ControlStatus PreviousStatus, ControlStatus NewStatus, string ChangedBy) : IDomainEvent
{ public Guid EventId { get; } = Guid.NewGuid(); public DateTime OccurredAt { get; } = DateTime.UtcNow; }
