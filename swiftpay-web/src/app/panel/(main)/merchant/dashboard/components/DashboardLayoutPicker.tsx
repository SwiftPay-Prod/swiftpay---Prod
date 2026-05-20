'use client';

import { Tooltip } from '@heroui/react';
import { DASHBOARD_LAYOUT_OPTIONS, type DashboardLayoutId } from '@/hooks/use-dashboard-layout';

function LayoutPreview({ id, active }: { id: DashboardLayoutId; active: boolean }) {
	const blk = `rounded-[1px] ${active ? 'bg-accent/80' : 'bg-foreground/25'}`;

	if (id === 'standard') {
		return (
			<div className="flex w-9 flex-col gap-0.5">
				<div className={`h-1.25 w-full ${blk}`} />
				<div className="flex gap-0.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className={`h-1 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className={`h-1 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3, 4].map((i) => (
						<div key={i} className={`h-0.5 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					<div className={`h-1 flex-1 ${blk}`} />
					<div className={`h-1 flex-1 ${blk}`} />
				</div>
			</div>
		);
	}

	if (id === 'focus-charts') {
		return (
			<div className="flex w-9 flex-col gap-0.5">
				<div className="flex gap-0.5">
					<div className={`h-1.25 flex-1 ${blk}`} />
					<div className={`h-1.25 flex-1 ${blk}`} />
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className={`h-1 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className={`h-1 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3, 4].map((i) => (
						<div key={i} className={`h-0.5 flex-1 ${blk}`} />
					))}
				</div>
				<div className={`h-1 w-full ${blk}`} />
			</div>
		);
	}

	if (id === 'focus-kpis') {
		return (
			<div className="flex w-9 flex-col gap-0.5">
				<div className="flex gap-0.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className={`h-1.25 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className={`h-1.25 flex-1 ${blk}`} />
					))}
				</div>
				<div className="flex gap-0.5">
					{[0, 1, 2, 3, 4].map((i) => (
						<div key={i} className={`h-0.5 flex-1 ${blk}`} />
					))}
				</div>
				<div className={`h-1 w-full ${blk}`} />
				<div className="flex gap-0.5">
					<div className={`h-1 flex-1 ${blk}`} />
					<div className={`h-1 flex-1 ${blk}`} />
				</div>
			</div>
		);
	}

	return (
		<div className="flex w-9 flex-col gap-0.5">
			<div className="flex gap-0.5">
				<div className={`h-1.25 flex-2 ${blk}`} />
				<div className={`h-1.25 flex-1 ${blk}`} />
			</div>
			<div className="flex gap-0.5">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className={`h-0.75 flex-1 ${blk}`} />
				))}
			</div>
			<div className="flex gap-0.5">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className={`h-0.75 flex-1 ${blk}`} />
				))}
			</div>
			<div className="flex gap-0.5">
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} className={`h-0.5 flex-1 ${blk}`} />
				))}
			</div>
			<div className={`h-0.75 w-full ${blk}`} />
		</div>
	);
}

interface DashboardLayoutPickerProps {
	layout: DashboardLayoutId;
	onLayoutChange: (layout: DashboardLayoutId) => void;
}

export function DashboardLayoutPicker({ layout, onLayoutChange }: DashboardLayoutPickerProps) {
	return (
		<div className="flex items-center gap-0.5 rounded-lg border border-default-200 bg-default-50 p-0.5">
			{DASHBOARD_LAYOUT_OPTIONS.map((opt) => (
				<Tooltip key={opt.id}>
					<Tooltip.Trigger>
						<button
							type="button"
							onClick={() => onLayoutChange(opt.id)}
							className={`flex items-center justify-center rounded-md p-1.5 transition-colors cursor-pointer ${
								layout === opt.id
									? 'bg-surface shadow-xs ring-1 ring-default-200'
									: 'text-muted hover:bg-default-100'
							}`}
							aria-label={opt.label}
						>
							<LayoutPreview id={opt.id} active={layout === opt.id} />
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<Tooltip.Arrow />
						<p className="text-xs font-medium">{opt.label}</p>
						<p className="text-[10px] text-muted">{opt.description}</p>
					</Tooltip.Content>
				</Tooltip>
			))}
		</div>
	);
}
