'use client';

import { Suspense, use, useState, useActionState } from 'react';
import {
	Button,
	Form,
	Label,
	ListBox,
	Modal,
	Select,
	Skeleton,
	Switch,
	TextArea,
	TextField,
} from '@heroui/react';
import {
	AddSquareIcon,
	AlertDiamondIcon,
	BankIcon,
	CheckmarkCircle02Icon,
	MinusSignSquareIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { adminCreatePlatformBalanceAdjustment } from '@/app/actions/admin/dashboard';

import type { ApiResponse, Paginated } from '@/types/common';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { AcquirerAdjustmentTarget } from '@/types/admin/platform-balance';
import { toast } from '@heroui/react';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';

type AcquirersPromise = Promise<ApiResponse<Paginated<AdminAcquirerData>>>;

interface FormState {
	error: string | null;
}

interface CreateAdjustmentModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: () => void;
	acquirersPromise: AcquirersPromise | null;
}

function ModalContentSkeleton() {
	return (
		<>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-10 w-full rounded-lg" />

					<div className="flex flex-col gap-5">
						<Skeleton className="h-12 w-full rounded-lg" />
						<Skeleton className="h-16 w-full rounded-lg" />
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-24 rounded" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</div>
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-28 rounded" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-16 rounded" />
							<Skeleton className="h-20 w-full rounded-lg" />
						</div>
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Skeleton className="h-9 w-24 rounded-lg" />
				<Skeleton className="h-9 w-32 rounded-lg" />
			</Modal.Footer>
		</>
	);
}

function ModalContent({
	acquirersPromise,
	onClose,
	onSuccess,
}: {
	acquirersPromise: AcquirersPromise;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const acquirersResponse = use(acquirersPromise);
	const acquirers = acquirersResponse?.data?.items ?? [];

	const [selectedScope, _setSelectedScope] = useState<'Acquirer'>('Acquirer');
	const [selectedAcquirerId, setSelectedAcquirerId] = useState<string>('');
	const [selectedAcquirerTarget, setSelectedAcquirerTarget] = useState<AcquirerAdjustmentTarget>('MerchantBalance');
	const [amount, setAmount] = useState<string>('');
	const [isCredit, setIsCredit] = useState(true);

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const reason = formData.get('reason') as string;
			const amountCents = formattedCurrencyToCents(amount);

			if (!amountCents || amountCents <= 0) {
				return { error: 'O valor do ajuste é obrigatório e deve ser maior que zero.' };
			}

			if (!reason?.trim()) {
				return { error: 'O motivo do ajuste é obrigatório.' };
			}

			if (selectedScope === 'Acquirer' && !selectedAcquirerId) {
				return { error: 'A adquirente é obrigatória.' };
			}

			const res = await adminCreatePlatformBalanceAdjustment({
				scope: selectedScope,
				acquirerId: selectedScope === 'Acquirer' ? selectedAcquirerId : null,
				acquirerTarget: selectedScope === 'Acquirer' ? selectedAcquirerTarget : null,
				merchantId: null,
				merchantAcquirerId: null,
				environment: null,
				amount: amountCents,
				isCredit,
				reason: reason.trim(),
			});

			if (res?.error) {
				return { error: res.error.message };
			}

			toast('Ajuste registrado', {
				description: res?.message || `${isCredit ? 'Crédito' : 'Débito'} de ${formatCurrency(amountCents)} registrado com sucesso.`,
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			onSuccess();
			onClose();
			return { error: null };
		},
		{ error: null }
	);

	const creditDescription =
		selectedAcquirerTarget === 'SwiftPayProfit'
			? 'Aumenta o lucro SwiftPay na adquirente e o disponível total para saque'
			: 'Aumenta o saldo global das organizações na adquirente';

	const debitDescription =
		selectedAcquirerTarget === 'SwiftPayProfit'
			? 'Reduz o lucro SwiftPay na adquirente e o disponível total para saque'
			: 'Reduz o saldo global das organizações na adquirente';

	return (
		<Form action={formAction}>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					<div className="flex items-start gap-3 rounded-lg bg-warning/10 p-3">
						<Icon icon={AlertDiamondIcon} className="icon-sm shrink-0 text-warning mt-0.5" />
						<p className="text-xs text-muted">
							{selectedAcquirerTarget === 'SwiftPayProfit'
								? 'Ajustes de lucro SwiftPay corrigem diretamente o saldo da adquirente e, por consequência, o disponível total para saque.'
								: 'Ajustes globais de organizações corrigem o saldo agregado das organizações na adquirente. Esta operação fica registrada no histórico do ledger com seu usuário.'}
						</p>
					</div>

					<div className="flex flex-col gap-5">
						<div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-foreground">
							<Icon icon={BankIcon} className="icon-sm" />
							Ajuste por adquirente
						</div>

						<div
							className={`flex items-center justify-between rounded-lg p-4 border ${
								isCredit ? 'bg-success/10 border-success-soft-hover' : 'bg-danger/10 border-danger-soft-hover'
							}`}
						>
							<div className="flex items-center gap-2">
								<Icon
									icon={isCredit ? AddSquareIcon : MinusSignSquareIcon}
									className={`icon-md ${isCredit ? 'text-success' : 'text-danger'}`}
								/>
								<div>
									<p className="font-medium">{isCredit ? 'Crédito' : 'Débito'}</p>
									<p className="text-xs text-muted">{isCredit ? creditDescription : debitDescription}</p>
								</div>
							</div>
							<Switch isSelected={isCredit} onChange={setIsCredit} aria-label="Tipo de ajuste">
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</div>

						{selectedScope === 'Acquirer' ? (
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								<Select
									variant="secondary"
									aria-label="Adquirente"
									placeholder="Selecione a adquirente"
									value={selectedAcquirerId}
									onChange={(key) => setSelectedAcquirerId(key ? String(key) : '')}
									isRequired
								>
									<Label>Adquirente</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{acquirers.map((acq) => (
												<ListBox.Item key={acq.id} id={acq.id} textValue={acq.displayName || acq.name}>
													<div className="flex items-center gap-2">
														{acq.logoUrl ? (
															// eslint-disable-next-line @next/next/no-img-element
															<img src={acq.logoUrl} alt={acq.name} className="h-5 w-5 rounded" />
														) : (
															<Icon icon={BankIcon} className="icon-sm" />
														)}
														<span>{acq.displayName || acq.name}</span>
													</div>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>

								<Select
									variant="secondary"
									aria-label="Alvo do Ajuste"
									placeholder="Selecione o alvo"
									value={selectedAcquirerTarget}
									onChange={(key) => setSelectedAcquirerTarget((key ? String(key) : 'MerchantBalance') as AcquirerAdjustmentTarget)}
									isRequired
								>
									<Label>Alvo do Ajuste</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											<ListBox.Item id="MerchantBalance" textValue="Saldo Global das Organizações">
												Saldo Global das Organizações
												<ListBox.ItemIndicator />
											</ListBox.Item>
											<ListBox.Item id="SwiftPayProfit" textValue="Lucro SwiftPay na Adquirente">
												Lucro SwiftPay na Adquirente
												<ListBox.ItemIndicator />
											</ListBox.Item>
										</ListBox>
									</Select.Popover>
								</Select>

								<TextField variant="secondary" aria-label="Valor" name="amount" isRequired>
									<Label>Valor do Ajuste</Label>
									<CurrencyCentsInput
										variant="secondary"
										onValueChange={setAmount}
									/>
								</TextField>
							</div>
						) : (
							<TextField variant="secondary" aria-label="Valor" name="amount" isRequired>
								<Label>Valor do Ajuste</Label>
								<CurrencyCentsInput
									variant="secondary"
									onValueChange={setAmount}
								/>
							</TextField>
						)}

						<TextField variant="secondary" aria-label="Motivo" name="reason" isRequired>
							<Label>Motivo</Label>
							<TextArea variant="secondary" placeholder="Descreva o motivo do ajuste (ex: reconciliação bancária, estorno manual)..." rows={3} />
						</TextField>
					</div>

					{state.error && (
						<div className="flex items-center gap-2 text-sm text-danger">
							<Icon icon={AlertDiamondIcon} className="icon-sm" />
							<span>{state.error}</span>
						</div>
					)}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
					Cancelar
				</Button>
				<AsyncButton type="submit" variant="primary" isPending={isPending}>
					Registrar Ajuste
				</AsyncButton>
			</Modal.Footer>
		</Form>
	);
}

export function CreateAdjustmentModal({
	isOpen,
	onOpenChange,
	onSuccess,
	acquirersPromise,
}: CreateAdjustmentModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={BankIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Ajuste Manual de Saldo</Modal.Heading>
						<p className="text-sm text-muted">Corrigir saldos da plataforma ou de adquirentes</p>
					</Modal.Header>
					{acquirersPromise && (
						<Suspense fallback={<ModalContentSkeleton />}>
							<ModalContent
								acquirersPromise={acquirersPromise}
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
