import { INITIAL_STEP_ERRORS } from '@/app/panel/(auth-status)/onboarding/constants/onboarding.constants';
import type {
	OnboardingAnswers,
	OnboardingStepId,
	StepErrors,
} from '@/app/panel/(auth-status)/onboarding/types/onboarding.types';

export function validateStep(stepId: OnboardingStepId, answers: OnboardingAnswers): string | null {
	if (stepId === 'discovery') {
		if (answers.discovery.length === 0) {
			return 'Selecione ao menos uma opção para continuar.';
		}

		if (answers.discovery.includes('outros') && answers.discoveryOther.trim().length === 0) {
			return 'Preencha o campo de outros para continuar.';
		}

		return null;
	}

	if (stepId === 'channels') {
		if (answers.channels.length === 0) {
			return 'Selecione ao menos um canal de vendas para continuar.';
		}

		if (answers.channels.includes('outros') && answers.channelsOther.trim().length === 0) {
			return 'Descreva o canal em outros para continuar.';
		}

		return null;
	}

	if (answers.goals.length === 0) {
		return 'Selecione ao menos um objetivo para continuar.';
	}

	if (answers.goals.includes('outros') && answers.goalsOther.trim().length === 0) {
		return 'Descreva o objetivo em outros para continuar.';
	}

	return null;
}

export function validateAllSteps(answers: OnboardingAnswers): StepErrors {
	return {
		discovery: validateStep('discovery', answers),
		channels: validateStep('channels', answers),
		goals: validateStep('goals', answers),
	};
}

export function hasValidationErrors(errors: StepErrors): boolean {
	return Object.values(errors).some((value) => value !== null);
}

export function emptyStepErrors(): StepErrors {
	return { ...INITIAL_STEP_ERRORS };
}
