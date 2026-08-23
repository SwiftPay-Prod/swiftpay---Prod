'use client';

import { Button, Card, Checkbox, Input, Label, Tag, TagGroup, TextField } from '@heroui/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { Icon } from '@/components/ui/icon';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import type { UseOnboardingFormResult } from '@/app/panel/(auth-status)/onboarding/types/onboarding.types';

interface OnboardingFormProps {
	controller: UseOnboardingFormResult;
}

function OnboardingStepOptions({ controller }: OnboardingFormProps) {
	const { activeStep, activeSelectedKeys, isFinishing, handleStepSelection, handleOptionToggle } = controller;

	if (activeStep.id === 'discovery') {
		return (
			<TagGroup
				aria-label={activeStep.title}
				selectionMode="multiple"
				selectedKeys={activeSelectedKeys}
				onSelectionChange={(keys) => handleStepSelection(activeStep.id, keys)}
				className={isFinishing ? 'pointer-events-none opacity-70' : ''}
			>
				<Label className="sr-only">{activeStep.title}</Label>
				<TagGroup.List className="grid grid-cols-1 gap-2 sm:grid-cols-3">
					{activeStep.options.map((option) => (
						<Tag key={option.id} id={option.id} textValue={option.label} className="h-11 rounded-xl px-3 text-sm">
							<span className="inline-flex items-center gap-2">
								<Icon icon={option.icon} className="h-6 w-6" />
								{option.label}
							</span>
						</Tag>
					))}
				</TagGroup.List>
			</TagGroup>
		);
	}

	if (activeStep.id === 'channels') {
		return (
			<div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 ${isFinishing ? 'pointer-events-none opacity-70' : ''}`}>
				{activeStep.options.map((option) => {
					const isSelected = controller.answers.channels.includes(option.id);
					return (
						<Button
							key={option.id}
							variant="secondary"
							size="lg"
							className={`h-18 w-full flex-col items-center justify-center gap-1 border text-center transition-colors ${
								isSelected
									? 'border-brand bg-brand/15 text-white'
									: 'border-white/12 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
							}`}
							onPress={() => handleOptionToggle(activeStep.id, option.id)}
							isDisabled={isFinishing}
						>
							<Icon icon={option.icon} className={`h-6 w-6 ${isSelected ? 'text-link' : 'text-white/60'}`} />
							<span className={`text-sm font-medium ${isSelected ? 'text-white font-bold' : 'text-white/80'}`}>{option.label}</span>
						</Button>
					);
				})}
			</div>
		);
	}

	return (
		<div className={`flex flex-col gap-2 ${isFinishing ? 'pointer-events-none opacity-70' : ''}`}>
			{activeStep.options.map((option) => (
				<Checkbox
					key={option.id}
					variant="secondary"
					isSelected={controller.answers.goals.includes(option.id)}
					onChange={() => handleOptionToggle(activeStep.id, option.id)}
					className="w-full rounded-lg border border-border px-3 py-2"
					isDisabled={isFinishing}
				>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
					<Checkbox.Content>
						<span className="inline-flex items-center gap-2 text-sm text-foreground">
							<Icon
								icon={option.icon}
								className={`icon-md ${controller.answers.goals.includes(option.id) ? 'text-accent' : 'text-foreground'}`}
							/>
							<span
								className={`text-sm ${controller.answers.goals.includes(option.id) ? 'text-accent' : 'text-foreground'}`}
							>
								{option.label}
							</span>
						</span>
					</Checkbox.Content>
				</Checkbox>
			))}
		</div>
	);
}

export function OnboardingForm({ controller }: OnboardingFormProps) {
	const {
		answers,
		activeStep,
		activeStepError,
		activeRequiresOther,
		activeStepIndex,
		isFirstStep,
		isLastStep,
		isFinishing,
		stepperSteps,
		isStepAccessible,
		goToStep,
		handleOtherInputChange,
		handleBack,
		handleContinue,
		handleFinish,
	} = controller;

	return (
		<>
			<WizardStepper
				steps={stepperSteps}
				currentStep={activeStepIndex}
				onStepClick={goToStep}
				isStepClickDisabled={(index) => !isStepAccessible(index)}
			/>

			<Card>
				<Card.Content className="flex flex-col gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-brand/15 text-link border border-brand/30">
							<Icon icon={activeStep.icon} className="icon-md" />
						</div>
						<div className="flex flex-col">
							<p className="text-sm font-semibold text-foreground">{activeStep.title}</p>
							<p className="text-xs text-muted">{activeStep.description}</p>
						</div>
					</div>

					<OnboardingStepOptions controller={controller} />

					{activeRequiresOther && (
						<TextField isRequired>
							<Label>Outro</Label>
							<Input
								variant="secondary"
								value={
									activeStep.id === 'discovery'
										? answers.discoveryOther
										: activeStep.id === 'channels'
											? answers.channelsOther
											: answers.goalsOther
								}
								onChange={(event) => handleOtherInputChange(activeStep.id, event.target.value)}
								placeholder="Conte pra gente"
								disabled={isFinishing}
							/>
						</TextField>
					)}

					{activeStepError && <p className="text-sm text-danger">{activeStepError}</p>}

					<div className="flex items-center justify-between gap-2 pt-2">
						{!isFirstStep ? (
							<button type="button" onClick={handleBack} disabled={isFinishing} className="button-outline-dark">
								<Icon icon={ArrowLeft01Icon} className="icon-md" />
								Voltar
							</button>
						) : (
							<div />
						)}

						{!isLastStep ? (
							<button type="button" onClick={() => handleContinue(activeStep.id)} disabled={isFinishing} className="button-primary cursor-pointer">
								<span>Continuar</span>
								<Icon icon={ArrowRight01Icon} className="icon-md" />
							</button>
						) : (
							<AsyncButton variant="primary" onPress={handleFinish} isPending={isFinishing} className="button-primary cursor-pointer">
								Finalizar
							</AsyncButton>
						)}
					</div>
				</Card.Content>
			</Card>
		</>
	);
}
