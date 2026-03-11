// =============================================================================
// GRC Platform - Monitoring Module
// Log Analytics Workspace, Application Insights, Alert Rules, Dashboards
// =============================================================================

param suffix string
param location string
param alertEmailAddress string
param tags object

// ---------------------------------------------------------------------------
// Log Analytics Workspace
// ---------------------------------------------------------------------------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${suffix}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      immediatePurgeDataOn30Days: false
    }
    workspaceCapping: {
      dailyQuotaGb: 5
    }
  }
}

// ---------------------------------------------------------------------------
// Application Insights (one per microservice)
// ---------------------------------------------------------------------------

resource appInsightsRisk 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-risk-${suffix}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appInsightsCompliance 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-compliance-${suffix}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appInsightsPolicy 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-policy-${suffix}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appInsightsAudit 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-audit-${suffix}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ---------------------------------------------------------------------------
// Action Group (Alert Notifications)
// ---------------------------------------------------------------------------

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-${suffix}'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'GRC-Alerts'
    enabled: true
    emailReceivers: [
      {
        name: 'GRC-Ops-Team'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

// NOTE: Alerts added post-deployment - see README`n// NOTE: SQL Elastic Pool DTU alert is created post-deployment (after database module runs)
// because the alert scope (elastic pool resource ID) must exist before the alert can reference it.
// See README.md - Post-Deployment Steps for the az CLI command to add this alert.

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output logAnalyticsWorkspaceId string = logAnalytics.id
output logAnalyticsWorkspaceName string = logAnalytics.name
output appInsightsConnectionString string = appInsightsRisk.properties.ConnectionString
output appInsightsRiskKey string = appInsightsRisk.properties.InstrumentationKey
output appInsightsComplianceKey string = appInsightsCompliance.properties.InstrumentationKey
output appInsightsPolicyKey string = appInsightsPolicy.properties.InstrumentationKey
output appInsightsAuditKey string = appInsightsAudit.properties.InstrumentationKey
output actionGroupId string = actionGroup.id

