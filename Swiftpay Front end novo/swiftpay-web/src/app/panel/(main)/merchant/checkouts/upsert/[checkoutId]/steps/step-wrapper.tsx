'use client';

import type { ReactNode } from 'react';
import { Card, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	InformationCircleIcon,
	CheckmarkCircle02Icon,
	ArrowLeft02Icon,
	ArrowRight02Icon,
} from '@hugeicons/core-free-icons';

interface StepWrapperProps {
	title: string;
	description: string;
	tip?: string;
	children: ReactNode;
	showSkip?: boolean;
	showBack?: boolean;
	showFinish?: boolean;
	onSkip?: () => void;
	onBack?: () => void;
	onNext?: () => void;
	onFinish?: () => void;
	isFirstStep?: boolean;
	isLastStep?: boolean;
}

export function StepWrapper({
	title,
	description,
	tip,
	children,
	showSkip = true,
	showBack = true,
	showFinish = false,
	onSkip,
	onBack,
	onNext,
	onFinish,
	isFirstStep = false,
	isLastStep = false,
}: StepWrapperProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold">{title}</h2>
				<p className="text-muted">{description}</p>
			</div>

			{children}

			{tip && (
				<Card className="bg-accent-soft border-accent-soft-hover">
					<Card.Content className="py-4">
						<div className="flex items-start gap-3">
							<Icon icon={InformationCircleIcon} className="icon-md shrink-0 text-accent" />
							<div className="flex flex-col gap-1">
								<span className="text-sm font-medium">Dica</span>
								<p className="text-sm text-muted">{tip}</p>
							</div>
						</div>
					</Card.Content>
				</Card>
			)}

			<div className="flex items-center justify-between border-t border-default pt-4">
				<div className="flex items-center gap-2">
					{showBack && !isFirstStep && onBack && (
						<Button variant="tertiary" onPress={onBack}>
							<Icon icon={ArrowLeft02Icon} className="icon-sm" />
							Voltar
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					{showSkip && !isLastStep && onSkip && (
						<Button variant="tertiary" onPress={onSkip}>
							Pular etapa
						</Button>
					)}

					{showFinish && onFinish && (
						<Button variant="secondary" onPress={onFinish}>
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
							Finalizar
						</Button>
					)}

					{!isLastStep && onNext && (
						<Button variant="primary" onPress={onNext}>
							Continuar
							<Icon icon={ArrowRight02Icon} className="icon-sm" />
						</Button>
					)}

					{isLastStep && onFinish && (
						<Button variant="primary" onPress={onFinish}>
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
							Finalizar
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
