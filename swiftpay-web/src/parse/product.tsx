import { ProductType, ProductStatus, CategoryStatus, VariantStatus, DigitalItemType, DigitalItemStatus, EmailTemplateLayout, StockMovementType, StockMovementReferenceType, ServiceLocationType } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
	Archive01Icon,
	ArrowUp01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	DownloadCircle01Icon,
	GridViewIcon,
	Key01Icon,
	Link01Icon,
	LockIcon,
	LockPasswordIcon,
	Location01Icon,
	Package03Icon,
	PackageIcon,
	PlusSignCircleIcon,
	RefreshIcon,
	RemoveCircleIcon,
	Settings02Icon,
	ShoppingCart01Icon,
	TextIcon,
	Tick01Icon,
	UserIcon,
	Video01Icon,
	ViewIcon,
} from '@hugeicons/core-free-icons';

export const productTypeParse: Record<ProductType, TParse> = {
  Physical: {
    label: 'Físico',
    color: 'accent',
    description: 'Produto físico com entrega',
    icon: <Icon icon={PackageIcon} className="icon-sm" />,
  },
  Digital: {
    label: 'Digital',
    color: 'success',
    description: 'Produto digital para download',
    icon: <Icon icon={DownloadCircle01Icon} className="icon-sm" />,
  },
  Service: {
    label: 'Serviço',
    color: 'warning',
    description: 'Prestação de serviço',
    icon: <Icon icon={Settings02Icon} className="icon-sm" />,
  },
};

export const productStatusParse: Record<ProductStatus, TParse> = {
  Active: {
    label: 'Ativo',
    color: 'success',
    description: 'Produto disponível para venda',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Inactive: {
    label: 'Inativo',
    color: 'danger',
    description: 'Produto não disponível para venda',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Archived: {
    label: 'Arquivado',
    color: 'warning',
    description: 'Produto arquivado',
    icon: <Icon icon={Archive01Icon} className="icon-sm" />,
  },
};

export const categoryStatusParse: Record<CategoryStatus, TParse> = {
  Active: {
    label: 'Ativa',
    color: 'success',
    description: 'Categoria ativa',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Inactive: {
    label: 'Inativa',
    color: 'default',
    description: 'Categoria inativa',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const variantStatusParse: Record<VariantStatus, TParse> = {
  Active: {
    label: 'Ativa',
    color: 'success',
    description: 'Variante disponível',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Inactive: {
    label: 'Inativa',
    color: 'default',
    description: 'Variante não disponível',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  OutOfStock: {
    label: 'Sem Estoque',
    color: 'danger',
    description: 'Variante sem estoque',
    icon: <Icon icon={PackageIcon} className="icon-sm" />,
  },
};

export const productTypeOptions = Object.entries(productTypeParse).map(([key, value]) => ({
  value: key as ProductType,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const productStatusOptions = Object.entries(productStatusParse).map(([key, value]) => ({
  value: key as ProductStatus,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const categoryStatusOptions = Object.entries(categoryStatusParse).map(([key, value]) => ({
  value: key as CategoryStatus,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const variantStatusOptions = Object.entries(variantStatusParse).map(([key, value]) => ({
  value: key as VariantStatus,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const digitalItemTypeParse: Record<DigitalItemType, TParse> = {
  Key: {
    label: 'Chave/Serial',
    color: 'accent',
    description: 'Chave de ativação ou serial',
    icon: <Icon icon={Key01Icon} className="icon-sm" />,
  },
  DownloadLink: {
    label: 'Link de Download',
    color: 'success',
    description: 'Link para download do arquivo',
    icon: <Icon icon={DownloadCircle01Icon} className="icon-sm" />,
  },
  AccessCode: {
    label: 'Código de Acesso',
    color: 'warning',
    description: 'Código para acessar conteúdo',
    icon: <Icon icon={LockPasswordIcon} className="icon-sm" />,
  },
  Text: {
    label: 'Texto',
    color: 'default',
    description: 'Conteúdo em texto',
    icon: <Icon icon={TextIcon} className="icon-sm" />,
  },
  ExternalLink: {
    label: 'Link Externo',
    color: 'secondary',
    description: 'Link para recurso externo',
    icon: <Icon icon={Link01Icon} className="icon-sm" />,
  },
};

export const digitalItemStatusParse: Record<DigitalItemStatus, TParse> = {
  Available: {
    label: 'Disponível',
    color: 'success',
    description: 'Pronto para venda',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Reserved: {
    label: 'Reservado',
    color: 'warning',
    description: 'Reservado para um pedido',
    icon: <Icon icon={ShoppingCart01Icon} className="icon-sm" />,
  },
  Delivered: {
    label: 'Entregue',
    color: 'accent',
    description: 'Já foi entregue ao cliente',
    icon: <Icon icon={Package03Icon} className="icon-sm" />,
  },
  Disabled: {
    label: 'Desabilitado',
    color: 'warning',
    description: 'Item desabilitado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const emailTemplateLayoutParse: Record<EmailTemplateLayout, TParse> = {
  List: {
    label: 'Lista',
    color: 'default',
    description: 'Exibe itens em formato de lista',
    icon: <Icon icon={ViewIcon} className="icon-sm" />,
  },
  Cards: {
    label: 'Cards',
    color: 'accent',
    description: 'Exibe itens em formato de cards',
    icon: <Icon icon={GridViewIcon} className="icon-sm" />,
  },
};

export const digitalItemTypeOptions = Object.entries(digitalItemTypeParse).map(([key, value]) => ({
  value: key as DigitalItemType,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const digitalItemStatusOptions = Object.entries(digitalItemStatusParse).map(([key, value]) => ({
  value: key as DigitalItemStatus,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const emailTemplateLayoutOptions = Object.entries(emailTemplateLayoutParse).map(([key, value]) => ({
  value: key as EmailTemplateLayout,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const stockMovementTypeParse: Record<StockMovementType, TParse> = {
  In: {
    label: 'Entrada',
    color: 'success',
    description: 'Entrada de estoque',
    icon: <Icon icon={PlusSignCircleIcon} className="icon-sm" />,
  },
  Out: {
    label: 'Saída',
    color: 'danger',
    description: 'Saída de estoque',
    icon: <Icon icon={RemoveCircleIcon} className="icon-sm" />,
  },
  Adjustment: {
    label: 'Ajuste',
    color: 'warning',
    description: 'Ajuste de estoque',
    icon: <Icon icon={RefreshIcon} className="icon-sm" />,
  },
  Reserved: {
    label: 'Reservado',
    color: 'accent',
    description: 'Estoque reservado para pedido',
    icon: <Icon icon={LockIcon} className="icon-sm" />,
  },
  Released: {
    label: 'Liberado',
    color: 'secondary',
    description: 'Estoque liberado de reserva',
    icon: <Icon icon={ArrowUp01Icon} className="icon-sm" />,
  },
  Confirmed: {
    label: 'Confirmado',
    color: 'success',
    description: 'Estoque confirmado',
    icon: <Icon icon={Tick01Icon} className="icon-sm" />,
  },
};

export const stockMovementReferenceTypeParse: Record<StockMovementReferenceType, TParse> = {
  Order: {
    label: 'Pedido',
    color: 'accent',
    description: 'Movimento de pedido',
    icon: <Icon icon={ShoppingCart01Icon} className="icon-sm" />,
  },
  Manual: {
    label: 'Manual',
    color: 'default',
    description: 'Ajuste manual',
    icon: <Icon icon={UserIcon} className="icon-sm" />,
  },
  Expiration: {
    label: 'Expiração',
    color: 'warning',
    description: 'Expiração de reserva',
    icon: <Icon icon={Clock01Icon} className="icon-sm" />,
  },
};

export const stockMovementTypeOptions = Object.entries(stockMovementTypeParse).map(([key, value]) => ({
  value: key as StockMovementType,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const serviceLocationTypeParse: Record<ServiceLocationType, TParse> = {
  Online: {
    label: 'Online',
    color: 'accent',
    description: 'Serviço prestado online (videochamada, etc)',
    icon: <Icon icon={Video01Icon} className="icon-sm" />,
  },
  InPerson: {
    label: 'Presencial',
    color: 'success',
    description: 'Serviço prestado presencialmente',
    icon: <Icon icon={Location01Icon} className="icon-sm" />,
  },
  Both: {
    label: 'Ambos',
    color: 'warning',
    description: 'Serviço pode ser online ou presencial',
    icon: <Icon icon={RefreshIcon} className="icon-sm" />,
  },
};

export const serviceLocationTypeOptions = Object.entries(serviceLocationTypeParse).map(([key, value]) => ({
  value: key as ServiceLocationType,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

