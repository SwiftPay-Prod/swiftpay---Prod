'use client';

import { Analytics01Icon, ArrowReloadHorizontalIcon } from '@hugeicons/core-free-icons';
import { Button, FieldError, Input, Label, TextField } from '@heroui/react';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { Icon } from '@/components/ui/icon';
import { PlatformDefault } from './platform-default';
import type { MerchantSettingsFormData } from '@/types/admin/merchants';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';

interface RateLimitingAccordionProps {
	formData: MerchantSettingsFormData;
	platformSettings: AdminPlatformSettingsData;
	onFieldChange: (field: keyof MerchantSettingsFormData, value: string) => void;
	onResetField: (field: keyof MerchantSettingsFormData) => void;
	formatEffectiveRateLimit: (merchantValue: string, platformValue: number) => string;
}

export function RateLimitingAccordion({
	formData,
	platformSettings,
	onFieldChange,
	onResetField,
	formatEffectiveRateLimit,
}: RateLimitingAccordionProps) {
	return (
		<SystemAccordion
			id="rate-limiting"
			icon={Analytics01Icon}
			title="Rate Limiting"
			color="rose"
			defaultExpanded={false}
			summary={`${formatEffectiveRateLimit(formData.rateLimitPerMinute, platformSettings.rateLimitPerMinute)}/min | ${formatEffectiveRateLimit(formData.rateLimitPerHour, platformSettings.rateLimitPerHour)}/hora | ${formatEffectiveRateLimit(formData.rateLimitPerDay, platformSettings.rateLimitPerDay)}/dia`}
		>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{[
					{ field: 'rateLimitPerMinute', label: 'Por Minuto', defaultValue: `${platformSettings.rateLimitPerMinute} req/min` },
					{ field: 'rateLimitPerHour', label: 'Por Hora', defaultValue: `${platformSettings.rateLimitPerHour} req/hora` },
					{ field: 'rateLimitPerDay', label: 'Por Dia', defaultValue: `${platformSettings.rateLimitPerDay} req/dia` },
				].map((item) => {
					const value = formData[item.field as keyof MerchantSettingsFormData] as string;
					return (
						<div key={item.field} className="flex flex-col gap-2">
							<TextField
								variant="secondary"
								name={item.field}
								value={value}
								onChange={(next) => onFieldChange(item.field as keyof MerchantSettingsFormData, next)}
								validate={(next) => {
									if (next && (isNaN(Number(next)) || Number(next) < 0)) {
										return 'Valor deve ser um número positivo';
									}
									return null;
								}}
							>
								<Label>{item.label}</Label>
								<div className="flex items-center gap-2">
									<Input variant="secondary" type="number" placeholder="Usar padrão" className="flex-1" min={0} />
									{value && (
										<Button
											isIconOnly
											variant="ghost"
											size="sm"
											onPress={() => onResetField(item.field as keyof MerchantSettingsFormData)}
										>
											<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
										</Button>
									)}
								</div>
								<FieldError />
							</TextField>
							<PlatformDefault label="Padrão" value={item.defaultValue} />
						</div>
					);
				})}
			</div>
		</SystemAccordion>
	);
}
