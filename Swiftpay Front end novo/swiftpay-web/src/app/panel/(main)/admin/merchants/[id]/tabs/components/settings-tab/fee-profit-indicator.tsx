'use client';

import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatCurrency, formattedCurrencyToCents, percentageToBasisPoints } from '@/utils/currency';
import { FeeChargeMode } from '@/types/enums';

export function calculateFee(
	amount: number,
	feeMode: FeeChargeMode | string,
	feeFixed: number,
	feePercentage: number
): number {
	switch (feeMode) {
		case 'FixedOnly':
			return feeFixed;
		case 'PercentageOnly':
			return Math.ceil((amount * feePercentage) / 10000);
		case 'FixedAndPercentage':
			return feeFixed + Math.ceil((amount * feePercentage) / 10000);
		default:
			return feeFixed;
	}
}

export function formatAcquirerFeeLabel(feeMode: string, feeFixed: number, feePercentage: number): string {
	const fixedStr = formatCurrency(feeFixed);
	const percentageStr = `${(feePercentage / 100).toFixed(2)}%`;

	switch (feeMode) {
		case 'FixedOnly':
			return fixedStr;
		case 'PercentageOnly':
			return percentageStr;
		case 'FixedAndPercentage':
			return `${fixedStr} + ${percentageStr}`;
		default:
			return fixedStr;
	}
}

interface FeeProfitIndicatorProps {
	merchantFeeMode: string;
	merchantFeeFixed: string;
	merchantFeePercentage: string;
	acquirerFeeMode: string;
	acquirerFeeFixed: number;
	acquirerFeePercentage: number;
	platformFeeMode: FeeChargeMode;
	platformFeeFixed: number;
	platformFeePercentage: number;
	sampleAmount?: number;
}

export function FeeProfitIndicator({
	merchantFeeMode,
	merchantFeeFixed,
	merchantFeePercentage,
	acquirerFeeMode,
	acquirerFeeFixed,
	acquirerFeePercentage,
	platformFeeMode,
	platformFeeFixed,
	platformFeePercentage,
	sampleAmount = 10000,
}: FeeProfitIndicatorProps) {
	const effectiveFeeMode = merchantFeeMode === 'default' ? platformFeeMode : merchantFeeMode;
	const effectiveFeeFixed =
		merchantFeeFixed === '' || merchantFeeMode === 'default'
			? platformFeeFixed
			: (formattedCurrencyToCents(merchantFeeFixed) ?? platformFeeFixed);
	const effectiveFeePercentage =
		merchantFeePercentage === '' || merchantFeeMode === 'default'
			? platformFeePercentage
			: (percentageToBasisPoints(merchantFeePercentage) ?? platformFeePercentage);

	const merchantFee = calculateFee(sampleAmount, effectiveFeeMode, effectiveFeeFixed, effectiveFeePercentage);
	const acquirerFee = calculateFee(sampleAmount, acquirerFeeMode, acquirerFeeFixed, acquirerFeePercentage);

	const profit = merchantFee - acquirerFee;
	const isLoss = profit < 0;
	const isBreakEven = profit === 0;

	const acquirerFeeLabel = formatAcquirerFeeLabel(acquirerFeeMode, acquirerFeeFixed, acquirerFeePercentage);

	return (
		<div
			className={`mt-3 flex items-center gap-2 rounded-md border p-2.5 text-xs ${
				isLoss
					? 'border-danger-soft bg-danger-soft text-danger'
					: isBreakEven
						? 'border-warning-soft bg-warning-soft text-warning'
						: 'border-success-soft bg-success-soft text-success'
			}`}
		>
			<Icon icon={InformationCircleIcon} className="icon-sm shrink-0" />
			<div className="flex flex-col gap-0.5">
				<span className="font-medium">
					{isLoss
						? `Prejuízo de ${formatCurrency(Math.abs(profit))} por transação`
						: isBreakEven
							? 'Operação sem lucro (break-even)'
							: `Lucro de ${formatCurrency(profit)} por transação`}
				</span>
				<span className="text-foreground-500">
					Taxa organização: {formatCurrency(merchantFee)} | Taxa adquirente ({acquirerFeeLabel}):{' '}
					{formatCurrency(acquirerFee)} (em R$
					{(sampleAmount / 100).toFixed(2)})
				</span>
			</div>
		</div>
	);
}
