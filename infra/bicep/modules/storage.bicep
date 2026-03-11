// =============================================================================
// GRC Platform - Storage Module
// Azure Blob Storage for audit evidence, policy documents, reports
// =============================================================================

param suffix string
param location string
param keyVaultName string
param logAnalyticsWorkspaceId string
param tags object

// ---------------------------------------------------------------------------
// Storage Account
// ---------------------------------------------------------------------------

// Storage names: 3-24 chars, lowercase alphanumeric only, globally unique
var storageNameRaw = 'st${replace(suffix, '-', '')}sa'
var storageName = length(storageNameRaw) > 24 ? substring(storageNameRaw, 0, 24) : storageNameRaw

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: { name: 'Standard_GRS' }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false      // Force Entra ID / Managed Identity auth
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
    encryption: {
      services: {
        blob: { enabled: true, keyType: 'Account' }
        file: { enabled: true, keyType: 'Account' }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// ---------------------------------------------------------------------------
// Blob Service & Containers
// ---------------------------------------------------------------------------

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    isVersioningEnabled: true
    changeFeed: { enabled: true }
  }
}

// Audit evidence files uploaded during audits
resource containerEvidence 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'audit-evidence'
  properties: {
    publicAccess: 'None'
    metadata: { purpose: 'Audit evidence files' }
  }
}

// Policy documents (PDFs, Word docs)
resource containerPolicies 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'policy-documents'
  properties: {
    publicAccess: 'None'
    metadata: { purpose: 'Policy documents and versions' }
  }
}

// Compliance reports
resource containerReports 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'compliance-reports'
  properties: {
    publicAccess: 'None'
    metadata: { purpose: 'Generated compliance reports' }
  }
}

// Risk heatmaps and exports
resource containerRiskExports 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'risk-exports'
  properties: {
    publicAccess: 'None'
    metadata: { purpose: 'Risk register exports and heatmaps' }
  }
}

// ---------------------------------------------------------------------------
// Lifecycle Management Policy
// ---------------------------------------------------------------------------

resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'archive-old-evidence'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['audit-evidence/']
            }
            actions: {
              baseBlob: {
                tierToCool: { daysAfterModificationGreaterThan: 90 }
                tierToArchive: { daysAfterModificationGreaterThan: 365 }
              }
            }
          }
        }
        {
          name: 'archive-old-reports'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['compliance-reports/']
            }
            actions: {
              baseBlob: {
                tierToCool: { daysAfterModificationGreaterThan: 30 }
                tierToArchive: { daysAfterModificationGreaterThan: 180 }
              }
            }
          }
        }
      ]
    }
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings
// ---------------------------------------------------------------------------

resource storageDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-storage-${suffix}'
  scope: storageAccount
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    metrics: [{ category: 'Transaction', enabled: true }]
  }
}

resource blobDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-blob-${suffix}'
  scope: blobService
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      { category: 'StorageRead', enabled: true }
      { category: 'StorageWrite', enabled: true }
      { category: 'StorageDelete', enabled: true }
    ]
    metrics: [{ category: 'Transaction', enabled: true }]
  }
}

// ---------------------------------------------------------------------------
// Save storage connection info to Key Vault
// ---------------------------------------------------------------------------

resource secretStorageUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/storage-blob-endpoint'
  properties: {
    value: storageAccount.properties.primaryEndpoints.blob
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output containerEvidenceName string = containerEvidence.name
output containerPoliciesName string = containerPolicies.name
output containerReportsName string = containerReports.name
