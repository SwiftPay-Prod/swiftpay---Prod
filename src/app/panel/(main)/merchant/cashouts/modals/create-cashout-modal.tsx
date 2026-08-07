'use client';

import { useState, useEffect, Suspense, use, useActionState, useDeferredValue, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
	Modal,
	Button,
	Select,
	Label,
	ListBox,
	TextField,
	Skeleton,
	Chip,
	FieldError,
	Tooltip,
	Switch,
} from '@heroui/react';
import {
	Alert01Icon,
	CheckmarkCircle02Icon,
	InformationCircleIcon,
	MoneyExchange01Icon,
	Wallet01Icon,
	WalletRemove01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { createCashout, previewCashout } from '@/app/actions/merchant/cashouts';
import { useEnvironment } from '@/contexts/environment-context';
import { pixKeyTypeParse, mapParseColorToChipColor } from '@/parse';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { maskPixKey } from '@/utils/input-masks';
import { AsyncButton } from '@/components/ui/async-button';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import type { CurrencyCentsInputRef } from '@/components/ui/currency-cents-input';
import { toast } from '@heroui/react';
import type { ListCashoutAccountsData } from '@/types/merchant/cashout-accounts';
import type { ReadBalanceData } from '@/types/merchant/balance';
import type { PreviewCashoutData } from '@/types/merchant/cashouts';
import type { ApiResponse } from '@/types/common';

interface CashoutFormValues {
	accountId: string;
}

type DependenciesPromise = Promise<[ApiResponse<ListCashoutAccountsData>, ApiResponse<ReadBalanceData>]>;

interface CreateCashoutModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	dependenciesPromise: DependenciesPromise | null;
	onSuccess: () => void;
}

interface FormState {
	error: string | null;
}

function FormSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-20 rounded-lg" />
			<Skeleton className="h-16 rounded-lg" />
			<Skeleton className="h-16 rounded-lg" />
		</div>
	);
}

function FormContent({
	dependenciesPromise,
	merchantId,
	onClose,
	onSuccess,
}: {
	dependenciesPromise: DependenciesPromise;
	merchantId: string;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const { isSandboxVisible } = useEnvironment();
	const [accountsResponse, balanceResponse] = use(dependenciesPromise);

	const accounts = accountsResponse?.data?.items ?? [];
	const balance = balanceResponse?.data ?? null;
	const availableBalance = balance?.balance.available ?? 0;
	const withdrawNowAvailable = balance?.balance.withdrawNowAvailable ?? availableBalance;
	const requiresFullWithdrawalNow = balance?.balance.requiresFullWithdrawalNow ?? false;

	const acquirerBucketBalances = balance?.balance.acquirerBucketBalances ?? [];

	const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

	const {
		control,
		getValues,
		reset,
	} = useForm<CashoutFormValues>({
		defaultValues: {
			accountId: defaultAccount?.id ?? '',
		},
	});

	const selectedAccountId = useWatch({ control, name: 'accountId' });

	const [fetchedPreview, setFetchedPreview] = useState<PreviewCashoutData | null>(null);
	const [consolidateAll, setConsolidateAll] = useState(false);
	const [bucketIndex, setBucketIndex] = useState(0);
	const [cycleCount, setCycleCount] = useState(0);
	const [amountFormatted, setAmountFormatted] = useState('');
	const amountCentsInputRef = useRef<CurrencyCentsInputRef>(null);

	const deferredAmountFormatted = useDeferredValue(amountFormatted);

	const selectedBucket =
		acquirerBucketBalances.length > 0 ? (acquirerBucketBalances[bucketIndex] ?? acquirerBucketBalances[0]) : null;
	const selectedBucketBalance = selectedBucket?.balance ?? withdrawNowAvailable;
	const selectedMerchantAcquirerId = selectedBucket?.merchantAcquirerId ?? null;

	const effectiveAmountCents = consolidateAll
		? availableBalance
		: (formattedCurrencyToCents(amountFormatted) ?? 0);

	const isLoadingPreview = amountFormatted !== '' && amountFormatted !== deferredAmountFormatted;

	const preview =
		(consolidateAll && availableBalance > 0) || (formattedCurrencyToCents(deferredAmountFormatted) ?? 0) > 0
			? fetchedPreview
			: null;

	const [state, formAction, isPending] = useActionState(
		async (): Promise<FormState> => {
			const currentAccountId = getValues('accountId');

			if (!currentAccountId) {
				return { error: 'Selecione uma conta de saque' };
			}

			const amount = consolidateAll
				? (preview?.amount ?? availableBalance)
				: (formattedCurrencyToCents(amountFormatted) ?? 0);
			if (amount <= 0) {
				return { error: 'Informe um valor válido' };
			}

			if (preview && !preview.hasSufficientBalance) {
				if (preview.requiresFullWithdrawalNow) {
					return { error: `Para continuar, saque exatamente ${formatCurrency(preview.withdrawNowAvailable)} agora.` };
				}

				return { error: 'Saldo insuficiente' };
			}

			if (preview && preview.netAmount < 1) {
				return { error: 'O valor líquido a receber deve ser de no mínimo R$ 0,01.' };
			}

			const response = await createCashout(
				merchantId,
				amount,
				selectedAccountId,
				selectedMerchantAcquirerId,
				consolidateAll
			);

			if (response?.error) {
				return { error: response.error.message ?? 'Erro ao solicitar saque' };
			}

			toast('Saque solicitado', {
				description: response?.message ?? 'Saque solicitado com sucesso!',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			onSuccess();
			onClose();
			return { error: null };
		},
		{ error: null }
	);

	useEffect(() => {
		const amountCents = consolidateAll ? availableBalance : (formattedCurrencyToCents(deferredAmountFormatted) ?? 0);

		if (amountCents <= 0) return;

		const effectiveAvailableBalance = consolidateAll ? availableBalance : selectedBucketBalance;

		let cancelled = false;

		previewCashout(merchantId, {
			amount: amountCents,
			availableBalance: effectiveAvailableBalance,
			merchantAcquirerId: !consolidateAll ? (selectedMerchantAcquirerId ?? undefined) : undefined,
			consolidateAllAcquirers: consolidateAll || undefined,
		}).then((response) => {
			if (!cancelled && response?.data) {
				setFetchedPreview(response.data);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [
		deferredAmountFormatted,
		merchantId,
		selectedBucketBalance,
		selectedMerchantAcquirerId,
		consolidateAll,
		availableBalance,
		bucketIndex,
	]);

	function handleCycleBucket() {
		const nextIndex = (bucketIndex + 1) % acquirerBucketBalances.length;
		setBucketIndex(nextIndex);
		setCycleCount((c) => c + 1);
		setFetchedPreview(null);
		reset({ accountId: getValues('accountId') });
		setAmountFormatted('');
	}

	function handleConsolidateAllChange(value: boolean) {
		setConsolidateAll(value);
		setFetchedPreview(null);
		setBucketIndex(0);
		setCycleCount(0);
		reset({ accountId: getValues('accountId') });
		setAmountFormatted('');
	}

	function handleUseFullBalance() {
		amountCentsInputRef.current?.setValueInCents(selectedBucketBalance);
	}

	const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
	const selectedAccountMaskedPixKey = selectedAccount
		? maskPixKey(selectedAccount.pixKey, selectedAccount.pixKeyType)
		: '';
	const amount = effectiveAmountCents;
	const previewWithdrawNowAvailable = preview?.withdrawNowAvailable ?? selectedBucketBalance;
	const previewNetAmount = preview?.netAmount ?? null;
	const amountError = !consolidateAll
		? preview && !preview.hasSufficientBalance
			? `Saldo insuficiente. Você possui ${formatCurrency(previewWithdrawNowAvailable)} disponível para saque agora.`
			: previewNetAmount !== null && previewNetAmount < 1
				? 'O valor líquido a receber deve ser de no mínimo R$ 0,01.'
				: null
		: null;
	const isValid = !!selectedAccountId && amount > 0 && preview !== null && !amountError;

	if (accountsResponse?.error || balanceResponse?.error) {
		return (
			<>
				<Modal.Body>
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<div className="w-16 h-16 rounded-full bg-danger-soft-hover flex items-center justify-center">
							<Icon icon={Alert01Icon} className="icon-lg text-danger" />
						</div>
						<p className="text-sm text-danger">
							{accountsResponse?.error?.message || balanceResponse?.error?.message || 'Erro ao carregar dados'}
						</p>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="primary" onPress={onClose}>
						Fechar
					</Button>
				</Modal.Footer>
			</>
		);
	}

	if (accounts.length === 0) {
		return (
			<>
				<Modal.Body>
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<div className="w-16 h-16 rounded-full bg-warning-soft-hover flex items-center justify-center">
							<Icon icon={Alert01Icon} className="icon-lg text-warning" />
						</div>
						<div className="text-center">
							<h4 className="font-semibold text-foreground mb-2">Nenhuma conta cadastrada</h4>
							<p className="text-sm text-muted">
								Você precisa cadastrar uma conta de saque antes de solicitar um saque.
							</p>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="primary" onPress={onClose}>
						Entendi
					</Button>
				</Modal.Footer>
			</>
		);
	}

	return (
		<form action={formAction}>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					<div
						className={`rounded-lg p-4 ${isSandboxVisible ? 'bg-warning/10 border border-warning/30' : 'bg-surface-secondary'}`}
					>
						{isSandboxVisible && (
							<div className="flex items-center gap-2 text-xs text-warning mb-3 pb-3 border-b border-warning-soft-hover">
								<Icon icon={Alert01Icon} className="icon-xs shrink-0" />
								<span className="font-medium">
									Ambiente Sandbox - Este saldo é fictício e não pode ser sacado de verdade
								</span>
							</div>
						)}
						<div className="flex items-center gap-3 mb-3">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSandboxVisible ? 'bg-warning-soft-hover' : 'bg-success-soft-hover'}`}
							>
								<Icon icon={Wallet01Icon} className={`icon-sm ${isSandboxVisible ? 'text-warning' : 'text-success'}`} />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1.5">
									<span className="text-sm text-foreground/60">
										{consolidateAll ? 'Saldo total disponível' : 'Disponível para saque agora'}
										{isSandboxVisible && <span className="text-warning"> (Sandbox)</span>}
									</span>
									{!consolidateAll && acquirerBucketBalances.length > 1 && (
										<Tooltip delay={0}>
											<Tooltip.Trigger aria-label="Informações sobre distribuição do saldo">
												<Icon icon={InformationCircleIcon} className="icon-xs text-muted cursor-default" />
											</Tooltip.Trigger>
											<Tooltip.Content className="max-w-64">
												<p className="text-xs">
													Seu saldo está distribuído em {acquirerBucketBalances.length} grupos de liquidação separados.
													Cada grupo representa um ciclo de pagamentos com disponibilidade independente. Use o botão ao
													lado para alternar entre os grupos e sacar um de cada vez, ou ative &ldquo;Sacar saldo total
													disponível&rdquo; para consolidar tudo em uma única operação.
												</p>
											</Tooltip.Content>
										</Tooltip>
									)}
								</div>
								<div className="flex items-center gap-2">
									<p
										key={cycleCount}
										className={`text-xl font-bold ${isSandboxVisible ? 'text-warning' : 'text-success'} ${cycleCount > 0 ? 'animate-balance-slide' : ''}`}
									>
										{formatCurrency(consolidateAll ? availableBalance : selectedBucketBalance)}
									</p>
									{!consolidateAll && acquirerBucketBalances.length > 1 && (
										<Tooltip delay={0}>
											<Button
												isIconOnly
												size="sm"
												variant="ghost"
												onPress={handleCycleBucket}
												aria-label="Alternar saldo disponível"
												className="bg-accent-soft text-accent hover:bg-accent-soft-hover"
											>
												<Icon
													key={cycleCount}
													icon={MoneyExchange01Icon}
													className={`icon-sm ${cycleCount > 0 ? 'animate-exchange-pop' : ''}`}
												/>
											</Button>
											<Tooltip.Content>
												Alternar para o próximo grupo de saldo ({bucketIndex + 1}/{acquirerBucketBalances.length})
											</Tooltip.Content>
										</Tooltip>
									)}
								</div>
								{requiresFullWithdrawalNow && !consolidateAll && (
									<p className="text-xs text-muted">Saldo total disponível: {formatCurrency(availableBalance)}</p>
								)}
							</div>
						</div>
						{balance && balance.balance.reserved > 0 && (
							<div className="flex items-center gap-2 text-xs text-warning">
								<Icon icon={InformationCircleIcon} className="icon-xs" />
								<span>Você possui {formatCurrency(balance.balance.reserved)} reservado em saques pendentes</span>
							</div>
						)}
					</div>
					{requiresFullWithdrawalNow && (
						<div className="flex items-center justify-between gap-3 rounded-lg border border-divider p-3">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium">Sacar saldo total disponível</span>
								<span className="text-xs text-muted">
									Uma taxa de saque é cobrada por cada operação de transferência necessária para liquidar o saldo
									acumulado.
								</span>
							</div>
							<Switch
								isSelected={consolidateAll}
								onChange={handleConsolidateAllChange}
								aria-label="Sacar saldo total disponível"
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</div>
					)}
					<div className="flex flex-col gap-4">
						<Controller
							name="accountId"
							control={control}

							render={({ field }) => (
								<Select
									variant="secondary"
									className="w-full"
									value={field.value}
									onChange={(key) => field.onChange(key as string)}
								>
									<Label>Conta de destino</Label>
									<Select.Trigger>
										<Select.Value>
											{selectedAccount ? (
												<div className="flex items-center gap-3">
													<Chip variant="soft" color="default" size="sm" className="gap-1">
														{pixKeyTypeParse[selectedAccount.pixKeyType].icon}
														{pixKeyTypeParse[selectedAccount.pixKeyType].label}
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
												const keyTypeParse = pixKeyTypeParse[account.pixKeyType];
												const maskedPixKey = maskPixKey(account.pixKey, account.pixKeyType);
												return (
													<ListBox.Item
														key={account.id}
														id={account.id}
														textValue={`${account.holderName ?? ''} ${account.bankName ?? ''} ${maskedPixKey}`}
													>
														<div className="flex items-center gap-3">
															<Chip
																variant="soft"
																color={mapParseColorToChipColor(keyTypeParse.color)}
																size="sm"
																className="gap-1"
															>
																{keyTypeParse.icon}
																{keyTypeParse.label}
															</Chip>
															<div className="flex min-w-0 flex-col">
																<span className="text-sm font-medium truncate">
																	{account.holderName ?? 'Titular não informado'}
																</span>
																<span className="text-xs text-foreground/60 font-mono truncate">
																	{maskedPixKey} • {account.bankName ?? 'Banco não informado'}
																</span>
															</div>
															{account.isDefault && (
																<Chip variant="soft" color="accent" size="sm">
																	Padrão
																</Chip>
															)}
														</div>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												);
											})}
										</ListBox>
									</Select.Popover>
								</Select>
							)}
						/>
						<TextField
							variant="secondary"
							isInvalid={!consolidateAll && !!amountError}
							isDisabled={consolidateAll}
							aria-label="Valor total a sacar"
						>
							<div className="flex items-center justify-between">
								<Label>Valor total a sacar</Label>
								{!consolidateAll && (
									<Button variant="ghost" size="sm" onPress={handleUseFullBalance}>
										Sacar tudo
									</Button>
								)}
							</div>
							<CurrencyCentsInput
								ref={amountCentsInputRef}
								key={cycleCount}
								variant="secondary"
								disabled={consolidateAll}
								onValueChange={(v) => setAmountFormatted(v)}
							/>
							{amountError && <FieldError>{amountError}</FieldError>}
						</TextField>
					</div>

					{amount > 0 && (
						<div className="rounded-lg bg-surface-secondary p-2">
							{isLoadingPreview ? (
								<div className="flex flex-col gap-2">
									<Skeleton className="h-5 w-full rounded" />
									<Skeleton className="h-5 w-full rounded" />
									<div className="border-t border-divider pt-2 mt-1">
										<Skeleton className="h-7 w-full rounded" />
									</div>
								</div>
							) : preview ? (
								<div className="flex flex-col gap-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted">Valor total a sacar:</span>
										<span className="font-medium">{formatCurrency(preview.amount)}</span>
									</div>
									{preview.isConsolidated && preview.operationCount > 1 && (
										<div className="flex justify-between">
											<span className="text-muted">Operações de transferência:</span>
											<span className="font-medium">{preview.operationCount}x</span>
										</div>
									)}
									<div className="flex justify-between">
										<span className="text-muted">
											{preview.isConsolidated && preview.operationCount > 1
												? `Taxa de saque (${preview.operationCount}x):`
												: 'Taxa de saque:'}
										</span>
										<span className="font-medium text-danger">- {formatCurrency(preview.fee)}</span>
									</div>
									<div className="border-t border-divider pt-2 mt-1">
										<div className="flex justify-between">
											<span className="font-medium text-success">Você vai receber:</span>
											<span className="font-bold text-lg text-success">{formatCurrency(preview.netAmount)}</span>
										</div>
									</div>
								</div>
							) : null}
						</div>
					)}

					{state.error && (
						<div className="flex items-center gap-2 text-sm text-danger">
							<Icon icon={Alert01Icon} className="icon-sm" />
							<span>{state.error}</span>
						</div>
					)}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
					Cancelar
				</Button>
				<AsyncButton type="submit" variant="primary" isPending={isPending} isDisabled={!isValid}>
					<Icon icon={WalletRemove01Icon} className="icon-sm" />
					Solicitar Saque
				</AsyncButton>
			</Modal.Footer>
		</form>
	);
}

export function CreateCashoutModal({
	isOpen,
	onOpenChange,
	merchantId,
	dependenciesPromise,
	onSuccess,
}: CreateCashoutModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-success text-success-foreground">
							<Icon icon={WalletRemove01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Solicitar Saque</Modal.Heading>
						<p className="text-sm text-muted">Transfira o saldo disponível para sua conta bancária</p>
					</Modal.Header>
					{dependenciesPromise && (
						<Suspense
							fallback={
								<Modal.Body>
									<FormSkeleton />
								</Modal.Body>
							}
						>
							<FormContent
								dependenciesPromise={dependenciesPromise}
								merchantId={merchantId}
								onClose={handleClose}
								onSuccess={onSuccess}
							/>
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
