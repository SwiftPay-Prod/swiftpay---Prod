import type { ChartConfig } from '@/components/ui/chart';

export const CHART_COLORS = {
	accent: 'var(--accent)',
	success: 'var(--success)',
	warning: 'var(--warning)',
	danger: 'var(--danger)',
	default: 'var(--default-500)',
};

export const volumeChartConfig = {
	volume: {
		label: 'TPV',
		color: CHART_COLORS.accent,
	},
	fees: {
		label: 'Taxas',
		color: CHART_COLORS.success,
	},
} satisfies ChartConfig;

export const registrationChartConfig = {
	newUsers: {
		label: 'Usuários',
		color: CHART_COLORS.accent,
	},
	newMerchants: {
		label: 'Organizações',
		color: CHART_COLORS.success,
	},
} satisfies ChartConfig;

export const merchantStatusChartConfig = {
	active: {
		label: 'Ativos',
		color: CHART_COLORS.success,
	},
	pending: {
		label: 'Pendentes',
		color: CHART_COLORS.warning,
	},
	draft: {
		label: 'Rascunho',
		color: CHART_COLORS.default,
	},
	suspended: {
		label: 'Suspensos',
		color: CHART_COLORS.danger,
	},
} satisfies ChartConfig;

export const revenueEvolutionChartConfig = {
	volume: {
		label: 'TPV',
		color: CHART_COLORS.accent,
	},
	transactions: {
		label: 'Transações',
		color: CHART_COLORS.warning,
	},
} satisfies ChartConfig;

export const volumeVsProfitChartConfig = {
	volume: {
		label: 'TPV',
		color: CHART_COLORS.accent,
	},
	netProfit: {
		label: 'Resultado Líquido',
		color: CHART_COLORS.success,
	},
} satisfies ChartConfig;

export const conversionRateChartConfig = {
	completed: {
		label: 'Aprovadas',
		color: CHART_COLORS.success,
	},
	rate: {
		label: 'Taxa (%)',
		color: CHART_COLORS.accent,
	},
} satisfies ChartConfig;

export const ticketMedioChartConfig = {
	volume: {
		label: 'TPV',
		color: CHART_COLORS.accent,
	},
	ticketMedio: {
		label: 'Ticket Médio',
		color: CHART_COLORS.warning,
	},
} satisfies ChartConfig;

export const marginChartConfig = {
	netProfit: {
		label: 'Resultado Líquido',
		color: CHART_COLORS.success,
	},
	margin: {
		label: 'Margem (%)',
		color: CHART_COLORS.accent,
	},
} satisfies ChartConfig;

export const growthChartConfig = {
	newUsers: {
		label: 'Novos Usuários',
		color: CHART_COLORS.accent,
	},
	newMerchants: {
		label: 'Novas Orgs',
		color: CHART_COLORS.success,
	},
	ratio: {
		label: 'Razão User/Org',
		color: CHART_COLORS.warning,
	},
} satisfies ChartConfig;

export const cumulativeVolumeChartConfig = {
	volume: {
		label: 'TPV Diário',
		color: CHART_COLORS.accent,
	},
	cumulative: {
		label: 'Acumulado',
		color: CHART_COLORS.success,
	},
} satisfies ChartConfig;

export const transactionFailuresChartConfig = {
	total: {
		label: 'Total',
		color: CHART_COLORS.accent,
	},
	failed: {
		label: 'Com Falha',
		color: CHART_COLORS.danger,
	},
	failureRate: {
		label: 'Taxa Falha (%)',
		color: CHART_COLORS.warning,
	},
} satisfies ChartConfig;

export const churnChartConfig = {
	suspended: {
		label: 'Suspensos',
		color: CHART_COLORS.danger,
	},
	inactive: {
		label: 'Inativos',
		color: CHART_COLORS.warning,
	},
	rejected: {
		label: 'Rejeitados',
		color: CHART_COLORS.default,
	},
} satisfies ChartConfig;

