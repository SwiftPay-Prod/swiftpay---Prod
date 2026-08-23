'use client';

import { parseDate } from '@internationalized/date';
import { Button, DateField, DateRangePicker, Label, ListBox, Modal, RangeCalendar, Select, Switch, Tag, TagGroup } from '@heroui/react';
import type { Key } from '@heroui/react';
import { CancelCircleIcon, Notification03Icon, Settings02Icon, SoundcloudIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { DASHBOARD_PERIOD_OPTIONS } from '@/hooks/merchant-dashboard.constants';
import type { DashboardPeriod } from '@/types/merchant/dashboard';
import {
  LIVE_BALANCE_BACKGROUND_OPTIONS,
  type LiveBalanceBackgroundId,
} from './backgrounds';
import {
  LIVE_BALANCE_NOTIFICATION_FILTER_OPTIONS,
  type LiveBalanceNotificationFilterKey,
  type LiveBalanceSettings,
} from './settings';

interface LiveBalanceSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: LiveBalanceSettings;
  onSettingsChange: (settings: LiveBalanceSettings) => void;
}

interface SettingsSwitchRowProps {
  icon: typeof Settings02Icon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

type EffectSettingKey = keyof Pick<LiveBalanceSettings,
  | 'enableConfetti'
  | 'enableProfitPulse'
  | 'enableWealthBurst'
  | 'enableMoneyRain'
  | 'enableVictoryOrbit'
  | 'enableSellerStickers'
  | 'enableCashTrail'
  | 'enableJackpotFlash'
  | 'enableDiamondDust'
  | 'enableRoyalCrown'>;

type ToneName = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'cyan' | 'orange';

const EFFECT_OPTIONS: Array<{
  key: EffectSettingKey;
  title: string;
  description: string;
  tone: ToneName;
}> = [
  {
    key: 'enableConfetti',
    title: 'Confetti de virada',
    description: 'Dispara o burst quando o saldo cruza um novo milhar.',
    tone: 'emerald',
  },
  {
    key: 'enableProfitPulse',
    title: 'Pulse de lucro',
    description: 'Mantém o pulso radial e o glow central quando entra dinheiro.',
    tone: 'sky',
  },
  {
    key: 'enableWealthBurst',
    title: 'Burst de riqueza',
    description: 'Mostra moedas e chips flutuando quando o saldo sobe.',
    tone: 'amber',
  },
  {
    key: 'enableMoneyRain',
    title: 'Chuva de dinheiro',
    description: 'Derrama notas e símbolos sobre a tela para comemorar uma nova venda.',
    tone: 'emerald',
  },
  {
    key: 'enableVictoryOrbit',
    title: 'Órbita da vitória',
    description: 'Acende anéis e estrelas girando ao redor do saldo quando entra caixa.',
    tone: 'violet',
  },
  {
    key: 'enableSellerStickers',
    title: 'Stickers do vendedor',
    description: 'Solta selos divertidos como BOA, PIX e VENDA pela tela.',
    tone: 'orange',
  },
  {
    key: 'enableCashTrail',
    title: 'Trilhas de caixa',
    description: 'Lança rastros verticais de energia em volta do ticket principal.',
    tone: 'cyan',
  },
  {
    key: 'enableJackpotFlash',
    title: 'Flash de jackpot',
    description: 'Abre um clarão dourado com raios de prêmio no centro da tela.',
    tone: 'amber',
  },
  {
    key: 'enableDiamondDust',
    title: 'Pó de diamante',
    description: 'Espalha brilhos frios e partículas premium em torno do saldo.',
    tone: 'sky',
  },
  {
    key: 'enableRoyalCrown',
    title: 'Coroa real',
    description: 'Solta coroas celebrando entradas de caixa mais marcantes.',
    tone: 'rose',
  },
];

const NOTIFICATION_TONES: Record<LiveBalanceNotificationFilterKey, ToneName> = {
  showApprovedNotifications: 'emerald',
  showPendingNotifications: 'amber',
  showFailedNotifications: 'rose',
  showRefundedNotifications: 'sky',
  showPayoutNotifications: 'violet',
};

function getToneClasses(tone: ToneName) {
  switch (tone) {
    case 'emerald':
      return {
        icon: 'bg-success-soft text-success',
        marker: 'bg-success',
        tag: 'border-emerald-300/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
      };
    case 'amber':
      return {
        icon: 'bg-warning-soft text-warning',
        marker: 'bg-warning',
        tag: 'border-amber-300/35 bg-amber-500/12 text-amber-700 dark:text-amber-200',
      };
    case 'rose':
      return {
        icon: 'bg-danger-soft text-danger',
        marker: 'bg-danger',
        tag: 'border-rose-300/35 bg-rose-500/12 text-rose-700 dark:text-rose-200',
      };
    case 'sky':
      return {
        icon: 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
        marker: 'bg-sky-500',
        tag: 'border-sky-300/35 bg-sky-500/12 text-sky-700 dark:text-sky-200',
      };
    case 'violet':
      return {
        icon: 'bg-violet-500/12 text-violet-600 dark:text-violet-300',
        marker: 'bg-violet-500',
        tag: 'border-violet-300/35 bg-violet-500/12 text-violet-700 dark:text-violet-200',
      };
    case 'cyan':
      return {
        icon: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-300',
        marker: 'bg-cyan-500',
        tag: 'border-cyan-300/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200',
      };
    case 'orange':
      return {
        icon: 'bg-orange-500/12 text-orange-600 dark:text-orange-300',
        marker: 'bg-orange-500',
        tag: 'border-orange-300/35 bg-orange-500/12 text-orange-700 dark:text-orange-200',
      };
  }
}

function SettingsSwitchRow({ icon, title, description, checked, onChange, className }: SettingsSwitchRowProps) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-3xl border border-border/60 bg-surface/80 px-4 py-3 ${className ?? ''}`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon icon={icon} className="icon-md" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>

      <Switch isSelected={checked} onChange={onChange}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}

function ModalSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-[1.6rem] border border-border/60 bg-surface/75 p-3 sm:p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LiveBalanceSettingsModal({
  isOpen,
  onOpenChange,
  settings,
  onSettingsChange,
}: LiveBalanceSettingsModalProps) {
  const selectedNotificationKeys = LIVE_BALANCE_NOTIFICATION_FILTER_OPTIONS
    .filter((option) => settings.notificationFilters[option.key])
    .map((option) => option.key);
  const selectedNotificationOptions = LIVE_BALANCE_NOTIFICATION_FILTER_OPTIONS.filter((option) => settings.notificationFilters[option.key]);
  const selectedEffectKeys = EFFECT_OPTIONS.filter((option) => settings[option.key]).map((option) => option.key);
  const selectedEffectOptions = EFFECT_OPTIONS.filter((option) => settings[option.key]);

  function updateSetting<K extends keyof LiveBalanceSettings>(key: K, value: LiveBalanceSettings[K]) {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  }

  const revenueRangeValue =
    settings.revenueFilters.startDate && settings.revenueFilters.endDate
      ? { start: parseDate(settings.revenueFilters.startDate), end: parseDate(settings.revenueFilters.endDate) }
      : null;

  function updateRevenueFilters(patch: Partial<LiveBalanceSettings['revenueFilters']>) {
    onSettingsChange({
      ...settings,
      revenueFilters: {
        ...settings.revenueFilters,
        ...patch,
      },
    });
  }

  function normalizeMultipleKeys(value: Key | Key[] | Set<Key> | null): Key[] {
    if (value === null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (value instanceof Set) {
      return Array.from(value);
    }

    return [value];
  }

  function updateNotificationFiltersFromKeys(keys: Key[] | null) {
    const selectedKeys = new Set((keys ?? []).map((key) => String(key) as LiveBalanceNotificationFilterKey));

    onSettingsChange({
      ...settings,
      notificationFilters: {
        showApprovedNotifications: selectedKeys.has('showApprovedNotifications'),
        showPendingNotifications: selectedKeys.has('showPendingNotifications'),
        showFailedNotifications: selectedKeys.has('showFailedNotifications'),
        showRefundedNotifications: selectedKeys.has('showRefundedNotifications'),
        showPayoutNotifications: selectedKeys.has('showPayoutNotifications'),
      },
    });
  }

  function handleNotificationSelectChange(value: Key | Key[] | Set<Key> | null) {
    updateNotificationFiltersFromKeys(normalizeMultipleKeys(value));
  }

  function handleNotificationTagRemove(keys: Set<Key>) {
    const nextKeys = selectedNotificationKeys.filter((key) => !keys.has(key));
    updateNotificationFiltersFromKeys(nextKeys);
  }

  function updateEffectsFromKeys(keys: Key[] | null) {
    const selectedKeys = new Set((keys ?? []).map((key) => String(key) as EffectSettingKey));

    onSettingsChange({
      ...settings,
      enableConfetti: selectedKeys.has('enableConfetti'),
      enableProfitPulse: selectedKeys.has('enableProfitPulse'),
      enableWealthBurst: selectedKeys.has('enableWealthBurst'),
      enableMoneyRain: selectedKeys.has('enableMoneyRain'),
      enableVictoryOrbit: selectedKeys.has('enableVictoryOrbit'),
      enableSellerStickers: selectedKeys.has('enableSellerStickers'),
      enableCashTrail: selectedKeys.has('enableCashTrail'),
      enableJackpotFlash: selectedKeys.has('enableJackpotFlash'),
      enableDiamondDust: selectedKeys.has('enableDiamondDust'),
      enableRoyalCrown: selectedKeys.has('enableRoyalCrown'),
    });
  }

  function handleEffectSelectChange(value: Key | Key[] | Set<Key> | null) {
    updateEffectsFromKeys(normalizeMultipleKeys(value));
  }

  function handleEffectTagRemove(keys: Set<Key>) {
    const nextKeys = selectedEffectKeys.filter((key) => !keys.has(key));
    updateEffectsFromKeys(nextKeys);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-4xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent text-accent-foreground">
              <Icon icon={Settings02Icon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>Configurar Live Balance</Modal.Heading>
            <p className="text-sm text-muted">Ajuste o visual, escolha quais notificações aparecem e monte a combinação de efeitos desta tela.</p>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                <ModalSection
                  title="Filtro do total de vendas"
                  description="Defina o período usado para calcular o valor principal exibido nesta tela, sem depender do dashboard."
                >
                  <div className="flex flex-col gap-2">
                    <Label>Período</Label>
                    <Select
                      variant="secondary"
                      aria-label="Selecionar período do total de vendas"
                      value={settings.revenueFilters.period}
                      onChange={(key) => {
                        if (!key) {
                          return;
                        }

                        updateRevenueFilters({ period: key as DashboardPeriod });
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                            <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                              {option.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {settings.revenueFilters.period === 'custom' && (
                    <div className="flex flex-col gap-2">
                      <Label>Intervalo personalizado</Label>
                      <DateRangePicker
                        value={revenueRangeValue}
                        onChange={(value) => {
                          const nextStartDate = value?.start ? value.start.toString().slice(0, 10) : settings.revenueFilters.startDate;
                          const nextEndDate = value?.end ? value.end.toString().slice(0, 10) : settings.revenueFilters.endDate;

                          if (!nextStartDate || !nextEndDate) {
                            return;
                          }

                          updateRevenueFilters({
                            startDate: nextStartDate,
                            endDate: nextEndDate,
                          });
                        }}
                      >
                        <DateField.Group fullWidth variant="secondary">
                          <DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                          <DateRangePicker.RangeSeparator />
                          <DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                          <DateField.Suffix>
                            <DateRangePicker.Trigger>
                              <DateRangePicker.TriggerIndicator />
                            </DateRangePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <DateRangePicker.Popover>
                          <RangeCalendar aria-label="Período personalizado do total de vendas" visibleDuration={{ months: 2 }}>
                            <RangeCalendar.Header>
                              <RangeCalendar.YearPickerTrigger>
                                <RangeCalendar.YearPickerTriggerHeading />
                                <RangeCalendar.YearPickerTriggerIndicator />
                              </RangeCalendar.YearPickerTrigger>
                              <RangeCalendar.NavButton slot="previous" />
                              <RangeCalendar.NavButton slot="next" />
                            </RangeCalendar.Header>
                            <RangeCalendar.Grid>
                              <RangeCalendar.GridHeader>
                                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                              </RangeCalendar.GridHeader>
                              <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
                            </RangeCalendar.Grid>
                            <RangeCalendar.YearPickerGrid>
                              <RangeCalendar.YearPickerGridBody>
                                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                              </RangeCalendar.YearPickerGridBody>
                            </RangeCalendar.YearPickerGrid>
                          </RangeCalendar>
                        </DateRangePicker.Popover>
                      </DateRangePicker>
                    </div>
                  )}
                </ModalSection>

                <ModalSection title="Visual da experiência" description="Escolha o pano de fundo e ajuste como essa tela reage quando entra dinheiro.">
                  <div className="flex flex-col gap-2">
                    <Label>Background</Label>
                    <Select
                      variant="secondary"
                      aria-label="Selecionar background do live balance"
                      value={settings.backgroundId}
                      onChange={(key) => {
                        if (!key) {
                          return;
                        }

                        updateSetting('backgroundId', key as LiveBalanceBackgroundId);
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {LIVE_BALANCE_BACKGROUND_OPTIONS.map((option) => (
                            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                              {option.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SettingsSwitchRow
                      icon={SoundcloudIcon}
                      title="Som ao receber pagamento"
                      description="Toca o cash-in nesta tela quando entrar dinheiro."
                      checked={settings.enablePaymentSound}
                      onChange={(checked) => updateSetting('enablePaymentSound', checked)}
                    />
                    <SettingsSwitchRow
                      icon={Notification03Icon}
                      title="Notificações na tela"
                      description="Liga ou desliga completamente a stack de alertas sobre o live balance."
                      checked={settings.showNotifications}
                      onChange={(checked) => updateSetting('showNotifications', checked)}
                    />
                  </div>
                </ModalSection>

                <ModalSection
                  title="Filtros de notificações"
                  description="Use seleção múltipla para escolher os eventos que podem entrar nessa tela. Por padrão, apenas pagamentos aprovados ficam habilitados."
                >
                  <div className="flex flex-col gap-2">
                    <Select
                      variant="secondary"
                      aria-label="Selecionar filtros de notificações do live balance"
                      selectionMode="multiple"
                      value={selectedNotificationKeys}
                      onChange={handleNotificationSelectChange}
                    >
                      <Label>Notificações visíveis</Label>
                      <Select.Trigger>
                        <Select.Value>
                          {selectedNotificationKeys.length === 0
                            ? 'Selecione os filtros'
                            : `${selectedNotificationKeys.length} filtro(s) selecionado(s)`}
                        </Select.Value>
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox selectionMode="multiple">
                          {LIVE_BALANCE_NOTIFICATION_FILTER_OPTIONS.map((option) => (
                            <ListBox.Item key={option.key} id={option.key} textValue={option.title}>
                              <div className="flex items-start gap-2.5">
                                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${getToneClasses(NOTIFICATION_TONES[option.key]).marker}`} />
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium text-foreground">{option.title}</span>
                                  <span className="text-xs text-muted">{option.description}</span>
                                </div>
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-card/50 p-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                        Selecionados
                      </p>
                      {selectedNotificationOptions.length > 0 ? (
                        <TagGroup
                          aria-label="Filtros de notificações selecionados"
                          variant="surface"
                          onRemove={handleNotificationTagRemove}
                          className="mt-3 w-full"
                        >
                          <TagGroup.List className="flex flex-wrap gap-2">
                            {selectedNotificationOptions.map((option) => (
                              <Tag
                                key={option.key}
                                id={option.key}
                                textValue={option.title}
                                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${getToneClasses(NOTIFICATION_TONES[option.key]).tag}`}
                              >
                                {option.title}
                                <Tag.RemoveButton />
                              </Tag>
                            ))}
                          </TagGroup.List>
                        </TagGroup>
                      ) : (
                        <p className="mt-3 text-sm text-muted">Nenhum filtro selecionado. Escolha pelo menos um para mostrar notificações nessa tela.</p>
                      )}
                    </div>
                  </div>
                </ModalSection>
              </div>

              <ModalSection
                title="Stack de efeitos"
                description="Use seleção múltipla para ativar somente os efeitos que você quer manter nesta experiência."
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Select
                      variant="secondary"
                      aria-label="Selecionar efeitos do live balance"
                      selectionMode="multiple"
                      value={selectedEffectKeys}
                      onChange={handleEffectSelectChange}
                    >
                      <Label>Efeitos visuais</Label>
                      <Select.Trigger>
                        <Select.Value>
                          {selectedEffectKeys.length === 0
                            ? 'Selecione os efeitos'
                            : `${selectedEffectKeys.length} efeito(s) selecionado(s)`}
                        </Select.Value>
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox selectionMode="multiple">
                          {EFFECT_OPTIONS.map((option) => (
                            <ListBox.Item key={option.key} id={option.key} textValue={option.title}>
                              <div className="flex items-start gap-2.5">
                                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${getToneClasses(option.tone).marker}`} />
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium text-foreground">{option.title}</span>
                                  <span className="text-xs text-muted">{option.description}</span>
                                </div>
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-card/50 p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Selecionados
                    </p>
                    {selectedEffectOptions.length > 0 ? (
                      <TagGroup
                        aria-label="Efeitos selecionados"
                        variant="surface"
                        onRemove={handleEffectTagRemove}
                        className="mt-3 w-full"
                      >
                        <TagGroup.List className="flex flex-wrap gap-2">
                          {selectedEffectOptions.map((option) => (
                            <Tag
                              key={option.key}
                              id={option.key}
                              textValue={option.title}
                              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${getToneClasses(option.tone).tag}`}
                            >
                              {option.title}
                              <Tag.RemoveButton />
                            </Tag>
                          ))}
                        </TagGroup.List>
                      </TagGroup>
                    ) : (
                      <p className="mt-3 text-sm text-muted">Nenhum efeito selecionado. Escolha os que devem permanecer ativos nesta tela.</p>
                    )}
                  </div>
                </div>
              </ModalSection>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              <Icon icon={CancelCircleIcon} className="icon-sm" />
              Fechar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}