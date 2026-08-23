import type React from 'react';

export function DashboardSectionHeader({
	icon,
	title,
	description,
	actions,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	actions?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 border-b border-default-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-deep">{icon}</div>
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="text-sm text-muted">{description}</p>
				</div>
			</div>
			{actions ? <div className="flex items-center gap-2">{actions}</div> : null}
		</div>
	);
}

