'use client';

import { useMemo, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Key } from '@react-types/shared';
import { updateUserOnboarding } from '@/app/actions/user';
import {
	buildInitialAnswers,
	getOtherFieldName,
	INITIAL_STEP_ERRORS,
	STEP_DEFINITIONS,
} from '@/app/panel/(auth-status)/onboarding/constants/onboarding.constants';
import {
	hasValidationErrors,
	validateAllSteps,
	validateStep,
} from '@/app/panel/(auth-status)/onboarding/validations/onboarding.validation';
import type {
	OnboardingAnswers,
	OnboardingStepId,
	UseOnboardingFormParams,
	UseOnboardingFormResult,
} from '@/app/panel/(auth-status)/onboarding/types/onboarding.types';

function getSelectedKeys(stepId: OnboardingStepId, answers: OnboardingAnswers): Set<Key> {
	if (stepId === 'discovery') {
		return new Set(answers.discovery);
	}

	if (stepId === 'channels') {
		return new Set(answers.channels);
	}

	return new Set(answers.goals);
}

export function useOnboardingForm({ initialData, onSuccess }: UseOnboardingFormParams): UseOnboardingFormResult {
	const defaultAnswers = useMemo(() => buildInitialAnswers(initialData), [initialData]);

	const form = useForm<OnboardingAnswers>({
		defaultValues: defaultAnswers,
		mode: 'onChange',
	});

	const watchedValues = useWatch({ control: form.control });
	const answers: OnboardingAnswers = useMemo(
		() => ({
			...defaultAnswers,
			...watchedValues,
		}),
		[defaultAnswers, watchedValues]
	);

	const [activeStepIndex, setActiveStepIndex] = useState(0);
	const [stepErrors, setStepErrors] = useState(INITIAL_STEP_ERRORS);
	const [isFinishing, startFinishTransition] = useTransition();

	const completedByStep = useMemo(() => {
		return {
			discovery: validateStep('discovery', answers) === null,
			channels: validateStep('channels', answers) === null,
			goals: validateStep('goals', answers) === null,
		};
	}, [answers]);

	const firstIncompleteIndex = useMemo(() => {
		const incomplete = STEP_DEFINITIONS.findIndex((step) => !completedByStep[step.id]);
		return incomplete === -1 ? STEP_DEFINITIONS.length - 1 : incomplete;
	}, [completedByStep]);

	const stepperSteps = useMemo(() => {
		return STEP_DEFINITIONS.map((step) => ({
			title: step.title,
			description: step.description,
			key: step.id,
			isRequired: true,
			isCompleted: completedByStep[step.id],
		}));
	}, [completedByStep]);

	const activeStep = STEP_DEFINITIONS[Math.min(activeStepIndex, STEP_DEFINITIONS.length - 1)]!;
	const activeStepId = activeStep.id;
	const activeSelectedKeys = getSelectedKeys(activeStepId, answers);
	const activeStepError = stepErrors[activeStepId];
	const activeRequiresOther = activeStep.requiresOtherText && activeSelectedKeys.has('outros');
	const isFirstStep = activeStepIndex === 0;
	const isLastStep = activeStepIndex === STEP_DEFINITIONS.length - 1;

	function isStepAccessible(stepIndex: number): boolean {
		return stepIndex <= firstIncompleteIndex;
	}

	function getStepIndex(stepId: OnboardingStepId): number {
		return STEP_DEFINITIONS.findIndex((step) => step.id === stepId);
	}

	function handleStepSelection(stepId: OnboardingStepId, keys: 'all' | Set<Key>) {
		if (keys === 'all') {
			return;
		}

		const selected = Array.from(keys).map((key) => String(key));
		const stepField = stepId;
		const otherField = getOtherFieldName(stepId);

		form.setValue(stepField, selected, { shouldDirty: true });
		if (!selected.includes('outros')) {
			form.setValue(otherField, '', { shouldDirty: true });
		}

		setStepErrors((prev) => ({ ...prev, [stepId]: null }));
	}

	function handleOtherInputChange(stepId: OnboardingStepId, value: string) {
		const field = getOtherFieldName(stepId);
		form.setValue(field, value, { shouldDirty: true });
		setStepErrors((prev) => ({ ...prev, [stepId]: null }));
	}

	function handleOptionToggle(stepId: OnboardingStepId, optionId: string) {
		const currentValues =
			stepId === 'discovery' ? answers.discovery : stepId === 'channels' ? answers.channels : answers.goals;
		const nextValues = currentValues.includes(optionId)
			? currentValues.filter((value) => value !== optionId)
			: [...currentValues, optionId];

		handleStepSelection(stepId, new Set(nextValues));
	}

	function goToStep(stepIndex: number) {
		if (!isStepAccessible(stepIndex)) {
			return;
		}

		setActiveStepIndex(stepIndex);
	}

	function handleContinue(stepId: OnboardingStepId) {
		const validationError = validateStep(stepId, answers);
		if (validationError) {
			setStepErrors((prev) => ({ ...prev, [stepId]: validationError }));
			return;
		}

		setStepErrors((prev) => ({ ...prev, [stepId]: null }));
		const currentIndex = getStepIndex(stepId);
		if (currentIndex < STEP_DEFINITIONS.length - 1) {
			setActiveStepIndex(currentIndex + 1);
		}
	}

	function handleBack() {
		if (activeStepIndex === 0) {
			return;
		}

		setActiveStepIndex((prev) => prev - 1);
	}

	function handleFinish() {
		const allErrors = validateAllSteps(answers);
		setStepErrors(allErrors);

		if (hasValidationErrors(allErrors)) {
			const firstErrorStep = STEP_DEFINITIONS.findIndex((step) => allErrors[step.id] !== null);
			if (firstErrorStep >= 0) {
				setActiveStepIndex(firstErrorStep);
			}
			return;
		}

		startFinishTransition(async () => {
			const response = await updateUserOnboarding({
				discovery: answers.discovery,
				discoveryOther: answers.discovery.includes('outros') ? answers.discoveryOther : null,
				channels: answers.channels,
				channelsOther: answers.channels.includes('outros') ? answers.channelsOther : null,
				goals: answers.goals,
				goalsOther: answers.goals.includes('outros') ? answers.goalsOther : null,
			});

			if (response.error) {
				setStepErrors((prev) => ({
					...prev,
					[activeStepId]: response.error?.message ?? 'Não foi possível concluir o onboarding.',
				}));
				return;
			}

			onSuccess();
		});
	}

	return {
		activeStepIndex,
		activeStep,
		activeStepId,
		activeSelectedKeys,
		activeStepError,
		activeRequiresOther,
		answers,
		isFirstStep,
		isLastStep,
		isFinishing,
		stepperSteps,
		isStepAccessible,
		goToStep,
		handleStepSelection,
		handleOptionToggle,
		handleOtherInputChange,
		handleContinue,
		handleBack,
		handleFinish,
	};
}
