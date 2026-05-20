import {
	MerchantStatus,
	MerchantKycStatus,
	MerchantKycDocumentType,
	MerchantIdentityDocumentType,
	MerchantKycOperationType,
	MerchantApiCredentialEnvironment,
	MerchantApiCredentialStatus,
	MerchantKycPendingItemType,
	MerchantKycPendingItemStatus,
	MerchantAcquirerChangeAction,
	MerchantSettingsChangeCategory,
} from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
	Alert01Icon,
	BubbleChatIcon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Delete02Icon,
	File01Icon,
	FileAddIcon,
	HourglassIcon,
	InformationCircleIcon,
	Key01Icon,
	PencilEdit01Icon,
	TaskRemove01Icon,
	UserBlock01Icon,
	ArrowRight01Icon,
	Link01Icon,
	RefreshIcon,
	Settings01Icon,
	Wallet01Icon,
	Analytics01Icon,
	Clock01Icon,
	DatabaseIcon,
	RemoveIcon,
	ShieldCheck,
	AnonymousIcon,
	RubberDuckIcon,
} from '@hugeicons/core-free-icons';

export const merchantStatusParse: Record<MerchantStatus, TParse> = {
	Draft: {
		label: 'Rascunho',
		color: 'default',
		description: 'O cadastro ainda está sendo preenchido.',
		icon: <Icon icon={PencilEdit01Icon} className="icon-sm" />,
	},
	Active: {
		label: 'Ativo',
		color: 'success',
		description: 'Organização ativa e operacional.',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	Inactive: {
		label: 'Inativa',
		color: 'danger',
		description: 'Organização desativada.',
		icon: <Icon icon={UserBlock01Icon} className="icon-sm" />,
	},
	Suspended: {
		label: 'Suspensa',
		color: 'warning',
		description: 'Organização suspensa temporariamente.',
		icon: <Icon icon={TaskRemove01Icon} className="icon-sm" />,
	},
	Deleted: {
		label: 'Excluído',
		color: 'danger',
		description: 'Organização excluída.',
		icon: <Icon icon={Delete02Icon} className="icon-sm" />,
	},
};

export const merchantKycStatusParse: Record<MerchantKycStatus, TParse> = {
	Draft: {
		label: 'Rascunho',
		color: 'default',
		description: 'O cadastro ainda está sendo preenchido.',
		icon: <Icon icon={PencilEdit01Icon} className="icon-sm" />,
	},
	Pending: {
		label: 'Pendente de avaliação',
		color: 'accent',
		description: 'Seu KYC foi enviado e está aguardando avaliação da equipe.',
		icon: <Icon icon={HourglassIcon} className="icon-sm" />,
	},
	UnderReview: {
		label: 'Pendente de avaliação',
		color: 'accent',
		description: 'Seu KYC está em fila de avaliação. Você receberá uma atualização assim que houver parecer.',
		icon: <Icon icon={HourglassIcon} className="icon-sm" />,
	},
	Approved: {
		label: 'Aprovado',
		color: 'success',
		description: 'Sua organização foi aprovada e está pronta para operar.',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	Rejected: {
		label: 'Rejeitado',
		color: 'danger',
		description:
			'Infelizmente sua organização não foi aprovada. Verifique o motivo e entre em contato com nosso suporte.',
		icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
	},
	Complement: {
		label: 'Complemento solicitado',
		color: 'warning',
		description: 'Nossa equipe solicitou informações complementares para dar continuidade à análise.',
		icon: <Icon icon={File01Icon} className="icon-sm" />,
	},
};

export const merchantDocumentTypeParse: Record<NonNullable<MerchantKycDocumentType>, TParse> = {
	CPF: {
		label: 'CPF - Pessoa Física',
		color: 'default',
	},
	CNPJ: {
		label: 'CNPJ - Pessoa Jurídica',
		color: 'default',
	},
};

export const merchantIdentityDocumentTypeParse: Record<NonNullable<MerchantIdentityDocumentType>, TParse> = {
	RG: {
		label: 'RG - Registro Geral',
		color: 'default',
	},
	CNH: {
		label: 'CNH - Carteira de Motorista',
		color: 'default',
	},
};

export const merchantOperationTypeParse: Record<NonNullable<MerchantKycOperationType>, TParse & { className?: string }> = {
	White: {
		label: 'White',
		color: 'default',
		icon: <Icon icon={RubberDuckIcon} size={14} />,
		className: 'bg-white text-black border border-gray-300',
	},
	Black: {
		label: 'Black',
		color: 'accent',
		icon: <Icon icon={AnonymousIcon} size={14} />,
		className: 'bg-black text-white border border-gray-900',
	},
};

export const merchantApiCredentialEnvironmentParse: Record<MerchantApiCredentialEnvironment, TParse> = {
	Sandbox: {
		label: 'Sandbox (Testes)',
		color: 'warning',
		icon: <Icon icon={Key01Icon} className="icon-sm" />,
	},
	Production: {
		label: 'Produção',
		color: 'success',
		icon: <Icon icon={Key01Icon} className="icon-sm" />,
	},
};

export const merchantApiCredentialStatusParse: Record<MerchantApiCredentialStatus, TParse> = {
	Active: {
		label: 'Ativa',
		color: 'success',
		icon: <Icon icon={Key01Icon} className="icon-sm" />,
	},
	Inactive: {
		label: 'Inativa',
		color: 'default',
	},
	Revoked: {
		label: 'Revogada',
		color: 'danger',
	},
};

export const merchantKycPendingItemTypeParse: Record<MerchantKycPendingItemType, TParse> = {
	Document: {
		label: 'Documento',
		color: 'accent',
		description: 'Envio de documento adicional.',
		icon: <Icon icon={FileAddIcon} className="icon-sm" />,
	},
	Information: {
		label: 'Informação',
		color: 'secondary',
		description: 'Fornecer informação adicional.',
		icon: <Icon icon={InformationCircleIcon} className="icon-sm" />,
	},
	Clarification: {
		label: 'Esclarecimento',
		color: 'warning',
		description: 'Esclarecer uma informação.',
		icon: <Icon icon={BubbleChatIcon} className="icon-sm" />,
	},
	Correction: {
		label: 'Correção',
		color: 'danger',
		description: 'Corrigir informação incorreta.',
		icon: <Icon icon={Alert01Icon} className="icon-sm" />,
	},
	Other: {
		label: 'Outro',
		color: 'default',
		description: 'Outra solicitação.',
		icon: <Icon icon={InformationCircleIcon} className="icon-sm" />,
	},
};

export const merchantKycPendingItemStatusParse: Record<MerchantKycPendingItemStatus, TParse> = {
	Pending: {
		label: 'Pendente',
		color: 'warning',
		description: 'Aguardando resposta.',
		icon: <Icon icon={HourglassIcon} className="icon-sm" />,
	},
	Responded: {
		label: 'Respondido',
		color: 'accent',
		description: 'Resposta enviada, aguardando análise.',
		icon: <Icon icon={BubbleChatIcon} className="icon-sm" />,
	},
	Approved: {
		label: 'Aprovado',
		color: 'success',
		description: 'Resposta aprovada.',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	Rejected: {
		label: 'Rejeitado',
		color: 'danger',
		description: 'Resposta rejeitada.',
		icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
	},
};

const MERCHANT_STATUS_PRIORITY: MerchantStatus[] = [
	MerchantStatus.Deleted,
	MerchantStatus.Suspended,
	MerchantStatus.Inactive,
];

export function getMerchantDisplayParse(status: MerchantStatus, kycStatus: MerchantKycStatus): TParse {
	if (MERCHANT_STATUS_PRIORITY.includes(status)) {
		return merchantStatusParse[status];
	}
	return merchantKycStatusParse[kycStatus];
}

export const merchantDocumentTypeOptions = Object.entries(merchantDocumentTypeParse).map(([key, value]) => ({
	key,
	label: value.label,
	icon: value.icon,
	color: value.color,
}));

export const merchantIdentityDocumentTypeOptions = Object.entries(merchantIdentityDocumentTypeParse).map(
	([key, value]) => ({ key, label: value.label, icon: value.icon, color: value.color })
);

export const merchantOperationTypeOptions = Object.entries(merchantOperationTypeParse).map(([key, value]) => ({
	key,
	label: value.label,
	icon: value.icon,
	color: value.color,
	className: value.className,
}));

export const apiEnvironmentTypeOptions = Object.entries(merchantApiCredentialEnvironmentParse).map(([key, value]) => ({
	value: key as MerchantApiCredentialEnvironment,
	label: value.label,
	icon: value.icon,
	color: value.color,
}));

export const merchantAcquirerChangeActionParse: Record<MerchantAcquirerChangeAction, TParse> = {
	InitialAssignment: {
		label: 'Atribuição Inicial',
		color: 'success',
		description: 'Primeira adquirente vinculada ao merchant.',
		icon: <Icon icon={Link01Icon} className="icon-sm" />,
	},
	DefaultChanged: {
		label: 'Alteração de Padrão',
		color: 'accent',
		description: 'Adquirente padrão foi alterada.',
		icon: <Icon icon={ArrowRight01Icon} className="icon-sm" />,
	},
	AcquirerAdded: {
		label: 'Adquirente Adicionada',
		color: 'success',
		description: 'Nova adquirente adicionada.',
		icon: <Icon icon={Link01Icon} className="icon-sm" />,
	},
	AcquirerDeactivated: {
		label: 'Adquirente Desativada',
		color: 'warning',
		description: 'Adquirente foi desativada.',
		icon: <Icon icon={RemoveIcon} className="icon-sm" />,
	},
	AcquirerReactivated: {
		label: 'Adquirente Reativada',
		color: 'success',
		description: 'Adquirente foi reativada.',
		icon: <Icon icon={RefreshIcon} className="icon-sm" />,
	},
	AcquirerRemoved: {
		label: 'Adquirente Removida',
		color: 'danger',
		description: 'Adquirente foi removida.',
		icon: <Icon icon={Delete02Icon} className="icon-sm" />,
	},
	LegacyMigration: {
		label: 'Migração Legada',
		color: 'default',
		description: 'Registro migrado de dados existentes.',
		icon: <Icon icon={DatabaseIcon} className="icon-sm" />,
	},
};

export const merchantSettingsChangeCategoryParse: Record<MerchantSettingsChangeCategory, TParse> = {
	PixFees: {
		label: 'Taxas PIX',
		color: 'accent',
		description: 'Alteração nas taxas de PIX.',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	BoletoFees: {
		label: 'Taxas Boleto',
		color: 'accent',
		description: 'Alteração nas taxas de boleto.',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	WithdrawalFees: {
		label: 'Taxas de Saque',
		color: 'accent',
		description: 'Alteração nas taxas de saque.',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	PixLimits: {
		label: 'Limites PIX',
		color: 'warning',
		description: 'Alteração nos limites de transação PIX.',
		icon: <Icon icon={ShieldCheck} className="icon-sm" />,
	},
	WithdrawalLimits: {
		label: 'Limites de Saque',
		color: 'warning',
		description: 'Alteração nos limites de saque.',
		icon: <Icon icon={ShieldCheck} className="icon-sm" />,
	},
	WithdrawalApprovalMode: {
		label: 'Modo de Aprovação',
		color: 'secondary',
		description: 'Alteração no modo de aprovação de saques.',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	AutomaticCashout: {
		label: 'Saque Automatizado',
		color: 'secondary',
		description: 'Alteração nas configurações de saque automatizado.',
		icon: <Icon icon={Clock01Icon} className="icon-sm" />,
	},
	RateLimits: {
		label: 'Rate Limiting',
		color: 'secondary',
		description: 'Alteração nos limites de requisições.',
		icon: <Icon icon={Analytics01Icon} className="icon-sm" />,
	},
	General: {
		label: 'Geral',
		color: 'default',
		description: 'Alteração geral nas configurações.',
		icon: <Icon icon={Settings01Icon} className="icon-sm" />,
	},
	InitialSetup: {
		label: 'Configuração Inicial',
		color: 'success',
		description: 'Configurações iniciais do merchant.',
		icon: <Icon icon={Clock01Icon} className="icon-sm" />,
	},
	LegacyMigration: {
		label: 'Migração Legada',
		color: 'default',
		description: 'Registro migrado de dados existentes.',
		icon: <Icon icon={DatabaseIcon} className="icon-sm" />,
	},
};

