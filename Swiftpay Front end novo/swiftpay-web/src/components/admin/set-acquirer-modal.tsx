'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Avatar, Alert, Chip, TextField, TextArea, Label, FieldError, InputGroup } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ArrowRight01Icon, CheckmarkCircle02Icon, ServerStack01Icon, Search01Icon, QrCodeIcon, BarCodeIcon, Wallet01Icon, CreditCardIcon, BankIcon } from '@hugeicons/core-free-icons';
import { SetAcquirerModalSkeleton } from './set-acquirer-modal-skeleton';
import { AsyncButton } from '@/components/ui/async-button';
import { SelectFilter } from '@/components/ui/select-filter';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { acquirerOperationTypeParse } from '@/parse';
import { toast } from '@heroui/react';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import { adminListAcquirers, adminSetMerchantAcquirer } from '@/app/actions/admin/acquirers';
import { formatFeeRate } from '@/utils/currency';
import { commonReasonOptions, reasonPresetTextMap } from '@/constants/admin/acquirer-change-reasons';
import type { ReasonPreset } from '@/constants/admin/acquirer-change-reasons';
import { getAcquirerDisplayTitle, getAcquirerDisplaySubtitle } from '@/utils/acquirer-display';
import { ProviderCategory } from '@/types/enums';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';

interface SetAcquirerModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	merchantName: string | null;
	currentAcquirerId: string | null;
	currentAcquirerName: string | null;
	onSuccess?: () => void;
}

export function SetAcquirerModal({
	isOpen,
	onOpenChange,
	merchantId,
	merchantName,
	currentAcquirerId,
	currentAcquirerName,
	onSuccess,
}: SetAcquirerModalProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [acquirers, setAcquirers] = useState<AdminAcquirerData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedAcquirer, setSelectedAcquirer] = useState<AdminAcquirerData | null>(null);
	const [step, setStep] = useState<'select' | 'confirm'>('select');
	const [reason, setReason] = useState('');
	const [reasonError, setReasonError] = useState<string | null>(null);
	const [reasonPreset, setReasonPreset] = useState<ReasonPreset>('custom');
	const [searchQuery, setSearchQuery] = useState('');
	const [providerFilter, setProviderFilter] = useState<'all' | 'acquirer' | 'ip'>('all');

	const filteredAcquirers = useMemo(() => {
		const byCategory = acquirers.filter((acq) => {
			if (providerFilter === 'all') return true;
			if (providerFilter === 'acquirer') return acq.providerCategory === ProviderCategory.Acquirer;
			return acq.providerCategory === ProviderCategory.PaymentInstitution;
		});

		const withoutCurrent = byCategory.filter((acq) => {
			if (currentAcquirerId && acq.id === currentAcquirerId) {
				return false;
			}

			if (!currentAcquirerId && currentAcquirerName) {
				return acq.name !== currentAcquirerName && acq.displayName !== currentAcquirerName;
			}

			return true;
		});

		if (!searchQuery.trim()) return withoutCurrent;

		const query = searchQuery.toLowerCase().trim();
		return withoutCurrent.filter(
			(acq) =>
				acq.name.toLowerCase().includes(query) ||
				(acq.displayName?.toLowerCase().includes(query) ?? false) ||
				acq.code.toLowerCase().includes(query)
		);
	}, [acquirers, providerFilter, searchQuery, currentAcquirerId, currentAcquirerName]);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		setSelectedAcquirer(null);
		setStep('select');
		setReason('');
		setReasonError(null);
		setReasonPreset('custom');
		setSearchQuery('');
		setProviderFilter('all');
		try {
			const acquirersResponse = await adminListAcquirers({ isActive: true, pageSize: 50 });
			
			if (acquirersResponse?.data?.items) {
				setAcquirers(acquirersResponse.data.items);
			}
		} finally {
			setIsLoading(false);
		}
	}, [merchantId]);

	useEffect(() => {
		if (isOpen) {
			loadData();
		}
	}, [isOpen, loadData]);

	const handleSelectAcquirer = (acquirer: AdminAcquirerData) => {
		setSelectedAcquirer(acquirer);
	};

	const handleNext = () => {
		if (!selectedAcquirer) return;
		setStep('confirm');
	};

	const handleBack = () => {
		setStep('select');
		setReasonError(null);
	};

	const handleReasonPresetChange = (value: ReasonPreset) => {
		setReasonPreset(value);

		if (value === 'custom') {
			return;
		}

		setReason(reasonPresetTextMap[value]);
		if (reasonError) {
			setReasonError(null);
		}
	};

	const handleConfirm = () => {
		if (!selectedAcquirer) return;

		const isChangingAcquirer = !!currentAcquirerName;
		if (isChangingAcquirer && !reason.trim()) {
			setReasonError('O motivo é obrigatório ao alterar a processadora');
			return;
		}

		startTransition(async () => {
			const response = await adminSetMerchantAcquirer(merchantId, selectedAcquirer.id, {
				reason: reason.trim() || undefined,
			});

			if (response?.error) {
				toast('Erro ao definir processadora', {
					description: response.error.message || 'Não foi possível definir a processadora.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Processadora definida', {
				description: 'A processadora foi definida com sucesso para esta organização.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onOpenChange(false);
			onSuccess?.();
			router.refresh();
		});
	};

	const hasCurrentAcquirer = !!(currentAcquirerId || currentAcquirerName);
	const isChangingAcquirer = hasCurrentAcquirer;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" scroll="outside">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>
							{step === 'select' ? 'Selecionar Processadora' : 'Confirmar Alteração de Processadora'}
						</Modal.Heading>
						<Modal.CloseTrigger />
					</Modal.Header>
					<Modal.Body>
						{step === 'select' && (
							<div className="flex flex-col gap-4">
								<p className="text-sm text-muted">
									Selecione a processadora que irá operar os pagamentos da organização{' '}
									<strong>{merchantName || 'Sem nome'}</strong>.
								</p>

								{isLoading ? (
									<SetAcquirerModalSkeleton />
								) : acquirers.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-muted">
										<Icon icon={ServerStack01Icon} className="icon-xl mb-2" />
										<p>Nenhuma processadora ativa encontrada</p>
									</div>
								) : (
									<div className="flex flex-col gap-3">
										<InternalTagTabs
											ariaLabel="Filtro por categoria da processadora"
											selectedKey={providerFilter}
											onSelectionChange={(key) => setProviderFilter(key as 'all' | 'acquirer' | 'ip')}
											items={[
												{ id: 'all', label: 'Todas', icon: <Icon icon={ServerStack01Icon} className="icon-sm" /> },
												{ id: 'acquirer', label: 'Adquirentes', icon: <Icon icon={ServerStack01Icon} className="icon-sm" /> },
												{ id: 'ip', label: 'IP', icon: <Icon icon={BankIcon} className="icon-sm" /> },
											]}
										/>
										<TextField variant="secondary" aria-label="Buscar processadora">
											<InputGroup>
												<InputGroup.Prefix>
													<Icon icon={Search01Icon} className="icon-sm text-foreground/60" />
												</InputGroup.Prefix>
												<InputGroup.Input
													placeholder="Buscar processadora por nome ou código..."
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
												/>
											</InputGroup>
										</TextField>
										<p className="text-xs text-muted">
											{filteredAcquirers.length} resultado(s)
										</p>
										<div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
											{filteredAcquirers.length === 0 ? (
												<div className="flex flex-col items-center justify-center py-6 text-muted">
													<p className="text-sm">Nenhuma processadora encontrada</p>
												</div>
											) : (
												filteredAcquirers.map((acquirer) => {
													const isSelected = selectedAcquirer?.id === acquirer.id;
													const displayName = acquirer.displayName || acquirer.name;
													const acquirerTitle = getAcquirerDisplayTitle({
														displayName,
														nominal: acquirer.nominal,
													});
													const acquirerSubtitle = getAcquirerDisplaySubtitle({
														displayName,
														nominal: acquirer.nominal,
													});

													return (
														<button
															key={acquirer.id}
															type="button"
															onClick={() => handleSelectAcquirer(acquirer)}
															className={`flex items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${
																isSelected
																		? 'border-accent bg-accent/10 cursor-pointer'
																		: 'border-divider bg-surface hover:bg-surface-secondary cursor-pointer'
																}`}
														>
															<Avatar size="sm" className="shrink-0 mt-0.5">
																{acquirer.logoUrl ? (
																	<Avatar.Image src={acquirer.logoUrl} alt={displayName} />
																) : (
																	<Avatar.Fallback className="text-xs">
																		{displayName
																			.split(' ')
																			.map((n) => n[0])
																			.join('')
																			.toUpperCase()
																			.slice(0, 2)}
																	</Avatar.Fallback>
																)}
															</Avatar>
															<div className="flex flex-1 flex-col gap-1 min-w-0">
																<div className="flex items-center justify-between gap-2">
																	<div className="flex items-center gap-2 min-w-0">
																<span className="font-medium text-sm text-foreground truncate">{acquirerTitle}</span>
																		<ProviderCategoryChip category={acquirer.providerCategory} />
																	</div>
																	<div className="flex items-center gap-1.5 shrink-0">
																		{isSelected && (
																			<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-accent" />
																		)}
																	</div>
																</div>
																<span className="text-xs text-foreground/60">{acquirerSubtitle}</span>
																<div className="flex flex-wrap items-center gap-1.5">
																	{acquirer.operationTypes?.map((type) => {
																		const parsed = acquirerOperationTypeParse[type as keyof typeof acquirerOperationTypeParse];
																		return parsed ? (
																			<Chip
																				key={type}
																				size="sm"
																				className={`gap-0.5 text-[10px] h-5 ${parsed.className ?? ''}`}
																			>
																				{parsed.icon}
																				{parsed.label}
																			</Chip>
																		) : null;
																	})}
																	{acquirer.supportsPix && (
																		<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-success/10 text-success border-success-soft-hover">
																			<Icon icon={QrCodeIcon} className="size-3" />
																			PIX
																		</Chip>
																	)}
																	{acquirer.supportsBoleto && (
																		<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-warning/10 text-warning border-warning-soft-hover">
																			<Icon icon={BarCodeIcon} className="size-3" />
																			Boleto
																		</Chip>
																	)}
																	{acquirer.supportsCreditCard && (
																		<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-accent/10 text-accent border-accent-soft-hover">
																			<Icon icon={CreditCardIcon} className="size-3" />
																			Cartão
																		</Chip>
																	)}
																	{acquirer.supportsWithdrawal && (
																		<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-secondary/10 text-secondary border-secondary-soft-hover">
																			<Icon icon={Wallet01Icon} className="size-3" />
																			Saque
																		</Chip>
																	)}
																</div>
																<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-foreground/80 mt-0.5">
																	{acquirer.pixInFeeMode && (
																		<span className="flex items-center gap-1">
																			<Icon icon={QrCodeIcon} className="size-3 text-success" />
																			PIX: {formatFeeRate(acquirer.pixInFeeMode, acquirer.pixInFeeFixed, acquirer.pixInFeePercentage)}
																		</span>
																	)}
																	{acquirer.boletoInFeeMode && (
																		<span className="flex items-center gap-1">
																			<Icon icon={BarCodeIcon} className="size-3 text-warning" />
																			Boleto: {formatFeeRate(acquirer.boletoInFeeMode, acquirer.boletoInFeeFixed, acquirer.boletoInFeePercentage)}
																		</span>
																	)}
																	{acquirer.payoutFeeMode && (
																		<span className="flex items-center gap-1">
																			<Icon icon={Wallet01Icon} className="size-3 text-accent" />
																			Saque: {formatFeeRate(acquirer.payoutFeeMode, acquirer.payoutFeeFixed, acquirer.payoutFeePercentage)}
																		</span>
																	)}
																</div>
															</div>
														</button>
													);
												})
											)}
										</div>
									</div>
								)}
							</div>
						)}

						{step === 'confirm' && selectedAcquirer && (
							<div className="flex flex-col gap-4">
								<Alert status="warning">
									<Alert.Indicator />
									<Alert.Content>
										<Alert.Title>Atenção</Alert.Title>
										<Alert.Description>
											Após confirmar, a nova processadora será aplicada para a organização.
										</Alert.Description>
									</Alert.Content>
								</Alert>

								<div className="rounded-xl border border-divider bg-surface p-4">
									<div className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
											<div className="flex items-center gap-3">
										<Avatar size="lg">
											{selectedAcquirer.logoUrl ? (
												<Avatar.Image src={selectedAcquirer.logoUrl} alt={selectedAcquirer.displayName || selectedAcquirer.name} />
											) : (
												<Avatar.Fallback>
													{(selectedAcquirer.displayName || selectedAcquirer.name)
														.split(' ')
														.map((n) => n[0])
														.join('')
														.toUpperCase()
														.slice(0, 2)}
												</Avatar.Fallback>
											)}
										</Avatar>
										<div className="flex min-w-0 flex-col gap-1">
											<div className="flex items-center gap-2 min-w-0">
												<span className="truncate font-semibold text-base">
												{getAcquirerDisplayTitle({
													displayName: selectedAcquirer.displayName || selectedAcquirer.name,
													nominal: selectedAcquirer.nominal,
												})}
											</span>
												<ProviderCategoryChip category={selectedAcquirer.providerCategory} />
											</div>
											<span className="text-sm text-muted truncate">
												{getAcquirerDisplaySubtitle({
													displayName: selectedAcquirer.displayName || selectedAcquirer.name,
													nominal: selectedAcquirer.nominal,
												})}
											</span>
										</div>
									</div>
											<div className="flex flex-wrap items-center gap-1.5">
												{selectedAcquirer.operationTypes?.map((opType) => {
													const parsed = acquirerOperationTypeParse[opType];
													return parsed ? (
														<Chip key={opType} size="sm" className={`h-5 gap-0.5 text-[10px] ${parsed.className}`}>
															{parsed.icon}
															{parsed.label}
														</Chip>
													) : null;
												})}
											</div>
										</div>

									<div className="mt-4 flex flex-wrap items-center gap-1.5">
										{selectedAcquirer.operationTypes?.map((opType) => {
											const parsed = acquirerOperationTypeParse[opType];
											return parsed ? (
												<Chip key={opType} size="sm" className={`h-5 gap-0.5 text-[10px] ${parsed.className}`}>
													{parsed.icon}
													{parsed.label}
												</Chip>
											) : null;
										})}
										{selectedAcquirer.supportsPix && (
											<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-success/10 text-success border-success-soft-hover">
												<Icon icon={QrCodeIcon} className="size-3" />
												PIX
											</Chip>
										)}
										{selectedAcquirer.supportsBoleto && (
											<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-warning/10 text-warning border-warning-soft-hover">
												<Icon icon={BarCodeIcon} className="size-3" />
												Boleto
											</Chip>
										)}
										{selectedAcquirer.supportsCreditCard && (
											<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-accent/10 text-accent border-accent-soft-hover">
												<Icon icon={CreditCardIcon} className="size-3" />
												Cartão
											</Chip>
										)}
										{selectedAcquirer.supportsWithdrawal && (
											<Chip size="sm" className="h-5 gap-0.5 text-[10px] bg-secondary/10 text-secondary border-secondary-soft-hover">
												<Icon icon={Wallet01Icon} className="size-3" />
												Saque
											</Chip>
										)}
									</div>

									{(selectedAcquirer.pixInFeeMode || selectedAcquirer.boletoInFeeMode || selectedAcquirer.payoutFeeMode) && (
										<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/80 mt-1">
											{selectedAcquirer.pixInFeeMode && (
												<span className="flex items-center gap-1.5">
													<Icon icon={QrCodeIcon} className="size-4 text-success" />
													<span className="text-muted">PIX:</span>
													<span className="font-medium">{formatFeeRate(selectedAcquirer.pixInFeeMode, selectedAcquirer.pixInFeeFixed, selectedAcquirer.pixInFeePercentage)}</span>
												</span>
											)}
											{selectedAcquirer.boletoInFeeMode && (
												<span className="flex items-center gap-1.5">
													<Icon icon={BarCodeIcon} className="size-4 text-warning" />
													<span className="text-muted">Boleto:</span>
													<span className="font-medium">{formatFeeRate(selectedAcquirer.boletoInFeeMode, selectedAcquirer.boletoInFeeFixed, selectedAcquirer.boletoInFeePercentage)}</span>
												</span>
											)}
											{selectedAcquirer.payoutFeeMode && (
												<span className="flex items-center gap-1.5">
													<Icon icon={Wallet01Icon} className="size-4 text-accent" />
													<span className="text-muted">Saque:</span>
													<span className="font-medium">{formatFeeRate(selectedAcquirer.payoutFeeMode, selectedAcquirer.payoutFeeFixed, selectedAcquirer.payoutFeePercentage)}</span>
												</span>
											)}
										</div>
									)}
								</div>

								<p className="text-sm text-muted">
									Tem certeza que deseja definir <strong>{selectedAcquirer.displayName || selectedAcquirer.name}</strong> como processadora da
									organização <strong>{merchantName || 'Sem nome'}</strong>?
								</p>

								<TextField variant="secondary"
									name="reasonPreset"
								>
									<SelectFilter<ReasonPreset>
										label="Motivo comum"
										placeholder="Selecione um motivo comum"
										value={reasonPreset}
										options={[...commonReasonOptions]}
										onChange={handleReasonPresetChange}
										allLabel="Outro (digitar manualmente)"
										allValue="custom"
										showChips={false}
									/>
								</TextField>

								<TextField variant="secondary"
									name="reason"
									isRequired={isChangingAcquirer}
									isInvalid={!!reasonError}
								>
									<Label>
										Motivo da alteração
									</Label>
									<TextArea variant="secondary"
										placeholder={
											isChangingAcquirer
												? 'Informe o motivo da alteração de processadora...'
												: 'Informe o motivo (opcional)...'
										}
										value={reason}
										onChange={(e) => {
											setReason(e.target.value);
											if (reasonError) setReasonError(null);
										}}
										rows={3}
										maxLength={500}
									/>
									{reasonError && <FieldError>{reasonError}</FieldError>}
								</TextField>
							</div>
						)}
					</Modal.Body>
					<Modal.Footer>
						{step === 'select' ? (
							<>
								<Button variant="tertiary" onPress={() => onOpenChange(false)}>
									Cancelar
								</Button>
								<Button
									variant="primary"
									onPress={handleNext}
									isDisabled={!selectedAcquirer}
								>
									Próximo
										<Icon icon={ArrowRight01Icon} className="icon-sm" />
								</Button>
							</>
						) : (
							<>
								<Button variant="tertiary" onPress={handleBack} isDisabled={isPending}>
									Voltar
								</Button>
								<AsyncButton variant="primary" onPress={handleConfirm} isPending={isPending}>
										<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
									Confirmar
								</AsyncButton>
							</>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

