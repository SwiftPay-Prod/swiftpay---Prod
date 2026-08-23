'use client';

import { useState, useTransition, use, Suspense, useRef } from 'react';
import {
	Modal,
	Button,
	Chip,
	Skeleton,
	TextArea,
	Label,
	Select,
	ListBox,
	Switch,
	Autocomplete,
	SearchField,
	EmptyState,
	useFilter,
	TextField,
	FieldError,
	Avatar,
} from '@heroui/react';
import type { Key } from '@heroui/react';
import { CurrencyCentsInput, type CurrencyCentsInputRef } from '@/components/ui/currency-cents-input';
import {
	Wallet01Icon,
	WalletRemove01Icon,
	ServerStack01Icon,
	Key01Icon,
	CheckmarkCircle02Icon,
	AlertCircleIcon,
	Delete02Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import type {
	AdminPreviewPlatformPayoutData,
	AdminPreviewPlatformPayoutItemData,
	AdminPlatformPayoutAccountData,
} from '@/types/admin/platform-payouts';
import type { ApiResponse, Paginated } from '@/types/common';
import {
	adminPreviewPlatformPayout,
	adminCreatePlatformPayout,
} from '@/app/actions/admin/platform-payouts';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { maskPixKey } from '@/utils/input-masks';
import { feeChargeModeParse, pixKeyTypeParse, mapParseColorToChipColor } from '@/parse';
import { toast } from '@heroui/react';

interface AdminNewPlatformPayoutModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onCreated: () => void;
	availabilityPromise: Promise<ApiResponse<AdminPreviewPlatformPayoutData>> | null;
	accountsPromise: Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>> | null;
}

type PreviewResponse = Awaited<ReturnType<typeof adminPreviewPlatformPayout>>;

function PreviewSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-16 rounded-lg" />
			<Skeleton className="h-48 rounded-lg" />
		</div>
	);
}

function FormSkeleton() {
	return (
		<>
			<Modal.Body className="flex flex-col gap-4">
				<Skeleton className="h-24 rounded-lg" />
				<Skeleton className="h-24 rounded-lg" />
				<Skeleton className="h-20 rounded-lg" />
				<PreviewSkeleton />
			</Modal.Body>
			<Modal.Footer className="flex justify-end gap-2">
				<Button variant="secondary" isDisabled>
					Cancelar
				</Button>
				<Button variant="primary" isDisabled>
					Confirmar Saque
				</Button>
			</Modal.Footer>
		</>
	);
}

function PreviewItemsTable({ items }: { items: AdminPreviewPlatformPayoutItemData[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead className="bg-surface-deep">
					<tr>
						<th className="px-3 py-2 text-left text-xs font-semibold text-foreground/70">Adquirente</th>
						<th className="px-3 py-2 text-right text-xs font-semibold text-foreground/70">Disponível</th>
						<th className="px-3 py-2 text-right text-xs font-semibold text-foreground/70">Valor</th>
						<th className="px-3 py-2 text-right text-xs font-semibold text-foreground/70">Taxa</th>
						<th className="px-3 py-2 text-right text-xs font-semibold text-foreground/70">Líquido</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-foreground/5">
					{items.map((item) => {
						const feeModeLabel = feeChargeModeParse[item.payoutFeeMode]?.label ?? item.payoutFeeMode;
						return (
							<tr key={item.acquirerId} className="hover:bg-surface-deep/50">
								<td className="px-2 py-2.5">
									<div className="flex items-center gap-2">
										{item.acquirerLogoUrl ? (
											<Avatar size="sm" className="size-5 shrink-0">
												<Avatar.Image src={item.acquirerLogoUrl} alt={item.acquirerName} />
												<Avatar.Fallback>
													<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
												</Avatar.Fallback>
											</Avatar>
										) : (
											<div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-card">
												<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
											</div>
										)}
										<div className="flex flex-col">
											<span className="font-medium text-foreground">{item.acquirerName}</span>
											<span className="text-xs text-foreground/60 font-mono">{item.acquirerCode}</span>
										</div>
									</div>
								</td>
								<td className="px-3 py-2.5 text-right text-success">{formatCurrency(item.availableBalance)}</td>
								<td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(item.amount)}</td>
								<td className="px-3 py-2.5 text-right">
									<div className="flex flex-col items-end">
										<span className="text-danger font-medium">{formatCurrency(item.acquirerFee)}</span>
										<span className="text-xs text-foreground/60">{feeModeLabel}</span>
									</div>
								</td>
								<td className="px-3 py-2.5 text-right text-success font-semibold">{formatCurrency(item.netAmount)}</td>
							</tr>
						);
					})}
				</tbody>
				<tfoot>
					<tr className="border-t border-foreground/10 font-semibold">
						<td className="px-3 py-2.5 text-foreground/70">Total</td>
						<td />
						<td className="px-3 py-2.5 text-right">{formatCurrency(items.reduce((sum, i) => sum + i.amount, 0))}</td>
						<td className="px-3 py-2.5 text-right text-danger">
							{formatCurrency(items.reduce((sum, i) => sum + i.acquirerFee, 0))}
						</td>
						<td className="px-3 py-2.5 text-right text-success">
							{formatCurrency(items.reduce((sum, i) => sum + i.netAmount, 0))}
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	);
}

function formatFeeDetails(fixedFee: number, percentageBasisPoints: number) {
	const parts: string[] = [];
	if (fixedFee > 0) {
		parts.push(formatCurrency(fixedFee));
	}
	if (percentageBasisPoints > 0) {
		parts.push(`${(percentageBasisPoints / 100).toFixed(2)}%`);
	}
	return parts.length > 0 ? parts.join(' + ') : 'Isenta';
}

function buildManualRequest(
	availabilityItems: AdminPreviewPlatformPayoutItemData[],
	selected: Set<string>,
	amounts: Record<string, string>
) {
	return availabilityItems
		.filter((item) => selected.has(item.acquirerId))
		.map((item) => ({
			acquirerId: item.acquirerId,
			amount: formattedCurrencyToCents(amounts[item.acquirerId] ?? '') ?? 0,
		}))
		.filter((item) => item.amount > 0);
}

function useManualDistributionState(availabilityItems: AdminPreviewPlatformPayoutItemData[]) {
	const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
	const [selectedAcquirers, setSelectedAcquirers] = useState<Set<string>>(new Set());
	const [selectedAcquirerKey, setSelectedAcquirerKey] = useState<Key | null>(null);

	const selectedAcquirerItems = availabilityItems.filter((item) => selectedAcquirers.has(item.acquirerId));
	const availableAcquirerItems = availabilityItems.filter((item) => !selectedAcquirers.has(item.acquirerId));
	const manualTotalAmount = selectedAcquirerItems.reduce(
		(sum, item) => sum + (formattedCurrencyToCents(manualAmounts[item.acquirerId] ?? '') ?? 0),
		0
	);

	const handleManualAmountChange = (acquirerId: string, value: string) => {
		setManualAmounts((prev) => {
			const next = { ...prev };
			if (!value) {
				delete next[acquirerId];
			} else {
				next[acquirerId] = value;
			}
			return next;
		});
	};

	const handleAddAcquirer = (acquirerId: string) => {
		setSelectedAcquirers((prev) => new Set(prev).add(acquirerId));
		setSelectedAcquirerKey(null);
	};

	const handleRemoveAcquirer = (acquirerId: string) => {
		setSelectedAcquirers((prev) => {
			const next = new Set(prev);
			next.delete(acquirerId);
			return next;
		});
		setManualAmounts((prev) => {
			const next = { ...prev };
			delete next[acquirerId];
			return next;
		});
	};

	return {
		manualAmounts,
		selectedAcquirers,
		selectedAcquirerKey,
		selectedAcquirerItems,
		availableAcquirerItems,
		manualTotalAmount,
		setSelectedAcquirerKey,
		handleManualAmountChange,
		handleAddAcquirer,
		handleRemoveAcquirer,
	};
}

function PreviewSection({ previewPromise }: { previewPromise: Promise<PreviewResponse> }) {
	if (!previewPromise) return null;
	const response = use(previewPromise);
	if (response?.error) {
		return (
			<div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3">
				<Icon icon={AlertCircleIcon} className="icon-sm text-danger shrink-0" />
				<span className="text-sm text-danger">{response.error.message}</span>
			</div>
		);
	}

	const preview = response?.data;
	if (!preview) return null;

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-lg bg-surface-secondary">
				<div className="flex flex-col gap-2 text-sm p-2">
					<div className="flex justify-between">
						<span className="text-muted">Valor total a sacar:</span>
						<span className="font-medium">{formatCurrency(preview.totalAmount)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted">Taxas totais:</span>
						<span className="font-medium text-danger">- {formatCurrency(preview.totalFee)}</span>
					</div>
					<div className="pt-2 mt-1">
						<div className="flex justify-between">
							<span className="font-medium">Valor liquido:</span>
							<span className="font-bold text-lg text-success">{formatCurrency(preview.totalNetAmount)}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<div className="flex items-center justify-between gap-3 mb-4">
					<div className="flex items-center gap-2">
						<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
						<h4 className="font-semibold text-sm text-foreground">Distribuição por Adquirente</h4>
					</div>
					<span className="text-xs text-foreground/60">{preview.items.length} adquirentes</span>
				</div>
				<PreviewItemsTable items={preview.items} />
			</div>
		</div>
	);
}

function PlatformPayoutForm({
	onClose,
	onCreated,
	availabilityPromise,
	accountsPromise,
}: {
	onClose: () => void;
	onCreated: () => void;
	availabilityPromise: Promise<ApiResponse<AdminPreviewPlatformPayoutData>>;
	accountsPromise: Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>>;
}) {
	const [isPending, startTransition] = useTransition();
	const [amountFormatted, setAmountFormatted] = useState('');
	const autoInputRef = useRef<CurrencyCentsInputRef>(null);
	const manualRefsMap = useRef<Record<string, CurrencyCentsInputRef | null>>({});
	const [notes, setNotes] = useState('');
	const [distributionMode, setDistributionMode] = useState<'auto' | 'manual'>('auto');
	const [userSelectedAccountId, setUserSelectedAccountId] = useState<string | null>(null);
	const [previewPromise, setPreviewPromise] = useState<Promise<PreviewResponse> | null>(null);
	const { contains } = useFilter({ sensitivity: 'base' });
	const [availabilityPromiseState, setAvailabilityPromiseState] = useState(availabilityPromise);
	const [accountsPromiseState] = useState(accountsPromise);
	const availabilityResponse = use(availabilityPromiseState);
	const accountsResponse = use(accountsPromiseState);
	const availability = availabilityResponse?.data ?? null;
	const availabilityError = availabilityResponse?.error?.message ?? null;
	const accountsError = accountsResponse?.error?.message ?? null;

	const availabilityItems = availability?.items ?? [];
	const totalAvailableAmount = availability?.totalAvailableAmount ?? 0;
	const accounts = (accountsResponse?.data?.items ?? []).filter((account) => !account.deactivatedAt);
	const defaultAccountId = accounts.find((account) => account.isActive)?.id ?? accounts[0]?.id ?? null;
	const selectedAccountId = userSelectedAccountId ?? defaultAccountId;
	const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;
	const selectedAccountMaskedPixKey = selectedAccount
		? maskPixKey(selectedAccount.pixKey, selectedAccount.pixKeyType)
		: '';

	const {
		manualAmounts,
		selectedAcquirers,
		selectedAcquirerKey,
		selectedAcquirerItems,
		availableAcquirerItems,
		manualTotalAmount,
		setSelectedAcquirerKey,
		handleManualAmountChange,
		handleAddAcquirer,
		handleRemoveAcquirer,
	} = useManualDistributionState(availabilityItems);

	const amountInCents = formattedCurrencyToCents(amountFormatted) ?? 0;
	const isInsufficientAvailable =
		distributionMode === 'auto' &&
		amountInCents > 0 &&
		totalAvailableAmount > 0 &&
		amountInCents > totalAvailableAmount;
	const isManualTotalExceeded =
		distributionMode === 'manual' && manualTotalAmount > 0 && manualTotalAmount > totalAvailableAmount;

	const manualItemsForCreate = buildManualRequest(availabilityItems, selectedAcquirers, manualAmounts);
	const hasAmount = distributionMode === 'auto' ? amountInCents > 0 : manualItemsForCreate.length > 0;
	const canCreate = !!selectedAccountId && hasAmount && !isInsufficientAvailable && !isManualTotalExceeded;

	const handleModeChange = (key: string) => {
		const nextMode = key === 'manual' ? 'manual' : 'auto';
		setDistributionMode(nextMode);
		if (nextMode === 'auto') {
			setAmountFormatted('');
		}
		setPreviewPromise(null);
	};

	const handleUseFullBalance = () => {
		if (totalAvailableAmount <= 0) return;
		autoInputRef.current?.setValueInCents(totalAvailableAmount);
		setPreviewPromise(adminPreviewPlatformPayout({ totalAmount: totalAvailableAmount }));
	};

	const updateManualPreview = (nextSelected: Set<string>, nextAmounts: Record<string, string>) => {
		const items = buildManualRequest(availabilityItems, nextSelected, nextAmounts);
		if (items.length === 0) {
			setPreviewPromise(null);
			return;
		}
		setPreviewPromise(
			adminPreviewPlatformPayout({
				acquirerItems: items,
			})
		);
	};

	const handleRemoveWithPreview = (acquirerId: string) => {
		const nextSelected = new Set(selectedAcquirers);
		nextSelected.delete(acquirerId);
		const nextAmounts = { ...manualAmounts };
		delete nextAmounts[acquirerId];
		handleRemoveAcquirer(acquirerId);
		updateManualPreview(nextSelected, nextAmounts);
	};

	const refreshAvailability = () => {
		setAvailabilityPromiseState(adminPreviewPlatformPayout({ includeAllAcquirers: true }));
		setPreviewPromise(null);
	};

	const handleCreate = () => {
		if (!canCreate) return;

		startTransition(async () => {
			const payload =
				distributionMode === 'manual'
					? {
							acquirerItems: manualItemsForCreate,
						}
					: {
							totalAmount: amountInCents,
						};

			const response = await adminCreatePlatformPayout({
				platformPayoutAccountId: selectedAccountId,
				...payload,
				notes: notes.trim() || undefined,
			});

			if (response?.error) {
				toast('Erro ao criar saque', {
					description: response.error.message ?? 'Tente novamente mais tarde.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				refreshAvailability();
				return;
			}

			toast('Saque criado', {
				description: response?.message ?? 'O saque foi criado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			refreshAvailability();
			onCreated();
			onClose();
		});
	};

	return (
		<>
			<Modal.Body className="flex flex-col gap-4">
				{availabilityError ? (
					<div className="flex items-center gap-2 rounded-lg bg-danger/10">
						<Icon icon={AlertCircleIcon} className="icon-sm text-danger shrink-0" />
						<span className="text-sm text-danger">{availabilityError}</span>
					</div>
				) : (
					<div className="rounded-xl bg-card">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full flex items-center justify-center bg-success-soft-hover">
								<Icon icon={Wallet01Icon} className="icon-sm text-success" />
							</div>
							<div>
								<span className="text-sm text-foreground/70">Disponível para saque</span>
								<p className="text-xl font-bold text-success">{formatCurrency(totalAvailableAmount)}</p>
							</div>
						</div>
						{totalAvailableAmount <= 0 && (
							<div className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
								<Icon icon={AlertCircleIcon} className="icon-xs" />
								<span>Sem saldo disponível nas adquirentes para saque.</span>
							</div>
						)}
					</div>
				)}

				{accountsError ? (
					<div className="flex items-center gap-2 rounded-lg bg-danger/10">
						<Icon icon={AlertCircleIcon} className="icon-sm text-danger shrink-0" />
						<span className="text-sm text-danger">{accountsError}</span>
					</div>
				) : accounts.length > 0 ? (
					<div className="rounded-xl flex flex-col gap-4 bg-card">
						<div className="flex items-center gap-2">
							<Icon icon={Key01Icon} className="icon-sm text-accent" />
							<h4 className="font-semibold text-sm text-foreground">Conta de Destino</h4>
						</div>

						<Select
							variant="secondary"
							className="w-full"
							placeholder="Selecione a conta de destino"
							value={selectedAccountId ?? undefined}
							onChange={(key) => setUserSelectedAccountId(key ? String(key) : null)}
						>
							<Label>Conta de destino</Label>
							<Select.Trigger>
								<Select.Value>
									{selectedAccount ? (
										<div className="flex items-center gap-3">
											<Chip variant="soft" size="sm" className="gap-1">
												{pixKeyTypeParse[selectedAccount.pixKeyType as keyof typeof pixKeyTypeParse]?.icon}
												{pixKeyTypeParse[selectedAccount.pixKeyType as keyof typeof pixKeyTypeParse]?.label ??
													selectedAccount.pixKeyType}
											</Chip>
											<div className="flex min-w-0 flex-col">
												<span className="text-sm font-medium truncate">
													{selectedAccount.holderName ?? 'Titular não informado'}
												</span>
												<span className="text-xs text-foreground/60 font-mono truncate">
													{selectedAccountMaskedPixKey} • {selectedAccount.bankName ?? 'Banco não informado'}
												</span>
											</div>
										</div>
									) : (
										'Selecione uma conta'
									)}
								</Select.Value>
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{accounts.map((account) => {
										const parse = pixKeyTypeParse[account.pixKeyType as keyof typeof pixKeyTypeParse];
										const label = parse?.label ?? account.pixKeyType;
										const maskedPixKey = maskPixKey(account.pixKey, account.pixKeyType);
										return (
											<ListBox.Item
												key={account.id}
												id={account.id}
												textValue={`${label} ${account.holderName ?? ''} ${account.bankName ?? ''} ${maskedPixKey}`}
											>
												<div className="flex items-center gap-3">
													<Chip
														variant="soft"
														color={mapParseColorToChipColor(parse?.color ?? 'default')}
														size="sm"
														className="gap-1"
													>
														{parse?.icon}
														{label}
													</Chip>
													<div className="flex min-w-0 flex-col">
														<span className="text-sm font-medium truncate">
															{account.holderName ?? 'Titular não informado'}
														</span>
														<span className="text-xs text-foreground/60 font-mono truncate">
															{maskedPixKey} • {account.bankName ?? 'Banco não informado'}
														</span>
													</div>
												</div>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										);
									})}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
				) : (
					<div className="flex items-center gap-2 rounded-lg bg-danger/10">
						<Icon icon={AlertCircleIcon} className="icon-sm text-danger shrink-0" />
						<span className="text-sm text-danger">
							Nenhuma conta de destino cadastrada. Configure uma conta antes de solicitar o saque.
						</span>
					</div>
				)}


				<div className="rounded-xl flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<Icon icon={Wallet01Icon} className="icon-sm text-accent" />
						<h4 className="font-semibold text-sm text-foreground">Distribuição do Saque</h4>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex flex-col gap-1">
							<span className="text-sm text-foreground">
								{distributionMode === 'manual'
									? 'Defina valores por adquirente.'
									: 'Distribuição automática entre adquirentes.'}
							</span>
							<span className="text-xs text-foreground/60">
								{distributionMode === 'manual'
									? 'Ative para escolher valores individualmente.'
									: 'Ative para escolher manualmente.'}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-foreground/60">Automático</span>
							<Switch
								aria-label="Distribuição por adquirente"
								isSelected={distributionMode === 'manual'}
								onChange={(value) => handleModeChange(value ? 'manual' : 'auto')}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
							<span className="text-xs text-foreground/60">Por adquirente</span>
						</div>
					</div>
				</div>

				{distributionMode === 'auto' ? (
					<TextField variant="secondary" isInvalid={isInsufficientAvailable} aria-label="Valor total a sacar">
						<div className="flex items-center justify-between">
							<Label>Valor total a sacar</Label>
							<Button variant="ghost" size="sm" onPress={handleUseFullBalance} isDisabled={totalAvailableAmount <= 0}>
								<Icon icon={WalletRemove01Icon} className="icon-xs" />
								Sacar tudo
							</Button>
						</div>
						<CurrencyCentsInput
							ref={autoInputRef}
							variant="secondary"
							placeholder="R$ 0,00"
							onValueChange={(v) => {
								setAmountFormatted(v);
								const cents = formattedCurrencyToCents(v) ?? 0;
								if (cents <= 0) {
									setPreviewPromise(null);
									return;
								}
								setPreviewPromise(adminPreviewPlatformPayout({ totalAmount: cents }));
							}}
						/>
						{isInsufficientAvailable && (
							<FieldError>
								Saldo insuficiente. Você possui {formatCurrency(totalAvailableAmount)} disponível.
							</FieldError>
						)}
					</TextField>
				) : (
					<div className="flex flex-col gap-3">
						{availabilityItems.length === 0 ? (
							<div className="flex items-center gap-2 rounded-lg bg-danger/10 p-4">
								<Icon icon={AlertCircleIcon} className="icon-sm text-danger shrink-0" />
								<span className="text-sm text-danger">Nenhuma adquirente disponível para saque.</span>
							</div>
						) : (
							<>
								<Autocomplete
									variant="secondary"
									className="w-full"
									placeholder="Buscar adquirente"
									selectionMode="single"
									value={selectedAcquirerKey}
									onChange={(key) => {
										if (!key) return;
										setSelectedAcquirerKey(key);
										const nextSelected = new Set(selectedAcquirers);
										nextSelected.add(String(key));
										handleAddAcquirer(String(key));
										updateManualPreview(nextSelected, manualAmounts);
									}}
								>
									<Label>Selecionar adquirente</Label>
									<Autocomplete.Trigger>
										<Autocomplete.Value />
										<Autocomplete.ClearButton />
										<Autocomplete.Indicator />
									</Autocomplete.Trigger>
									<Autocomplete.Popover>
										<Autocomplete.Filter filter={contains}>
											<SearchField autoFocus name="search" variant="secondary">
												<SearchField.Group>
													<SearchField.SearchIcon />
													<SearchField.Input placeholder="Busque por adquirente" />
													<SearchField.ClearButton />
												</SearchField.Group>
											</SearchField>
											<ListBox renderEmptyState={() => <EmptyState>Nenhuma adquirente encontrada</EmptyState>}>
												{availableAcquirerItems.map((item) => {
													const feeModeLabel = feeChargeModeParse[item.payoutFeeMode]?.label ?? item.payoutFeeMode;
													const feeDetails = formatFeeDetails(item.payoutFeeFixed, item.payoutFeePercentage);
													return (
														<ListBox.Item
															key={item.acquirerId}
															id={item.acquirerId}
															textValue={`${item.acquirerName} ${item.acquirerCode}`}
														>
															<div className="flex w-full items-center justify-between gap-3">
																<div className="flex items-center gap-2">
																	{item.acquirerLogoUrl ? (
																		<Avatar size="sm" className="size-5 shrink-0">
																			<Avatar.Image src={item.acquirerLogoUrl} alt={item.acquirerName} />
																			<Avatar.Fallback>
																				<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
																			</Avatar.Fallback>
																		</Avatar>
																	) : (
																		<div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-card">
																			<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
																		</div>
																	)}
																	<div className="flex flex-col">
																		<span className="text-sm font-medium">{item.acquirerName}</span>
																		<span className="text-xs text-foreground/70 font-mono">{item.acquirerCode}</span>
																	</div>
																</div>
																<div className="flex flex-col items-end text-xs">
																	<span className="text-success">
																		Disponível: {formatCurrency(item.availableBalance)}
																	</span>
																	<span className="text-foreground/80">Taxa: {feeDetails}</span>
																	<span className="text-foreground/70">{feeModeLabel}</span>
																</div>
																<ListBox.ItemIndicator />
															</div>
														</ListBox.Item>
													);
												})}
											</ListBox>
										</Autocomplete.Filter>
									</Autocomplete.Popover>
								</Autocomplete>

								{selectedAcquirerItems.length === 0 ? (
									<div className="rounded-lg bg-card p-4 text-sm text-foreground/60">
										Selecione uma adquirente para definir o valor de saque.
									</div>
								) : (
									selectedAcquirerItems.map((item) => {
										const feeModeLabel = feeChargeModeParse[item.payoutFeeMode]?.label ?? item.payoutFeeMode;
										const feeDetails = formatFeeDetails(item.payoutFeeFixed, item.payoutFeePercentage);
										return (
											<div key={item.acquirerId} className="rounded-lg bg-surface-secondary p-4 flex flex-col gap-3">
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div className="flex items-center gap-2">
														{item.acquirerLogoUrl ? (
															<Avatar size="sm" className="size-6 shrink-0">
																<Avatar.Image src={item.acquirerLogoUrl} alt={item.acquirerName} />
																<Avatar.Fallback>
																	<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
																</Avatar.Fallback>
															</Avatar>
														) : (
															<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card">
																<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
															</div>
														)}
														<div className="flex flex-col">
															<span className="text-sm font-medium">{item.acquirerName}</span>
															<span className="text-xs text-foreground/70 font-mono">{item.acquirerCode}</span>
														</div>
													</div>
													<Button
														isIconOnly
														variant="tertiary"
														className="text-danger"
														onPress={() => handleRemoveWithPreview(item.acquirerId)}
													>
														<Icon icon={Delete02Icon} className="icon-sm" />
													</Button>
												</div>
												<div className="flex flex-wrap items-center gap-3 text-xs">
													<span className="text-success">Disponível: {formatCurrency(item.availableBalance)}</span>
													<span className="text-foreground/80">Taxa: {feeDetails}</span>
													<span className="text-foreground/70">{feeModeLabel}</span>
												</div>
												<div className="flex flex-wrap items-center gap-2">
													<CurrencyCentsInput
														ref={(el) => { manualRefsMap.current[item.acquirerId] = el; }}
														variant="secondary"
														placeholder="R$ 0,00"
														onValueChange={(v) => {
															handleManualAmountChange(item.acquirerId, v);
															const nextAmounts = { ...manualAmounts, [item.acquirerId]: v };
															updateManualPreview(selectedAcquirers, nextAmounts);
														}}
													/>
													<Button
														variant="ghost"
														size="sm"
														onPress={() => manualRefsMap.current[item.acquirerId]?.setValueInCents(item.availableBalance)}
														isDisabled={item.availableBalance <= 0}
													>
														Sacar tudo
													</Button>
												</div>
											</div>
										);
									})
								)}

								{isManualTotalExceeded && (
									<FieldError>
										O valor total informado excede o saldo disponivel de {formatCurrency(totalAvailableAmount)}.
									</FieldError>
								)}
							</>
						)}
					</div>
				)}

				{previewPromise && (
					<Suspense fallback={<PreviewSkeleton />}>
						<PreviewSection previewPromise={previewPromise} />
					</Suspense>
				)}

				<div className="flex flex-col gap-2">
					<Label htmlFor="notes">Observações (opcional)</Label>
					<TextArea
						variant="secondary"
						id="notes"
						placeholder="Adicione uma observação..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={2}
					/>
				</div>
			</Modal.Body>
			<Modal.Footer className="flex justify-end gap-2">
				<Button variant="secondary" onPress={onClose}>
					Cancelar
				</Button>
				<AsyncButton variant="primary" onPress={handleCreate} isPending={isPending} isDisabled={!canCreate}>
					<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
					Confirmar Saque
				</AsyncButton>
			</Modal.Footer>
		</>
	);
}

export function AdminNewPlatformPayoutModal({
	isOpen,
	onOpenChange,
	onCreated,
	availabilityPromise,
	accountsPromise,
}: AdminNewPlatformPayoutModalProps) {
	const handleClose = () => {
		onOpenChange(false);
	};
	const hasDataPromises = !!availabilityPromise && !!accountsPromise;
	const heading = 'Novo Saque da Plataforma';
	const description = 'Saque distribuído automaticamente entre as adquirentes';

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Wallet01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>{heading}</Modal.Heading>
						<p className="text-sm text-muted">{description}</p>
					</Modal.Header>
					{isOpen && hasDataPromises && (
						<Suspense fallback={<FormSkeleton />}>
							<PlatformPayoutForm
								onClose={handleClose}
								onCreated={onCreated}
								availabilityPromise={availabilityPromise}
								accountsPromise={accountsPromise}
							/>
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
