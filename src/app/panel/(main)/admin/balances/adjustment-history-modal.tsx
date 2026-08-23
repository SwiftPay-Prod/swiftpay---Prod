'use client';

import { use, useState, Suspense } from 'react';
import { Button, Chip, Modal, DateRangePicker, DateField, RangeCalendar, Label } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { TransactionHistoryIcon, ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { adminListPlatformBalanceAdjustments } from '@/app/actions/admin/dashboard';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { adjustmentScopeParse, mapParseColorToChipColor } from '@/parse';
import type {
	AdminPlatformBalanceAdjustmentHistoryData,
	AdjustmentScope,
} from '@/types/admin/platform-balance';
import type { ApiResponse, Paginated } from '@/types/common';

type DataPromise = Promise<ApiResponse<Paginated<AdminPlatformBalanceAdjustmentHistoryData>>>;

interface AdjustmentHistoryModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId?: string;
	merchantName?: string;
	initialDataPromise: DataPromise | null;
}
const SCOPE_LABEL: Record<'Platform' | 'Acquirer', string> = {
	Platform: 'Plataforma',
	Acquirer: 'Adquirente',
};


function AdjustmentCard({ item, mode }: { item: AdminPlatformBalanceAdjustmentHistoryData; mode: 'platform' | 'merchant' }) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
			<div className="flex flex-1 flex-col gap-1.5 min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					{mode === 'platform' ? (
						<Chip size="sm" variant="soft" color={mapParseColorToChipColor(adjustmentScopeParse[item.scope].color)}>
							<Chip.Label>{adjustmentScopeParse[item.scope].label}</Chip.Label>
						</Chip>
					) : (
						item.environment && (
							<Chip size="sm" variant="soft" color={item.environment === 'Production' ? 'success' : 'warning'}>
								<Chip.Label>{item.environment === 'Production' ? 'Produção' : 'Sandbox'}</Chip.Label>
							</Chip>
						)
					)}
					{item.acquirerName && (
						<span className="text-xs text-muted">
							{item.acquirerName}{item.acquirerCode ? ` (${item.acquirerCode})` : ''}
						</span>
					)}
				</div>
				{item.notes && <p className="line-clamp-2 text-xs text-muted">{item.notes}</p>}
				<span className="text-xs text-muted">{formatDate(item.createdAt)}</span>
			</div>
			<span className={`shrink-0 text-sm font-semibold tabular-nums ${item.isCredit ? 'text-success' : 'text-danger'}`}>
				{item.isCredit ? '+' : '−'}{formatCurrency(item.amount)}
			</span>
		</div>
	);
}

function AdjustmentSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="h-16 animate-pulse rounded-xl bg-surface-deep" />
			))}
		</div>
	);
}

function ListPagination({
	page,
	totalPages,
	totalItems,
	pageSize,
	onPageChange,
}: {
	page: number;
	totalPages: number;
	totalItems: number;
	pageSize: number;
	onPageChange: (page: number) => void;
}) {
	if (totalPages <= 1) return null;
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, totalItems);
	return (
		<div className="flex items-center justify-between border-t border-border pt-3">
			<span className="text-xs text-muted">{from}–{to} de {totalItems}</span>
			<div className="flex items-center gap-1">
				<Button isIconOnly size="sm" variant="tertiary" isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}>
					<Icon icon={ArrowLeft01Icon} className="icon-sm" />
				</Button>
				<span className="min-w-16 text-center text-xs text-muted">{page} / {totalPages}</span>
				<Button isIconOnly size="sm" variant="tertiary" isDisabled={page >= totalPages} onPress={() => onPageChange(page + 1)}>
					<Icon icon={ArrowRight01Icon} className="icon-sm" />
				</Button>
			</div>
		</div>
	);
}

function HistoryListContent({
	dataPromise,
	scope,
	startDate,
	endDate,
	mode,
	onScopeChange,
	onStartDateChange,
	onEndDateChange,
	onApplyFilters,
	onClearFilters,
	onPageChange,
}: {
	dataPromise: DataPromise;
	scope: AdjustmentScope | undefined;
	startDate: string;
	endDate: string;
	mode: 'platform' | 'merchant';
	onScopeChange: (scope: AdjustmentScope | undefined) => void;
	onStartDateChange: (v: string) => void;
	onEndDateChange: (v: string) => void;
	onApplyFilters: () => void;
	onClearFilters: () => void;
	onPageChange: (page: number) => void;
}) {
	const response = use(dataPromise);
	const items = response?.data ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };
	const hasFilters = !!scope || !!startDate || !!endDate;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
				{mode === 'platform' && (
					<div className="flex flex-wrap gap-2">
						{(['Platform', 'Acquirer'] as const).map((s) => (
							<Button
								key={s}
								size="sm"
								variant={scope === s ? 'primary' : 'tertiary'}
								onPress={() => onScopeChange(scope === s ? undefined : s)}
							>
								{SCOPE_LABEL[s]}
							</Button>
						))}
					</div>
				)}
				<div className="flex flex-wrap items-end gap-2">
					<DateRangePicker
						value={
							startDate && endDate
								? { start: parseDate(startDate), end: parseDate(endDate) }
								: null
						}
						onChange={(value) => {
							onStartDateChange(value?.start ? value.start.toString().slice(0, 10) : '');
							onEndDateChange(value?.end ? value.end.toString().slice(0, 10) : '');
						}}
					>
						<Label>Período</Label>
						<DateField.Group fullWidth variant="secondary">
							<DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
							<DateRangePicker.RangeSeparator />
							<DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
							<DateField.Suffix>
								<DateRangePicker.Trigger>
									<DateRangePicker.TriggerIndicator />
								</DateRangePicker.Trigger>
							</DateField.Suffix>
						</DateField.Group>
						<DateRangePicker.Popover>
							<RangeCalendar aria-label="Período de ajustes">
								<RangeCalendar.Header>
									<RangeCalendar.YearPickerTrigger>
										<RangeCalendar.YearPickerTriggerHeading />
										<RangeCalendar.YearPickerTriggerIndicator />
									</RangeCalendar.YearPickerTrigger>
									<RangeCalendar.NavButton slot="previous" />
									<RangeCalendar.NavButton slot="next" />
								</RangeCalendar.Header>
								<RangeCalendar.Grid>
									<RangeCalendar.GridHeader>
										{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
									</RangeCalendar.GridHeader>
									<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
								</RangeCalendar.Grid>
								<RangeCalendar.YearPickerGrid>
									<RangeCalendar.YearPickerGridBody>
										{({ year }) => <RangeCalendar.YearPickerCell year={year} />}
									</RangeCalendar.YearPickerGridBody>
								</RangeCalendar.YearPickerGrid>
							</RangeCalendar>
						</DateRangePicker.Popover>
					</DateRangePicker>
					<Button size="sm" variant="secondary" onPress={onApplyFilters}>
						Aplicar
					</Button>
					{hasFilters && (
						<Button size="sm" variant="tertiary" onPress={onClearFilters}>
							Limpar
						</Button>
					)}
				</div>
			</div>

			{items.items.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted">Nenhum ajuste encontrado.</p>
			) : (
				<div className="flex flex-col gap-2">
					{items.items.map((item) => (
						<AdjustmentCard key={item.transactionId} item={item} mode={mode} />
					))}
				</div>
			)}

			<ListPagination
				page={items.page}
				totalPages={items.totalPages}
				totalItems={items.totalItems}
				pageSize={items.pageSize}
				onPageChange={onPageChange}
			/>
		</div>
	);
}

type ModalFilterState = {
	startDate: string;
	endDate: string;
	scope: AdjustmentScope | undefined;
	dataPromise: DataPromise | null;
};

function AdjustmentHistoryContent({ merchantId, initialDataPromise }: { merchantId?: string; initialDataPromise: DataPromise | null }) {
	const mode: 'platform' | 'merchant' = merchantId ? 'merchant' : 'platform';

	const [state, setState] = useState<ModalFilterState>({
		startDate: '',
		endDate: '',
		scope: undefined,
		dataPromise: initialDataPromise,
	});

	function buildRequest(page: number, scope: AdjustmentScope | undefined, startDate: string, endDate: string) {
		return adminListPlatformBalanceAdjustments({
			page,
			pageSize: 10,
			...(merchantId
				? { merchantId, scope: 'Merchant' as AdjustmentScope }
				: { scope, excludeMerchant: true }),
			...(startDate ? { startDate } : {}),
			...(endDate ? { endDate } : {}),
		});
	}

	function handleScopeChange(newScope: AdjustmentScope | undefined) {
		setState((prev) => ({ ...prev, scope: newScope }));
	}

	function handleStartDateChange(v: string) {
		setState((prev) => ({ ...prev, startDate: v }));
	}

	function handleEndDateChange(v: string) {
		setState((prev) => ({ ...prev, endDate: v }));
	}

	function handleApplyFilters() {
		const newPromise = buildRequest(1, state.scope, state.startDate, state.endDate);
		setState((prev) => ({ ...prev, dataPromise: newPromise }));
	}

	function handleClearFilters() {
		setState({
			startDate: '',
			endDate: '',
			scope: undefined,
			dataPromise: buildRequest(1, undefined, '', ''),
		});
	}

	function handlePageChange(page: number) {
		const newPromise = buildRequest(page, state.scope, state.startDate, state.endDate);
		setState((prev) => ({ ...prev, dataPromise: newPromise }));
	}

	return (
		<>
			{state.dataPromise && (
				<Suspense fallback={<AdjustmentSkeleton />}>
					<HistoryListContent
						dataPromise={state.dataPromise}
						scope={state.scope}
						startDate={state.startDate}
						endDate={state.endDate}
						mode={mode}
						onScopeChange={handleScopeChange}
						onStartDateChange={handleStartDateChange}
						onEndDateChange={handleEndDateChange}
						onApplyFilters={handleApplyFilters}
						onClearFilters={handleClearFilters}
						onPageChange={handlePageChange}
					/>
				</Suspense>
			)}
		</>
	);
}

export function AdjustmentHistoryModal({ isOpen, onOpenChange, merchantId, merchantName, initialDataPromise }: AdjustmentHistoryModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={TransactionHistoryIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Ajustes de Saldo</Modal.Heading>
						<p className="text-sm text-muted">
							{merchantId
								? merchantName
									? `Ajustes de saldo da organização ${merchantName}`
									: 'Ajustes de saldo desta organização'
								: 'Ajustes de saldo da plataforma e adquirentes'}
						</p>
					</Modal.Header>
					<Modal.Body>
						{isOpen && (
							<AdjustmentHistoryContent
								key={merchantId ?? 'platform'}
								merchantId={merchantId}
								initialDataPromise={initialDataPromise}
							/>
						)}
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

