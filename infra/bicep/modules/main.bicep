// =============================================================================
// GRC Platform - Main Bicep Deployment
// Deploys all Azure resources for the full GRC platform
// =============================================================================

targetScope = 'subscription'

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for primary deployment')
param location string = 'australiaeast'

@description('Azure region for secondary/DR deployment (reserved for future geo-replication)')
#disable-next-line no-unused-params
param locationSecondary string = 'australiasoutheast'

@description('Project/platform name prefix')
param projectName string = 'grc'

@description('Entra ID tenant ID for authentication')
param tenantId string

@description('Object ID of the team/group to grant Key Vault access')
param keyVaultAdminGroupObjectId string

@description('Alert notification email address')
param alertEmailAddress string

@description('SQL administrator password - store securely, do not commit to source control')
@secure()
param sqlAdminPassword string

@description('Tags to apply to all resources')
param tags object = {
  project: 'GRC-Platform'
  environment: environment
  managedBy: 'Bicep'
  costCenter: 'GRC-IT'
}

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

var suffix = '${projectName}-${environment}'
var rgName = 'rg-${suffix}'

// ---------------------------------------------------------------------------
// Resource Group
// ---------------------------------------------------------------------------

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: rgName
  location: location
  tags: tags
}

// ---------------------------------------------------------------------------
// Module Deployments
// ---------------------------------------------------------------------------

module networking 'modules/networking.bicep' = {
  name: 'networking-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    tags: tags
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    alertEmailAddress: alertEmailAddress
    tags: tags
  }
}

module security 'modules/security.bicep' = {
  name: 'security-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    tenantId: tenantId
    keyVaultAdminGroupObjectId: keyVaultAdminGroupObjectId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    keyVaultName: security.outputs.keyVaultName
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

module database 'modules/database.bicep' = {
  name: 'database-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    environment: environment
    keyVaultName: security.outputs.keyVaultName
    sqlAdminPassword: sqlAdminPassword
    subnetId: networking.outputs.dbSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

module messaging 'modules/messaging.bicep' = {
  name: 'messaging-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    keyVaultName: security.outputs.keyVaultName
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

module cache 'modules/cache.bicep' = {
  name: 'cache-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    environment: environment
    keyVaultName: security.outputs.keyVaultName
    subnetId: networking.outputs.cacheSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

module appServices 'modules/app-services.bicep' = {
  name: 'appservices-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    environment: environment
    keyVaultName: security.outputs.keyVaultName
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    subnetId: networking.outputs.appSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

module apiManagement 'modules/apim.bicep' = {
  name: 'apim-${deployment().name}'
  scope: rg
  params: {
    suffix: suffix
    location: location
    environment: environment
    tenantId: tenantId
    publisherEmail: alertEmailAddress
    subnetId: networking.outputs.apimSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    riskApiUrl: appServices.outputs.riskApiUrl
    complianceApiUrl: appServices.outputs.complianceApiUrl
    policyApiUrl: appServices.outputs.policyApiUrl
    auditApiUrl: appServices.outputs.auditApiUrl
    tags: tags
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output resourceGroupName string = rg.name
output keyVaultName string = security.outputs.keyVaultName
output apimGatewayUrl string = apiManagement.outputs.gatewayUrl
output riskApiUrl string = appServices.outputs.riskApiUrl
output complianceApiUrl string = appServices.outputs.complianceApiUrl
output policyApiUrl string = appServices.outputs.policyApiUrl
output auditApiUrl string = appServices.outputs.auditApiUrl
