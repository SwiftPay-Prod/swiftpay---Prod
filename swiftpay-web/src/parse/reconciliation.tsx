import {
  BankReconciliationStatus,
  ReconciliationDiscrepancyType,
  ReconciliationDiscrepancySeverity,
} from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
  Alert01Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  HourglassIcon,
  ArrowReloadHorizontalIcon,
  Cancel01Icon,
  RepeatIcon,
  HelpCircleIcon,
  RemoveCircleIcon,
  AlertDiamondIcon,
  ArrowDataTransferHorizontalIcon,
  Wallet01Icon,
  MoneyReceive02Icon,
  MoneyRemoveIcon,
} from '@hugeicons/core-free-icons';

export const bankReconciliationStatusParse: Record<BankReconciliationStatus, TParse> = {
  Pending: {
    label: 'Pendente',
    color: 'default',
    description: 'Reconciliação aguardando processamento',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Processing: {
    label: 'Processando',
    color: 'accent',
    description: 'Reconciliação em andamento',
    icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />,
  },
  Completed: {
    label: 'Concluída',
    color: 'success',
    description: 'Reconciliação concluída sem divergências',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  CompletedWithDiscrepancies: {
    label: 'Com Divergências',
    color: 'warning',
    description: 'Reconciliação concluída com divergências',
    icon: <Icon icon={Alert01Icon} className="icon-sm" />,
  },
  CorrectionsApplied: {
    label: 'Correções Aplicadas',
    color: 'success',
    description: 'Divergências corrigidas com sucesso',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Failed: {
    label: 'Falhou',
    color: 'danger',
    description: 'Reconciliação falhou',
    icon: <Icon icon={Cancel01Icon} className="icon-sm" />,
  },
};

export const reconciliationDiscrepancyTypeParse: Record<ReconciliationDiscrepancyType, TParse> = {
  PaymentNotInLedger: {
    label: 'Pagamento sem Ledger',
    color: 'danger',
    description: 'Pagamento confirmado sem registro no ledger',
    icon: <Icon icon={MoneyReceive02Icon} className="icon-sm" />,
  },
  PayoutNotInLedger: {
    label: 'Saque sem Ledger',
    color: 'danger',
    description: 'Saque processado sem registro no ledger',
    icon: <Icon icon={MoneyRemoveIcon} className="icon-sm" />,
  },
  RefundNotInLedger: {
    label: 'Estorno sem Ledger',
    color: 'danger',
    description: 'Estorno sem registro no ledger',
    icon: <Icon icon={RemoveCircleIcon} className="icon-sm" />,
  },
  MissingReversal: {
    label: 'Reversão Ausente',
    color: 'danger',
    description: 'Reversão de saque faltando no ledger',
    icon: <Icon icon={RepeatIcon} className="icon-sm" />,
  },
  OrphanLedgerEntry: {
    label: 'Lançamento Órfão',
    color: 'warning',
    description: 'Transação no ledger sem referência correspondente',
    icon: <Icon icon={HelpCircleIcon} className="icon-sm" />,
  },
  AmountMismatch: {
    label: 'Valor Divergente',
    color: 'warning',
    description: 'Valor diferente entre transação e ledger',
    icon: <Icon icon={ArrowDataTransferHorizontalIcon} className="icon-sm" />,
  },
  FeeMismatch: {
    label: 'Taxa Divergente',
    color: 'warning',
    description: 'Taxa diferente entre transação e ledger',
    icon: <Icon icon={Alert02Icon} className="icon-sm" />,
  },
  DuplicateLedgerEntry: {
    label: 'Duplicata no Ledger',
    color: 'warning',
    description: 'Transação duplicada no ledger',
    icon: <Icon icon={RepeatIcon} className="icon-sm" />,
  },
  BalanceMismatch: {
    label: 'Saldo Disponível Divergente',
    color: 'danger',
    description: 'Diferença entre saldo disponível no ledger e saldo calculado',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  PayoutsOutMismatch: {
    label: 'Saques Acumulados Divergente',
    color: 'danger',
    description: 'Diferença entre total de saques acumulados e conta MerchantPayoutsOut',
    icon: <Icon icon={MoneyRemoveIcon} className="icon-sm" />,
  },
  PendingMismatch: {
    label: 'Saldo Pendente Divergente',
    color: 'danger',
    description: 'Diferença entre saldo pendente no ledger e pagamentos pendentes',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  BlockedMismatch: {
    label: 'Saldo Bloqueado Divergente',
    color: 'danger',
    description: 'Diferença entre saldo bloqueado no ledger e saques em processamento',
    icon: <Icon icon={AlertDiamondIcon} className="icon-sm" />,
  },
  NegativeAvailableBalance: {
    label: 'Saldo Disponível Negativo',
    color: 'danger',
    description: 'Saldo disponível ficou negativo após saídas superiores ao suportado',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  WithdrawalExceedsInflow: {
    label: 'Saque Acima da Entrada',
    color: 'danger',
    description: 'Total sacado excede entrada líquida suportada para o período',
    icon: <Icon icon={MoneyRemoveIcon} className="icon-sm" />,
  },
};

export const reconciliationDiscrepancySeverityParse: Record<ReconciliationDiscrepancySeverity, TParse> = {
  Info: {
    label: 'Informativo',
    color: 'default',
    description: 'Informativo apenas, sem impacto',
    icon: <Icon icon={HelpCircleIcon} className="icon-sm" />,
  },
  Warning: {
    label: 'Atenção',
    color: 'warning',
    description: 'Atenção necessária, verificar manualmente',
    icon: <Icon icon={Alert01Icon} className="icon-sm" />,
  },
  Error: {
    label: 'Erro',
    color: 'danger',
    description: 'Erro que afeta o saldo',
    icon: <Icon icon={Alert02Icon} className="icon-sm" />,
  },
  Critical: {
    label: 'Crítico',
    color: 'danger',
    description: 'Erro crítico que precisa de correção imediata',
    icon: <Icon icon={AlertDiamondIcon} className="icon-sm" />,
  },
};

