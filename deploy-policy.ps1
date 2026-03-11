#!/usr/bin/env pwsh
# deploy-policy.ps1

param(
    [string]$ResourceGroup  = "rg-grc-exelcom-dev",
    [string]$AppServiceName = "app-policy-grc-exelcom-dev",
    [string]$ProjectPath    = "src\Services\PolicyManagement\GrcPlatform.PolicyManagement.API\GrcPlatform.PolicyManagement.API.csproj",
    [string]$PublishDir     = "publish\policy"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "▶  Building & publishing..." -ForegroundColor Cyan
dotnet publish $ProjectPath `
    --configuration Release `
    --output $PublishDir `
    --runtime linux-x64 `
    --self-contained false

Write-Host "▶  Zipping artefact..." -ForegroundColor Cyan
$ZipPath = "publish\policy.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
Compress-Archive -Path "$PublishDir\*" -DestinationPath $ZipPath

Write-Host "▶  Deploying to Azure App Service: $AppServiceName ..." -ForegroundColor Cyan
az webapp deploy `
    --resource-group $ResourceGroup `
    --name           $AppServiceName `
    --src-path       $ZipPath `
    --type           zip `
    --async          false

Write-Host "✅  Deployment complete." -ForegroundColor Green
Write-Host "    Swagger UI: https://$AppServiceName.azurewebsites.net" -ForegroundColor DarkGray
