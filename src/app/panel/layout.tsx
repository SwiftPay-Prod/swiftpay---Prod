import { redirect } from 'next/navigation';
import type { UserInfo } from '@/types/auth';
import {
  getAccessToken,
  getDeviceIdCookie,
  getSelectedMerchant,
  getSessionData,
  getSidebarExpanded,
} from '@/auth/session';
import { listMerchants } from '@/app/actions/merchant/crud';
import { getApiUrl } from '@/app/actions/auth';
import { resolveDocsUrl } from '@/constants/useful-links';
import { SignalRProvider } from '@/contexts/signalr-context';
import { AuthHubProvider } from '@/providers/auth-hub-provider';
import { PanelProviders } from '@/components/panel/panel-providers';
import { PaymentEnvironment } from '@/types/enums';

export default async function PanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accessToken, apiUrl, deviceId, sidebarExpanded] = await Promise.all([
    getAccessToken().catch(() => null),
    getApiUrl().catch(() => ''),
    getDeviceIdCookie().catch(() => null),
    getSidebarExpanded().catch(() => true),
  ]);

  const session = accessToken ? await getSessionData().catch(() => null) : null;

  if (!session || !accessToken) {
    redirect('/');
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

  const merchantsResponse = await listMerchants().catch(() => null);
  const merchants = merchantsResponse?.data?.items ?? [];
  const selectedMerchant = await getSelectedMerchant().catch(() => null);

  const publicConfig = {
    docsUrl: resolveDocsUrl(),
    integrationUrl: null,
  };

  return (
    <SignalRProvider apiUrl={apiUrl ?? ''} accessToken={accessToken} deviceId={deviceId ?? ''}>
      <AuthHubProvider>
        <PanelProviders
          user={user}
          merchants={merchants}
          selectedMerchant={selectedMerchant}
          apiUrl={apiUrl ?? ''}
          accessToken={accessToken}
          publicConfig={publicConfig}
          initialEnvironment={session?.environment ?? PaymentEnvironment.Production}
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
