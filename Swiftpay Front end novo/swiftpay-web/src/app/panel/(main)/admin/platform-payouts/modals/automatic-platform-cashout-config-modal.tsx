'use client';

import { Suspense, use, useState, useTransition } from 'react';
import {
	Modal,
	Button,
	Switch,
	Select,
	ListBox,
	Chip,
	TextField,
	Input,
	Label,
	Description,
	Skeleton,
	toast,
} from '@heroui/react';
import { MoneyReceiveSquareIcon } from '@hugeicons/core-free-icons';
import { NumericFormat } from 'react-number-format';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { adminUpdatePlatformSettings } from '@/app/actions/admin/platform-settings';
import { automaticCashoutFrequencyParse, mapParseColorToChipColor, pixKeyTypeParse } from '@/parse';
import { AutomaticCashoutFrequency, UserRole } from '@/types/enums';
import { useUser } from '@/contexts/user-context';
import { currencyNumericProps, maskPixKey } from '@/utils/input-masks';
import { formatDate } from '@/utils/datetime';
import type { ApiResponse, Paginated } from '@/types/common';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';

type SettingsPromise = Promise<ApiResponse<AdminPlatformSettingsData>>;
type PayoutAccountsPromise = Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>>;

interface AutomaticPlatformCashoutConfigModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	settingsPromise: SettingsPromise | null;
	payoutAccountsPromise: PayoutAccountsPromise | null;
	onSuccess: () => void;
}

function ConfigSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-12 rounded-lg" />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
			</div>
		</div>
	);
}

function ConfigContent({
	settingsPromise,
	payoutAccountsPromise,
	onClose,
	onSuccess,
}: {
	settingsPromise: SettingsPromise;
	payoutAccountsPromise: PayoutAccountsPromise;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const response = use(settingsPromise);
	const settings = response?.data;
	const { user } = useUser();
	const isGod = (user?.role ?? '').toString().toLowerCase() === UserRole.God.toLowerCase();
	const payoutAccountsResponse = use(payoutAccountsPromise);
	const payoutAccounts = (payoutAccountsResponse?.data?.items ?? []).filter((account) => account.isActive && !account.deactivatedAt);

	const [isPending, startTransition] = useTransition();
	const [isEnabled, setIsEnabled] = useState(settings?.isAutomaticCashoutEnabled ?? false);
	const [frequency, setFrequency] = useState<AutomaticCashoutFrequency>(
		(settings?.automaticCashoutFrequency as AutomaticCashoutFrequency) ?? AutomaticCashoutFrequency.Daily
	);
	const [minAmount, setMinAmount] = useState<number | undefined>(
		settings?.automaticCashoutMinAmount != null ? settings.automaticCashoutMinAmount / 100 : undefined
	);
	const [maxAmount, setMaxAmount] = useState<number | undefined>(
		settings?.automaticCashoutMaxAmount != null ? settings.automaticCashoutMaxAmount / 100 : undefined
	);
	const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState<string | null>(
		settings?.automaticCashoutPayoutAccountId
			?? payoutAccounts.find((account) => account.isActive)?.id
			?? null
	);
	const effectivePayoutAccountId =
		selectedPayoutAccountId
		?? settings?.automaticCashoutPayoutAccountId
		?? payoutAccounts.find((account) => account.isActive)?.id
		?? null;
	const selectedPayoutAccount = payoutAccounts.find((account) => account.id === selectedPayoutAccountId);
	const selectedPayoutAccountKeyType = selectedPayoutAccount
		? pixKeyTypeParse[selectedPayoutAccount.pixKeyType as keyof typeof pixKeyTypeParse]
		: null;
	const selectedPayoutAccountPixKeyMasked = selectedPayoutAccount
		? maskPixKey(selectedPayoutAccount.pixKey, selectedPayoutAccount.pixKeyType)
		: '';

	const minAmountCents = minAmount != null ? Math.round(minAmount * 100) : 0;
	const maxAmountCents = maxAmount != null ? Math.round(maxAmount * 100) : null;
	const frequencyOptions = Object.entries(automaticCashoutFrequencyParse).filter(([key]) => isGod || key !== AutomaticCashoutFrequency.Minutely);
	const hasInvalidRange =
		maxAmountCents !== null &&
		maxAmountCents <= minAmountCents;
	const hasMissingPayoutAccount = isEnabled && !effectivePayoutAccountId;

	function handleSave() {
		if (hasInvalidRange) {
			toast.danger('O valor máximo do saque automatizado deve ser maior que o valor mínimo.');
			return;
		}

		if (hasMissingPayoutAccount) {
			toast.danger('Selecione uma conta de saque para o saque automatizado da plataforma.');
			return;
		}

		startTransition(async () => {
			const result = await adminUpdatePlatformSettings({
				isAutomaticCashoutEnabled: isEnabled,
				automaticCashoutFrequency: frequency,
				automaticCashoutMinAmount: minAmountCents,
				automaticCashoutMaxAmount: maxAmountCents,
				automaticCashoutPayoutAccountId: isEnabled ? effectivePayoutAccountId : null,
			});

			if (result?.error) {
				toast.danger(result.error.message);
				return;
			}

			toast.success(result?.message || 'Configurações de saque automatizado atualizadas.');
			onSuccess();
			onClose();
		});
	}

	if (response?.error) {
		return (
			<>
				<Modal.Body>
					<p className="text-sm text-danger">{response.error.message}</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="tertiary" onPress={onClose}>
						Fechar
					</Button>
				</Modal.Footer>
			</>
		);
	}

	return (
		<>
			<Modal.Body>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-col gap-1">
							<Label className="text-sm font-medium">Ativar saque automatizado</Label>
							<Description className="text-sm">
								Quando ativado, o saldo da plataforma será sacado automaticamente conforme a frequência configurada.
							</Description>
						</div>
						<Switch size="sm" isSelected={isEnabled} onChange={setIsEnabled} isDisabled={isPending}>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</div>

					{isEnabled && (
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label className="text-sm font-medium">Frequência</Label>
								<Select
									variant="secondary"
									aria-label="Frequência do saque automatizado da plataforma"
									value={frequency}
									onChange={(key) => {
										if (!key) return;
										setFrequency(key as AutomaticCashoutFrequency);
									}}
									isDisabled={isPending}
								>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{frequencyOptions.map(([key, parse]) => (
												<ListBox.Item key={key} id={key} textValue={parse.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(parse.color)}>
														{parse.icon}
														{parse.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
								{settings?.nextAutomaticCashoutAttemptAt && (
									<Description className="text-xs text-muted">
										Próxima tentativa: {formatDate(settings.nextAutomaticCashoutAttemptAt)}
									</Description>
								)}
							</div>

							<div className="flex flex-col gap-2">
								<Label className="text-sm font-medium">Conta de destino</Label>
								<Select
									variant="secondary"
									aria-label="Conta de saque automatizado da plataforma"
									value={selectedPayoutAccountId}
									onChange={(key) => {
										if (!key) return;
										setSelectedPayoutAccountId(String(key));
									}}
									isDisabled={isPending}
								>
									<Select.Trigger>
										<Select.Value>
											{selectedPayoutAccount ? (
												<div className="flex items-center gap-3">
													<Chip
														variant="soft"
														color={mapParseColorToChipColor(selectedPayoutAccountKeyType?.color ?? 'default')}
														size="sm"
														className="gap-1"
													>
														{selectedPayoutAccountKeyType?.icon}
														{selectedPayoutAccountKeyType?.label ?? selectedPayoutAccount.pixKeyType}
													</Chip>
													<div className="flex min-w-0 flex-col">
														<span className="text-sm font-medium truncate">
															{selectedPayoutAccount.holderName ?? 'Titular não informado'}
														</span>
														<span className="text-xs text-foreground/60 font-mono truncate">
															{selectedPayoutAccountPixKeyMasked} • {selectedPayoutAccount.bankName ?? 'Banco não informado'}
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
											{payoutAccounts.map((account) => {
												const keyTypeParse = pixKeyTypeParse[account.pixKeyType as keyof typeof pixKeyTypeParse];
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
																color={mapParseColorToChipColor(keyTypeParse?.color ?? 'default')}
																size="sm"
																className="gap-1"
															>
																{keyTypeParse?.icon}
																{keyTypeParse?.label ?? account.pixKeyType}
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
								<Description className="text-xs text-muted">
									Selecione a conta destino para os saques automatizados da plataforma.
								</Description>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<Label className="text-sm font-medium">Valor mínimo</Label>
									<TextField aria-label="Valor mínimo para saque automatizado da plataforma">
										<NumericFormat
											{...currencyNumericProps}
											customInput={Input}
											variant="secondary"
											value={minAmount}
										onValueChange={(values) => setMinAmount(values.floatValue)}
											placeholder="R$ 0,00"
											disabled={isPending}
										/>
									</TextField>
								</div>

								<div className="flex flex-col gap-2">
									<Label className="text-sm font-medium">Valor máximo</Label>
									<TextField aria-label="Valor máximo para saque automatizado da plataforma">
										<NumericFormat
											{...currencyNumericProps}
											customInput={Input}
											variant="secondary"
											value={maxAmount}
										onValueChange={(values) => setMaxAmount(values.floatValue)}
											placeholder="Deixe vazio para sem limite"
											disabled={isPending}
										/>
									</TextField>
								</div>
							</div>

							{hasInvalidRange && (
								<p className="text-xs text-danger">
									O valor máximo do saque automatizado deve ser maior que o valor mínimo.
								</p>
							)}

							{hasMissingPayoutAccount && (
								<p className="text-xs text-danger">
									Selecione uma conta de saque para continuar.
								</p>
							)}
						</div>
					)}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
					Cancelar
				</Button>
				<AsyncButton
					variant="primary"
					isPending={isPending}
					isDisabled={isPending}
					onPress={handleSave}
				>
					Salvar
				</AsyncButton>
			</Modal.Footer>
		</>
	);
}

export function AutomaticPlatformCashoutConfigModal({
	isOpen,
	onOpenChange,
	settingsPromise,
	payoutAccountsPromise,
	onSuccess,
}: AutomaticPlatformCashoutConfigModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={MoneyReceiveSquareIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Configurar Saque Automatizado</Modal.Heading>
						<p className="text-sm text-muted">
							Configure o saque automatizado do saldo da plataforma.
						</p>
					</Modal.Header>
					{isOpen && settingsPromise && payoutAccountsPromise ? (
						<Suspense
							fallback={
								<Modal.Body>
									<ConfigSkeleton />
								</Modal.Body>
							}
						>
							<ConfigContent
								key={`${String(isOpen)}-${settingsPromise}-${payoutAccountsPromise}`}
								settingsPromise={settingsPromise}
								payoutAccountsPromise={payoutAccountsPromise}
								onClose={handleClose}
								onSuccess={onSuccess}
							/>
						</Suspense>
					) : (
						<Modal.Body>
							<ConfigSkeleton />
						</Modal.Body>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
