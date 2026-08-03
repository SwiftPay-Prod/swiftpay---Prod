'use client';

import { Suspense } from 'react';
import {
	Modal,
	Button,
	TextField,
	Input,
	Skeleton,
	Label,
	Select,
	ListBox,
	Chip,
	Alert,
	DatePicker,
	DateField,
	Calendar,
	Checkbox,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { JsonEditorInput } from '@/components/ui/json-editor-input';
import {
	Alert01Icon,
	CancelCircleIcon,
	CreditCardIcon,
	InformationCircleIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { formatCurrency } from '@/utils/currency';
import { AsyncButton } from '@/components/ui/async-button';
import { AsyncAutocomplete } from '@/components/ui/async-autocomplete';
import { mapParseColorToChipColor, paymentMethodParse } from '@/parse';
import { PaymentMethod } from '@/types/enums';
import type { DateValue } from '@internationalized/date';
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
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Nenhum método de pagamento disponível</Alert.Title>
							<Alert.Description>
								Sua organização ainda não possui nenhum método de pagamento configurado. Entre em contato com o suporte
								para habilitar PIX, Boleto ou outros métodos de pagamento.
							</Alert.Description>
						</Alert.Content>
					</Alert>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onPress={onClose}>
						Fechar
					</Button>
				</Modal.Footer>
			</>
		);
	}

	const actionIcon = paymentMethodParse[form.paymentMethod]?.icon ?? <Icon icon={CreditCardIcon} className="icon-sm" />;

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
					<div className="flex flex-col gap-5">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div className="flex flex-col gap-1">
								<Label>Método de pagamento</Label>
								<Select
									variant="secondary"
									aria-label="Método de pagamento"
									value={form.paymentMethod}
									placeholder="Selecione o método"
									onChange={(key) => {
										if (key) handlers.setPaymentMethod(String(key) as PaymentMethod);
									}}
								>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{fees.methodOptions.map((method) => {
												const methodParse = paymentMethodParse[method];
												return (
													<ListBox.Item key={method} id={method} textValue={methodParse.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(methodParse.color)} className="gap-1">
															{methodParse.icon}
															{methodParse.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												);
											})}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
							<div className="flex flex-col gap-1">
								<TextField
									variant="secondary"
									aria-label="Valor da transação"
									isRequired
									isInvalid={validation.isAmountOutOfRange}
								>
									<Label>Valor da transação</Label>
									<CurrencyCentsInput variant="secondary" onValueChange={(v) => handlers.handleAmountChange(v)} />
								</TextField>
								{validation.isAmountOutOfRange ? (
									<p className="text-xs text-danger">
										{validation.isBelowMin
											? `Valor mínimo: ${formatCurrency(fees.minAmount)}`
											: `Valor máximo: ${formatCurrency(fees.maxAmount)}`}
									</p>
								) : (
									<p className="text-xs text-muted">
										Mín: {formatCurrency(fees.minAmount)} • Máx:{' '}
										{fees.hasMaxLimit ? formatCurrency(fees.maxAmount) : 'Sem limite'}
									</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<TextField variant="secondary" aria-label="Descrição" name="description">
								<Label>Descrição</Label>
								<Input
									variant="secondary"
									placeholder="Descrição da transação..."
									value={form.description}
									onChange={(event) => handlers.setDescription(event.target.value)}
								/>
							</TextField>
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
										isRequired={validation.isBoleto}
										isInvalid={validation.isMissingBoletoCustomer}
									/>
									{form.selectedCustomer && (
										<Button variant="danger-soft" size="sm" onPress={handlers.handleRemoveCustomer}>
											<Icon icon={CancelCircleIcon} size={18} />
										</Button>
									)}
								</div>
								{validation.isMissingBoletoCustomer && (
									<p className="text-xs text-danger">Selecione um cliente para emitir boleto.</p>
								)}
							</div>
						</div>

						{validation.isBoleto && (
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								<div className="flex flex-col gap-1">
									<DatePicker
										className="w-full"
										aria-label="Selecione a data de vencimento do boleto"
										value={form.boletoDueDateValue}
										minValue={form.minBoletoDateValue}
										onChange={(value: DateValue | null) => {
											if (!value) {
												handlers.setBoletoDueDate('');
												return;
											}

											const normalizedValue =
												value.compare(form.minBoletoDateValue) < 0 ? form.minBoletoDateValue : value;
											handlers.setBoletoDueDate(normalizedValue.toString());
										}}
									>
										<Label isRequired>Vencimento do boleto</Label>
										<DateField.Group
											fullWidth
											variant="secondary"
											isInvalid={validation.isMissingBoletoDueDate || validation.isInvalidBoletoDueDate}
										>
											<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
											<DateField.Suffix>
												<DatePicker.Trigger>
													<DatePicker.TriggerIndicator />
												</DatePicker.Trigger>
											</DateField.Suffix>
										</DateField.Group>
										<DatePicker.Popover>
											<Calendar
												aria-label="Data de vencimento do boleto"
												minValue={form.minBoletoDateValue}
												isDateUnavailable={(date) => date.compare(form.minBoletoDateValue) < 0}
											>
												<Calendar.Header>
													<Calendar.YearPickerTrigger>
														<Calendar.YearPickerTriggerHeading />
														<Calendar.YearPickerTriggerIndicator />
													</Calendar.YearPickerTrigger>
													<Calendar.NavButton slot="previous" />
													<Calendar.NavButton slot="next" />
												</Calendar.Header>
												<Calendar.Grid>
													<Calendar.GridHeader>
														{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
													</Calendar.GridHeader>
													<Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
												</Calendar.Grid>
												<Calendar.YearPickerGrid>
													<Calendar.YearPickerGridBody>
														{({ year }) => <Calendar.YearPickerCell year={year} />}
													</Calendar.YearPickerGridBody>
												</Calendar.YearPickerGrid>
											</Calendar>
										</DatePicker.Popover>
									</DatePicker>
									{validation.isMissingBoletoDueDate && (
										<p className="text-xs text-danger">Selecione a data de vencimento do boleto.</p>
									)}
									{!validation.isMissingBoletoDueDate && validation.isInvalidBoletoDueDate && (
										<p className="text-xs text-danger">A data de vencimento do boleto deve ser no minimo D+2.</p>
									)}
								</div>
								<TextField variant="secondary" aria-label="Instruções do boleto">
									<Label>Instruções do boleto</Label>
									<Input
										variant="secondary"
										placeholder="Ex: Pagável até o vencimento"
										value={form.boletoInstructions}
										onChange={(event) => handlers.setBoletoInstructions(event.target.value)}
									/>
								</TextField>
							</div>
						)}

						{validation.isCreditCard && (
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								<TextField variant="secondary" aria-label="Número do cartão" isRequired isInvalid={validation.isMissingCardNumber}>
									<Label>Número do cartão</Label>
									<Input
										variant="secondary"
										placeholder="0000 0000 0000 0000"
										value={form.cardNumber}
										onChange={(event) => handlers.setCardNumber(event.target.value)}
									/>
								</TextField>
								<TextField variant="secondary" aria-label="Nome do titular" isRequired isInvalid={validation.isMissingCardHolderName}>
									<Label>Nome do titular</Label>
									<Input
										variant="secondary"
										placeholder="Nome igual ao cartão"
										value={form.cardHolderName}
										onChange={(event) => handlers.setCardHolderName(event.target.value)}
									/>
								</TextField>
								<TextField variant="secondary" aria-label="Mês de expiração" isRequired isInvalid={validation.isMissingCardExpirationMonth}>
									<Label>Mês de expiração</Label>
									<Input
										variant="secondary"
										type="number"
										min={1}
										max={12}
										placeholder="MM"
										value={form.cardExpirationMonth}
										onChange={(event) => handlers.setCardExpirationMonth(event.target.value)}
									/>
								</TextField>
								<TextField variant="secondary" aria-label="Ano de expiração" isRequired isInvalid={validation.isMissingCardExpirationYear}>
									<Label>Ano de expiração</Label>
									<Input
										variant="secondary"
										type="number"
										min={new Date().getFullYear()}
										max={new Date().getFullYear() + 20}
										placeholder="AAAA"
										value={form.cardExpirationYear}
										onChange={(event) => handlers.setCardExpirationYear(event.target.value)}
									/>
								</TextField>
								<TextField variant="secondary" aria-label="CVV" isRequired isInvalid={validation.isMissingCardCvv}>
									<Label>CVV</Label>
									<Input
										variant="secondary"
										type="password"
										placeholder="000"
										value={form.cardCvv}
										onChange={(event) => handlers.setCardCvv(event.target.value)}
									/>
								</TextField>
								<div className="flex flex-col gap-1">
									<Label>Parcelas</Label>
									<Select
										variant="secondary"
										aria-label="Número de parcelas"
										value={form.installments}
										placeholder="Selecione o número de parcelas"
										onChange={(key) => {
											if (key) handlers.setInstallments(String(key));
										}}
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{Array.from({ length: 12 }, (_, index) => {
													const installmentValue = String(index + 1);
													return (
														<ListBox.Item
															key={installmentValue}
															id={installmentValue}
															textValue={`${installmentValue}x`}
														>
															{installmentValue}x
															<ListBox.ItemIndicator />
														</ListBox.Item>
													);
												})}
											</ListBox>
										</Select.Popover>
									</Select>
									{validation.isMissingInstallments && (
										<p className="text-xs text-danger">Selecione de 1 a 12 parcelas.</p>
									)}
								</div>
							</div>
						)}

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

						<div className="flex flex-col gap-3 rounded-lg border border-divider p-4">
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
										<span className="text-sm font-medium">Enviar metadata JSON</span>
										<span className="text-xs text-muted">Use este campo para enviar UTMs e tracking.</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Select
										variant="secondary"
										aria-label="Modelo de metadata"
										placeholder="Escolha um modelo"
										onChange={(key) => {
											if (!key) return;
											handlers.applyMetadataTemplate(String(key) as MetadataTemplateKey);
										}}
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{(Object.keys(METADATA_TEMPLATES) as MetadataTemplateKey[]).map((templateKey) => (
													<ListBox.Item
														key={templateKey}
														id={templateKey}
														textValue={METADATA_TEMPLATES[templateKey].label}
													>
														{METADATA_TEMPLATES[templateKey].label}
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
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
					</div>

					{data.amountForDisplay > 0 && (
						<div className="rounded-lg bg-surface-secondary p-4">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-full bg-accent-soft-hover flex items-center justify-center">
									<Icon icon={Wallet01Icon} className="icon-sm text-accent" />
								</div>
								<div>
									<span className="text-sm text-foreground/60">Resumo da Transação</span>
								</div>
							</div>

							{data.isLoadingPreview ? (
								<div className="flex flex-col gap-2">
									<Skeleton className="h-5 w-full rounded" />
									<Skeleton className="h-5 w-full rounded" />
									<div className="border-t border-divider pt-2 mt-1">
										<Skeleton className="h-7 w-full rounded" />
									</div>
								</div>
							) : data.preview ? (
								<div className="flex flex-col gap-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted">Valor bruto:</span>
										<span className="font-medium">{formatCurrency(data.preview.amount)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted">Taxa da plataforma:</span>
										<span className="font-medium text-danger">- {formatCurrency(data.preview.fee)}</span>
									</div>
									<div className="border-t border-divider pt-2 mt-1">
										<div className="flex justify-between">
											<span className="font-medium">Valor líquido:</span>
											<span className="font-bold text-success text-lg">{formatCurrency(data.preview.netAmount)}</span>
										</div>
									</div>
								</div>
							) : null}
						</div>
					)}

					<div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
						<Icon icon={InformationCircleIcon} className="icon-sm shrink-0 text-warning mt-0.5" />
						<p className="text-xs text-muted">
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
					{actionIcon}
					Criar Transação
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
					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-32 rounded" />
							<Skeleton className="h-10 w-full rounded-lg" />
							<Skeleton className="h-3 w-48 rounded" />
						</div>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-40 rounded" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</div>
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-32 rounded" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-36 rounded" />
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					</div>
					<Skeleton className="h-16 w-full rounded-lg" />
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Skeleton className="h-9 w-24 rounded-lg" />
				<Skeleton className="h-9 w-36 rounded-lg" />
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
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={CreditCardIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Nova Transação</Modal.Heading>
						<p className="text-sm text-muted">Crie uma nova cobrança PIX ou boleto para sua organização</p>
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
