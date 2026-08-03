import {
  OrderStatus,
  OrderFulfillmentStatus,
} from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  HourglassIcon,
  ArrowReloadHorizontalIcon,
  UndoIcon,
  Package01Icon,
  DeliveryBox01Icon,
  DeliveryTruck01Icon,
  CheckmarkBadge01Icon,
  ShoppingCart01Icon,
  TimeQuarterPassIcon,
} from '@hugeicons/core-free-icons';

export const orderStatusParse: Record<OrderStatus, TParse> = {
  Reserved: {
    label: 'Reservado',
    color: 'default',
    description: 'Carrinho criado, aguardando pagamento',
    icon: <Icon icon={ShoppingCart01Icon} className="icon-sm" />,
  },
  Pending: {
    label: 'Pendente',
    color: 'warning',
    description: 'Pedido aguardando pagamento',
    icon: <Icon icon={HourglassIcon} className="icon-sm" />,
  },
  Confirmed: {
    label: 'Confirmado',
    color: 'accent',
    description: 'Pagamento confirmado',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Processing: {
    label: 'Processando',
    color: 'accent',
    description: 'Pedido em processamento',
    icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />,
  },
  Completed: {
    label: 'Concluído',
    color: 'success',
    description: 'Pedido finalizado',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Cancelled: {
    label: 'Cancelado',
    color: 'default',
    description: 'Pedido cancelado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Refunded: {
    label: 'Reembolsado',
    color: 'secondary',
    description: 'Pedido reembolsado',
    icon: <Icon icon={UndoIcon} className="icon-sm" />,
  },
  Expired: {
    label: 'Expirado',
    color: 'danger',
    description: 'Reserva expirou',
    icon: <Icon icon={TimeQuarterPassIcon} className="icon-sm" />,
  },
};

export const orderFulfillmentStatusParse: Record<OrderFulfillmentStatus, TParse> = {
  Unfulfilled: {
    label: 'Não Preparado',
    color: 'default',
    description: 'Pedido não iniciado',
    icon: <Icon icon={Package01Icon} className="icon-sm" />,
  },
  PartiallyFulfilled: {
    label: 'Parcialmente Preparado',
    color: 'warning',
    description: 'Pedido parcialmente preparado',
    icon: <Icon icon={DeliveryBox01Icon} className="icon-sm" />,
  },
  Fulfilled: {
    label: 'Preparado',
    color: 'accent',
    description: 'Pedido pronto para envio',
    icon: <Icon icon={DeliveryBox01Icon} className="icon-sm" />,
  },
  Shipped: {
    label: 'Enviado',
    color: 'accent',
    description: 'Pedido em trânsito',
    icon: <Icon icon={DeliveryTruck01Icon} className="icon-sm" />,
  },
  Delivered: {
    label: 'Entregue',
    color: 'success',
    description: 'Pedido entregue ao cliente',
    icon: <Icon icon={CheckmarkBadge01Icon} className="icon-sm" />,
  },
};

export const orderStatusOptions = Object.entries(orderStatusParse).map(
  ([key, value]) => ({
    value: key as OrderStatus,
    label: value.label,
    icon: value.icon,
    color: value.color,
    description: value.description,
  })
);

export const orderFulfillmentStatusOptions = Object.entries(orderFulfillmentStatusParse).map(
  ([key, value]) => ({
    value: key as OrderFulfillmentStatus,
    label: value.label,
    icon: value.icon,
    color: value.color,
    description: value.description,
  })
);

