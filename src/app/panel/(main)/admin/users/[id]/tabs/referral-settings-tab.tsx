'use client';

import { useRef, useState, useTransition } from 'react';
import { NumericFormat } from 'react-number-format';
import { Accordion, Alert, Button, Chip, FieldError, Form, Input, Label, ListBox, Select, TextField } from '@heroui/react';
import { toast } from '@heroui/react';
import {
	InformationCircleIcon,
	ArrowReloadHorizontalIcon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	ArrowDown01Icon,
	Target02Icon,
} from '@hugeicons/core-free-icons';

import { adminUpdateUserReferralSettings } from '@/app/actions/admin/users';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import { Icon } from '@/components/ui/icon';
import {
	basisPointsToPercentage,
	centsToFormattedCurrency,
	formattedCurrencyToCents,
	percentageToBasisPoints,
} from '@/utils/currency';
import { percentageFormatProps } from '@/utils/input-masks';
import { FormSaveFooter } from '@/components/ui/form-save-footer';
import { CurrencyCentsInput, type CurrencyCentsInputRef } from '@/components/ui/currency-cents-input';
import { mapParseColorToChipColor } from '@/parse';
import { ReferralWithdrawalIntervalUnit } from '@/types/enums';

const referralIntervalUnitOptions = [
	{
		key: ReferralWithdrawalIntervalUnit.Days,
		label: 'Dias',
		color: 'accent' as const,
	},
	{
		key: ReferralWithdrawalIntervalUnit.Months,
		label: 'Meses',
		color: 'warning' as const,
	},
];

function intervalUnitLabel(unit: ReferralWithdrawalIntervalUnit): string {
	return unit === ReferralWithdrawalIntervalUnit.Months ? 'meses' : 'dias';
}

interface ReferralSettingsTabProps {
	userId: string;
	initialReferralDurationMonths: number | null;
	initialReferralCommissionPercentage: number | null;
	initialReferralCommissionWithdrawalIntervalValue: number | null;
	initialReferralCommissionWithdrawalIntervalUnit: ReferralWithdrawalIntervalUnit | null;
	initialReferralCommissionMinWithdrawalAmount: number | null;
	initialReferralCommissionWithdrawalFeeFixed: number | null;
	initialUpdatedAt: string | null;
	platformSettings: AdminPlatformSettingsData;
	onSaved?: () => void;
}

function PlatformDefault({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-2 text-xs text-muted">
			<Icon icon={InformationCircleIcon} className="icon-xs shrink-0" />
			<span>
				{label}: <span className="font-medium text-foreground">{value}</span>
			</span>
		</div>
	);
}

interface EditableFieldWithResetProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onReset: () => void;
	error: string | null;
	children: React.ReactNode;
	platformDefault: string;
}

function EditableFieldWithReset({ label, value, onChange, onReset, error, children, platformDefault }: EditableFieldWithResetProps) {
	return (
		<div className="flex flex-col gap-2">
			<TextField variant="secondary" className="w-full" validate={() => error}>
				<Label>{label}</Label>
				<div className="flex items-center gap-2">
					{children}
					{value && (
						<Button isIconOnly variant="ghost" size="sm" onPress={onReset}>
							<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
						</Button>
					)}
				</div>
				<FieldError />
			</TextField>
			<PlatformDefault label="Padrão" value={platformDefault} />
		</div>
	);
}




export function ReferralSettingsTab({
	userId,
	initialReferralDurationMonths,
	initialReferralCommissionPercentage,
	initialReferralCommissionWithdrawalIntervalValue,
	initialReferralCommissionWithdrawalIntervalUnit,
	initialReferralCommissionMinWithdrawalAmount,
	initialReferralCommissionWithdrawalFeeFixed,
	initialUpdatedAt,
	platformSettings,
	onSaved,
}: ReferralSettingsTabProps) {
	const [isPending, startTransition] = useTransition();
	const [lastUpdated, setLastUpdated] = useState(initialUpdatedAt);
	const [durationMonths, setDurationMonths] = useState(initialReferralDurationMonths?.toString() ?? '');
	const [commissionPercentage, setCommissionPercentage] = useState(
		basisPointsToPercentage(initialReferralCommissionPercentage)
	);
	const [withdrawalIntervalValue, setWithdrawalIntervalValue] = useState(
		initialReferralCommissionWithdrawalIntervalValue?.toString() ?? ''
	);
	const [withdrawalIntervalUnit, setWithdrawalIntervalUnit] = useState<ReferralWithdrawalIntervalUnit | ''>(
		initialReferralCommissionWithdrawalIntervalUnit ?? ''
	);
	const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(
		initialReferralCommissionMinWithdrawalAmount != null
			? centsToFormattedCurrency(initialReferralCommissionMinWithdrawalAmount)
			: ''
	);
	const [withdrawalFeeFixed, setWithdrawalFeeFixed] = useState(
		initialReferralCommissionWithdrawalFeeFixed != null
			? centsToFormattedCurrency(initialReferralCommissionWithdrawalFeeFixed)
			: ''
	);
	const [initialDurationMonths, setInitialDurationMonths] = useState(initialReferralDurationMonths?.toString() ?? '');
	const [initialCommissionPercentage, setInitialCommissionPercentage] = useState(
		basisPointsToPercentage(initialReferralCommissionPercentage)
	);
	const [initialWithdrawalIntervalValue, setInitialWithdrawalIntervalValue] = useState(
		initialReferralCommissionWithdrawalIntervalValue?.toString() ?? ''
	);
	const [initialWithdrawalIntervalUnit, setInitialWithdrawalIntervalUnit] = useState<ReferralWithdrawalIntervalUnit | ''>(
		initialReferralCommissionWithdrawalIntervalUnit ?? ''
	);
	const [initialMinWithdrawalAmount, setInitialMinWithdrawalAmount] = useState(
		initialReferralCommissionMinWithdrawalAmount != null
			? centsToFormattedCurrency(initialReferralCommissionMinWithdrawalAmount)
			: ''
	);
	const [initialWithdrawalFeeFixed, setInitialWithdrawalFeeFixed] = useState(
		initialReferralCommissionWithdrawalFeeFixed != null
			? centsToFormattedCurrency(initialReferralCommissionWithdrawalFeeFixed)
			: ''
	);

	const minWithdrawalAmountRef = useRef<CurrencyCentsInputRef>(null);
	const withdrawalFeeFixedRef = useRef<CurrencyCentsInputRef>(null);

	const hasChanges =
		durationMonths !== initialDurationMonths
		|| commissionPercentage !== initialCommissionPercentage
		|| withdrawalIntervalValue !== initialWithdrawalIntervalValue
		|| withdrawalIntervalUnit !== initialWithdrawalIntervalUnit
		|| minWithdrawalAmount !== initialMinWithdrawalAmount
		|| withdrawalFeeFixed !== initialWithdrawalFeeFixed;
	const parsedDurationMonths = durationMonths === '' ? null : Number(durationMonths);
	const parsedCommissionBasisPoints = percentageToBasisPoints(commissionPercentage);
	const effectiveDurationMonths =
		parsedDurationMonths !== null && !isNaN(parsedDurationMonths)
			? parsedDurationMonths
			: platformSettings.referralDurationMonths;
	const effectiveCommissionBasisPoints =
		parsedCommissionBasisPoints !== null ? parsedCommissionBasisPoints : platformSettings.referralCommissionPercentage;
	const parsedWithdrawalIntervalValue = withdrawalIntervalValue === '' ? null : Number(withdrawalIntervalValue);
	const effectiveWithdrawalIntervalValue =
		parsedWithdrawalIntervalValue !== null && !isNaN(parsedWithdrawalIntervalValue)
			? parsedWithdrawalIntervalValue
			: platformSettings.referralCommissionWithdrawalIntervalValue;
	const effectiveWithdrawalIntervalUnit = withdrawalIntervalUnit || platformSettings.referralCommissionWithdrawalIntervalUnit;
	const parsedMinWithdrawalAmount = minWithdrawalAmount === '' ? null : formattedCurrencyToCents(minWithdrawalAmount);
	const effectiveMinWithdrawalAmount = parsedMinWithdrawalAmount ?? platformSettings.referralCommissionMinWithdrawalAmount;
	const parsedWithdrawalFeeFixed = withdrawalFeeFixed === '' ? null : formattedCurrencyToCents(withdrawalFeeFixed);
	const effectiveWithdrawalFeeFixed = parsedWithdrawalFeeFixed ?? platformSettings.referralCommissionWithdrawalFeeFixed;

	const durationError =
		parsedDurationMonths !== null && (isNaN(parsedDurationMonths) || parsedDurationMonths < 1 || parsedDurationMonths > 120)
			? 'A duração deve estar entre 1 e 120 meses'
			: null;
	const commissionError =
		commissionPercentage !== '' &&
		(parsedCommissionBasisPoints === null || parsedCommissionBasisPoints < 0 || parsedCommissionBasisPoints > 10000)
			? 'A comissão deve estar entre 0% e 100%'
			: null;
	const withdrawalIntervalValueError =
		parsedWithdrawalIntervalValue !== null
			&& (isNaN(parsedWithdrawalIntervalValue) || parsedWithdrawalIntervalValue < 0 || parsedWithdrawalIntervalValue > 120)
			? 'O intervalo deve estar entre 0 e 120'
			: null;
	const minWithdrawalAmountError =
		parsedMinWithdrawalAmount !== null && parsedMinWithdrawalAmount < 0
			? 'O valor não pode ser negativo'
			: null;
	const withdrawalFeeFixedError =
		parsedWithdrawalFeeFixed !== null && parsedWithdrawalFeeFixed < 0
			? 'O valor não pode ser negativo'
			: null;
	const hasErrors =
		durationError !== null
		|| commissionError !== null
		|| withdrawalIntervalValueError !== null
		|| minWithdrawalAmountError !== null
		|| withdrawalFeeFixedError !== null;

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!hasChanges || hasErrors) return;

		startTransition(async () => {
			const response = await adminUpdateUserReferralSettings(userId, {
				referralDurationMonths: parsedDurationMonths,
				referralCommissionPercentage: parsedCommissionBasisPoints,
				referralCommissionWithdrawalIntervalValue: parsedWithdrawalIntervalValue,
				referralCommissionWithdrawalIntervalUnit: withdrawalIntervalUnit || null,
				referralCommissionMinWithdrawalAmount: parsedMinWithdrawalAmount,
				referralCommissionWithdrawalFeeFixed: parsedWithdrawalFeeFixed,
			});

			if (response.error) {
				toast('Erro ao salvar', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			const nextDuration = response.data?.referralDurationMonths?.toString() ?? '';
			const nextCommission = basisPointsToPercentage(response.data?.referralCommissionPercentage ?? null);
			const nextWithdrawalIntervalValue = response.data?.referralCommissionWithdrawalIntervalValue?.toString() ?? '';
			const nextWithdrawalIntervalUnit = response.data?.referralCommissionWithdrawalIntervalUnit ?? '';
			const nextMinWithdrawalAmount = response.data?.referralCommissionMinWithdrawalAmount != null
				? centsToFormattedCurrency(response.data.referralCommissionMinWithdrawalAmount)
				: '';
			const nextWithdrawalFeeFixed = response.data?.referralCommissionWithdrawalFeeFixed != null
				? centsToFormattedCurrency(response.data.referralCommissionWithdrawalFeeFixed)
				: '';

			setDurationMonths(nextDuration);
			setCommissionPercentage(nextCommission);
			setWithdrawalIntervalValue(nextWithdrawalIntervalValue);
			setWithdrawalIntervalUnit(nextWithdrawalIntervalUnit);
			minWithdrawalAmountRef.current?.setValueInCents(response.data?.referralCommissionMinWithdrawalAmount ?? 0);
			withdrawalFeeFixedRef.current?.setValueInCents(response.data?.referralCommissionWithdrawalFeeFixed ?? 0);
			setInitialDurationMonths(nextDuration);
			setInitialCommissionPercentage(nextCommission);
			setInitialWithdrawalIntervalValue(nextWithdrawalIntervalValue);
			setInitialWithdrawalIntervalUnit(nextWithdrawalIntervalUnit);
			setInitialMinWithdrawalAmount(nextMinWithdrawalAmount);
			setInitialWithdrawalFeeFixed(nextWithdrawalFeeFixed);
			setLastUpdated(new Date().toISOString());

			toast('Configurações salvas', {
				description: 'As configurações de indicação do usuário foram atualizadas com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			onSaved?.();
		});
	}

	return (
		<Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
			{hasChanges && (
				<Alert status="warning">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Alterações não salvas</Alert.Title>
						<Alert.Description>
							Você tem alterações não salvas. Clique em &quot;Salvar configurações&quot; para aplicar as mudanças.
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<Accordion defaultExpandedKeys={[]}>
				<Accordion.Item id="referrals" className="rounded-xl border border-divider bg-surface">
					<Accordion.Heading>
						<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft">
									<Icon icon={Target02Icon} className="icon-md text-accent" />
								</div>
								<div className="flex flex-col items-start">
									<span className="font-medium">Indique e ganhe</span>
									<span className="text-xs text-accent">
										Duração: {effectiveDurationMonths} meses | Comissão:{' '}
										{basisPointsToPercentage(effectiveCommissionBasisPoints)}% | Novo saque: {effectiveWithdrawalIntervalValue} {intervalUnitLabel(effectiveWithdrawalIntervalUnit)} | Mínimo: {centsToFormattedCurrency(effectiveMinWithdrawalAmount)} | Taxa fixa: {centsToFormattedCurrency(effectiveWithdrawalFeeFixed)}
									</span>
								</div>
							</div>
							<Accordion.Indicator>
								<Icon icon={ArrowDown01Icon} className="icon-sm text-muted transition-transform duration-200" />
							</Accordion.Indicator>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel>
						<Accordion.Body className="flex flex-col gap-4 p-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
								<EditableFieldWithReset
									label="Duração da indicação (meses)"
									value={durationMonths}
									onChange={setDurationMonths}
									onReset={() => setDurationMonths('')}
									error={durationError}
									platformDefault={`${platformSettings.referralDurationMonths} ${platformSettings.referralDurationMonths === 1 ? 'mês' : 'meses'}`}
								>
									<Input variant="secondary" type="number" placeholder="Usar padrão" className="w-full" min={1} max={120} />
								</EditableFieldWithReset>

								<EditableFieldWithReset
									label="Intervalo para novo saque (valor)"
									value={withdrawalIntervalValue}
									onChange={setWithdrawalIntervalValue}
									onReset={() => setWithdrawalIntervalValue('')}
									error={withdrawalIntervalValueError}
									platformDefault={`${platformSettings.referralCommissionWithdrawalIntervalValue} ${intervalUnitLabel(platformSettings.referralCommissionWithdrawalIntervalUnit)}`}
								>
									<Input variant="secondary" type="number" placeholder="Usar padrão" className="w-full" min={0} max={120} />
								</EditableFieldWithReset>

								<div className="flex flex-col gap-2">
									<Select
										variant="secondary"
										className="w-full"
										aria-label="Unidade do intervalo para novo saque"
										value={withdrawalIntervalUnit}
										onChange={(key) => setWithdrawalIntervalUnit((key as ReferralWithdrawalIntervalUnit | null) ?? '')}
									>
										<Label>Intervalo para novo saque (unidade)</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{referralIntervalUnitOptions.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(option.color)}>{option.label}</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<PlatformDefault label="Padrão" value={intervalUnitLabel(platformSettings.referralCommissionWithdrawalIntervalUnit)} />
								</div>

								<EditableFieldWithReset
									label="Comissão da indicação (%)"
									value={commissionPercentage}
									onChange={setCommissionPercentage}
									onReset={() => setCommissionPercentage('')}
									error={commissionError}
									platformDefault={`${(platformSettings.referralCommissionPercentage / 100).toFixed(2).replace('.', ',')}%`}
								>
									<NumericFormat
										customInput={Input}
										className="w-full"
										{...percentageFormatProps}
										value={commissionPercentage}
										placeholder="Usar padrão"
										onValueChange={(values) => setCommissionPercentage(values.formattedValue)}
									/>
								</EditableFieldWithReset>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<EditableFieldWithReset
									label="Valor mínimo de saque da comissão (R$)"
									value={minWithdrawalAmount}
									onChange={setMinWithdrawalAmount}
									onReset={() => minWithdrawalAmountRef.current?.setValueInCents(0)}
									error={minWithdrawalAmountError}
									platformDefault={centsToFormattedCurrency(platformSettings.referralCommissionMinWithdrawalAmount)}
								>
									<CurrencyCentsInput
										ref={minWithdrawalAmountRef}
										className="w-full"
										variant="secondary"
										initialValueInCents={initialReferralCommissionMinWithdrawalAmount ?? undefined}
										placeholder="Usar padrão"
										onValueChange={(v) => setMinWithdrawalAmount(v)}
									/>
								</EditableFieldWithReset>

								<EditableFieldWithReset
									label="Taxa fixa de saque da comissão (R$)"
									value={withdrawalFeeFixed}
									onChange={setWithdrawalFeeFixed}
									onReset={() => withdrawalFeeFixedRef.current?.setValueInCents(0)}
									error={withdrawalFeeFixedError}
									platformDefault={centsToFormattedCurrency(platformSettings.referralCommissionWithdrawalFeeFixed)}
								>
									<CurrencyCentsInput
										ref={withdrawalFeeFixedRef}
										className="w-full"
										variant="secondary"
										initialValueInCents={initialReferralCommissionWithdrawalFeeFixed ?? undefined}
										placeholder="Usar padrão"
										onValueChange={(v) => setWithdrawalFeeFixed(v)}
									/>
								</EditableFieldWithReset>
							</div>
						</Accordion.Body>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>

			<FormSaveFooter
				submitLabel="Salvar configurações"
				isPending={isPending}
				isDisabled={!hasChanges || hasErrors}
				lastUpdated={lastUpdated}
				tips={['Campos vazios utilizam as configurações padrão da plataforma.']}
			/>
		</Form>
	);
}
