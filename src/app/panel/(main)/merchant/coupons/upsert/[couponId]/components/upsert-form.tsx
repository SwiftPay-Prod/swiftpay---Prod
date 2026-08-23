'use client';

import { useState, useActionState, use, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
	TextField,
	Input,
	Label,
	Select,
	ListBox,
	TextArea,
	Card,
	Switch,
	Skeleton,
	DateRangePicker,
	DateField,
	RangeCalendar,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { NumericFormat } from 'react-number-format';
import { Icon } from '@/components/ui/icon';
import {
	Alert01Icon,
	Coupon01Icon,
	Dollar01Icon,
	Calendar01Icon,
	Settings02Icon,
	TextIcon,
	CheckmarkCircle02Icon,
	Delete02Icon,
} from '@hugeicons/core-free-icons';
import { createMerchantCoupon, updateMerchantCoupon, deleteMerchantCoupon } from '@/app/actions/merchant/coupons';
import { currencyNumericProps } from '@/utils/input-masks';
import { couponDiscountTypeParse, couponDiscountTypeOptions, couponStatusParse, couponStatusOptions } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { toast } from '@heroui/react';
import { CouponDiscountType, CouponStatus, PaymentEnvironment } from '@/types/enums';
import type { CouponData } from '@/types/merchant/coupons';
import type { ApiResponse } from '@/types/common';
import { Routes } from '@/router/routes';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { SectionAccordion as SystemAccordion } from '@/components/ui/system-accordion';
import { ReviewIssuesAlert } from '@/components/ui/review-step-layout';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface FormState {
	error: string | null;
}

export function PageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start gap-4">
				<Skeleton className="h-10 w-10 rounded-lg" />
				<div className="flex flex-col gap-2 flex-1">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			<Card>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-8 w-48" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
					<Skeleton className="h-16" />
				</div>
			</Card>

			<Card>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-8 w-32" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
				</div>
			</Card>

			<Card>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-8 w-40" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
				</div>
			</Card>

			<Card>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-8 w-36" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
				</div>
			</Card>
		</div>
	);
}

function formatDateLocal(dateString: string | null | undefined): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60 * 1000);
	return localDate.toISOString().slice(0, 10);
}

const COUPON_STEPS = [
	{ title: 'Informações', description: 'Código, nome e descrição', isRequired: true },
	{ title: 'Desconto', description: 'Tipo e valor do desconto', isRequired: true },
	{ title: 'Regras', description: 'Limites, validade e escopo' },
	{ title: 'Revisão', description: 'Revise antes de salvar' },
];

interface CouponUpsertFormProps {
	merchantId: string;
	environment: PaymentEnvironment;
	couponPromise?: Promise<ApiResponse<CouponData>>;
}

export function CouponUpsertForm({ merchantId, environment, couponPromise }: CouponUpsertFormProps) {
	const router = useRouter();

	const response = couponPromise ? use(couponPromise) : null;
	const coupon = response?.data ?? null;
	const isEditMode = !!coupon;
	const couponId = coupon?.id;

	const [code, setCode] = useState(coupon?.code ?? '');
	const [name, setName] = useState(coupon?.name ?? '');
	const [description, setDescription] = useState(coupon?.description ?? '');
	const [status, setStatus] = useState<CouponStatus>(coupon?.status ?? CouponStatus.Active);
	const [discountType, setDiscountType] = useState<CouponDiscountType>(
		coupon?.discountType ?? CouponDiscountType.Percentage
	);
	const [discountPercentage, setDiscountPercentage] = useState<number | undefined>(
		coupon?.discountPercentage ?? undefined
	);
	const [discountFixedAmount, setDiscountFixedAmount] = useState<number | undefined>(
		coupon?.discountFixedAmount ? coupon.discountFixedAmount / 100 : undefined
	);
	const [minOrderAmount, setMinOrderAmount] = useState<number | undefined>(
		coupon?.minOrderAmount ? coupon.minOrderAmount / 100 : undefined
	);
	const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(
		coupon?.maxDiscountAmount ? coupon.maxDiscountAmount / 100 : undefined
	);
	const [maxUses, setMaxUses] = useState<number | undefined>(coupon?.maxUses ?? undefined);
	const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState<number | undefined>(
		coupon?.maxUsesPerCustomer ?? undefined
	);
	const [validFrom, setValidFrom] = useState(formatDateLocal(coupon?.validFrom));
	const [validUntil, setValidUntil] = useState(formatDateLocal(coupon?.validUntil));
	const validFromValue = validFrom ? parseDate(validFrom) : null;
	const validUntilValue = validUntil ? parseDate(validUntil) : null;
	const validityRangeValue = validFromValue && validUntilValue ? { start: validFromValue, end: validUntilValue } : null;
	const [applyToAllProducts, setApplyToAllProducts] = useState(coupon?.applyToAllProducts ?? true);
	const [applyToAllCheckouts, setApplyToAllCheckouts] = useState(coupon?.applyToAllCheckouts ?? true);
	const [currentStep, setCurrentStep] = useState(0);
	const [hasValidatedReview, setHasValidatedReview] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeletePending, setIsDeletePending] = useState(false);

	const reviewValidationErrors = useMemo(() => {
		const errors: string[] = [];
		if (!code.trim()) errors.push('Informe o código do cupom');
		if (!name.trim()) errors.push('Informe o nome do cupom');
		if (discountType === CouponDiscountType.Percentage && !discountPercentage) {
			errors.push('Informe o percentual de desconto');
		}
		if (discountType === CouponDiscountType.FixedAmount && !discountFixedAmount) {
			errors.push('Informe o valor fixo de desconto');
		}
		return [...new Set(errors)];
	}, [code, name, discountType, discountPercentage, discountFixedAmount]);

	const quickSummary = useMemo(() => {
		const parts: string[] = [];
		if (code.trim()) parts.push(`Código: ${code.trim()}`);
		if (discountType === CouponDiscountType.Percentage && discountPercentage) {
			parts.push(`Desconto: ${discountPercentage}%`);
		}
		if (discountType === CouponDiscountType.FixedAmount && discountFixedAmount) {
			parts.push(`Desconto: R$ ${discountFixedAmount.toFixed(2).replace('.', ',')}`);
		}
		parts.push(`Status: ${couponStatusParse[status].label}`);
		return parts.join(' • ');
	}, [code, discountFixedAmount, discountPercentage, discountType, status]);
	const stepDefinitions = isEditMode
		? COUPON_STEPS.filter((step) => step.title !== 'Revisão')
		: COUPON_STEPS;
	const wizardSteps = useMemo(
		() =>
			stepDefinitions.map((step, index) => {
				if (index === 0) {
					return { ...step, isCompleted: code.trim().length > 0 && name.trim().length > 0 };
				}

				if (index === 1) {
					const hasValidDiscount =
						discountType === CouponDiscountType.Percentage
							? (discountPercentage ?? 0) > 0
							: (discountFixedAmount ?? 0) > 0;

					return { ...step, isCompleted: hasValidDiscount };
				}

				return step;
			}),
		[code, discountFixedAmount, discountPercentage, discountType, name, stepDefinitions]
	);

	function renderAccordionCard(params: {
		id: string;
		icon: React.ComponentProps<typeof Icon>['icon'];
		title: string;
		summary: string;
		children: ReactNode;
	}) {
		return (
			<SystemAccordion defaultExpandedKeys={[params.id]} className="px-0">
				<SystemAccordion.Item id={params.id} className="rounded-xl border border-border bg-surface">
					<SystemAccordion.Heading>
						<SystemAccordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-accent/10">
									<Icon icon={params.icon} className="icon-md text-accent" />
								</div>
								<div className="flex flex-col items-start">
									<span className="font-medium">{params.title}</span>
									<span className="text-xs text-muted">{params.summary}</span>
								</div>
							</div>
							<SystemAccordion.Indicator />
						</SystemAccordion.Trigger>
					</SystemAccordion.Heading>
					<SystemAccordion.Panel>
						<SystemAccordion.Body className="p-4">{params.children}</SystemAccordion.Body>
					</SystemAccordion.Panel>
				</SystemAccordion.Item>
			</SystemAccordion>
		);
	}

	const lastStepIndex = stepDefinitions.length - 1;

	async function goToStep(step: number) {
		if (!isEditMode && step === lastStepIndex) setHasValidatedReview(true);
		setCurrentStep(step);
	}

	const [state, formAction, isPending] = useActionState(
		async (): Promise<FormState> => {
			if (reviewValidationErrors.length > 0) {
				return { error: reviewValidationErrors[0] ?? 'Revise os campos obrigatórios antes de continuar.' };
			}

			if (!code.trim()) return { error: 'Informe o código do cupom' };
			if (!name.trim()) return { error: 'Informe o nome do cupom' };

			if (discountType === CouponDiscountType.Percentage && !discountPercentage) {
				return { error: 'Informe o percentual de desconto' };
			}
			if (discountType === CouponDiscountType.FixedAmount && !discountFixedAmount) {
				return { error: 'Informe o valor fixo de desconto' };
			}

			if (isEditMode && couponId) {
				const res = await updateMerchantCoupon(merchantId, couponId, {
					code: code.trim().toUpperCase(),
					name: name.trim(),
					description: description.trim() || null,
					status,
					discountType,
					discountPercentage: discountType === CouponDiscountType.Percentage ? discountPercentage : null,
					discountFixedAmount:
						discountType === CouponDiscountType.FixedAmount && discountFixedAmount
							? Math.round(discountFixedAmount * 100)
							: null,
					minOrderAmount: minOrderAmount ? Math.round(minOrderAmount * 100) : null,
					maxDiscountAmount: maxDiscountAmount ? Math.round(maxDiscountAmount * 100) : null,
					maxUses: maxUses || null,
					maxUsesPerCustomer: maxUsesPerCustomer || null,
					validFrom: validFrom ? `${validFrom}T00:00` : null,
					validUntil: validUntil ? `${validUntil}T23:59` : null,
					applyToAllProducts,
					applyToAllCheckouts,
				});

				if (res?.error) return { error: res.error.message ?? 'Erro ao atualizar cupom' };

				toast('Cupom atualizado', {
					description: res?.message || 'As informações do cupom foram atualizadas.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			} else {
				const res = await createMerchantCoupon(merchantId, {
					code: code.trim().toUpperCase(),
					name: name.trim(),
					description: description.trim() || null,
					discountType,
					discountPercentage: discountType === CouponDiscountType.Percentage ? discountPercentage : null,
					discountFixedAmount:
						discountType === CouponDiscountType.FixedAmount && discountFixedAmount
							? Math.round(discountFixedAmount * 100)
							: null,
					minOrderAmount: minOrderAmount ? Math.round(minOrderAmount * 100) : null,
					maxDiscountAmount: maxDiscountAmount ? Math.round(maxDiscountAmount * 100) : null,
					maxUses: maxUses || null,
					maxUsesPerCustomer: maxUsesPerCustomer || null,
					validFrom: validFrom ? `${validFrom}T00:00` : null,
					validUntil: validUntil ? `${validUntil}T23:59` : null,
					applyToAllProducts,
					applyToAllCheckouts,
					status: CouponStatus.Active,
					environment,
				});

				if (res?.error) return { error: res.error.message ?? 'Erro ao criar cupom' };

				toast('Cupom criado', {
					description: res?.message || 'O cupom foi criado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}

			router.push(Routes.panel.merchant.coupons);
			return { error: null };
		},
		{ error: null }
	);

	async function handleDeleteCoupon() {
		if (!couponId || isDeletePending) return;

		setIsDeletePending(true);
		const response = await deleteMerchantCoupon(merchantId, couponId);
		setIsDeletePending(false);

		if (response?.error) {
			toast('Erro ao excluir cupom', {
				description: response.error.message ?? 'Não foi possível excluir o cupom.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		toast('Cupom excluído', {
			description: response?.message ?? 'Cupom excluído com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});

		setIsDeleteModalOpen(false);
		router.push(Routes.panel.merchant.coupons);
	}

	const headerActions = isEditMode ? (
		<AsyncButton variant="danger" isPending={isDeletePending} isDisabled={isPending} onPress={() => setIsDeleteModalOpen(true)}>
			<Icon icon={Delete02Icon} className="icon-sm" />
			Excluir
		</AsyncButton>
	) : null;

	return (
		<div className="flex flex-col gap-4">
			<FormPageHeader
				icon={<Icon icon={Coupon01Icon} className="icon-md text-accent" />}
				title={isEditMode ? 'Editar Cupom' : 'Novo Cupom'}
				description={isEditMode ? `Editando: ${coupon?.code}` : 'Crie um cupom de desconto'}
				meta={<p className="text-xs text-muted">{quickSummary}</p>}
				actions={headerActions}
			/>

			<WizardStepper
				steps={wizardSteps}
				currentStep={currentStep}
				mode={isEditMode ? 'editor' : 'wizard'}
				onStepClick={(step) => {
					void goToStep(step);
				}}
				onBack={currentStep > 0 ? () => setCurrentStep((s) => s - 1) : undefined}
				onNext={
					currentStep < lastStepIndex
						? () => {
							void goToStep(currentStep + 1);
						}
						: undefined
				}
				submitSlot={
					isEditMode || currentStep === lastStepIndex ? (
						<AsyncButton type="submit" form="coupon-form" variant="primary" isPending={isPending} isDisabled={!isEditMode && reviewValidationErrors.length > 0} onPress={() => setHasValidatedReview(true)}>
							<Icon icon={isEditMode ? CheckmarkCircle02Icon : Coupon01Icon} className="icon-sm" />
							{isEditMode ? 'Salvar Alterações' : 'Criar Cupom'}
						</AsyncButton>
					) : null
				}
			/>

			<form id="coupon-form" action={formAction} className="flex flex-col gap-6">
				{currentStep === 0 && (
				renderAccordionCard({
					id: 'basic-info',
					icon: TextIcon,
					title: 'Informações Básicas',
					summary: `${code || 'Sem código'} • ${name || 'Sem nome'}`,
					children: (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<TextField variant="secondary" isRequired>
								<Label>Código</Label>
								<Input
									variant="secondary"
									placeholder="Ex: DESCONTO10"
									value={code}
									onChange={(e) => setCode(e.target.value.toUpperCase())}
									autoFocus={!isEditMode}
								/>
							</TextField>

							<TextField variant="secondary" isRequired>
								<Label>Nome</Label>
								<Input
									variant="secondary"
									placeholder="Nome interno do cupom"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</TextField>
						</div>

						{isEditMode && (
							<Select
								variant="secondary"
								isRequired
								className="w-full max-w-xs"
								value={status}
								onChange={(key) => {
									if (key) setStatus(String(key) as CouponStatus);
								}}
							>
								<Label>Status</Label>
								<Select.Trigger>
									<Select.Value>
										<span className="flex items-center gap-2">
											<span
												className={`w-2 h-2 rounded-full ${
													status === CouponStatus.Active
														? 'bg-success'
														: status === CouponStatus.Inactive
															? 'bg-danger'
															: 'bg-muted'
												}`}
											/>
											{couponStatusParse[status].label}
										</span>
									</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{couponStatusOptions.map((opt) => (
											<ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
												<span
													className={`w-2 h-2 rounded-full ${
														opt.value === CouponStatus.Active
															? 'bg-success'
															: opt.value === CouponStatus.Inactive
																? 'bg-danger'
																: 'bg-muted'
													}`}
												/>
												{opt.label}
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						)}

						<TextField variant="secondary">
							<Label>Descrição</Label>
							<TextArea
								variant="secondary"
								placeholder="Descrição do cupom (opcional)"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={2}
							/>
						</TextField>
					</div>
					),
				})
				)}

				{currentStep === 1 && (
				renderAccordionCard({
					id: 'discount-info',
					icon: Dollar01Icon,
					title: 'Desconto',
					summary:
						discountType === CouponDiscountType.Percentage
							? `${discountPercentage ?? 0}%`
							: `R$ ${(discountFixedAmount ?? 0).toFixed(2).replace('.', ',')}`,
					children: (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<Select
								variant="secondary"
								isRequired
								className="w-full"
								value={discountType}
								onChange={(key) => {
									if (key) setDiscountType(String(key) as CouponDiscountType);
								}}
							>
								<Label>Tipo de Desconto</Label>
								<Select.Trigger>
									<Select.Value>{couponDiscountTypeParse[discountType].label}</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{couponDiscountTypeOptions.map((opt) => (
											<ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
												{opt.label}
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							{discountType === CouponDiscountType.Percentage ? (
								<TextField variant="secondary" isRequired>
									<Label>Percentual (%)</Label>
									<NumericFormat
										customInput={Input}
										placeholder="Ex: 10"
										suffix="%"
										decimalScale={0}
										allowNegative={false}
										value={discountPercentage}
										onValueChange={(values) => setDiscountPercentage(values.floatValue)}
									/>
								</TextField>
							) : (
								<TextField variant="secondary" isRequired>
									<Label>Valor Fixo</Label>
									<NumericFormat
										{...currencyNumericProps}
										customInput={Input}
										placeholder="R$ 0,00"
										value={discountFixedAmount}
										onValueChange={(values) => setDiscountFixedAmount(values.floatValue)}
									/>
								</TextField>
							)}
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<TextField variant="secondary">
								<Label>Valor Mínimo do Pedido</Label>
								<NumericFormat
									{...currencyNumericProps}
									customInput={Input}
									placeholder="R$ 0,00"
									value={minOrderAmount}
									onValueChange={(values) => setMinOrderAmount(values.floatValue)}
								/>
							</TextField>

							{discountType === CouponDiscountType.Percentage && (
								<TextField variant="secondary">
									<Label>Desconto Máximo</Label>
									<NumericFormat
										{...currencyNumericProps}
										customInput={Input}
										placeholder="R$ 0,00"
										value={maxDiscountAmount}
										onValueChange={(values) => setMaxDiscountAmount(values.floatValue)}
									/>
								</TextField>
							)}
						</div>
					</div>
					),
				})
				)}

				{currentStep === 2 && (
				<>
				{renderAccordionCard({
					id: 'rules-limits',
					icon: Settings02Icon,
					title: 'Limites de Uso',
					summary: `Total: ${maxUses ?? 'Ilimitado'} • Por cliente: ${maxUsesPerCustomer ?? 'Ilimitado'}`,
					children: (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<TextField variant="secondary">
								<Label>Máximo de Usos (total)</Label>
								<NumericFormat
									customInput={Input}
									placeholder="Ilimitado"
									decimalScale={0}
									allowNegative={false}
									value={maxUses}
									onValueChange={(values) => setMaxUses(values.floatValue)}
								/>
							</TextField>

							<TextField variant="secondary">
								<Label>Máximo por Cliente</Label>
								<NumericFormat
									customInput={Input}
									placeholder="Ilimitado"
									decimalScale={0}
									allowNegative={false}
									value={maxUsesPerCustomer}
									onValueChange={(values) => setMaxUsesPerCustomer(values.floatValue)}
								/>
							</TextField>
						</div>
					</div>
					),
				})}

				{/* Validity */}
				{renderAccordionCard({
					id: 'rules-validity',
					icon: Calendar01Icon,
					title: 'Validade',
					summary:
						validFrom && validUntil
							? `${validFrom} até ${validUntil}`
							: 'Sem período definido',
					children: (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 gap-4">
							<DateRangePicker
								startName="validFrom"
								endName="validUntil"
								value={validityRangeValue}
								onChange={(value) => {
									setValidFrom(value?.start ? value.start.toString().slice(0, 10) : '');
									setValidUntil(value?.end ? value.end.toString().slice(0, 10) : '');
								}}
							>
								<Label>Período de validade</Label>
								<DateField.Group fullWidth variant="secondary">
									<DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
									<DateRangePicker.RangeSeparator />
									<DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
									<DateField.Suffix>
										<DateRangePicker.Trigger>
											<DateRangePicker.TriggerIndicator />
										</DateRangePicker.Trigger>
									</DateField.Suffix>
								</DateField.Group>
								<DateRangePicker.Popover>
									<RangeCalendar aria-label="Período de validade" visibleDuration={{ months: 2 }}>
										<RangeCalendar.Header>
											<RangeCalendar.YearPickerTrigger>
												<RangeCalendar.YearPickerTriggerHeading />
												<RangeCalendar.YearPickerTriggerIndicator />
											</RangeCalendar.YearPickerTrigger>
											<RangeCalendar.NavButton slot="previous" />
											<RangeCalendar.NavButton slot="next" />
										</RangeCalendar.Header>
										<RangeCalendar.Grid>
											<RangeCalendar.GridHeader>
												{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
											</RangeCalendar.GridHeader>
											<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
										</RangeCalendar.Grid>
										<RangeCalendar.YearPickerGrid>
											<RangeCalendar.YearPickerGridBody>
												{({ year }) => <RangeCalendar.YearPickerCell year={year} />}
											</RangeCalendar.YearPickerGridBody>
										</RangeCalendar.YearPickerGrid>
									</RangeCalendar>
								</DateRangePicker.Popover>
							</DateRangePicker>
						</div>
					</div>
					),
				})}

				{/* Scope */}
				{renderAccordionCard({
					id: 'rules-scope',
					icon: Settings02Icon,
					title: 'Escopo',
					summary: `Produtos: ${applyToAllProducts ? 'Todos' : 'Selecionados'} • Checkouts: ${applyToAllCheckouts ? 'Todos' : 'Selecionados'}`,
					children: (
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg">
								<div>
									<p className="text-sm font-medium">Aplicar a todos os produtos</p>
									<p className="text-xs text-muted">Se desativado, vincule produtos específicos</p>
								</div>
								<Switch isSelected={applyToAllProducts} onChange={() => setApplyToAllProducts(!applyToAllProducts)}>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch>
							</div>

							<div className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg">
								<div>
									<p className="text-sm font-medium">Aplicar a todos os checkouts</p>
									<p className="text-xs text-muted">Se desativado, vincule checkouts específicos</p>
								</div>
								<Switch isSelected={applyToAllCheckouts} onChange={() => setApplyToAllCheckouts(!applyToAllCheckouts)}>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch>
							</div>
						</div>
					</div>
					),
				})}

				</>
				)}

				{!isEditMode && currentStep === lastStepIndex && (
				<div className="flex flex-col gap-4">
					{hasValidatedReview && reviewValidationErrors.length > 0 && (
						<ReviewIssuesAlert issues={reviewValidationErrors} title="Corrija os itens abaixo antes de salvar:" />
					)}
					<div className="rounded-lg bg-surface-secondary p-4 flex flex-col gap-2">
						<p className="text-sm font-medium">Resumo do Cupom</p>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<span className="text-muted">Código</span>
							<span className="font-mono">{code || '—'}</span>
							<span className="text-muted">Nome</span>
							<span>{name || '—'}</span>
							<span className="text-muted">Tipo de Desconto</span>
							<span>{couponDiscountTypeParse[discountType].label}</span>
							{discountType === CouponDiscountType.Percentage && discountPercentage && (
								<><span className="text-muted">Percentual</span><span>{discountPercentage}%</span></>
							)}
							{discountType === CouponDiscountType.FixedAmount && discountFixedAmount && (
								<><span className="text-muted">Valor Fixo</span><span>R$ {discountFixedAmount.toFixed(2).replace('.', ',')}</span></>
							)}
							{validFrom && <><span className="text-muted">Válido de</span><span>{validFrom}</span></>}
							{validUntil && <><span className="text-muted">Válido até</span><span>{validUntil}</span></>}
						</div>
					</div>
					{state.error && (
						<div className="flex items-center gap-2 text-sm text-danger p-4 bg-danger/10 rounded-lg">
							<Icon icon={Alert01Icon} className="icon-sm" />
							<span>{state.error}</span>
						</div>
					)}
				</div>
				)}
			</form>

			<ConfirmationModal
				isOpen={isDeleteModalOpen}
				onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}
				title="Excluir cupom"
				description={`Tem certeza que deseja excluir o cupom ${coupon?.code ?? ''}? Esta ação não pode ser desfeita.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={() => void handleDeleteCoupon()}
				isPending={isDeletePending}
			/>
		</div>
	);
}
