import { Icon } from '@/components/ui/icon';
import {
	TextFontIcon,
	Cursor02Icon,
	Image01Icon,
	ImageCompositionIcon,
	PackageIcon,
	FileCloudIcon,
	DeliveryTruck02Icon,
	MinusSignIcon,
	SquareIcon,
	FootballIcon,
	ViewIcon,
	Invoice01Icon,
	LayoutTopIcon,
} from '@hugeicons/core-free-icons';
import type { ReactNode } from 'react';
import { EmailBlockType } from '@/types/enums';

interface EmailBlockParse {
	label: string;
	description: string;
	icon: ReactNode;
	category: 'content' | 'layout' | 'dynamic';
}

export const emailBlockTypeParse: Record<EmailBlockType, EmailBlockParse> = {
	[EmailBlockType.Header]: {
		label: 'Cabeçalho',
		description: 'Logo e título do email',
		icon: <Icon icon={LayoutTopIcon} className="icon-sm" />,
		category: 'layout',
	},
	[EmailBlockType.Text]: {
		label: 'Texto',
		description: 'Bloco de texto editável',
		icon: <Icon icon={TextFontIcon} className="icon-sm" />,
		category: 'content',
	},
	[EmailBlockType.Button]: {
		label: 'Botão',
		description: 'Botão com link',
		icon: <Icon icon={Cursor02Icon} className="icon-sm" />,
		category: 'content',
	},
	[EmailBlockType.Image]: {
		label: 'Imagem',
		description: 'Imagem personalizada',
		icon: <Icon icon={Image01Icon} className="icon-sm" />,
		category: 'content',
	},
	[EmailBlockType.Banner]: {
		label: 'Banner',
		description: 'Imagem de largura total',
		icon: <Icon icon={ImageCompositionIcon} className="icon-sm" />,
		category: 'content',
	},
	[EmailBlockType.ProductList]: {
		label: 'Produtos',
		description: 'Lista de produtos do pedido',
		icon: <Icon icon={PackageIcon} className="icon-sm" />,
		category: 'dynamic',
	},
	[EmailBlockType.DigitalItemsList]: {
		label: 'Itens Digitais',
		description: 'Lista de itens digitais entregues',
		icon: <Icon icon={FileCloudIcon} className="icon-sm" />,
		category: 'dynamic',
	},
	[EmailBlockType.TrackingInfo]: {
		label: 'Rastreamento',
		description: 'Informações de rastreamento',
		icon: <Icon icon={DeliveryTruck02Icon} className="icon-sm" />,
		category: 'dynamic',
	},
	[EmailBlockType.Divider]: {
		label: 'Divisor',
		description: 'Linha horizontal divisória',
		icon: <Icon icon={MinusSignIcon} className="icon-sm" />,
		category: 'layout',
	},
	[EmailBlockType.Spacer]: {
		label: 'Espaçador',
		description: 'Espaço vertical',
		icon: <Icon icon={SquareIcon} className="icon-sm" />,
		category: 'layout',
	},
	[EmailBlockType.Footer]: {
		label: 'Rodapé',
		description: 'Texto de rodapé do email',
		icon: <Icon icon={FootballIcon} className="icon-sm" />,
		category: 'layout',
	},
	[EmailBlockType.Columns]: {
		label: 'Colunas',
		description: 'Layout de 2 ou 3 colunas',
		icon: <Icon icon={ViewIcon} className="icon-sm" />,
		category: 'layout',
	},
	[EmailBlockType.OrderSummary]: {
		label: 'Resumo do Pedido',
		description: 'Total, subtotal e descontos',
		icon: <Icon icon={Invoice01Icon} className="icon-sm" />,
		category: 'dynamic',
	},
};

export const emailBlockTypeOptions = Object.entries(emailBlockTypeParse).map(([value, parse]) => ({
	value: value as EmailBlockType,
	label: parse.label,
	description: parse.description,
	icon: parse.icon,
	category: parse.category,
}));

