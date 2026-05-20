import type { RankingPeriod, RankingType } from '@/types/ranking';

export const RANKING_TYPE_OPTIONS: { key: RankingType; label: string }[] = [
	{ key: 'Volume', label: 'Sellers' },
	{ key: 'Referral', label: 'Indique e ganhe' },
];

export const PERIOD_OPTIONS: { key: RankingPeriod; label: string }[] = [
	{ key: 'Weekly', label: 'Semanal' },
	{ key: 'Monthly', label: 'Mensal' },
	{ key: 'Annual', label: 'Anual' },
];

export const PERIOD_RULE_LABEL: Record<RankingPeriod, string> = {
	Weekly: 'Ciclo semanal: domingo 00:00 até sábado 23:59 (horário de Brasília).',
	Monthly: 'Ciclo mensal: do dia 1 às 00:00 até o último dia do mês às 23:59 (horário de Brasília).',
	Annual: 'Ciclo anual: de 1º de janeiro às 00:00 até 31 de dezembro às 23:59 (horário de Brasília).',
};

export const TYPE_DESCRIPTION_LABEL: Record<RankingType, string> = {
	Volume: 'Ranking por faturamento total no período selecionado.',
	Referral: 'Ranking único por total de indicados e comissão total acumulada.',
};
