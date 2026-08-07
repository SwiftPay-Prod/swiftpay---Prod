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
import { resolveDocsUrl } from '@/constants/useful-links';
import { SignalRProvider } from '@/contexts/signalr-context';
import { AuthHubProvider } from '@/providers/auth-hub-provider';
import { PanelProviders } from '@/components/panel/panel-providers';
import { UserRole, UserStatus, PaymentEnvironment, MerchantStatus, MerchantKycStatus, MerchantOnboardingStep } from '@/types/enums';

// Usuário mock para visualização do painel sem autenticação (modo auditoria / simulação)
const MOCK_USER: UserInfo = {
  id: 'preview-user-id',
  name: 'Administrador SwiftPay',
  email: 'admin@swiftpay.com',
  role: UserRole.Admin,
  status: UserStatus.Active,
  emailVerified: true,
  profileImageUrl: null,
  selectedBorderImageUrl: null,
};

const MOCK_MERCHANTS: MinimalMerchant[] = [
  {
    id: 'preview-merchant-id',
    name: 'Loja Preview SwiftPay',
    email: 'loja@swiftpay.com',
    document: '12.345.678/0001-90',
    status: MerchantStatus.Active,
    kycStatus: MerchantKycStatus.Approved,
    onboardingStep: MerchantOnboardingStep.Completed,
    createdAt: new Date().toISOString(),
    onboardingCompletedAt: new Date().toISOString(),
    availableBalance: 1543250,
    fees: null,
  },
  {
    id: 'preview-merchant-2',
    name: 'SwiftPay PayTech LTDA',
    email: 'financeiro@swiftpaytech.com',
    document: '98.765.432/0001-10',
    status: MerchantStatus.Active,
    kycStatus: MerchantKycStatus.Approved,
    onboardingStep: MerchantOnboardingStep.Completed,
    createdAt: new Date().toISOString(),
    onboardingCompletedAt: new Date().toISOString(),
    availableBalance: 4892080,
    fees: null,
  },
  {
    id: 'preview-merchant-3',
    name: 'SwiftPay Labs & Digital',
    email: 'labs@swiftpay.com',
    document: '45.123.789/0001-55',
    status: MerchantStatus.Draft,
    kycStatus: MerchantKycStatus.Pending,
    onboardingStep: MerchantOnboardingStep.BasicInfo,
    createdAt: new Date().toISOString(),
    onboardingCompletedAt: null,
    availableBalance: 0,
    fees: null,
  },
];

const MOCK_MERCHANT = MOCK_MERCHANTS[0]!;

export default async function PanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tenta usar sessão real; se não houver token, usa mock instantaneamente sem aguardar timeout
  const [accessToken, apiUrl, deviceId, sidebarExpanded] = await Promise.all([
    getAccessToken().catch(() => null),
    getApiUrl().catch(() => ''),
    getDeviceIdCookie().catch(() => null),
    getSidebarExpanded().catch(() => true),
  ]);

  const session = accessToken ? await getSessionData().catch(() => null) : null;

  const user: UserInfo = session
    ? {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        status: session.status,
        emailVerified: session.emailVerified,
        profileImageUrl: session.profileImageUrl ?? null,
        selectedBorderImageUrl: session.selectedBorderImageUrl ?? null,
      }
    : MOCK_USER;

  let merchants: MinimalMerchant[] = [];
  let selectedMerchant: MinimalMerchant | null = null;

  if (session && accessToken) {
    const merchantsResponse = await listMerchants().catch(() => null);
    merchants = merchantsResponse?.data?.items ?? [];
    selectedMerchant = await getSelectedMerchant().catch(() => null);
  } else {
    merchants = MOCK_MERCHANTS;
    selectedMerchant = MOCK_MERCHANT;
  }

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
