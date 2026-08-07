'use client';

import { useState } from 'react';
import { Accordion, Alert, Avatar, Button, Chip, Disclosure, Modal } from '@heroui/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CalculatorIcon,
  CheckmarkCircle02Icon,
  ServerStack01Icon,
  ShieldKeyIcon,
  Wallet01Icon,
  Wallet02Icon,
  Wallet03Icon,
} from '@hugeicons/core-free-icons';

import { Icon } from '@/components/ui/icon';
import { SearchFilter } from '@/components/ui/search-filter';
import { DetailRow, SectionTitle } from '@/components/ui/detail-components';
import { formatCurrency } from '@/utils/currency';
import type {
  AcquirerReconciliationData,
  PlatformReconciliationAccount,
  PlatformReconciliationData,
} from '@/types/admin/dashboard';

interface ReconciliationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  data: PlatformReconciliationData | null;
  onApplyFix: () => void;
  isPending: boolean;
}

type AcquirerViewMode = 'critical' | 'discrepant' | 'all';

const ACQUIRERS_PAGE_SIZE = 8;

function getAcquirerDisplayName(acquirer: AcquirerReconciliationData): string {
  return acquirer.acquirerDisplayName?.trim() || acquirer.acquirerName;
}

function getDifferenceColor(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-danger';
  return 'text-muted';
}

function getDifferenceLabel(value: number): string {
  if (value > 0) return `+${formatCurrency(value)}`;
  if (value < 0) return formatCurrency(value);
  return formatCurrency(0);
}

function getViewModeLabel(mode: AcquirerViewMode): string {
  if (mode === 'critical') return 'Criticas';
  if (mode === 'discrepant') return 'Com divergencia';
  return 'Todos';
}

export function ReconciliationModal({ isOpen, onOpenChange, data, onApplyFix, isPending }: ReconciliationModalProps) {
  const [acquirerQuery, setAcquirerQuery] = useState('');
  const [acquirerViewMode, setAcquirerViewMode] = useState<AcquirerViewMode>('critical');
  const [acquirerPage, setAcquirerPage] = useState(1);

  if (!data) return null;

  const hasDiscrepancy = data.hasDiscrepancy;
  const wasFixed = data.wasFixed;
  const platformMismatchAmount = data.summary.platformMismatchAmount;

  const sortedAcquirers = [...data.acquirers]
    .sort((a, b) => {
      if (b.overdrawAmount !== a.overdrawAmount) return b.overdrawAmount - a.overdrawAmount;
      if (b.totalMismatch !== a.totalMismatch) return b.totalMismatch - a.totalMismatch;
      return getAcquirerDisplayName(a).localeCompare(getAcquirerDisplayName(b), 'pt-BR');
    });

  const normalizedQuery = acquirerQuery.trim().toLowerCase();
  const filteredAcquirers = sortedAcquirers.filter((acquirer) => {
    if (acquirerViewMode === 'critical' && acquirer.overdrawAmount <= 0) return false;
    if (acquirerViewMode === 'discrepant' && !acquirer.hasDiscrepancy) return false;

    if (!normalizedQuery) return true;

    const searchable = [
      getAcquirerDisplayName(acquirer),
      acquirer.acquirerName,
      acquirer.acquirerCode ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });

  const criticalAcquirers = sortedAcquirers.filter((acquirer) => acquirer.overdrawAmount > 0);
  const topCriticalAcquirers = criticalAcquirers.slice(0, 4);

  const totalPages = Math.max(1, Math.ceil(filteredAcquirers.length / ACQUIRERS_PAGE_SIZE));
  const safePage = Math.min(acquirerPage, totalPages);
  const pageStart = (safePage - 1) * ACQUIRERS_PAGE_SIZE;
  const paginatedAcquirers = filteredAcquirers.slice(pageStart, pageStart + ACQUIRERS_PAGE_SIZE);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAcquirerQuery('');
      setAcquirerViewMode('critical');
      setAcquirerPage(1);
    }
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-5xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className={hasDiscrepancy && !wasFixed ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
              <Icon icon={ShieldKeyIcon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>Reconsolidacao da Plataforma</Modal.Heading>
            <p className="text-sm text-muted">
              Leitura operacional dos buckets do ledger da plataforma e das adquirentes no ambiente atual.
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-3">
              {wasFixed ? (
                <Alert status="success">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Correcao aplicada</Alert.Title>
                    <Alert.Description>
                      Os ajustes foram registrados no ledger e os saldos exibidos ja representam o valor esperado.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : hasDiscrepancy ? (
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Divergencia financeira encontrada</Alert.Title>
                    <Alert.Description>
                      Revise os blocos abaixo antes de aplicar a correcao automatica. O objetivo aqui e mostrar risco real, nao apenas variacao numerica.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : (
                <Alert status="success">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Estrutura consistente</Alert.Title>
                    <Alert.Description>
                      Nenhuma diferenca material foi encontrada entre o saldo atual e o saldo calculado para a plataforma.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <OverviewTile
                  label="Status geral"
                  value={wasFixed ? 'Corrigido' : hasDiscrepancy ? 'Em alerta' : 'Saudavel'}
                  subtext={wasFixed ? 'Ajustes ja aplicados' : hasDiscrepancy ? 'Acao administrativa recomendada' : 'Sem acao necessaria'}
                  tone={wasFixed ? 'success' : hasDiscrepancy ? 'warning' : 'success'}
                  valueClass={wasFixed ? 'text-success' : hasDiscrepancy ? 'text-warning' : 'text-success'}
                />
                <OverviewTile
                  label="Buckets da plataforma"
                  value={`${[data.totalAvailableForWithdrawal, data.blocked, data.payoutsOut].filter((item) => item.current !== item.expected).length} com diferenca`}
                  subtext={`Impacto acumulado ${formatCurrency(platformMismatchAmount)}`}
                  tone={platformMismatchAmount > 0 ? 'warning' : 'default'}
                  valueClass={platformMismatchAmount > 0 ? 'text-warning' : 'text-foreground'}
                />
                <OverviewTile
                  label="Adquirentes"
                  value={`${data.summary.criticalAcquirersCount} criticas`}
                  subtext={`${data.summary.discrepantAcquirersCount} com divergencia, excesso ${formatCurrency(data.summary.criticalOverdrawAmount)}`}
                  tone={data.summary.criticalAcquirersCount > 0 ? 'danger' : data.summary.discrepantAcquirersCount > 0 ? 'warning' : 'success'}
                  valueClass={data.summary.criticalAcquirersCount > 0 ? 'text-danger' : data.summary.discrepantAcquirersCount > 0 ? 'text-warning' : 'text-success'}
                />
              </div>

              <div className="rounded-lg bg-surface-secondary p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <SectionTitle
                      icon={<Icon icon={Wallet01Icon} className="icon-sm" />}
                      title="Buckets da plataforma"
                    />
                    <p className="text-sm text-muted">Leitura em ordem fixa: buckets reais do ledger e disponibilidade derivada para saque.</p>
                    <p className="mt-1 text-xs text-muted">
                      O valor disponivel para saque agora e derivado da decomposicao por adquirente e nao existe mais como bucket sistemico separado.
                    </p>
                  </div>
                  <Chip variant="soft" size="sm" color={platformMismatchAmount > 0 ? 'warning' : 'success'}>
                    <Chip.Label>{platformMismatchAmount > 0 ? 'Com diferenca' : 'Sem diferenca'}</Chip.Label>
                  </Chip>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                  <PlatformAccountRow
                    icon={Wallet01Icon}
                    title="Disponivel para saque"
                    description="Fonte unica de verdade da disponibilidade operacional da plataforma"
                    accentClass="text-success"
                    details={data.totalAvailableForWithdrawal}
                  />
                  <PlatformAccountRow
                    icon={Wallet02Icon}
                    title="Bloqueado"
                    description="Saques da plataforma ainda em processamento"
                    accentClass="text-warning"
                    details={data.blocked}
                  />
                  <PlatformAccountRow
                    icon={Wallet03Icon}
                    title="Payouts out"
                    description="Valor liquido ja direcionado para a conta bancaria"
                    accentClass="text-accent"
                    details={data.payoutsOut}
                  />
                </div>

                <Disclosure defaultExpanded={false}>
                  <Disclosure.Heading>
                    <Button slot="trigger" variant="tertiary" className="mt-2 w-full justify-between border border-foreground/10 bg-surface px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Icon icon={CalculatorIcon} className="icon-sm text-muted" />
                        <span className="text-sm font-medium">Memoria do calculo</span>
                      </div>
                      <Disclosure.Indicator className="text-muted" />
                    </Button>
                  </Disclosure.Heading>
                  <Disclosure.Content>
                    <Disclosure.Body className="mt-2 rounded-lg border border-foreground/10 bg-surface p-3">
                      <div className="grid gap-3 text-sm">
                        <CalcRow
                          label="Disponivel para saque"
                          value={formatCurrency(data.details.totalAvailableForWithdrawal)}
                          valueClass="text-success"
                        />
                        <CalcRow
                          label="Taxas de pagamentos"
                          value={formatCurrency(data.details.totalPlatformFeesFromPayments)}
                          valueClass="text-success"
                        />
                        <CalcRow
                          label="Taxas em payouts da plataforma"
                          value={`-${formatCurrency(data.details.totalAcquirerFeesFromPlatformPayouts)}`}
                          valueClass="text-danger"
                        />
                        <CalcRow
                          label="Saques em processamento"
                          value={formatCurrency(data.details.totalProcessingPayoutAmount)}
                          valueClass="text-warning"
                        />
                        <CalcRow
                          label="Saques concluidos liquidos"
                          value={formatCurrency(data.details.totalCompletedPayoutNetAmount)}
                          valueClass="text-accent"
                        />
                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-foreground/10 bg-content1 px-3 py-2.5 md:grid-cols-3">
                          <DetailRow label="Pagamentos concluidos" value={data.details.completedPaymentsCount} />
                          <DetailRow label="Saques processando" value={data.details.processingPayoutItemsCount} />
                          <DetailRow label="Saques concluidos" value={data.details.completedPayoutItemsCount} />
                        </div>
                      </div>
                    </Disclosure.Body>
                  </Disclosure.Content>
                </Disclosure>
              </div>

              <div className="rounded-lg bg-surface-secondary p-3">
                <div>
                  <SectionTitle
                    icon={<Icon icon={ServerStack01Icon} className="icon-sm" />}
                    title="Foco imediato"
                  />
                  <p className="text-sm text-muted">Adquirentes com maior distancia entre settlement suportado e valor ja escoado.</p>
                </div>

                {topCriticalAcquirers.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                    {topCriticalAcquirers.map((acquirer) => (
                      <div key={acquirer.acquirerId} className="rounded-xl border border-danger/30 bg-danger/5 p-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{getAcquirerDisplayName(acquirer)}</p>
                            <p className="truncate text-xs text-muted">{acquirer.acquirerCode || 'Sem codigo informado'}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs uppercase tracking-wide text-muted">Excesso</p>
                            <p className="font-mono text-sm font-semibold text-danger">+{formatCurrency(acquirer.overdrawAmount)}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <CompactMetric label="Liquidacao atual" value={formatCurrency(acquirer.settlement.current)} valueClass="text-success" />
                          <CompactMetric label="Saidas liquidadas" value={formatCurrency(acquirer.payoutsOut.current)} valueClass="text-accent" />
                          <CompactMetric label="Volume bruto" value={formatCurrency(acquirer.grossVolume)} valueClass="text-foreground" />
                          <CompactMetric label="Taxas da adquirente" value={`-${formatCurrency(acquirer.totalAcquirerFees)}`} valueClass="text-danger" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">
                    Nenhuma adquirente aparece com saque acima do suportado no ambiente atual.
                  </div>
                )}
              </div>

              {data.acquirers.length > 0 && (
                <div className="flex flex-col gap-3 rounded-lg bg-surface-secondary p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <SectionTitle
                        icon={<Icon icon={ServerStack01Icon} className="icon-sm" />}
                        title="Mapa das adquirentes"
                      />
                      <p className="text-sm text-muted">Filtre por risco para revisar apenas o que precisa de acao agora.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['critical', 'discrepant', 'all'] as const).map((mode) => (
                        <Button
                          key={mode}
                          size="sm"
                          variant={acquirerViewMode === mode ? 'primary' : 'tertiary'}
                          onPress={() => {
                            setAcquirerViewMode(mode);
                            setAcquirerPage(1);
                          }}
                        >
                          {getViewModeLabel(mode)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <SearchFilter
                    label="Buscar"
                    value={acquirerQuery}
                    onChange={(value) => {
                      setAcquirerQuery(value);
                      setAcquirerPage(1);
                    }}
                    placeholder="Buscar por nome ou codigo da adquirente..."
                    className="w-full"
                  />

                  {paginatedAcquirers.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {paginatedAcquirers.map((acquirer) => (
                        <AcquirerReconciliationCard key={acquirer.acquirerId} acquirer={acquirer} />
                      ))}

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-divider pt-2">
                          <p className="text-xs text-muted">
                            {pageStart + 1} - {Math.min(pageStart + ACQUIRERS_PAGE_SIZE, filteredAcquirers.length)} de {filteredAcquirers.length}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="tertiary"
                              isDisabled={safePage <= 1}
                              onPress={() => setAcquirerPage(Math.max(1, safePage - 1))}
                            >
                              <Icon icon={ArrowLeft01Icon} className="icon-sm" />
                            </Button>
                            <span className="min-w-16 text-center text-xs text-muted">{safePage}/{totalPages}</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="tertiary"
                              isDisabled={safePage >= totalPages}
                              onPress={() => setAcquirerPage(Math.min(totalPages, safePage + 1))}
                            >
                              <Icon icon={ArrowRight01Icon} className="icon-sm" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-divider bg-content1 p-4 text-sm text-muted">
                      Nenhuma adquirente encontrada para o filtro atual.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => handleOpenChange(false)} isDisabled={isPending}>
              Fechar
            </Button>
            {hasDiscrepancy && !wasFixed && (
              <Button variant="primary" onPress={onApplyFix} isPending={isPending}>
                <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
                Aplicar correcoes
              </Button>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function OverviewTile({
  label,
  value,
  subtext,
  tone,
  valueClass,
}: {
  label: string;
  value: string;
  subtext: string;
  tone: 'success' | 'warning' | 'danger' | 'default';
  valueClass?: string;
}) {
  const toneClasses = {
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-danger/30 bg-danger/5',
    default: 'border-foreground/10 bg-surface',
  };

  return (
    <div className={`rounded-lg border p-3 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold leading-tight md:text-xl ${valueClass ?? 'text-foreground'}`}>{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{subtext}</p>
    </div>
  );
}

function CalcRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 text-muted">{label}</span>
      <span className={`shrink-0 whitespace-nowrap font-mono font-medium ${valueClass ?? 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function CompactMetric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-foreground/10 bg-surface px-2.5 py-2">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 whitespace-nowrap font-mono text-sm font-semibold ${valueClass ?? 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function PlatformAccountRow({
  icon,
  title,
  description,
  accentClass,
  details,
}: {
  icon: typeof Wallet01Icon;
  title: string;
  description: string;
  accentClass: string;
  details: PlatformReconciliationAccount;
}) {
  const hasDiscrepancy = details.current !== details.expected;

  return (
    <div className={`rounded-lg border p-3 ${hasDiscrepancy ? 'border-warning/40 bg-warning/5' : 'border-foreground/10 bg-surface'}`}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-lg p-2 ${hasDiscrepancy ? 'bg-warning/10' : 'bg-content1'}`}>
            <Icon icon={icon} className={`icon-md ${hasDiscrepancy ? 'text-warning' : accentClass}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </div>
        <Chip size="sm" color={hasDiscrepancy ? 'warning' : 'success'}>
          <Chip.Label>{hasDiscrepancy ? 'Divergente' : 'Consistente'}</Chip.Label>
        </Chip>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <AccountStat label="Atual" value={details.current} valueClass={accentClass} compact />
        <AccountStat label="Esperado" value={details.expected} valueClass="text-accent" compact />
        <AccountStat label="Diferenca" valueLabel={getDifferenceLabel(details.difference)} valueClass={getDifferenceColor(details.difference)} compact />
      </div>
    </div>
  );
}

function AccountStat({
  label,
  value,
  valueLabel,
  valueClass,
  compact = false,
}: {
  label: string;
  value?: number;
  valueLabel?: string;
  valueClass: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-content1 ${compact ? 'px-3 py-2.5' : 'px-3 py-3'}`}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 whitespace-nowrap font-mono text-sm font-semibold ${valueClass}`}>{valueLabel ?? formatCurrency(value ?? 0)}</p>
    </div>
  );
}

function AcquirerReconciliationCard({ acquirer }: { acquirer: AcquirerReconciliationData }) {
  const acquirerDisplayName = getAcquirerDisplayName(acquirer);
  const acquirerLogoUrl = acquirer.acquirerLogoUrl?.trim() || null;
  const hasOverdraw = acquirer.overdrawAmount > 0;

  return (
    <Accordion hideSeparator className="px-0">
      <Accordion.Item
        id={acquirer.acquirerId}
        defaultExpanded={hasOverdraw || acquirer.hasDiscrepancy}
        className={`rounded-lg border ${acquirer.hasDiscrepancy ? 'border-warning/40 bg-warning/5' : 'border-foreground/10 bg-surface'}`}
      >
        <Accordion.Heading>
          <Accordion.Trigger className="flex w-full items-center justify-between p-3">
            <div className="flex min-w-0 items-center gap-3">
              {acquirerLogoUrl ? (
                <Avatar size="sm">
                  <Avatar.Image src={acquirerLogoUrl} alt={acquirerDisplayName} />
                  <Avatar.Fallback>
                    <Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
                  </Avatar.Fallback>
                </Avatar>
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
                </div>
              )}
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold">{acquirerDisplayName}</p>
                <p className="truncate text-xs text-muted">{acquirer.acquirerCode || 'Sem codigo'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasOverdraw && (
                <Chip variant="soft" size="sm" color="danger">
                  <Chip.Label>Excesso +{formatCurrency(acquirer.overdrawAmount)}</Chip.Label>
                </Chip>
              )}
              <Chip variant="soft" size="sm" color={acquirer.hasDiscrepancy ? 'warning' : 'success'}>
                <Chip.Label>{acquirer.hasDiscrepancy ? 'Com divergencia' : 'Consistente'}</Chip.Label>
              </Chip>
              <Accordion.Indicator className="text-muted" />
            </div>
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body className="border-t border-foreground/10 p-3">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.82fr_1.18fr]">
              <div className="flex flex-col gap-2.5 rounded-lg border border-foreground/10 bg-content1 p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <CompactMetric label="Volume bruto" value={formatCurrency(acquirer.grossVolume)} valueClass="text-foreground" />
                  <CompactMetric label="Taxas da adquirente" value={`-${formatCurrency(acquirer.totalAcquirerFees)}`} valueClass="text-danger" />
                  <CompactMetric label="Liquidacao atual" value={formatCurrency(acquirer.settlement.current)} valueClass="text-success" />
                  <CompactMetric label="Saidas liquidadas" value={formatCurrency(acquirer.payoutsOut.current)} valueClass="text-accent" />
                </div>

                {hasOverdraw ? (
                  <div className="rounded-xl border border-danger/30 bg-danger/5 p-2.5 text-sm text-danger">
                    Ha mais valor liquidado em saques do que liquidacao atualmente suportada nesta adquirente.
                  </div>
                ) : (
                  <div className="rounded-xl border border-success/30 bg-success/5 p-2.5 text-sm text-success">
                    Entradas e saques permanecem dentro do suportado para esta adquirente.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                <AcquirerMetricCard title="Entradas" icon={ArrowDown01Icon} details={acquirer.in} accentClass="text-success" />
                <AcquirerMetricCard title="Saidas" icon={ArrowUp01Icon} details={acquirer.out} accentClass="text-danger" />
                <AcquirerMetricCard title="Saldo bruto" icon={Wallet03Icon} details={acquirer.grossBalance} accentClass="text-accent" />
                <AcquirerMetricCard title="Saldo das organizacoes" icon={Wallet02Icon} details={acquirer.merchantBalance} accentClass="text-warning" />
                <AcquirerMetricCard title="Lucro da SwiftPay" icon={Wallet01Icon} details={acquirer.swiftpayProfit} accentClass="text-success" />
                <AcquirerMetricCard title="Liquidacao liquida" icon={ArrowDown01Icon} details={acquirer.settlement} accentClass="text-success" />
              </div>
            </div>
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

function AcquirerMetricCard({
  title,
  icon,
  details,
  accentClass,
}: {
  title: string;
  icon: typeof Wallet01Icon;
  details: PlatformReconciliationAccount;
  accentClass: string;
}) {
  const hasDiscrepancy = details.current !== details.expected;

  return (
    <div className={`rounded-lg border p-3 ${hasDiscrepancy ? 'border-warning/40 bg-warning/5' : 'border-foreground/10 bg-content1'}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon icon={icon} className={`icon-sm ${hasDiscrepancy ? 'text-warning' : accentClass}`} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="flex flex-col gap-2">
        <AccountStat label="Atual" value={details.current} valueClass={accentClass} />
        <AccountStat label="Esperado" value={details.expected} valueClass="text-accent" />
        <AccountStat label="Diferenca" valueLabel={getDifferenceLabel(details.difference)} valueClass={getDifferenceColor(details.difference)} />
      </div>
    </div>
  );
}
