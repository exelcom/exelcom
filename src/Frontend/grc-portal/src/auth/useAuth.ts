import { useMsal, useAccount } from '@azure/msal-react';
import { loginRequest, AppRoles } from './authConfig';

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] ?? {});

  const roles: string[] = (account?.idTokenClaims as Record<string, string[]>)?.roles ?? [];

  const hasRole = (role: string) => roles.includes(role) || roles.includes(AppRoles.Admin);

  const getToken = async () => {
    if (!account) throw new Error('No account');
    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  };

  const login = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect({ account: account ?? undefined });

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
