'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Card, Popover } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface WizardStep {
	title: string;
	description?: string;
	key?: string;
	isRequired?: boolean;
	isCompleted?: boolean;
	hasWarning?: boolean;
	warningCount?: number;
}

export interface WizardStepperProps {
	steps: WizardStep[];
	currentStep: number;
	mode?: 'wizard' | 'editor';
	isDisabled?: boolean;
	onStepClick?: (index: number) => void;
	isStepClickDisabled?: (index: number) => boolean;
	onBack?: () => void;
	onNext?: () => void;
	submitSlot?: ReactNode;
}

export function WizardStepper({
	steps,
	currentStep,
	mode = 'wizard',
	isDisabled,
	onStepClick,
	isStepClickDisabled,
	onBack,
	onNext,
	submitSlot,
}: WizardStepperProps) {
	if (mode === 'editor') {
		return <EditorStepper steps={steps} currentStep={currentStep} isDisabled={isDisabled} onStepClick={onStepClick} submitSlot={submitSlot} />;
	}

	return (
		<WizardModeStepper
			steps={steps}
			currentStep={currentStep}
			isDisabled={isDisabled}
			onStepClick={onStepClick}
			isStepClickDisabled={isStepClickDisabled}
			onBack={onBack}
			onNext={onNext}
			submitSlot={submitSlot}
		/>
	);
}

function WizardModeStepper({
	steps,
	currentStep,
	isDisabled,
	onStepClick,
	isStepClickDisabled,
	onBack,
	onNext,
	submitSlot,
}: Omit<WizardStepperProps, 'mode'>) {
	const totalSteps = steps.length;
	const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
	const currentStepMeta = steps[currentStep];
	const isCurrentStepRequiredPending =
		!!currentStepMeta?.isRequired && !(currentStepMeta?.isCompleted ?? false);
	const isCurrentStepWarning = !!currentStepMeta?.hasWarning;
	const isLastStep = currentStep === totalSteps - 1;
	const showNavigation = !!(onBack || (onNext && !isLastStep) || (isLastStep && submitSlot));

	return (
		<Card>
			<Card.Content className="">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-0.5">
						<p className="text-xs uppercase tracking-wide text-muted">
							Etapa {currentStep + 1} de {totalSteps}
						</p>
						<div className="flex items-center gap-2">
							<p className="text-base font-semibold text-foreground">{currentStepMeta?.title}</p>
							{isCurrentStepRequiredPending && (
								<span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
									<span className="h-1.5 w-1.5 rounded-full bg-danger" />
									Obrigatório
								</span>
							)}
							{isCurrentStepWarning && (
								<span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
									<span className="h-1.5 w-1.5 rounded-full bg-warning" />
									Correção solicitada
								</span>
							)}
						</div>
						{currentStepMeta?.description && (
							<p className="text-xs text-muted">{currentStepMeta.description}</p>
						)}
					</div>
					<div className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
						{progressPercent}%
					</div>
				</div>

				<div className="mt-3">
					<div className="h-2 w-full overflow-hidden rounded-full bg-content2">
						<div
							className="h-full rounded-full bg-accent transition-all duration-300"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
				</div>

				<div className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
					{steps.map((step, stepIndex) => {
						const isActive = stepIndex === currentStep;
						const isPassed = stepIndex < currentStep;
						const isCompleted = step.isCompleted ?? false;
						const isRequiredPending = !!step.isRequired && !isCompleted;
						const isWarning = !!step.hasWarning;
						const stepDisabled =
							isDisabled || (isStepClickDisabled ? isStepClickDisabled(stepIndex) : false);

						let variant: 'primary' | 'secondary' | 'tertiary' = 'tertiary';
						if (isActive) variant = 'primary';
						else if (isPassed) variant = 'secondary';

						return (
							<Button
								key={step.key ?? step.title}
								size="sm"
								variant={variant}
								onPress={() => onStepClick?.(stepIndex)}
								isDisabled={stepDisabled || !onStepClick}
							>
								{stepIndex + 1}. {step.title}
								{isRequiredPending && (
									<span className="ml-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
								)}
								{isWarning && (
									<span className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">
										<span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
										{step.warningCount && step.warningCount > 1 ? step.warningCount : null}
									</span>
								)}
							</Button>
						);
					})}
				</div>

				<div className="mt-3 flex items-center gap-1.5 sm:hidden">
					<span className="text-xs text-muted">{currentStep + 1}/{totalSteps}</span>
					<span className="text-xs text-muted">·</span>
					<span className="text-sm font-medium text-foreground">{currentStepMeta?.title}</span>
					{isCurrentStepRequiredPending && (
						<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
					)}
					{isCurrentStepWarning && (
						<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
					)}
				</div>

				{showNavigation && (
					<div className="mt-4 border-t border-divider pt-4">
						<div className="flex items-center justify-end gap-2">
							{onBack && (
								<Button
									variant="secondary"
									onPress={onBack}
									isDisabled={currentStep === 0 || isDisabled}
									className="mr-auto"
								>
									<Icon icon={ArrowLeft01Icon} className="icon-sm" />
									Voltar
								</Button>
							)}

							{!isLastStep && onNext && (
								<Button variant="primary" onPress={onNext} isDisabled={isDisabled}>
									Próximo
									<Icon icon={ArrowRight01Icon} className="icon-sm" />
								</Button>
							)}

							{isLastStep && submitSlot}
						</div>
					</div>
				)}
			</Card.Content>
		</Card>
	);
}

function EditorStepper({
	steps,
	currentStep,
	isDisabled,
	onStepClick,
	submitSlot,
}: Pick<WizardStepperProps, 'steps' | 'currentStep' | 'isDisabled' | 'onStepClick' | 'submitSlot'>) {
	const [visibleIndices, setVisibleIndices] = useState<number[]>(() => steps.map((_, i) => i));
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const measureItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
	const moreMeasureRef = useRef<HTMLButtonElement | null>(null);

	const setMeasureRef = useCallback((index: number) => {
		return (el: HTMLButtonElement | null) => {
			if (!el) {
				measureItemRefs.current.delete(index);
				return;
			}
			measureItemRefs.current.set(index, el);
		};
	}, []);

	const recompute = useCallback(() => {
		const ITEM_GAP = 6;
		const containerWidth = containerRef.current?.clientWidth ?? 0;
		if (containerWidth <= 0) return;

		const moreWidth = moreMeasureRef.current?.offsetWidth ?? 0;
		const itemWidths = steps.map((_, index) => ({
			index,
			width: measureItemRefs.current.get(index)?.offsetWidth ?? 0,
		}));

		if (itemWidths.some((i) => i.width <= 0)) return;

		const totalWidth = itemWidths.reduce(
			(sum, item, idx) => sum + item.width + (idx > 0 ? ITEM_GAP : 0),
			0,
		);

		if (totalWidth <= containerWidth) {
			setVisibleIndices(itemWidths.map((i) => i.index));
			return;
		}

		const availableWidth = Math.max(containerWidth - moreWidth - ITEM_GAP, 0);
		let consumed = 0;
		const nextVisible: number[] = [];

		for (const item of itemWidths) {
			const needed = item.width + (nextVisible.length > 0 ? ITEM_GAP : 0);
			if (consumed + needed > availableWidth) break;
			consumed += needed;
			nextVisible.push(item.index);
		}

		if (!nextVisible.includes(currentStep)) {
			const selectedWidth = itemWidths[currentStep]?.width ?? 0;
			const others = itemWidths.filter((i) => i.index !== currentStep);
			const adjusted: number[] = [];
			let adjustedConsumed = selectedWidth;

			for (const item of others) {
				const needed = item.width + ITEM_GAP;
				if (adjustedConsumed + needed > availableWidth) break;
				adjusted.push(item.index);
				adjustedConsumed += needed;
			}

			adjusted.push(currentStep);
			adjusted.sort((a, b) => a - b);
			setVisibleIndices(adjusted);
			return;
		}

		setVisibleIndices(nextVisible);
	}, [steps, currentStep]);

	useEffect(() => {
		const frameId = requestAnimationFrame(recompute);
		const observer = new ResizeObserver(recompute);

		if (containerRef.current) observer.observe(containerRef.current);
		measureItemRefs.current.forEach((el) => observer.observe(el));
		if (moreMeasureRef.current) observer.observe(moreMeasureRef.current);

		return () => {
			cancelAnimationFrame(frameId);
			observer.disconnect();
		};
	}, [recompute, steps]);

	const visibleSet = new Set(visibleIndices);
	const overflowSteps = steps
		.map((step, index) => ({ step, index }))
		.filter(({ index }) => !visibleSet.has(index));

	return (
		<Card>
			<Card.Content className="relative">
				<div ref={containerRef} className="flex flex-wrap gap-1.5">
					{steps.map((step, stepIndex) => {
						const isActive = stepIndex === currentStep;
						const isCompleted = step.isCompleted ?? false;
						const isRequiredPending = !!step.isRequired && !isCompleted;

						let variant: 'primary' | 'secondary' | 'tertiary' = 'tertiary';
						if (isActive) variant = 'primary';

						return (
							<Button
								key={step.key ?? step.title}
								size="sm"
								variant={variant}
								onPress={() => onStepClick?.(stepIndex)}
								isDisabled={isDisabled || !onStepClick}
								className={`shrink-0 ${!visibleSet.has(stepIndex) ? 'hidden' : ''}`}
							>
								{step.title}
								{isRequiredPending && (
									<span className="ml-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
								)}
							</Button>
						);
					})}

					{overflowSteps.length > 0 && (
						<Popover isOpen={isMoreOpen} onOpenChange={setIsMoreOpen}>
							<Popover.Trigger>
								<Button size="sm" variant="tertiary" className="shrink-0">
									Mais
									<Icon icon={ArrowDown01Icon} className="icon-sm" />
								</Button>
							</Popover.Trigger>
							<Popover.Content placement="bottom end" className="p-1">
								<Popover.Dialog>
									<div className="flex min-w-44 flex-col gap-1">
										{overflowSteps.map(({ step, index }) => {
											const isActive = index === currentStep;
											const isCompleted = step.isCompleted ?? false;
											const isRequiredPending = !!step.isRequired && !isCompleted;

											return (
												<Button
													key={step.key ?? step.title}
													variant={isActive ? 'primary' : 'tertiary'}
													size="sm"
													className="justify-start"
													isDisabled={isDisabled || !onStepClick}
													onPress={() => {
														onStepClick?.(index);
														setIsMoreOpen(false);
													}}
												>
													{step.title}
													{isRequiredPending && (
														<span className="ml-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
													)}
												</Button>
											);
										})}
									</div>
								</Popover.Dialog>
							</Popover.Content>
						</Popover>
					)}
				</div>

				<div
					className="pointer-events-none absolute left-0 top-0 -z-10 flex h-0 items-center gap-0 overflow-hidden opacity-0"
					aria-hidden
				>
					{steps.map((step, index) => (
						<button
							key={step.key ?? step.title}
							type="button"
							ref={setMeasureRef(index)}
							className="inline-flex h-8 w-fit items-center gap-1 whitespace-nowrap px-3 text-sm font-normal"
						>
							{step.title}
						</button>
					))}
					<button
						type="button"
						ref={moreMeasureRef}
						className="inline-flex h-8 min-w-20 w-fit items-center gap-2 whitespace-nowrap px-3 text-sm font-normal"
					>
						<span>Mais</span>
						<span className="inline-flex"><Icon icon={ArrowDown01Icon} className="icon-sm" /></span>
					</button>
				</div>

				{submitSlot && (
					<div className="mt-3 flex items-center justify-end border-t border-divider pt-3">
						{submitSlot}
					</div>
				)}
			</Card.Content>
		</Card>
	);
}
