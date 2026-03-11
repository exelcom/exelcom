// =============================================================================
// GRC Platform - Cache Module
// Azure Cache for Redis - Session, reference data, compliance scores
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

var redisSkus = {
  dev: { name: 'Basic', family: 'C', capacity: 0 }       // 250 MB
  staging: { name: 'Standard', family: 'C', capacity: 1 } // 1 GB replicated
  prod: { name: 'Premium', family: 'P', capacity: 1 }     // 6 GB + Private Link
}
var selectedSku = redisSkus[environment]

// ---------------------------------------------------------------------------
// Azure Cache for Redis
// ---------------------------------------------------------------------------

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: 'redis-${suffix}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: selectedSku.name
      family: selectedSku.family
      capacity: selectedSku.capacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: environment == 'prod' ? 'Disabled' : 'Enabled'
  }
}

// ---------------------------------------------------------------------------
// Private Endpoint (prod only)
// ---------------------------------------------------------------------------

resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = if (environment == 'prod') {
  name: 'pe-redis-${suffix}'
  location: location
  tags: tags
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [
      {
        name: 'plsc-redis-${suffix}'
        properties: {
          privateLinkServiceId: redisCache.id
          groupIds: ['redisCache']
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings
// ---------------------------------------------------------------------------

resource redisDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-redis-${suffix}'
  scope: redisCache
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}

// ---------------------------------------------------------------------------
// Save Redis connection info to Key Vault
// ---------------------------------------------------------------------------

resource secretRedisConnStr 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/redis-connection-string'
  properties: {
    value: '${redisCache.properties.hostName}:${redisCache.properties.sslPort},password=${redisCache.listKeys().primaryKey},ssl=True,abortConnect=False'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output redisCacheName string = redisCache.name
output redisCacheId string = redisCache.id
output redisHostName string = redisCache.properties.hostName
output redisSslPort int = redisCache.properties.sslPort
