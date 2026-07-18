param()
$token = az account get-access-token --resource "https://management.azure.com/" --query accessToken -o tsv

$apis = @("risk-management-v1","audit-management-v1","compliance-tracking-v1","policy-management-v1","soa-management-v1","nonconformity-management-v1","asset-management-v1","incident-management-v1","customer-portal")
$methods = @(
    @{id="all-get"; method="GET"},
    @{id="all-post"; method="POST"},
    @{id="all-put"; method="PUT"},
    @{id="all-delete"; method="DELETE"},
    @{id="all-patch"; method="PATCH"},
    @{id="all-options"; method="OPTIONS"}
)

foreach ($apiId in $apis) {
    foreach ($m in $methods) {
        $body = @{ properties = @{ displayName = "All $($m.method)"; method = $m.method; urlTemplate = "/*" } } | ConvertTo-Json
        try {
            Invoke-RestMethod `
                -Uri "https://management.azure.com/subscriptions/4293867b-c6cb-4797-aa30-4f3ef1142c28/resourceGroups/rg-grc-exelcom-dev/providers/Microsoft.ApiManagement/service/apim-grc-exelcom-dev/apis/$apiId/operations/$($m.id)?api-version=2022-08-01" `
                -Method PUT `
                -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
                -Body $body | Out-Null
        } catch { Write-Host "⚠ $apiId/$($m.method): $($_.Exception.Message)" }
    }
    Write-Host "✅ $apiId"
}
Write-Host "✅ All APIM operations fixed"
