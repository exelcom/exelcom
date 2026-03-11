using GrcPlatform.PolicyManagement.Domain.Enums;
using GrcPlatform.Shared;

namespace GrcPlatform.PolicyManagement.Domain.Entities;

public class Policy : BaseAuditableEntity
{
    private readonly List<PolicyVersion> _versions = [];
    private readonly List<PolicyAttestation> _attestations = [];

    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public PolicyCategory Category { get; private set; }
    public PolicyStatus Status { get; private set; } = PolicyStatus.Draft;
    public string? Owner { get; private set; }
    public string? Department { get; private set; }
    public DateTime? ReviewDueDate { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public string? ApprovedBy { get; private set; }
    public bool RequiresAttestation { get; private set; }

    public IReadOnlyList<PolicyVersion> Versions => _versions.AsReadOnly();
    public IReadOnlyList<PolicyAttestation> Attestations => _attestations.AsReadOnly();
    public PolicyVersion? CurrentVersion => _versions.OrderByDescending(v => v.VersionNumber).FirstOrDefault();

    private Policy() { }

    public static Policy Create(string title, string description, PolicyCategory category,
        string content, string? owner, string? department, bool requiresAttestation,
        DateTime? reviewDueDate, string createdBy)
    {
        var policy = new Policy
        {
            Title = title, Description = description, Category = category,
            Owner = owner, Department = department, RequiresAttestation = requiresAttestation,
            ReviewDueDate = reviewDueDate, CreatedBy = createdBy
        };
        policy._versions.Add(PolicyVersion.Create(policy.Id, 1, content, "Initial version", createdBy));
        return policy;
    }

    public PolicyVersion AddVersion(string content, string changeNotes, string createdBy)
    {
        var nextVersion = (_versions.Max(v => (int?)v.VersionNumber) ?? 0) + 1;
        var version = PolicyVersion.Create(Id, nextVersion, content, changeNotes, createdBy);
        _versions.Add(version);
        Status = PolicyStatus.UnderReview;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = createdBy;
        return version;
    }

    public void Approve(string approvedBy)
    {
        Status = PolicyStatus.Approved;
        ApprovedAt = DateTime.UtcNow;
        ApprovedBy = approvedBy;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = approvedBy;
    }

    public void Publish(string publishedBy)
    {
        Status = PolicyStatus.Published;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = publishedBy;
    }

    public void Retire(string retiredBy)
    {
        Status = PolicyStatus.Retired;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = retiredBy;
    }

    public PolicyAttestation RequestAttestation(string userId, string userEmail, DateTime dueDate, string requestedBy)
    {
        var attestation = PolicyAttestation.Create(Id, userId, userEmail, dueDate, requestedBy);
        _attestations.Add(attestation);
        return attestation;
    }
}

public class PolicyVersion : BaseEntity
{
    public Guid PolicyId { get; private set; }
    public int VersionNumber { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public string ChangeNotes { get; private set; } = string.Empty;
    public string BlobUrl { get; private set; } = string.Empty;

    private PolicyVersion() { }

    public static PolicyVersion Create(Guid policyId, int version, string content,
        string changeNotes, string createdBy) => new()
    {
        PolicyId = policyId, VersionNumber = version, Content = content,
        ChangeNotes = changeNotes, CreatedBy = createdBy
    };
}

public class PolicyAttestation : BaseEntity
{
    public Guid PolicyId { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string UserEmail { get; private set; } = string.Empty;
    public AttestationStatus Status { get; private set; } = AttestationStatus.Pending;
    public DateTime DueDate { get; private set; }
    public DateTime? AttestedAt { get; private set; }
    public string? Notes { get; private set; }

    private PolicyAttestation() { }

    public static PolicyAttestation Create(Guid policyId, string userId, string userEmail,
        DateTime dueDate, string createdBy) => new()
    {
        PolicyId = policyId, UserId = userId, UserEmail = userEmail,
        DueDate = dueDate, Status = AttestationStatus.Pending, CreatedBy = createdBy
    };

    public void Attest(string notes)
    {
        Status = AttestationStatus.Attested;
        AttestedAt = DateTime.UtcNow;
        Notes = notes;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Decline(string reason)
    {
        Status = AttestationStatus.Declined;
        Notes = reason;
        UpdatedAt = DateTime.UtcNow;
    }
}
