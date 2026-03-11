// =============================================================================
// GRC Platform - API Management Module
// Central gateway for all GRC microservices
// JWT validation, rate limiting, API versioning, developer portal
// =============================================================================

param suffix string
param location string
param environment string
param tenantId string
param publisherEmail string
param subnetId string
param logAnalyticsWorkspaceId string
param riskApiUrl string
param complianceApiUrl string
param policyApiUrl string
param auditApiUrl string
param tags object

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

var apimSkus = {
  dev: 'Developer'
  staging: 'Standard'
  prod: 'Premium'
}

// ---------------------------------------------------------------------------
// API Management Instance
// ---------------------------------------------------------------------------

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: 'apim-${suffix}'
  location: location
  tags: tags
  sku: {
    name: apimSkus[environment]
    capacity: environment == 'prod' ? 2 : 1
  }
  identity: { type: 'SystemAssigned' }
  properties: {
    publisherEmail: publisherEmail
    publisherName: 'GRC Platform'
    virtualNetworkType: environment == 'prod' ? 'External' : 'None'
    virtualNetworkConfiguration: environment == 'prod' ? {
      subnetResourceId: subnetId
    } : null
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Protocols.Server.Http2': 'true'
    }
  }
}

// ---------------------------------------------------------------------------
// Named Values (shared config)
// ---------------------------------------------------------------------------

resource namedValueTenantId 'Microsoft.ApiManagement/service/namedValues@2023-05-01-preview' = {
  parent: apim
  name: 'tenant-id'
  properties: {
    displayName: 'TenantId'
    value: tenantId
    secret: false
  }
}

// ---------------------------------------------------------------------------
// Global Policy (applied to all APIs)
// ---------------------------------------------------------------------------

resource globalPolicy 'Microsoft.ApiManagement/service/policies@2023-05-01-preview' = {
  parent: apim
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
<policies>
  <inbound>
    <!-- Validate JWT from Entra ID -->
    <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized - Invalid or missing token">
      <openid-config url="https://login.microsoftonline.com/{{TenantId}}/v2.0/.well-known/openid-configuration" />
      <required-claims>
        <claim name="aud" match="any">
          <value>api://grc-platform</value>
        </claim>
      </required-claims>
    </validate-jwt>
    <!-- Rate limiting: 1000 calls per minute per IP -->
    <rate-limit-by-key calls="1000" renewal-period="60" counter-key="@(context.Request.IpAddress)" />
    <!-- CORS -->
    <cors allow-credentials="true">
      <allowed-origins>
        <origin>https://portal.grc.example.com</origin>
      </allowed-origins>
      <allowed-methods>
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>PATCH</method>
        <method>DELETE</method>
        <method>OPTIONS</method>
      </allowed-methods>
      <allowed-headers>
        <header>Authorization</header>
        <header>Content-Type</header>
        <header>X-Requested-With</header>
        <header>X-Correlation-Id</header>
      </allowed-headers>
    </cors>
    <!-- Add correlation ID for distributed tracing -->
    <set-header name="X-Correlation-Id" exists-action="skip">
      <value>@(Guid.NewGuid().ToString())</value>
    </set-header>
    <!-- Forward authenticated user info to backend -->
    <set-header name="X-User-ObjectId" exists-action="override">
      <value>@(context.Request.Headers.GetValueOrDefault("Authorization","").Split(' ').Last().AsJwt()?.Claims.GetValueOrDefault("oid","unknown"))</value>
    </set-header>
  </inbound>
  <backend>
    <forward-request timeout="30" />
  </backend>
  <outbound>
    <!-- Remove sensitive headers -->
    <set-header name="X-Powered-By" exists-action="delete" />
    <set-header name="X-AspNet-Version" exists-action="delete" />
    <set-header name="Server" exists-action="delete" />
    <!-- Add API version to response -->
    <set-header name="X-GRC-Api-Version" exists-action="override">
      <value>@(context.Api.Version)</value>
    </set-header>
  </outbound>
  <on-error>
    <set-header name="X-Correlation-Id" exists-action="override">
      <value>@(context.Request.Headers.GetValueOrDefault("X-Correlation-Id","unknown"))</value>
    </set-header>
  </on-error>
</policies>
    '''
  }
}

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

resource backendRisk 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'backend-risk'
  properties: {
    url: riskApiUrl
    protocol: 'http'
    tls: { validateCertificateChain: true, validateCertificateName: true }
    title: 'Risk Management API Backend'
    description: 'Backend for Risk Management microservice'
  }
}

resource backendCompliance 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'backend-compliance'
  properties: {
    url: complianceApiUrl
    protocol: 'http'
    tls: { validateCertificateChain: true, validateCertificateName: true }
    title: 'Compliance Tracking API Backend'
  }
}

resource backendPolicy 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'backend-policy'
  properties: {
    url: policyApiUrl
    protocol: 'http'
    tls: { validateCertificateChain: true, validateCertificateName: true }
    title: 'Policy Management API Backend'
  }
}

resource backendAudit 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'backend-audit'
  properties: {
    url: auditApiUrl
    protocol: 'http'
    tls: { validateCertificateChain: true, validateCertificateName: true }
    title: 'Audit Management API Backend'
  }
}

// ---------------------------------------------------------------------------
// API Version Sets (must be declared before APIs)
// ---------------------------------------------------------------------------

resource apiVersionSetRisk 'Microsoft.ApiManagement/service/apiVersionSets@2023-05-01-preview' = {
  parent: apim
  name: 'risk-version-set'
  properties: {
    displayName: 'Risk Management'
    versioningScheme: 'Header'
    versionHeaderName: 'Api-Version'
  }
}

// ---------------------------------------------------------------------------
// API Definitions
// ---------------------------------------------------------------------------

resource apiRisk 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apim
  name: 'risk-management-v1'
  properties: {
    displayName: 'Risk Management API'
    description: 'API for managing GRC risks, risk register, and risk scoring'
    path: 'risk'
    protocols: ['https']
    apiVersion: 'v1'
    apiVersionSetId: apiVersionSetRisk.id
    subscriptionRequired: true
    serviceUrl: riskApiUrl
  }
}

resource apiCompliance 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apim
  name: 'compliance-tracking-v1'
  properties: {
    displayName: 'Compliance Tracking API'
    description: 'API for compliance frameworks, controls, and posture tracking'
    path: 'compliance'
    protocols: ['https']
    subscriptionRequired: true
    serviceUrl: complianceApiUrl
  }
}

resource apiPolicy 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apim
  name: 'policy-management-v1'
  properties: {
    displayName: 'Policy Management API'
    description: 'API for policy library, versioning, and attestation workflows'
    path: 'policy'
    protocols: ['https']
    subscriptionRequired: true
    serviceUrl: policyApiUrl
  }
}

resource apiAudit 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apim
  name: 'audit-management-v1'
  properties: {
    displayName: 'Audit Management API'
    description: 'API for audit planning, evidence collection, and findings management'
    path: 'audit'
    protocols: ['https']
    serviceUrl: auditApiUrl
    subscriptionRequired: true
  }
}

// ---------------------------------------------------------------------------
// Products (subscription tiers)
// ---------------------------------------------------------------------------

resource productInternal 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apim
  name: 'grc-internal'
  properties: {
    displayName: 'GRC Internal'
    description: 'Internal access to all GRC APIs - for the GRC portal and internal tools'
    subscriptionRequired: true
    approvalRequired: false
    state: 'published'
  }
}

resource productPartner 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apim
  name: 'grc-partner'
  properties: {
    displayName: 'GRC Partner'
    description: 'Restricted read-only access for external auditors and partners'
    subscriptionRequired: true
    approvalRequired: true
    state: 'published'
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings
// ---------------------------------------------------------------------------

resource apimDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-apim-${suffix}'
  scope: apim
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      { category: 'GatewayLogs', enabled: true }
      { category: 'WebSocketConnectionLogs', enabled: false }
    ]
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output apimName string = apim.name
output apimId string = apim.id
output gatewayUrl string = 'https://${apim.properties.gatewayUrl}'
output developerPortalUrl string = apim.properties.developerPortalUrl
output apimPrincipalId string = apim.identity.principalId
