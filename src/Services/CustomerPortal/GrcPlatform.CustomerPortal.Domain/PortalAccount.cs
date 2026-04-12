namespace GrcPlatform.CustomerPortal.Domain;

public sealed class PortalAccount
{
    public Guid Id { get; private set; }
    public string Username { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;

    // CRM linkage
    public string CrmCustomerId { get; private set; } = default!;

    // GRC linkage (matches CustomerId in all other services)
    public string GrcCustomerId { get; private set; } = default!;
    public string CustomerName { get; private set; } = default!;

    // Parent/child hierarchy
    public string? ParentGrcCustomerId { get; private set; }

    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? LastLoginAt { get; private set; }
    // MFA
    public string? TotpSecret { get; private set; }
    public bool TotpEnabled { get; private set; }
    public DateTimeOffset? TotpEnabledAt { get; private set; }

    private PortalAccount() { }

    public static PortalAccount Create(
        string username, string passwordHash,
        string crmCustomerId, string grcCustomerId, string customerName,
        string? parentGrcCustomerId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        ArgumentException.ThrowIfNullOrWhiteSpace(crmCustomerId);
        ArgumentException.ThrowIfNullOrWhiteSpace(grcCustomerId);
        ArgumentException.ThrowIfNullOrWhiteSpace(customerName);
        return new PortalAccount
        {
            Id = Guid.NewGuid(),
            Username = username.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            CrmCustomerId = crmCustomerId.Trim(),
            GrcCustomerId = grcCustomerId.Trim(),
            CustomerName = customerName.Trim(),
            ParentGrcCustomerId = string.IsNullOrWhiteSpace(parentGrcCustomerId) ? null : parentGrcCustomerId.Trim(),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    public void UpdateDetails(string customerName, string crmCustomerId, string? parentGrcCustomerId)
    {
        CustomerName = customerName.Trim();
        CrmCustomerId = crmCustomerId.Trim();
        ParentGrcCustomerId = string.IsNullOrWhiteSpace(parentGrcCustomerId) ? null : parentGrcCustomerId.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetActive(bool active)
    {
        IsActive = active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetupTotp(string secret)
    {
        TotpSecret = secret;
        TotpEnabled = false;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void EnableTotp()
    {
        TotpEnabled = true;
        TotpEnabledAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void DisableTotp()
    {
        TotpSecret = null;
        TotpEnabled = false;
        TotpEnabledAt = null;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    public void RecordLogin()
    {
        LastLoginAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public interface IPortalAccountRepository
{
    Task<PortalAccount?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PortalAccount?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<IReadOnlyList<PortalAccount>> ListAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PortalAccount>> GetChildAccountsAsync(string parentGrcCustomerId, CancellationToken ct = default);
    Task AddAsync(PortalAccount account, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task DeleteAsync(PortalAccount account, CancellationToken ct = default);
}

