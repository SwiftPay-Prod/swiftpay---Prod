import { CouponStatus, CouponDiscountType } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PercentCircleIcon,
  MoneyBag02Icon,
} from '@hugeicons/core-free-icons';

export const couponStatusParse: Record<CouponStatus, TParse> = {
  Active: {
    label: 'Ativo',
    color: 'success',
    description: 'Cupom disponível para uso',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Inactive: {
    label: 'Inativo',
    color: 'default',
    description: 'Cupom desativado',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
  Expired: {
    label: 'Expirado',
    color: 'warning',
    description: 'Cupom expirou',
    icon: <Icon icon={Clock01Icon} className="icon-sm" />,
  },
};

export const couponDiscountTypeParse: Record<CouponDiscountType, TParse> = {
  Percentage: {
    label: 'Percentual',
    color: 'accent',
    description: 'Desconto em porcentagem',
    icon: <Icon icon={PercentCircleIcon} className="icon-sm" />,
  },
  FixedAmount: {
    label: 'Valor fixo',
    color: 'success',
    description: 'Desconto em valor fixo',
    icon: <Icon icon={MoneyBag02Icon} className="icon-sm" />,
  },
};

export const couponStatusOptions = Object.entries(couponStatusParse).map(([key, value]) => ({
  value: key as CouponStatus,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

export const couponDiscountTypeOptions = Object.entries(couponDiscountTypeParse).map(([key, value]) => ({
  value: key as CouponDiscountType,
  label: value.label,
  icon: value.icon,
  color: value.color,
  description: value.description,
}));

