import { AcquirerType, AcquirerOperationType, WebhookAuthMode, PayoutFeeHandling, PaymentFeeSplitHandling, ProviderCategory, ExternalSubmerchantStatus } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import { mapParseColorToChipColor } from './types';
import {
	CheckmarkCircle02Icon,
	Key01Icon,
	RouterIcon,
	ServerStack01Icon,
	UserBlock01Icon,
	RubberDuckIcon,
	AnonymousIcon,
	Shield01Icon,
	CancelCircleIcon,
	SafeDelivery01Icon,
	BankIcon,
	HourglassIcon,
	Search01Icon,
	AlertCircleIcon,
	SleepingIcon,
} from '@hugeicons/core-free-icons';

export const acquirerTypeParse: Record<AcquirerType, TParse> = {
	Bankizi: {
		label: 'Bankizi',
		color: 'accent',
		description: 'Adquirente Bankizi',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	IHubBanking: {
		label: 'IHub Banking',
		color: 'secondary',
		description: 'Adquirente IHub Banking',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	ActivePayments: {
		label: 'ActivePayments',
		color: 'accent',
		description: 'Adquirente ActivePayments',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	Rapdyn: {
		label: 'Rapdyn',
		color: 'secondary',
		description: 'Adquirente Rapdyn',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	Coldfy: {
		label: 'Coldfy',
		color: 'accent',
		description: 'Adquirente Coldfy',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	Pluggou: {
		label: 'Pluggou',
		color: 'secondary',
		description: 'Adquirente Pluggou',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	HunterPay: {
		label: 'HunterPay',
		color: 'accent',
		description: 'Adquirente HunterPay',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	HeartPay: {
		label: 'HeartPay',
		color: 'secondary',
		description: 'Adquirente HeartPay',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	Accithus: {
		label: 'Accithus',
		color: 'secondary',
		description: 'Instituição de Pagamento Accithus',
		icon: <Icon icon={BankIcon} size={18} />,
	},
};

export const webhookAuthModeParse: Record<WebhookAuthMode, TParse> = {
	None: {
		label: 'Nenhuma',
		color: 'default',
		description: 'Sem autenticação de webhook',
		icon: <Icon icon={CancelCircleIcon} size={18} />,
	},
	Token: {
		label: 'Token',
		color: 'accent',
		description: 'Autenticação via token no header',
		icon: <Icon icon={Key01Icon} size={18} />,
	},
	Ip: {
		label: 'IP',
		color: 'warning',
		description: 'Autenticação via IP de origem',
		icon: <Icon icon={RouterIcon} size={18} />,
	},
	TokenAndIp: {
		label: 'Token + IP',
		color: 'success',
		description: 'Autenticação via token e IP',
		icon: <Icon icon={CheckmarkCircle02Icon} size={18} />,
	},
	HmacSha256: {
		label: 'HMAC SHA256',
		color: 'accent',
		description: 'Assinatura HMAC SHA256 no header',
		icon: <Icon icon={Shield01Icon} size={18} />,
	},
};

export const acquirerStatusParse: Record<'true' | 'false', TParse> = {
	true: {
		label: 'Ativas',
		color: 'success',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	false: {
		label: 'Inativas',
		color: 'default',
		icon: <Icon icon={UserBlock01Icon} className="icon-sm" />,
	},
};

export const acquirerStatusOptions = Object.entries(acquirerStatusParse).map(([key, value]) => ({
	value: key,
	label: value.label,
	icon: value.icon,
	color: mapParseColorToChipColor(value.color),
}));

export const acquirerOperationTypeParse: Record<AcquirerOperationType, TParse & { className?: string }> = {
	White: {
		label: 'White',
		color: 'default',
		description: 'Operação regular (white label)',
		icon: <Icon icon={RubberDuckIcon} size={14} />,
		className: 'bg-white text-black border border-gray-300',
	},
	Black: {
		label: 'Black',
		color: 'default',
		description: 'Operação especial (black)',
		icon: <Icon icon={AnonymousIcon} size={14} />,
		className: 'bg-black text-white border border-gray-900',
	},
};

export const acquirerOperationTypeOptions = Object.entries(acquirerOperationTypeParse).map(([key, value]) => ({
	value: key as AcquirerOperationType,
	label: value.label,
	icon: value.icon,
	color: mapParseColorToChipColor(value.color),
}));

export const payoutFeeHandlingParse: Record<PayoutFeeHandling, TParse> = {
	FeeDeductedFromTransfer: {
		label: 'Taxa no Valor Transferido',
		color: 'success',
		description: 'A taxa é deduzida do valor transferido (enviar valor + taxa, destinatário recebe valor)',
	},
	FeeAddedToDebit: {
		label: 'Taxa no Débito',
		color: 'warning',
		description: 'A taxa é adicionada ao débito total (enviar valor, débito = valor + taxa)',
	},
};

export const payoutFeeHandlingOptions = Object.entries(payoutFeeHandlingParse).map(([key, value]) => ({
	value: key as PayoutFeeHandling,
	label: value.label,
	description: value.description,
	color: mapParseColorToChipColor(value.color),
}));

export const paymentFeeSplitHandlingParse: Record<PaymentFeeSplitHandling, TParse> = {
	None: {
		label: 'Nenhum (Padrão)',
		color: 'default',
		description: 'A taxa da plataforma é creditada normalmente como saldo disponível da SwiftPay',
	},
	AutoSplitToBank: {
		label: 'Split Automático p/ Banco',
		color: 'warning',
		description: 'A adquirente já envia a taxa direto para o banco da SwiftPay (registra como saque automatizado)',
	},
};

export const paymentFeeSplitHandlingOptions = Object.entries(paymentFeeSplitHandlingParse).map(([key, value]) => ({
	value: key as PaymentFeeSplitHandling,
	label: value.label,
	description: value.description,
	color: mapParseColorToChipColor(value.color),
}));

export const providerCategoryParse: Record<ProviderCategory, TParse> = {
	Acquirer: {
		label: 'Adquirente',
		color: 'accent',
		description: 'Adquirente tradicional',
		icon: <Icon icon={ServerStack01Icon} size={18} />,
	},
	PaymentInstitution: {
		label: 'IP',
		color: 'secondary',
		description: 'Instituição de pagamento (IP) com KYC de submerchant',
		icon: <Icon icon={BankIcon} size={18} />,
	},
};

export const acquirerTypeProviderCategoryMap: Record<AcquirerType, ProviderCategory> = {
	Bankizi: ProviderCategory.Acquirer,
	IHubBanking: ProviderCategory.Acquirer,
	ActivePayments: ProviderCategory.Acquirer,
	Rapdyn: ProviderCategory.Acquirer,
	Coldfy: ProviderCategory.Acquirer,
	Pluggou: ProviderCategory.Acquirer,
	HunterPay: ProviderCategory.Acquirer,
	HeartPay: ProviderCategory.Acquirer,
	Accithus: ProviderCategory.PaymentInstitution,
};

export const providerCategoryOptions = Object.entries(providerCategoryParse).map(([key, value]) => ({
	value: key as ProviderCategory,
	label: value.label,
	description: value.description,
	icon: value.icon,
	color: mapParseColorToChipColor(value.color),
}));

export const externalSubmerchantStatusParse: Record<ExternalSubmerchantStatus, TParse> = {
	NotSubmitted: {
		label: 'Não Enviado',
		color: 'default',
		description: 'KYC ainda não foi enviado para a IP',
		icon: <Icon icon={CancelCircleIcon} size={18} />,
	},
	Pending: {
		label: 'Pendente',
		color: 'warning',
		description: 'Aguardando análise da IP',
		icon: <Icon icon={HourglassIcon} size={18} />,
	},
	PendingReview: {
		label: 'Em Análise',
		color: 'warning',
		description: 'Sob análise da IP',
		icon: <Icon icon={Search01Icon} size={18} />,
	},
	Active: {
		label: 'Ativo',
		color: 'success',
		description: 'Submerchant aprovado e ativo',
		icon: <Icon icon={CheckmarkCircle02Icon} size={18} />,
	},
	Rejected: {
		label: 'Rejeitado',
		color: 'danger',
		description: 'Submerchant rejeitado pela IP',
		icon: <Icon icon={AlertCircleIcon} size={18} />,
	},
	Suspended: {
		label: 'Suspenso',
		color: 'danger',
		description: 'Submerchant suspenso pela IP',
		icon: <Icon icon={UserBlock01Icon} size={18} />,
	},
	Inactive: {
		label: 'Inativo',
		color: 'default',
		description: 'Submerchant inativo na IP',
		icon: <Icon icon={SleepingIcon} size={18} />,
	},
};