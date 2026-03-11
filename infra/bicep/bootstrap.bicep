// Bootstrap deployment - creates only Resource Group + Key Vault
// Run this FIRST before the full main.bicep deployment

targetScope = 'subscription'

param environment string = 'dev'
param location string = 'australiaeast'
param projectName string = 'grc'
param tenantId string
param keyVaultAdminGroupObjectId string
param tags object = {}

// Accepted but not used in bootstrap - keeps dev.parameters.json compatible
param locationSecondary string = 'australiasoutheast'
param alertEmailAddress string = ''

var suffix = '${projectName}-${environment}'

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${suffix}'
  location: location
  tags: tags
}

module security 'modules/security.bicep' = {
  name: 'bootstrap-security'
  scope: rg
  params: {
    suffix: suffix
    location: location
    tenantId: tenantId
    keyVaultAdminGroupObjectId: keyVaultAdminGroupObjectId
    logAnalyticsWorkspaceId: ''
    tags: tags
  }
}

output keyVaultName string = security.outputs.keyVaultName
