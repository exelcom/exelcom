using System.IdentityModel.Tokens.Jwt;
using OtpNet;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GrcPlatform.CustomerPortal.Domain;
using Microsoft.IdentityModel.Tokens;

namespace GrcPlatform.CustomerPortal.Application;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public sealed record PortalAccountDto(
    Guid Id, string Username, string CrmCustomerId,
    string GrcCustomerId, string CustomerName,
    string? ParentGrcCustomerId, bool IsActive,
    DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt);

public sealed record LoginRequest(string Username, string Password);

public sealed record LoginResponse(
    Guid AccountId, string Token, string Username, string CustomerName,
    string GrcCustomerId, IReadOnlyList<string> CustomerScope,
    bool MfaRequired, bool MfaEnabled);

public sealed record CreateAccountRequest(
    string Username, string Password,
    string CrmCustomerId, string GrcCustomerId, string CustomerName,
    string? ParentGrcCustomerId);

public sealed record UpdateAccountRequest(
    string CustomerName, string CrmCustomerId, string? ParentGrcCustomerId);

public sealed record ChangePasswordRequest(string NewPassword);
public sealed record SetActiveRequest(bool IsActive);
public sealed record MfaSetupResponse(string Secret, string QrCodeUrl, string ManualEntryKey);
public sealed record MfaVerifyRequest(string Code);
public sealed record MfaValidateRequest(string Username, string Code);
public sealed record MfaStatusResponse(bool Enabled, DateTimeOffset? EnabledAt);

// ── Auth options ──────────────────────────────────────────────────────────────

public sealed class JwtOptions
{
    public string Secret { get; set; } = default!;
    public string Issuer { get; set; } = "grc-platform";
    public string Audience { get; set; } = "grc-customer-portal";
    public int ExpiryHours { get; set; } = 8;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

public sealed class PortalHandlers(IPortalAccountRepository repo, JwtOptions jwt)
{
    // ── Auth ──────────────────────────────────────────────────────────────────

    public async Task<LoginResponse?> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var account = await repo.GetByUsernameAsync(req.Username.ToLowerInvariant().Trim(), ct);
        if (account is null || !account.IsActive) return null;
        if (!VerifyPassword(req.Password, account.PasswordHash)) return null;

        // Build customer scope — include own ID plus all child IDs
        var childAccounts = await repo.GetChildAccountsAsync(account.GrcCustomerId, ct);
        var scope = new List<string> { account.GrcCustomerId };
        scope.AddRange(childAccounts.Select(c => c.GrcCustomerId));

        account.RecordLogin();
        await repo.SaveChangesAsync(ct);

        var token = GenerateToken(account, scope);
        return new LoginResponse(account.Id, token, account.Username, account.CustomerName,
            account.GrcCustomerId, scope.AsReadOnly(),
            MfaRequired: false, MfaEnabled: account.TotpEnabled);
    }

    // ── Account management (admin only) ──────────────────────────────────────

    public async Task<PortalAccountDto> CreateAccountAsync(CreateAccountRequest req, CancellationToken ct = default)
    {
        var existing = await repo.GetByUsernameAsync(req.Username.ToLowerInvariant().Trim(), ct);
        if (existing is not null)
            throw new InvalidOperationException($"Username '{req.Username}' is already taken.");

        var hash = HashPassword(req.Password);
        var account = PortalAccount.Create(req.Username, hash, req.CrmCustomerId,
            req.GrcCustomerId, req.CustomerName, req.ParentGrcCustomerId);
        await repo.AddAsync(account, ct);
        await repo.SaveChangesAsync(ct);
        return account.ToDto();
    }

    public async Task<PortalAccountDto> UpdateAccountAsync(Guid id, UpdateAccountRequest req, CancellationToken ct = default)
    {
        var account = await RequireAsync(id, ct);
        account.UpdateDetails(req.CustomerName, req.CrmCustomerId, req.ParentGrcCustomerId);
        await repo.SaveChangesAsync(ct);
        return account.ToDto();
    }

    public async Task ChangePasswordAsync(Guid id, ChangePasswordRequest req, CancellationToken ct = default)
    {
        var account = await RequireAsync(id, ct);
        account.UpdatePassword(HashPassword(req.NewPassword));
        await repo.SaveChangesAsync(ct);
    }

    public async Task SetActiveAsync(Guid id, bool active, CancellationToken ct = default)
    {
        var account = await RequireAsync(id, ct);
        account.SetActive(active);
        await repo.SaveChangesAsync(ct);
    }

    public async Task DeleteAccountAsync(Guid id, CancellationToken ct = default)
    {
        var account = await RequireAsync(id, ct);
        await repo.DeleteAsync(account, ct);
        await repo.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<PortalAccountDto>> ListAccountsAsync(CancellationToken ct = default)
    {
        var accounts = await repo.ListAsync(ct);
        return accounts.Select(a => a.ToDto()).ToList();
    }

    public async Task<PortalAccountDto?> GetAccountAsync(Guid id, CancellationToken ct = default)
    {
        var account = await repo.GetByIdAsync(id, ct);
        return account?.ToDto();
    }

    // ── MFA ──────────────────────────────────────────────────────────────────
    public async Task<MfaSetupResponse> SetupMfaAsync(Guid accountId, CancellationToken ct = default)
    {
        var account = await RequireAsync(accountId, ct);
        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);
        account.SetupTotp(secret);
        await repo.SaveChangesAsync(ct);
        var issuer = Uri.EscapeDataString("Exelcom GRC Portal");
        var label = Uri.EscapeDataString(account.Username);
        var otpUri = $"otpauth://totp/{issuer}:{label}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30";
        var qrCodeUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={Uri.EscapeDataString(otpUri)}";
        return new MfaSetupResponse(secret, qrCodeUrl, secret);
    }

    public async Task<bool> VerifyAndEnableMfaAsync(Guid accountId, string code, CancellationToken ct = default)
    {
        var account = await RequireAsync(accountId, ct);
        if (string.IsNullOrEmpty(account.TotpSecret)) return false;
        var secretBytes = Base32Encoding.ToBytes(account.TotpSecret);
        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(code.Trim(), out _, new VerificationWindow(1, 1))) return false;
        account.EnableTotp();
        await repo.SaveChangesAsync(ct);
        return true;
    }

    public async Task DisableMfaAsync(Guid accountId, CancellationToken ct = default)
    {
        var account = await RequireAsync(accountId, ct);
        account.DisableTotp();
        await repo.SaveChangesAsync(ct);
    }

    public async Task<MfaStatusResponse> GetMfaStatusAsync(Guid accountId, CancellationToken ct = default)
    {
        var account = await RequireAsync(accountId, ct);
        return new MfaStatusResponse(account.TotpEnabled, account.TotpEnabledAt);
    }

    public bool ValidateTotp(string username, string code)
    {
        var account = repo.GetByUsernameAsync(username.ToLowerInvariant().Trim()).GetAwaiter().GetResult();
        if (account is null || !account.TotpEnabled || string.IsNullOrEmpty(account.TotpSecret)) return false;
        var secretBytes = Base32Encoding.ToBytes(account.TotpSecret);
        var totp = new Totp(secretBytes);
        return totp.VerifyTotp(code.Trim(), out _, new VerificationWindow(1, 1));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<PortalAccount> RequireAsync(Guid id, CancellationToken ct)
        => await repo.GetByIdAsync(id, ct)
           ?? throw new KeyNotFoundException($"Portal account {id} not found.");

    private string GenerateToken(PortalAccount account, IEnumerable<string> scope)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, account.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, account.Username),
            new("customer_name", account.CustomerName),
            new("grc_customer_id", account.GrcCustomerId),
            new("crm_customer_id", account.CrmCustomerId),
            new("customer_scope", string.Join(",", scope)),
            new(ClaimTypes.Role, "GRC.Viewer"),
        };
        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(jwt.ExpiryHours),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;
        var salt = Convert.FromBase64String(parts[0]);
        var expectedHash = Convert.FromBase64String(parts[1]);
        var actualHash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
    }
}

file static class PortalMappingExtensions
{
    internal static PortalAccountDto ToDto(this PortalAccount a) => new(
        a.Id, a.Username, a.CrmCustomerId, a.GrcCustomerId, a.CustomerName,
        a.ParentGrcCustomerId, a.IsActive, a.CreatedAt, a.LastLoginAt);
}



