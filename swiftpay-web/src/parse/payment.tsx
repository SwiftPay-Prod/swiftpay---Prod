import { 
  PaymentEnvironment, 
  PaymentMethod, 
  PaymentStatus,
  PaymentLinkLifetimeStatus,
  PayoutStatus,
  PayoutAccountStatus,
  PayoutReviewAction,
  PixKeyType,
  FeeChargeMode,
  WithdrawalApprovalMode,
  LedgerEntryType,
  AccountType,
  CallbackStatus,
  SimulatePaymentAction,
  SimulateCashoutAction,
  CashoutEvaluateAction,
  ApprovalRateLevel,
} from '@/types/enums';
import type {
  PlatformPayoutStatus,
  PlatformPayoutItemStatus,
} from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
	AddCircleIcon,
	AlertCircleIcon,
	ArrowDataTransferVerticalIcon,
	ArrowReloadHorizontalIcon,
	CallIcon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	CreditCardIcon,
	DollarCircleIcon,
	File01Icon,
	HelpCircleIcon,
	HourglassIcon,
	Key01Icon,
	Link01Icon,
	Mail01Icon,
	RemoveCircleIcon,
	SecurityLockIcon,
	Shield01Icon,
	Tag01Icon,
	UndoIcon,
	Unlink01Icon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';

export const paymentEnvironmentParse: Record<PaymentEnvironment, TParse> = {
  Sandbox: {
    label: 'Sandbox',
    color: 'warning',
    description: 'Ambiente de testes',
    icon: <Icon icon={Key01Icon} className="icon-sm" />,
  },
  Production: {
    label: 'Produção',
    color: 'success',
    description: 'Ambiente de produção',
    icon: <Icon icon={Key01Icon} className="icon-sm" />,
  },
};

export const paymentMethodParse: Record<NonNullable<PaymentMethod>, TParse> = {
  Pix: {
    label: 'PIX',
    color: 'success',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  CreditCard: {
    label: 'Cartão de Crédito',
    color: 'accent',
    icon: <Icon icon={CreditCardIcon} className="icon-sm" />,
  },
  Boleto: {
    label: 'Boleto',
    color: 'default',
    icon: <Icon icon={File01Icon} className="icon-sm" />,
  },
};

export const paymentStatusParse: Record<NonNullable<PaymentStatus>, TParse> = {
  Pending: {
    label: 'Pendente',
    color: 'warning',
    description: 'Aguardando pagamento',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Processing: {
    label: 'Processando',
    color: 'accent',
    description: 'Pagamento em processamento',
    icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />,
  },
  Confirming: {
    label: 'Confirmando',
    color: 'accent',
    description: 'Confirmação em andamento',
    icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />,
  },
  Completed: {
    label: 'Concluído',
    color: 'success',
    description: 'Pagamento confirmado',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Failed: {
    label: 'Falhou',
    color: 'danger',
    description: 'Pagamento falhou',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Refunded: {
    label: 'Reembolsado',
    color: 'secondary',
    description: 'Pagamento reembolsado integralmente',
    icon: <Icon icon={UndoIcon} className="icon-sm" />,
  },
  PartiallyRefunded: {
    label: 'Reembolsado Parcialmente',
    color: 'warning',
    description: 'Pagamento reembolsado parcialmente',
    icon: <Icon icon={UndoIcon} className="icon-sm" />,
  },
  Disputed: {
    label: 'Em Disputa',
    color: 'danger',
    description: 'Pagamento em disputa',
    icon: <Icon icon={Shield01Icon} className="icon-sm" />,
  },
  Expired: {
    label: 'Expirado',
    color: 'default',
    description: 'Pagamento expirou',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Cancelled: {
    label: 'Cancelado',
    color: 'default',
    description: 'Pagamento cancelado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const paymentLinkLifetimeStatusParse: Record<PaymentLinkLifetimeStatus, TParse> = {
  NeverExpires: {
    label: 'Não expira',
    color: 'success',
    description: 'Link permanente e reutilizável',
    icon: <Icon icon={Link01Icon} className="icon-sm" />,
  },
  Active: {
    label: 'Ativo',
    color: 'accent',
    description: 'Link dentro do prazo de validade',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Expired: {
    label: 'Expirado',
    color: 'danger',
    description: 'Link expirado',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
};

export const payoutStatusParse: Record<NonNullable<PayoutStatus>, TParse> = {
  Pending: {
    label: 'Aguardando Aprovação',
    color: 'warning',
    description: 'O saque está aguardando aprovação do administrador',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Processing: {
    label: 'Processando',
    color: 'accent',
    description: 'Saque em processamento',
    icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />,
  },
  Confirming: {
    label: 'Confirmando',
    color: 'accent',
    description: 'Confirmação em andamento',
    icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />,
  },
  Completed: {
    label: 'Concluído',
    color: 'success',
    description: 'Saque realizado com sucesso',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Failed: {
    label: 'Falhou',
    color: 'danger',
    description: 'Saque falhou',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Rejected: {
    label: 'Rejeitado',
    color: 'danger',
    description: 'Saque rejeitado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Cancelled: {
    label: 'Cancelado',
    color: 'default',
    description: 'Saque cancelado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const payoutAccountStatusParse: Record<PayoutAccountStatus, TParse> = {
  Pending: {
    label: 'Pendente',
    color: 'warning',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Active: {
    label: 'Ativa',
    color: 'success',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Inactive: {
    label: 'Inativa',
    color: 'default',
  },
  Rejected: {
    label: 'Rejeitada',
    color: 'danger',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const payoutReviewActionParse: Record<PayoutReviewAction, TParse> = {
  Approve: {
    label: 'Aprovar',
    color: 'success',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Reject: {
    label: 'Rejeitar',
    color: 'danger',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const pixKeyTypeParse: Record<PixKeyType, TParse> = {
  Cpf: {
    label: 'CPF',
    color: 'default',
    icon: <Icon icon={File01Icon} className="icon-sm" />,
  },
  Cnpj: {
    label: 'CNPJ',
    color: 'default',
    icon: <Icon icon={File01Icon} className="icon-sm" />,
  },
  Email: {
    label: 'E-mail',
    color: 'default',
    icon: <Icon icon={Mail01Icon} className="icon-sm" />,
  },
  Phone: {
    label: 'Telefone',
    color: 'default',
    icon: <Icon icon={CallIcon} className="icon-sm" />,
  },
  Random: {
    label: 'Chave Aleatória',
    color: 'default',
    icon: <Icon icon={HelpCircleIcon} className="icon-sm" />,
  },
};

export const feeChargeModeParse: Record<NonNullable<FeeChargeMode>, TParse> = {
  FixedOnly: {
    label: 'Apenas Fixo',
    color: 'default',
    description: 'Cobra apenas valor fixo',
    icon: <Icon icon={Tag01Icon} className="icon-sm" />,
  },
  PercentageOnly: {
    label: 'Apenas Percentual',
    color: 'default',
    description: 'Cobra apenas percentual',
    icon: <Icon icon={Tag01Icon} className="icon-sm" />,
  },
  FixedAndPercentage: {
    label: 'Fixo + Percentual',
    color: 'default',
    description: 'Cobra valor fixo mais percentual',
    icon: <Icon icon={Tag01Icon} className="icon-sm" />,
  },
};

export const withdrawalApprovalModeParse: Record<NonNullable<WithdrawalApprovalMode>, TParse> = {
  Automatic: {
    label: 'Automático',
    color: 'success',
    description: 'Saques são aprovados automaticamente',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Manual: {
    label: 'Manual',
    color: 'warning',
    description: 'Saques requerem aprovação manual',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
};

export const feeChargeModeOptions = Object.entries(feeChargeModeParse).map(
  ([key, value]) => ({ key, label: value.label, icon: value.icon, color: value.color })
);

export const feeChargeModeOptionsWithDefault = [
  { key: 'default', label: 'Padrão do sistema', icon: null, color: 'default' as const },
  ...feeChargeModeOptions,
];

export const withdrawalApprovalModeOptions = Object.entries(withdrawalApprovalModeParse).map(
  ([key, value]) => ({ key, label: value.label, icon: value.icon, color: value.color })
);

export const withdrawalApprovalModeOptionsWithDefault = [
  { key: 'default', label: 'Padrão do sistema', icon: null, color: 'default' as const },
  ...withdrawalApprovalModeOptions,
];

export const ledgerEntryTypeParse: Record<LedgerEntryType, TParse> = {
  Credit: {
    label: 'Crédito',
    color: 'success',
    description: 'Entrada de valor',
    icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
  },
  Debit: {
    label: 'Débito',
    color: 'danger',
    description: 'Saída de valor',
    icon: <Icon icon={RemoveCircleIcon} className="icon-sm" />,
  },
};

export const accountTypeParse: Record<AccountType, TParse> = {
  MerchantAvailable: {
    label: 'Saldo Disponível',
    color: 'success',
    description: 'Saldo disponível para saque',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  MerchantPending: {
    label: 'Saldo Pendente',
    color: 'warning',
    description: 'Pagamentos aguardando confirmação',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  MerchantBlocked: {
    label: 'Saldo Bloqueado',
    color: 'danger',
    description: 'Saldo reservado para saques em processamento',
    icon: <Icon icon={SecurityLockIcon} className="icon-sm" />,
  },
  MerchantPayoutsOut: {
    label: 'Saques Realizados',
    color: 'default',
    description: 'Total de saques concluídos',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  MerchantFeesPaid: {
    label: 'Taxas Pagas',
    color: 'default',
    description: 'Total de taxas pagas',
    icon: <Icon icon={DollarCircleIcon} className="icon-sm" />,
  },
  PlatformFee: {
    label: 'Taxa da Plataforma',
    color: 'accent',
    description: 'Taxas acumuladas pela plataforma',
    icon: <Icon icon={DollarCircleIcon} className="icon-sm" />,
  },
  PlatformBlocked: {
    label: 'Bloqueado Plataforma',
    color: 'warning',
    description: 'Saldo bloqueado (saques em processamento)',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  PlatformPayoutsOut: {
    label: 'Saques Plataforma',
    color: 'default',
    description: 'Total de saques realizados pela plataforma',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  AcquirerSettlement: {
    label: 'Liquidação Adquirente',
    color: 'accent',
    description: 'Recebimentos da adquirente',
    icon: <Icon icon={ArrowDataTransferVerticalIcon} className="icon-sm" />,
  },
  AcquirerPayoutsOut: {
    label: 'Saques Adquirente',
    color: 'default',
    description: 'Saques processados via adquirente',
    icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
  },
  AcquirerFeesPaid: {
    label: 'Taxas Adquirente',
    color: 'default',
    description: 'Taxas pagas às adquirentes',
    icon: <Icon icon={DollarCircleIcon} className="icon-sm" />,
  },
};

export const pixKeyTypeOptions = Object.entries(pixKeyTypeParse).map(
  ([key, value]) => ({
    value: key as PixKeyType,
    label: value.label,
    icon: value.icon,
    color: value.color,
  })
);

export const payoutAccountStatusOptions = Object.entries(payoutAccountStatusParse).map(
  ([key, value]) => ({
    value: key as PayoutAccountStatus,
    label: value.label,
    icon: value.icon,
    color: value.color,
  })
);

export const callbackStatusParse: Record<CallbackStatus, TParse> = {
  NotConfigured: {
    label: 'Não Configurado',
    color: 'default',
    description: 'Callback não configurado',
    icon: <Icon icon={Unlink01Icon} className="icon-sm" />,
  },
  Pending: {
    label: 'Pendente',
    color: 'warning',
    description: 'Callback pendente de envio',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Sent: {
    label: 'Enviado',
    color: 'success',
    description: 'Callback enviado com sucesso',
    icon: <Icon icon={Link01Icon} className="icon-sm" />,
  },
  Failed: {
    label: 'Falhou',
    color: 'danger',
    description: 'Callback falhou após todas as tentativas',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const simulatePaymentActionParse: Record<SimulatePaymentAction, TParse> = {
  complete: {
    label: 'Completar',
    color: 'success',
    description: 'Simula o pagamento como concluído',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  expire: {
    label: 'Expirar',
    color: 'warning',
    description: 'Simula o pagamento como expirado',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  fail: {
    label: 'Falhar',
    color: 'danger',
    description: 'Simula o pagamento como falhou',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  refund: {
    label: 'Reembolsar',
    color: 'secondary',
    description: 'Simula o reembolso do pagamento',
    icon: <Icon icon={UndoIcon} className="icon-sm" />,
  },
};

export const simulateCashoutActionParse: Record<SimulateCashoutAction, TParse> = {
  Complete: {
    label: 'Completar',
    color: 'success',
    description: 'Simula o saque como concluído',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Fail: {
    label: 'Falhar',
    color: 'danger',
    description: 'Simula o saque como falhou',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Reject: {
    label: 'Rejeitar',
    color: 'danger',
    description: 'Simula o saque como rejeitado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const simulatePaymentActionOptions = Object.entries(simulatePaymentActionParse).map(
  ([key, value]) => ({
    value: key as SimulatePaymentAction,
    label: value.label,
    icon: value.icon,
    color: value.color,
    description: value.description,
  })
);

export const simulateCashoutActionOptions = Object.entries(simulateCashoutActionParse).map(
  ([key, value]) => ({
    value: key as SimulateCashoutAction,
    label: value.label,
    icon: value.icon,
    color: value.color,
    description: value.description,
  })
);

export const cashoutEvaluateActionParse: Record<CashoutEvaluateAction, TParse> = {
  Approve: {
    label: 'Aprovar',
    color: 'success',
    description: 'Aprovar e processar o saque',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Reject: {
    label: 'Rejeitar',
    color: 'danger',
    description: 'Rejeitar o saque e devolver o saldo',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const cashoutEvaluateActionOptions = Object.entries(cashoutEvaluateActionParse).map(
  ([key, value]) => ({
    value: key as CashoutEvaluateAction,
    label: value.label,
    icon: value.icon,
    color: value.color,
    description: value.description,
  })
);

export const platformPayoutStatusParse: Record<PlatformPayoutStatus, TParse> = {
  Processing: {
    label: 'Processando',
    color: 'warning',
    description: 'Saque em processamento nas adquirentes',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Completed: {
    label: 'Concluído',
    color: 'success',
    description: 'Todos os saques foram processados com sucesso',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  PartiallyCompleted: {
    label: 'Parcialmente Concluído',
    color: 'warning',
    description: 'Parte dos saques foi concluída. Os valores das falhas retornaram ao saldo disponível',
    icon: <Icon icon={AlertCircleIcon} className="icon-sm" />,
  },
  Failed: {
    label: 'Falhou',
    color: 'danger',
    description: 'Todos os saques falharam. Os valores retornaram ao saldo disponível',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Cancelled: {
    label: 'Cancelado',
    color: 'default',
    description: 'Saque cancelado. Os valores retornaram ao saldo disponível',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const platformPayoutStatusOptions = Object.entries(platformPayoutStatusParse).map(
  ([key, value]) => ({
    value: key as PlatformPayoutStatus,
    label: value.label,
    icon: value.icon,
    color: value.color,
  })
);

export const platformPayoutItemStatusParse: Record<PlatformPayoutItemStatus, TParse> = {
  Processing: {
    label: 'Processando',
    color: 'warning',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Completed: {
    label: 'Concluído',
    color: 'success',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Failed: {
    label: 'Falhou',
    color: 'danger',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Cancelled: {
    label: 'Cancelado',
    color: 'default',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const approvalRateLevelParse: Record<ApprovalRateLevel, TParse> = {
  Critical: {
    label: 'Crítico',
    color: 'danger',
    description: '0% - 15%',
  },
  BelowAverage: {
    label: 'Abaixo do ideal',
    color: 'warning',
    description: '15% - 25%',
  },
  Average: {
    label: 'Dentro da média',
    color: 'default',
    description: '25% - 35%',
  },
  Good: {
    label: 'Boa performance',
    color: 'accent',
    description: '35% - 50%',
  },
  Excellent: {
    label: 'Alta performance',
    color: 'success',
    description: '50%+',
  },
};

