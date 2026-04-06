# Exelcom GRC Platform — Technical Documentation

> **Version:** 1.0 | **Date:** April 2026 | **Classification:** Confidential  
> **Owner:** Sam Kawtharani | **Standard:** ISO/IEC 27001:2022

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture](#2-platform-architecture)
3. [Microservices](#3-microservices)
4. [Authentication & Access Control](#4-authentication--access-control)
5. [Frontend Application](#5-frontend-application)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Policy Template Library](#7-policy-template-library)
8. [Cost Management](#8-cost-management)
9. [Operational Procedures](#9-operational-procedures)
10. [Key Technical Decisions & Learnings](#10-key-technical-decisions--learnings)
11. [Contacts & Support](#11-contacts--support)

---

## 1. Executive Summary

Exelcom has designed and deployed a cloud-native Governance, Risk and Compliance (GRC) platform to support its ISO/IEC 27001:2022 certification journey. The platform provides a centralised, integrated system for managing information security risks, compliance obligations, policies, audits, assets, incidents, and the Statement of Applicability (SoA).

The platform is hosted entirely on Microsoft Azure, leveraging cloud-native services including Azure App Service, Azure SQL Database, Azure API Management (APIM), Azure Static Web Apps, Azure Active Directory (Entra ID), and Azure Key Vault. All services use Managed Identity for secure, passwordless database authentication.

**Platform URLs:**
- **Internal GRC Portal:** https://portal.exelcom.au
- **Customer Portal:** https://portal.exelcom.au/customer-portal

### 1.1 Platform Highlights

- 9 microservices covering all major GRC domains
- Role-based access control via Azure Active Directory (Entra ID)
- ISO/IEC 27001:2022 aligned across all modules
- Customer Portal for external client incident and asset visibility
- CI/CD pipeline via GitHub Actions with automated deployment
- Policy template library with 8 pre-built ISO 27001:2022 templates
- Estimated monthly cost: ~AUD $108/month

---

## 2. Platform Architecture

### 2.1 Architecture Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (TypeScript), Vite, MSAL, Azure Static Web Apps |
| API Gateway | Azure API Management (APIM) |
| Backend | .NET 8 Microservices, Clean Architecture, Entity Framework Core |
| Database | Azure SQL Database (per-service, private endpoint) |
| Authentication | Azure Active Directory (Entra ID), MSAL, JWT |
| Identity | Azure Managed Identity (passwordless SQL auth) |
| DNS / CDN | Cloudflare (DNS only), Azure Static Web Apps CDN |
| Secrets | Azure Key Vault, App Service Configuration |
| Monitoring | Azure Monitor, Log Analytics, Defender for Cloud |

### 2.2 Network Architecture

- All backend services are deployed to Azure App Service on a shared B1 App Service Plan (`asp-risk-grc-exelcom-dev`)
- The Customer Portal runs on a dedicated B1 App Service Plan (`asp-portal-grc-exelcom-dev`)
- Azure SQL databases are accessible only via private endpoint within `vnet-grc-exelcom-dev`
- APIM acts as the single entry point for all internal API calls from the frontend
- JWT validation is performed at the APIM layer; services do not re-validate tokens
- All services authenticate to SQL using Azure Managed Identity — no passwords required

### 2.3 Key Infrastructure References

| Resource | Value |
|----------|-------|
| Resource Group | `rg-grc-exelcom-dev` |
| Subscription | `29e1b3cb-7f50-4adc-b1bf-c360ec3197bb` |
| APIM | `apim-grc-exelcom-dev.azure-api.net` |
| SQL Server | `sql-grc-exelcom-dev.database.windows.net` |
| Static Web App | `stapp-grc-exelcom-dev` |
| Static Web App URL | `red-pond-02956c400.4.azurestaticapps.net` |
| Custom Domain | `portal.exelcom.au` |
| VNet | `vnet-grc-exelcom-dev` / `snet-apps` |
| App Registration (Client ID) | `bdad94d8-0d57-4e6b-a0b3-25f6680c1598` |
| App Registration (Object ID) | `6b07ca9e-93f4-4cda-99e8-2b5655c3b0bc` |
| Tenant ID | `97fdd37b-3579-4f71-9370-c7683719594f` |

---

## 3. Microservices

### 3.1 Service Inventory

| Service | App Service | Database | Status |
|---------|-------------|----------|--------|
| Risk Management | `app-risk-grc-exelcom-dev` | RiskDb | ✅ Running |
| Compliance Tracking | `app-compliance-grc-exelcom-dev` | ComplianceDb | ✅ Running |
| Policy Management | `app-policy-grc-exelcom-dev` | PolicyDb | ✅ Running |
| Audit Management | `app-audit-grc-exelcom-dev` | AuditDb | ✅ Running |
| Statement of Applicability | `app-soa-grc-exelcom-dev` | SoaDb | ✅ Running |
| NC & Corrective Actions | `app-nonconformity-grc-exelcom-dev` | NcDb | ✅ Running |
| Asset Inventory | `app-asset-grc-exelcom-dev` | AssetDb | ✅ Running |
| Incident Management | `app-incident-grc-exelcom-dev` | IncidentDb | ✅ Running |
| Customer Portal | `app-portal-grc-exelcom-dev` | PortalDb | ✅ Running |

### 3.2 Service Architecture Pattern

Each microservice follows the **Clean Architecture** pattern with four layers:

- **Domain** — Entities, value objects, domain events
- **Application** — CQRS handlers, validators, service interfaces
- **Infrastructure** — EF Core DbContext, repositories, external integrations
- **API** — Controllers, middleware, Program.cs configuration

All services use Entity Framework Core with Azure AD Managed Identity for SQL authentication. Connection strings use the format:

```
Server=sql-grc-exelcom-dev.database.windows.net;Database={DbName};Authentication=Active Directory Managed Identity;
```

### 3.3 Customer Portal

The Customer Portal is a separate service allowing external clients to view their incidents, assets, and compliance status. It uses JWT-based authentication (not Azure AD).

| Setting | Value |
|---------|-------|
| Backend App Service | `app-portal-grc-exelcom-dev` |
| App Service Plan | `asp-portal-grc-exelcom-dev` (dedicated B1) |
| Frontend Route | `/customer-portal` |
| Auth | Username/password with JWT |
| Customer Account | username=`exelcom.portal`, grcCustomerId=`E` |
| Contact Email | grc@exelcom.au |

---

## 4. Authentication & Access Control

### 4.1 Internal Staff Authentication

Internal staff authenticate via Azure Active Directory (Entra ID) using Microsoft accounts. The frontend uses MSAL to obtain JWT tokens, which are validated by APIM before forwarding requests to backend services.

**Authentication flow:** User → MSAL → Azure AD → JWT → APIM → Backend

- Token validation: Performed at APIM layer using `validate-jwt` policy
- Redirect URIs: `https://portal.exelcom.au`, `https://red-pond-02956c400.4.azurestaticapps.net`

### 4.2 App Roles

| Role | Value | Access |
|------|-------|--------|
| GRC Administrator | `GRC.Admin` | Full access to all modules — create, edit, delete |
| Risk Manager | `GRC.RiskManager` | Manage risks — create, edit, delete in Risk module |
| Compliance Officer | `GRC.ComplianceOfficer` | Manage compliance frameworks and controls |
| Policy Manager | `GRC.PolicyManager` | Manage policies — create, edit, delete in Policy module |
| Auditor | `GRC.Auditor` | Manage audits — create, edit, delete in Audit module |
| GRC Viewer | `GRC.Viewer` | Read-only access across all modules |

### 4.3 Azure AD Groups

| Group | Group ID | App Role |
|-------|----------|----------|
| GRC-Admins | `15831808-9fde-4c0e-9715-76512122ac61` | GRC.Admin |
| GRC-RiskManagers | `4b17702e-597e-4a77-82a0-c3882a15b2eb` | GRC.RiskManager |
| GRC-ComplianceOfficers | `6af40d63-a6af-4778-bb3d-18e33b0f2066` | GRC.ComplianceOfficer |
| GRC-PolicyManagers | `579df179-17aa-45cc-ab27-89690009a56b` | GRC.PolicyManager |
| GRC-Auditors | `6d464f70-b7ee-482b-9a3f-8977161952ed` | GRC.Auditor |
| GRC-Viewers | `b1f69990-b7e4-442a-9fa9-e9e2184d6e05` | GRC.Viewer |

**To add a user to a group:**
```powershell
az ad group member add --group <group-id> --member-id <user-object-id>
```

### 4.4 External Users (Auditors)

External auditors can be invited as Azure AD B2B Guest Users:

```powershell
az ad invitation create \
  --invited-user-email-address auditor@firm.com \
  --invite-redirect-url https://portal.exelcom.au \
  --send-invitation-message true
```

Once they accept, add them to the `GRC-Auditors` or `GRC-Viewers` group. Remove when the audit is complete.

---

## 5. Frontend Application

### 5.1 Technology Stack

| Technology | Details |
|-----------|---------|
| Framework | React 18 with TypeScript |
| Build Tool | Vite 7 |
| Auth | MSAL (`@azure/msal-react`, `@azure/msal-browser`) |
| State/Data | TanStack Query (React Query) |
| HTTP Client | Axios |
| Hosting | Azure Static Web Apps |

### 5.2 Frontend Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | GRC score overview, summary cards for all 8 modules |
| Risk Management | `/risks` | Risk register, risk scoring, risk treatment |
| Compliance | `/compliance` | Compliance frameworks, control tracking |
| Policy Management | `/policies` | Policy lifecycle, template library |
| Audit Management | `/audits` | Audit planning, findings, reports |
| Statement of Applicability | `/soa` | ISO 27001 Annex A controls applicability |
| NC & Corrective Actions | `/nonconformities` | Nonconformity tracking, RCA, corrective actions |
| Asset Inventory | `/assets` | IT asset register, risk ratings |
| Incident Management | `/incidents` | Security incident lifecycle management |
| Customer Portal | `/customer-portal` | External customer view of their incidents/assets |

### 5.3 Deployment

- **Source:** `C:\Projects\grc-platform\src\Frontend\grc-portal\`
- **Deploy script:** `deploy-frontend.ps1`
- **Static Web App config:** `public/staticwebapp.config.json` (navigationFallback for SPA routing)
- **Custom domain:** `portal.exelcom.au` (CNAME in Cloudflare, DNS only — not proxied)

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions

The platform uses GitHub Actions for automated build and deployment on every push to `main`.

- **Repository:** https://github.com/exelcom/exelcom
- **Workflow:** `.github/workflows/github-actions.yml`
- **Build:** All 9 .NET services + React frontend built in parallel
- **Deploy:** All services deployed to Azure App Service using `azure/webapps-deploy@v3`
- **Retry logic:** 30-second wait + automatic retry on transient 503 errors
- **Frontend:** Deployed to Azure Static Web Apps using `Azure/static-web-apps-deploy@v1`

### 6.2 Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `AZURE_CREDENTIALS` | Service principal credentials for Azure CLI authentication |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token for Azure Static Web Apps |

### 6.3 Manual Deployment Scripts

| Script | Service |
|--------|---------|
| `deploy-frontend.ps1` | React frontend |
| `deploy-risk.ps1` | Risk Management |
| `deploy-compliance.ps1` | Compliance Tracking |
| `deploy-policy.ps1` | Policy Management |
| `deploy-audit.ps1` | Audit Management |
| `deploy-soa.ps1` | Statement of Applicability |
| `deploy-nonconformity.ps1` | NC & Corrective Actions |
| `deploy-asset.ps1` | Asset Inventory |
| `deploy-incident.ps1` | Incident Management |
| `deploy-portal.ps1` | Customer Portal |

---

## 7. Policy Template Library

The platform includes 8 pre-built ISO/IEC 27001:2022 policy templates accessible from the Policy Management module via the **📋 Templates** button.

| Template | ISO Clause | Category | Attestation Required |
|----------|-----------|----------|---------------------|
| ISMS Policy | Clause 5.2 | Information Security | Yes |
| Access Control Policy | Annex A 5.15–5.18 | Information Security | Yes |
| Incident Management Policy | Annex A 5.24–5.28 | Information Security | Yes |
| Information Classification Policy | Annex A 5.12–5.13 | Data Privacy | Yes |
| Acceptable Use Policy | Annex A 5.10 | Operational | Yes |
| Business Continuity Policy | Annex A 5.29–5.30 | Business Continuity | No |
| Privacy Policy (Internal) | Annex A 5.34 | Data Privacy | Yes |
| Supplier Security Policy | Annex A 5.19–5.22 | Information Security | No |

**Template files:**
- `src/Frontend/grc-portal/src/data/PolicyTemplates.ts`
- `src/Frontend/grc-portal/src/components/PolicyTemplateModal.tsx`

---

## 8. Cost Management

### 8.1 Estimated Monthly Costs (AUD)

| Resource | SKU / Tier | Est. Monthly Cost |
|----------|-----------|-------------------|
| App Service Plan (8 services) | B1 (1 core, 1.75 GB RAM) | ~$25/month |
| App Service Plan (Portal) | B1 (dedicated) | ~$25/month |
| Azure SQL Databases (9×) | Basic (5 DTU each) | ~$50/month |
| Azure API Management | Consumption tier | ~$0–5/month |
| Azure Static Web Apps | Free tier | $0/month |
| Azure Key Vault | Standard | ~$2/month |
| Log Analytics / Monitor | Pay-per-use | ~$5/month |
| **TOTAL** | | **~$107–112/month** |

---

## 9. Operational Procedures

### 9.1 Adding a New Internal User

1. Determine the appropriate role (see Section 4.2)
2. Get the user's Azure AD object ID:
   ```powershell
   az ad user show --id user@exelcom.net.au --query id -o tsv
   ```
3. Add them to the appropriate group:
   ```powershell
   az ad group member add --group <group-id> --member-id <user-id>
   ```
4. User signs in at https://portal.exelcom.au with their Microsoft account

### 9.2 Adding an External Auditor

```powershell
# Invite the auditor
az ad invitation create \
  --invited-user-email-address auditor@firm.com \
  --invite-redirect-url https://portal.exelcom.au \
  --send-invitation-message true

# After they accept, add to group
$guestId = az ad user show --id "auditor_firm.com#EXT#@exelcom.onmicrosoft.com" --query id -o tsv
az ad group member add --group "6d464f70-b7ee-482b-9a3f-8977161952ed" --member-id $guestId
```

### 9.3 Service Recovery

If a service fails after deployment:
1. Run the individual deploy script: `powershell -ExecutionPolicy Bypass -File .\deploy-<service>.ps1`
2. Check App Service logs: Azure Portal → App Service → Log Stream
3. Verify Managed Identity SQL permissions if database connection fails

### 9.4 Database Access

All databases use Azure AD-only authentication with private endpoint. Direct SQL access requires:
- Azure AD account with appropriate SQL role (`db_datareader`, `db_datawriter`, `db_ddladmin`)
- Azure Data Studio or SSMS with Azure AD authentication
- VPN or Azure Bastion for private endpoint access

### 9.5 Updating APIM CORS Policy

When adding a new frontend domain:
```powershell
$token = az account get-access-token --query accessToken -o tsv
# Update policy via REST API (see deployment session notes for full command)
```

---

## 10. Key Technical Decisions & Learnings

| Topic | Decision / Learning |
|-------|---------------------|
| SQL Authentication | Use .NET `SqlConnection` with Azure AD access token to grant MI permissions — `sqlcmd` has a 128-char password limit issue |
| MSAL / Azure AD SPA | App registration requires **SPA platform** (not Web) to avoid `AADSTS9002326` cross-origin token errors |
| APIM JWT Policy | Use `&quot;` for C# string literals inside `condition` attributes in APIM policy XML |
| Risk Management API | Requires `Api-Version: v1` header due to version set configuration in APIM |
| AddMicrosoftIdentityWebApi | Crashes on startup when AzureAd config is incomplete — removed from all services; JWT validation done at APIM |
| Cloudflare + Azure SWA | Cloudflare proxy (orange cloud) blocks Azure Static Web App domain validation — must use **DNS only** (grey cloud) |
| Static Web App SPA Routing | Requires `staticwebapp.config.json` with `navigationFallback` in `public/` to prevent 404 on hard refresh |
| GitHub Actions B1 Limit | Parallel deployment of 8+ services to B1 plan causes transient 503 — retry logic with 30s wait resolves this |
| EntityFrameworkCore.Design | Should be marked as `PrivateAssets` in `.csproj` to prevent Roslyn DLLs from polluting publish output |
| CORS Order in .NET | `app.UseCors()` must be placed **before** `app.UseSwagger()` |
| B1 App Service Plan Limit | Cannot support more than ~8 simultaneous services — dedicated plan required for Customer Portal |

---

## 11. Contacts & Support

| Role | Contact | Responsibility |
|------|---------|----------------|
| GRC Platform Administrator | Sam Kawtharani — samk@exelcom.net.au | Platform owner, deployment, Azure infrastructure |
| Customer Portal Support | grc@exelcom.au | Customer portal enquiries and support |
| Security Incidents | incidents@exelcom.au | Automated incident email notifications |
| Azure Support | Microsoft Azure Portal | Azure infrastructure support |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2026 | Sam Kawtharani | Initial release — Phase 1 complete |

---

*© 2026 Exelcom. All rights reserved. This document is confidential and intended for internal use only.*
