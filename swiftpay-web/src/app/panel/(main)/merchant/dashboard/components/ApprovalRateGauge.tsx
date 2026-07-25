'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { CheckmarkCircle02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { Card, Spinner, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { approvalRateLevelParse } from '@/parse';
import { ApprovalRateLevel } from '@/types/enums';

const GAUGE_SEGMENTS = [
	{ name: '0–15%', value: 15, color: '#d4d4d4' },
	{ name: '15–25%', value: 10, color: '#a3a3a3' },
	{ name: '25–35%', value: 10, color: '#737373' },
	{ name: '35–50%', value: 15, color: '#404040' },
	{ name: '50%+', value: 50, color: '#171717' },
];

const LEVEL_COLOR_MAP: Record<string, string> = {
	danger: 'text-danger',
	warning: 'text-warning',
	default: 'text-amber-500',
	accent: 'text-accent',
	success: 'text-success',
};

const RADIAN = Math.PI / 180;

interface ApprovalRateGaugeProps {
	approvalRate: number;
	approvalRateLevel?: ApprovalRateLevel | null;
	isProcessing?: boolean;
	isBalanceVisible: boolean;
}

export function ApprovalRateGauge({ approvalRate, approvalRateLevel, isProcessing, isBalanceVisible }: ApprovalRateGaugeProps) {
	const cx = 100;
	const cy = 85;
	const innerRadius = 50;
	const outerRadius = 75;

	const ang = 180 - (Math.min(Math.max(approvalRate, 0), 100) / 100) * 180;
	const length = (innerRadius + outerRadius) / 2;
	const needleX = cx + length * Math.cos(-RADIAN * ang);
	const needleY = cy + length * Math.sin(-RADIAN * ang);

	const levelKey = approvalRateLevel ?? ApprovalRateLevel.Average;
	const levelParse = approvalRateLevelParse[levelKey] ?? approvalRateLevelParse[ApprovalRateLevel.Average];

	return (
		<Card className={isProcessing ? 'opacity-70' : ''}>
			<Card.Header className="px-4 pt-3">
				<Card.Title className="flex items-center gap-2 text-sm">
					<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
					Taxa de Aprovação
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={InformationCircleIcon} className="icon-xs cursor-help text-muted opacity-60" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-64">
							<Tooltip.Arrow />
							Medidor de performance: Crítico (0–15%), Abaixo (15–25%), Média (25–35%), Boa (35–50%) e Alta (50%+).
						</Tooltip.Content>
					</Tooltip>
					{isProcessing && <Spinner size="sm" className="ml-2" />}
				</Card.Title>
				<Card.Description className="text-xs">Desempenho dos pagamentos</Card.Description>
			</Card.Header>
			<Card.Content className="flex flex-col items-center px-4 pb-3">
				<PieChart width={200} height={110}>
					<Pie
						data={GAUGE_SEGMENTS}
						cx={cx}
						cy={cy}
						startAngle={180}
						endAngle={0}
						innerRadius={innerRadius}
						outerRadius={outerRadius}
						dataKey="value"
						stroke="none"
					>
						{GAUGE_SEGMENTS.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Pie>
					<g>
						<circle cx={cx} cy={cy} r={4} fill="var(--foreground)" />
						<path
							d={`M ${cx} ${cy} L ${needleX} ${needleY}`}
							stroke="var(--foreground)"
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</g>
				</PieChart>
				<div className="-mt-2 flex flex-col items-center gap-0.5">
					<AnimatedNumber
						value={approvalRate}
						suffix="%"
						maximumFractionDigits={1}
						className={`text-2xl font-bold ${isBalanceVisible ? '' : 'visual-blur'}`}
					/>
					<span className={`text-xs font-medium ${LEVEL_COLOR_MAP[levelParse.color]} ${isBalanceVisible ? '' : 'visual-blur'}`}>
						{levelParse.label}
					</span>
				</div>
				<div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted">
					{GAUGE_SEGMENTS.map((seg) => (
						<div key={seg.name} className="flex items-center gap-1">
							<div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
							<span>{seg.name}</span>
						</div>
					))}
				</div>
			</Card.Content>
		</Card>
	);
}
