export const msalConfig = {
  auth: {
    clientId: 'bdad94d8-0d57-4e6b-a0b3-25f6680c1598',
    authority: 'https://login.microsoftonline.com/97fdd37b-3579-4f71-9370-c7683719594f',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};

export const loginRequest = {
  scopes: ['api://97fdd37b-3579-4f71-9370-c7683719594f/grc-platform/access_as_user'],
};

export const apiConfig = {
  baseUrl: 'https://apim-grc-exelcom-dev.azure-api.net',
  apiVersion: 'v1',
};

export const AppRoles = {
  Admin: 'GRC.Admin',
  RiskManager: 'GRC.RiskManager',
  ComplianceOfficer: 'GRC.ComplianceOfficer',
  PolicyManager: 'GRC.PolicyManager',
  Auditor: 'GRC.Auditor',
} as const;
