import type { DashboardPeriod } from '@/types/merchant/dashboard';

export const DASHBOARD_PERIOD_STORAGE_KEY = 'swiftpay_dashboard_period';
export const DASHBOARD_CUSTOM_START_STORAGE_KEY = 'swiftpay_dashboard_custom_start';
export const DASHBOARD_CUSTOM_END_STORAGE_KEY = 'swiftpay_dashboard_custom_end';

export const DASHBOARD_PERIOD_OPTIONS: { key: DashboardPeriod; label: string }[] = [
	{ key: 'today', label: 'Hoje' },
	{ key: 'yesterday', label: 'Ontem' },
	{ key: '7d', label: 'Últimos 7 dias' },
	{ key: '14d', label: 'Últimos 14 dias' },
	{ key: '30d', label: 'Últimos 30 dias' },
	{ key: '90d', label: 'Últimos 90 dias' },
	{ key: 'this_week', label: 'Esta semana' },
	{ key: 'this_month', label: 'Este mês' },
	{ key: 'all', label: 'Todo o período' },
	{ key: 'custom', label: 'Período personalizado' },
];
