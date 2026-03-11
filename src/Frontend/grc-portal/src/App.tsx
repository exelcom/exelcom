import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsalAuthentication } from '@azure/msal-react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { msalConfig } from './auth/authConfig';
import { useAuth } from './auth/useAuth';
import { setAuthToken } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { RisksPage } from './pages/RisksPage';
import { CompliancePage } from './pages/CompliancePage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AuditsPage } from './pages/AuditsPage';
import { LoginPage } from './pages/LoginPage';

const msalInstance = new PublicClientApplication(msalConfig);
const queryClient = new QueryClient();

function AppContent() {
  const { getToken, isAuthenticated, account } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);
  useMsalAuthentication(InteractionType.None);

  useEffect(() => {
    if (isAuthenticated && account) {
      getToken()
        .then(token => {
          setAuthToken(token);
          setTokenReady(true);
        })
        .catch(e => console.error('Token error:', e));
    }
  }, [isAuthenticated, account]);

  return (
    <>
      <AuthenticatedTemplate>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
            {tokenReady ? (
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/risks" element={<RisksPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/policies" element={<PoliciesPage />} />
                <Route path="/audits" element={<AuditsPage />} />
              </Routes>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
                Initialising...
              </div>
            )}
          </main>
        </div>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
    </>
  );
}

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </MsalProvider>
  );
}

