'use client';

import React, { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { formatRelativeTime } from '@/utils/datetime';

interface FormPageHeaderProps {
	icon: ReactNode;
	title: ReactNode;
	description?: React.ReactNode;
	meta?: ReactNode;
	actions?: ReactNode;
	backLabel?: string;
	onBack?: () => void;
	updatedAt?: string | null;
}

export function FormPageHeader({
	icon,
	title,
	description,
	meta,
	actions,
	backLabel,
	onBack,
	updatedAt,
}: FormPageHeaderProps) {
	const router = useRouter();

	function handleBack() {
		if (onBack) {
			onBack();
		} else {
			router.back();
		}
	}

	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div className="flex items-start gap-4">
				<Button isIconOnly variant="tertiary" onPress={handleBack} aria-label={backLabel ?? 'Voltar'}>
					<Icon icon={ArrowLeft01Icon} className="icon-md" />
				</Button>
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">{icon}</div>
						<div>
							<h1 className="text-2xl font-bold">{title}</h1>
							{description && <p className="text-sm text-muted">{description}</p>}
							{meta && <div className="mt-1">{meta}</div>}
							{updatedAt && (
								<p className="mt-1 flex items-center gap-1 text-xs text-muted">
									<Icon icon={Clock01Icon} className="icon-xs" />
									Última atualização: {formatRelativeTime(updatedAt)}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
		</div>
	);
}

