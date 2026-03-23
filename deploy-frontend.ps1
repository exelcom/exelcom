#!/usr/bin/env pwsh
# deploy-frontend.ps1
param(
    [string]$AppLocation  = "src\Frontend\grc-portal",
    [string]$OutputLocation = "dist",
    [string]$DeploymentToken = "7a12737d90c5d5fa528ae16a43b4b24d2130a0828f11f8e1a4104ec6f358755704-b77b96b4-21c6-46f0-a7ee-4fca13990a87000102102956c400"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "▶  Installing dependencies..." -ForegroundColor Cyan
Push-Location $AppLocation
npm install

Write-Host "▶  Building..." -ForegroundColor Cyan
npm run build
Pop-Location

Write-Host "▶  Deploying to Azure Static Web App..." -ForegroundColor Cyan
npx @azure/static-web-apps-cli deploy `
    "$AppLocation\$OutputLocation" `
    --deployment-token $DeploymentToken `
    --env production

Write-Host "✅  Deployment complete." -ForegroundColor Green
Write-Host "    URL: https://red-pond-02956c400.4.azurestaticapps.net" -ForegroundColor DarkGray
