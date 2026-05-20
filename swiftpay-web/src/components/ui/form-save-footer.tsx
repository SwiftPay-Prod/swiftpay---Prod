'use client';

import { InformationCircleIcon, HourglassIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { formatDate } from '@/utils/datetime';

interface FormSaveFooterProps {
	submitLabel: string;
	isPending: boolean;
	isDisabled: boolean;
	lastUpdated?: string | null;
	tips?: string[];
	onPress?: () => void;
}

export function FormSaveFooter({
	submitLabel,
	isPending,
	isDisabled,
	lastUpdated,
	tips = [],
	onPress,
}: FormSaveFooterProps) {
	const updatedAtLabel = lastUpdated ? formatDate(lastUpdated) : 'Não disponível';

	return (
		<div className="form-save-footer flex flex-col gap-4 rounded-lg border border-default bg-content1 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 flex-col gap-2">
				{tips.map((tip) => (
					<div key={tip} className="flex items-start gap-2">
						<Icon icon={InformationCircleIcon} className="icon-md shrink-0 text-muted" />
						<span className="text-sm text-muted">{tip}</span>
					</div>
				))}

				<div className="flex items-center gap-2">
					<Icon icon={HourglassIcon} className="icon-sm shrink-0 text-muted" />
					<div className="flex flex-col">
						<span className="text-xs font-medium">Última atualização</span>
						<span className="text-xs text-muted">{updatedAtLabel}</span>
					</div>
				</div>
			</div>

			<AsyncButton
				type={onPress ? 'button' : 'submit'}
				variant="primary"
				isPending={isPending}
				isDisabled={isDisabled}
				onPress={onPress}
				className="w-full sm:w-auto"
			>
				{submitLabel}
			</AsyncButton>
		</div>
	);
}
