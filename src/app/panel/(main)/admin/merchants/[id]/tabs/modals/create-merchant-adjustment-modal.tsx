'use client';

import { useState, useActionState } from 'react';
import {
	Button,
	Chip,
	Form,
	Label,
	ListBox,
	Modal,
	Select,
	Switch,
	TextArea,
	TextField,
} from '@heroui/react';
import {
	AddSquareIcon,
	AlertDiamondIcon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	MinusSignSquareIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { adminCreatePlatformBalanceAdjustment } from '@/app/actions/admin/dashboard';
import { paymentEnvironmentParse, mapParseColorToChipColor } from '@/parse';
import { PaymentEnvironment } from '@/types/enums';
import { toast } from '@heroui/react';
import { formatCurrency as _formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import type { AdminMerchantAcquirerBucket } from '@/types/admin/merchants';

interface FormState {
	error: string | null;
}

interface CreateMerchantAdjustmentModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: () => void;
	merchantId: string;
	merchantName: string;
	acquirers: AdminMerchantAcquirerBucket[];
}

function getBucketKey(bucket: AdminMerchantAcquirerBucket): string {
	return bucket.merchantAcquirerId ?? `__legacy__${bucket.acquirerCode ?? bucket.acquirerName}`;
}

function ModalContent({
	merchantId,
	merchantName,
	acquirers,
	onClose,
	onSuccess,
}: {
	merchantId: string;
	merchantName: string;
	acquirers: AdminMerchantAcquirerBucket[];
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [selectedBucketKey, setSelectedBucketKey] = useState<string>('');
	const [selectedEnvironment, setSelectedEnvironment] = useState<PaymentEnvironment | ''>('');

	const sortedAcquirers = [...acquirers].sort((a, b) => {
		if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
		const aName = a.acquirerDisplayName?.trim() || a.acquirerName;
		const bName = b.acquirerDisplayName?.trim() || b.acquirerName;
		return aName.localeCompare(bName, 'pt-BR');
	});
	const [amount, setAmount] = useState<string>('');
	const [isCredit, setIsCredit] = useState(true);

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const reason = formData.get('reason') as string;
			const amountCents = formattedCurrencyToCents(amount);

			if (!selectedBucketKey) {
				return { error: 'Selecione a conta de saldo (adquirente)' };
			}

			if (!selectedEnvironment) {
				return { error: 'Selecione o ambiente' };
			}
			if (!amountCents || amountCents <= 0) {
				return { error: 'Informe um valor válido maior que zero' };
			}
			if (!reason?.trim()) {
				return { error: 'Informe o motivo do ajuste' };
			}

			const selectedBucket = acquirers.find((b) => getBucketKey(b) === selectedBucketKey);

			const res = await adminCreatePlatformBalanceAdjustment({
				scope: 'Merchant',
				merchantId,
				merchantAcquirerId: selectedBucket?.merchantAcquirerId ?? null,
				environment: selectedEnvironment,
				amount: amountCents,
				isCredit,
				reason: reason.trim(),
			});

			if (res?.error) {
				return { error: res.error.message };
			}

			toast('Ajuste registrado', {
				description: `${isCredit ? 'Crédito' : 'Débito'} de ${_formatCurrency(amountCents)} registrado para a organização ${merchantName}`,
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			onSuccess();
			onClose();
			return { error: null };
		},
		{ error: null }
	);

	const environmentOptions = (Object.keys(paymentEnvironmentParse) as PaymentEnvironment[]).map((env) => ({
		value: env,
		label: paymentEnvironmentParse[env].label,
		icon: paymentEnvironmentParse[env].icon,
		color: mapParseColorToChipColor(paymentEnvironmentParse[env].color),
	}));

	return (
		<Form action={formAction}>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					<div className="flex items-start gap-3 rounded-lg bg-warning/10 p-3">
						<Icon icon={AlertDiamondIcon} className="icon-sm shrink-0 text-warning mt-0.5" />
						<p className="text-xs text-muted">
							Ajustes de organização corrigem o saldo disponível da organização no ambiente selecionado.
							Esta operação fica registrada no histórico do ledger com seu usuário.
						</p>
					</div>

					<div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
						<Icon icon={Wallet01Icon} className="icon-md text-accent" />
						<div className="flex flex-col">
							<span className="text-sm font-medium">{merchantName}</span>
							<span className="text-xs text-muted font-mono">{merchantId}</span>
						</div>
					</div>

					<div
						className={`flex items-center justify-between p-3 rounded-lg border ${
							isCredit ? 'bg-success/10 border-success-soft-hover' : 'bg-danger/10 border-danger-soft-hover'
						}`}
					>
						<div className="flex items-center gap-3">
							<Icon
								icon={isCredit ? AddSquareIcon : MinusSignSquareIcon}
								className={`icon-md ${isCredit ? 'text-success' : 'text-danger'}`}
							/>
							<div className="flex flex-col">
								<span className="text-sm font-medium">{isCredit ? 'Crédito' : 'Débito'}</span>
								<span className="text-xs text-muted">
									{isCredit
										? 'Aumenta o saldo disponível da organização'
										: 'Reduz o saldo disponível da organização'}
								</span>
							</div>
						</div>
						<Switch isSelected={isCredit} onChange={setIsCredit} aria-label="Tipo de ajuste">
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</div>

					<Select
						variant="secondary"
						aria-label="Conta de Saldo"
						placeholder="Selecione a conta (adquirente)"
						value={selectedBucketKey}
						onChange={(key) => setSelectedBucketKey(key ? String(key) : '')}
						isRequired
					>
						<Label>Conta de Saldo</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{sortedAcquirers.map((bucket) => {
									const key = getBucketKey(bucket);
									const displayName = bucket.acquirerDisplayName?.trim() || bucket.acquirerName;
									return (
										<ListBox.Item key={key} id={key} textValue={displayName}>
											<div className="flex flex-1 items-center justify-between gap-3">
												<span>{displayName}</span>
												<div className="flex items-center gap-2">
													<span className="text-xs font-medium text-success">{_formatCurrency(bucket.available)}</span>
													{bucket.isActive ? (
														<Chip size="sm" variant="soft" color="success">
															<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
															<Chip.Label>Ativa</Chip.Label>
														</Chip>
													) : (
														<Chip size="sm" variant="soft" color="default">
															<Icon icon={Cancel01Icon} className="icon-xs" />
															<Chip.Label>Inativa</Chip.Label>
														</Chip>
													)}
												</div>
											</div>
											<ListBox.ItemIndicator />
										</ListBox.Item>
									);
								})}
							</ListBox>
						</Select.Popover>
					</Select>

					<Select
						variant="secondary"
						aria-label="Ambiente"
						placeholder="Selecione o ambiente"
						value={selectedEnvironment}
						onChange={(key) => setSelectedEnvironment(key as PaymentEnvironment)}
						isRequired
					>
						<Label>Ambiente</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{environmentOptions.map((opt) => (
									<ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
										<Chip variant="soft" color={opt.color}>
											{opt.icon}
											{opt.label}
										</Chip>
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>

					<TextField variant="secondary" aria-label="Valor" name="amount" isRequired>
						<Label>Valor</Label>
						<CurrencyCentsInput
							variant="secondary"
							onValueChange={setAmount}
						/>
					</TextField>

					<TextField variant="secondary" name="reason" isRequired>
						<Label>Motivo do Ajuste</Label>
						<TextArea
							variant="secondary"
							placeholder="Descreva o motivo do ajuste manual (ex: correção de saldo, compensação, etc.)"
							rows={3}
						/>
					</TextField>

					{state.error && (
						<div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger-soft-hover">
							<Icon icon={AlertDiamondIcon} className="icon-sm text-danger shrink-0" />
							<span className="text-sm text-danger">{state.error}</span>
						</div>
					)}

					<div className="flex items-start gap-3 rounded-lg bg-card p-3">
						<Icon icon={AlertDiamondIcon} className="icon-sm shrink-0 text-warning mt-0.5" />
						<p className="text-xs text-muted">
							Créditos aumentam o saldo da organização e débitos reduzem. A contraparte é registrada no
							saldo da plataforma.
						</p>
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
					Cancelar
				</Button>
				<AsyncButton type="submit" variant="primary" isPending={isPending}>
					Confirmar Ajuste
				</AsyncButton>
			</Modal.Footer>
		</Form>
	);
}

export function CreateMerchantAdjustmentModal({
	isOpen,
	onOpenChange,
	onSuccess,
	merchantId,
	merchantName,
	acquirers,
}: CreateMerchantAdjustmentModalProps) {
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
							<Icon icon={Wallet01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Ajuste de Saldo</Modal.Heading>
						<p className="text-sm text-muted">Corrigir saldo disponível da organização</p>
					</Modal.Header>
					<ModalContent
						merchantId={merchantId}
						merchantName={merchantName}
						acquirers={acquirers}
						onClose={handleClose}
						onSuccess={onSuccess}
					/>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
