import { useMsal, useAccount } from '@azure/msal-react';
import { loginRequest, AppRoles } from './authConfig';

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] ?? {});

  const roles: string[] = (account?.idTokenClaims as Record<string, string[]>)?.roles ?? [];

  const hasRole = (role: string) => roles.includes(role) || roles.includes(AppRoles.Admin);

  const getToken = async () => {
    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account: account ?? undefined,
    });
    return response.accessToken;
  };

  const login = () => instance.loginPopup(loginRequest);
  const logout = () => instance.logoutPopup({ account: account ?? undefined });

  return {
    account,
    roles,
    hasRole,
    getToken,
    login,
    logout,
    isAuthenticated: accounts.length > 0,
  };
}
