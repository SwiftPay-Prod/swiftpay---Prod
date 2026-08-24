'use client';

import { useState } from 'react';

export type DashboardLayoutId = 'standard' | 'focus-charts' | 'focus-kpis' | 'compact';

export interface DashboardLayoutOption {
	id: DashboardLayoutId;
	label: string;
	description: string;
}

export const DASHBOARD_LAYOUT_OPTIONS: DashboardLayoutOption[] = [
	{ id: 'standard', label: 'Padrão', description: 'Evolução no topo, KPIs e gráficos abaixo' },
	{ id: 'focus-charts', label: 'Gráficos', description: 'Gráficos lado a lado no topo, KPIs abaixo' },
	{ id: 'focus-kpis', label: 'KPIs', description: 'Indicadores em destaque, gráficos ao fim' },
	{ id: 'compact', label: 'Compacto', description: 'Evolução e gauge lado a lado, máxima densidade' },
];

const STORAGE_KEY = 'swiftpay_dashboard_layout';

export function useDashboardLayout() {
	const [layout, setLayout] = useState<DashboardLayoutId>(() => {
		if (typeof window === 'undefined') return 'standard';
		const saved = localStorage.getItem(STORAGE_KEY) as DashboardLayoutId | null;
		if (saved && DASHBOARD_LAYOUT_OPTIONS.some((o) => o.id === saved)) {
			return saved;
		}
		return 'standard';
	});

	function changeLayout(next: DashboardLayoutId) {
		setLayout(next);
		localStorage.setItem(STORAGE_KEY, next);
	}

	return { layout, changeLayout };
}
