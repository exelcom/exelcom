// =============================================================================
// GRC Platform - Database Module
// Azure SQL Server, Elastic Pool, 4 GRC databases, Private Endpoint
// =============================================================================

param suffix string
param location string
param environment string
param keyVaultName string
param subnetId string
param logAnalyticsWorkspaceId string
param tags object

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

var sqlAdminLogin = 'grc-sqladmin'
var elasticPoolSkus = {
  dev: { name: 'StandardPool', tier: 'Standard', capacity: 50 }
  staging: { name: 'StandardPool', tier: 'Standard', capacity: 100 }
  prod: { name: 'PremiumPool', tier: 'Premium', capacity: 125 }
}
var selectedSku = elasticPoolSkus[environment]

// ---------------------------------------------------------------------------
// SQL Admin Password (generated secret)
// ---------------------------------------------------------------------------

@secure()
param sqlAdminPassword string = ''

// ---------------------------------------------------------------------------
// SQL Server
// ---------------------------------------------------------------------------

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: 'sql-${suffix}'
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    restrictOutboundNetworkAccess: 'Disabled'
  }
}

// ---------------------------------------------------------------------------
// SQL Auditing (to Log Analytics)
// ---------------------------------------------------------------------------

resource sqlAudit 'Microsoft.Sql/servers/auditingSettings@2023-05-01-preview' = {
  parent: sqlServer
  name: 'default'
  properties: {
    state: 'Enabled'
    isAzureMonitorTargetEnabled: true
    auditActionsAndGroups: [
      'SUCCESSFUL_DATABASE_AUTHENTICATION_GROUP'
      'FAILED_DATABASE_AUTHENTICATION_GROUP'
      'BATCH_COMPLETED_GROUP'
    ]
  }
}

// ---------------------------------------------------------------------------
// Elastic Pool
// ---------------------------------------------------------------------------

resource elasticPool 'Microsoft.Sql/servers/elasticPools@2023-05-01-preview' = {
  parent: sqlServer
  name: 'ep-${suffix}'
  location: location
  tags: tags
  sku: {
    name: selectedSku.name
    tier: selectedSku.tier
    capacity: selectedSku.capacity
  }
  properties: {
    perDatabaseSettings: {
      minCapacity: 0
      maxCapacity: 50
    }
    zoneRedundant: environment == 'prod'
  }
}

// ---------------------------------------------------------------------------
// Databases - one per GRC microservice
// ---------------------------------------------------------------------------

var databases = ['RiskDb', 'ComplianceDb', 'PolicyDb', 'AuditDb']

resource grcDatabases 'Microsoft.Sql/servers/databases@2023-05-01-preview' = [for db in databases: {
  parent: sqlServer
  name: db
  location: location
  tags: union(tags, { module: db })
  sku: {
    name: 'ElasticPool'
    tier: selectedSku.tier
    capacity: 0
  }
  properties: {
    elasticPoolId: elasticPool.id
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 10737418240  // 10 GB
    zoneRedundant: environment == 'prod'
    readScale: environment == 'prod' ? 'Enabled' : 'Disabled'
    requestedBackupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
  }
}]

// ---------------------------------------------------------------------------
// Short-term backup retention (Point-in-time restore)
// ---------------------------------------------------------------------------

resource backupRetention 'Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies@2023-05-01-preview' = [for (db, i) in databases: {
  parent: grcDatabases[i]
  name: 'default'
  properties: {
    retentionDays: environment == 'prod' ? 35 : 7
    diffBackupIntervalInHours: 12
  }
}]

// ---------------------------------------------------------------------------
// Private Endpoint for SQL Server
// ---------------------------------------------------------------------------

resource sqlPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-sql-${suffix}'
  location: location
  tags: tags
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [
      {
        name: 'plsc-sql-${suffix}'
        properties: {
          privateLinkServiceId: sqlServer.id
          groupIds: ['sqlServer']
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings - Elastic Pool
// ---------------------------------------------------------------------------

resource elasticPoolDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-ep-${suffix}'
  scope: elasticPool
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    metrics: [
      { category: 'Basic', enabled: true }
      { category: 'InstanceAndAppAdvanced', enabled: true }
    ]
  }
}

// ---------------------------------------------------------------------------
// Save connection strings to Key Vault
// ---------------------------------------------------------------------------

resource secretRiskConnStr 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/connstr-riskdb'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=RiskDb;Authentication=Active Directory Managed Identity;Encrypt=True;'
  }
}

resource secretComplianceConnStr 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/connstr-compliancedb'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=ComplianceDb;Authentication=Active Directory Managed Identity;Encrypt=True;'
  }
}

resource secretPolicyConnStr 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/connstr-policydb'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=PolicyDb;Authentication=Active Directory Managed Identity;Encrypt=True;'
  }
}

resource secretAuditConnStr 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/connstr-auditdb'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=AuditDb;Authentication=Active Directory Managed Identity;Encrypt=True;'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output elasticPoolId string = elasticPool.id
output riskDbName string = grcDatabases[0].name
output complianceDbName string = grcDatabases[1].name
output policyDbName string = grcDatabases[2].name
output auditDbName string = grcDatabases[3].name
