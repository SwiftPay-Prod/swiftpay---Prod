import { Icon } from '@/components/icon';
import {
	CreditCardIcon,
	Invoice01Icon,
	QrCodeIcon,
	DownloadCircle01Icon,
	PackageIcon,
	CheckmarkCircle02Icon,
	Loading01Icon,
	Cancel01Icon,
	Time01Icon,
	UnavailableIcon,
	RefreshIcon,
	HelpCircleIcon,
} from '@hugeicons/core-free-icons';
import type { ReactNode } from 'react';
import type {
	PaymentMethod,
	ProductType,
	PaymentStatus,
	PixKeyType,
} from '@/types/enums';
import {
	paymentMethodParse as basePaymentMethodParse,
	paymentStatusParse as basePaymentStatusParse,
	productTypeParse as baseProductTypeParse,
	pixKeyTypeParse as basePixKeyTypeParse,
	type TParse,
} from '@/parse';

/**
 * Extended parse type with icon (template-specific)
 */
interface TParseWithIcon extends TParse {
	icon?: ReactNode;
	className?: string;
}

/**
 * Payment Method Parse with icons (Hero Pro specific)
 */
export const paymentMethodParse: Record<PaymentMethod, TParseWithIcon> = {
	Pix: {
		...basePaymentMethodParse.Pix,
		icon: <Icon icon={QrCodeIcon} className="icon-md" />,
	},
	CreditCard: {
		...basePaymentMethodParse.CreditCard,
		icon: <Icon icon={CreditCardIcon} className="icon-md" />,
	},
	Boleto: {
		...basePaymentMethodParse.Boleto,
		icon: <Icon icon={Invoice01Icon} className="icon-md" />,
	},
};

/**
 * Product Type Parse with icons and styles (Hero Pro specific)
 * Colors aligned with swiftpay-web:
 * - Physical: accent (blue)
 * - Digital: success (green)
 * - Service: warning (yellow/amber)
 */
export const productTypeParse: Record<ProductType, TParseWithIcon> = {
	Physical: {
		...baseProductTypeParse.Physical,
		icon: <Icon icon={PackageIcon} className="icon-xs" />,
		className: 'hero-badge-physical',
	},
	Digital: {
		...baseProductTypeParse.Digital,
		icon: <Icon icon={DownloadCircle01Icon} className="icon-xs" />,
		className: 'hero-badge-digital',
	},
	Service: {
		...baseProductTypeParse.Service,
		icon: <Icon icon={HelpCircleIcon} className="icon-xs" />,
		className: 'hero-badge-service',
	},
};

/**
 * Payment Status Parse with icons (Hero Pro specific)
 */
export const paymentStatusParse: Record<PaymentStatus, TParseWithIcon> = {
	Pending: {
		...basePaymentStatusParse.Pending,
		icon: <Icon icon={Time01Icon} className="icon-md" />,
	},
	Processing: {
		...basePaymentStatusParse.Processing,
		icon: <Icon icon={Loading01Icon} className="icon-md animate-spin" />,
	},
	Confirming: {
		...basePaymentStatusParse.Confirming,
		icon: <Icon icon={Loading01Icon} className="icon-md animate-spin" />,
	},
	Completed: {
		...basePaymentStatusParse.Completed,
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-md" />,
	},
	Cancelled: {
		...basePaymentStatusParse.Cancelled,
		icon: <Icon icon={Cancel01Icon} className="icon-md" />,
	},
	Expired: {
		...basePaymentStatusParse.Expired,
		icon: <Icon icon={UnavailableIcon} className="icon-md" />,
	},
	Failed: {
		...basePaymentStatusParse.Failed,
		icon: <Icon icon={Cancel01Icon} className="icon-md" />,
	},
	Refunded: {
		...basePaymentStatusParse.Refunded,
		icon: <Icon icon={RefreshIcon} className="icon-md" />,
	},
	PartiallyRefunded: {
		...basePaymentStatusParse.PartiallyRefunded,
		icon: <Icon icon={RefreshIcon} className="icon-md" />,
	},
};

/**
 * PIX Key Type Parse (Hero Pro specific)
 */
export const pixKeyTypeParse: Record<PixKeyType, Omit<TParseWithIcon, 'icon'>> = {
	...basePixKeyTypeParse,
};

// Re-export formatters from shared utils
export { formatCurrency, generateInstallmentOptions } from '@/utils';

