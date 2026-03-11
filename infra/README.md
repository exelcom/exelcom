# GRC Platform — Azure Infrastructure (Bicep IaC)

## Architecture Overview

```
Internet
    │
    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  Azure Subscription: rg-grc-{env}                                         │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Virtual Network: vnet-grc-{env}  (10.0.0.0/16)                     │  │
│  │                                                                      │  │
│  │  snet-apim     (10.0.0.0/27) ─► NSG: Allow 443, 3443, 6390         │  │
│  │  snet-apps     (10.0.1.0/24) ─► NSG: Allow from APIM only          │  │
│  │  snet-db       (10.0.2.0/27) ─► NSG: Allow SQL from snet-apps only │  │
│  │  snet-cache    (10.0.3.0/27) ─► NSG: Allow Redis from snet-apps    │  │
│  │  snet-integration (10.0.4.0/27)                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │  API Management (apim-grc-{env})                                  │     │
│  │  • JWT Validation (Entra ID)  • Rate Limiting  • CORS            │     │
│  │  • 4 API definitions          • 2 Products (Internal, Partner)   │     │
│  └────────┬───────────────────┬──────────────┬──────────────┬───────┘     │
│           │                   │              │              │              │
│           ▼                   ▼              ▼              ▼              │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Risk API   │  │ Compliance API  │  │Policy API│  │  Audit API   │    │
│  │(app-risk-*) │  │(app-compliance*)│  │(app-poli*│  │(app-audit-*) │    │
│  │  .NET 8     │  │    .NET 8       │  │  .NET 8  │  │   .NET 8     │    │
│  │  Linux      │  │    Linux        │  │  Linux   │  │   Linux      │    │
│  │  App Svc    │  │    App Svc      │  │  App Svc │  │   App Svc    │    │
│  └─────┬───────┘  └───────┬────────┘  └────┬─────┘  └──────┬───────┘    │
│        │                  │                 │               │              │
│        └──────────────────┴─────────────────┴───────────────┘             │
│                                    │                                       │
│              ┌─────────────────────┼─────────────────────┐                │
│              ▼                     ▼                     ▼                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │
│  │  Azure SQL       │  │  Azure Cache     │  │  Azure Service Bus   │    │
│  │  Elastic Pool   │  │  for Redis       │  │  sb-grc-{env}        │    │
│  │                 │  │  redis-grc-{env} │  │  • policy-approval   │    │
│  │  • RiskDb       │  │                  │  │  • evidence-requests │    │
│  │  • ComplianceDb │  │  LRU eviction    │  │  • grc-domain-events │    │
│  │  • PolicyDb     │  │  Session cache   │  │    (topic + 3 subs)  │    │
│  │  • AuditDb      │  │  Ref data cache  │  │                      │    │
│  │  Private EP ✓   │  │  Private EP ✓   │  │                      │    │
│  └─────────────────┘  └──────────────────┘  └──────────────────────┘    │
│                                                                            │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │
│  │  Key Vault       │  │  Blob Storage   │  │  Log Analytics +     │    │
│  │  kv-grc-{env}   │  │  st{suffix}     │  │  App Insights x4     │    │
│  │                 │  │                 │  │                      │    │
│  │  RBAC-only      │  │  • audit-evid.  │  │  90-day retention    │    │
│  │  Soft delete    │  │  • policy-docs  │  │  Alert rules         │    │
│  │  Purge protect  │  │  • reports      │  │  Action groups       │    │
│  │  All conn strs  │  │  • risk-export  │  │                      │    │
│  └──────────────────┘  └─────────────────┘  └──────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
infra/
├── bicep/
│   ├── main.bicep                        # Entry point, subscription-level
│   ├── modules/
│   │   ├── networking.bicep              # VNet, subnets, NSGs, Private DNS
│   │   ├── monitoring.bicep              # Log Analytics, App Insights x4, Alerts
│   │   ├── security.bicep                # Key Vault, Managed Identities, RBAC
│   │   ├── storage.bicep                 # Blob Storage, containers, lifecycle
│   │   ├── database.bicep                # SQL Server, Elastic Pool, 4 databases
│   │   ├── messaging.bicep               # Service Bus, queues, topics
│   │   ├── cache.bicep                   # Redis Cache, private endpoint
│   │   ├── app-services.bicep            # 4 App Service plans + apps, autoscale
│   │   └── apim.bicep                    # API Management, policies, backends
│   └── environments/
│       ├── dev.parameters.json
│       ├── staging.parameters.json
│       └── prod.parameters.json
├── azure-pipelines-iac.yml               # Azure DevOps pipeline
└── README.md
```

## Environment Differences

| Resource              | DEV             | Staging         | PROD                 |
|-----------------------|-----------------|-----------------|----------------------|
| App Service SKU       | B2 (Basic)      | S2 (Standard)   | P2v3 (PremiumV3)     |
| SQL Elastic Pool      | 50 DTU Std      | 100 DTU Std     | 125 eDTU Premium     |
| Redis SKU             | C0 Basic        | C1 Standard     | P1 Premium           |
| APIM SKU              | Developer       | Standard        | Premium (x2)         |
| Deployment Slots      | No              | Yes             | Yes                  |
| Zone Redundancy       | No              | No              | Yes                  |
| Private Endpoints     | No              | Partial         | Full                 |
| Autoscaling           | No              | No              | Yes (2-10 instances) |
| Backup Retention      | 7 days          | 14 days         | 35 days (Geo)        |
| Public Network Access | Enabled         | Restricted      | Disabled             |

## Prerequisites

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install Bicep
az bicep install

# Login
az login
az account set --subscription <YOUR-SUBSCRIPTION-ID>

# Register required providers
az provider register --namespace Microsoft.Network
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.Cache
az provider register --namespace Microsoft.ServiceBus
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.ApiManagement
az provider register --namespace Microsoft.Insights
az provider register --namespace Microsoft.OperationalInsights
```

## Deployment Commands

### DEV Environment

```bash
# Validate
az deployment sub validate \
  --location australiaeast \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/environments/dev.parameters.json

# What-If (preview changes)
az deployment sub what-if \
  --location australiaeast \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/environments/dev.parameters.json

# Deploy
az deployment sub create \
  --location australiaeast \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/environments/dev.parameters.json \
  --name "grc-deploy-dev-$(date +%Y%m%d%H%M)"
```

### PROD Environment

```bash
az deployment sub create \
  --location australiaeast \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/environments/prod.parameters.json \
  --name "grc-deploy-prod-$(date +%Y%m%d%H%M)"
```

## Post-Deployment Steps

After first deployment, complete these manual steps:

### 1. Pre-seed Key Vault Secret (SQL Admin Password)
```bash
# Key Vault requires the SQL admin password before database module runs
az keyvault secret set \
  --vault-name "kv-grc-dev" \
  --name "sql-admin-password" \
  --value "$(openssl rand -base64 32)"
```

### 2. Grant SQL Server Managed Identity Access
```bash
# For each App Service, set its managed identity as AAD admin on SQL
az sql server ad-admin create \
  --resource-group rg-grc-dev \
  --server-name sql-grc-dev \
  --display-name "GRC-Risk-API" \
  --object-id <risk-api-principal-id>
```

### 3. Configure Entra ID App Registration
```bash
# Register GRC platform app
az ad app create \
  --display-name "GRC Platform" \
  --identifier-uris "api://grc-platform" \
  --app-roles '[
    {"id":"<guid>","value":"GRC.Admin","displayName":"GRC Administrator","isEnabled":true,"allowedMemberTypes":["User"]},
    {"id":"<guid>","value":"GRC.RiskManager","displayName":"Risk Manager","isEnabled":true,"allowedMemberTypes":["User"]},
    {"id":"<guid>","value":"GRC.Auditor","displayName":"Auditor","isEnabled":true,"allowedMemberTypes":["User"]},
    {"id":"<guid>","value":"GRC.Reader","displayName":"Read Only","isEnabled":true,"allowedMemberTypes":["User"]}
  ]'
```

### 4. Run EF Core Migrations
```bash
# From each service project directory
dotnet ef database update --connection "<connection-string>"
```

## Security Controls

| Control                      | Implementation                                    |
|------------------------------|---------------------------------------------------|
| Authentication               | Entra ID + MSAL, JWT validated at APIM            |
| Authorization                | App roles (GRC.Admin, GRC.RiskManager, etc.)      |
| Secrets Management           | Key Vault with RBAC, no local secrets             |
| Data in Transit              | TLS 1.2 minimum enforced everywhere               |
| Data at Rest                 | Azure SQL TDE, Storage SSE (Microsoft-managed)    |
| Network Isolation            | VNet, NSGs, Private Endpoints (prod)              |
| Identity                     | Managed Identities — no passwords in config       |
| Audit Logging                | All KV access, SQL queries, API calls logged      |
| Vulnerability Management     | Defender for SQL enabled                         |
| Backup & Recovery            | Geo-redundant backups, 35-day retention (prod)    |

## Cost Estimate (AUD/month approximate)

| Environment | Estimated Cost |
|-------------|---------------|
| DEV         | ~$350/month   |
| Staging     | ~$700/month   |
| PROD        | ~$2,800/month |

> Costs vary based on data volume, transaction rates, and region pricing.
