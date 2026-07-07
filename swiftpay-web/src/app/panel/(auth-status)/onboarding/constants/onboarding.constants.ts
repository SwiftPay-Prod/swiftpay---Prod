import {
	AnalyticsUpIcon,
	CustomerService01Icon,
	Facebook02Icon,
	GlobalIcon,
	GoogleIcon,
	InstagramIcon,
	Megaphone01Icon,
	Rocket01Icon,
	SearchFocusIcon,
	ShoppingBasket01Icon,
	StarAward02Icon,
	StarsIcon,
	Store01Icon,
	Target01Icon,
	TiktokIcon,
	UserGroupIcon,
	WhatsappIcon,
	WorkflowCircle01Icon,
	YoutubeIcon,
} from '@hugeicons/core-free-icons';
import type {
	OnboardingAnswers,
	OnboardingStepId,
	StepDefinition,
	StepErrors,
} from '@/app/panel/(auth-status)/onboarding/types/onboarding.types';
import type { UserOnboardingData } from '@/types/user/onboarding';

export const STEP_DEFINITIONS: StepDefinition[] = [
	{
		id: 'discovery',
		title: 'Como nos encontrou?',
		description: 'Selecione todas as fontes que te trouxeram até a SwiftPay.',
		icon: SearchFocusIcon,
		requiresOtherText: true,
		options: [
			{ id: 'google', label: 'Google / Busca', icon: GoogleIcon },
			{ id: 'instagram', label: 'Instagram', icon: InstagramIcon },
			{ id: 'tiktok', label: 'TikTok', icon: TiktokIcon },
			{ id: 'youtube', label: 'YouTube', icon: YoutubeIcon },
			{ id: 'facebook', label: 'Facebook', icon: Facebook02Icon },
			{ id: 'indicacao', label: 'Indicação de amigos', icon: UserGroupIcon },
			{ id: 'evento', label: 'Evento ou workshop', icon: CustomerService01Icon },
			{ id: 'outros', label: 'Outro', icon: StarsIcon },
		],
	},
	{
		id: 'channels',
		title: 'Qual seu canal de vendas?',
		description: 'Escolha os canais que hoje geram vendas para você.',
		icon: CustomerService01Icon,
		requiresOtherText: true,
		options: [
			{ id: 'loja_virtual', label: 'Loja virtual própria', icon: Store01Icon },
			{ id: 'whatsapp', label: 'WhatsApp', icon: WhatsappIcon },
			{ id: 'marketplace', label: 'Marketplace', icon: ShoppingBasket01Icon },
			{ id: 'site', label: 'Site institucional', icon: GlobalIcon },
			{ id: 'trafego_pago', label: 'Tráfego pago', icon: Megaphone01Icon },
			{ id: 'outros', label: 'Outro', icon: StarsIcon },
		],
	},
	{
		id: 'goals',
		title: 'Quais são seus objetivos?',
		description: 'Defina os objetivos principais para os próximos meses.',
		icon: StarAward02Icon,
		requiresOtherText: true,
		options: [
			{ id: 'aumentar_conversao', label: 'Aumentar taxa de conversão', icon: AnalyticsUpIcon },
			{ id: 'escalar_faturamento', label: 'Escalar faturamento', icon: Rocket01Icon },
			{ id: 'automatizar_cobranca', label: 'Automatizar cobranças', icon: WorkflowCircle01Icon },
			{ id: 'melhorar_aprovacao', label: 'Melhorar aprovação de pagamentos', icon: Target01Icon },
			{ id: 'outros', label: 'Outro', icon: StarsIcon },
		],
	},
];

export const INITIAL_ANSWERS: OnboardingAnswers = {
	discovery: [],
	discoveryOther: '',
	channels: [],
	channelsOther: '',
	goals: [],
	goalsOther: '',
};

export const INITIAL_STEP_ERRORS: StepErrors = {
	discovery: null,
	channels: null,
	goals: null,
};

export function buildInitialAnswers(initialData: UserOnboardingData | null): OnboardingAnswers {
	return {
		discovery: initialData?.discovery ?? INITIAL_ANSWERS.discovery,
		discoveryOther: initialData?.discoveryOther ?? INITIAL_ANSWERS.discoveryOther,
		channels: initialData?.channels ?? INITIAL_ANSWERS.channels,
		channelsOther: initialData?.channelsOther ?? INITIAL_ANSWERS.channelsOther,
		goals: initialData?.goals ?? INITIAL_ANSWERS.goals,
		goalsOther: initialData?.goalsOther ?? INITIAL_ANSWERS.goalsOther,
	};
}

export function getOtherFieldName(stepId: OnboardingStepId): 'discoveryOther' | 'channelsOther' | 'goalsOther' {
	if (stepId === 'discovery') {
		return 'discoveryOther';
	}

	if (stepId === 'channels') {
		return 'channelsOther';
	}

	return 'goalsOther';
}
