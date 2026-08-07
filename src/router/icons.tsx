'use client';

import { cloneElement, isValidElement, type ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';
import {
  Analytics02Icon,
  AnalyticsUpIcon,
  BankIcon,
  Building01Icon,
  CreditCardIcon,
  DashboardCircleIcon,
  File01Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  Key01Icon,
  Notification01Icon,
  PackageIcon,
  QrCodeIcon,
  ServerStack01Icon,
  Settings02Icon,
  Shield01Icon,
  SourceCodeSquareIcon,
  Task01Icon,
  Ticket02Icon,
  UserGroupIcon,
  Wallet01Icon,
  Wallet03Icon,
  ShoppingBasket01Icon,
  DashboardSquareAddIcon,
  ShippingTruck01Icon,
  ShoppingCartCheck01Icon,
  Clock04Icon,
  FileCloudIcon,
  Calendar01Icon,
  Mail01Icon,
  News01Icon,
  PercentSquareIcon,
  Target02Icon,
  ChampionIcon,
  PuzzleIcon,
  StarAward02Icon,
  MoneyReceiveSquareIcon,
  RepeatIcon,
  Link02Icon,
} from '@hugeicons/core-free-icons';
import type { IconName } from '@/types/router';

const ICON_MAP: Record<IconName, ReactNode> = {
  Widget: <Icon icon={DashboardCircleIcon} className="icon-md" />,
  ChartSquare: <Icon icon={Analytics02Icon} className="icon-md" />,
  WalletMoney: <Icon icon={Wallet01Icon} className="icon-md" />,
  UsersGroupTwoRounded: <Icon icon={UserGroupIcon} className="icon-md" />,
  Settings: <Icon icon={Settings02Icon} className="icon-md" />,
  Key: <Icon icon={Key01Icon} className="icon-md" />,
  Bell: <Icon icon={Notification01Icon} className="icon-md" />,
  DocumentText: <Icon icon={File01Icon} className="icon-md" />,
  MoneyBag: <Icon icon={Wallet03Icon} className="icon-md" />,
  Card: <Icon icon={CreditCardIcon} className="icon-md" />,
  Banknote: <Icon icon={BankIcon} className="icon-md" />,
  QrCode: <Icon icon={QrCodeIcon} className="icon-md" />,
  QuestionCircle: <Icon icon={HelpCircleIcon} className="icon-md" />,
  InfoCircle: <Icon icon={InformationCircleIcon} className="icon-md" />,
  Shield: <Icon icon={Shield01Icon} className="icon-md" />,
  Buildings: <Icon icon={Building01Icon} className="icon-md" />,
  Server: <Icon icon={ServerStack01Icon} className="icon-md" />,
  ClipboardText: <Icon icon={Task01Icon} className="icon-md" />,
  GraphNewUp: <Icon icon={AnalyticsUpIcon} className="icon-md" />,
  CodeSquare: <Icon icon={SourceCodeSquareIcon} className="icon-md" />,
  BoxMinimalistic: <Icon icon={PackageIcon} className="icon-md" />,
  Coupon: <Icon icon={Ticket02Icon} className="icon-md" />,
  ShoppingBasket01Icon: <Icon icon={ShoppingBasket01Icon} className="icon-md" />,
  WidgetAdd: <Icon icon={DashboardSquareAddIcon} className="icon-md" />,
  ShippingTruck01Icon: <Icon icon={ShippingTruck01Icon} className="icon-md" />,
  ShoppingCartCheck01Icon: <Icon icon={ShoppingCartCheck01Icon} className="icon-md" />,
  History: <Icon icon={Clock04Icon} className="icon-md" />,
  DigitalProduct: <Icon icon={FileCloudIcon} className="icon-md" />,
  Service: <Icon icon={Calendar01Icon} className="icon-md" />,
  EmailTemplate: <Icon icon={Mail01Icon} className="icon-md" />,
  News01Icon: <Icon icon={News01Icon} className="icon-md" />,
  FeesAndLimits: <Icon icon={PercentSquareIcon} className="icon-md" />,
  Target02Icon: <Icon icon={Target02Icon} className="icon-md" />,
  ChampionIcon: <Icon icon={ChampionIcon} className="icon-md" />,
  PuzzleIcon: <Icon icon={PuzzleIcon} className="icon-md" />,
  StarAward02Icon: <Icon icon={StarAward02Icon} className="icon-md" />,
  MoneyReceiveSquare: <Icon icon={MoneyReceiveSquareIcon} className="icon-md" />,
  Reconciliations: <Icon icon={RepeatIcon} className="icon-md" />,
  Link02Icon: <Icon icon={Link02Icon} className="icon-md" />,
};

export function getIcon(iconName?: IconName): ReactNode {
  if (!iconName) return null;
  return ICON_MAP[iconName] || null;
}

export function getIconWithSize(iconName: IconName | undefined, sizeClass: 'icon-xs' | 'icon-sm' | 'icon-md' | 'icon-lg' | 'icon-xl'): ReactNode {
  const iconNode = getIcon(iconName);
  if (!iconNode) return null;

  if (!isValidElement<{ className?: string }>(iconNode)) {
    return iconNode;
  }

  const currentClassName = iconNode.props.className ?? '';
  const cleanedClassName = currentClassName
    .split(' ')
    .filter((token) => !/^icon-(xs|sm|md|lg|xl)$/.test(token))
    .join(' ')
    .trim();

  const className = [cleanedClassName, sizeClass].filter(Boolean).join(' ');

  return cloneElement(iconNode, { className });
}

