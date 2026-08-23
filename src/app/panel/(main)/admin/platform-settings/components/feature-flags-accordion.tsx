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
	| 'withdrawalEnabled'
	| 'selfNominalSwitchEnabled';

const FEATURE_FLAGS: Array<{ label: string; field: ToggleField; description?: string }> = [
	{ label: 'PIX Instantâneo', field: 'pixEnabled', description: 'Processamento de pagamentos instantâneos via PIX' },
	{ label: 'Saque (PIX Out)', field: 'withdrawalEnabled', description: 'Transferências e saques via chave PIX para merchants' },
	{ label: 'Troca de nominal', field: 'selfNominalSwitchEnabled', description: 'Permite alteração de titularidade nominal' },
];

export function FeatureFlagsAccordion({ formData, onFieldChange }: FeatureFlagsAccordionProps) {
	const summary = (
		<>
			PIX: {formData.pixEnabled ? 'Ativo' : 'Inativo'} | Saque:{' '}
			{formData.withdrawalEnabled ? 'Ativo' : 'Inativo'} | Troca nominal:{' '}
			{formData.selfNominalSwitchEnabled ? 'Ativa' : 'Inativa'}
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
					<div key={item.field} className='flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0'>
						<div className="flex flex-col gap-0.5">
							<span className='text-sm font-semibold text-white'>{item.label}</span>
							{item.description && <span className='text-xs text-white/50'>{item.description}</span>}
						</div>
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