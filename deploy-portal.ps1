Write-Host "▶  Building & publishing..." -ForegroundColor Cyan
$proj = "src\Services\CustomerPortal\GrcPlatform.CustomerPortal.API\GrcPlatform.CustomerPortal.API.csproj"
dotnet publish $proj `
    --configuration Release `
    --output publish\portal `
    --runtime linux-x64 `
    --self-contained false
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "▶  Zipping artefact..." -ForegroundColor Cyan
Compress-Archive -Path publish\portal\* -DestinationPath publish\portal.zip -Force

Write-Host "▶  Deploying to Azure App Service: app-portal-grc-exelcom-dev ..." -ForegroundColor Cyan
az webapp deploy `
    --resource-group rg-grc-exelcom-dev `
    --name app-portal-grc-exelcom-dev `
    --src-path publish\portal.zip `
    --type zip `
    --async false

Write-Host "✅  Deployment complete." -ForegroundColor Green
Write-Host "    Swagger UI: https://app-portal-grc-exelcom-dev.azurewebsites.net/swagger" -ForegroundColor Gray
