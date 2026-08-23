'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { Cancel01Icon, LiveStreaming02Icon, Moon02Icon, Settings02Icon, Sun02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { NumberTicket } from '@/components/ui/number-ticket';
import { useTheme } from 'next-themes';
import { cn } from '@/utils/utils';
import { useNotifications } from '@/contexts/notification-context';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import type { NotificationData } from '@/types/merchant/notifications';
import type { UserNotificationData } from '@/types/user/notifications';
import { NotificationPriority, NotificationStatusType, NotificationType } from '@/types/enums';
import { LiveBalanceBackgroundRenderer } from './backgrounds';
import { LiveBalanceEffects } from './live-balance-effects';
import { LiveBalanceNotificationStack, type LiveBalanceOverlayNotification } from './live-balance-notification-stack';
import { LiveBalanceSettingsModal } from './live-balance-settings-modal';
import {
  DEFAULT_LIVE_BALANCE_SETTINGS,
  loadStoredLiveBalanceSettings,
  persistLiveBalanceSettings,
  type LiveBalanceSettings,
  shouldShowLiveBalanceNotification,
} from './settings';

interface LiveBalanceScreenProps {
  onBack: () => void;
  totalRevenue: number | null;
  isRevenueReady?: boolean;
  onSettingsChange?: (settings: LiveBalanceSettings) => void;
}

const LIVE_BALANCE_NOTIFICATION_TTL_MS = 6500;
const LIVE_BALANCE_NOTIFICATION_EXIT_MS = 220;
const LIVE_BALANCE_STACK_LIMIT = 4;
const THOUSAND_REAIS_IN_CENTS = 100000;

function buildOverlayNotification(
  notification: NotificationData | UserNotificationData,
  isMerchant: boolean
): LiveBalanceOverlayNotification {
  return {
    toastId: `${notification.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    statusType: notification.statusType,
    priority: notification.priority,
    createdAt: notification.createdAt,
    isMerchant,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

function buildApprovedSaleOverlayFromBalanceIncrease(increaseAmount: number): LiveBalanceOverlayNotification {
  return {
    toastId: `approved-sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    id: `approved-sale-${Date.now()}`,
    title: 'Venda aprovada',
    message: `${formatCurrency(increaseAmount)} em novo faturamento.`,
    type: NotificationType.Payment,
    statusType: NotificationStatusType.PaymentCompleted,
    priority: NotificationPriority.High,
    createdAt: new Date().toISOString(),
    isMerchant: true,
  };
}

export function LiveBalanceScreen({ onBack, totalRevenue, isRevenueReady = true, onSettingsChange }: LiveBalanceScreenProps) {
  const [settings, setSettings] = useState(DEFAULT_LIVE_BALANCE_SETTINGS);
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [overlayNotifications, setOverlayNotifications] = useState<LiveBalanceOverlayNotification[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [profitPulseKey, setProfitPulseKey] = useState(0);
  const [wealthBurstKey, setWealthBurstKey] = useState(0);
  const [moneyRainKey, setMoneyRainKey] = useState(0);
  const [victoryOrbitKey, setVictoryOrbitKey] = useState(0);
  const [sellerStickerKey, setSellerStickerKey] = useState(0);
  const [cashTrailKey, setCashTrailKey] = useState(0);
  const [jackpotFlashKey, setJackpotFlashKey] = useState(0);
  const [diamondDustKey, setDiamondDustKey] = useState(0);
  const [royalCrownKey, setRoyalCrownKey] = useState(0);
  const [lastIncreaseAmount, setLastIncreaseAmount] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const merchantNotifications = useNotifications();
  const { playCashinSound } = useNotificationSound();
  const activeTheme = resolvedTheme === 'light' ? 'light' : 'dark';
  const isDark = activeTheme === 'dark';
  const isLight = activeTheme === 'light';
  const resolvedTotalRevenue = totalRevenue ?? 0;
  const previousRevenueRef = useRef<number | null>(null);
  const latestTotalRevenueRef = useRef(resolvedTotalRevenue);
  const signalRNotificationVersionRef = useRef(merchantNotifications.signalRNotificationVersion);
  const seenMerchantSignalRVersionRef = useRef(merchantNotifications.signalRNotificationVersion);
  const latestSignalRPaymentCompletedAtRef = useRef<number | null>(null);
  const dismissTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const removeTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    latestTotalRevenueRef.current = resolvedTotalRevenue;
  }, [resolvedTotalRevenue]);

  useEffect(() => {
    signalRNotificationVersionRef.current = merchantNotifications.signalRNotificationVersion;
  }, [merchantNotifications.signalRNotificationVersion]);

  function clearNotificationTimeouts() {
    dismissTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    dismissTimeoutsRef.current.clear();

    removeTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    removeTimeoutsRef.current.clear();
  }

  const dismissOverlayNotification = useCallback((toastId: string) => {
    const dismissTimeout = dismissTimeoutsRef.current.get(toastId);
    if (dismissTimeout) {
      clearTimeout(dismissTimeout);
      dismissTimeoutsRef.current.delete(toastId);
    }

    if (removeTimeoutsRef.current.has(toastId)) {
      return;
    }

    setOverlayNotifications((current) => current.map((item) => (
      item.toastId === toastId
        ? { ...item, isClosing: true }
        : item
    )));

    const timeoutId = setTimeout(() => {
      setOverlayNotifications((current) => current.filter((item) => item.toastId !== toastId));
      removeTimeoutsRef.current.delete(toastId);
    }, LIVE_BALANCE_NOTIFICATION_EXIT_MS);

    removeTimeoutsRef.current.set(toastId, timeoutId);
  }, []);

  const enqueueOverlayNotification = useCallback((notification: LiveBalanceOverlayNotification) => {
    setOverlayNotifications((current) => [{ ...notification, isClosing: false }, ...current].slice(0, LIVE_BALANCE_STACK_LIMIT));

    const timeoutId = setTimeout(() => {
      dismissOverlayNotification(notification.toastId);
    }, LIVE_BALANCE_NOTIFICATION_TTL_MS);

    dismissTimeoutsRef.current.set(notification.toastId, timeoutId);
  }, [dismissOverlayNotification]);

  useEffect(() => {
    queueMicrotask(() => {
      setSettings(loadStoredLiveBalanceSettings());
      setHasLoadedStoredSettings(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSettings) {
      return;
    }

    persistLiveBalanceSettings(settings);
    onSettingsChange?.(settings);
  }, [hasLoadedStoredSettings, onSettingsChange, settings]);

  useEffect(() => {
    previousRevenueRef.current = isRevenueReady ? latestTotalRevenueRef.current : null;
    seenMerchantSignalRVersionRef.current = signalRNotificationVersionRef.current;
    latestSignalRPaymentCompletedAtRef.current = null;
    clearNotificationTimeouts();

    return () => {
      clearNotificationTimeouts();
    };
  }, [isRevenueReady]);

  useEffect(() => {
    queueMicrotask(() => {
      setOverlayNotifications([]);
    });
  }, []);

  useEffect(() => {
    const previousRevenue = previousRevenueRef.current;
    if (!isRevenueReady) {
      return;
    }

    if (previousRevenue === null) {
      previousRevenueRef.current = resolvedTotalRevenue;
      return;
    }

    if (resolvedTotalRevenue <= previousRevenue) {
      previousRevenueRef.current = resolvedTotalRevenue;
      return;
    }

    const increaseAmount = resolvedTotalRevenue - previousRevenue;
    const previousMilestone = Math.floor(previousRevenue / THOUSAND_REAIS_IN_CENTS);
    const currentMilestone = Math.floor(resolvedTotalRevenue / THOUSAND_REAIS_IN_CENTS);
    const hasRecentSignalRApproved = latestSignalRPaymentCompletedAtRef.current !== null
      && Date.now() - latestSignalRPaymentCompletedAtRef.current <= 4000;

    setLastIncreaseAmount(increaseAmount);
    if (settings.enableProfitPulse) {
      setProfitPulseKey((current) => current + 1);
    }
    if (settings.enableWealthBurst) {
      setWealthBurstKey((current) => current + 1);
    }
    if (settings.enableMoneyRain) {
      setMoneyRainKey((current) => current + 1);
    }
    if (settings.enableVictoryOrbit) {
      setVictoryOrbitKey((current) => current + 1);
    }
    if (settings.enableSellerStickers) {
      setSellerStickerKey((current) => current + 1);
    }
    if (settings.enableCashTrail) {
      setCashTrailKey((current) => current + 1);
    }
    if (settings.enableJackpotFlash) {
      setJackpotFlashKey((current) => current + 1);
    }
    if (settings.enableDiamondDust) {
      setDiamondDustKey((current) => current + 1);
    }
    if (settings.enableRoyalCrown) {
      setRoyalCrownKey((current) => current + 1);
    }
    if (settings.showNotifications && settings.notificationFilters.showApprovedNotifications && !hasRecentSignalRApproved) {
      enqueueOverlayNotification(buildApprovedSaleOverlayFromBalanceIncrease(increaseAmount));
    }
    if (settings.enablePaymentSound && !hasRecentSignalRApproved) {
      playCashinSound(`live-balance-${previousRevenue}-${resolvedTotalRevenue}`);
    }

    if (settings.enableConfetti && currentMilestone > previousMilestone) {
      setConfettiKey((current) => current + 1);
    }

    previousRevenueRef.current = resolvedTotalRevenue;
  }, [enqueueOverlayNotification, isRevenueReady, playCashinSound, resolvedTotalRevenue, settings.enableCashTrail, settings.enableConfetti, settings.enableDiamondDust, settings.enableJackpotFlash, settings.enableMoneyRain, settings.enablePaymentSound, settings.enableProfitPulse, settings.enableRoyalCrown, settings.enableSellerStickers, settings.enableVictoryOrbit, settings.enableWealthBurst, settings.notificationFilters.showApprovedNotifications, settings.showNotifications]);

  useEffect(() => {
    if (merchantNotifications.signalRNotificationVersion <= seenMerchantSignalRVersionRef.current) {
      return;
    }

    seenMerchantSignalRVersionRef.current = merchantNotifications.signalRNotificationVersion;

    const latestMerchantNotification = merchantNotifications.latestSignalRNotification;

    if (
      !settings.showNotifications
      || !latestMerchantNotification
      || !shouldShowLiveBalanceNotification(
        latestMerchantNotification.statusType,
        latestMerchantNotification.type,
        latestMerchantNotification.title,
        latestMerchantNotification.message,
        settings.notificationFilters
      )
    ) {
      return;
    }

    if (latestMerchantNotification.statusType === NotificationStatusType.PaymentCompleted) {
      latestSignalRPaymentCompletedAtRef.current = Date.now();
    }

    queueMicrotask(() => {
      enqueueOverlayNotification(buildOverlayNotification(latestMerchantNotification, true));
    });
  }, [enqueueOverlayNotification, merchantNotifications.latestSignalRNotification, merchantNotifications.signalRNotificationVersion, settings.notificationFilters, settings.showNotifications]);

  useEffect(() => {
    if (settings.showNotifications) {
      return;
    }

    clearNotificationTimeouts();
    queueMicrotask(() => {
      setOverlayNotifications([]);
    });
  }, [settings.showNotifications]);

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-[#000000] text-white">
      <LiveBalanceBackgroundRenderer key={`${activeTheme}-${settings.backgroundId}`} backgroundId={settings.backgroundId} />

      <LiveBalanceEffects
        confettiKey={confettiKey}
        profitPulseKey={profitPulseKey}
        wealthBurstKey={wealthBurstKey}
        moneyRainKey={moneyRainKey}
        victoryOrbitKey={victoryOrbitKey}
        sellerStickerKey={sellerStickerKey}
        cashTrailKey={cashTrailKey}
        jackpotFlashKey={jackpotFlashKey}
        diamondDustKey={diamondDustKey}
        royalCrownKey={royalCrownKey}
        lastIncreaseAmount={lastIncreaseAmount}
        settings={settings}
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.22))] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.28))]" />

      {settings.showNotifications && (
        <LiveBalanceNotificationStack
          notifications={overlayNotifications}
          isLight={isLight}
          onDismiss={dismissOverlayNotification}
        />
      )}

      <div className="relative flex min-h-dvh w-full flex-col px-3 pb-4 pt-3 sm:px-6 sm:py-4">
        <div className="flex w-full items-center justify-between gap-2 sm:gap-3">
          <div className="inline-flex w-fit max-w-full shrink-0 items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 text-white ring-1 ring-white/12 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="truncate text-xs sm:text-sm font-bold font-mono tracking-wider uppercase text-white/90">PIX Live SPI</span>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-background/45 p-1 ring-1 ring-border/30 backdrop-blur-md dark:bg-black/25 dark:ring-white/10">
            <Button
              variant="ghost"
              isIconOnly
              aria-label="Alternar tema"
              onPress={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn('bg-background/40 backdrop-blur-sm dark:bg-black/20', isLight ? 'text-foreground/80' : 'text-white/80')}
            >
              <span className="dark:hidden">
                <Icon icon={Moon02Icon} className="icon-md" />
              </span>
              <span className="hidden dark:inline">
                <Icon icon={Sun02Icon} className="icon-md" />
              </span>
            </Button>
            <Button
              variant="ghost"
              isIconOnly
              aria-label="Configurar live balance"
              onPress={() => setIsSettingsOpen(true)}
              className={cn('bg-background/40 backdrop-blur-sm dark:bg-black/20', isLight ? 'text-foreground/80' : 'text-white/80')}
            >
              <Icon icon={Settings02Icon} className="icon-md" />
            </Button>

            <Button variant="secondary" isIconOnly aria-label="Voltar do live balance" onPress={onBack} className={cn(isLight && 'text-foreground')}>
              <Icon icon={Cancel01Icon} className="icon-md" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <NumberTicket
            value={resolvedTotalRevenue}
            durationMs={1650}
            className={cn(
              'text-[clamp(2.5rem,12vw,5rem)] sm:text-[clamp(3.5rem,11vw,11rem)] font-black leading-none font-mono tabular-nums tracking-tight drop-shadow-[0_14px_40px_rgba(0,0,0,0.65)] text-white'
            )}
          />
        </div>
      </div>

      <LiveBalanceSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
