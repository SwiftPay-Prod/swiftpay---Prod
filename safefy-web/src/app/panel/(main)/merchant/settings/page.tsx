import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import {
  getMerchantSettings,
  getMerchantNominals,
  getMerchantNominalsHistory,
  getMerchantNominalAbTestHistory,
} from '@/app/actions/merchant/settings';
import { SettingsWrapper } from './settings-wrapper';
import { SettingsSkeleton } from './settings-skeleton';
import { Routes } from '@/router/routes';

async function fetchSettingsData(merchantId: string) {
  const [settingsResponse, nominalsResponse, nominalsHistoryResponse, nominalAbTestHistoryResponse] = await Promise.all([
    getMerchantSettings(merchantId),
    getMerchantNominals(merchantId),
    getMerchantNominalsHistory(merchantId),
    getMerchantNominalAbTestHistory(merchantId),
  ]);

  return {
    settings: settingsResponse?.data ?? null,
    nominals: nominalsResponse?.data ?? null,
    nominalsHistory: nominalsHistoryResponse?.data ?? null,
    nominalAbTestHistory: nominalAbTestHistoryResponse?.data ?? null,
    errors: {
      settings: settingsResponse?.error?.message ?? settingsResponse?.message ?? null,
      nominals: nominalsResponse?.error?.message ?? nominalsResponse?.message ?? null,
      nominalsHistory: nominalsHistoryResponse?.error?.message ?? nominalsHistoryResponse?.message ?? null,
      nominalAbTestHistory:
        nominalAbTestHistoryResponse?.error?.message ?? nominalAbTestHistoryResponse?.message ?? null,
    },
  };
}

export default async function MerchantSettingsPage() {
  const merchant = await getSelectedMerchant();

  if (!merchant) {
    redirect(Routes.panel.merchant.new);
  }

  const settingsPromise = fetchSettingsData(merchant.id);

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsWrapper fetchPromise={settingsPromise} merchantId={merchant.id} />
    </Suspense>
  );
}

