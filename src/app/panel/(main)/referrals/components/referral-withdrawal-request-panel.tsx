'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button, Chip, FieldError, Form, Label, ListBox, Modal, Select, TextField, toast } from '@heroui/react';
import { Calendar03Icon, CheckmarkCircle02Icon, CancelCircleIcon, Wallet01Icon, WalletRemove01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { createMyReferralCommissionWithdrawalRequest } from '@/app/actions/user';
import { AsyncButton } from '@/components/ui/async-button';
import { Icon } from '@/components/ui/icon';
import { mapParseColorToChipColor, pixKeyTypeParse } from '@/parse';
import { PixKeyType, ReferralWithdrawalIntervalUnit } from '@/types/enums';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { CurrencyCentsInput, type CurrencyCentsInputRef } from '@/components/ui/currency-cents-input';

interface ReferralWithdrawalRequestPanelProps {
  canRequest: boolean;
  intervalValue: number;
  intervalUnit: ReferralWithdrawalIntervalUnit;
  nextAllowedAt: string | null;
  availableBalance: number;
  minWithdrawalAmount: number;
  withdrawalFeeFixed: number;
  hasPayoutPixKey: boolean;
  hasReferralCode: boolean;
  payoutPixKeyType: PixKeyType | null;
  payoutPixKey: string | null;
}

interface ReferralWithdrawalFormData {
  destinationId: string;
  withdrawalAmount: number | null;
}

function formatNextAllowedDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCountdown(nextAllowedAt: string, nowTimestamp: number): string {
  const target = new Date(nextAllowedAt).getTime();
  const diff = Math.max(0, target - nowTimestamp);

  if (diff <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function ReferralWithdrawalRequestPanel({
  canRequest,
  intervalValue: _intervalValue,
  intervalUnit: _intervalUnit,
  nextAllowedAt,
  availableBalance,
  minWithdrawalAmount,
  withdrawalFeeFixed,
  hasPayoutPixKey,
  hasReferralCode,
  payoutPixKeyType,
  payoutPixKey,
}: ReferralWithdrawalRequestPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number | null>(null);

  const {
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferralWithdrawalFormData>({
    defaultValues: {
      destinationId: 'referral-pix-destination',
      withdrawalAmount: availableBalance,
    },
    mode: 'onChange',
  });

  const withdrawalAmountRef = useRef<CurrencyCentsInputRef>(null);
  const withdrawalAmountValue = useWatch({ control, name: 'withdrawalAmount' });
  const selectedDestinationId = useWatch({ control, name: 'destinationId' }) ?? 'referral-pix-destination';

  const blockedLabel = nextAllowedAt ? formatNextAllowedDate(nextAllowedAt) : null;
  const hasClientTime = nowTimestamp !== null;
  const currentTimestamp = nowTimestamp ?? 0;
  const countdown = hasClientTime && nextAllowedAt ? formatCountdown(nextAllowedAt, currentTimestamp) : null;
  const nextAllowedTimestamp = nextAllowedAt ? new Date(nextAllowedAt).getTime() : null;
  const isBlockedByTime = hasClientTime && nextAllowedTimestamp !== null && nextAllowedTimestamp > currentTimestamp;

  const requestedAmount = withdrawalAmountValue ?? 0;
  const estimatedNetAmount = Math.max(requestedAmount - withdrawalFeeFixed, 0);
  const amountValidationMessage = requestedAmount > availableBalance
    ? `O valor máximo disponível para saque agora é ${formatCurrency(availableBalance)}.`
    : null;
  const isWithdrawalAmountInvalid = !!amountValidationMessage;
  const pixKeyTypeInfo = payoutPixKeyType ? pixKeyTypeParse[payoutPixKeyType] : null;

  useEffect(() => {
    const updateNow = () => {
      setNowTimestamp(Date.now());
    };

    const timeout = window.setTimeout(updateNow, 0);

    if (!nextAllowedAt) {
      return () => window.clearTimeout(timeout);
    }

    const timer = window.setInterval(updateNow, 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(timer);
    };
  }, [nextAllowedAt]);

  function handleOpenModal() {
    if (!canRequest || isBlockedByTime) {
      return;
    }

    reset({
      destinationId: 'referral-pix-destination',
      withdrawalAmount: availableBalance,
    });
    setIsOpen(true);
  }

  function handleRequest() {
    if (!hasReferralCode) {
      toast('Erro ao solicitar saque', {
        description: 'Gere seu código de indicação antes de solicitar saque da comissão.',
        variant: 'danger',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      });
      return;
    }

    if (!hasPayoutPixKey) {
      toast('Erro ao solicitar saque', {
        description: 'Cadastre uma conta PIX de recebimento antes de solicitar saque.',
        variant: 'danger',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      });
      return;
    }

    if (requestedAmount <= 0) {
      toast('Erro ao solicitar saque', {
        description: 'Informe um valor de saque válido.',
        variant: 'danger',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      });
      return;
    }

    if (requestedAmount > availableBalance) {
      return;
    }

    if (requestedAmount < minWithdrawalAmount) {
      toast('Erro ao solicitar saque', {
        description: `O valor informado está abaixo do mínimo para saque (${formatCurrency(minWithdrawalAmount)}).`,
        variant: 'danger',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      });
      return;
    }

    if (estimatedNetAmount < 1) {
      toast('Erro ao solicitar saque', {
        description: 'O valor líquido a receber deve ser de no mínimo R$ 0,01.',
        variant: 'danger',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      });
      return;
    }

    startTransition(async () => {
      const response = await createMyReferralCommissionWithdrawalRequest({
        amount: requestedAmount,
      });

      if (response.error || !response.data) {
        toast('Erro ao solicitar saque', {
          description: response.error?.message ?? 'Não foi possível registrar a solicitação agora.',
          variant: 'danger',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
        });
        return;
      }

      toast('Solicitação enviada', {
        description: 'Sua solicitação de saque da comissão foi registrada e está em análise.',
        variant: 'success',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      });

      router.refresh();
      setIsOpen(false);
    });
  }

  const onSubmit = handleSubmit(() => {
    handleRequest();
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <AsyncButton
          type="button"
          variant="primary"
          isDisabled={!canRequest || isBlockedByTime}
          isPending={false}
          onPress={handleOpenModal}
        >
          <Icon icon={Calendar03Icon} className="icon-sm" />
          {isBlockedByTime && countdown ? `Saque em ${countdown}` : 'Solicitar saque'}
        </AsyncButton>

        {isBlockedByTime && blockedLabel && (
          <div className="rounded-lg border border-warning-soft bg-warning-soft px-3 py-2">
            <p className="text-xs text-warning">
              Próximo saque: <span className="font-medium">{blockedLabel}</span>
              {countdown && <span className="font-medium"> · faltam {countdown}</span>}
            </p>
          </div>
        )}
      </div>

      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container size="lg" placement="center" scroll="outside">
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-success text-success-foreground">
                <Icon icon={WalletRemove01Icon} className="icon-md" />
              </Modal.Icon>
              <Modal.Heading>Solicitar saque da comissão</Modal.Heading>
              <p className="text-sm text-muted">Transfira o saldo disponível da comissão para sua chave PIX</p>
            </Modal.Header>
            <Form onSubmit={onSubmit} className="w-full">
              <Modal.Body>
                <div className="flex flex-col gap-6 w-full">
                <div className="rounded-lg bg-surface-secondary p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-success-soft-hover">
                      <Icon icon={Wallet01Icon} className="icon-sm text-success" />
                    </div>
                    <div>
                      <span className="text-sm text-foreground/60">Disponível para saque agora</span>
                      <p className="text-xl font-bold text-success">{formatCurrency(availableBalance)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Select
                    variant="secondary"
                    className="w-full"
                    value={selectedDestinationId}
                    onChange={(key) => setValue('destinationId', String(key), { shouldDirty: true })}
                  >
                    <Label>Conta de destino</Label>
                    <Select.Trigger>
                      <Select.Value>
                        {pixKeyTypeInfo && payoutPixKey ? (
                          <div className="flex items-center gap-2">
                            <Chip
                              variant="soft"
                              color={mapParseColorToChipColor(pixKeyTypeInfo.color)}
                              size="sm"
                              className="gap-1"
                            >
                              {pixKeyTypeInfo.icon}
                              {pixKeyTypeInfo.label}
                            </Chip>
                            <span className="text-sm font-mono truncate">{payoutPixKey}</span>
                          </div>
                        ) : (
                          'Conta de recebimento não encontrada'
                        )}
                      </Select.Value>
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item key="referral-pix-destination" id="referral-pix-destination" textValue={payoutPixKey ?? 'conta-pix'}>
                          <div className="flex items-center gap-2">
                            {pixKeyTypeInfo ? (
                              <Chip
                                variant="soft"
                                color={mapParseColorToChipColor(pixKeyTypeInfo.color)}
                                size="sm"
                                className="gap-1"
                              >
                                {pixKeyTypeInfo.icon}
                                {pixKeyTypeInfo.label}
                              </Chip>
                            ) : null}
                            <span className="text-sm font-mono">{payoutPixKey ?? 'Conta PIX de recebimento'}</span>
                            <Chip variant="soft" color="accent" size="sm">
                              Padrão
                            </Chip>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <TextField variant="secondary" className="w-full" name="withdrawalAmount" isInvalid={isWithdrawalAmountInvalid || !!errors.withdrawalAmount}>
                    <div className="flex items-center justify-between">
                      <Label>Valor total a sacar</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onPress={() => {
                          setValue('withdrawalAmount', availableBalance, { shouldDirty: true, shouldValidate: true });
                          withdrawalAmountRef.current?.setValueInCents(availableBalance);
                        }}
                      >
                        Sacar tudo
                      </Button>
                    </div>
                    <Controller
                      name="withdrawalAmount"
                      control={control}
                      rules={{
                        required: 'Informe um valor de saque válido.',
                        validate: {
                          positive: (value) => ((value ?? 0) > 0) || 'Informe um valor de saque válido.',
                          maxAvailable: (value) =>
                            (value ?? 0) <= availableBalance ||
                            `O valor máximo disponível para saque agora é ${formatCurrency(availableBalance)}.`,
                          minAmount: (value) =>
                            (value ?? 0) >= minWithdrawalAmount ||
                            `O valor informado está abaixo do mínimo para saque (${formatCurrency(minWithdrawalAmount)}).`,
                          minNetAmount: (value) =>
                            (value ?? 0) - withdrawalFeeFixed >= 1 ||
                            'O valor líquido a receber deve ser de no mínimo R$ 0,01.',
                        },
                      }}
                      render={({ field }) => (
                        <CurrencyCentsInput
                          ref={withdrawalAmountRef}
                          initialValueInCents={field.value ?? undefined}
                          variant="secondary"
                          placeholder="R$ 0,00"
                          onValueChange={(v) => field.onChange(formattedCurrencyToCents(v))}
                        />
                      )}
                    />
                    <FieldError>{(errors.withdrawalAmount?.message as string) ?? amountValidationMessage ?? undefined}</FieldError>
                  </TextField>
                </div>

                <div className="rounded-lg bg-surface-secondary p-2">
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Valor total a sacar:</span>
                      <span className="font-medium">{formatCurrency(requestedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Taxa fixa:</span>
                      <span className="font-medium text-danger">- {formatCurrency(withdrawalFeeFixed)}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-success">Você vai receber:</span>
                        <span className="font-bold text-lg text-success">{formatCurrency(estimatedNetAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <AsyncButton type="button" variant="tertiary" onPress={() => setIsOpen(false)} isPending={false}>
                  Cancelar
                </AsyncButton>
                <AsyncButton
                  type="submit"
                  variant="primary"
                  isPending={isPending}
                >
                  Confirmar solicitação
                </AsyncButton>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
