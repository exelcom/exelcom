// =============================================================================
// GRC Platform - App Services Module
// App Service Plans + 4 .NET 8 Web API Apps (Risk, Compliance, Policy, Audit)
// Deployment slots, VNet integration, managed identity, auto-scaling
// =============================================================================

param suffix string
param location string
param environment string
param keyVaultName string
param appInsightsConnectionString string
param subnetId string
param logAnalyticsWorkspaceId string
param tags object

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

var appServiceSkus = {
  dev: { name: 'B2', tier: 'Basic', size: 'B2', family: 'B', capacity: 1 }
  staging: { name: 'S2', tier: 'Standard', size: 'S2', family: 'S', capacity: 2 }
  prod: { name: 'P2v3', tier: 'PremiumV3', size: 'P2v3', family: 'Pv3', capacity: 3 }
}
var selectedSku = appServiceSkus[environment]

var commonAppSettings = [
  { name: 'ASPNETCORE_ENVIRONMENT', value: environment == 'prod' ? 'Production' : environment == 'staging' ? 'Staging' : 'Development' }
  { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
  { name: 'ApplicationInsightsAgent_EXTENSION_VERSION', value: '~3' }
  { name: 'KeyVaultName', value: keyVaultName }
  { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
  { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~18' }
]

// ---------------------------------------------------------------------------
// App Service Plans (one per service for independent scaling)
// ---------------------------------------------------------------------------

resource aspRisk 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-risk-${suffix}'
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: selectedSku.name
    tier: selectedSku.tier
    size: selectedSku.size
    family: selectedSku.family
    capacity: selectedSku.capacity
  }
  properties: {
    reserved: true  // Required for Linux
    zoneRedundant: environment == 'prod'
  }
}

resource aspCompliance 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-compliance-${suffix}'
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: selectedSku.name
    tier: selectedSku.tier
    size: selectedSku.size
    family: selectedSku.family
    capacity: selectedSku.capacity
  }
  properties: {
    reserved: true
    zoneRedundant: environment == 'prod'
  }
}

resource aspPolicy 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-policy-${suffix}'
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: selectedSku.name
    tier: selectedSku.tier
    size: selectedSku.size
    family: selectedSku.family
    capacity: selectedSku.capacity
  }
  properties: {
    reserved: true
    zoneRedundant: environment == 'prod'
  }
}

resource aspAudit 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-audit-${suffix}'
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: selectedSku.name
    tier: selectedSku.tier
    size: selectedSku.size
    family: selectedSku.family
    capacity: selectedSku.capacity
  }
  properties: {
    reserved: true
    zoneRedundant: environment == 'prod'
  }
}

// ---------------------------------------------------------------------------
// Web Apps
// ---------------------------------------------------------------------------

// --- Risk Management API ---

resource appRisk 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-risk-${suffix}'
  location: location
  tags: union(tags, { module: 'RiskManagement' })
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: aspRisk.id
    httpsOnly: true
    virtualNetworkSubnetId: subnetId
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      appSettings: union(commonAppSettings, [
        { name: 'GRC_MODULE', value: 'RiskManagement' }
        { name: 'ConnectionStrings__RiskDb', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=connstr-riskdb)' }
        { name: 'ConnectionStrings__Redis', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=redis-connection-string)' }
        { name: 'ServiceBus__Namespace', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=servicebus-namespace)' }
      ])
      cors: {
        allowedOrigins: ['https://portal.${suffix}.azurewebsites.net']
        supportCredentials: true
      }
    }
    clientAffinityEnabled: false
  }
}

resource slotRiskStaging 'Microsoft.Web/sites/slots@2023-01-01' = if (environment != 'dev') {
  parent: appRisk
  name: 'staging'
  location: location
  tags: tags
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: aspRisk.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      healthCheckPath: '/health'
      appSettings: union(commonAppSettings, [
        { name: 'GRC_MODULE', value: 'RiskManagement' }
        { name: 'SLOT_NAME', value: 'staging' }
      ])
    }
  }
}

// --- Compliance Tracking API ---

resource appCompliance 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-compliance-${suffix}'
  location: location
  tags: union(tags, { module: 'ComplianceTracking' })
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: aspCompliance.id
    httpsOnly: true
    virtualNetworkSubnetId: subnetId
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      appSettings: union(commonAppSettings, [
        { name: 'GRC_MODULE', value: 'ComplianceTracking' }
        { name: 'ConnectionStrings__ComplianceDb', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=connstr-compliancedb)' }
        { name: 'ConnectionStrings__Redis', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=redis-connection-string)' }
        { name: 'ServiceBus__Namespace', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=servicebus-namespace)' }
      ])
    }
    clientAffinityEnabled: false
  }
}

// --- Policy Management API ---

resource appPolicy 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-policy-${suffix}'
  location: location
  tags: union(tags, { module: 'PolicyManagement' })
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: aspPolicy.id
    httpsOnly: true
    virtualNetworkSubnetId: subnetId
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      appSettings: union(commonAppSettings, [
        { name: 'GRC_MODULE', value: 'PolicyManagement' }
        { name: 'ConnectionStrings__PolicyDb', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=connstr-policydb)' }
        { name: 'ConnectionStrings__Redis', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=redis-connection-string)' }
        { name: 'ServiceBus__Namespace', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=servicebus-namespace)' }
        { name: 'Storage__BlobEndpoint', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=storage-blob-endpoint)' }
      ])
    }
    clientAffinityEnabled: false
  }
}

// --- Audit Management API ---

resource appAudit 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-audit-${suffix}'
  location: location
  tags: union(tags, { module: 'AuditManagement' })
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: aspAudit.id
    httpsOnly: true
    virtualNetworkSubnetId: subnetId
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      appSettings: union(commonAppSettings, [
        { name: 'GRC_MODULE', value: 'AuditManagement' }
        { name: 'ConnectionStrings__AuditDb', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=connstr-auditdb)' }
        { name: 'ConnectionStrings__Redis', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=redis-connection-string)' }
        { name: 'ServiceBus__Namespace', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=servicebus-namespace)' }
        { name: 'Storage__BlobEndpoint', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=storage-blob-endpoint)' }
      ])
    }
    clientAffinityEnabled: false
  }
}

// ---------------------------------------------------------------------------
// Auto-scale Settings (prod only)
// ---------------------------------------------------------------------------

resource autoscaleRisk 'Microsoft.Insights/autoscalesettings@2022-10-01' = if (environment == 'prod') {
  name: 'autoscale-risk-${suffix}'
  location: location
  tags: tags
  properties: {
    enabled: true
    targetResourceUri: aspRisk.id
    profiles: [
      {
        name: 'Default'
        capacity: { minimum: '2', maximum: '10', default: '3' }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: aspRisk.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 75
            }
            scaleAction: { direction: 'Increase', type: 'ChangeCount', value: '2', cooldown: 'PT5M' }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: aspRisk.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 25
            }
            scaleAction: { direction: 'Decrease', type: 'ChangeCount', value: '1', cooldown: 'PT10M' }
          }
        ]
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings
// ---------------------------------------------------------------------------

resource diagRisk 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-app-risk-${suffix}'
  scope: appRisk
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      { category: 'AppServiceHTTPLogs', enabled: true }
      { category: 'AppServiceConsoleLogs', enabled: true }
      { category: 'AppServiceAppLogs', enabled: true }
    ]
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output riskApiUrl string = 'https://${appRisk.properties.defaultHostName}'
output complianceApiUrl string = 'https://${appCompliance.properties.defaultHostName}'
output policyApiUrl string = 'https://${appPolicy.properties.defaultHostName}'
output auditApiUrl string = 'https://${appAudit.properties.defaultHostName}'

output riskApiPrincipalId string = appRisk.identity.principalId
output complianceApiPrincipalId string = appCompliance.identity.principalId
output policyApiPrincipalId string = appPolicy.identity.principalId
output auditApiPrincipalId string = appAudit.identity.principalId
