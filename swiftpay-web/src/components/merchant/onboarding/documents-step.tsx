'use client';

import { useTransition } from 'react';
import { Button, Input, Label, TextField, Select, ListBox, FieldError, Form, Chip } from '@heroui/react';
import type { Key } from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { MerchantData, UpdateMerchantRequest } from '@/types/merchant/crud';
import type { DocumentsFormData } from '@/types/merchant/onboarding';
import { merchantToDocumentsFormData } from '@/types/merchant/onboarding';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { FileUpload } from './file-upload';
import { AsyncButton } from '@/components/ui/async-button';
import { isValidCPF, isValidCNPJ } from '@/utils/validations';
import { getDocumentFormat } from '@/utils/input-masks';
import {
	merchantDocumentTypeOptions,
	merchantIdentityDocumentTypeOptions,
	merchantOperationTypeOptions,
	mapParseColorToChipColor,
} from '@/parse';
import { UploadFolder } from '@/types/enums';

interface DocumentsStepProps {
	merchant: MerchantData;
	onSaveFields: (data: Partial<UpdateMerchantRequest>, showToast?: boolean) => Promise<MerchantData | null>;
	onNext: () => void;
	onBack: () => void;
}

export function DocumentsStep({ merchant, onSaveFields, onNext, onBack }: DocumentsStepProps) {
	const { control, setValue, handleSubmit, trigger } = useForm<DocumentsFormData>({
		defaultValues: merchantToDocumentsFormData(merchant),
		mode: 'onChange',
	});
	const formData = useWatch({ control }) as DocumentsFormData;
	const [isPending, startTransition] = useTransition();

	const debouncedSaveIfValid = useDebouncedCallback(async (field: keyof DocumentsFormData, value: string | null) => {
		const isValid = await trigger(field);
		if (!isValid) return;
		onSaveFields({ [field]: value });
	}, 350);

	function normalizeString(value: string | null | undefined): string | null {
		if (!value) return null;
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	function handleFieldChange(field: keyof DocumentsFormData, value: string | null) {
		debouncedSaveIfValid(field, value);
	}

	function handleSelectChange(field: keyof DocumentsFormData, key: Key | null) {
		if (!key) return;
		const stringValue = String(key);

		if (field === 'documentType') {
			const typedValue = stringValue as DocumentsFormData['documentType'];
			setValue('documentType', typedValue, { shouldDirty: true, shouldValidate: false });
			setValue('documentNumber', null, { shouldDirty: true, shouldValidate: false });
			onSaveFields({ documentType: typedValue, documentNumber: null });
			void trigger('documentType');
			void trigger('documentNumber');
		} else if (field === 'identityDocumentType') {
			const typedValue = stringValue as DocumentsFormData['identityDocumentType'];
			setValue('identityDocumentType', typedValue, { shouldDirty: true, shouldValidate: false });
			setValue('identityDocumentNumber', null, { shouldDirty: true, shouldValidate: false });
			onSaveFields({ identityDocumentType: typedValue, identityDocumentNumber: null });
			void trigger('identityDocumentType');
			void trigger('identityDocumentNumber');
		} else {
			const typedValue = stringValue as DocumentsFormData[keyof DocumentsFormData];
			setValue(field, typedValue, { shouldDirty: true, shouldValidate: false });
			onSaveFields({ [field]: typedValue });
			void trigger(field);
		}
	}

	function handleFileUpload(field: keyof DocumentsFormData, fileId: string) {
		setValue(field, fileId, { shouldDirty: true, shouldValidate: false });
		onSaveFields({ [field]: fileId });
	}

	function handleFileRemove(field: keyof DocumentsFormData) {
		setValue(field, null, { shouldDirty: true, shouldValidate: false });
		onSaveFields({ [field]: '00000000-0000-0000-0000-000000000000' });
	}

	function onSubmit(values: DocumentsFormData) {
		const payload: DocumentsFormData = {
			legalName: normalizeString(values.legalName),
			documentType: values.documentType,
			documentNumber: normalizeString(values.documentNumber),
			identityDocumentType: values.identityDocumentType,
			identityDocumentNumber: normalizeString(values.identityDocumentNumber),
			operationType: values.operationType,
			proofOfAddressFileId: values.proofOfAddressFileId,
			documentFrontFileId: values.documentFrontFileId,
			documentBackFileId: values.documentBackFileId,
			selfieFileId: values.selfieFileId,
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
				<h2 className="text-xl font-semibold text-foreground">Documentos e KYC</h2>
				<p className="text-default-500 mt-1">Informe os dados e documentos para verificação da sua organização.</p>
			</div>

			<div className="h-px bg-divider" />

			<div className="space-y-6">
				<div>
					<h3 className="text-medium font-medium text-foreground mb-4">Dados da Empresa</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Controller
							name="legalName"
							control={control}
							rules={{
								validate: (value) => {
									if (!value) return 'Razão social é obrigatória';
									if (value.trim().length < 3) return 'Razão social deve ter pelo menos 3 caracteres';
									return true;
								},
							}}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired name={field.name} className="md:col-span-2" isInvalid={!!fieldState.error}>
									<Label>Razão Social</Label>
									<Input
										variant="secondary"
										placeholder="Empresa Exemplo Ltda"
										value={field.value ?? ''}
										onChange={(e) => {
											field.onChange(e.target.value || null);
											handleFieldChange('legalName', e.target.value);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>

						<Controller
							name="documentType"
							control={control}
							rules={{ validate: (value) => (value ? true : 'Tipo de documento é obrigatório') }}
							render={({ field, fieldState }) => (
								<div className="flex flex-col gap-1">
									<Select
										isRequired
										variant="secondary"
										placeholder="Selecione o tipo"
										aria-label="Tipo de Documento"
										value={field.value}
										onChange={(key) => {
											field.onChange((key as Key)?.toString() || null);
											handleSelectChange('documentType', key as Key);
										}}
										isInvalid={!!fieldState.error}
									>
										<Label>Tipo de Documento</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{merchantDocumentTypeOptions.map((type) => (
													<ListBox.Item key={type.key} id={type.key} textValue={type.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(type.color ?? 'default')}>
															{type.icon}
															{type.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<FieldError>{fieldState.error?.message}</FieldError>
								</div>
							)}
						/>

						<Controller
							name="documentNumber"
							control={control}
							rules={{
								validate: (value) => {
									if (!value) return 'Documento é obrigatório';
									if (formData.documentType === 'CNPJ' && !isValidCNPJ(value)) return 'CNPJ inválido';
									if (formData.documentType !== 'CNPJ' && !isValidCPF(value)) return 'CPF inválido';
									return true;
								},
							}}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired isDisabled={!formData.documentType} name={field.name} isInvalid={!!fieldState.error}>
									<Label>{formData.documentType === 'CNPJ' ? 'CNPJ' : 'CPF'}</Label>
									<PatternFormat
										customInput={Input}
										format={getDocumentFormat(formData.documentType)}
										mask="_"
										value={field.value ?? ''}
										placeholder={formData.documentType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
										disabled={!formData.documentType}
										onValueChange={(values) => {
											field.onChange(values.value || null);
											handleFieldChange('documentNumber', values.value);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>

						<Controller
							name="operationType"
							control={control}
							rules={{ validate: (value) => (value ? true : 'Tipo de operação é obrigatório') }}
							render={({ field, fieldState }) => (
								<div className="flex flex-col gap-1">
									<Select
										isRequired
										variant="secondary"
										placeholder="Selecione o tipo"
										aria-label="Tipo de Operação"
										value={field.value}
										onChange={(key) => {
											field.onChange((key as Key)?.toString() || null);
											handleSelectChange('operationType', key as Key);
										}}
										isInvalid={!!fieldState.error}
									>
										<Label>Tipo de Operação</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{merchantOperationTypeOptions.map((type) => (
													<ListBox.Item key={type.key} id={type.key} textValue={type.label}>
														<Chip
															variant="soft"
															color={mapParseColorToChipColor(type.color ?? 'default')}
															className={type.className}
														>
															{type.icon}
															{type.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<FieldError>{fieldState.error?.message}</FieldError>
								</div>
							)}
						/>

					</div>
				</div>

				<div className="h-px bg-divider" />

				<div>
					<h3 className="text-medium font-medium text-foreground mb-4">Documento de Identidade</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Controller
							name="identityDocumentType"
							control={control}
							rules={{ validate: (value) => (value ? true : 'Tipo de documento de identidade é obrigatório') }}
							render={({ field, fieldState }) => (
								<div className="flex flex-col gap-1">
									<Select
										isRequired
										variant="secondary"
										placeholder="Selecione o tipo"
										aria-label="Tipo de Documento de Identidade"
										value={field.value}
										onChange={(key) => {
											field.onChange((key as Key)?.toString() || null);
											handleSelectChange('identityDocumentType', key as Key);
										}}
										isInvalid={!!fieldState.error}
									>
										<Label>Tipo de Documento</Label>
										<Select.Trigger className="w-full">
											<Select.Value />
											<Select.Indicator className="size-4" />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{merchantIdentityDocumentTypeOptions.map((type) => (
													<ListBox.Item key={type.key} id={type.key} textValue={type.label}>
														<Chip variant="soft" color={mapParseColorToChipColor(type.color ?? 'default')}>
															{type.icon}
															{type.label}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
									<FieldError>{fieldState.error?.message}</FieldError>
								</div>
							)}
						/>

						<Controller
							name="identityDocumentNumber"
							control={control}
							rules={{ validate: (value) => (value ? true : 'Número do documento é obrigatório') }}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired isDisabled={!formData.identityDocumentType} name={field.name} isInvalid={!!fieldState.error}>
									<Label>Número do Documento</Label>
									<Input
										variant="secondary"
										placeholder={formData.identityDocumentType === 'RG' ? 'Digite o RG' : 'Digite a CNH'}
										value={field.value ?? ''}
										onChange={(e) => {
											field.onChange(e.target.value || null);
											handleFieldChange('identityDocumentNumber', e.target.value);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>
					</div>
				</div>

				<div className="h-px bg-divider" />

				<div>
					<h3 className="text-medium font-medium text-foreground mb-4">Upload de Documentos</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FileUpload
							merchantId={merchant.id}
							folder={UploadFolder.Kyc}
							label="Comprovante de Endereço"
							description="Conta de luz, água ou telefone dos últimos 3 meses"
							currentFile={merchant.kyc?.proofOfAddress}
							onUploadComplete={(fileId) => handleFileUpload('proofOfAddressFileId', fileId)}
							onRemove={() => handleFileRemove('proofOfAddressFileId')}
						/>

						<FileUpload
							merchantId={merchant.id}
							folder={UploadFolder.Kyc}
							label="Documento (Frente)"
							description="Frente do RG ou CNH"
							currentFile={merchant.kyc?.documentFront}
							onUploadComplete={(fileId) => handleFileUpload('documentFrontFileId', fileId)}
							onRemove={() => handleFileRemove('documentFrontFileId')}
						/>

						<FileUpload
							merchantId={merchant.id}
							folder={UploadFolder.Kyc}
							label="Documento (Verso)"
							description="Verso do RG ou CNH"
							currentFile={merchant.kyc?.documentBack}
							onUploadComplete={(fileId) => handleFileUpload('documentBackFileId', fileId)}
							onRemove={() => handleFileRemove('documentBackFileId')}
						/>

						<FileUpload
							merchantId={merchant.id}
							folder={UploadFolder.Kyc}
							label="Selfie com Documento"
							description="Foto segurando o documento ao lado do rosto"
							currentFile={merchant.kyc?.selfie}
							onUploadComplete={(fileId) => handleFileUpload('selfieFileId', fileId)}
							onRemove={() => handleFileRemove('selfieFileId')}
						/>
					</div>
				</div>
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

