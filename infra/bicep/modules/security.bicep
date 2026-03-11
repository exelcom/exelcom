// =============================================================================
// GRC Platform - Security Module
// Key Vault, Managed Identities, RBAC Assignments
// =============================================================================

param suffix string
param location string
param tenantId string
param keyVaultAdminGroupObjectId string
param logAnalyticsWorkspaceId string
param tags object

// ---------------------------------------------------------------------------
// User-Assigned Managed Identities (one per service)
// ---------------------------------------------------------------------------

resource identityRisk 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-risk-${suffix}'
  location: location
  tags: tags
}

resource identityCompliance 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-compliance-${suffix}'
  location: location
  tags: tags
}

resource identityPolicy 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-policy-${suffix}'
  location: location
  tags: tags
}

resource identityAudit 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-audit-${suffix}'
  location: location
  tags: tags
}

// ---------------------------------------------------------------------------
// Key Vault
// ---------------------------------------------------------------------------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${suffix}'
  location: location
  tags: tags
  properties: {
    tenantId: tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
    }
  }
}

// ---------------------------------------------------------------------------
// Key Vault Diagnostic Settings (only when Log Analytics workspace is provided)
// ---------------------------------------------------------------------------

resource kvDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'diag-kv-${suffix}'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      { category: 'AuditEvent', enabled: true }
      { category: 'AzurePolicyEvaluationDetails', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}

// ---------------------------------------------------------------------------
// Key Vault RBAC - Role Assignments
// ---------------------------------------------------------------------------

var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
var kvAdminRoleId = '00482a5a-887f-4fb3-b363-3b7fe8e74483'       // Key Vault Administrator

// Admin group gets full admin access
resource kvAdminRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, keyVaultAdminGroupObjectId, kvAdminRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvAdminRoleId)
    principalId: keyVaultAdminGroupObjectId
    principalType: 'User'
  }
}

// Each service identity gets read access to secrets
resource kvRoleRisk 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identityRisk.id, kvSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: identityRisk.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvRoleCompliance 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identityCompliance.id, kvSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: identityCompliance.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvRolePolicy 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identityPolicy.id, kvSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: identityPolicy.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvRoleAudit 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identityAudit.id, kvSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: identityAudit.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri

output identityRiskId string = identityRisk.id
output identityRiskClientId string = identityRisk.properties.clientId
output identityRiskPrincipalId string = identityRisk.properties.principalId

output identityComplianceId string = identityCompliance.id
output identityComplianceClientId string = identityCompliance.properties.clientId
output identityCompliancePrincipalId string = identityCompliance.properties.principalId

output identityPolicyId string = identityPolicy.id
output identityPolicyClientId string = identityPolicy.properties.clientId
output identityPolicyPrincipalId string = identityPolicy.properties.principalId

output identityAuditId string = identityAudit.id
output identityAuditClientId string = identityAudit.properties.clientId
output identityAuditPrincipalId string = identityAudit.properties.principalId
