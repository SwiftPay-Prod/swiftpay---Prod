import type { ChipVariants } from '@heroui/react';
import { UserRole, MerchantStatus, MerchantKycStatus } from '@/types/enums';

export enum RouteType {
  Public = 'Public',
  Private = 'Private',
  Open = 'Open',
}

export type IconName =
  | 'Widget'
  | 'ChartSquare'
  | 'WalletMoney'
  | 'UsersGroupTwoRounded'
  | 'Settings'
  | 'Key'
  | 'Bell'
  | 'DocumentText'
  | 'MoneyBag'
  | 'Card'
  | 'Banknote'
  | 'QrCode'
  | 'QuestionCircle'
  | 'InfoCircle'
  | 'Shield'
  | 'Buildings'
  | 'Server'
  | 'ClipboardText'
  | 'GraphNewUp'
  | 'CodeSquare'
  | 'BoxMinimalistic'
  | 'Coupon'
  | 'ShoppingBasket01Icon'
  | 'WidgetAdd'
  | 'ShippingTruck01Icon'
  | 'ShoppingCartCheck01Icon'
  | 'History'
  | 'DigitalProduct'
  | 'Service'
  | 'EmailTemplate'
  | 'News01Icon'
  | 'FeesAndLimits'
  | 'Target02Icon'
  | 'ChampionIcon'
  | 'PuzzleIcon'
  | 'StarAward02Icon'
  | 'MoneyReceiveSquare'
  | 'Reconciliations'
  | 'Link02Icon';

export interface RouteAccess {
  roles?: UserRole[];
  requiresMerchant?: boolean;
  merchantStatus?: MerchantStatus[];
  merchantKycStatus?: MerchantKycStatus[];
  requiresEmailVerified?: boolean;
}

export type SidebarItemEffect =
  | 'gold-reflection'
  | 'soft-shimmer'
  | 'gentle-pulse'
  | 'underline-sweep'
  | 'top-glint'
  | 'aurora-wash'
  | 'border-flow'
  | 'corner-glow'
  | 'diagonal-sheen'
  | 'halo-breathe'
  | 'mist-pass'
  | 'prism-glow'
  | 'satin-wave'
  | 'soft-neon'
  | 'sparkle-drift';

export interface RouteConfig {
  path: string;
  title: string;
  type: RouteType;
  access?: RouteAccess;
  redirectTo?: string;
  iconName?: IconName;
  menuSection?: string;
  menuOrder?: number;
  badgeText?: string;
  badgeColor?: ChipVariants['color'];
  isExternal?: boolean;
  isDisabled?: boolean;
  showInMenu?: boolean;
  sidebarEffect?: SidebarItemEffect;
}

export interface MenuSection {
  title: string;
  items: RouteConfig[];
}

export interface RouteContext {
  isAuthenticated: boolean;
  emailVerified: boolean;
  userRole: UserRole;
  hasMerchant: boolean;
  merchantStatus?: MerchantStatus;
  merchantKycStatus?: MerchantKycStatus;
}

export interface RouteValidationResult {
  allowed: boolean;
  redirectTo?: string;
}

