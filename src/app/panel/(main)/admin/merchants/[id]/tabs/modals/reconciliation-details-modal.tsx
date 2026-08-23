'use client';

import { Suspense, use, useTransition } from 'react';
import { Alert, Button, Card, Chip, Modal, Separator, Skeleton, Tooltip } from '@heroui/react';
import {
  Alert01Icon,
  ArrowDataTransferVerticalIcon,
  ArrowRight01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  HelpCircleIcon,
  Invoice03Icon,
  MoneyReceiveSquareIcon,
  MoneyRemove01Icon,
  Note01Icon,
  PlayIcon,
  RepeatIcon,
  Settings02Icon,
  Tick02Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';

import { toast } from '@heroui/react';

import { adminApplyReconciliationCorrections } from '@/app/actions/admin/reconciliation';
import { AsyncButton } from '@/components/ui/async-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Icon } from '@/components/ui/icon';
import { DetailRow, SectionTitle } from '@/components/ui/detail-components';
import {
  bankReconciliationStatusParse,
  mapParseColorToChipColor,
  paymentEnvironmentParse,
  reconciliationDiscrepancySeverityParse,
  reconciliationDiscrepancyTypeParse,
} from '@/parse';
import type { ApiResponse } from '@/types/common';
import type { AdminReconciliationDetails, AdminReconciliationDiscrepancy } from '@/types/admin/reconciliation';
import { BankReconciliationStatus } from '@/types/enums';
import { formatCurrency, getBalanceDisplay } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';

type DetailsPromise = Promise<ApiResponse<AdminReconciliationDetails>>;
type HugeIcon = typeof RepeatIcon;

interface ReconciliationDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationPromise: DetailsPromise | null;
  onCorrectionsApplied: () => void;
}

function SummaryTile({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: HugeIcon;
  tone: 'success' | 'warning' | 'danger' | 'default' | 'accent';
}) {
  const toneClasses = {
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    danger: 'border-danger/30 bg-danger/5 text-danger',
    default: 'border-border bg-card text-foreground',
    accent: 'border-accent/30 bg-accent/5 text-accent',
  };

  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted">{subtext}</p>
        </div>
        <Icon icon={icon} className="icon-md" />
      </div>
    </div>
  );
}

function MovementMetric({
  label,
  value,
  subtext,
  icon,
  tooltip,
  tone,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: HugeIcon;
  tooltip?: string;
  tone: 'success' | 'warning' | 'danger' | 'default';
}) {
  const toneClasses = {
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    danger: 'border-danger/30 bg-danger/5 text-danger',
    default: 'border-border bg-card text-foreground',
  };

  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            {tooltip && (
              <Tooltip>
                <Button isIconOnly variant="tertiary" className="h-4 w-4 min-w-4" aria-label={`Ajuda sobre ${label}`}>
                  <Icon icon={HelpCircleIcon} className="icon-xs text-muted" />
                  <Tooltip.Content>{tooltip}</Tooltip.Content>
                </Button>
              </Tooltip>
            )}
          </div>
          <p className="mt-2 font-mono text-lg font-semibold">{value}</p>
          {subtext && <p className="mt-1 text-xs text-muted">{subtext}</p>}
        </div>
        <Icon icon={icon} className="icon-md" />
      </div>
    </div>
  );
}

function TimelineCard({
  label,
  date,
  user,
  icon,
  isCompleted,
  isActive,
}: {
  label: string;
  date: string | null | undefined;
  user?: string | null;
  icon: HugeIcon;
  isCompleted: boolean;
  isActive?: boolean;
}) {
  const containerClass = isCompleted
    ? 'bg-success text-success-foreground'
    : isActive
      ? 'bg-accent text-accent-foreground'
      : 'bg-surface-deep text-muted';

  return (
    <div className={`rounded-lg border border-foreground/10 bg-surface p-4 ${!isCompleted && !isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${containerClass}`}>
          <Icon icon={isCompleted ? Tick02Icon : icon} className="icon-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs text-muted">{date ? formatDate(date) : 'Pendente'}</p>
          {user && <p className="mt-1 text-xs text-muted">por {user}</p>}
        </div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <>
      <Modal.Header>
        <Modal.Icon className="bg-accent text-accent-foreground">
          <Icon icon={RepeatIcon} className="icon-md" />
        </Modal.Icon>
        <Modal.Heading>Detalhes da Reconsolidacao</Modal.Heading>
        <p className="text-sm text-muted">Carregando leitura financeira...</p>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </Modal.Body>
    </>
  );
}

function DetailsContent({
  reconciliationPromise,
  onClose,
  onApply,
  isApplyPending,
}: {
  reconciliationPromise: DetailsPromise;
  onClose: () => void;
  onApply: (id: string) => void;
  isApplyPending: boolean;
}) {
  const response = use(reconciliationPromise);

  if (response?.error) {
    return (
      <>
        <Modal.Header>
          <Modal.Icon className="bg-danger text-danger-foreground">
            <Icon icon={Alert01Icon} className="icon-md" />
          </Modal.Icon>
          <Modal.Heading>Erro ao carregar</Modal.Heading>
          <p className="text-sm text-muted">Nao foi possivel montar a leitura da reconciliacao.</p>
        </Modal.Header>
        <Modal.Body>
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Falha na consulta</Alert.Title>
              <Alert.Description>{response.error.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onPress={onClose}>Fechar</Button>
        </Modal.Footer>
      </>
    );
  }

  const data = response?.data;

  if (!data) {
    return (
      <>
        <Modal.Header>
          <Modal.Icon className="bg-warning text-warning-foreground">
            <Icon icon={Alert01Icon} className="icon-md" />
          </Modal.Icon>
          <Modal.Heading>Reconsolidacao indisponivel</Modal.Heading>
          <p className="text-sm text-muted">Nenhum dado foi retornado para esta consulta.</p>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-muted">Tente abrir novamente em alguns instantes.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onPress={onClose}>Fechar</Button>
        </Modal.Footer>
      </>
    );
  }

  const statusParse = bankReconciliationStatusParse[data.status];
  const environmentParse = paymentEnvironmentParse[data.environment];
  const canApplyCorrections = data.status === BankReconciliationStatus.CompletedWithDiscrepancies && !data.correctionsApplied;
  const balanceDisplay = getBalanceDisplay(data.calculatedBalance);
  const isHealthy = data.balanceDifference === 0 && !data.hasDiscrepancies;
  const totalDiscrepancies = data.totalDiscrepancies ?? 0;
  const correctedDiscrepancies = data.correctedDiscrepancies ?? 0;
  const pendingDiscrepancies = Math.max(totalDiscrepancies - correctedDiscrepancies, 0);

  const discrepancyColumns: DataTableColumn<AdminReconciliationDiscrepancy>[] = [
    {
      key: 'type',
      header: 'Tipo',
      render: (item) => {
        const parse = reconciliationDiscrepancyTypeParse[item.type];
        if (!parse) return <span className="text-sm text-muted">{item.type}</span>;

        return (
          <div className="flex items-center gap-2">
            {parse.icon}
            <span>{parse.label}</span>
          </div>
        );
      },
    },
    {
      key: 'severity',
      header: 'Severidade',
      render: (item) => {
        const parse = reconciliationDiscrepancySeverityParse[item.severity];
        if (!parse) return <span className="text-sm text-muted">{item.severity}</span>;

        return (
          <Chip variant="soft" size="sm" color={mapParseColorToChipColor(parse.color)}>
            {parse.label}
          </Chip>
        );
      },
    },
    {
      key: 'description',
      header: 'Descricao',
      render: (item) => <span className="text-sm">{item.description}</span>,
    },
    {
      key: 'difference',
      header: 'Impacto',
      render: (item) => {
        if (item.difference === 0) return <span className="text-sm text-muted">Sem diferenca</span>;

        return (
          <span className={`font-mono text-sm ${item.difference > 0 ? 'text-success' : 'text-danger'}`}>
            {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
          </span>
        );
      },
    },
    {
      key: 'corrected',
      header: 'Corrigido',
      align: 'center',
      render: (item) => (
        item.corrected ? <Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" /> : <span className="text-sm text-muted">-</span>
      ),
    },
  ];

  return (
    <>
      <Modal.Header>
        <Modal.Icon className={isHealthy ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground'}>
          <Icon icon={isHealthy ? CheckmarkCircle02Icon : RepeatIcon} className="icon-md" />
        </Modal.Icon>
        <Modal.Heading>Reconsolidacao da Organizacao</Modal.Heading>
        <p className="text-sm text-muted">
          {data.merchantName ?? 'Organizacao'} • {environmentParse?.label ?? data.environment}
        </p>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusParse ? (
              <Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)}>
                {statusParse.icon}
                {statusParse.label}
              </Chip>
            ) : (
              <Chip variant="soft" color="default">{data.status}</Chip>
            )}
            {data.correctionsApplied && (
              <Chip variant="soft" color="success">
                <Icon icon={CheckmarkSquare02Icon} className="icon-xs" />
                Correcao aplicada
              </Chip>
            )}
            {isHealthy && (
              <Chip variant="soft" color="success">
                <Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
                Saldo saudavel
              </Chip>
            )}
          </div>

          {data.errorMessage && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Erro durante o processamento</Alert.Title>
                <Alert.Description>{data.errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {canApplyCorrections ? (
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Acao recomendada</Alert.Title>
                <Alert.Description>
                  Foram encontradas divergencias corrigiveis automaticamente. Revise a leitura abaixo antes de aplicar os ajustes no ledger.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : data.correctionsApplied ? (
            <Alert status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Historico corrigido</Alert.Title>
                <Alert.Description>
                  Esta reconciliacao ja gerou os ajustes necessarios e serve como registro operacional da correcao realizada.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SummaryTile
              label="Saldo no ledger"
              value={formatCurrency(data.ledgerBalance)}
              subtext="Valor atual na conta MerchantAvailable"
              icon={Invoice03Icon}
              tone="default"
            />
            <SummaryTile
              label="Saldo esperado"
              value={`${balanceDisplay.sign}${balanceDisplay.formatted}`}
              subtext="Calculado a partir do fluxo financeiro"
              icon={RepeatIcon}
              tone="accent"
            />
            <SummaryTile
              label="Diferenca"
              value={`${data.balanceDifference > 0 ? '+' : ''}${formatCurrency(data.balanceDifference)}`}
              subtext={data.balanceDifference === 0 ? 'Sem ajuste necessario' : data.balanceDifference > 0 ? 'Saldo acima do esperado' : 'Saldo abaixo do esperado'}
              icon={ArrowRight01Icon}
              tone={data.balanceDifference === 0 ? 'success' : data.balanceDifference > 0 ? 'warning' : 'danger'}
            />
            <SummaryTile
              label="Divergencias"
              value={`${pendingDiscrepancies}`}
              subtext={`${correctedDiscrepancies} corrigidas de ${totalDiscrepancies}`}
              icon={Alert01Icon}
              tone={pendingDiscrepancies > 0 ? 'warning' : 'success'}
            />
          </div>

          <Card className={`overflow-hidden ${isHealthy ? 'ring-1 ring-success/30' : canApplyCorrections ? 'ring-1 ring-warning/30' : ''}`}>
            <Card.Content className="grid grid-cols-1 divide-y divide-divider p-0 md:grid-cols-3 md:divide-x md:divide-y-0">
              <BalancePanel
                label="Saldo atual"
                value={formatCurrency(data.ledgerBalance)}
                subtext="Registro atual do ledger"
                tone="default"
              />
              <BalancePanel
                label="Diferenca"
                value={`${data.balanceDifference > 0 ? '+' : ''}${formatCurrency(data.balanceDifference)}`}
                subtext={data.balanceDifference === 0 ? 'Consistente' : data.balanceDifference > 0 ? 'Existe saldo excedente' : 'Existe falta de saldo'}
                tone={data.balanceDifference === 0 ? 'success' : data.balanceDifference > 0 ? 'warning' : 'danger'}
              />
              <BalancePanel
                label={data.correctionsApplied ? 'Saldo apos correcao' : 'Saldo esperado'}
                value={`${balanceDisplay.sign}${balanceDisplay.formatted}`}
                subtext={data.correctionsApplied ? 'Valor final apos ajuste' : 'Valor suportado pelo fluxo'}
                tone={data.correctionsApplied ? 'success' : 'accent'}
              />
            </Card.Content>
          </Card>

          <div className="rounded-lg bg-surface-secondary p-3">
            <SectionTitle
              icon={<Icon icon={ArrowDataTransferVerticalIcon} className="icon-sm" />}
              title="Movimentacoes consideradas"
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MovementMetric
                label="Recebimentos"
                value={formatCurrency(data.totalPaymentsAmount)}
                subtext={`${data.totalPaymentsCount} pagamentos`}
                icon={MoneyReceiveSquareIcon}
                tone="success"
                tooltip="Total bruto dos pagamentos concluidos analisados nesta reconciliacao."
              />
              <MovementMetric
                label="Taxas"
                value={`-${formatCurrency(data.totalFeesAmount)}`}
                icon={Invoice03Icon}
                tone="danger"
                tooltip="Soma das taxas cobradas sobre os pagamentos considerados."
              />
              <MovementMetric
                label="Saques"
                value={`-${formatCurrency(data.totalPayoutsAmount)}`}
                subtext={`${data.totalPayoutsCount} saques`}
                icon={MoneyRemove01Icon}
                tone="danger"
                tooltip="Impacto bruto dos saques em processamento e concluidos sobre o available."
              />
              <MovementMetric
                label="Estornos"
                value={`-${formatCurrency(data.totalRefundsAmount)}`}
                subtext={`${data.totalRefundsCount} estornos`}
                icon={RepeatIcon}
                tone="warning"
                tooltip="Impacto liquido de estornos totais e parciais no saldo."
              />
            </div>
            {data.totalAdjustmentsCount > 0 && (
              <MovementMetric
                label="Ajustes manuais"
                value={`${data.totalAdjustmentsAmount >= 0 ? '+' : ''}${formatCurrency(data.totalAdjustmentsAmount)}`}
                subtext={`${data.totalAdjustmentsCount} ajustes`}
                icon={Settings02Icon}
                tone={data.totalAdjustmentsAmount >= 0 ? 'success' : 'danger'}
              />
            )}
            <div className="mt-2 grid grid-cols-1 gap-3 rounded-lg border border-foreground/10 bg-surface px-3 py-2.5 md:grid-cols-3">
              <DetailRow label="Transacoes do ledger" value={data.totalLedgerTransactionsCount} />
              <DetailRow label="Pagamentos" value={data.totalPaymentsCount} />
              <DetailRow label="Saques" value={data.totalPayoutsCount} />
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-surface-secondary p-3">
            <SectionTitle
              icon={<Icon icon={Clock01Icon} className="icon-sm" />}
              title="Linha do tempo"
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <TimelineCard
                label="Solicitacao"
                date={data.createdAt}
                user={data.requestedByUserName}
                icon={UserCircleIcon}
                isCompleted={Boolean(data.createdAt)}
              />
              <TimelineCard
                label="Inicio do processamento"
                date={data.processingStartedAt}
                icon={PlayIcon}
                isCompleted={Boolean(data.processingStartedAt)}
                isActive={Boolean(data.processingStartedAt && !data.processingCompletedAt)}
              />
              <TimelineCard
                label="Fim do processamento"
                date={data.processingCompletedAt}
                icon={Tick02Icon}
                isCompleted={Boolean(data.processingCompletedAt)}
              />
              <TimelineCard
                label="Aplicacao das correcoes"
                date={data.correctionsAppliedAt}
                user={data.correctionsAppliedByUserName}
                icon={CheckmarkSquare02Icon}
                isCompleted={data.correctionsApplied}
              />
            </div>
            {data.correctionNotes && (
              <div className="mt-2 rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="flex items-start gap-3">
                  <Icon icon={Note01Icon} className="icon-md text-success" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">Notas da correcao</p>
                    <p className="mt-1 text-sm">{data.correctionNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {data.discrepancies.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="rounded-lg border border-foreground/10 bg-surface overflow-hidden">
                <div className="border-b border-foreground/10 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Detalhes das divergencias</p>
                </div>
                <DataTable
                  columns={discrepancyColumns}
                  data={data.discrepancies}
                  keyExtractor={(item) => item.id}
                  className="gap-0"
                />
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="tertiary" onPress={onClose} isDisabled={isApplyPending}>Fechar</Button>
        {canApplyCorrections && (
          <AsyncButton variant="primary" onPress={() => onApply(data.id)} isPending={isApplyPending}>
            <Icon icon={CheckmarkSquare02Icon} className="icon-sm" />
            Aplicar correcoes
          </AsyncButton>
        )}
      </Modal.Footer>
    </>
  );
}

function BalancePanel({
  label,
  value,
  subtext,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  tone: 'success' | 'warning' | 'danger' | 'default' | 'accent';
}) {
  const toneClasses = {
    success: 'bg-success/5 text-success',
    warning: 'bg-warning/5 text-warning',
    danger: 'bg-danger/5 text-danger',
    default: 'bg-card text-foreground',
    accent: 'bg-accent/5 text-accent',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-4 py-5 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-2xl font-bold">{value}</p>
      <p className="text-center text-xs text-muted">{subtext}</p>
    </div>
  );
}

export function ReconciliationDetailsModal({
  isOpen,
  onOpenChange,
  reconciliationPromise,
  onCorrectionsApplied,
}: ReconciliationDetailsModalProps) {
  const [isApplyPending, startApplyTransition] = useTransition();

  function handleClose() {
    onOpenChange(false);
  }

  function handleApply(reconciliationId: string) {
    startApplyTransition(async () => {
      const response = await adminApplyReconciliationCorrections(reconciliationId);

      if (response?.error) {
        toast('Erro ao aplicar correcoes', {
          description: response.error.message,
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
          variant: 'danger',
        });
        return;
      }

      toast('Correcoes aplicadas', {
        description: response?.message ?? 'Os ajustes foram aplicados com sucesso.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });

      handleClose();
      onCorrectionsApplied();
    });
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-5xl">
          <Modal.CloseTrigger />
          {reconciliationPromise && (
            <Suspense fallback={<DetailsSkeleton />}>
              <DetailsContent
                reconciliationPromise={reconciliationPromise}
                onClose={handleClose}
                onApply={handleApply}
                isApplyPending={isApplyPending}
              />
            </Suspense>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
