'use client';

import type { ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Switch, Label } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import type { ComponentProps } from 'react';

type HugeIconType = ComponentProps<typeof HugeiconsIcon>['icon'];

interface CheckoutSwitchSettingRowProps {
	title: string;
	isSelected: boolean;
	onChange: (isSelected: boolean) => void;
	isDisabled?: boolean;
	icon?: HugeIconType;
	description?: ReactNode;
	enabledLabel?: string;
	disabledLabel?: string;
}

export function CheckoutSwitchSettingRow({
	title,
	isSelected,
	onChange,
	isDisabled = false,
	icon,
	description,
	enabledLabel = 'Ativo',
	disabledLabel = 'Inativo',
}: CheckoutSwitchSettingRowProps) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
			<div className="flex items-start gap-3">
				{icon && <Icon icon={icon} className="icon-sm mt-0.5 text-muted" />}
				<div className="flex flex-col">
					<Label className="text-sm">{title}</Label>
					{description ? (
						<span className="text-xs text-muted">{description}</span>
					) : (
						<span className="text-xs text-muted">
							Status: {isSelected ? enabledLabel : disabledLabel}
						</span>
					)}
				</div>
			</div>
			<Switch isSelected={isSelected} onChange={onChange} isDisabled={isDisabled}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch>
		</div>
	);
}
