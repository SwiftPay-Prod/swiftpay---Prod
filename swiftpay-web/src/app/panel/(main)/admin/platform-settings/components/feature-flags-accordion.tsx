'use client';

import { Switch } from '@heroui/react';
import { Settings05Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import type { FormFieldValueUpdater, FormValues } from '../platform-settings-form.types';

interface FeatureFlagsAccordionProps {
	formData: FormValues;
	onFieldChange: FormFieldValueUpdater;
}

type ToggleField =
	| 'pixEnabled'
	| 'boletoEnabled'
	| 'creditCardEnabled'
	| 'withdrawalEnabled'
	| 'selfNominalSwitchEnabled';

const FEATURE_FLAGS: Array<{ label: string; field: ToggleField }> = [
	{ label: 'PIX', field: 'pixEnabled' },
	{ label: 'Boleto', field: 'boletoEnabled' },
	{ label: 'Cartão de Crédito', field: 'creditCardEnabled' },
	{ label: 'Saque (PIX Out)', field: 'withdrawalEnabled' },
	{ label: 'Troca de nominal', field: 'selfNominalSwitchEnabled' },
];

export function FeatureFlagsAccordion({ formData, onFieldChange }: FeatureFlagsAccordionProps) {
	const summary = (
		<>
			PIX {formData.pixEnabled ? 'Habilitado' : 'Desabilitado'} | Boleto{' '}
			{formData.boletoEnabled ? 'Habilitado' : 'Desabilitado'} | Cartão{' '}
			{formData.creditCardEnabled ? 'Habilitado' : 'Desabilitado'} | Saque{' '}
			{formData.withdrawalEnabled ? 'Habilitado' : 'Desabilitado'} | Troca nominal{' '}
			{formData.selfNominalSwitchEnabled ? 'Habilitado' : 'Desabilitado'}
		</>
	);

	return (
		<SystemAccordion
			id='feature-flags'
			icon={Settings05Icon}
			title='Funcionalidades'
			color='sky'
			defaultExpanded={false}
			summary={summary}
		>
			<div className='flex flex-col gap-2'>
				{FEATURE_FLAGS.map((item) => (
					<div key={item.field} className='flex items-center justify-between gap-3 py-2'>
						<span className='text-sm font-medium text-foreground'>{item.label}</span>
						<Switch isSelected={formData[item.field]} onChange={(isSelected) => onFieldChange(item.field, isSelected)}>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</div>
				))}
			</div>
		</SystemAccordion>
	);
}