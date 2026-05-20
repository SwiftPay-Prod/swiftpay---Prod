import type { Key } from '@react-types/shared';
import type { Icon } from '@/components/ui/icon';
import type { UserOnboardingData } from '@/types/user/onboarding';

export type OnboardingStepId = 'discovery' | 'channels' | 'goals';

export interface StepOption {
	id: string;
	label: string;
	icon: React.ComponentProps<typeof Icon>['icon'];
}

export interface StepDefinition {
	id: OnboardingStepId;
	title: string;
	description: string;
	icon: React.ComponentProps<typeof Icon>['icon'];
	options: StepOption[];
	requiresOtherText: boolean;
}

export interface OnboardingAnswers {
	discovery: string[];
	discoveryOther: string;
	channels: string[];
	channelsOther: string;
	goals: string[];
	goalsOther: string;
}

export interface StepErrors {
	discovery: string | null;
	channels: string | null;
	goals: string | null;
}

export interface UseOnboardingFormResult {
	activeStepIndex: number;
	activeStep: StepDefinition;
	activeStepId: OnboardingStepId;
	activeSelectedKeys: Set<Key>;
	activeStepError: string | null;
	activeRequiresOther: boolean;
	answers: OnboardingAnswers;
	isFirstStep: boolean;
	isLastStep: boolean;
	isFinishing: boolean;
	stepperSteps: Array<{
		title: string;
		description: string;
		key: OnboardingStepId;
		isRequired: boolean;
		isCompleted: boolean;
	}>;
	isStepAccessible: (stepIndex: number) => boolean;
	goToStep: (stepIndex: number) => void;
	handleStepSelection: (stepId: OnboardingStepId, keys: 'all' | Set<Key>) => void;
	handleOptionToggle: (stepId: OnboardingStepId, optionId: string) => void;
	handleOtherInputChange: (stepId: OnboardingStepId, value: string) => void;
	handleContinue: (stepId: OnboardingStepId) => void;
	handleBack: () => void;
	handleFinish: () => void;
}

export interface UseOnboardingFormParams {
	initialData: UserOnboardingData | null;
	onSuccess: () => void;
}
