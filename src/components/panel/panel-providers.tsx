'use client';

import { type ReactNode } from 'react';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { MerchantProvider } from '@/contexts/merchant-context';
import { AdminProvider } from '@/contexts/admin-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { UserNotificationProvider } from '@/contexts/user-notification-context';
import { EnvironmentProvider } from '@/contexts/environment-context';
import { PublicConfigProvider, type PublicConfig } from '@/contexts/public-config-context';
import { SessionConfigProvider } from '@/contexts/session-config-context';
import { DashboardHubProvider } from '@/providers/dashboard-hub-provider';
import { UserProvider } from '@/contexts/user-context';
import type { MinimalMerchant } from '@/types/merchant/crud';
import type { UserInfo } from '@/types/auth';
import { PaymentEnvironment, isAdminRole } from '@/types/enums';

interface PanelProvidersProps {
  user: UserInfo;
  merchants: MinimalMerchant[];
  selectedMerchant?: MinimalMerchant | null;
  apiUrl: string;
  accessToken: string | null;
  publicConfig: PublicConfig;
  initialUnreadCount?: number;
  initialUserUnreadCount?: number;
  initialEnvironment?: PaymentEnvironment;
  initialSidebarExpanded?: boolean;
  children: ReactNode;
}

export function PanelProviders({
  user,
  merchants,
  selectedMerchant,
  apiUrl,
  accessToken,
  publicConfig,
  initialUnreadCount,
  initialUserUnreadCount,
  initialEnvironment,
  initialSidebarExpanded,
  children,
}: PanelProvidersProps) {
  return (
    <UserProvider initialUser={user}>
      <SessionConfigProvider apiUrl={apiUrl} accessToken={accessToken}>
        <PublicConfigProvider value={publicConfig}>
          <EnvironmentProvider initialEnvironment={initialEnvironment}>
            <MerchantProvider initialMerchants={merchants} initialSelectedMerchant={selectedMerchant}>
              <AdminProvider>
                <DashboardHubProvider isAdmin={isAdminRole(user.role)}>
                  <NotificationProvider initialUnreadCount={initialUnreadCount}>
                    <UserNotificationProvider initialUnreadCount={initialUserUnreadCount}>
                        <SidebarProvider initialExpanded={initialSidebarExpanded}>
                          {children}
                        </SidebarProvider>
                    </UserNotificationProvider>
                  </NotificationProvider>
                </DashboardHubProvider>
              </AdminProvider>
            </MerchantProvider>
          </EnvironmentProvider>
        </PublicConfigProvider>
      </SessionConfigProvider>
    </UserProvider>
  );
}
