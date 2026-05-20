import { Suspense } from 'react';
import { adminGetPlatformSettings } from '@/app/actions/admin/platform-settings';
import { adminListPlatformPayoutAccounts } from '@/app/actions/admin/platform-payouts';
import { PlatformSettingsForm, PlatformSettingsSkeleton } from './platform-settings-form';

export default async function PlatformSettingsPage() {
  const dataPromise = adminGetPlatformSettings();
  const payoutAccountsPromise = adminListPlatformPayoutAccounts({ page: 1, pageSize: 100 });

  return (
    <Suspense fallback={<PlatformSettingsSkeleton />}>
      <PlatformSettingsForm fetchPromise={dataPromise} payoutAccountsPromise={payoutAccountsPromise} />
    </Suspense>
  );
}

