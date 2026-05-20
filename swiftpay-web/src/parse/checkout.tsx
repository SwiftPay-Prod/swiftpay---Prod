import { CheckoutStatus, CheckoutTemplateType } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
  Archive01Icon,
  Calendar03Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Dollar02Icon,
  File01Icon,
  GiftIcon,
  LayersIcon,
  PauseIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';

export const templateFreeParse: Record<'free' | 'paid', TParse> = {
  free: {
    label: 'Gratuito',
    color: 'success',
    description: 'Template gratuito',
    icon: <Icon icon={GiftIcon} className="icon-sm" />,
  },
  paid: {
    label: 'Pago',
    color: 'warning',
    description: 'Template com taxa por transação',
    icon: <Icon icon={Dollar02Icon} className="icon-sm" />,
  },
};

export const templateActiveStatusParse: Record<'active' | 'inactive', TParse> = {
  active: {
    label: 'Ativo',
    color: 'success',
    description: 'Template ativo e disponível',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  inactive: {
    label: 'Inativo',
    color: 'default',
    description: 'Template inativo, não disponível para seleção',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const templateFreeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Gratuitos' },
  { value: 'false', label: 'Pagos' },
];

export const templateActiveStatusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
];

export const checkoutStatusParse: Record<CheckoutStatus, TParse> = {
  Draft: {
    label: 'Rascunho',
    color: 'default',
    description: 'Checkout em rascunho, ainda não publicado',
    icon: <Icon icon={File01Icon} className="icon-sm" />,
  },
  Active: {
    label: 'Ativo',
    color: 'success',
    description: 'Checkout ativo e acessível',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Paused: {
    label: 'Pausado',
    color: 'warning',
    description: 'Checkout pausado temporariamente',
    icon: <Icon icon={PauseIcon} className="icon-sm" />,
  },
  Archived: {
    label: 'Arquivado',
    color: 'default',
    description: 'Checkout arquivado, não pode mais ser usado',
    icon: <Icon icon={Archive01Icon} className="icon-sm" />,
  },
  Expired: {
    label: 'Expirado',
    color: 'danger',
    description: 'Checkout expirado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const checkoutTemplateTypeParse: Record<CheckoutTemplateType, TParse> = {
  SingleOrder: {
    label: 'Pedido Único',
    color: 'accent',
    description: 'Link único com produtos pré-definidos, expira após um tempo',
    icon: <Icon icon={Calendar03Icon} className="icon-sm" />,
  },
  Catalog: {
    label: 'Catálogo',
    color: 'success',
    description: 'Link fixo com catálogo de produtos, como uma mini loja',
    icon: <Icon icon={LayersIcon} className="icon-sm" />,
  },
  Transparent: {
    label: 'Transparente',
    color: 'warning',
    description: 'Checkout via API (em breve)',
    icon: <Icon icon={Settings02Icon} className="icon-sm" />,
  },
};

export const checkoutStatusOptions = Object.entries(checkoutStatusParse).map(([key, value]) => ({
  value: key as CheckoutStatus,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const checkoutTemplateTypeOptions = Object.entries(checkoutTemplateTypeParse).map(([key, value]) => ({
  value: key as CheckoutTemplateType,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

