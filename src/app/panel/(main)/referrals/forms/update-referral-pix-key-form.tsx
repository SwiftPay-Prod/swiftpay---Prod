'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Alert, Chip, Form, Input, InputOTP, Label, ListBox, REGEXP_ONLY_DIGITS, Select, TextField } from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { requestMyReferralPayoutPixKeyUpdate, updateMyReferralPayoutPixKey } from '@/app/actions/user';
import { Icon } from '@/components/ui/icon';
import { mapParseColorToChipColor, pixKeyTypeOptions, pixKeyTypeParse } from '@/parse';
import type { PixKeyType } from '@/types/enums';
import { PixKeyType as PixKeyTypeEnum } from '@/types/enums';
import type { UpdateUserReferralPayoutPixKeyData } from '@/types/user/referrals';
import { AsyncButton } from '@/components/ui/async-button';
import { cnpjFormat, cpfFormat, getPhoneFormat } from '@/utils/input-masks';

interface UpdateReferralPixKeyFormProps {
  initialPixKeyType: PixKeyType | null;
  initialPixKey: string | null;
  submitLabel?: string;
  onSuccess?: (data: UpdateUserReferralPayoutPixKeyData) => void;
}

interface ReferralPixKeyFormData {
  pixKeyType: PixKeyType;
  pixKey: string;
  verificationCode: string;
}

const RESEND_COOLDOWN_SECONDS = 30;

function validatePixKey(value: string, type: PixKeyType): string | null {
  if (!value.trim()) {
    return 'A chave PIX é obrigatória.';
  }

  const digits = value.replace(/\D/g, '');

  switch (type) {
    case PixKeyTypeEnum.Cpf:
      if (digits.length !== 11) {
        return 'CPF deve conter 11 dígitos.';
      }
      break;
    case PixKeyTypeEnum.Cnpj:
      if (digits.length !== 14) {
        return 'CNPJ deve conter 14 dígitos.';
      }
      break;
    case PixKeyTypeEnum.Email:
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return 'E-mail inválido.';
      }
      break;
    case PixKeyTypeEnum.Phone:
      if (!/^\+55\d{10,11}$/.test(value.replace(/\s/g, ''))) {
        return 'Telefone deve estar no formato +55XXXXXXXXXXX.';
      }
      break;
    case PixKeyTypeEnum.Random:
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value.trim())) {
        return 'Chave aleatória deve ser um UUID válido.';
      }
      break;
  }

  return null;
}

function getPixKeyPlaceholder(type: PixKeyType): string {
  switch (type) {
    case PixKeyTypeEnum.Cpf:
      return '000.000.000-00';
    case PixKeyTypeEnum.Cnpj:
      return '00.000.000/0000-00';
    case PixKeyTypeEnum.Email:
      return 'exemplo@email.com';
    case PixKeyTypeEnum.Phone:
      return '+55 11 99999-9999';
    case PixKeyTypeEnum.Random:
      return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  }
}

export function UpdateReferralPixKeyForm({
  initialPixKeyType,
  initialPixKey,
  submitLabel = 'Salvar chave PIX',
  onSuccess,
}: UpdateReferralPixKeyFormProps) {
  const {
    control,
    setValue,
    setError,
    clearErrors,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferralPixKeyFormData>({
    defaultValues: {
      pixKeyType: initialPixKeyType ?? PixKeyTypeEnum.Random,
      pixKey: initialPixKey ?? '',
      verificationCode: '',
    },
    mode: 'onChange',
  });

  const pixKeyType = useWatch({ control, name: 'pixKeyType' }) ?? PixKeyTypeEnum.Random;
  const pixKey = useWatch({ control, name: 'pixKey' }) ?? '';
  const verificationCode = useWatch({ control, name: 'verificationCode' }) ?? '';

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRequestPending, startRequestTransition] = useTransition();
  const [isSubmitPending, startSubmitTransition] = useTransition();

  const selectedOption = useMemo(
    () => pixKeyTypeOptions.find((opt) => opt.value === pixKeyType),
    [pixKeyType]
  );
  const selectedTypeParse = pixKeyTypeParse[pixKeyType];
  const phoneDigits = pixKey.replace(/\D/g, '').replace(/^55/, '');
  const phoneFormat = `+55 ${getPhoneFormat(phoneDigits)}`;

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setResendCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [resendCooldownSeconds]);

  function handleRequestCode() {
    if (resendCooldownSeconds > 0) {
      return;
    }

    const currentPixKey = getValues('pixKey');
    const currentPixKeyType = getValues('pixKeyType');

    setFormError(null);

    const pixKeyError = validatePixKey(currentPixKey, currentPixKeyType);
    if (pixKeyError) {
      setError('pixKey', { message: pixKeyError });
      return;
    }

    clearErrors('pixKey');

    startRequestTransition(async () => {
      const response = await requestMyReferralPayoutPixKeyUpdate();

      if (response.error || !response.data) {
        const message = response.error?.message ?? 'Não foi possível enviar o código de verificação.';
        setFormError(message);
        if (message.toLowerCase().includes('aguarde')) {
          setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        }
        toast('Erro ao enviar código', {
          description: message,
          variant: 'danger',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
        });
        return;
      }

      setVerificationId(response.data.verificationId);
      setMaskedEmail(response.data.maskedEmail);
      setCodeExpiresAt(response.data.expiresAt);
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setFormError(null);

      toast('Código enviado', {
        description: `Enviamos um código para ${response.data.maskedEmail}.`,
        variant: 'success',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      });
    });
  }

  const onSubmit = handleSubmit((data) => {
    const nextPixKey = data.pixKey.trim();
    const code = data.verificationCode.trim();
    const currentVerificationId = verificationId;
    const currentPixKeyType = data.pixKeyType;

    setFormError(null);

    const pixKeyError = validatePixKey(nextPixKey, currentPixKeyType);
    if (pixKeyError) {
      setError('pixKey', { message: pixKeyError });
      return;
    }

    if (!currentVerificationId) {
      setFormError('Solicite o código de verificação antes de salvar a chave PIX.');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError('verificationCode', { message: 'Informe o código de verificação com 6 dígitos.' });
      return;
    }

    const verifiedId = currentVerificationId as string;
    clearErrors();

    startSubmitTransition(async () => {
      const response = await updateMyReferralPayoutPixKey({
        verificationId: verifiedId,
        code,
        pixKeyType: currentPixKeyType,
        pixKey:
          currentPixKeyType === PixKeyTypeEnum.Cpf || currentPixKeyType === PixKeyTypeEnum.Cnpj
            ? nextPixKey.replace(/\D/g, '')
            : nextPixKey,
      });

      if (response.error) {
        setFormError(response.error?.message ?? 'Não foi possível salvar a chave PIX.');
        toast('Erro ao salvar chave PIX', {
          description: response.error.message,
          variant: 'danger',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
        });
        return;
      }

      setVerificationId(null);
      setValue('verificationCode', '', { shouldDirty: false, shouldValidate: false });
      setCodeExpiresAt(null);
      setMaskedEmail(null);
      setFormError(null);

      onSuccess?.({
        pixKeyType: response.data?.pixKeyType ?? currentPixKeyType,
        pixKey: response.data?.pixKey ?? nextPixKey,
        updatedAt: response.data?.updatedAt ?? new Date().toISOString(),
      });

      toast('Chave PIX atualizada', {
        description: 'Sua chave PIX para recebimento de comissão foi atualizada com sucesso.',
        variant: 'success',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      });
    });
  });

  return (
    <Form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>1) Informe sua nova conta PIX</Alert.Title>
          <Alert.Description>Depois clique em “Enviar código de confirmação”.</Alert.Description>
        </Alert.Content>
      </Alert>

      <Controller
        name="pixKeyType"
        control={control}
        render={({ field }) => (
          <Select
            variant="secondary"
            className="w-full"
            placeholder="Selecione o tipo de chave"
            aria-label="Tipo da chave PIX"
            value={field.value}
            onChange={(key) => {
              if (key) {
                field.onChange(key as PixKeyType);
                setValue('pixKey', '', { shouldDirty: true, shouldValidate: false });
                clearErrors('pixKey');
              }
            }}
            isDisabled={isRequestPending || isSubmitPending}
          >
            <Label>Tipo da chave PIX</Label>
            <Select.Trigger>
              <Select.Value>
                <div className="flex items-center gap-2">
                  {selectedTypeParse.icon}
                  {selectedTypeParse.label}
                </div>
              </Select.Value>
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {pixKeyTypeOptions.map((opt) => (
                  <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                    <Chip variant="soft" color={mapParseColorToChipColor(opt.color)} className="gap-1">
                      {opt.icon}
                      {opt.label}
                    </Chip>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}
      />

      <TextField variant="secondary" isRequired isInvalid={!!errors.pixKey} isDisabled={isRequestPending || isSubmitPending}>
        <Label>Chave PIX para recebimento</Label>
        {pixKeyType === PixKeyTypeEnum.Cpf || pixKeyType === PixKeyTypeEnum.Cnpj ? (
          <Controller
            name="pixKey"
            control={control}
            render={({ field }) => (
              <PatternFormat
                customInput={Input}
                format={pixKeyType === PixKeyTypeEnum.Cpf ? cpfFormat : cnpjFormat}
                mask="_"
                placeholder={getPixKeyPlaceholder(pixKeyType)}
                value={field.value}
                onValueChange={(values) => {
                  field.onChange(values.value);
                  clearErrors('pixKey');
                }}
              />
            )}
          />
        ) : pixKeyType === PixKeyTypeEnum.Phone ? (
          <Controller
            name="pixKey"
            control={control}
            render={({ field }) => (
              <PatternFormat
                customInput={Input}
                format={phoneFormat}
                mask="_"
                placeholder={phoneFormat}
                value={phoneDigits}
                onValueChange={(values) => {
                  field.onChange(values.value ? `+55${values.value}` : '');
                  clearErrors('pixKey');
                }}
              />
            )}
          />
        ) : (
          <Controller
            name="pixKey"
            control={control}
            render={({ field }) => (
              <Input variant="secondary"
                placeholder={getPixKeyPlaceholder(pixKeyType)}
                value={field.value}
                type={pixKeyType === PixKeyTypeEnum.Email ? 'email' : 'text'}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  clearErrors('pixKey');
                }}
              />
            )}
          />
        )}
        {errors.pixKey?.message && <p className="text-xs text-danger">{errors.pixKey.message}</p>}
      </TextField>

      <div className="flex flex-wrap items-center gap-2">
        <AsyncButton
          type="button"
          variant="secondary"
          onPress={handleRequestCode}
          isPending={isRequestPending}
          isDisabled={isSubmitPending || resendCooldownSeconds > 0}
        >
          {resendCooldownSeconds > 0
            ? `Reenviar código em ${String(Math.floor(resendCooldownSeconds / 60)).padStart(2, '0')}:${String(resendCooldownSeconds % 60).padStart(2, '0')}`
            : 'Enviar código de confirmação'}
        </AsyncButton>
        {maskedEmail && <span className="text-xs text-muted">Código enviado para {maskedEmail}</span>}
      </div>

      {verificationId && (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>2) Digite o código recebido no e-mail</Alert.Title>
            <Alert.Description>
              Esse código confirma que você autorizou a alteração da conta de recebimento.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {codeExpiresAt && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
          Código válido até {new Date(codeExpiresAt).toLocaleString('pt-BR')}.
        </div>
      )}

      {verificationId && (
        <>
          <div className="flex flex-col gap-2">
            <Label isRequired>Código de verificação</Label>
            <InputOTP
              variant="secondary"
              maxLength={6}
              inputMode="numeric"
              pattern={REGEXP_ONLY_DIGITS}
              value={verificationCode}
              isInvalid={!!errors.verificationCode}
              isDisabled={isSubmitPending}
              onChange={(value) => {
                setValue('verificationCode', value, { shouldDirty: true, shouldValidate: false });
                clearErrors('verificationCode');
              }}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
            {errors.verificationCode?.message && <p className="text-xs text-danger">{errors.verificationCode.message}</p>}
          </div>

          <AsyncButton type="submit" variant="primary" isPending={isSubmitPending}>
            {submitLabel}
          </AsyncButton>
        </>
      )}

      {selectedOption && (
        <div className="text-xs text-muted">
          Tipo selecionado: <span className="font-medium text-foreground">{selectedOption.label}</span>
        </div>
      )}

      {formError && <p className="text-xs text-danger">{formError}</p>}
    </Form>
  );
}
