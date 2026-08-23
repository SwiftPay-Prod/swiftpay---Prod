'use client';

import { Wallet01Icon, ArrowReloadHorizontalIcon } from '@hugeicons/core-free-icons';
import { Button, Checkbox, Chip, FieldError, Input, Label, ListBox, Select, Separator, TextField } from '@heroui/react';
import type { Key } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { Icon } from '@/components/ui/icon';
import { PlatformDefault } from './platform-default';
import { FeeProfitIndicator } from './fee-profit-indicator';
import type { MerchantSettingsFormData, AdminMerchantAcquirerData } from '@/types/admin/merchants';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import { FeeChargeMode } from '@/types/enums';
import { feeChargeModeParse, mapParseColorToChipColor } from '@/parse';
import { formattedCurrencyToCents, formatCurrency, percentageToBasisPoints } from '@/utils/currency';
import { percentageFormatProps } from '@/utils/input-masks';

interface FeeModeOption {
	key: string;
	label: string;
	icon: React.ReactNode;
	color: 'default' | 'accent' | 'warning' | 'success';
}

interface PixSettingsAccordionProps {
	formData: MerchantSettingsFormData;
	platformSettings: AdminPlatformSettingsData;
	acquirer: AdminMerchantAcquirerData | null;
	showReserveField: boolean;
	showReserveCompensationField: boolean;
	onToggleReserveField: (isSelected: boolean) => void;
	onToggleReserveCompensationField: (isSelected: boolean) => void;
	feeChargeModeSelectOptionsWithDefault: FeeModeOption[];
	onFieldChange: (field: keyof MerchantSettingsFormData, value: string) => void;
	onSelectChange: (field: keyof MerchantSettingsFormData, key: Key | null) => void;
	onResetField: (field: keyof MerchantSettingsFormData) => void;
	formatEffectiveAmount: (merchantAmount: string, platformAmount: number) => string;
	formatFeeModeLabel: (mode: string, platformMode: FeeChargeMode) => string;
	formatEffectiveFee: (
		merchantFeeMode: string,
		merchantFeeFixed: string,
		merchantFeePercentage: string,
		platformFeeMode: FeeChargeMode,
		platformFeeFixed: number,
		platformFeePercentage: number
	) => string;
	formatEffectiveReserve: (merchantReservePercentage: string, platformReservePercentage: number) => string;
	formatEffectiveReserveCompensationDays: (
		merchantReserveCompensationDays: string,
		platformReserveCompensationDays: number
	) => string;
}

function shouldShowFixedFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.PercentageOnly;
}

function shouldShowPercentageFeeInput(mode: FeeChargeMode): boolean {
	return mode !== FeeChargeMode.FixedOnly;
}

export function PixSettingsAccordion({
	formData,
	platformSettings,
	acquirer,
	showReserveField,
	showReserveCompensationField,
	onToggleReserveField,
	onToggleReserveCompensationField,
	feeChargeModeSelectOptionsWithDefault,
	onFieldChange,
	onSelectChange,
	onResetField,
	formatEffectiveAmount,
	formatFeeModeLabel,
	formatEffectiveFee,
	formatEffectiveReserve,
	formatEffectiveReserveCompensationDays,
}: PixSettingsAccordionProps) {
	return (
		<SystemAccordion
			id="pix"
			icon={Wallet01Icon}
			title="PIX"
			color="emerald"
			defaultExpanded={false}
			summary={
				<>
					Min {formatEffectiveAmount(formData.pixMinTransactionAmount, platformSettings.pixMinTransactionAmount)}
					{' | '}Máx {formatEffectiveAmount(formData.pixMaxTransactionAmount, platformSettings.pixMaxTransactionAmount)}
					{' | '}API ({formatFeeModeLabel(formData.pixApiFeeMode, platformSettings.pixApiFeeMode as FeeChargeMode)}){' '}
					{formatEffectiveFee(
						formData.pixApiFeeMode,
						formData.pixApiFeeFixed,
						formData.pixApiFeePercentage,
						platformSettings.pixApiFeeMode as FeeChargeMode,
						platformSettings.pixApiFeeFixed,
						platformSettings.pixApiFeePercentage
					)}
					{' | '}Checkout ({formatFeeModeLabel(formData.pixCheckoutFeeMode, platformSettings.pixCheckoutFeeMode as FeeChargeMode)}){' '}
					{formatEffectiveFee(
						formData.pixCheckoutFeeMode,
						formData.pixCheckoutFeeFixed,
						formData.pixCheckoutFeePercentage,
						platformSettings.pixCheckoutFeeMode as FeeChargeMode,
						platformSettings.pixCheckoutFeeFixed,
						platformSettings.pixCheckoutFeePercentage
					)}
					{' | '}Link ({formatFeeModeLabel(formData.pixPaymentLinkFeeMode, platformSettings.pixPaymentLinkFeeMode as FeeChargeMode)}){' '}
					{formatEffectiveFee(
						formData.pixPaymentLinkFeeMode,
						formData.pixPaymentLinkFeeFixed,
						formData.pixPaymentLinkFeePercentage,
						platformSettings.pixPaymentLinkFeeMode as FeeChargeMode,
						platformSettings.pixPaymentLinkFeeFixed,
						platformSettings.pixPaymentLinkFeePercentage
					)}
					{' | '}Reserva {formatEffectiveReserve(formData.pixReservePercentage, platformSettings.pixReservePercentage)}
					{' | '}Compensação{' '}
					{formatEffectiveReserveCompensationDays(
						formData.pixReserveCompensationDays,
						platformSettings.pixReserveCompensationDays
					)}
				</>
			}
		>
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<Chip variant="soft" color="accent" size="sm">
					Limites
				</Chip>
				<span>Valores mínimo e máximo de transação</span>
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-2">
					<TextField
						variant="secondary"
						name="pixMinTransactionAmount"
						validate={() => {
							const cents = formattedCurrencyToCents(formData.pixMinTransactionAmount);
							if (cents !== null && cents < 0) return 'O valor não pode ser negativo';
							return null;
						}}
					>
						<Label>Valor Mínimo (R$)</Label>
						<div className="flex items-center gap-2">
							<CurrencyCentsInput
								initialValueInCents={formattedCurrencyToCents(formData.pixMinTransactionAmount) ?? undefined}
								placeholder="Usar padrão do sistema"
								className="flex-1"
								onValueChange={(value) => onFieldChange('pixMinTransactionAmount', value)}
							/>
							{formData.pixMinTransactionAmount && (
								<Button isIconOnly variant="ghost" size="sm" onPress={() => onResetField('pixMinTransactionAmount')}>
									<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
								</Button>
							)}
						</div>
						<FieldError />
					</TextField>
					<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.pixMinTransactionAmount)} />
				</div>

				<div className="flex flex-col gap-2">
					<TextField
						variant="secondary"
						name="pixMaxTransactionAmount"
						value={formData.pixMaxTransactionAmount ?? ''}
						validate={() => {
							const max = formattedCurrencyToCents(formData.pixMaxTransactionAmount);
							if (max !== null && max < 0) return 'O valor não pode ser negativo';
							const min = formattedCurrencyToCents(formData.pixMinTransactionAmount);
							if (min !== null && max !== null && max < min) {
								return 'O valor máximo não pode ser menor que o valor mínimo';
							}
							return null;
						}}
					>
						<Label>Valor Máximo (R$)</Label>
						<div className="flex items-center gap-2">
							<CurrencyCentsInput
								initialValueInCents={formattedCurrencyToCents(formData.pixMaxTransactionAmount) ?? undefined}
								placeholder="Usar padrão do sistema"
								className="flex-1"
								onValueChange={(value) => onFieldChange('pixMaxTransactionAmount', value)}
							/>
							{formData.pixMaxTransactionAmount && (
								<Button isIconOnly variant="ghost" size="sm" onPress={() => onResetField('pixMaxTransactionAmount')}>
									<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
								</Button>
							)}
						</div>
						<FieldError />
					</TextField>
					<PlatformDefault label="Padrão" value={formatCurrency(platformSettings.pixMaxTransactionAmount)} />
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-3">
				<Checkbox variant="secondary" isSelected={showReserveField} onChange={onToggleReserveField}>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
					<Checkbox.Content>Configurar reserva</Checkbox.Content>
				</Checkbox>

				<Checkbox
					variant="secondary"
					isSelected={showReserveCompensationField}
					onChange={onToggleReserveCompensationField}
				>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
					<Checkbox.Content>Configurar compensação</Checkbox.Content>
				</Checkbox>
			</div>

			{(showReserveField || showReserveCompensationField) && (
				<div
					className={
						showReserveField && showReserveCompensationField
							? 'grid grid-cols-1 gap-4 md:grid-cols-2'
							: 'grid grid-cols-1 gap-4'
					}
				>
					{showReserveField && (
						<div className="flex flex-col gap-2">
							<TextField
								variant="secondary"
								name="pixReservePercentage"
								value={formData.pixReservePercentage ?? ''}
								validate={() => {
									const basisPoints = percentageToBasisPoints(formData.pixReservePercentage);
									if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
										return 'O percentual deve estar entre 0% e 100%';
									}
									return null;
								}}
							>
								<Label>Reserva Financeira (%)</Label>
								<div className="flex items-center gap-2">
									<NumericFormat
										customInput={Input}
										{...percentageFormatProps}
										value={formData.pixReservePercentage}
										placeholder="Usar padrão"
										className="flex-1"
										onValueChange={(values) => onFieldChange('pixReservePercentage', values.formattedValue)}
									/>
									{formData.pixReservePercentage && (
										<Button isIconOnly variant="ghost" size="sm" onPress={() => onResetField('pixReservePercentage')}>
											<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
										</Button>
									)}
								</div>
								<FieldError />
							</TextField>
							<PlatformDefault label="Padrão" value={`${(platformSettings.pixReservePercentage / 100).toFixed(2)}%`} />
						</div>
					)}

					{showReserveCompensationField && (
						<div className="flex flex-col gap-2">
							<TextField
								variant="secondary"
								name="pixReserveCompensationDays"
								value={formData.pixReserveCompensationDays ?? ''}
								validate={() => {
									const days = formData.pixReserveCompensationDays
										? Number(formData.pixReserveCompensationDays)
										: null;
									if (days !== null && (!Number.isInteger(days) || days < 0 || days > 365)) {
										return 'Os dias devem estar entre 0 e 365';
									}
									return null;
								}}
							>
								<Label>Compensação da Reserva (dias)</Label>
								<div className="flex items-center gap-2">
									<Input
										variant="secondary"
										type="number"
										min={0}
										max={365}
										placeholder="Usar padrão"
										className="flex-1"
										value={formData.pixReserveCompensationDays}
										onChange={(e) => onFieldChange('pixReserveCompensationDays', e.target.value)}
									/>
									{formData.pixReserveCompensationDays && (
										<Button
											isIconOnly
											variant="ghost"
											size="sm"
											onPress={() => onResetField('pixReserveCompensationDays')}
										>
											<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
										</Button>
									)}
								</div>
								<FieldError />
							</TextField>
							<PlatformDefault label="Padrão" value={`${platformSettings.pixReserveCompensationDays} dias`} />
						</div>
					)}
				</div>
			)}

			<Separator />

			<div className="grid grid-cols-1 gap-6">
				{[
					{
						label: 'API',
						description: 'Taxas para integrações diretas',
						mode: 'pixApiFeeMode',
						fixed: 'pixApiFeeFixed',
						percentage: 'pixApiFeePercentage',
						platformMode: platformSettings.pixApiFeeMode as FeeChargeMode,
						platformFixed: platformSettings.pixApiFeeFixed,
						platformPercentage: platformSettings.pixApiFeePercentage,
					},
					{
						label: 'Checkout',
						description: 'Taxas para checkout integrado',
						mode: 'pixCheckoutFeeMode',
						fixed: 'pixCheckoutFeeFixed',
						percentage: 'pixCheckoutFeePercentage',
						platformMode: platformSettings.pixCheckoutFeeMode as FeeChargeMode,
						platformFixed: platformSettings.pixCheckoutFeeFixed,
						platformPercentage: platformSettings.pixCheckoutFeePercentage,
					},
					{
						label: 'Link de Pagamento',
						description: 'Taxas para link de pagamento',
						mode: 'pixPaymentLinkFeeMode',
						fixed: 'pixPaymentLinkFeeFixed',
						percentage: 'pixPaymentLinkFeePercentage',
						platformMode: platformSettings.pixPaymentLinkFeeMode as FeeChargeMode,
						platformFixed: platformSettings.pixPaymentLinkFeeFixed,
						platformPercentage: platformSettings.pixPaymentLinkFeePercentage,
					},
				].map((section) => {
					const modeValue = formData[section.mode as keyof MerchantSettingsFormData] as string;
					const fixedValue = formData[section.fixed as keyof MerchantSettingsFormData] as string;
					const percentageValue = formData[section.percentage as keyof MerchantSettingsFormData] as string;
					const effectiveMode =
						modeValue === 'default' ? section.platformMode : (modeValue as FeeChargeMode);
					const showFixedFeeInput = shouldShowFixedFeeInput(effectiveMode);
					const showPercentageFeeInput = shouldShowPercentageFeeInput(effectiveMode);

					return (
						<div key={section.label} className="flex flex-col gap-4">
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Chip variant="soft" color="accent" size="sm">
									{section.label}
								</Chip>
								<span>{section.description}</span>
							</div>
							<div
								className={
									showFixedFeeInput && showPercentageFeeInput
										? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
										: 'grid grid-cols-1 gap-4 2xl:grid-cols-2'
								}
							>
								<div className="flex flex-col gap-2">
									<Select
										variant="secondary"
										placeholder="Usar padrão do sistema"
										aria-label={`Modo de Taxa PIX ${section.label}`}
										value={modeValue}
										onChange={(key) => onSelectChange(section.mode as keyof MerchantSettingsFormData, key)}
									>
										<Label>Modo de Cobrança</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{feeChargeModeSelectOptionsWithDefault.map((option) => (
													<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(option.color)} className="gap-1">
															{option.icon}
															{option.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<PlatformDefault label="Padrão" value={feeChargeModeParse[section.platformMode]?.label ?? '-'} />
								</div>

								{showFixedFeeInput && (
									<div className="flex flex-col gap-2">
										<TextField
											variant="secondary"
											name={section.fixed}
											value={fixedValue ?? ''}
											isDisabled={modeValue === 'default' || effectiveMode === FeeChargeMode.PercentageOnly}
											validate={() => {
												const cents = formattedCurrencyToCents(fixedValue);
												if (cents !== null && cents < 0) return 'O valor não pode ser negativo';
												return null;
											}}
										>
											<Label>Valor Fixo (R$)</Label>
											<div className="flex items-center gap-2">
												<CurrencyCentsInput
													initialValueInCents={formattedCurrencyToCents(fixedValue) ?? undefined}
													placeholder="Usar padrão"
													className="flex-1"
													disabled={modeValue === 'default' || effectiveMode === FeeChargeMode.PercentageOnly}
													onValueChange={(value) => onFieldChange(section.fixed as keyof MerchantSettingsFormData, value)}
												/>
												{fixedValue && (
													<Button isIconOnly variant="ghost" size="sm" onPress={() => onResetField(section.fixed as keyof MerchantSettingsFormData)}>
														<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													</Button>
												)}
											</div>
											<FieldError />
										</TextField>
										<PlatformDefault label="Padrão" value={formatCurrency(section.platformFixed)} />
									</div>
								)}

								{showPercentageFeeInput && (
									<div className="flex flex-col gap-2">
										<TextField
											variant="secondary"
											name={section.percentage}
											value={percentageValue ?? ''}
											isDisabled={modeValue === 'default' || effectiveMode === FeeChargeMode.FixedOnly}
											validate={() => {
												const basisPoints = percentageToBasisPoints(percentageValue);
												if (basisPoints !== null && (basisPoints < 0 || basisPoints > 10000)) {
													return 'O percentual deve estar entre 0% e 100%';
												}
												return null;
											}}
										>
											<Label>Percentual (%)</Label>
											<div className="flex items-center gap-2">
												<NumericFormat
													customInput={Input}
													{...percentageFormatProps}
													value={percentageValue}
													placeholder="Usar padrão"
													className="flex-1"
													disabled={modeValue === 'default' || effectiveMode === FeeChargeMode.FixedOnly}
													onValueChange={(values) => onFieldChange(section.percentage as keyof MerchantSettingsFormData, values.formattedValue)}
												/>
												{percentageValue && (
													<Button isIconOnly variant="ghost" size="sm" onPress={() => onResetField(section.percentage as keyof MerchantSettingsFormData)}>
														<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													</Button>
												)}
											</div>
											<FieldError />
										</TextField>
										<PlatformDefault label="Padrão" value={`${(section.platformPercentage / 100).toFixed(2)}%`} />
									</div>
								)}
							</div>

							{acquirer && (
								<FeeProfitIndicator
									merchantFeeMode={modeValue}
									merchantFeeFixed={fixedValue}
									merchantFeePercentage={percentageValue}
									acquirerFeeMode={acquirer.pixInFeeMode}
									acquirerFeeFixed={acquirer.pixInFeeFixed}
									acquirerFeePercentage={acquirer.pixInFeePercentage}
									platformFeeMode={section.platformMode}
									platformFeeFixed={section.platformFixed}
									platformFeePercentage={section.platformPercentage}
								/>
							)}
						</div>
					);
				})}
			</div>
		</SystemAccordion>
	);
}
