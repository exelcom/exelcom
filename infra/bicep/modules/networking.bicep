// =============================================================================
// GRC Platform - Networking Module
// VNet, Subnets, NSGs, Private DNS Zones
// =============================================================================

param suffix string
param location string
param tags object

// ---------------------------------------------------------------------------
// Virtual Network
// ---------------------------------------------------------------------------

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-${suffix}'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: 'snet-apim'
        properties: {
          addressPrefix: '10.0.0.0/27'
          networkSecurityGroup: { id: nsgApim.id }
          serviceEndpoints: [
            { service: 'Microsoft.KeyVault' }
          ]
        }
      }
      {
        name: 'snet-apps'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: { id: nsgApps.id }
          delegations: [
            {
              name: 'appservice-delegation'
              properties: { serviceName: 'Microsoft.Web/serverFarms' }
            }
          ]
          serviceEndpoints: [
            { service: 'Microsoft.KeyVault' }
            { service: 'Microsoft.Sql' }
            { service: 'Microsoft.ServiceBus' }
            { service: 'Microsoft.Storage' }
          ]
        }
      }
      {
        name: 'snet-db'
        properties: {
          addressPrefix: '10.0.2.0/27'
          networkSecurityGroup: { id: nsgDb.id }
          serviceEndpoints: [
            { service: 'Microsoft.Sql' }
          ]
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'snet-cache'
        properties: {
          addressPrefix: '10.0.3.0/27'
          networkSecurityGroup: { id: nsgCache.id }
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'snet-integration'
        properties: {
          addressPrefix: '10.0.4.0/27'
          serviceEndpoints: [
            { service: 'Microsoft.ServiceBus' }
            { service: 'Microsoft.Storage' }
          ]
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Network Security Groups
// ---------------------------------------------------------------------------

resource nsgApim 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-apim-${suffix}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'Allow-APIM-Management'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'ApiManagement'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '3443'
        }
      }
      {
        name: 'Allow-Azure-LB'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'AzureLoadBalancer'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '6390'
        }
      }
      {
        name: 'Allow-HTTPS-Inbound'
        properties: {
          priority: 120
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '443'
        }
      }
      {
        name: 'Deny-All-Inbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource nsgApps 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-apps-${suffix}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'Allow-APIM-Inbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.0.0/27'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '443'
        }
      }
      {
        name: 'Allow-AppService-Management'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'AppServiceManagement'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '454-455'
        }
      }
      {
        name: 'Deny-Direct-Internet'
        properties: {
          priority: 4000
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource nsgDb 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-db-${suffix}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'Allow-SQL-From-Apps'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.1.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '1433'
        }
      }
      {
        name: 'Deny-All-Inbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource nsgCache 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-cache-${suffix}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'Allow-Redis-From-Apps'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.1.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '6380'
        }
      }
      {
        name: 'Deny-All-Inbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Private DNS Zones
// ---------------------------------------------------------------------------

resource privateDnsSql 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink${az.environment().suffixes.sqlServerHostname}'
  location: 'global'
  tags: tags
}

resource privateDnsRedis 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.redis.cache.windows.net'
  location: 'global'
  tags: tags
}

resource privateDnsSqlLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsSql
  name: 'link-sql-${suffix}'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}

resource privateDnsRedisLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsRedis
  name: 'link-redis-${suffix}'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output vnetId string = vnet.id
output vnetName string = vnet.name
output apimSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'snet-apim')
output appSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'snet-apps')
output dbSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'snet-db')
output cacheSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'snet-cache')
output integrationSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'snet-integration')
output privateDnsSqlZoneId string = privateDnsSql.id
output privateDnsRedisZoneId string = privateDnsRedis.id
