using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GrcPlatform.IncidentManagement.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GrcPlatform.IncidentManagement.Infrastructure;

public sealed class GraphEmailOptions
{
    public string TenantId { get; set; } = default!;
    public string ClientId { get; set; } = default!;
    public string ClientSecret { get; set; } = default!;
    public string SenderEmail { get; set; } = default!;
    public string PortalUrl { get; set; } = default!;
}

public sealed class IncidentEmailService(GraphEmailOptions options, ILogger<IncidentEmailService> logger) : GrcPlatform.IncidentManagement.Application.IIncidentEmailService
{
    private static readonly HttpClient _http = new();

    // ── Token acquisition ─────────────────────────────────────────────────────

    private async Task<string?> GetAccessTokenAsync()
    {
        var url = $"https://login.microsoftonline.com/{options.TenantId}/oauth2/v2.0/token";
        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"]    = "client_credentials",
            ["client_id"]     = options.ClientId,
            ["client_secret"] = options.ClientSecret,
            ["scope"]         = "https://graph.microsoft.com/.default",
        });
        var resp = await _http.PostAsync(url, body);
        if (!resp.IsSuccessStatusCode) return null;
        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("access_token").GetString();
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var token = await GetAccessTokenAsync();
            if (token is null) { logger.LogWarning("Could not acquire Graph token — email not sent."); return; }

            var payload = new
            {
                message = new
                {
                    subject,
                    body = new { contentType = "HTML", content = htmlBody },
                    toRecipients = new[] { new { emailAddress = new { address = toEmail } } },
                    from = new { emailAddress = new { address = options.SenderEmail } },
                },
                saveToSentItems = true,
            };

            var request = new HttpRequestMessage(HttpMethod.Post,
                $"https://graph.microsoft.com/v1.0/users/{options.SenderEmail}/sendMail");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var resp = await _http.SendAsync(request);
            if (resp.IsSuccessStatusCode)
                logger.LogInformation("Email sent to {Email} — {Subject}", toEmail, subject);
            else
                logger.LogWarning("Graph sendMail failed: {Status} — {Body}", resp.StatusCode,
                    await resp.Content.ReadAsStringAsync());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    private string BaseTemplate(string title, string preheader, string bodyContent) => $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width"">
<title>{title}</title></head>
<body style=""margin:0;padding:0;background:#F4F6F9;font-family:system-ui,-apple-system,sans-serif;"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#F4F6F9;padding:32px 0;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"">
  <!-- Header -->
  <tr><td style=""background:#1A3A5C;padding:24px 32px;"">
    <table width=""100%""><tr>
      <td><span style=""font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;"">GRC PLATFORM</span><br>
      <span style=""font-size:11px;color:#A9C4E0;text-transform:uppercase;letter-spacing:1px;"">Exelcom Cybersecurity</span></td>
      <td align=""right""><span style=""font-size:11px;color:#A9C4E0;"">Incident Notification</span></td>
    </tr></table>
  </td></tr>
  <!-- Body -->
  <tr><td style=""padding:32px 32px 24px;"">
    {bodyContent}
  </td></tr>
  <!-- Footer -->
  <tr><td style=""background:#F4F6F9;padding:20px 32px;border-top:1px solid #E8EBF0;"">
    <p style=""margin:0;font-size:12px;color:#8A95A3;line-height:1.6;"">
      This is an automated notification from the Exelcom GRC Platform.<br>
      Please do not reply to this email. For queries contact <a href=""mailto:{options.SenderEmail}"" style=""color:#2E86C1;"">{options.SenderEmail}</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

    private static string SeverityColour(IncidentSeverity s) => s switch
    {
        IncidentSeverity.Critical => "#922B21",
        IncidentSeverity.High     => "#C0392B",
        IncidentSeverity.Medium   => "#935116",
        _                         => "#1E8449",
    };

    private static string StatusColour(IncidentStatus s) => s switch
    {
        IncidentStatus.New          => "#1A5276",
        IncidentStatus.Investigating=> "#935116",
        IncidentStatus.Contained    => "#6C3483",
        IncidentStatus.Resolved     => "#1E8449",
        IncidentStatus.Closed       => "#616A6B",
        _                           => "#888",
    };

    private string IncidentCard(string refNum, string title, IncidentSeverity severity,
        IncidentStatus status, string type, DateTimeOffset occurredAt, string? assignedTo) => $@"
<div style=""background:#F8F9FA;border-left:4px solid {SeverityColour(severity)};border-radius:6px;padding:16px 20px;margin:0 0 20px;"">
  <table width=""100%""><tr>
    <td><span style=""font-size:18px;font-weight:700;color:#1a1a1a;"">{title}</span></td>
    <td align=""right"" style=""white-space:nowrap;"">
      <span style=""background:{SeverityColour(severity)};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;"">{severity}</span>&nbsp;
      <span style=""background:{StatusColour(status)};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;"">{status}</span>
    </td>
  </tr></table>
  <table width=""100%"" style=""margin-top:12px;"">
    <tr>
      <td style=""font-size:12px;color:#717D7E;width:120px;"">Reference</td>
      <td style=""font-size:12px;color:#1a1a1a;font-weight:600;"">{refNum}</td>
    </tr>
    <tr>
      <td style=""font-size:12px;color:#717D7E;"">Type</td>
      <td style=""font-size:12px;color:#1a1a1a;"">{type}</td>
    </tr>
    <tr>
      <td style=""font-size:12px;color:#717D7E;"">Occurred</td>
      <td style=""font-size:12px;color:#1a1a1a;"">{occurredAt:dd MMM yyyy HH:mm} UTC</td>
    </tr>
    {(assignedTo is not null ? $@"<tr>
      <td style=""font-size:12px;color:#717D7E;"">Assigned to</td>
      <td style=""font-size:12px;color:#1a1a1a;"">{assignedTo}</td>
    </tr>" : "")}
  </table>
</div>";

    private string PortalButton() => $@"
<div style=""text-align:center;margin:24px 0 8px;"">
  <a href=""{options.PortalUrl}/incidents"" style=""background:#2E86C1;color:#fff;font-size:14px;font-weight:700;
    padding:12px 28px;border-radius:7px;text-decoration:none;display:inline-block;"">View in GRC Portal →</a>
</div>";

    // ── Public notification methods ───────────────────────────────────────────

    public Task SendIncidentReportedAsync(string toEmail, string customerName,
        string refNum, string title, IncidentSeverity severity, IncidentStatus status,
        string type, DateTimeOffset occurredAt, string? description)
    {
        var body = BaseTemplate($"Incident Reported — {refNum}", $"New incident {refNum} has been logged",
            $@"<h2 style=""margin:0 0 6px;font-size:22px;color:#1a1a1a;"">Incident Reported</h2>
            <p style=""margin:0 0 20px;font-size:14px;color:#717D7E;"">Dear {customerName},</p>
            <p style=""margin:0 0 20px;font-size:14px;color:#1a1a1a;line-height:1.6;"">
              We have logged the following security incident on your behalf. Our team has been notified and will begin investigation shortly.
            </p>
            {IncidentCard(refNum, title, severity, status, type, occurredAt, null)}
            {(description is not null ? $@"<p style=""font-size:13px;color:#717D7E;line-height:1.6;margin:0 0 16px;""><strong>Description:</strong> {description}</p>" : "")}
            {PortalButton()}");
        return SendAsync(toEmail, $"[{refNum}] Incident Reported — {title}", body);
    }

    public Task SendStatusChangedAsync(string toEmail, string customerName,
        string refNum, string title, IncidentSeverity severity, IncidentStatus newStatus,
        string type, DateTimeOffset occurredAt, string? assignedTo)
    {
        var body = BaseTemplate($"Incident Update — {refNum}", $"Incident {refNum} status updated to {newStatus}",
            $@"<h2 style=""margin:0 0 6px;font-size:22px;color:#1a1a1a;"">Incident Status Update</h2>
            <p style=""margin:0 0 20px;font-size:14px;color:#717D7E;"">Dear {customerName},</p>
            <p style=""margin:0 0 20px;font-size:14px;color:#1a1a1a;line-height:1.6;"">
              The status of your incident has been updated to
              <strong style=""color:{StatusColour(newStatus)}"">{newStatus}</strong>.
            </p>
            {IncidentCard(refNum, title, severity, newStatus, type, occurredAt, assignedTo)}
            {PortalButton()}");
        return SendAsync(toEmail, $"[{refNum}] Status Update: {newStatus} — {title}", body);
    }

    public Task SendActionAssignedAsync(string toEmail, string customerName,
        string refNum, string incidentTitle, string actionType, string actionDescription,
        string assignedTo, DateTimeOffset? dueDate)
    {
        var dueLine = dueDate.HasValue
            ? $@"<tr><td style=""font-size:12px;color:#717D7E;width:100px;"">Due date</td>
                 <td style=""font-size:12px;color:#C0392B;font-weight:600;"">{dueDate.Value:dd MMM yyyy}</td></tr>"
            : "";
        var body = BaseTemplate($"Action Required — {refNum}", $"Action assigned for incident {refNum}",
            $@"<h2 style=""margin:0 0 6px;font-size:22px;color:#1a1a1a;"">Action Required</h2>
            <p style=""margin:0 0 20px;font-size:14px;color:#717D7E;"">Dear {customerName},</p>
            <p style=""margin:0 0 20px;font-size:14px;color:#1a1a1a;line-height:1.6;"">
              A new action has been assigned in relation to incident <strong>{refNum} — {incidentTitle}</strong>.
            </p>
            <div style=""background:#FFF9F0;border-left:4px solid #935116;border-radius:6px;padding:16px 20px;margin:0 0 20px;"">
              <table width=""100%"">
                <tr><td style=""font-size:12px;color:#717D7E;width:100px;"">Action type</td>
                    <td style=""font-size:12px;color:#1a1a1a;font-weight:600;"">{actionType}</td></tr>
                <tr><td style=""font-size:12px;color:#717D7E;"">Description</td>
                    <td style=""font-size:13px;color:#1a1a1a;"">{actionDescription}</td></tr>
                <tr><td style=""font-size:12px;color:#717D7E;"">Assigned to</td>
                    <td style=""font-size:12px;color:#1a1a1a;"">{assignedTo}</td></tr>
                {dueLine}
              </table>
            </div>
            {PortalButton()}");
        return SendAsync(toEmail, $"[{refNum}] Action Required — {actionType}", body);
    }

    public Task SendPostIncidentReviewAsync(string toEmail, string customerName,
        string refNum, string incidentTitle, string summary, string rootCause,
        string lessonsLearned, string? recommendations, DateTimeOffset reviewedAt)
    {
        var recoLine = recommendations is not null
            ? $@"<tr><td colspan=""2"" style=""padding-top:8px;"">
                   <strong style=""font-size:12px;color:#717D7E;"">Recommendations</strong><br>
                   <span style=""font-size:13px;color:#1a1a1a;"">{recommendations}</span>
                 </td></tr>"
            : "";
        var body = BaseTemplate($"Post-Incident Review — {refNum}", $"Post-incident review completed for {refNum}",
            $@"<h2 style=""margin:0 0 6px;font-size:22px;color:#1a1a1a;"">Post-Incident Review</h2>
            <p style=""margin:0 0 20px;font-size:14px;color:#717D7E;"">Dear {customerName},</p>
            <p style=""margin:0 0 20px;font-size:14px;color:#1a1a1a;line-height:1.6;"">
              The post-incident review for <strong>{refNum} — {incidentTitle}</strong> has been completed on {reviewedAt:dd MMM yyyy}.
            </p>
            <div style=""background:#F0FBF4;border-left:4px solid #1E8449;border-radius:6px;padding:16px 20px;margin:0 0 20px;"">
              <table width=""100%"" style=""border-collapse:collapse;"">
                <tr><td style=""font-size:12px;color:#717D7E;width:130px;padding-bottom:8px;"">Summary</td>
                    <td style=""font-size:13px;color:#1a1a1a;padding-bottom:8px;"">{summary}</td></tr>
                <tr><td style=""font-size:12px;color:#717D7E;padding-bottom:8px;"">Root cause</td>
                    <td style=""font-size:13px;color:#1a1a1a;padding-bottom:8px;"">{rootCause}</td></tr>
                <tr><td style=""font-size:12px;color:#717D7E;padding-bottom:8px;"">Lessons learned</td>
                    <td style=""font-size:13px;color:#1a1a1a;padding-bottom:8px;"">{lessonsLearned}</td></tr>
                {recoLine}
              </table>
            </div>
            {PortalButton()}");
        return SendAsync(toEmail, $"[{refNum}] Post-Incident Review Completed — {incidentTitle}", body);
    }
}
