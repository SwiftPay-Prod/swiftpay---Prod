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
	Label,
	Description,
	Skeleton,
	toast,
} from '@heroui/react';
import { MoneyReceiveSquareIcon } from '@hugeicons/core-free-icons';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { updateMerchantSettings } from '@/app/actions/merchant/settings';
import { listCashoutAccounts } from '@/app/actions/merchant/cashout-accounts';
import { useUser } from '@/contexts/user-context';
import { automaticCashoutFrequencyParse, mapParseColorToChipColor, pixKeyTypeParse } from '@/parse';
import { AutomaticCashoutFrequency, PayoutAccountStatus, UserRole } from '@/types/enums';
import { maskPixKey } from '@/utils/input-masks';
import { formattedCurrencyToCents } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import type { ReadSettingsData } from '@/types/merchant/settings';
import type { ListCashoutAccountsData } from '@/types/merchant/cashout-accounts';
import type { ApiResponse } from '@/types/common';

type SettingsPromise = Promise<ApiResponse<ReadSettingsData>>;
type PayoutAccountsPromise = Promise<ApiResponse<ListCashoutAccountsData>>;

interface AutomaticCashoutConfigModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	settingsPromise: SettingsPromise | null;
	payoutAccountsPromise: PayoutAccountsPromise | null;
	onSuccess: () => void;
	readOnly?: boolean;
}

function ConfigSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-12 rounded-lg" />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
	merchantId,
	onClose,
	onSuccess,
	readOnly = false,
}: {
	settingsPromise: SettingsPromise;
	payoutAccountsPromise: PayoutAccountsPromise | null;
	merchantId: string;
	onClose: () => void;
	onSuccess: () => void;
	readOnly?: boolean;
}) {
	const response = use(settingsPromise);
	const settings = response?.data;
	const { user } = useUser();
	const isGod = (user?.role ?? '').toString().toLowerCase() === UserRole.God.toLowerCase();
	const payoutAccountsResponse = payoutAccountsPromise ? use(payoutAccountsPromise) : null;
	const payoutAccounts = payoutAccountsResponse?.data?.items ?? [];

	const [isPending, startTransition] = useTransition();
	const [isEnabled, setIsEnabled] = useState(settings?.isAutomaticCashoutEnabled ?? false);
	const [frequency, setFrequency] = useState<AutomaticCashoutFrequency>(
		(settings?.automaticCashoutFrequency as AutomaticCashoutFrequency) ?? AutomaticCashoutFrequency.Daily
	);
	const [minAmount, setMinAmount] = useState('');
	const [maxAmount, setMaxAmount] = useState('');
	const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState<string | null>(
		settings?.automaticCashoutPayoutAccountId
			?? payoutAccounts.find((account) => account.isDefault)?.id
			?? null
	);
	const effectivePayoutAccountId =
		selectedPayoutAccountId
		?? settings?.automaticCashoutPayoutAccountId
		?? payoutAccounts.find((account) => account.isDefault)?.id
		?? null;
	const selectedPayoutAccount = payoutAccounts.find((account) => account.id === selectedPayoutAccountId);
	const selectedPayoutAccountMaskedPixKey = selectedPayoutAccount
		? maskPixKey(selectedPayoutAccount.pixKey, selectedPayoutAccount.pixKeyType)
		: '';

	const minAmountCents = formattedCurrencyToCents(minAmount);
	const maxAmountCents = formattedCurrencyToCents(maxAmount);
	const frequencyOptions = Object.entries(automaticCashoutFrequencyParse).filter(([key]) => isGod || key !== AutomaticCashoutFrequency.Minutely);
	const hasInvalidRange =
		minAmountCents !== null &&
		maxAmountCents !== null &&
		maxAmountCents <= minAmountCents;
	const hasMissingPayoutAccount = isEnabled && !effectivePayoutAccountId;

	function handleSave() {
		if (hasInvalidRange) {
			toast.danger('O valor máximo do saque automatizado deve ser maior que o valor mínimo.');
			return;
		}

		if (hasMissingPayoutAccount) {
			toast.danger('Selecione uma conta de saque para o saque automatizado.');
			return;
		}

		startTransition(async () => {
			const res = await updateMerchantSettings(merchantId, {
				isAutomaticCashoutEnabled: isEnabled,
				automaticCashoutFrequency: frequency,
				automaticCashoutMinAmount: minAmountCents,
				automaticCashoutMaxAmount: maxAmountCents,
				automaticCashoutPayoutAccountId: isEnabled ? effectivePayoutAccountId : null,
			});

			if (res?.error) {
				toast.danger(res.error.message);
				return;
			}

			toast.success(res?.message || 'Configurações atualizadas com sucesso!');
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
								Quando ativado, o saldo disponível será sacado automaticamente conforme a frequência configurada.
							</Description>
						</div>
						<Switch size="sm" isSelected={isEnabled} onChange={setIsEnabled} isDisabled={isPending || readOnly}>
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
									aria-label="Frequência do saque automatizado"
									value={frequency}
									onChange={(key) => {
										if (key) setFrequency(key as AutomaticCashoutFrequency);
									}}
								isDisabled={isPending || readOnly}
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
									aria-label="Conta de saque automatizado"
									value={selectedPayoutAccountId}
									onChange={(key) => {
										if (!key) return;
										setSelectedPayoutAccountId(String(key));
									}}
								isDisabled={isPending || readOnly}
								>
									<Select.Trigger>
										<Select.Value>
											{selectedPayoutAccount ? (
												<div className="flex items-center gap-3">
													<Chip
														variant="soft"
														color={mapParseColorToChipColor(pixKeyTypeParse[selectedPayoutAccount.pixKeyType].color)}
														size="sm"
														className="gap-1"
													>
														{pixKeyTypeParse[selectedPayoutAccount.pixKeyType].icon}
														{pixKeyTypeParse[selectedPayoutAccount.pixKeyType].label}
													</Chip>
													<div className="flex min-w-0 flex-col">
														<span className="text-sm font-medium truncate">
															{selectedPayoutAccount.holderName ?? 'Titular não informado'}
														</span>
														<span className="text-xs text-foreground/60 font-mono truncate">
															{selectedPayoutAccountMaskedPixKey} • {selectedPayoutAccount.bankName ?? 'Banco não informado'}
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
								<Description className="text-xs text-muted">
									Selecione a conta que receberá os saques automatizados.
								</Description>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<Label className="text-sm font-medium">Valor mínimo</Label>
									<TextField aria-label="Valor mínimo para saque automatizado">
									<CurrencyCentsInput
										variant="secondary"
										initialValueInCents={settings?.automaticCashoutMinAmount ?? undefined}
										onValueChange={(v) => setMinAmount(v)}
										placeholder="R$ 0,00"
									disabled={isPending || readOnly}
										/>
									</TextField>
									<Description className="text-xs text-muted">
										Deixe vazio para usar o padrão da plataforma.
									</Description>
								</div>

								<div className="flex flex-col gap-2">
									<Label className="text-sm font-medium">Valor máximo</Label>
									<TextField aria-label="Valor máximo para saque automatizado">
									<CurrencyCentsInput
										variant="secondary"
										initialValueInCents={settings?.automaticCashoutMaxAmount ?? undefined}
										onValueChange={(v) => setMaxAmount(v)}
										placeholder="R$ 0,00"
									disabled={isPending || readOnly}
										/>
									</TextField>
									<Description className="text-xs text-muted">
										Deixe vazio para sacar todo o saldo disponível.
									</Description>
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
					{readOnly ? 'Fechar' : 'Cancelar'}
				</Button>
				{!readOnly && (
					<AsyncButton
						variant="primary"
						isPending={isPending}
						isDisabled={isPending}
						onPress={handleSave}
					>
						Salvar
					</AsyncButton>
				)}
			</Modal.Footer>
		</>
	);
}

export function AutomaticCashoutConfigModal({
	isOpen,
	onOpenChange,
	merchantId,
	settingsPromise,
	payoutAccountsPromise,
	onSuccess,
	readOnly = false,
}: AutomaticCashoutConfigModalProps) {
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
					<Modal.Heading>{readOnly ? 'Saque Automatizado' : 'Configurar Saque Automatizado'}</Modal.Heading>
					<p className="text-sm text-muted">{readOnly ? 'Visualize as configurações de saque automatizado desta organização.' : 'Configure o saque automatizado do saldo disponível da sua organização'}</p>
					</Modal.Header>
					{isOpen && settingsPromise ? (
						<Suspense
							fallback={
								<Modal.Body>
									<ConfigSkeleton />
								</Modal.Body>
							}
						>
							<ConfigContent
								key={`${String(isOpen)}-${settingsPromise}`}
								settingsPromise={settingsPromise}
								payoutAccountsPromise={
								readOnly
									? null
									: (payoutAccountsPromise ?? listCashoutAccounts(merchantId, { statuses: [PayoutAccountStatus.Active] }))
							}
							merchantId={merchantId}
							onClose={handleClose}
							onSuccess={onSuccess}
							readOnly={readOnly}
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
