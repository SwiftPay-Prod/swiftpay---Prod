import { Icon } from '@/components/ui/icon';
import {
	FileCloudIcon,
	Mail01Icon,
	PackageReceiveIcon,
	PackageIcon,
	ShoppingCartCheck01Icon,
	UserAdd01Icon,
} from '@hugeicons/core-free-icons';
import type { TParse } from './types';
import type { MerchantEmailTemplateType } from '@/types/enums';

export const merchantEmailTemplateTypeParse: Record<MerchantEmailTemplateType, TParse> = {
	PaymentConfirmation: {
		label: 'Confirmação de Pagamento',
		color: 'success',
		description: 'Template enviado quando um pagamento é confirmado',
		icon: <Icon icon={ShoppingCartCheck01Icon} className="icon-sm" />,
	},
	DigitalDelivery: {
		label: 'Entrega Digital',
		color: 'accent',
		description: 'Template enviado quando um produto digital é vendido',
		icon: <Icon icon={FileCloudIcon} className="icon-sm" />,
	},
	OrderShipped: {
		label: 'Pedido Enviado',
		color: 'warning',
		description: 'Template enviado quando um pedido é despachado',
		icon: <Icon icon={PackageIcon} className="icon-sm" />,
	},
	OrderDelivered: {
		label: 'Pedido Entregue',
		color: 'success',
		description: 'Template enviado quando um pedido é entregue',
		icon: <Icon icon={PackageReceiveIcon} className="icon-sm" />,
	},
	Welcome: {
		label: 'Boas-vindas',
		color: 'accent',
		description: 'Template enviado para novos clientes',
		icon: <Icon icon={UserAdd01Icon} className="icon-sm" />,
	},
	AbandonedCart: {
		label: 'Carrinho Abandonado',
		color: 'warning',
		description: 'Template enviado para recuperar vendas de carrinhos abandonados',
		icon: <Icon icon={Mail01Icon} className="icon-sm" />,
	},
};

