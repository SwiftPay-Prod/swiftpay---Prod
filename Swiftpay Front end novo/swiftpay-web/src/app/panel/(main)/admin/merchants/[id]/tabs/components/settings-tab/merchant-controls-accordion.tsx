'use client';

import { Chip, Label, ListBox, Select } from '@heroui/react';
import type { Key } from '@heroui/react';
import { Settings05Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { mapParseColorToChipColor } from '@/parse';
import { PlatformDefault } from './platform-default';
import type { MerchantSettingsFormData } from '@/types/admin/merchants';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';

interface FeatureFlagOption {
	key: 'default' | 'enabled' | 'disabled';
	label: string;
	icon: React.ReactNode;
	color: 'default' | 'success' | 'danger';
}

interface MerchantControlsAccordionProps {
	formData: MerchantSettingsFormData;
	platformSettings: AdminPlatformSettingsData;
	featureFlagOptions: FeatureFlagOption[];
	onSelectChange: (field: keyof MerchantSettingsFormData, key: Key | null) => void;
	summary: React.ReactNode;
}

export function MerchantControlsAccordion({
	formData,
	platformSettings,
	featureFlagOptions,
	onSelectChange,
	summary,
}: MerchantControlsAccordionProps) {
	const items = [
		{
			name: 'PIX',
			description: 'Habilita cobranças PIX para esta organização',
			field: 'pixEnabled',
			defaultValue: platformSettings.pixEnabled ? 'Habilitado' : 'Desabilitado',
			ariaLabel: 'Configuração PIX',
		},
		{
			name: 'Boleto',
			description: 'Habilita cobranças por boleto para esta organização',
			field: 'boletoEnabled',
			defaultValue: platformSettings.boletoEnabled ? 'Habilitado' : 'Desabilitado',
			ariaLabel: 'Configuração Boleto',
		},
		{
			name: 'Cartão de crédito',
			description: 'Habilita pagamentos com cartão para esta organização',
			field: 'creditCardEnabled',
			defaultValue: platformSettings.creditCardEnabled ? 'Habilitado' : 'Desabilitado',
			ariaLabel: 'Configuração Cartão de crédito',
		},
		{
			name: 'Saque (PIX Out)',
			description: 'Habilita saques para esta organização',
			field: 'withdrawalEnabled',
			defaultValue: platformSettings.withdrawalEnabled ? 'Habilitado' : 'Desabilitado',
			ariaLabel: 'Configuração Saque',
		},
		{
			name: 'Troca de nominal',
			description: 'Quando ativo, organizações podem trocar nominal por autoatendimento',
			field: 'selfNominalSwitchEnabled',
			defaultValue: platformSettings.selfNominalSwitchEnabled ? 'Habilitado' : 'Desabilitado',
			ariaLabel: 'Configuração Troca de nominal',
		},
	] as const;

	return (
		<SystemAccordion
			id="merchant-controls"
			icon={Settings05Icon}
			title="Funcionalidades"
			color="sky"
			defaultExpanded={false}
			summary={summary}
		>
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				{items.map((item) => (
					<div
						key={item.field}
						className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-content1 p-3 xl:grid-cols-[minmax(0,1fr)_16rem]"
					>
						<div className="min-w-0">
							<span className="block max-w-90 wrap-break-word text-sm font-medium leading-5 text-foreground">{item.name}</span>
							<span className="mt-1 block max-w-90 wrap-break-word text-xs leading-5 text-muted">{item.description}</span>
						</div>
						<div className="flex w-full shrink-0 flex-col gap-1 xl:w-64">
							<Select
								variant="secondary"
								aria-label={item.ariaLabel}
								value={formData[item.field as keyof MerchantSettingsFormData] as string}
								onChange={(key) => onSelectChange(item.field as keyof MerchantSettingsFormData, key)}
							>
								<Label>Configuração</Label>
								<Select.Trigger className="w-full">
									<Select.Value />
									<Select.Indicator className="size-4" />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{featureFlagOptions.map((option) => (
											<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
													{option.icon}
													{option.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
							<PlatformDefault label="Padrao" value={item.defaultValue} />
						</div>
					</div>
				))}
			</div>
		</SystemAccordion>
	);
}
