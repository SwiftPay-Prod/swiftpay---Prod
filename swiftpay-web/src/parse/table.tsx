import type { TParse, FilterOption } from './types';

export type PageSizeKey = '10' | '20' | '30' | '40' | '50';

export const pageSizeParse: Record<PageSizeKey, TParse> = {
	'10': {
		label: '10 por página',
		color: 'default',
	},
	'20': {
		label: '20 por página',
		color: 'default',
	},
	'30': {
		label: '30 por página',
		color: 'default',
	},
	'40': {
		label: '40 por página',
		color: 'default',
	},
	'50': {
		label: '50 por página',
		color: 'default',
	},
};

export const pageSizeOptions = Object.entries(pageSizeParse).map(
	([key, value]) => ({ key: key as PageSizeKey, label: value.label })
);

export const pageSizeFilterOptions: FilterOption<PageSizeKey>[] = Object.entries(pageSizeParse).map(
	([key]) => ({
		value: key as PageSizeKey,
		label: key,
		triggerLabel: key,
	})
);

