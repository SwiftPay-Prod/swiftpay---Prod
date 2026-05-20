import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSessionData, getDeviceIdCookie, clearAuthCookies, getSelectedEnvironment, getSidebarExpanded } from '@/auth/session';
import { listMerchants } from '@/app/actions/merchant/crud';
import { getMerchantNotificationCount } from '@/app/actions/merchant/notifications';
import { getUserNotificationCount } from '@/app/actions/user';
import { Routes } from '@/router/routes';
import { SignalRProvider } from '@/contexts/signalr-context';
import { AuthHubProvider } from '@/providers/auth-hub-provider';
import { getApiUrl, ensureValidToken } from '@/app/actions/auth';
import { PWARedirectHandler } from '@/components/pwa-redirect-handler';
import { DEFAULT_DOCS_URL } from '@/constants/useful-links';
import { PanelProviders } from '@/components/panel/panel-providers';

export default async function PanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, tokenResult] = await Promise.all([
    getSessionData(),
    ensureValidToken(),
  ]);

  if (!session) {
    redirect(Routes.home);
  }

  if (!tokenResult.valid) {
    await clearAuthCookies();
    redirect(Routes.home);
  }

  const [cachedSelectedMerchant, apiUrl, deviceId, environment, sidebarExpanded, userNotificationCountResponse, merchantsResponse] = await Promise.all([
    getSelectedMerchant(),
    getApiUrl(),
    getDeviceIdCookie(),
    getSelectedEnvironment(),
    getSidebarExpanded(),
    getUserNotificationCount(),
    listMerchants(),
  ]);

  const merchants = merchantsResponse?.data?.items ?? [];
  const selectedMerchant = merchants.find((merchant) => merchant.id === cachedSelectedMerchant?.id) ?? null;

  const merchantNotificationCountResponse = selectedMerchant
    ? await getMerchantNotificationCount(selectedMerchant.id)
    : null;

  const user = {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    status: session.status,
    emailVerified: session.emailVerified,
    profileImageUrl: session.profileImageUrl,
    selectedBorderImageUrl: session.selectedBorderImageUrl,
  };

  const publicConfig = {
    docsUrl: DEFAULT_DOCS_URL,
    integrationUrl: process.env.INTEGRATION_URL || null,
    checkoutUrl: process.env.CHECKOUT_URL || null,
  };

  return (
    <SignalRProvider apiUrl={apiUrl} accessToken={tokenResult.accessToken ?? null} deviceId={deviceId}>
      <AuthHubProvider>
        <PWARedirectHandler />
        <PanelProviders
          user={user}
          merchants={merchants}
          selectedMerchant={selectedMerchant}
          apiUrl={apiUrl}
          accessToken={tokenResult.accessToken ?? null}
          publicConfig={publicConfig}
          initialEnvironment={environment}
          initialSidebarExpanded={sidebarExpanded}
          initialUnreadCount={merchantNotificationCountResponse?.data?.unreadCount ?? 0}
          initialUserUnreadCount={userNotificationCountResponse?.data?.unreadCount ?? 0}
        >
          {children}
        </PanelProviders>
      </AuthHubProvider>
    </SignalRProvider>
  );
}