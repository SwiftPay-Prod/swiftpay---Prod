import { NotificationType, NotificationPriority, NotificationStatusType, NotificationScope } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
	Alert01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	InformationCircleIcon,
	MoneyReceiveCircleIcon,
	Notification01Icon,
	RepeatOne01Icon,
	SecurityCheckIcon,
	Settings02Icon,
	Wallet01Icon,
	UserIcon,
	Building06Icon,
} from '@hugeicons/core-free-icons';

export const notificationScopeParse: Record<NotificationScope, TParse> = {
	Merchant: {
		label: 'Organização',
		color: 'accent',
		icon: <Icon icon={Building06Icon} className="icon-sm" />,
	},
	User: {
		label: 'Pessoal',
		color: 'secondary',
		icon: <Icon icon={UserIcon} className="icon-sm" />,
	},
};

export const notificationTypeParse: Record<NotificationType, TParse> = {
	Info: {
		label: 'Informação',
		color: 'accent',
		icon: <Icon icon={InformationCircleIcon} className="icon-sm" />,
	},
	Success: {
		label: 'Sucesso',
		color: 'success',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	Warning: {
		label: 'Aviso',
		color: 'warning',
		icon: <Icon icon={Alert01Icon} className="icon-sm" />,
	},
	Error: {
		label: 'Erro',
		color: 'danger',
		icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
	},
	Security: {
		label: 'Segurança',
		color: 'danger',
		icon: <Icon icon={SecurityCheckIcon} className="icon-sm" />,
	},
	Payment: {
		label: 'Pagamento',
		color: 'success',
		icon: <Icon icon={MoneyReceiveCircleIcon} className="icon-sm" />,
	},
	Payout: {
		label: 'Saque',
		color: 'accent',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	Chargeback: {
		label: 'Contestação',
		color: 'danger',
		icon: <Icon icon={RepeatOne01Icon} className="icon-sm" />,
	},
	System: {
		label: 'Sistema',
		color: 'default',
		icon: <Icon icon={Settings02Icon} className="icon-sm" />,
	},
};

export const notificationPriorityParse: Record<NotificationPriority, TParse> = {
	Low: {
		label: 'Baixa',
		color: 'default',
	},
	Normal: {
		label: 'Normal',
		color: 'accent',
	},
	High: {
		label: 'Alta',
		color: 'warning',
	},
	Urgent: {
		label: 'Urgente',
		color: 'danger',
		icon: <Icon icon={Notification01Icon} className="icon-sm" />,
	},
};

export const notificationStatusTypeParse: Record<NotificationStatusType, TParse> = {
	PaymentPending: {
		label: 'Pagamento Pendente',
		color: 'warning',
		icon: <Icon icon={MoneyReceiveCircleIcon} className="icon-sm" />,
	},
	PaymentCompleted: {
		label: 'Pagamento Recebido',
		color: 'success',
		icon: <Icon icon={MoneyReceiveCircleIcon} className="icon-sm" />,
	},
	PaymentExpired: {
		label: 'Pagamento Expirado',
		color: 'default',
		icon: <Icon icon={MoneyReceiveCircleIcon} className="icon-sm" />,
	},
	PaymentFailed: {
		label: 'Pagamento Falhou',
		color: 'danger',
		icon: <Icon icon={MoneyReceiveCircleIcon} className="icon-sm" />,
	},
	PaymentRefunded: {
		label: 'Pagamento Estornado',
		color: 'warning',
		icon: <Icon icon={RepeatOne01Icon} className="icon-sm" />,
	},
	PayoutPending: {
		label: 'Saque Pendente',
		color: 'warning',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	PayoutProcessing: {
		label: 'Saque Processando',
		color: 'accent',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	PayoutCompleted: {
		label: 'Saque Concluído',
		color: 'success',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	PayoutFailed: {
		label: 'Saque Falhou',
		color: 'danger',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	PayoutRejected: {
		label: 'Saque Rejeitado',
		color: 'danger',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
	PayoutCancelled: {
		label: 'Saque Cancelado',
		color: 'default',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
};

export type NotificationFilterKey = 'all' | 'read' | 'unread';

export const notificationFilterParse: Record<NotificationFilterKey, TParse> = {
	all: {
		label: 'Todas',
		color: 'default',
	},
	unread: {
		label: 'Não lidas',
		color: 'accent',
	},
	read: {
		label: 'Lidas',
		color: 'success',
	},
};

export const notificationFilterOptions = Object.entries(notificationFilterParse).map(
	([key, value]) => ({ key: key as NotificationFilterKey, label: value.label })
);

export type NotificationScopeFilterKey = 'all' | 'Merchant' | 'User';

export const notificationScopeFilterParse: Record<NotificationScopeFilterKey, TParse> = {
	all: {
		label: 'Todas',
		color: 'default',
		icon: <Icon icon={Notification01Icon} className="icon-sm" />,
	},
	Merchant: {
		label: 'Organização',
		color: 'accent',
		icon: <Icon icon={Building06Icon} className="icon-sm" />,
	},
	User: {
		label: 'Pessoal',
		color: 'secondary',
		icon: <Icon icon={UserIcon} className="icon-sm" />,
	},
};

