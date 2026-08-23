'use client';

import { Suspense, use, useEffect, useState, useTransition } from 'react';
import { Modal, Alert, Label, TextField, Input, FieldError, TextArea, Button, Chip } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { CheckmarkCircle02Icon, CancelCircleIcon, Wallet01Icon, Key01Icon } from '@hugeicons/core-free-icons';
import { toast } from '@heroui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { ApiResponse } from '@/types/common';
import type { FileData } from '@/types/files';
import type {
	AdminReferralCommissionWithdrawalRequestDetails,
	AdminEvaluateReferralCommissionWithdrawalRequestRequest,
} from '@/types/admin/referrals';
import { ReferralCommissionWithdrawalRequestStatus, ReferralWithdrawalIntervalUnit, UploadFolder } from '@/types/enums';
import {
	adminEvaluateReferralCommissionWithdrawalRequest,
} from '@/app/actions/admin/referrals';
import { Icon } from '@/components/ui/icon';
import { DocumentViewer } from '@/components/ui/document-viewer';
import { FileUpload } from '@/components/merchant/onboarding/file-upload';
import { currencyFormatProps } from '@/utils/input-masks';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { mapParseColorToChipColor, pixKeyTypeParse, userStatusParse } from '@/parse';

type RequestDetailsPromise = Promise<ApiResponse<AdminReferralCommissionWithdrawalRequestDetails>>;

interface ReferralWithdrawalReviewModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	requestPromise: RequestDetailsPromise | null;
	onPaid?: () => void;
}

interface ReferralWithdrawalReviewFormData {
	amount: number | null;
	notes: string;
}

function toCents(value: number | null | undefined): number {
	return Math.round(((value ?? 0) + Number.EPSILON) * 100);
}

function getStatusMeta(status: ReferralCommissionWithdrawalRequestStatus) {
	switch (status) {
		case ReferralCommissionWithdrawalRequestStatus.Requested:
			return { label: 'Solicitado', color: 'warning' as const };
		case ReferralCommissionWithdrawalRequestStatus.Reviewed:
			return { label: 'Analisado', color: 'success' as const };
		case ReferralCommissionWithdrawalRequestStatus.Cancelled:
			return { label: 'Cancelado', color: 'danger' as const };
		default:
			return { label: status, color: 'default' as const };
	}
}

function ContentSkeleton() {
	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={Wallet01Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Solicitação de saque da comissão</Modal.Heading>
				<p className="text-sm text-muted">Carregando detalhes da solicitação...</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-3">
					<div className="h-20 rounded-xl bg-surface-secondary" />
					<div className="h-20 rounded-xl bg-surface-secondary" />
					<div className="h-20 rounded-xl bg-surface-secondary" />
					<div className="h-24 rounded-xl bg-surface-secondary" />
				</div>
			</Modal.Body>
		</>
	);
}

function intervalUnitLabel(value: ReferralWithdrawalIntervalUnit): string {
	return value === ReferralWithdrawalIntervalUnit.Months ? 'meses' : 'dias';
}

function intervalValueLabel(value: number, unit: ReferralWithdrawalIntervalUnit): string {
	if (value === 0) {
		return 'Sem limite';
	}

	return `${value} ${intervalUnitLabel(unit)}`;
}

function ReferralWithdrawalReviewModalContent({
	detailsPromise,
	onClose,
	onPaid,
}: {
	detailsPromise: RequestDetailsPromise;
	onClose: () => void;
	onPaid?: () => void;
}) {
	const response = use(detailsPromise);
	const details = response?.data;
	const [isPending, startTransition] = useTransition();
	const [uploadedReceiptFile, setUploadedReceiptFile] = useState<{
		requestId: string;
		file: FileData;
	} | null>(null);

	const {
		control,
		handleSubmit,
		reset,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<ReferralWithdrawalReviewFormData>({
		defaultValues: {
			amount: null,
			notes: '',
		},
		mode: 'onChange',
	});

	const amountValue = useWatch({ control, name: 'amount' });

	useEffect(() => {
		if (!details) {
			return;
		}

		reset({
			amount: details.requestedAmount / 100,
			notes: '',
		});
		clearErrors();
	}, [details, reset, clearErrors]);

	if (response?.error || !details) {
		return (
			<>
				<Modal.Header>
					<Modal.Icon className="bg-accent text-accent-foreground">
						<Icon icon={Wallet01Icon} className="icon-md" />
					</Modal.Icon>
					<Modal.Heading>Solicitação de saque da comissão</Modal.Heading>
					<p className="text-sm text-muted">Erro ao carregar detalhes</p>
				</Modal.Header>
				<Modal.Body>
					<Alert status="danger">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Falha ao carregar solicitação</Alert.Title>
							<Alert.Description>{response?.error?.message ?? 'Não foi possível carregar os dados.'}</Alert.Description>
						</Alert.Content>
					</Alert>
				</Modal.Body>
			</>
		);
	}

	const requestDetails = details;
	const isReviewable = requestDetails.status === ReferralCommissionWithdrawalRequestStatus.Requested;
	const paymentDetails = requestDetails.payment;
	const statusParse = getStatusMeta(requestDetails.status);
	const referrerStatusParse = userStatusParse[requestDetails.referrerStatus];
	const pixKeyLabel = requestDetails.payoutPixKeyType ? pixKeyTypeParse[requestDetails.payoutPixKeyType]?.label : null;
	const paymentPixKeyLabel = paymentDetails?.pixKeyType ? pixKeyTypeParse[paymentDetails.pixKeyType]?.label : null;
	const requestedAmount = requestDetails.requestedAmount;
	const totalBalanceAmount = requestDetails.availableCommissionBalance + requestedAmount;
	const withdrawalFeeFixed = requestDetails.referralCommissionWithdrawalFeeFixed;
	const netSuggestedToSend = Math.max(requestedAmount - withdrawalFeeFixed, 0);
	const paidAmountInCents = toCents(amountValue);
	const paidNetAmount = Math.max(paidAmountInCents - withdrawalFeeFixed, 0);
	const minimumNetAmountInCents = 1;
	const currentUploadedReceiptFile = uploadedReceiptFile?.requestId === requestDetails.id
		? uploadedReceiptFile.file
		: null;

	function onSubmit(values: ReferralWithdrawalReviewFormData) {
		const amount = toCents(values.amount);

		if (amount <= 0) {
			setError('amount', { type: 'validate', message: 'Informe um valor maior que R$ 0,00.' });
			return;
		}

		if (amount - withdrawalFeeFixed < minimumNetAmountInCents) {
			setError('amount', {
				type: 'validate',
				message: 'O valor líquido a pagar deve ser de no mínimo R$ 0,01.',
			});
			return;
		}

		clearErrors('amount');

		startTransition(async () => {
			const payload: AdminEvaluateReferralCommissionWithdrawalRequestRequest = {
				status: ReferralCommissionWithdrawalRequestStatus.Reviewed,
				amount,
				notes: values.notes?.trim() || null,
				receiptFileId: currentUploadedReceiptFile?.id ?? null,
			};

			const markPaidResponse = await adminEvaluateReferralCommissionWithdrawalRequest(requestDetails.id, payload);
			if (markPaidResponse.error) {
				toast('Erro ao registrar pagamento', {
					description: markPaidResponse.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			toast('Pagamento registrado', {
				description: 'A solicitação foi marcada como paga com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			onPaid?.();
			onClose();
		});
	}

	function onReject(values: ReferralWithdrawalReviewFormData) {
		const reason = values.notes?.trim() ?? '';

		if (!reason) {
			setError('notes', {
				type: 'validate',
				message: 'Informe o motivo da rejeição.',
			});
			return;
		}

		clearErrors('notes');

		startTransition(async () => {
			const payload: AdminEvaluateReferralCommissionWithdrawalRequestRequest = {
				status: ReferralCommissionWithdrawalRequestStatus.Cancelled,
				reason,
			};

			const rejectResponse = await adminEvaluateReferralCommissionWithdrawalRequest(requestDetails.id, payload);
			if (rejectResponse.error) {
				toast('Erro ao rejeitar solicitação', {
					description: rejectResponse.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			toast('Solicitação rejeitada', {
				description: 'A solicitação foi rejeitada e o saldo foi devolvido para o usuário.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			onPaid?.();
			onClose();
		});
	}

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={Wallet01Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Solicitação de saque da comissão</Modal.Heading>
				<p className="text-sm text-muted">Visualize os detalhes do saque e registre o pagamento quando a solicitação estiver pendente.</p>
			</Modal.Header>
			<form onSubmit={handleSubmit(onSubmit)}>
			<Modal.Body className="flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
					<div className="rounded-xl border border-border bg-surface p-3">
						<span className="text-xs text-muted">Solicitado</span>
						<p className="text-sm font-semibold text-foreground">+ {formatCurrency(requestedAmount)}</p>
					</div>
					<div className="rounded-xl border border-border bg-surface p-3">
						<span className="text-xs text-muted">Saldo disponível</span>
						<p className="text-sm font-semibold text-accent">+ {formatCurrency(details.availableCommissionBalance)}</p>
					</div>
					<div className="rounded-xl border border-border bg-surface p-3">
						<span className="text-xs text-muted">Saldo total</span>
						<p className="text-sm font-semibold text-success">+ {formatCurrency(totalBalanceAmount)}</p>
					</div>
					<div className="rounded-xl border border-border bg-surface p-3">
						<span className="text-xs text-muted">Solicitado em</span>
						<p className="text-sm font-medium text-foreground">{formatDate(details.requestedAt)}</p>
					</div>
				</div>

				<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2">
						<span className="text-sm font-medium text-foreground">Gerente de contas</span>
						<Chip variant="soft" size="sm" color={mapParseColorToChipColor(referrerStatusParse.color)}>
							{referrerStatusParse.label}
						</Chip>
					</div>
					<p className="text-sm font-medium text-foreground">{details.referrerName || 'Sem nome'}</p>
					<p className="text-sm text-muted break-all">{details.referrerEmail}</p>
				</div>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
						<span className="text-sm font-medium text-foreground">Configuração da indicação</span>
						<div className="flex justify-between text-sm">
							<span className="text-muted">Duração da indicação</span>
							<span className="font-medium">{details.referralDurationMonths} meses</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted">Percentual da comissão</span>
							<span className="font-medium">{(details.referralCommissionPercentage / 100).toFixed(2)}%</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted">Intervalo para novo saque</span>
							<span className="font-medium">
								{intervalValueLabel(details.referralCommissionWithdrawalIntervalValue, details.referralCommissionWithdrawalIntervalUnit)}
							</span>
						</div>
					</div>

					<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
						<span className="text-sm font-medium text-foreground">Taxas e limites</span>
						<div className="flex justify-between text-sm">
							<span className="text-muted">Saque mínimo</span>
							<span className="font-medium">+ {formatCurrency(details.referralCommissionMinWithdrawalAmount)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted">Taxa fixa de saque</span>
							<span className="font-medium text-danger">- {formatCurrency(details.referralCommissionWithdrawalFeeFixed)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted">Solicitações pendentes</span>
							<span className="font-medium text-warning">- {formatCurrency(details.pendingWithdrawalRequestsTotal)}</span>
						</div>
						<div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
							<span className="text-muted">Quanto tem que enviar para o usuário em R$ (líquido mínimo: R$ 0,01)</span>
							<span className="font-semibold text-success">+ {formatCurrency(netSuggestedToSend)}</span>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Icon icon={Key01Icon} className="icon-sm text-accent" />
							<span className="text-sm font-medium text-foreground">Conta para pagamento</span>
						</div>
						<Chip variant="soft" size="sm" color={mapParseColorToChipColor(statusParse.color)}>
							{statusParse.label}
						</Chip>
					</div>
					<p className="text-sm text-foreground break-all">{details.payoutPixKey || 'Não informada'}</p>
					<p className="text-xs text-muted">{pixKeyLabel ?? 'Tipo não informado'}</p>
					{details.requestNotes && <p className="text-xs text-muted">Observação do usuário: {details.requestNotes}</p>}
					{details.reviewReason && <p className="text-xs text-warning">Motivo da análise: {details.reviewReason}</p>}
				</div>

				<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2">
						<span className="text-sm font-medium text-foreground">Detalhes do pagamento</span>
						{paymentDetails && <span className="text-xs text-muted">Pago em {formatDate(paymentDetails.paidAt)}</span>}
					</div>
					{paymentDetails ? (
						<>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-1">
									<span className="text-xs text-muted">Pago por</span>
									<p className="text-sm font-medium text-foreground">{paymentDetails.paidByUserName || 'Sem nome'}</p>
									<p className="text-xs text-muted break-all">{paymentDetails.paidByUserEmail}</p>
								</div>
								<div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-1">
									<span className="text-xs text-muted">Pagamento ID</span>
									<p className="text-xs font-mono text-foreground break-all">{paymentDetails.id}</p>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted">Valor solicitado</span>
										<span className="font-medium text-foreground">{formatCurrency(paymentDetails.requestedAmount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted">Valor pago</span>
										<span className="font-medium text-accent">+ {formatCurrency(paymentDetails.paidAmount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted">Taxa</span>
										<span className="font-medium text-danger">- {formatCurrency(paymentDetails.feeAmount)}</span>
									</div>
									<div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
										<span className="text-muted">Valor líquido enviado</span>
										<span className="font-semibold text-success">+ {formatCurrency(paymentDetails.netAmount)}</span>
									</div>
								</div>

								<div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted">Chave PIX usada</span>
										<span className="font-medium text-foreground">{paymentPixKeyLabel ?? 'Não informado'}</span>
									</div>
									<p className="text-sm text-foreground break-all">{paymentDetails.pixKey || 'Não informada'}</p>
									<div className="flex justify-between text-sm">
										<span className="text-muted">Transação ledger</span>
										<span className="font-medium text-foreground">{paymentDetails.ledgerTransactionId ?? 'Não vinculada'}</span>
									</div>
									{paymentDetails.notes && (
										<p className="text-xs text-muted">Observação do pagamento: {paymentDetails.notes}</p>
									)}
								</div>
							</div>

							{paymentDetails.receiptFile?.url && (
								<DocumentViewer
									file={paymentDetails.receiptFile}
									title="Comprovante"
									description="Comprovante enviado no registro do pagamento."
								/>
							)}
						</>
					) : (
						<p className="text-sm text-muted">Ainda não existe pagamento registrado para esta solicitação.</p>
					)}
				</div>

				{isReviewable && (
					<>
						<TextField variant="secondary" name="notes" isInvalid={!!errors.notes}>
							<Label>Observação para o usuário</Label>
							<Controller
								name="notes"
								control={control}
								render={({ field }) => (
									<TextArea variant="secondary"
										name={field.name}
										value={field.value}
										onChange={(value) => field.onChange(value)}
										placeholder="Ex: Pagamento realizado via PIX em 17/02"
									/>
								)}
							/>
							<FieldError>{errors.notes?.message}</FieldError>
						</TextField>

						<FileUpload
							isAdmin
							folder={UploadFolder.ReferralCommissions}
							label="Comprovante de pagamento (opcional)"
							description="Envie o comprovante para ficar visível ao admin e ao usuário no histórico."
							currentFile={currentUploadedReceiptFile}
							showInlinePreview
							onUploadComplete={(_fileId, fileData) =>
								setUploadedReceiptFile({
									requestId: requestDetails.id,
									file: fileData,
								})
							}
							onRemove={() => setUploadedReceiptFile(null)}
						/>

						<TextField variant="secondary" className="w-full" name="amount" isInvalid={!!errors.amount}>
							<Label>Valor pago (R$)</Label>
							<Controller
								name="amount"
								control={control}
								rules={{
									required: 'Informe um valor válido para registrar o pagamento.',
									validate: {
										positive: (value) => ((value ?? 0) > 0) || 'Informe um valor maior que R$ 0,00.',
										minimumNetAmount: (value) =>
											toCents(value) - withdrawalFeeFixed >= minimumNetAmountInCents
												|| 'O valor líquido a pagar deve ser de no mínimo R$ 0,01.',
									},
								}}
								render={({ field }) => (
									<NumericFormat
										customInput={Input}
										{...currencyFormatProps}
										placeholder="0,00"
										value={field.value ?? undefined}
										onValueChange={(values) => field.onChange(values.floatValue ?? null)}
										isAllowed={({ floatValue }) => floatValue === undefined || floatValue >= 0}
									/>
								)}
							/>
							<FieldError>{errors.amount?.message}</FieldError>
						</TextField>

						<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
							<div className="flex justify-between text-sm">
								<span className="text-muted">Valor pago</span>
								<span className="font-medium text-foreground">+ {formatCurrency(paidAmountInCents)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted">Taxa fixa aplicada</span>
								<span className="font-medium text-danger">- {formatCurrency(withdrawalFeeFixed)}</span>
							</div>
							<div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
								<span className="text-muted">Quanto tem que enviar para o usuário em R$ (líquido mínimo: R$ 0,01)</span>
								<span className="font-semibold text-success">+ {formatCurrency(paidNetAmount)}</span>
							</div>
						</div>
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onPress={onClose} isDisabled={isPending}>
					{isReviewable ? 'Cancelar' : 'Fechar'}
				</Button>
				{isReviewable && (
					<>
						<Button
							type="button"
							variant="danger"
							isPending={isPending}
							onPress={() => {
								void handleSubmit(onReject)();
							}}
						>
							<Icon icon={CancelCircleIcon} className="icon-sm" />
							Rejeitar saque
						</Button>
						<Button type="submit" variant="primary" isPending={isPending}>
							<Icon icon={Wallet01Icon} className="icon-sm" />
							Marcar como pago
						</Button>
					</>
				)}
			</Modal.Footer>
			</form>
		</>
	);
}

export function ReferralWithdrawalReviewModal({
	isOpen,
	onOpenChange,
	requestPromise,
	onPaid,
}: ReferralWithdrawalReviewModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />
					{requestPromise && (
						<Suspense fallback={<ContentSkeleton />}>
							<ReferralWithdrawalReviewModalContent
								detailsPromise={requestPromise}
								onClose={handleClose}
								onPaid={onPaid}
							/>
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
