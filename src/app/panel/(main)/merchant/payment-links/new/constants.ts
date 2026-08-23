import { PaymentMethod } from '@/types/enums';
import type { ApiResponse } from '@/types/common';
import type { ReadFeesData } from '@/types/merchant/settings';

export type FeesPromise = Promise<ApiResponse<ReadFeesData>>;

export type ExpirationPreset = '1d' | '2d' | '3d' | '7d' | 'custom';

export const EXPIRATION_PRESET_OPTIONS: { key: ExpirationPreset; label: string }[] = [
	{ key: '1d', label: '1 dia' },
	{ key: '2d', label: '2 dias' },
	{ key: '3d', label: '3 dias' },
	{ key: '7d', label: '7 dias' },
	{ key: 'custom', label: 'Personalizado' },
];

export const EXPIRATION_DAYS_MAP: Partial<Record<ExpirationPreset, number>> = {
	'1d': 1,
	'2d': 2,
	'3d': 3,
	'7d': 7,
};

export const PAYMENT_METHOD_HINTS: Record<PaymentMethod, string> = {
	[PaymentMethod.Pix]: 'Confirmação imediata e maior taxa de conversão.',
};

export const PRESET_COLORS = [
	{ name: 'Azul', hex: '#3B82F6' },
	{ name: 'Roxo', hex: '#8B5CF6' },
	{ name: 'Rosa', hex: '#EC4899' },
	{ name: 'Verde', hex: '#10B981' },
	{ name: 'Laranja', hex: '#F59E0B' },
	{ name: 'Vermelho', hex: '#EF4444' },
	{ name: 'Ciano', hex: '#06B6D4' },
	{ name: 'Índigo', hex: '#6366F1' },
];

export const WIZARD_STEPS = [
	{
		title: 'Métodos',
		description: 'Selecione os métodos de pagamento do link.',
		isRequired: true,
	},
	{
		title: 'Configurações',
		description: 'Defina regras e campos obrigatórios do link.',
	},
	{
		title: 'Produto',
		description: 'Configure o produto exibido no checkout (opcional).',
	},
	{
		title: 'Visual',
		description: 'Personalize as cores e o logotipo do link.',
	},
	{
		title: 'Cobrança',
		description: 'Informe o valor e o redirecionamento.',
		isRequired: true,
	},
	{
		title: 'Revisão',
		description: 'Confira os dados antes de criar o link.',
	},
];

export const TOTAL_STEPS = WIZARD_STEPS.length;
