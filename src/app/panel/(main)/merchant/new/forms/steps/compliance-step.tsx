import {
  Alert,
  Checkbox,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField } from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import { Icon } from '@/components/ui/icon';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import {
  DOCUMENT_TYPE_OPTIONS,
  IDENTITY_DOCUMENT_TYPE_OPTIONS,
  OPERATION_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS } from '../../constants/merchant-onboarding.constants';
import type { MerchantOnboardingAnswers } from '../../types/merchant-onboarding.types';
import { MerchantKycDocumentType } from '@/types/enums';
import { getDocumentFormat } from '@/utils/input-masks';
import type { FieldCorrectionsResolver, OnboardingValueChange, StepErrorMatcher } from './types';
import { CorrectionFieldLabel, CorrectionHint } from './correction-hint';

interface ComplianceStepProps {
  answers: MerchantOnboardingAnswers;
  isBusy: boolean;
  isFieldEditable: (field: keyof MerchantOnboardingAnswers) => boolean;
  monthlyRevenueInCents: number | null;
  averageTicketInCents: number | null;
  matchesStepError: StepErrorMatcher;
  getFieldCorrections: FieldCorrectionsResolver;
  onValueChange: OnboardingValueChange;
  onTogglePaymentMethod: (value: (typeof PAYMENT_METHOD_OPTIONS)[number]['value']) => void;
}

function sanitizeIdentityDocument(value: string): string {
  return value.replace(/[^a-zA-Z0-9.\/-]/g, '').toUpperCase();
}

export function ComplianceStep({
  answers,
  isBusy,
  isFieldEditable,
  monthlyRevenueInCents,
  averageTicketInCents,
  matchesStepError,
  getFieldCorrections,
  onValueChange,
  onTogglePaymentMethod }: ComplianceStepProps) {
  const documentTypeError = matchesStepError('compliance', 'Tipo de documento é obrigatório.');
  const documentNumberError = matchesStepError(
    'compliance',
    'Número do documento é obrigatório.',
    'CPF inválido.',
    'CNPJ inválido.'
  );
  const legalNameError = matchesStepError(
    'compliance',
    'Razão social é obrigatória para CNPJ.',
    'Nome completo é obrigatório para CPF.'
  );
  const identityDocumentTypeError = matchesStepError(
    'compliance',
    'Tipo do documento de identidade é obrigatório.'
  );
  const identityDocumentNumberError = matchesStepError(
    'compliance',
    'Número do documento de identidade é obrigatório.'
  );
  const operationTypeError = matchesStepError('compliance', 'Tipo de operação é obrigatório.');
  const businessDescriptionError = matchesStepError('compliance', 'Descrição do negócio é obrigatória.');
  const websiteError = matchesStepError(
    'compliance',
    'Website é obrigatório.',
    'URL inválida (ex: https://exemplo.com.br).'
  );
  const monthlyRevenueError = matchesStepError('compliance', 'Receita mensal é obrigatória.');
  const averageTicketError = matchesStepError('compliance', 'Ticket médio é obrigatório.');
  const paymentMethodsError = matchesStepError('compliance', 'Selecione ao menos um método de pagamento.');
  const documentTypeCorrections = getFieldCorrections('documentType');
  const documentNumberCorrections = getFieldCorrections('documentNumber');
  const legalNameCorrections = getFieldCorrections('legalName');
  const identityDocumentTypeCorrections = getFieldCorrections('identityDocumentType');
  const identityDocumentNumberCorrections = getFieldCorrections('identityDocumentNumber');
  const operationTypeCorrections = getFieldCorrections('operationType');
  const websiteCorrections = getFieldCorrections('website');
  const businessDescriptionCorrections = getFieldCorrections('businessDescription');
  const monthlyRevenueCorrections = getFieldCorrections('monthlyRevenue');
  const averageTicketCorrections = getFieldCorrections('averageTicket');
  const paymentMethodsCorrections = getFieldCorrections('paymentMethods');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField isRequired variant="secondary" isInvalid={!!documentTypeError}>
          <Select
            variant="secondary"
            value={answers.documentType ?? null}
            onChange={(key) =>
              onValueChange('documentType', (key ? String(key) : null) as typeof answers.documentType)
            }
            aria-label="Tipo de documento"
            isDisabled={isBusy || !isFieldEditable('documentType')}
          >
            <Label>
              <CorrectionFieldLabel label="Tipo de documento" corrections={documentTypeCorrections} />
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator className="size-4" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          {documentTypeError && <FieldError>{documentTypeError}</FieldError>}
          <CorrectionHint corrections={documentTypeCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!documentNumberError}>
          <Label>
            <CorrectionFieldLabel
              label={answers.documentType === MerchantKycDocumentType.CNPJ ? 'CNPJ' : 'CPF'}
              corrections={documentNumberCorrections}
            />
          </Label>
          <PatternFormat
            customInput={Input}
            variant="secondary"
            format={getDocumentFormat(answers.documentType)}
            mask="_"
            value={answers.documentNumber}
            onValueChange={(values) => onValueChange('documentNumber', values.value)}
            placeholder={
              answers.documentType === MerchantKycDocumentType.CNPJ
                ? '00.000.000/0000-00'
                : '000.000.000-00'
            }
            disabled={!answers.documentType || isBusy || !isFieldEditable('documentNumber')}
          />
          {documentNumberError && <FieldError>{documentNumberError}</FieldError>}
          <CorrectionHint corrections={documentNumberCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" className="md:col-span-2" isInvalid={!!legalNameError}>
          <Label>
            <CorrectionFieldLabel
              label={answers.documentType === MerchantKycDocumentType.CNPJ ? 'Razão social' : 'Nome completo'}
              corrections={legalNameCorrections}
            />
          </Label>
          <Input
            variant="secondary"
            value={answers.legalName}
            onChange={(event) => onValueChange('legalName', event.target.value)}
            placeholder={
              answers.documentType === MerchantKycDocumentType.CNPJ
                ? 'Ex: Empresa Exemplo LTDA'
                : 'Ex: João da Silva'
            }
            disabled={isBusy || !isFieldEditable('legalName')}
          />
          {legalNameError && <FieldError>{legalNameError}</FieldError>}
          <CorrectionHint corrections={legalNameCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!identityDocumentTypeError}>
          <Select
            variant="secondary"
            value={answers.identityDocumentType ?? null}
            onChange={(key) =>
              onValueChange(
                'identityDocumentType',
                (key ? String(key) : null) as typeof answers.identityDocumentType
              )
            }
            aria-label="Tipo de documento de identidade"
            isDisabled={isBusy || !isFieldEditable('identityDocumentType')}
          >
            <Label>
              <CorrectionFieldLabel
                label="Documento de identidade"
                corrections={identityDocumentTypeCorrections}
              />
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator className="size-4" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {IDENTITY_DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          {identityDocumentTypeError && <FieldError>{identityDocumentTypeError}</FieldError>}
          <CorrectionHint corrections={identityDocumentTypeCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!identityDocumentNumberError}>
          <Label>
            <CorrectionFieldLabel
              label="Número do documento de identidade"
              corrections={identityDocumentNumberCorrections}
            />
          </Label>
          <Input
            variant="secondary"
            value={answers.identityDocumentNumber}
            onChange={(event) =>
              onValueChange('identityDocumentNumber', sanitizeIdentityDocument(event.target.value))
            }
            placeholder={answers.identityDocumentType === 'CNH' ? 'Ex: 00000000000' : 'Ex: 12.345.678-9'}
            disabled={isBusy || !answers.identityDocumentType || !isFieldEditable('identityDocumentNumber')}
          />
          {identityDocumentNumberError && <FieldError>{identityDocumentNumberError}</FieldError>}
          <CorrectionHint corrections={identityDocumentNumberCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!operationTypeError}>
          <Select
            isRequired
            variant="secondary"
            value={answers.operationType ?? null}
            onChange={(key) =>
              onValueChange('operationType', (key ? String(key) : null) as typeof answers.operationType)
            }
            aria-label="Tipo de operação"
            isDisabled={isBusy || !isFieldEditable('operationType')}
          >
            <Label>
              <CorrectionFieldLabel label="Tipo de operação" corrections={operationTypeCorrections} />
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator className="size-4" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {OPERATION_TYPE_OPTIONS.map((option) => (
                  <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          {operationTypeError && <FieldError>{operationTypeError}</FieldError>}
          <CorrectionHint corrections={operationTypeCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!websiteError}>
          <Label>
            <CorrectionFieldLabel label="Website" corrections={websiteCorrections} />
          </Label>
          <Input
            variant="secondary"
            value={answers.website}
            onChange={(event) => onValueChange('website', event.target.value)}
            placeholder="https://suaempresa.com.br"
            disabled={isBusy || !isFieldEditable('website')}
          />
          {websiteError && <FieldError>{websiteError}</FieldError>}
          <CorrectionHint corrections={websiteCorrections} />
        </TextField>

        <TextField
          isRequired
          variant="secondary"
          className="md:col-span-2"
          isInvalid={!!businessDescriptionError}
        >
          <Label>
            <CorrectionFieldLabel
              label="Descrição do negócio"
              corrections={businessDescriptionCorrections}
            />
          </Label>
          <TextArea
            variant="secondary"
            value={answers.businessDescription}
            onChange={(event) => onValueChange('businessDescription', event.target.value)}
            placeholder="Descreva o que sua empresa vende, como opera e qual público atende."
            rows={4}
            disabled={isBusy || !isFieldEditable('businessDescription')}
          />
          {businessDescriptionError && <FieldError>{businessDescriptionError}</FieldError>}
          <CorrectionHint corrections={businessDescriptionCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!monthlyRevenueError}>
          <Label>
            <CorrectionFieldLabel label="Receita mensal (R$)" corrections={monthlyRevenueCorrections} />
          </Label>
          <CurrencyCentsInput
            variant="secondary"
            initialValueInCents={monthlyRevenueInCents ?? undefined}
            onValueChange={(value) => onValueChange('monthlyRevenue', value)}
            disabled={isBusy || !isFieldEditable('monthlyRevenue')}
          />
          {monthlyRevenueError && <FieldError>{monthlyRevenueError}</FieldError>}
          <CorrectionHint corrections={monthlyRevenueCorrections} />
        </TextField>

        <TextField isRequired variant="secondary" isInvalid={!!averageTicketError}>
          <Label>
            <CorrectionFieldLabel label="Ticket médio (R$)" corrections={averageTicketCorrections} />
          </Label>
          <CurrencyCentsInput
            variant="secondary"
            initialValueInCents={averageTicketInCents ?? undefined}
            onValueChange={(value) => onValueChange('averageTicket', value)}
            disabled={isBusy || !isFieldEditable('averageTicket')}
          />
          {averageTicketError && <FieldError>{averageTicketError}</FieldError>}
          <CorrectionHint corrections={averageTicketCorrections} />
        </TextField>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          <CorrectionFieldLabel
            label="Métodos de pagamento utilizados"
            corrections={paymentMethodsCorrections}
          />
          <span className="ml-1 text-danger">*</span>
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const selected = answers.paymentMethods.includes(option.value);
            return (
              <Checkbox
                key={option.value}
                variant="secondary"
                isSelected={selected}
                onChange={() => onTogglePaymentMethod(option.value)}
                isDisabled={isBusy || !isFieldEditable('paymentMethods')}
                className="rounded-lg border border-border p-2"
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                    <span className="text-xs text-muted">{option.description}</span>
                  </div>
                </Checkbox.Content>
              </Checkbox>
            );
          })}
        </div>
        {paymentMethodsError && <FieldError>{paymentMethodsError}</FieldError>}
        <CorrectionHint corrections={paymentMethodsCorrections} />
      </div>

    </div>
  );
}
