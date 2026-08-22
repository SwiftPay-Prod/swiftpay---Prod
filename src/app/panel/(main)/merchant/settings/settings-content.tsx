'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  Button,
  Description,
  Label,
  Alert,
  Chip,
  Tabs,
  ComboBox,
  Select,
  Input,
  ListBox,
  Modal,
  Tooltip,
  toast,
} from '@heroui/react';
import type { Key } from '@heroui/react';
import {
  Delete02Icon,
  Settings02Icon,
  QrCodeIcon,
  BarCodeIcon,
  CreditCardIcon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Alert02Icon,
  HelpCircleIcon,
  History,
  ArrowReloadHorizontalIcon,
  ArrowDown01Icon,
  Crown03Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { MerchantDeleteModal } from '@/components/merchant/merchant-delete';
import { PageHeader } from '@/components/ui/page-header';
import { AsyncButton } from '@/components/ui/async-button';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { switchMerchantNominal, updateMerchantNominalAbTest } from '@/app/actions/merchant/settings';
import { MerchantKycOperationType } from '@/types/enums';
import { formatRelativeTime } from '@/utils/datetime';
import type { ChipColor } from '@/parse/types';
import type {
  ReadSettingsData,
  ReadNominalsData,
  MerchantNominalOption,
  MerchantNominalAbTestLimitType,
  ReadNominalsHistoryData,
  ReadNominalAbTestHistoryData,
  MerchantNominalAbTestHistoryItem,
} from '@/types/merchant/settings';
import { mapParseColorToChipColor } from '@/parse';

interface SettingsContentProps {
  merchantId: string;
  settings: ReadSettingsData;
  nominals: ReadNominalsData | null;
  nominalsHistory: ReadNominalsHistoryData | null;
  nominalAbTestHistory: ReadNominalAbTestHistoryData | null;
  nominalsError?: string | null;
}

const CHART_COLORS = {
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};

const approvalRateChartConfig = {
  variantAApprovalRate: {
    label: 'Aprovação A',
    color: CHART_COLORS.accent,
  },
  variantBApprovalRate: {
    label: 'Aprovação B',
    color: CHART_COLORS.warning,
  },
} satisfies ChartConfig;

const volumeChartConfig = {
  variantATotal: {
    label: 'Volume A',
    color: CHART_COLORS.accent,
  },
  variantBTotal: {
    label: 'Volume B',
    color: CHART_COLORS.warning,
  },
} satisfies ChartConfig;

function formatConversion(percentage: number): string {
  return `${percentage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatSplitPercent(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getConversionColor(percentage: number): ChipColor {
  if (percentage <= 0) return 'danger';
  if (percentage <= 20) return 'accent';
  if (percentage <= 50) return 'warning';
  return 'success';
}

function getConversionTextClassName(percentage: number): string {
  const color = getConversionColor(percentage);
  if (color === 'danger') return 'text-[#e23b4a]';
  if (color === 'accent') return 'text-[#4f55f1]';
  if (color === 'warning') return 'text-[#ec7e00]';
  return 'text-[#00a87e]';
}

function getApprovalRateEvolutionTextClassName(percentage: number): string {
  if (percentage <= 15) return 'text-[#e23b4a]';
  if (percentage <= 25) return 'text-[#ec7e00]';
  if (percentage <= 35) return 'text-amber-500';
  if (percentage <= 50) return 'text-[#4f55f1]';
  return 'text-[#00a87e]';
}

function getEffectiveConversion(last7Days: number | null, yesterday: number | null): number | null {
  if (last7Days == null && yesterday == null) return null;
  if (last7Days == null) return yesterday;
  if (yesterday == null) return last7Days;
  return last7Days > yesterday ? last7Days : yesterday;
}

function getGlobalEffectiveConversion(option: MerchantNominalOption): number | null {
  return getEffectiveConversion(option.conversionLast7Days, option.conversionYesterday);
}

function getMerchantEffectiveConversion(option: MerchantNominalOption): number | null {
  return getEffectiveConversion(option.merchantConversionLast7Days, option.merchantConversionYesterday);
}

function isNewNominal(option: MerchantNominalOption): boolean {
  if (option.totalTransactions === 0) return true;

  const createdAtTime = new Date(option.acquirerCreatedAt).getTime();
  if (!Number.isFinite(createdAtTime)) return false;

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAtTime < sevenDaysInMs;
}

function getApprovalRateLabel(last7Days: number | null, yesterday: number | null): 'Ontem' | '7d' {
  if (last7Days == null) return 'Ontem';
  if (yesterday == null) return '7d';
  return last7Days > yesterday ? '7d' : 'Ontem';
}

function getNominalDisplayLabel(option: MerchantNominalOption): string {
  const merchantName = option.acquirerDisplayName?.trim() ?? '';
  const nominal = option.nominal?.trim() ?? '';

  if (!merchantName) return nominal;
  if (!nominal) return merchantName;

  return `${merchantName} (${nominal})`;
}

function splitDisplayLabel(label: string): { merchantName: string; nominal: string | null } {
  if (!label.trim()) {
    return { merchantName: '', nominal: null };
  }

  const withParentheses = label.match(/^(.*)\s\((.*)\)$/);
  if (withParentheses && withParentheses[1] && withParentheses[2]) {
    return {
      merchantName: withParentheses[1].trim(),
      nominal: withParentheses[2].trim(),
    };
  }

  const withHyphen = label.match(/^(.*)\s-\s(.*)$/);
  if (withHyphen && withHyphen[1] && withHyphen[2]) {
    return {
      merchantName: withHyphen[1].trim(),
      nominal: withHyphen[2].trim(),
    };
  }

  return { merchantName: label, nominal: null };
}

function getOperationLabel(operationType: MerchantKycOperationType | null): string {
  if (operationType === MerchantKycOperationType.Black) return 'Black';
  if (operationType === MerchantKycOperationType.White) return 'White';
  return 'Não definido';
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Não definido';

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Não definido';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getAbLimitLabel(item: MerchantNominalAbTestHistoryItem): string {
  if (item.limitType === 'Days') {
    return `${item.maxDurationDays ?? 7} dia(s)`;
  }

  return `${item.maxTransactions ?? 0} transações`;
}

function getAbWinnerLabel(item: MerchantNominalAbTestHistoryItem): string {
  if (!item.winnerMerchantAcquirerId) return 'Sem vencedor definido';
  if (item.winnerMerchantAcquirerId === item.variantA.merchantAcquirerId) return `Vencedor: ${item.variantA.displayLabel}`;
  if (item.winnerMerchantAcquirerId === item.variantB.merchantAcquirerId) return `Vencedor: ${item.variantB.displayLabel}`;
  return 'Vencedor não encontrado';
}

function MethodChip({ enabled, label, icon, colorClass }: { enabled: boolean; label: string; icon: typeof QrCodeIcon; colorClass: string }) {
  if (!enabled) return null;

  return (
    <Chip size="sm" className={`h-5 gap-0.5 text-xs ${colorClass}`}>
      <Icon icon={icon} className="size-3" />
      {label}
    </Chip>
  );
}

function HelpHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <Tooltip.Trigger className="inline-flex items-center align-middle">
        <Icon icon={HelpCircleIcon} className="icon-xs shrink-0 cursor-help text-white/50" />
      </Tooltip.Trigger>
      <Tooltip.Content className="max-w-72">
        <Tooltip.Arrow />
        {text}
      </Tooltip.Content>
    </Tooltip>
  );
}

interface NominalOptionListItemProps {
  item: MerchantNominalOption;
}

function NominalOptionListItem({ item }: NominalOptionListItemProps) {
  const isNew = isNewNominal(item);
  const globalEffective = getGlobalEffectiveConversion(item);
  const globalLabel = getApprovalRateLabel(item.conversionLast7Days, item.conversionYesterday);
  const merchantEffective = getMerchantEffectiveConversion(item);
  const merchantLabel = getApprovalRateLabel(item.merchantConversionLast7Days, item.merchantConversionYesterday);
  const displayLabel = getNominalDisplayLabel(item);

  return (
    <ListBox.Item
      id={item.acquirerId}
      textValue={isNew
        ? `${displayLabel} Novo`
        : `${displayLabel} Taxa global (${globalLabel}) ${globalEffective == null ? 'Sem dados' : formatConversion(globalEffective)} Taxa da sua org. (${merchantLabel}) ${merchantEffective == null ? 'Sem dados' : formatConversion(merchantEffective)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {item.acquirerDisplayName ? (
            <>
              <span className="text-xs text-white">{item.acquirerDisplayName}</span>
              <span className="text-xs font-light italic text-white/50">({item.nominal})</span>
            </>
          ) : (
            <span className="text-xs font-light italic text-white/50">{item.nominal}</span>
          )}
          {item.isCurrent && (
            <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
              Atual
            </Chip>
          )}
          {item.isInAbTest && (
            <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
              Teste A/B
            </Chip>
          )}
          {isNew ? (
            <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
              Novo
            </Chip>
          ) : (
            <>
              <span className="text-xs text-white/50">
                {globalLabel === '7d' ? 'Taxa global (7d):' : 'Taxa global (Ontem):'}
              </span>
              <span className={`text-xs font-medium ${getConversionTextClassName(globalEffective ?? 0)}`}>
                {globalEffective == null ? 'Sem dados' : formatConversion(globalEffective)}
              </span>
              <span className="text-xs text-white/50">|</span>
              <span className="text-xs text-white/50">
                {merchantLabel === '7d' ? 'Taxa da sua org. (7d):' : 'Taxa da sua org. (Ontem):'}
              </span>
              <span className={`text-xs font-medium ${getConversionTextClassName(merchantEffective ?? 0)}`}>
                {merchantEffective == null ? 'Sem dados' : formatConversion(merchantEffective)}
              </span>
            </>
          )}
        </div>
      </div>
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
}

export function SettingsContent({
  merchantId,
  settings,
  nominals,
  nominalsHistory,
  nominalAbTestHistory,
  nominalsError,
}: SettingsContentProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSwitchPending, startTransition] = useTransition();
  const [isAbTestPending, startAbTestTransition] = useTransition();
  const [isStopAbTestModalOpen, setIsStopAbTestModalOpen] = useState(false);
  const [expandedAbHistoryKeys, setExpandedAbHistoryKeys] = useState<Set<Key>>(new Set());
  const [nominalQuery, setNominalQuery] = useState('');
  const router = useRouter();

  const currentNominal = useMemo(() => nominals?.nominals.find((item) => item.isCurrent) ?? null, [nominals]);

  const [selectedAcquirerId, setSelectedAcquirerId] = useState<string>(currentNominal?.acquirerId ?? '');

  const hasSelectedNominal = useMemo(
    () => !!nominals?.nominals.some((item) => item.acquirerId === selectedAcquirerId),
    [nominals, selectedAcquirerId]
  );

  const effectiveSelectedAcquirerId = hasSelectedNominal ? selectedAcquirerId : (currentNominal?.acquirerId ?? '');

  const selectedNominal = useMemo(
    () => nominals?.nominals.find((item) => item.acquirerId === effectiveSelectedAcquirerId) ?? null,
    [nominals, effectiveSelectedAcquirerId]
  );

  const sortedNominalsForSelect = useMemo(() => {
    if (!nominals?.nominals) return [];

    return [...nominals.nominals].sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;

      const aIsNew = isNewNominal(a);
      const bIsNew = isNewNominal(b);

      if (aIsNew && !bIsNew) return 1;
      if (!aIsNew && bIsNew) return -1;

      const conversionA = getGlobalEffectiveConversion(a);
      const conversionB = getGlobalEffectiveConversion(b);

      if (conversionA == null && conversionB != null) return 1;
      if (conversionA != null && conversionB == null) return -1;

      if (conversionA != null && conversionB != null && conversionA !== conversionB) {
        return conversionB - conversionA;
      }

      return getNominalDisplayLabel(a).localeCompare(getNominalDisplayLabel(b), 'pt-BR');
    });
  }, [nominals]);

  const filteredNominals = useMemo(() => {
    const query = nominalQuery.trim().toLowerCase();
    if (!query) return sortedNominalsForSelect;

    return sortedNominalsForSelect.filter((item) => {
      const label = getNominalDisplayLabel(item);
      if (isNewNominal(item)) {
        return `${label} novo`.toLowerCase().includes(query);
      }

      const globalEffective = getGlobalEffectiveConversion(item);
      const merchantEffective = getMerchantEffectiveConversion(item);
      const globalText = globalEffective == null
        ? 'sem dados'
        : formatConversion(globalEffective);
      const merchantText = merchantEffective == null
        ? 'sem dados'
        : formatConversion(merchantEffective);
      const globalLabel = getApprovalRateLabel(item.conversionLast7Days, item.conversionYesterday) === '7d'
        ? 'Taxa global (7d)'
        : 'Taxa global (Ontem)';
      const merchantLabel = getApprovalRateLabel(item.merchantConversionLast7Days, item.merchantConversionYesterday) === '7d'
        ? 'Taxa da sua org. (7d)'
        : 'Taxa da sua org. (Ontem)';
      const searchText = `${label} ${globalLabel} ${globalText} ${merchantLabel} ${merchantText}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [sortedNominalsForSelect, nominalQuery]);

  const canSwitch = !!selectedNominal && effectiveSelectedAcquirerId !== currentNominal?.acquirerId;
  const isNominalSwitchBlocked = !settings.selfNominalSwitchEnabled;

  const merchantAcquirerById = useMemo(() => {
    const map = new Map<string, MerchantNominalOption>();
    for (const item of nominals?.nominals ?? []) {
      if (item.merchantAcquirerId) {
        map.set(item.merchantAcquirerId, item);
      }
    }
    return map;
  }, [nominals]);

  const nominalByAcquirerId = useMemo(() => {
    const map = new Map<string, MerchantNominalOption>();
    for (const item of nominals?.nominals ?? []) {
      map.set(item.acquirerId, item);
    }
    return map;
  }, [nominals]);

  const activeAbTest = nominals?.abTest?.isActive ? nominals.abTest : null;

  const defaultVariantAAcquirerId = activeAbTest?.variantAMerchantAcquirerId
    ? (merchantAcquirerById.get(activeAbTest.variantAMerchantAcquirerId)?.acquirerId ?? '')
    : (currentNominal?.acquirerId ?? '');

  const defaultVariantBAcquirerId = activeAbTest?.variantBMerchantAcquirerId
    ? (merchantAcquirerById.get(activeAbTest.variantBMerchantAcquirerId)?.acquirerId ?? '')
    : (nominals?.nominals.find((item) => item.acquirerId !== defaultVariantAAcquirerId)?.acquirerId ?? '');

  const [abVariantAAcquirerId, setAbVariantAAcquirerId] = useState(defaultVariantAAcquirerId);
  const [abVariantBAcquirerId, setAbVariantBAcquirerId] = useState(defaultVariantBAcquirerId);
  const [abVariantAWeightPercent, setAbVariantAWeightPercent] = useState(activeAbTest?.variantAWeightPercent ?? 50);
  const [abLimitType, setAbLimitType] = useState<MerchantNominalAbTestLimitType>(activeAbTest?.limitType ?? 'Days');
  const [abMaxDurationDays, setAbMaxDurationDays] = useState<number>(activeAbTest?.maxDurationDays ?? 7);
  const [abMaxTransactions, setAbMaxTransactions] = useState<number>(activeAbTest?.maxTransactions ?? 100);
  const [abWinnerMerchantAcquirerId, setAbWinnerMerchantAcquirerId] = useState(
    activeAbTest?.winnerMerchantAcquirerId ?? activeAbTest?.variantAMerchantAcquirerId ?? ''
  );

  const abNominalOptions = sortedNominalsForSelect;

  const abVariantAOptions = useMemo(
    () => abNominalOptions.filter((item) => item.acquirerId !== abVariantBAcquirerId),
    [abNominalOptions, abVariantBAcquirerId]
  );

  const abVariantBOptions = useMemo(
    () => abNominalOptions.filter((item) => item.acquirerId !== abVariantAAcquirerId),
    [abNominalOptions, abVariantAAcquirerId]
  );

  const abVariantA = activeAbTest
    ? merchantAcquirerById.get(activeAbTest.variantAMerchantAcquirerId)
    : null;

  const abVariantB = activeAbTest
    ? merchantAcquirerById.get(activeAbTest.variantBMerchantAcquirerId)
    : null;

  const activeAbTestWinnerOptions = useMemo(() => {
    if (!activeAbTest) return [];

    return abNominalOptions.filter((item) => item.merchantAcquirerId
      && (item.merchantAcquirerId === activeAbTest.variantAMerchantAcquirerId
        || item.merchantAcquirerId === activeAbTest.variantBMerchantAcquirerId));
  }, [activeAbTest, abNominalOptions]);

  const activeAbTestHistoryItem = useMemo(
    () => nominalAbTestHistory?.items.find((item) => item.isActive) ?? null,
    [nominalAbTestHistory]
  );

  const winnerSelectionOptions = useMemo(() => {
    if (activeAbTestHistoryItem) {
      return [
        {
          merchantAcquirerId: activeAbTestHistoryItem.variantA.merchantAcquirerId,
          displayLabel: activeAbTestHistoryItem.variantA.displayLabel,
          approvalRate: activeAbTestHistoryItem.variantA.approvalRate,
          approvedTransactions: activeAbTestHistoryItem.variantA.approvedTransactions,
          totalTransactions: activeAbTestHistoryItem.variantA.totalTransactions,
          variantLabel: 'Variante A',
          color: 'accent' as const,
        },
        {
          merchantAcquirerId: activeAbTestHistoryItem.variantB.merchantAcquirerId,
          displayLabel: activeAbTestHistoryItem.variantB.displayLabel,
          approvalRate: activeAbTestHistoryItem.variantB.approvalRate,
          approvedTransactions: activeAbTestHistoryItem.variantB.approvedTransactions,
          totalTransactions: activeAbTestHistoryItem.variantB.totalTransactions,
          variantLabel: 'Variante B',
          color: 'warning' as const,
        },
      ];
    }

    return activeAbTestWinnerOptions.map((item, index) => ({
      merchantAcquirerId: item.merchantAcquirerId!,
      displayLabel: getNominalDisplayLabel(item),
      approvalRate: null,
      approvedTransactions: null,
      totalTransactions: null,
      variantLabel: index === 0 ? 'Variante A' : 'Variante B',
      color: index === 0 ? ('accent' as const) : ('warning' as const),
    }));
  }, [activeAbTestHistoryItem, activeAbTestWinnerOptions]);

  const canStartAbTest = !!abVariantAAcquirerId
    && !!abVariantBAcquirerId
    && abVariantAAcquirerId !== abVariantBAcquirerId
    && abVariantAWeightPercent >= 0.01
    && abVariantAWeightPercent <= 99.99
    && ((abLimitType === 'Days' && abMaxDurationDays >= 1 && abMaxDurationDays <= 7)
      || (abLimitType === 'Transactions' && abMaxTransactions > 0))
    && !activeAbTest;

  const selectedAbVariantA = nominalByAcquirerId.get(abVariantAAcquirerId);
  const selectedAbVariantB = nominalByAcquirerId.get(abVariantBAcquirerId);

  const nominalTabItems: InternalTabItem[] = [
    { id: 'nominals', label: 'Nominais', icon: <Icon icon={Settings02Icon} className="icon-sm" /> },
    { id: 'ab-test', label: 'Teste A/B', icon: <Icon icon={History} className="icon-sm" /> },
    { id: 'danger', label: 'Danger', icon: <Icon icon={Alert02Icon} className="icon-sm" /> },
  ];

  function handleSwitchNominal() {
    if (isNominalSwitchBlocked) {
      toast('Troca de nominal indisponível', {
        description: 'No momento a troca de nominal não está disponível para sua organização.',
        indicator: <Icon icon={Alert02Icon} className="icon-sm" />,
        variant: 'warning',
      });
      return;
    }

    if (!effectiveSelectedAcquirerId) return;

    startTransition(async () => {
      const response = await switchMerchantNominal(merchantId, { acquirerId: effectiveSelectedAcquirerId });

      if (response?.error) {
        toast('Erro ao trocar nominal', {
          description: response.error.message || 'Não foi possível trocar a nominal agora.',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
          variant: 'danger',
        });
        return;
      }

      toast('Nominal atualizada', {
        description: response?.data?.message || 'A nominal de processamento foi alterada com sucesso.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });

      router.refresh();
    });
  }

  function handleStartAbTest() {
    if (!canStartAbTest) return;

    startAbTestTransition(async () => {
      const response = await updateMerchantNominalAbTest(merchantId, {
        enabled: true,
        variantAAcquirerId: abVariantAAcquirerId,
        variantBAcquirerId: abVariantBAcquirerId,
        variantAWeightPercent: abVariantAWeightPercent,
        limitType: abLimitType,
        maxDurationDays: abLimitType === 'Days' ? abMaxDurationDays : undefined,
        maxTransactions: abLimitType === 'Transactions' ? abMaxTransactions : undefined,
      });

      if (response?.error) {
        toast('Erro ao ativar teste A/B', {
          description: response.error.message || 'Não foi possível ativar o teste A/B agora.',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
          variant: 'danger',
        });
        return;
      }

      toast('Teste A/B ativado', {
        description: response?.data?.message || 'O teste A/B foi iniciado com sucesso.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });

      router.refresh();
    });
  }

  function handleStopAbTest() {
    if (!abWinnerMerchantAcquirerId) {
      toast('Selecione a nominal vencedora', {
        description: 'Escolha qual nominal deve permanecer ativa ao encerrar o teste A/B.',
        indicator: <Icon icon={Alert02Icon} className="icon-sm" />,
        variant: 'warning',
      });
      return;
    }

    startAbTestTransition(async () => {
      const response = await updateMerchantNominalAbTest(merchantId, {
        enabled: false,
        winnerMerchantAcquirerId: abWinnerMerchantAcquirerId,
      });

      if (response?.error) {
        toast('Erro ao encerrar teste A/B', {
          description: response.error.message || 'Não foi possível encerrar o teste A/B agora.',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
          variant: 'danger',
        });
        return;
      }

      toast('Teste A/B encerrado', {
        description: response?.data?.message || 'O teste A/B foi encerrado com sucesso.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });

      setIsStopAbTestModalOpen(false);
      router.refresh();
    });
  }

  function handleOpenStopAbTestModal() {
    if (!activeAbTest) return;

    setAbWinnerMerchantAcquirerId(
      activeAbTest.winnerMerchantAcquirerId
      ?? activeAbTest.variantAMerchantAcquirerId
      ?? ''
    );
    setIsStopAbTestModalOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-4 bg-[#000000] text-white">
        <PageHeader
          icon={<Icon icon={Settings02Icon} size={24} />}
          title="Configurações"
          description="Gerencie as configurações da sua organização."
        />

        <InternalTabs
          ariaLabel="Abas internas de configurações de nominal"
          items={nominalTabItems}
          defaultSelectedKey="nominals"
        >
          <Tabs.Panel id="nominals" className="flex flex-col gap-4 p-0 pt-4">
            <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
              <div>
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="inline-flex items-center gap-1">
                      <span>Nominal de processamento</span>
                      <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                        Experimental
                      </Chip>
                    </span>
                  </div>
                  <Description>
                    Escolha entre todas as nominais disponíveis para seu tipo de conta e aplique quando desejar.
                  </Description>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Alert status="accent">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Tipo operacional: {getOperationLabel(nominals?.merchantOperationType ?? null)}</Alert.Title>
                    <Alert.Description>
                      Você só pode selecionar nominais compatíveis com seu tipo operacional.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>

                {nominals?.hasLegacyBalanceWarning && (
                  <Alert status="warning">
                    <Alert.Indicator>
                      <Icon icon={Alert02Icon} className="icon-sm" />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>Atenção com saldo legado</Alert.Title>
                      <Alert.Description>{nominals.legacyBalanceWarningMessage}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                {isNominalSwitchBlocked && (
                  <Alert status="warning">
                    <Alert.Indicator>
                      <Icon icon={Alert02Icon} className="icon-sm" />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>Troca de nominal indisponível</Alert.Title>
                      <Alert.Description>
                        No momento a troca de nominal não está disponível para sua organização. Fale com o administrador da plataforma.
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                {!nominals || nominals.nominals.length === 0 ? (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Sem nominais disponíveis</Alert.Title>
                      <Alert.Description>
                        {nominalsError || 'Nenhuma nominal compatível foi encontrada para sua organização.'}
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : (
                  <div className="flex flex-col gap-3">
                    <ComboBox
                      className="w-full"
                      selectedKey={effectiveSelectedAcquirerId || null}
                      isDisabled={isNominalSwitchBlocked}
                      inputValue={nominalQuery}
                      onInputChange={setNominalQuery}
                      onOpenChange={(isOpen) => {
                        if (isOpen) setNominalQuery('');
                      }}
                      onSelectionChange={(key) => {
                        setSelectedAcquirerId((key as Key | null)?.toString() ?? '');
                        setNominalQuery('');
                      }}
                    >
                      <Label>Nominal</Label>
                      <ComboBox.InputGroup>
                        <Input variant="secondary" placeholder="Buscar nominal por nome" />
                        <ComboBox.Trigger />
                      </ComboBox.InputGroup>
                      <ComboBox.Popover>
                        <ListBox
                          className="max-h-72 overflow-y-auto"
                          renderEmptyState={() => <div className="px-3 py-2 text-sm text-white/50">Nenhuma nominal encontrada</div>}
                        >
                          {filteredNominals.map((item) => {
                            const isNew = isNewNominal(item);
                            const globalEffective = getGlobalEffectiveConversion(item);
                            const globalLabel = getApprovalRateLabel(item.conversionLast7Days, item.conversionYesterday);
                            const merchantEffective = getMerchantEffectiveConversion(item);
                            const merchantLabel = getApprovalRateLabel(item.merchantConversionLast7Days, item.merchantConversionYesterday);
                            const displayLabel = getNominalDisplayLabel(item);

                            return (
                              <ListBox.Item
                                key={item.acquirerId}
                                id={item.acquirerId}
                                textValue={isNew
                                  ? `${displayLabel} Novo`
                                  : `${displayLabel} Taxa global (${globalLabel}) ${globalEffective == null ? 'Sem dados' : formatConversion(globalEffective)} Taxa da sua org. (${merchantLabel}) ${merchantEffective == null ? 'Sem dados' : formatConversion(merchantEffective)}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {item.acquirerDisplayName ? (
                                      <>
                                        <span className="text-xs text-white">{item.acquirerDisplayName}</span>
                                        <span className="text-xs font-light italic text-white/50">({item.nominal})</span>
                                      </>
                                    ) : (
                                      <span className="text-xs font-light italic text-white/50">{item.nominal}</span>
                                    )}
                                    {item.isCurrent && (
                                      <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
                                        Atual
                                      </Chip>
                                    )}
                                    {item.isInAbTest && (
                                      <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
                                        Teste A/B
                                      </Chip>
                                    )}
                                    {isNew ? (
                                      <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                                        Novo
                                      </Chip>
                                    ) : (
                                      <>
                                        <span className="text-xs text-white/50">
                                          {globalLabel === '7d' ? 'Taxa global (7d):' : 'Taxa global (Ontem):'}
                                        </span>
                                        <span className={`text-xs font-medium ${getConversionTextClassName(globalEffective ?? 0)}`}>
                                          {globalEffective == null ? 'Sem dados' : formatConversion(globalEffective)}
                                        </span>
                                        <span className="text-xs text-white/50">|</span>
                                        <span className="text-xs text-white/50">
                                          {merchantLabel === '7d' ? 'Taxa da sua org. (7d):' : 'Taxa da sua org. (Ontem):'}
                                        </span>
                                        <span className={`text-xs font-medium ${getConversionTextClassName(merchantEffective ?? 0)}`}>
                                          {merchantEffective == null ? 'Sem dados' : formatConversion(merchantEffective)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            );
                          })}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>

                    {selectedNominal && (
                      <div className="flex flex-col gap-2 rounded-lg border border-white/12 p-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold">
                            {selectedNominal.acquirerDisplayName ? (
                              <>
                                <span>{selectedNominal.acquirerDisplayName}</span>{' '}
                                <span className="font-light italic text-white/50">({selectedNominal.nominal})</span>
                              </>
                            ) : (
                              <span className="font-light italic text-white/50">{selectedNominal.nominal}</span>
                            )}
                          </Label>
                          {isNewNominal(selectedNominal) ? (
                            <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                              Novo
                            </Chip>
                          ) : (
                            <>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={getConversionColor(getGlobalEffectiveConversion(selectedNominal) ?? 0)}
                                className="h-5 text-xs"
                              >
                                Global: {getGlobalEffectiveConversion(selectedNominal) == null ? 'Sem dados' : formatConversion(getGlobalEffectiveConversion(selectedNominal) ?? 0)}
                              </Chip>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={getConversionColor(getMerchantEffectiveConversion(selectedNominal) ?? 0)}
                                className="h-5 text-xs"
                              >
                                Sua org.: {getMerchantEffectiveConversion(selectedNominal) == null ? 'Sem dados' : formatConversion(getMerchantEffectiveConversion(selectedNominal) ?? 0)}
                              </Chip>
                            </>
                          )}
                          {selectedNominal.isCurrent && (
                            <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
                              Atual
                            </Chip>
                          )}
                          {selectedNominal.isInAbTest && (
                            <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
                              Teste A/B
                            </Chip>
                          )}
                        </div>
                        <Description className="text-xs">
                          Transações nessa nominal: {selectedNominal.totalTransactions}
                        </Description>
                        <div className="flex flex-wrap gap-1.5">
                          <MethodChip
                            enabled={selectedNominal.supportsPix}
                            label="PIX"
                            icon={QrCodeIcon}
                            colorClass="bg-[#00a87e]/15 text-[#00a87e] border-white/20"
                          />
                          <MethodChip
                            enabled={selectedNominal.supportsBoleto}
                            label="Boleto"
                            icon={BarCodeIcon}
                            colorClass="bg-[#ec7e00]/10 text-[#ec7e00] border-white/20"
                          />
                          <MethodChip
                            enabled={selectedNominal.supportsCreditCard}
                            label="Cartao"
                            icon={CreditCardIcon}
                            colorClass="bg-[#494fdf]/15 text-[#4f55f1] border-white/20"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <AsyncButton
                        variant="primary"
                        size="sm"
                        isPending={isSwitchPending}
                        isDisabled={!canSwitch || isNominalSwitchBlocked}
                        onPress={handleSwitchNominal}
                      >
                        <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
                        Alterar
                      </AsyncButton>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <SectionAccordion
              id="nominals-history"
              icon={History}
              title="Histórico de nominais"
              summary="Veja as nominais já utilizadas e o total de transações em cada uma."
            >
              {!nominalsHistory || nominalsHistory.items.length === 0 ? (
                <Alert status="accent">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Sem histórico ainda</Alert.Title>
                    <Alert.Description>
                      Quando houver movimentação por nominal, o histórico será exibido aqui.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : (
                <div className="flex flex-col gap-2">
                  {nominalsHistory.items.map((item) => {
                    const display = splitDisplayLabel(item.displayLabel);

                    return (
                      <div key={item.acquirerId} className="flex flex-col gap-1.5 rounded-lg border border-white/12 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="truncate text-sm font-semibold text-white">
                            {display.merchantName ? <span>{display.merchantName}</span> : null}
                            {display.merchantName && display.nominal ? ' ' : null}
                            {display.nominal && (
                              <span className="font-light italic text-white/50">
                                {display.merchantName ? `(${display.nominal})` : display.nominal}
                              </span>
                            )}
                          </Label>
                          {item.isCurrent && (
                            <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
                              Atual
                            </Chip>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1 text-xs">
                          <span className="rounded-md border border-white/12 px-1.5 py-0.5 text-white">
                            Transações: <strong>{item.totalTransactions.toLocaleString('pt-BR')}</strong>
                          </span>
                          <span className="rounded-md border border-white/20 bg-[#494fdf]/10 px-1.5 py-0.5 text-[#4f55f1]">
                            Seleções: <strong>{item.timesSelected.toLocaleString('pt-BR')}</strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/50">
                          <span>
                            Primeira tx: <strong className="text-white">{formatRelativeTime(item.firstTransactionAt)}</strong>
                          </span>
                          <span>
                            Última tx: <strong className="text-white">{formatRelativeTime(item.lastTransactionAt)}</strong>
                          </span>
                          <span>
                            Última seleção: <strong className="text-white">{formatRelativeTime(item.lastSelectedAt)}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionAccordion>
          </Tabs.Panel>

          <Tabs.Panel id="ab-test" className="flex flex-col gap-4 p-0 pt-4">
            <SectionAccordion
              id="nominals-ab-test"
              icon={Settings02Icon}
              title={(
                <div className="flex items-center gap-2">
                  <span>Teste A/B de Nominais</span>
                  <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                    Experimental
                  </Chip>
                </div>
              )}
              summary="Compare duas nominais ao mesmo tempo com split configurável para medir performance."
            >
              <div className="flex flex-col gap-2">
                <Alert status="accent">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Como funciona o encerramento do teste A/B</Alert.Title>
                    <Alert.Description>
                      Encerramento manual: você finaliza quando quiser e deve escolher a nominal vencedora.
                      Encerramento automático: ao atingir o limite configurado por dias ou quantidade de transações,
                      o sistema encerra o teste e define automaticamente a vencedora pela maior taxa de aprovação no período.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>

                {activeAbTest ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1">
                      <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">Ativo</Chip>
                      <Chip size="sm" variant="soft" color="default" className="h-5 text-xs">
                        Split A: {formatSplitPercent(activeAbTest.variantAWeightPercent)}%
                      </Chip>
                      <Chip size="sm" variant="soft" color="default" className="h-5 text-xs">
                        Split B: {formatSplitPercent(activeAbTest.variantBWeightPercent)}%
                      </Chip>
                      <Chip size="sm" variant="soft" color="default" className="h-5 text-xs">
                        Limite: {activeAbTest.limitType === 'Days'
                          ? `${activeAbTest.maxDurationDays ?? 7} dia(s)`
                          : `${activeAbTest.maxTransactions ?? 0} transações`}
                      </Chip>
                      {activeAbTest.isAutoFinished && (
                        <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                          Finalizado automaticamente
                        </Chip>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1 rounded-lg border border-white/20 bg-[#494fdf]/10 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs font-semibold text-[#4f55f1]">Variante A</Label>
                          <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
                            {formatSplitPercent(activeAbTest.variantAWeightPercent)}%
                          </Chip>
                        </div>
                        <span className="text-xs text-white">{abVariantA ? getNominalDisplayLabel(abVariantA) : 'Nominal A'}</span>
                      </div>

                      <div className="flex flex-col gap-1 rounded-lg border border-white/20 bg-[#ec7e00]/10 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs font-semibold text-[#ec7e00]">Variante B</Label>
                          <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                            {formatSplitPercent(activeAbTest.variantBWeightPercent)}%
                          </Chip>
                        </div>
                        <span className="text-xs text-white">{abVariantB ? getNominalDisplayLabel(abVariantB) : 'Nominal B'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/12 p-2">
                      <div className="text-xs text-white/50">
                        <span className="font-medium text-white">Roteamento ativo:</span>{' '}
                        novas transações estão sendo divididas entre as variantes A e B conforme o split configurado.
                        {' '}
                        <HelpHint text="No teste ativo, o roteamento de novas transações acontece conforme o split configurado entre as variantes A e B." />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <AsyncButton
                        variant="danger"
                        size="sm"
                        isDisabled={isAbTestPending}
                        onPress={handleOpenStopAbTestModal}
                      >
                        Encerrar teste A/B
                      </AsyncButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <ComboBox
                        selectedKey={abVariantAAcquirerId || null}
                        onSelectionChange={(key) => {
                          const selectedId = (key as Key | null)?.toString() ?? '';
                          if (selectedId && selectedId === abVariantBAcquirerId) {
                            return;
                          }

                          setAbVariantAAcquirerId(selectedId);
                        }}
                      >
                        <Label>
                          <span className="inline-flex items-center gap-1">
                            <span>Variante A</span>
                            <HelpHint text="Primeira nominal participante do experimento. O split define quanto trafego ela recebe." />
                          </span>
                        </Label>
                        <ComboBox.InputGroup>
                          <Input variant="secondary" placeholder="Selecione a nominal A" />
                          <ComboBox.Trigger />
                        </ComboBox.InputGroup>
                        <ComboBox.Popover>
                          <ListBox>
                            {abVariantAOptions.map((item) => {
                              const isNew = isNewNominal(item);
                              const globalEffective = getGlobalEffectiveConversion(item);
                              const globalLabel = getApprovalRateLabel(item.conversionLast7Days, item.conversionYesterday);
                              const merchantEffective = getMerchantEffectiveConversion(item);
                              const merchantLabel = getApprovalRateLabel(item.merchantConversionLast7Days, item.merchantConversionYesterday);
                              const displayLabel = getNominalDisplayLabel(item);

                              return (
                                <ListBox.Item
                                  key={item.acquirerId}
                                  id={item.acquirerId}
                                  textValue={isNew
                                    ? `${displayLabel} Novo`
                                    : `${displayLabel} Taxa global (${globalLabel}) ${globalEffective == null ? 'Sem dados' : formatConversion(globalEffective)} Taxa da sua org. (${merchantLabel}) ${merchantEffective == null ? 'Sem dados' : formatConversion(merchantEffective)}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {item.acquirerDisplayName ? (
                                        <>
                                          <span className="text-xs text-white">{item.acquirerDisplayName}</span>
                                          <span className="text-xs font-light italic text-white/50">({item.nominal})</span>
                                        </>
                                      ) : (
                                        <span className="text-xs font-light italic text-white/50">{item.nominal}</span>
                                      )}
                                      {item.isCurrent && (
                                        <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
                                          Atual
                                        </Chip>
                                      )}
                                      {item.isInAbTest && (
                                        <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
                                          Teste A/B
                                        </Chip>
                                      )}
                                      {isNew ? (
                                        <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                                          Novo
                                        </Chip>
                                      ) : (
                                        <>
                                          <span className="text-xs text-white/50">
                                            {globalLabel === '7d' ? 'Taxa global (7d):' : 'Taxa global (Ontem):'}
                                          </span>
                                          <span className={`text-xs font-medium ${getConversionTextClassName(globalEffective ?? 0)}`}>
                                            {globalEffective == null ? 'Sem dados' : formatConversion(globalEffective)}
                                          </span>
                                          <span className="text-xs text-white/50">|</span>
                                          <span className="text-xs text-white/50">
                                            {merchantLabel === '7d' ? 'Taxa da sua org. (7d):' : 'Taxa da sua org. (Ontem):'}
                                          </span>
                                          <span className={`text-xs font-medium ${getConversionTextClassName(merchantEffective ?? 0)}`}>
                                            {merchantEffective == null ? 'Sem dados' : formatConversion(merchantEffective)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              );
                            })}
                          </ListBox>
                        </ComboBox.Popover>
                      </ComboBox>

                      <ComboBox
                        selectedKey={abVariantBAcquirerId || null}
                        onSelectionChange={(key) => {
                          const selectedId = (key as Key | null)?.toString() ?? '';
                          if (selectedId && selectedId === abVariantAAcquirerId) {
                            return;
                          }

                          setAbVariantBAcquirerId(selectedId);
                        }}
                      >
                        <Label>
                          <span className="inline-flex items-center gap-1">
                            <span>Variante B</span>
                            <HelpHint text="Segunda nominal participante do experimento. Recebe automaticamente o complemento do split da variante A." />
                          </span>
                        </Label>
                        <ComboBox.InputGroup>
                          <Input variant="secondary" placeholder="Selecione a nominal B" />
                          <ComboBox.Trigger />
                        </ComboBox.InputGroup>
                        <ComboBox.Popover>
                          <ListBox>
                            {abVariantBOptions.map((item) => (
                              <NominalOptionListItem key={item.acquirerId} item={item} />
                            ))}
                          </ListBox>
                        </ComboBox.Popover>
                      </ComboBox>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="flex flex-col gap-1">
                        <Label>
                          <span className="inline-flex items-center gap-1">
                            <span>Split da Variante A (%)</span>
                            <HelpHint text="Define a porcentagem de novas transações roteadas para a variante A. Aceita de 0,01% até 99,99%." />
                          </span>
                        </Label>
                        <Input
                          variant="secondary"
                          type="number"
                          min={0.01}
                          max={99.99}
                          step={0.01}
                          value={String(abVariantAWeightPercent)}
                          onChange={(event) => {
                            const parsedValue = Number.parseFloat(event.target.value);
                            if (Number.isNaN(parsedValue)) {
                              setAbVariantAWeightPercent(50);
                              return;
                            }

                            if (parsedValue < 0.01) {
                              setAbVariantAWeightPercent(0.01);
                              return;
                            }

                            if (parsedValue > 99.99) {
                              setAbVariantAWeightPercent(99.99);
                              return;
                            }

                            setAbVariantAWeightPercent(Math.round(parsedValue * 100) / 100);
                          }}
                        />
                      </div>
                      <Chip size="sm" variant="soft" color="default" className="h-7 text-xs">
                        Split B: {formatSplitPercent(100 - abVariantAWeightPercent)}%
                      </Chip>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Select
                        variant="secondary"
                        value={abLimitType}
                        onChange={(key) => {
                          const selected = key?.toString();
                          if (selected === 'Days' || selected === 'Transactions') {
                            setAbLimitType(selected);
                          }
                        }}
                      >
                        <Label>
                          <span className="inline-flex items-center gap-1">
                            <span>Tipo de limite</span>
                            <HelpHint text="Escolha se o encerramento automático será por dias corridos de teste ou por quantidade total de transações roteadas." />
                          </span>
                        </Label>
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="Days" textValue="Dias (até 7)">
                              <Chip
                                variant="soft"
                                color={mapParseColorToChipColor('warning')}
                                className="h-6 gap-1 text-xs"
                              >
                                <Icon icon={History} className="size-3.5" />
                                Dias (até 7)
                              </Chip>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="Transactions" textValue="Quantidade de transações">
                              <Chip
                                variant="soft"
                                color={mapParseColorToChipColor('accent')}
                                className="h-6 gap-1 text-xs"
                              >
                                <Icon icon={ArrowReloadHorizontalIcon} className="size-3.5" />
                                Quantidade de transações
                              </Chip>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      {abLimitType === 'Days' ? (
                        <div className="flex flex-col gap-1">
                          <Label>
                            <span className="inline-flex items-center gap-1">
                              <span>Duração máxima (dias)</span>
                              <HelpHint text="Quando o número de dias for atingido, o teste é encerrado automaticamente e o sistema escolhe a vencedora." />
                            </span>
                          </Label>
                          <Input
                            variant="secondary"
                            type="number"
                            min={1}
                            max={7}
                            value={String(abMaxDurationDays)}
                            onChange={(event) => {
                              const parsedValue = Number.parseInt(event.target.value, 10);
                              if (Number.isNaN(parsedValue)) {
                                setAbMaxDurationDays(7);
                                return;
                              }

                              if (parsedValue < 1) {
                                setAbMaxDurationDays(1);
                                return;
                              }

                              if (parsedValue > 7) {
                                setAbMaxDurationDays(7);
                                return;
                              }

                              setAbMaxDurationDays(parsedValue);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Label>
                            <span className="inline-flex items-center gap-1">
                              <span>Limite máximo de transações</span>
                              <HelpHint text="Quando o volume de transações do experimento atingir este limite, o teste é encerrado automaticamente." />
                            </span>
                          </Label>
                          <Input
                            variant="secondary"
                            type="number"
                            min={1}
                            value={String(abMaxTransactions)}
                            onChange={(event) => {
                              const parsedValue = Number.parseInt(event.target.value, 10);
                              if (Number.isNaN(parsedValue) || parsedValue < 1) {
                                setAbMaxTransactions(1);
                                return;
                              }

                              setAbMaxTransactions(parsedValue);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-white/50">
                      {selectedAbVariantA && selectedAbVariantB
                        ? `A: ${getNominalDisplayLabel(selectedAbVariantA)} | B: ${getNominalDisplayLabel(selectedAbVariantB)}`
                        : 'Selecione as duas nominais para iniciar o teste A/B.'}
                    </div>
                    <div className="flex justify-end">
                      <AsyncButton
                        variant="primary"
                        size="sm"
                        isPending={isAbTestPending}
                        isDisabled={!canStartAbTest}
                        onPress={handleStartAbTest}
                      >
                        Iniciar teste A/B
                      </AsyncButton>
                    </div>
                  </>
                )}
              </div>
            </SectionAccordion>

            <SectionAccordion
              id="nominals-ab-test-history"
              icon={History}
              title="Histórico de testes A/B"
              summary="Acompanhe horários, taxa de aprovação e volume por variante em cada teste encerrado ou ativo."
            >
              {!nominalAbTestHistory || nominalAbTestHistory.items.length === 0 ? (
                <Alert status="accent">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Sem histórico de testes A/B</Alert.Title>
                    <Alert.Description>
                      Assim que você iniciar um teste A/B, o histórico com gráficos e indicadores aparecerá aqui.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : (
                <SectionAccordion
                  allowsMultipleExpanded
                  expandedKeys={expandedAbHistoryKeys}
                  onExpandedChange={(keys) => setExpandedAbHistoryKeys(keys as Set<Key>)}
                  className="flex flex-col gap-2"
                >
                  {nominalAbTestHistory.items.map((item) => {
                    const isExpanded = expandedAbHistoryKeys.has(item.id);

                    return (
                      <SectionAccordion.Item key={item.id} id={item.id} className="rounded-xl border border-white/8 bg-[#16181a]">
                        <SectionAccordion.Heading>
                          <SectionAccordion.Trigger className="flex w-full items-center justify-between px-3 py-2.5">
                            <div className="flex w-full flex-col items-start gap-2 text-left">
                              <div className="flex flex-wrap items-center gap-1">
                                <Chip size="sm" variant="soft" color={item.isActive ? 'success' : 'default'} className="h-5 text-xs">
                                  {item.isActive ? 'Ativo' : 'Encerrado'}
                                </Chip>
                                {item.winnerMerchantAcquirerId === item.variantA.merchantAcquirerId && (
                                  <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
                                    Vencedora: Variante A
                                  </Chip>
                                )}
                                {item.winnerMerchantAcquirerId === item.variantB.merchantAcquirerId && (
                                  <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                                    Vencedora: Variante B
                                  </Chip>
                                )}
                                <Chip size="sm" variant="soft" color="default" className="h-5 text-xs">
                                  Limite: {getAbLimitLabel(item)}
                                </Chip>
                                {item.isAutoFinished && (
                                  <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">
                                    Finalizado automaticamente
                                  </Chip>
                                )}
                                {item.endReason && (
                                  <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">
                                    Motivo: {item.endReason}
                                  </Chip>
                                )}
                              </div>
                              <div className="grid grid-cols-1 gap-1 text-xs text-white/50 sm:grid-cols-2">
                                <span>Inicio: <strong className="text-white">{formatDateTime(item.startedAt)}</strong></span>
                                <span>Fim: <strong className="text-white">{formatDateTime(item.endedAt)}</strong></span>
                                <span>{getAbWinnerLabel(item)}</span>
                                <span>ID: <strong className="text-white">{item.id.slice(0, 8)}</strong></span>
                              </div>
                            </div>
                            <SectionAccordion.Indicator>
                              <Icon icon={ArrowDown01Icon} className="icon-sm text-white/50 transition-transform duration-200" />
                            </SectionAccordion.Indicator>
                          </SectionAccordion.Trigger>
                        </SectionAccordion.Heading>

                        <SectionAccordion.Panel>
                          <SectionAccordion.Body className="p-3">
                            {isExpanded ? (
                              <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                  <div className="rounded-lg border border-white/12 p-2">
                                    <div className="mb-2 flex flex-wrap items-center gap-1">
                                      <Chip size="sm" variant="soft" color="accent" className="h-5 text-xs">Variante A</Chip>
                                      {item.winnerMerchantAcquirerId === item.variantA.merchantAcquirerId && (
                                        <Tooltip>
                                          <Tooltip.Trigger className="inline-flex items-center">
                                            <Icon icon={Crown03Icon} className="icon-sm text-amber-500 [&_path]:fill-current" />
                                          </Tooltip.Trigger>
                                          <Tooltip.Content>
                                            <Tooltip.Arrow />
                                            Nominal vencedora
                                          </Tooltip.Content>
                                        </Tooltip>
                                      )}
                                      <span className="text-xs text-white">{item.variantA.displayLabel}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      <Chip size="sm" variant="soft" color="default" className="h-5 text-xs">
                                        Total: {item.variantA.totalTransactions}
                                      </Chip>
                                      <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
                                        Aprovadas: {item.variantA.approvedTransactions}
                                      </Chip>
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        color={getConversionColor(item.variantA.approvalRate)}
                                        className="h-5 text-xs"
                                      >
                                        Taxa: {formatConversion(item.variantA.approvalRate)}
                                      </Chip>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-white/12 p-2">
                                    <div className="mb-2 flex flex-wrap items-center gap-1">
                                      <Chip size="sm" variant="soft" color="warning" className="h-5 text-xs">Variante B</Chip>
                                      {item.winnerMerchantAcquirerId === item.variantB.merchantAcquirerId && (
                                        <Tooltip>
                                          <Tooltip.Trigger className="inline-flex items-center">
                                            <Icon icon={Crown03Icon} className="icon-sm text-amber-500 [&_path]:fill-current" />
                                          </Tooltip.Trigger>
                                          <Tooltip.Content>
                                            <Tooltip.Arrow />
                                            Nominal vencedora
                                          </Tooltip.Content>
                                        </Tooltip>
                                      )}
                                      <span className="text-xs text-white">{item.variantB.displayLabel}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      <Chip size="sm" variant="soft" color="default" className="h-5 text-xs">
                                        Total: {item.variantB.totalTransactions}
                                      </Chip>
                                      <Chip size="sm" variant="soft" color="success" className="h-5 text-xs">
                                        Aprovadas: {item.variantB.approvedTransactions}
                                      </Chip>
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        color={getConversionColor(item.variantB.approvalRate)}
                                        className="h-5 text-xs"
                                      >
                                        Taxa: {formatConversion(item.variantB.approvalRate)}
                                      </Chip>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                                  <div className="rounded-lg border border-white/12 p-2">
                                    <Label className="mb-2 text-xs font-semibold">Taxa de aprovação por hora</Label>
                                    <ChartContainer config={approvalRateChartConfig} className="h-44 w-full">
                                      <LineChart accessibilityLayer data={item.chart}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                        <ChartTooltip
                                          content={(
                                            <ChartTooltipContent formatter={(value, name) => `${name}: ${value}%`} />
                                          )}
                                        />
                                        <Line
                                          dataKey="variantAApprovalRate"
                                          type="monotone"
                                          stroke="var(--color-variantAApprovalRate)"
                                          strokeWidth={2}
                                          dot={false}
                                        />
                                        <Line
                                          dataKey="variantBApprovalRate"
                                          type="monotone"
                                          stroke="var(--color-variantBApprovalRate)"
                                          strokeWidth={2}
                                          dot={false}
                                        />
                                      </LineChart>
                                    </ChartContainer>
                                  </div>

                                  <div className="rounded-lg border border-white/12 p-2">
                                    <Label className="mb-2 text-xs font-semibold">Volume por hora</Label>
                                    <ChartContainer config={volumeChartConfig} className="h-44 w-full">
                                      <BarChart accessibilityLayer data={item.chart}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="variantATotal" fill="var(--color-variantATotal)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="variantBTotal" fill="var(--color-variantBTotal)" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ChartContainer>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </SectionAccordion.Body>
                        </SectionAccordion.Panel>
                      </SectionAccordion.Item>
                    );
                  })}
                </SectionAccordion>
              )}
            </SectionAccordion>
          </Tabs.Panel>

          <Tabs.Panel id="danger" className="p-0 pt-4">
            <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5">
              <div>
                <div className="flex flex-col gap-1">
                  <div className="text-[#e23b4a]">Zona de Perigo</div>
                  <Description>Ações irreversíveis para sua organização</Description>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Excluir Organização</Label>
                    <Description className="text-sm">
                      Esta ação é permanente e não pode ser desfeita. Todos os dados da organização serão removidos.
                    </Description>
                  </div>
                  <Button variant="danger" size="sm" className="shrink-0" onPress={() => setDeleteModalOpen(true)}>
                    <Icon icon={Delete02Icon} className="icon-sm" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Tabs.Panel>
        </InternalTabs>
      </div>

      <Modal.Backdrop
        isOpen={isStopAbTestModalOpen}
        onOpenChange={(isOpen) => {
          if (isAbTestPending) return;
          setIsStopAbTestModalOpen(isOpen);
        }}
        isDismissable={!isAbTestPending}
      >
        <Modal.Container size="lg" placement="center" scroll="outside">
          <Modal.Dialog className="max-w-3xl">
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Icon className="bg-danger-soft text-[#e23b4a]">
                <Icon icon={Alert02Icon} className="icon-md" />
              </Modal.Icon>
              <Modal.Heading>Encerrar teste A/B</Modal.Heading>
              <p className="text-sm text-white/50">
                Escolha a nominal vencedora para manter o roteamento após o encerramento.
              </p>
            </Modal.Header>

            <Modal.Body>
              <div className="flex flex-col gap-2">
                <Label>
                  <span className="inline-flex items-center gap-1">
                    <span>Nominal vencedora</span>
                    <HelpHint text="A nominal escolhida será promovida como ativa ao confirmar o encerramento manual do teste." />
                  </span>
                </Label>

                <Description className="text-xs">
                  Exibimos a taxa de aprovação de cada variante no periodo deste teste A/B para apoiar sua decisão de encerramento manual.
                </Description>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {winnerSelectionOptions.map((item) => {
                    const isSelected = abWinnerMerchantAcquirerId === item.merchantAcquirerId;
                    const selectedBorderClass = item.color === 'warning' ? 'border-[#ec7e00]' : 'border-[#4f55f1]';
                    const display = splitDisplayLabel(item.displayLabel);

                    return (
                      <label
                        key={item.merchantAcquirerId}
                        className={[
                          'flex h-full w-full cursor-pointer flex-col gap-2 rounded-lg border bg-[#16181a] px-3 py-3 transition-colors',
                          isSelected
                            ? selectedBorderClass
                            : 'border-white/12 bg-[#16181a] hover:border-white/20',
                        ].join(' ')}
                        aria-disabled={isAbTestPending}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="ab-winner-nominal"
                              value={item.merchantAcquirerId}
                              checked={isSelected}
                              disabled={isAbTestPending}
                              onChange={(event) => {
                                if (!event.target.checked) return;
                                setAbWinnerMerchantAcquirerId(item.merchantAcquirerId);
                              }}
                              className={[
                                'mt-0.5 size-3.5',
                                item.color === 'warning' ? 'accent-warning' : 'accent-accent',
                              ].join(' ')}
                            />
                            <Chip variant="soft" color={item.color} className="h-5 gap-1 text-xs">
                              <Icon icon={History} className="size-3.5" />
                              {item.variantLabel}
                            </Chip>
                          </div>
                          {isSelected && <Icon icon={CheckmarkCircle02Icon} className="icon-sm text-[#4f55f1]" />}
                        </div>

                        <span className="text-sm text-white">
                          {display.merchantName ? <span>{display.merchantName}</span> : null}
                          {display.merchantName && display.nominal ? ' ' : null}
                          {display.nominal && (
                            <span className="font-light italic text-white/50">
                              {display.merchantName ? `(${display.nominal})` : display.nominal}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-white/50">
                          {item.approvalRate == null
                            ? 'Aprovação no periodo do teste: sem dados ainda'
                            : (
                              <>
                                Aprovação no periodo do teste:{' '}
                                <span className={getApprovalRateEvolutionTextClassName(item.approvalRate)}>
                                  {formatConversion(item.approvalRate)}
                                </span>{' '}
                                ({item.approvedTransactions ?? 0}/{item.totalTransactions ?? 0})
                              </>
                            )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="tertiary"
                isDisabled={isAbTestPending}
                onPress={() => setIsStopAbTestModalOpen(false)}
              >
                Cancelar
              </Button>
              <AsyncButton
                variant="danger"
                isPending={isAbTestPending}
                onPress={handleStopAbTest}
              >
                Confirmar encerramento
              </AsyncButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <MerchantDeleteModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} />
    </>
  );
}
