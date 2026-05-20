"use client";

import { useState, useTransition } from "react";
import { Button, Checkbox, Input, InputGroup, Label, TextField, FieldError, Form, Spinner } from "@heroui/react";
import { PatternFormat } from "react-number-format";
import { Controller, useForm } from "react-hook-form";
import type { MerchantData, UpdateMerchantRequest } from "@/types/merchant/crud";
import type { AddressFormData } from "@/types/merchant/onboarding";
import { merchantToAddressFormData } from "@/types/merchant/onboarding";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { AsyncButton } from "@/components/ui/async-button";
import { fetchAddressByCep } from "@/app/actions/address";
import { isValidCEP } from "@/utils/validations";
import { cepFormat } from "@/utils/input-masks";
import { Icon } from '@/components/ui/icon';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { toast } from "@heroui/react";

interface AddressStepProps {
  merchant: MerchantData;
  onSaveFields: (data: Partial<UpdateMerchantRequest>, showToast?: boolean) => Promise<MerchantData | null>;
  onNext: () => void;
  onBack: () => void;
}

export function AddressStep({ merchant, onSaveFields, onNext, onBack }: AddressStepProps) {
  const { control, setValue, getValues, handleSubmit, setError, clearErrors, trigger } = useForm<AddressFormData>({
    defaultValues: merchantToAddressFormData(merchant),
    mode: "onChange",
  });
  const [isPending, startTransition] = useTransition();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepLoaded, setCepLoaded] = useState(() => {
    const initial = merchantToAddressFormData(merchant);
    return !!(initial.city && initial.state);
  });
  const [cepFetchFailed, setCepFetchFailed] = useState(false);
  const [manualFill, setManualFill] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const fieldsUnlocked = cepLoaded || manualFill;

  const debouncedSaveIfValid = useDebouncedCallback(async (field: keyof AddressFormData, value: string | null) => {
    const isValid = await trigger(field);
    if (isValid) {
      onSaveFields({ [field]: value });
    }
  }, 350);

  function normalizeString(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function handleFieldChange(field: keyof AddressFormData, value: string) {
    debouncedSaveIfValid(field, value || null);
  }

  async function handleCepChange(value: string) {
    setValue("postalCode", value || null, { shouldDirty: true, shouldValidate: false });
    clearErrors("postalCode");
    setCepFetchFailed(false);
    setManualFill(false);
    setCepError(null);

    if (isValidCEP(value)) {
      setIsFetchingCep(true);
      const result = await fetchAddressByCep(value);
      setIsFetchingCep(false);

      if (result.success) {
        const updatedData: Partial<AddressFormData> = {
          postalCode: value,
          address: result.data.address,
          neighborhood: result.data.neighborhood,
          city: result.data.city,
          state: result.data.state,
          addressComplement: result.data.complement,
        };
        setValue("address", updatedData.address ?? null, { shouldDirty: true, shouldValidate: false });
        setValue("neighborhood", updatedData.neighborhood ?? null, { shouldDirty: true, shouldValidate: false });
        setValue("city", updatedData.city ?? null, { shouldDirty: true, shouldValidate: false });
        setValue("state", updatedData.state ?? null, { shouldDirty: true, shouldValidate: false });
        setValue("addressComplement", updatedData.addressComplement ?? null, {
          shouldDirty: true,
          shouldValidate: false,
        });
        setCepLoaded(true);
        onSaveFields(updatedData);
        void trigger("postalCode");
        void trigger("address");
        void trigger("neighborhood");
        void trigger("city");
        void trigger("state");
      } else {
        toast("CEP não encontrado", {
          description: result.error,
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
          variant: 'danger',
        });
        setCepFetchFailed(true);
        setCepLoaded(false);
        setValue("address", null, { shouldDirty: true, shouldValidate: false });
        setValue("neighborhood", null, { shouldDirty: true, shouldValidate: false });
        setValue("city", null, { shouldDirty: true, shouldValidate: false });
        setValue("state", null, { shouldDirty: true, shouldValidate: false });
        setValue("addressComplement", null, { shouldDirty: true, shouldValidate: false });
        setValue("addressNumber", null, { shouldDirty: true, shouldValidate: false });
      }
    } else {
      setCepLoaded(false);
      void trigger("postalCode");
    }
  }

  function handleCepBlur() {
    const currentPostalCode = getValues("postalCode");
    if (!currentPostalCode) {
      setCepError("CEP é obrigatório");
    } else if (!isValidCEP(currentPostalCode)) {
      setCepError("CEP deve ter 8 dígitos");
    }
  }

  function onSubmit(values: AddressFormData) {
    if (!values.postalCode) {
      setCepError("CEP é obrigatório");
      setError("postalCode", { message: "CEP é obrigatório" });
      return;
    }
    if (!isValidCEP(values.postalCode)) {
      setCepError("CEP deve ter 8 dígitos");
      setError("postalCode", { message: "CEP deve ter 8 dígitos" });
      return;
    }
    clearErrors("postalCode");
    setCepError(null);

    const payload: AddressFormData = {
      postalCode: normalizeString(values.postalCode),
      address: normalizeString(values.address),
      addressNumber: normalizeString(values.addressNumber),
      addressComplement: normalizeString(values.addressComplement),
      neighborhood: normalizeString(values.neighborhood),
      city: normalizeString(values.city),
      state: normalizeString(values.state),
      country: normalizeString(values.country) ?? "BR",
    };

    startTransition(async () => {
      const result = await onSaveFields(payload, false);
      if (result) {
        onNext();
      }
    });
  }

  return (
    <Form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-xl font-semibold text-foreground">Endereço</h2>
        <p className="text-default-500 mt-1">
          Informe o endereço comercial da sua organização.
        </p>
      </div>

      <div className="h-px bg-divider" />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2 flex flex-col gap-2">
          <Controller
            name="postalCode"
            control={control}
            render={({ field, fieldState }) => (
              <TextField variant="secondary" isRequired name={field.name} isInvalid={!!cepError || !!fieldState.error}>
                <Label>CEP</Label>
                <InputGroup>
                  <PatternFormat
                    customInput={InputGroup.Input}
                    format={cepFormat}
                    mask="_"
                    value={field.value ?? ""}
                    placeholder="00000-000"
                    onValueChange={(values) => {
                      field.onChange(values.value || null);
                      handleCepChange(values.value);
                    }}
                    onBlur={handleCepBlur}
                  />
                  {isFetchingCep && (
                    <InputGroup.Suffix>
                      <Spinner size="sm" />
                    </InputGroup.Suffix>
                  )}
                </InputGroup>
                <FieldError>{cepError || fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
          {cepFetchFailed && (
            <Checkbox variant="secondary" isSelected={manualFill} onChange={setManualFill}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Preencher endereço manualmente</Checkbox.Content>
            </Checkbox>
          )}
        </div>

        <Controller
          name="address"
          control={control}
          rules={{ validate: (value) => (value ? true : "Rua é obrigatória") }}
          render={({ field, fieldState }) => (
            <TextField variant="secondary" isRequired isDisabled={!fieldsUnlocked} name={field.name} className="md:col-span-4" isInvalid={!!fieldState.error}>
              <Label>Rua / Logradouro</Label>
              <Input
                variant="secondary"
                placeholder="Av. Paulista"
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  handleFieldChange("address", e.target.value);
                }}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />

        <Controller
          name="addressNumber"
          control={control}
          rules={{ validate: (value) => (value ? true : "Número é obrigatório") }}
          render={({ field, fieldState }) => (
            <TextField variant="secondary" isRequired isDisabled={!fieldsUnlocked} name={field.name} className="md:col-span-1" isInvalid={!!fieldState.error}>
              <Label>Número</Label>
              <Input
                variant="secondary"
                placeholder="1000"
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  handleFieldChange("addressNumber", e.target.value);
                }}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />

        <Controller
          name="addressComplement"
          control={control}
          render={({ field }) => (
            <TextField variant="secondary" isDisabled={!fieldsUnlocked} name={field.name} className="md:col-span-2">
              <Label>Complemento</Label>
              <Input
                variant="secondary"
                placeholder="Sala 100"
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  handleFieldChange("addressComplement", e.target.value);
                }}
              />
            </TextField>
          )}
        />

        <Controller
          name="neighborhood"
          control={control}
          rules={{ validate: (value) => (value ? true : "Bairro é obrigatório") }}
          render={({ field, fieldState }) => (
            <TextField variant="secondary" isRequired isDisabled={!fieldsUnlocked} name={field.name} className="md:col-span-3" isInvalid={!!fieldState.error}>
              <Label>Bairro</Label>
              <Input
                variant="secondary"
                placeholder="Centro"
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  handleFieldChange("neighborhood", e.target.value);
                }}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />

        <Controller
          name="city"
          control={control}
          rules={{ validate: (value) => (value ? true : "Cidade é obrigatória") }}
          render={({ field, fieldState }) => (
            <TextField variant="secondary" isRequired isDisabled={!manualFill} name={field.name} className="md:col-span-3" isInvalid={!!fieldState.error}>
              <Label>Cidade</Label>
              <Input
                variant="secondary"
                placeholder="São Paulo"
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  handleFieldChange("city", e.target.value);
                }}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />

        <Controller
          name="state"
          control={control}
          rules={{ validate: (value) => (value ? true : "Estado é obrigatório") }}
          render={({ field, fieldState }) => (
            <TextField variant="secondary" isRequired isDisabled={!manualFill} name={field.name} className="md:col-span-2" isInvalid={!!fieldState.error}>
              <Label>Estado</Label>
              <Input
                variant="secondary"
                placeholder="SP"
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  handleFieldChange("state", e.target.value);
                }}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />

        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <TextField variant="secondary" value={field.value ?? "BR"} className="md:col-span-1" isDisabled>
              <Label>País</Label>
              <Input variant="secondary" placeholder="BR" />
            </TextField>
          )}
        />
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="secondary" type="button" onPress={onBack}>
          Voltar
        </Button>
        <AsyncButton variant="primary" type="submit" isPending={isPending}>
          Próximo
        </AsyncButton>
      </div>
    </Form>
  );
}

