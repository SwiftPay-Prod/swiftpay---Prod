'use client';

import { Suspense } from 'react';
import {
	Modal,
	Button,
	TextField,
	Input,
	Skeleton,
	Label,
	Checkbox,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { JsonEditorInput } from '@/components/ui/json-editor-input';
import {
	Alert01Icon,
	CancelCircleIcon,
	InformationCircleIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { formatCurrency } from '@/utils/currency';
import { AsyncButton } from '@/components/ui/async-button';
import { AsyncAutocomplete } from '@/components/ui/async-autocomplete';
import { maskDocument } from '@/utils/input-masks';
import {
	METADATA_TEMPLATES,
	useCreateTransactionForm,
	type FeesPromise,
	type MetadataTemplateKey,
} from './use-create-transaction-form';

export type { FeesPromise };

interface CreateTransactionModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	onSuccess: () => void;
	feesPromise: FeesPromise | null;
}

interface FormContentProps {
	merchantId: string;
	onClose: () => void;
	onSuccess: () => void;
	feesPromise: FeesPromise;
}

function FormContent({ merchantId, onClose, onSuccess, feesPromise }: FormContentProps) {
	const { fees, form, data, state, validation, handlers } = useCreateTransactionForm({
		merchantId,
		feesPromise,
		onClose,
		onSuccess,
	});

	if (fees.hasNoPaymentMethods) {
		return (
			<>
				<Modal.Body>
					<div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-white">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/50">
							<Icon icon={InformationCircleIcon} className="icon-md" />
						</div>
						<p className="text-sm font-semibold text-white">PIX indisponível</p>
						<p className="text-xs text-white/50">
							Esta organização ainda não possui o método PIX habilitado para emissão de cobranças.
						</p>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onPress={onClose}>
						Fechar
					</Button>
				</Modal.Footer>
			</>
		);
	}

	const customerOptions = data.customerOptions.map((customer) => {
		const maskedDocument = customer.document ? maskDocument(customer.document) : null;
		const descriptionParts = [customer.email, maskedDocument].filter(Boolean);

		return {
			key: customer.id,
			label: customer.name,
			description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : null,
		};
	});

	return (
		<form action={state.formAction}>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="flex flex-col gap-1">
							<Label>Valor da transação</Label>
							<TextField
								variant="secondary"
								aria-label="Valor da transação"
								isRequired
								isInvalid={validation.isAmountOutOfRange}
							>
								<Input
									variant="secondary"
									placeholder="R$ 0,00"
									value={form.amountFormatted}
									onChange={(event) => handlers.handleAmountChange(event.target.value)}
								/>
							</TextField>
							{validation.isAmountOutOfRange ? (
								<p className="text-xs text-danger">
									{validation.isBelowMin
										? `Valor mínimo: ${formatCurrency(fees.minAmount)}`
										: `Valor máximo: ${formatCurrency(fees.maxAmount)}`}
								</p>
							) : (
								<p className="text-xs text-white/40">
									Mín: {formatCurrency(fees.minAmount)} • Máx:{' '}
									{fees.hasMaxLimit ? formatCurrency(fees.maxAmount) : 'Sem limite'}
								</p>
							)}
						</div>
						<TextField variant="secondary" aria-label="Descrição" name="description">
							<Label>Descrição</Label>
							<Input
								variant="secondary"
								placeholder="Descrição da transação..."
								value={form.description}
								onChange={(event) => handlers.setDescription(event.target.value)}
							/>
						</TextField>
					</div>

					<div className="flex flex-col gap-1.5">
						<div className="flex items-end gap-2">
							<AsyncAutocomplete
								label="Cliente"
								placeholder="Selecione um cliente"
								searchPlaceholder="Digite para buscar clientes"
								minSearchLength={0}
								searchValue={form.customerSearch}
								onSearchChange={handlers.setCustomerSearch}
								isOpen={form.isCustomerAutocompleteOpen}
								onOpenChange={handlers.setIsCustomerAutocompleteOpen}
								isLoading={state.isSearchingCustomers}
								optionVariant="card"
								options={customerOptions}
								value={form.selectedCustomer?.id ?? null}
								emptyMessage="Nenhum cliente encontrado"
								onChange={(key) => handlers.handleCustomerSelect(key)}
								className="flex-1"
							/>
							{form.selectedCustomer && (
								<Button variant="danger-soft" size="sm" onPress={handlers.handleRemoveCustomer}>
									<Icon icon={CancelCircleIcon} size={18} />
								</Button>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-surface-deep p-4">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-start gap-2">
								<Checkbox
									variant="secondary"
									className="mt-0.5"
									isSelected={form.isMetadataEnabled}
									onChange={handlers.setIsMetadataEnabled}
								>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
								</Checkbox>
								<div className="flex flex-col">
									<span className="text-sm font-medium text-white">Enviar metadata JSON</span>
									<span className="text-xs text-white/50">Use este campo para enviar UTMs e tracking.</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									onPress={() => handlers.applyMetadataTemplate('utmify')}
								>
									Utmify
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onPress={() => handlers.applyMetadataTemplate('otimizey')}
								>
									Otimizey
								</Button>
							</div>
						</div>

						{form.isMetadataEnabled && (
							<div className="flex flex-col gap-2">
								<TextField variant="secondary" aria-label="Metadata JSON">
									<Label>Metadata (JSON)</Label>
									<JsonEditorInput
										rows={8}
										placeholder='{"utm_source":"facebook","utm_campaign":"campanha_checkout"}'
										value={form.metadataInput}
										onChange={handlers.setMetadataInput}
									/>
								</TextField>
								{validation.isMissingMetadataJson && (
									<p className="text-xs text-danger">Informe o JSON de metadata ou desative a opção.</p>
								)}
								{!validation.isMissingMetadataJson && validation.isInvalidMetadataJson && (
									<p className="text-xs text-danger">O conteúdo de metadata deve ser um JSON válido.</p>
								)}
							</div>
						)}
					</div>

					<TextField variant="secondary" aria-label="URL de Notificação" name="callbackUrl">
						<Label>URL de Notificação</Label>
						<Input
							variant="secondary"
							type="url"
							placeholder="https://seu-site.com/webhook"
							value={form.callbackUrl}
							onChange={(event) => handlers.setCallbackUrl(event.target.value)}
						/>
					</TextField>

					{data.amountForDisplay > 0 && (
						<div className="rounded-lg bg-surface-deep border border-white/10 p-4">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
									<Icon icon={Wallet01Icon} className="icon-sm" />
								</div>
								<div>
									<span className="text-sm text-white/60">Resumo da Transação</span>
								</div>
							</div>

							{data.isLoadingPreview ? (
								<div className="flex flex-col gap-2">
									<Skeleton className="h-5 w-full rounded bg-white/5" />
									<Skeleton className="h-5 w-full rounded bg-white/5" />
									<div className="border-t border-white/10 pt-2 mt-1">
										<Skeleton className="h-7 w-full rounded bg-white/5" />
									</div>
								</div>
							) : data.preview ? (
								<div className="flex flex-col gap-2 text-sm">
									<div className="flex justify-between">
										<span className="text-white/50">Valor bruto:</span>
										<span className="font-medium text-white">{formatCurrency(data.preview.amount)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-white/50">Taxa da plataforma:</span>
										<span className="font-medium text-danger">- {formatCurrency(data.preview.fee)}</span>
									</div>
									<div className="border-t border-white/10 pt-2 mt-1">
										<div className="flex justify-between">
											<span className="font-medium text-white">Valor líquido:</span>
											<span className="font-bold text-success text-lg">{formatCurrency(data.preview.netAmount)}</span>
										</div>
									</div>
								</div>
							) : null}
						</div>
					)}

					<div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3">
						<Icon icon={InformationCircleIcon} className="icon-sm shrink-0 text-warning mt-0.5" />
						<p className="text-xs text-white/60">
							O valor líquido é o valor que será creditado na sua conta após o pagamento ser confirmado, já descontada a
							taxa da plataforma.
						</p>
					</div>

					{state.error && (
						<div className="flex items-center gap-2 text-sm text-danger">
							<Icon icon={Alert01Icon} className="icon-sm" />
							<span>{state.error}</span>
						</div>
					)}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={state.isPending}>
					Cancelar
				</Button>
				<AsyncButton type="submit" variant="primary" isPending={state.isPending} isDisabled={!validation.isValid}>
					<Icon icon={Wallet01Icon} className="icon-sm" />
					Criar Cobrança PIX
				</AsyncButton>
			</Modal.Footer>
		</form>
	);
}

function FormContentSkeleton() {
	return (
		<>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-40 rounded bg-white/5" />
							<Skeleton className="h-10 w-full rounded-lg bg-white/5" />
						</div>
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-32 rounded bg-white/5" />
							<Skeleton className="h-10 w-full rounded-lg bg-white/5" />
						</div>
					</div>
					<Skeleton className="h-16 w-full rounded-lg bg-white/5" />
					<Skeleton className="h-16 w-full rounded-lg bg-white/5" />
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Skeleton className="h-9 w-24 rounded-lg bg-white/5" />
				<Skeleton className="h-9 w-36 rounded-lg bg-white/5" />
			</Modal.Footer>
		</>
	);
}

export function CreateTransactionModal({
	isOpen,
	onOpenChange,
	merchantId,
	onSuccess,
	feesPromise,
}: CreateTransactionModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl bg-card border border-white/12 text-white rounded-[20px] p-62xl">
					<Modal.CloseTrigger />
					<Modal.Header className="border-b border-white/10 pb-4 mb-5">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-link border border-brand/25">
								<Icon icon={Wallet01Icon} className="icon-md" />
							</div>
							<div>
								<Modal.Heading className="text-lg font-bold text-white">Nova Cobrança PIX</Modal.Heading>
								<p className="text-xs text-white/50">Gere uma cobrança instantânea com liquidação D+0</p>
							</div>
						</div>
					</Modal.Header>
					{feesPromise ? (
						<Suspense fallback={<FormContentSkeleton />}>
							<FormContent
								merchantId={merchantId}
								onClose={handleClose}
								onSuccess={onSuccess}
								feesPromise={feesPromise}
							/>
						</Suspense>
					) : (
						<FormContentSkeleton />
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
