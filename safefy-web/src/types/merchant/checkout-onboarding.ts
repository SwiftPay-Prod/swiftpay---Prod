export interface CheckoutOnboardingStep {
	key: string;
	title: string;
	shortDescription: string;
	description: string;
	isRequired?: boolean;
}

export const CHECKOUT_ONBOARDING_STEPS: CheckoutOnboardingStep[] = [
	{
		key: 'name',
		title: 'Nome',
		shortDescription: 'Identificação',
		description: 'Defina um nome para identificar seu checkout.',
	},
	{
		key: 'template',
		title: 'Template',
		shortDescription: 'Layout visual',
		description: 'Escolha o template visual do seu checkout. Cada template oferece uma experiência diferente para seus clientes.',
		isRequired: true,
	},
	{
		key: 'payments',
		title: 'Pagamentos',
		shortDescription: 'Métodos de pagamento',
		description: 'Configure os métodos de pagamento que seus clientes poderão usar, como PIX ou cartão de crédito.',
		isRequired: true,
	},
	{
		key: 'customer',
		title: 'Cliente',
		shortDescription: 'Dados do cliente',
		description: 'Defina quais informações do cliente serão coletadas durante o checkout.',
	},
	{
		key: 'messages',
		title: 'Mensagens',
		shortDescription: 'Textos personalizados',
		description: 'Personalize as mensagens exibidas em cada etapa do checkout.',
	},
	{
		key: 'features',
		title: 'Funcionalidades',
		shortDescription: 'Recursos extras',
		description: 'Ative recursos como timer de urgência e prova social para aumentar suas conversões.',
	},
	{
		key: 'tracking',
		title: 'Rastreamento',
		shortDescription: 'Analytics e pixels',
		description: 'Integre ferramentas de análise como Google Analytics e Facebook Pixel.',
	},
	{
		key: 'products',
		title: 'Produtos',
		shortDescription: 'Catálogo',
		description: 'Vincule os produtos que estarão disponíveis neste checkout.',
		isRequired: true,
	},
	{
		key: 'coupons',
		title: 'Cupons',
		shortDescription: 'Descontos',
		description: 'Configure cupons de desconto para oferecer promoções aos seus clientes.',
	},
	{
		key: 'urls',
		title: 'URLs',
		shortDescription: 'Redirecionamentos',
		description: 'Defina as URLs de redirecionamento após o pagamento.',
	},
	{
		key: 'seo',
		title: 'SEO',
		shortDescription: 'Otimização web',
		description: 'Otimize seu checkout para mecanismos de busca e redes sociais.',
	},
	{
		key: 'visual',
		title: 'Visual',
		shortDescription: 'Cores e imagens',
		description: 'Personalize as cores e imagens do seu checkout.',
	},
	{
		key: 'review',
		title: 'Revisão',
		shortDescription: 'Checklist final',
		description: 'Revise as configurações e salve antes de publicar o checkout.',
	},
];

export function getCheckoutStepIndex(stepKey: string): number {
	const index = CHECKOUT_ONBOARDING_STEPS.findIndex((step) => step.key === stepKey);
	return index >= 0 ? index : 0;
}

export function getCheckoutStepByIndex(index: number): CheckoutOnboardingStep {
	const step = CHECKOUT_ONBOARDING_STEPS[index];
	const fallback = CHECKOUT_ONBOARDING_STEPS[0];
	return step ?? fallback!;
}

export function isFirstStep(stepIndex: number): boolean {
	return stepIndex === 0;
}

export function isLastStep(stepIndex: number): boolean {
	return stepIndex === CHECKOUT_ONBOARDING_STEPS.length - 1;
}
