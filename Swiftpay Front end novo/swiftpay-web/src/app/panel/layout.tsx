import { UserRole, UserStatus, MerchantStatus, MerchantKycStatus, MerchantOnboardingStep, PaymentEnvironment } from '@/types/enums';
import { SignalRProvider } from '@/contexts/signalr-context';
import { AuthHubProvider } from '@/providers/auth-hub-provider';
import { PWARedirectHandler } from '@/components/pwa-redirect-handler';
import { PanelProviders } from '@/components/panel/panel-providers';

export default async function PanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mockUser = {
    id: 'mock-user-1',
    name: 'Admin SwiftPay',
    email: 'admin@swiftpay.com',
    role: UserRole.Admin,
    status: UserStatus.Active,
    emailVerified: true,
    profileImageUrl: null,
    selectedBorderImageUrl: null,
  };

  const mockMerchant = {
    id: 'mock-merchant-1',
    name: 'Minha Fintech S/A',
    email: 'contato@minhafintech.com.br',
    document: '12.345.678/0001-90',
    status: MerchantStatus.Active,
    kycStatus: MerchantKycStatus.Approved,
    availableBalance: 3829204.32,
    fees: null,
    onboardingStep: MerchantOnboardingStep.Completed,
    onboardingCompletedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const publicConfig = {
    docsUrl: 'https://docs.swiftpay.com.br',
    integrationUrl: null,
    checkoutUrl: null,
  };

  return (
    <SignalRProvider apiUrl="" accessToken={null} deviceId="">
      <AuthHubProvider>
        <PWARedirectHandler />
        <PanelProviders
          user={mockUser}
          merchants={[mockMerchant]}
          selectedMerchant={mockMerchant}
          apiUrl=""
          accessToken={null}
          publicConfig={publicConfig}
          initialEnvironment={PaymentEnvironment.Production}
          initialSidebarExpanded={true}
          initialUnreadCount={0}
          initialUserUnreadCount={0}
        >
          {children}
        </PanelProviders>
      </AuthHubProvider>
    </SignalRProvider>
  );
}
