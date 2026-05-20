import { BaseLocalStorage } from '@/constants/base';
import { NotificationStatusType, NotificationType } from '@/types/enums';
import type { DashboardPeriod } from '@/types/merchant/dashboard';
import type { LiveBalanceBackgroundId } from './backgrounds';
import { LIVE_BALANCE_BACKGROUND_OPTIONS } from './backgrounds';

const LEGACY_BACKGROUND_STORAGE_KEY = 'safefy_live_balance_background';

const LIVE_BALANCE_ALLOWED_PERIODS: DashboardPeriod[] = [
  'today',
  'yesterday',
  '7d',
  '14d',
  '30d',
  '90d',
  'this_week',
  'this_month',
  'all',
  'custom',
];

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultCustomRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);

  return {
    startDate: formatIsoDate(startDate),
    endDate: formatIsoDate(endDate),
  };
}

export type LiveBalanceNotificationFilterKey =
  | 'showApprovedNotifications'
  | 'showPendingNotifications'
  | 'showFailedNotifications'
  | 'showRefundedNotifications'
  | 'showPayoutNotifications';

export interface LiveBalanceNotificationFilters {
  showApprovedNotifications: boolean;
  showPendingNotifications: boolean;
  showFailedNotifications: boolean;
  showRefundedNotifications: boolean;
  showPayoutNotifications: boolean;
}

export const DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS: LiveBalanceNotificationFilters = {
  showApprovedNotifications: true,
  showPendingNotifications: false,
  showFailedNotifications: false,
  showRefundedNotifications: false,
  showPayoutNotifications: false,
};

export const LIVE_BALANCE_NOTIFICATION_FILTER_OPTIONS: Array<{
  key: LiveBalanceNotificationFilterKey;
  title: string;
  description: string;
}> = [
  {
    key: 'showApprovedNotifications',
    title: 'Pagamentos aprovados',
    description: 'Mostra vendas confirmadas e entradas aprovadas no saldo.',
  },
  {
    key: 'showPendingNotifications',
    title: 'Pagamentos pendentes',
    description: 'Exibe avisos de cobranças geradas e aguardando pagamento.',
  },
  {
    key: 'showFailedNotifications',
    title: 'Falhas e recusas',
    description: 'Mostra pagamentos com falha, expirados ou recusados.',
  },
  {
    key: 'showRefundedNotifications',
    title: 'Reembolsos',
    description: 'Exibe notificações de pagamentos devolvidos ao cliente.',
  },
  {
    key: 'showPayoutNotifications',
    title: 'Atualizações de saque',
    description: 'Mostra eventos de saque do merchant quando eles acontecerem.',
  },
];

export interface LiveBalanceRevenueFilters {
  period: DashboardPeriod;
  startDate: string;
  endDate: string;
}

export interface LiveBalanceSettings {
  backgroundId: LiveBalanceBackgroundId;
  revenueFilters: LiveBalanceRevenueFilters;
  showNotifications: boolean;
  notificationFilters: LiveBalanceNotificationFilters;
  enablePaymentSound: boolean;
  enableConfetti: boolean;
  enableProfitPulse: boolean;
  enableWealthBurst: boolean;
  enableMoneyRain: boolean;
  enableVictoryOrbit: boolean;
  enableSellerStickers: boolean;
  enableCashTrail: boolean;
  enableJackpotFlash: boolean;
  enableDiamondDust: boolean;
  enableRoyalCrown: boolean;
}

export const DEFAULT_LIVE_BALANCE_SETTINGS: LiveBalanceSettings = {
  backgroundId: 'gradient',
  revenueFilters: {
    period: 'all',
    ...getDefaultCustomRange(),
  },
  showNotifications: true,
  notificationFilters: DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS,
  enablePaymentSound: true,
  enableConfetti: true,
  enableProfitPulse: true,
  enableWealthBurst: true,
  enableMoneyRain: true,
  enableVictoryOrbit: true,
  enableSellerStickers: true,
  enableCashTrail: true,
  enableJackpotFlash: true,
  enableDiamondDust: true,
  enableRoyalCrown: true,
};

function resolveRevenueFilters(value: unknown): LiveBalanceRevenueFilters {
  const parsed = typeof value === 'object' && value !== null
    ? value as Partial<LiveBalanceRevenueFilters>
    : null;

  const defaultRange = getDefaultCustomRange();
  const period = parsed?.period && LIVE_BALANCE_ALLOWED_PERIODS.includes(parsed.period)
    ? parsed.period
    : DEFAULT_LIVE_BALANCE_SETTINGS.revenueFilters.period;

  return {
    period,
    startDate: parsed?.startDate ?? defaultRange.startDate,
    endDate: parsed?.endDate ?? defaultRange.endDate,
  };
}

function resolveNotificationFilters(value: unknown): LiveBalanceNotificationFilters {
  const parsed = typeof value === 'object' && value !== null
    ? value as Partial<LiveBalanceNotificationFilters>
    : null;

  return {
    showApprovedNotifications: parsed?.showApprovedNotifications ?? DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS.showApprovedNotifications,
    showPendingNotifications: parsed?.showPendingNotifications ?? DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS.showPendingNotifications,
    showFailedNotifications: parsed?.showFailedNotifications ?? DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS.showFailedNotifications,
    showRefundedNotifications: parsed?.showRefundedNotifications ?? DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS.showRefundedNotifications,
    showPayoutNotifications: parsed?.showPayoutNotifications ?? DEFAULT_LIVE_BALANCE_NOTIFICATION_FILTERS.showPayoutNotifications,
  };
}

export function shouldShowLiveBalanceNotification(
  statusType: NotificationStatusType | null,
  type: NotificationType,
  title: string,
  message: string | null,
  filters: LiveBalanceNotificationFilters
) {
  if (!statusType) {
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedMessage = (message ?? '').trim().toLowerCase();
    const normalizedText = `${normalizedTitle} ${normalizedMessage}`;

    if (type === NotificationType.Payment) {
      if (filters.showPendingNotifications && normalizedText.includes('pendente')) {
        return true;
      }

      if (filters.showApprovedNotifications && normalizedText.includes('aprovad')) {
        return true;
      }
    }

    return false;
  }

  if (statusType === NotificationStatusType.PaymentCompleted) {
    return filters.showApprovedNotifications;
  }

  if (statusType === NotificationStatusType.PaymentPending) {
    return filters.showPendingNotifications;
  }

  if (
    statusType === NotificationStatusType.PaymentFailed
    || statusType === NotificationStatusType.PaymentExpired
  ) {
    return filters.showFailedNotifications;
  }

  if (statusType === NotificationStatusType.PaymentRefunded) {
    return filters.showRefundedNotifications;
  }

  if (
    statusType === NotificationStatusType.PayoutPending
    || statusType === NotificationStatusType.PayoutProcessing
    || statusType === NotificationStatusType.PayoutCompleted
    || statusType === NotificationStatusType.PayoutFailed
    || statusType === NotificationStatusType.PayoutRejected
    || statusType === NotificationStatusType.PayoutCancelled
  ) {
    return filters.showPayoutNotifications;
  }

  return false;
}

function resolveBackgroundId(value: unknown): LiveBalanceBackgroundId {
  const parsed = typeof value === 'string' ? value : '';
  const match = LIVE_BALANCE_BACKGROUND_OPTIONS.find((item) => item.id === parsed);
  return match?.id ?? DEFAULT_LIVE_BALANCE_SETTINGS.backgroundId;
}

export function getStoredLiveBalanceSettings(): LiveBalanceSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_LIVE_BALANCE_SETTINGS;
  }

  const legacyBackground = localStorage.getItem(LEGACY_BACKGROUND_STORAGE_KEY);
  const raw = localStorage.getItem(BaseLocalStorage.liveBalanceSettings);

  if (!raw) {
    return {
      ...DEFAULT_LIVE_BALANCE_SETTINGS,
      backgroundId: resolveBackgroundId(legacyBackground),
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LiveBalanceSettings>;
    return {
      backgroundId: resolveBackgroundId(parsed.backgroundId ?? legacyBackground),
      revenueFilters: resolveRevenueFilters(parsed.revenueFilters),
      showNotifications: parsed.showNotifications ?? DEFAULT_LIVE_BALANCE_SETTINGS.showNotifications,
      notificationFilters: resolveNotificationFilters(parsed.notificationFilters),
      enablePaymentSound: parsed.enablePaymentSound ?? DEFAULT_LIVE_BALANCE_SETTINGS.enablePaymentSound,
      enableConfetti: parsed.enableConfetti ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableConfetti,
      enableProfitPulse: parsed.enableProfitPulse ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableProfitPulse,
      enableWealthBurst: parsed.enableWealthBurst ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableWealthBurst,
      enableMoneyRain: parsed.enableMoneyRain ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableMoneyRain,
      enableVictoryOrbit: parsed.enableVictoryOrbit ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableVictoryOrbit,
      enableSellerStickers: parsed.enableSellerStickers ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableSellerStickers,
      enableCashTrail: parsed.enableCashTrail ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableCashTrail,
      enableJackpotFlash: parsed.enableJackpotFlash ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableJackpotFlash,
      enableDiamondDust: parsed.enableDiamondDust ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableDiamondDust,
      enableRoyalCrown: parsed.enableRoyalCrown ?? DEFAULT_LIVE_BALANCE_SETTINGS.enableRoyalCrown,
    };
  } catch {
    return {
      ...DEFAULT_LIVE_BALANCE_SETTINGS,
      backgroundId: resolveBackgroundId(legacyBackground),
    };
  }
}

export function loadStoredLiveBalanceSettings(): LiveBalanceSettings {
  return getStoredLiveBalanceSettings();
}

export function persistLiveBalanceSettings(settings: LiveBalanceSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(BaseLocalStorage.liveBalanceSettings, JSON.stringify(settings));
  localStorage.setItem(LEGACY_BACKGROUND_STORAGE_KEY, settings.backgroundId);
}