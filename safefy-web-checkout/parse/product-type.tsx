import type { ProductType } from '@/types/enums';
import type { TParse } from './types';
import { Icon } from '@/components/icon';
import { DownloadCircle01Icon, PackageIcon, Settings02Icon } from '@hugeicons/core-free-icons';

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