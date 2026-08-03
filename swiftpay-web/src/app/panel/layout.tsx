import { redirect } from 'next/navigation';
import type { UserInfo } from '@/types/auth';
import type { MinimalMerchant } from '@/types/merchant/crud';
import {
  getAccessToken,
  getDeviceIdCookie,
  getSelectedMerchant,
  getSessionData,
  getSidebarExpanded,
} from '@/auth/session';
import { listMerchants } from '@/app/actions/merchant/crud';
import { getApiUrl } from '@/app/actions/auth';
import { Routes } from '@/router/routes';
import { resolveDocsUrl } from '@/constants/useful-links';
import { SignalRProvider } from '@/contexts/signalr-context';
import { AuthHubProvider } from '@/providers/auth-hub-provider';
import { PWARedirectHandler } from '@/components/pwa-redirect-handler';
import { PanelProviders } from '@/components/panel/panel-providers';

export default async function PanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, accessToken, apiUrl, deviceId, sidebarExpanded] = await Promise.all([
    getSessionData(),
    getAccessToken(),
    getApiUrl(),
    getDeviceIdCookie(),
    getSidebarExpanded(),
  ]);

  if (!session || !session.emailVerified || !accessToken) {
    redirect(Routes.home);
  }

  const user: UserInfo = {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    status: session.status,
    emailVerified: session.emailVerified,
    profileImageUrl: session.profileImageUrl ?? null,
    selectedBorderImageUrl: session.selectedBorderImageUrl ?? null,
  };

  const merchantsResponse = await listMerchants();
  const merchants: MinimalMerchant[] = merchantsResponse?.data?.items ?? [];
  const selectedMerchant = await getSelectedMerchant();

  const publicConfig = {
    docsUrl: resolveDocsUrl(),
    integrationUrl: null,
  };

  return (
    <SignalRProvider apiUrl={apiUrl} accessToken={accessToken} deviceId={deviceId ?? ''}>
      <AuthHubProvider>
        <PWARedirectHandler />
        <PanelProviders
          user={user}
          merchants={merchants}
          selectedMerchant={selectedMerchant}
          apiUrl={apiUrl}
          accessToken={accessToken}
          publicConfig={publicConfig}
          initialEnvironment={session.environment}
          initialSidebarExpanded={sidebarExpanded}
          initialUnreadCount={0}
          initialUserUnreadCount={0}
        >
          {children}
        </PanelProviders>
      </AuthHubProvider>
    </SignalRProvider>
  );
}