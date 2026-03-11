// =============================================================================
// GRC Platform - Messaging Module
// Azure Service Bus - Approval workflows, notifications, event processing
// =============================================================================

param suffix string
param location string
param keyVaultName string
param logAnalyticsWorkspaceId string
param tags object

// ---------------------------------------------------------------------------
// Service Bus Namespace
// ---------------------------------------------------------------------------

resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'sb-${suffix}'
  location: location
  tags: tags
  sku: {
    name: 'Standard'  // Upgrade to Premium for VNet integration in prod
    tier: 'Standard'
  }
  properties: {
    minimumTlsVersion: '1.2'
    disableLocalAuth: true  // Force Managed Identity auth only
  }
}

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------

// Policy approval workflow queue
resource queuePolicyApproval 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBus
  name: 'policy-approval-requests'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    requiresSession: false
    defaultMessageTimeToLive: 'P7D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 5
  }
}

// Audit evidence request queue
resource queueEvidenceRequest 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBus
  name: 'audit-evidence-requests'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 3
  }
}

// Risk review reminders
resource queueRiskReview 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBus
  name: 'risk-review-reminders'
  properties: {
    lockDuration: 'PT1M'
    maxSizeInMegabytes: 1024
    defaultMessageTimeToLive: 'P1D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 3
  }
}

// ---------------------------------------------------------------------------
// Topics & Subscriptions (fan-out events)
// ---------------------------------------------------------------------------

// GRC domain events topic - all major state changes published here
resource topicGrcEvents 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBus
  name: 'grc-domain-events'
  properties: {
    defaultMessageTimeToLive: 'P7D'
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    enableBatchedOperations: true
    maxSizeInMegabytes: 1024
  }
}

// Notification service subscription (emails, Teams alerts)
resource subNotifications 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: topicGrcEvents
  name: 'notifications'
  properties: {
    lockDuration: 'PT1M'
    defaultMessageTimeToLive: 'P1D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 5
  }
}

// Audit log subscription (append-only audit trail)
resource subAuditLog 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: topicGrcEvents
  name: 'audit-log'
  properties: {
    lockDuration: 'PT5M'
    defaultMessageTimeToLive: 'P7D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 10
  }
}

// Compliance recalculation subscription
resource subComplianceRecalc 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: topicGrcEvents
  name: 'compliance-recalculation'
  properties: {
    lockDuration: 'PT2M'
    defaultMessageTimeToLive: 'P1D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 3
  }
}

// SQL Filter rule for compliance recalculation subscription
resource ruleComplianceRecalc 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: subComplianceRecalc
  name: 'compliance-event-filter'
  properties: {
    filterType: 'SqlFilter'
    sqlFilter: {
      sqlExpression: 'EventType IN (\'ControlStatusChanged\', \'EvidenceUploaded\', \'RiskUpdated\')'
    }
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings
// ---------------------------------------------------------------------------

resource sbDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-sb-${suffix}'
  scope: serviceBus
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      { category: 'OperationalLogs', enabled: true }
      { category: 'VNetAndIPFilteringLogs', enabled: true }
      { category: 'RuntimeAuditLogs', enabled: true }
    ]
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}

// ---------------------------------------------------------------------------
// Save Service Bus details to Key Vault
// ---------------------------------------------------------------------------

resource secretSbNamespace 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVaultName}/servicebus-namespace'
  properties: {
    value: '${serviceBus.name}.servicebus.windows.net'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output serviceBusName string = serviceBus.name
output serviceBusId string = serviceBus.id
output serviceBusEndpoint string = '${serviceBus.name}.servicebus.windows.net'
output topicGrcEventsName string = topicGrcEvents.name
output queuePolicyApprovalName string = queuePolicyApproval.name
output queueEvidenceRequestName string = queueEvidenceRequest.name
output queueRiskReviewName string = queueRiskReview.name
