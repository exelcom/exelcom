# Create SQL database for portal
Write-Host "Creating PortalDb..." -ForegroundColor Cyan
az sql db create `
    --resource-group rg-grc-exelcom-dev `
    --server sql-grc-exelcom-dev `
    --name PortalDb `
    --edition Basic `
    --capacity 5

# Create App Service
Write-Host "Creating App Service..." -ForegroundColor Cyan
az webapp create `
    --resource-group rg-grc-exelcom-dev `
    --plan asp-risk-grc-exelcom-dev `
    --name app-portal-grc-exelcom-dev `
    --runtime "DOTNETCORE:8.0"

# Configure app settings
Write-Host "Configuring app settings..." -ForegroundColor Cyan
az webapp config appsettings set `
    --resource-group rg-grc-exelcom-dev `
    --name app-portal-grc-exelcom-dev `
    --settings `
    "ASPNETCORE_ENVIRONMENT=Production" `
    "Jwt__Secret=GRC-Portal-JWT-Secret-Key-2026-Exelcom-Cybersecurity!" `
    "Jwt__Issuer=grc-platform" `
    "Jwt__Audience=grc-customer-portal" `
    "Jwt__ExpiryHours=8"

# Set connection string
az webapp config connection-string set `
    --resource-group rg-grc-exelcom-dev `
    --name app-portal-grc-exelcom-dev `
    --connection-string-type SQLAzure `
    --settings PortalDb="Server=tcp:sql-grc-exelcom-dev.database.windows.net,1433;Database=PortalDb;Authentication=Active Directory Managed Identity;"

# Enable Always On
az webapp config set `
    --resource-group rg-grc-exelcom-dev `
    --name app-portal-grc-exelcom-dev `
    --always-on true

# Register in APIM
Write-Host "Registering in APIM..." -ForegroundColor Cyan
az apim api create `
    --resource-group rg-grc-exelcom-dev `
    --service-name apim-grc-exelcom-dev `
    --api-id customer-portal `
    --display-name "Customer Portal" `
    --path portal `
    --service-url "https://app-portal-grc-exelcom-dev.azurewebsites.net" `
    --protocols https

Write-Host "✅  Infrastructure ready." -ForegroundColor Green
Write-Host "    App Service: app-portal-grc-exelcom-dev" -ForegroundColor Gray
Write-Host "    APIM path:   /portal" -ForegroundColor Gray
