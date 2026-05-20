import { FieldError, Input, Label, TextField } from '@heroui/react';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { normalizePhoneToE164 } from '@/utils/input-masks';
import type { MerchantOnboardingAnswers } from '../../types/merchant-onboarding.types';
import type { FieldCorrectionsResolver, OnboardingValueChange, StepErrorMatcher } from './types';
import { CorrectionFieldLabel, CorrectionHint } from './correction-hint';

interface BasicStepProps {
  answers: MerchantOnboardingAnswers;
  isBusy: boolean;
  isFieldEditable: (field: keyof MerchantOnboardingAnswers) => boolean;
  defaultPhoneCountry: string;
  matchesStepError: StepErrorMatcher;
  getFieldCorrections: FieldCorrectionsResolver;
  onValueChange: OnboardingValueChange;
}

export function BasicStep({
  answers,
  isBusy,
  isFieldEditable,
  defaultPhoneCountry,
  matchesStepError,
  getFieldCorrections,
  onValueChange,
}: BasicStepProps) {
  const basicNameError = matchesStepError('basic', 'Nome da organização é obrigatório.');
  const basicEmailError = matchesStepError('basic', 'E-mail é obrigatório.');
  const basicWhatsAppError = matchesStepError(
    'basic',
    'WhatsApp é obrigatório.',
    'WhatsApp inválido. Informe com DDI do país.'
  );
  const nameCorrections = getFieldCorrections('name');
  const emailCorrections = getFieldCorrections('email');
  const whatsAppCorrections = getFieldCorrections('whatsApp');

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField isRequired variant="secondary" isInvalid={!!basicNameError}>
        <Label>
          <CorrectionFieldLabel label="Nome da organização" corrections={nameCorrections} />
        </Label>
        <Input
          variant="secondary"
          value={answers.name}
          onChange={(event) => onValueChange('name', event.target.value)}
          placeholder="Ex: Empresa Exemplo LTDA"
          disabled={isBusy || !isFieldEditable('name')}
        />
        {basicNameError && <FieldError>{basicNameError}</FieldError>}
        <CorrectionHint corrections={nameCorrections} />
      </TextField>

      <TextField isRequired variant="secondary" isInvalid={!!basicEmailError}>
        <Label>
          <CorrectionFieldLabel label="E-mail" corrections={emailCorrections} />
        </Label>
        <Input
          variant="secondary"
          type="email"
          value={answers.email}
          onChange={(event) => onValueChange('email', event.target.value)}
          placeholder="financeiro@empresa.com"
          disabled={isBusy || !isFieldEditable('email')}
        />
        {basicEmailError && <FieldError>{basicEmailError}</FieldError>}
        <CorrectionHint corrections={emailCorrections} />
      </TextField>

      <TextField
        isRequired
        variant="secondary"
        className="md:col-span-2"
        isInvalid={!!basicWhatsAppError}
      >
        <Label>
          <CorrectionFieldLabel label="WhatsApp" corrections={whatsAppCorrections} />
        </Label>
        <InternationalPhoneInput
          name="whatsApp"
          value={answers.whatsApp}
          defaultCountry={defaultPhoneCountry}
          onChange={(value) =>
            onValueChange('whatsApp', normalizePhoneToE164(value ?? '') ?? (value ?? ''))
          }
          placeholder="Ex: +55 11 99999-9999"
          disabled={isBusy || !isFieldEditable('whatsApp')}
          required
        />
        {basicWhatsAppError && <FieldError>{basicWhatsAppError}</FieldError>}
        <CorrectionHint corrections={whatsAppCorrections} />
      </TextField>
    </div>
  );
}
