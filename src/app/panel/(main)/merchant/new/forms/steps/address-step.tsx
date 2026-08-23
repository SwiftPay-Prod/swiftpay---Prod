import { Alert, Checkbox, FieldError, Input, InputGroup, Label, Spinner, TextField } from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import { cepFormat, formatCep } from '@/utils/input-masks';
import type { MerchantOnboardingAnswers } from '../../types/merchant-onboarding.types';
import type { FieldCorrectionsResolver, OnboardingValueChange, StepErrorMatcher } from './types';
import { CorrectionFieldLabel, CorrectionHint } from './correction-hint';

interface AddressStepProps {
	answers: MerchantOnboardingAnswers;
	isBusy: boolean;
	isFieldEditable: (field: keyof MerchantOnboardingAnswers) => boolean;
	isFetchingCep: boolean;
	canEditAddressFields: boolean;
	cepLookupError: string | null;
	allowManualAddressEntry: boolean;
	setAllowManualAddressEntry: (value: boolean) => void;
	matchesStepError: StepErrorMatcher;
	getFieldCorrections: FieldCorrectionsResolver;
	onPostalCodeChange: (value: string) => Promise<void>;
	onValueChange: OnboardingValueChange;
}

function sanitizeLetters(value: string, maxLength = 2): string {
	return value
		.replace(/[^a-zA-Z]/g, '')
		.toUpperCase()
		.slice(0, maxLength);
}

export function AddressStep({
	answers,
	isBusy,
	isFieldEditable,
	isFetchingCep,
	canEditAddressFields,
	cepLookupError,
	allowManualAddressEntry,
	setAllowManualAddressEntry,
	matchesStepError,
	getFieldCorrections,
	onPostalCodeChange,
	onValueChange,
}: AddressStepProps) {
	const addressStreetError = matchesStepError('address', 'Endereço é obrigatório.');
	const addressNumberError = matchesStepError('address', 'Número do endereço é obrigatório.');
	const addressNeighborhoodError = matchesStepError('address', 'Bairro é obrigatório.');
	const addressCityError = matchesStepError('address', 'Cidade é obrigatória.');
	const addressStateError = matchesStepError('address', 'Estado é obrigatório.');
	const addressPostalCodeError = matchesStepError('address', 'CEP é obrigatório.');
	const addressCountryError = matchesStepError('address', 'País é obrigatório.');
	const postalCodeCorrections = getFieldCorrections('postalCode');
	const addressCorrections = getFieldCorrections('address');
	const addressNumberCorrections = getFieldCorrections('addressNumber');
	const addressComplementCorrections = getFieldCorrections('addressComplement');
	const neighborhoodCorrections = getFieldCorrections('neighborhood');
	const cityCorrections = getFieldCorrections('city');
	const stateCorrections = getFieldCorrections('state');
	const countryCorrections = getFieldCorrections('country');

	return (
		<div className="flex flex-col gap-4">
			<TextField isRequired variant="secondary" isInvalid={!!addressPostalCodeError}>
				<Label>
					<CorrectionFieldLabel label="CEP" corrections={postalCodeCorrections} />
				</Label>
				<InputGroup>
					<PatternFormat
						customInput={InputGroup.Input}
						format={cepFormat}
						mask="_"
						value={formatCep(answers.postalCode)}
						onValueChange={(values) => {
							void onPostalCodeChange(values.value);
						}}
						placeholder="00000-000"
						disabled={isBusy || !isFieldEditable('postalCode')}
					/>
					{isFetchingCep && (
						<InputGroup.Suffix>
							<Spinner size="sm" />
						</InputGroup.Suffix>
					)}
				</InputGroup>
				{addressPostalCodeError && <FieldError>{addressPostalCodeError}</FieldError>}
				<CorrectionHint corrections={postalCodeCorrections} />
			</TextField>

			{cepLookupError && (
				<div className="flex flex-col gap-3">
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Não foi possível preencher o CEP automaticamente</Alert.Title>
							<Alert.Description>{cepLookupError}</Alert.Description>
						</Alert.Content>
					</Alert>

					<Checkbox
						variant="secondary"
						isSelected={allowManualAddressEntry}
						onChange={setAllowManualAddressEntry}
						isDisabled={isBusy || !isFieldEditable('postalCode')}
						className="w-full rounded-lg border border-border px-3 py-3"
					>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						<Checkbox.Content>
							<span className="text-sm font-medium text-foreground">Preencher endereço manualmente</span>
						</Checkbox.Content>
					</Checkbox>
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField isRequired variant="secondary" className="md:col-span-2" isInvalid={!!addressStreetError}>
					<Label>
						<CorrectionFieldLabel label="Endereço" corrections={addressCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.address}
						onChange={(event) => onValueChange('address', event.target.value)}
						placeholder="Rua, avenida ou travessa"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('address')}
					/>
					{addressStreetError && <FieldError>{addressStreetError}</FieldError>}
					<CorrectionHint corrections={addressCorrections} />
				</TextField>

				<TextField isRequired variant="secondary" isInvalid={!!addressNumberError}>
					<Label>
						<CorrectionFieldLabel label="Número" corrections={addressNumberCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.addressNumber}
						onChange={(event) => onValueChange('addressNumber', event.target.value)}
						placeholder="123"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('addressNumber')}
					/>
					{addressNumberError && <FieldError>{addressNumberError}</FieldError>}
					<CorrectionHint corrections={addressNumberCorrections} />
				</TextField>

				<TextField variant="secondary">
					<Label>
						<CorrectionFieldLabel label="Complemento" corrections={addressComplementCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.addressComplement}
						onChange={(event) => onValueChange('addressComplement', event.target.value)}
						placeholder="Sala, bloco, referência"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('addressComplement')}
					/>
					<CorrectionHint corrections={addressComplementCorrections} />
				</TextField>

				<TextField isRequired variant="secondary" isInvalid={!!addressNeighborhoodError}>
					<Label>
						<CorrectionFieldLabel label="Bairro" corrections={neighborhoodCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.neighborhood}
						onChange={(event) => onValueChange('neighborhood', event.target.value)}
						placeholder="Bairro"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('neighborhood')}
					/>
					{addressNeighborhoodError && <FieldError>{addressNeighborhoodError}</FieldError>}
					<CorrectionHint corrections={neighborhoodCorrections} />
				</TextField>

				<TextField isRequired variant="secondary" isInvalid={!!addressCityError}>
					<Label>
						<CorrectionFieldLabel label="Cidade" corrections={cityCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.city}
						onChange={(event) => onValueChange('city', event.target.value)}
						placeholder="Cidade"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('city')}
					/>
					{addressCityError && <FieldError>{addressCityError}</FieldError>}
					<CorrectionHint corrections={cityCorrections} />
				</TextField>

				<TextField isRequired variant="secondary" isInvalid={!!addressStateError}>
					<Label>
						<CorrectionFieldLabel label="Estado" corrections={stateCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.state}
						onChange={(event) => onValueChange('state', sanitizeLetters(event.target.value))}
						placeholder="SP"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('state')}
					/>
					{addressStateError && <FieldError>{addressStateError}</FieldError>}
					<CorrectionHint corrections={stateCorrections} />
				</TextField>

				<TextField isRequired variant="secondary" isInvalid={!!addressCountryError}>
					<Label>
						<CorrectionFieldLabel label="País" corrections={countryCorrections} />
					</Label>
					<Input
						variant="secondary"
						value={answers.country}
						onChange={(event) => onValueChange('country', sanitizeLetters(event.target.value))}
						placeholder="BR"
						disabled={isBusy || !canEditAddressFields || !isFieldEditable('country')}
					/>
					{addressCountryError && <FieldError>{addressCountryError}</FieldError>}
					<CorrectionHint corrections={countryCorrections} />
				</TextField>
			</div>
		</div>
	);
}
