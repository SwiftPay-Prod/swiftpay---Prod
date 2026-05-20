import { CustomerStatus, CustomerDocumentType } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import { Building01Icon, CancelCircleIcon, CheckmarkCircle02Icon, File01Icon } from '@hugeicons/core-free-icons';

export const customerStatusParse: Record<NonNullable<CustomerStatus>, TParse> = {
	Active: {
		label: 'Ativo',
		color: 'success',
		description: 'Cliente ativo',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	Inactive: {
		label: 'Inativo',
		color: 'danger',
		description: 'Cliente inativo',
		icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
	},
};

export const customerDocumentTypeParse: Record<NonNullable<CustomerDocumentType>, TParse> = {
	CPF: {
		label: 'CPF',
		color: 'default',
		description: 'Pessoa Física',
		icon: <Icon icon={File01Icon} className="icon-sm" />,
	},
	CNPJ: {
		label: 'CNPJ',
		color: 'default',
		description: 'Pessoa Jurídica',
		icon: <Icon icon={Building01Icon} className="icon-sm" />,
	},
};

