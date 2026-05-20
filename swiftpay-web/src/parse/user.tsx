import { 
  UserRole, 
  UserStatus
} from '@/types/enums';
import type { TParse } from './types';
import { Icon } from '@/components/ui/icon';
import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	HeadphonesIcon,
	Shield01Icon,
	SourceCodeIcon,
	UserBlock01Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';

export const userRoleParse: Record<NonNullable<UserRole>, TParse> = {
  God: {
    label: 'Desenvolvedor',
    color: 'warning',
    description: 'Desenvolvedor',
    icon: <Icon icon={SourceCodeIcon} className="icon-sm" />,
  },
  Admin: {
    label: 'Administrador',
    color: 'accent',
    description: 'Gerencia organizações e configurações',
    icon: <Icon icon={Shield01Icon} className="icon-sm" />,
  },
  Merchant: {
    label: 'Organização',
    color: 'success',
    description: 'Usuário de organização',
    icon: <Icon icon={UserGroupIcon} className="icon-sm" />,
  },
  Support: {
    label: 'Suporte',
    color: 'secondary',
    description: 'Atendimento ao cliente',
    icon: <Icon icon={HeadphonesIcon} className="icon-sm" />,
  },
};

export const userStatusParse: Record<NonNullable<UserStatus>, TParse> = {
  Active: {
    label: 'Ativo',
    color: 'success',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  Inactive: {
    label: 'Inativo',
    color: 'danger',
    icon: <Icon icon={UserBlock01Icon} className="icon-sm" />,
  },
  Suspended: {
    label: 'Suspenso',
    color: 'warning',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

export const emailVerifiedParse: Record<'verified' | 'pending', TParse> = {
  verified: {
    label: 'Verificado',
    color: 'success',
    icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
  },
  pending: {
    label: 'Não verificado',
    color: 'danger',
    icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
  },
};

