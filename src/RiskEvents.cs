using GrcPlatform.RiskManagement.Domain.Enums;

namespace GrcPlatform.RiskManagement.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record RiskCreatedEvent(Guid RiskId, string Title, string CreatedBy) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record RiskStatusChangedEvent(Guid RiskId, RiskStatus NewStatus, string Reason, string ChangedBy) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
