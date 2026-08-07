'use client';

import { useState, useTransition } from 'react';
import { Button, Modal, Input, Label, Select, ListBox, Chip, TextField } from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import { BankIcon, AddSquareIcon, PencilEdit01Icon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { PixKeyType } from '@/types/enums';
import { pixKeyTypeParse, pixKeyTypeOptions, mapParseColorToChipColor } from '@/parse';
import {
	adminCreatePlatformPayoutAccount,
	adminUpdatePlatformPayoutAccount,
} from '@/app/actions/admin/platform-payouts';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';
import { cpfFormat, cnpjFormat, getPhoneFormat } from '@/utils/input-masks';
import { toast } from '@heroui/react';

interface UpsertModalProps {
	isOpen: boolean;
	account: AdminPlatformPayoutAccountData | null;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: () => void;
}

function validatePixKey(key: string, type: PixKeyType): string | null {
	if (!key.trim()) return 'A chave PIX é obrigatória.';
	const digits = key.replace(/\D/g, '');
	switch (type) {
		case PixKeyType.Cpf:
			if (digits.length !== 11) return 'CPF deve conter 11 dígitos.';
			break;
		case PixKeyType.Cnpj:
			if (digits.length !== 14) return 'CNPJ deve conter 14 dígitos.';
			break;
		case PixKeyType.Email:
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return 'E-mail inválido.';
			break;
		case PixKeyType.Phone:
			if (!/^\+55\d{10,11}$/.test(key.replace(/\s/g, ''))) return 'Telefone deve estar no formato +55XXXXXXXXXXX.';
			break;
		case PixKeyType.Random:
			if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key))
				return 'Chave aleatória deve ser um UUID válido.';
			break;
	}
	return null;
}

function getPixKeyPlaceholder(type: PixKeyType): string {
	switch (type) {
		case PixKeyType.Cpf:
			return '00000000000';
		case PixKeyType.Cnpj:
			return '00000000000000';
		case PixKeyType.Email:
			return 'exemplo@email.com';
		case PixKeyType.Phone:
			return '+5511999999999';
		case PixKeyType.Random:
			return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
	}
}

interface FormContentProps {
	account: AdminPlatformPayoutAccountData | null;
	onClose: () => void;
	onSuccess: () => void;
}

function FormContent({ account, onClose, onSuccess }: FormContentProps) {
	const isEditing = !!account;

	const [pixKeyType, setPixKeyType] = useState<PixKeyType>(
		(account?.pixKeyType as PixKeyType) || PixKeyType.Cpf
	);
	const [pixKey, setPixKey] = useState(account?.pixKey || '');
	const [holderName, setHolderName] = useState(account?.holderName || '');
	const [holderDocument, setHolderDocument] = useState(account?.holderDocument || '');
	const [bankName, setBankName] = useState(account?.bankName || '');
	const [bankIspb, setBankIspb] = useState(account?.bankIspb || '');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isPending, startTransition] = useTransition();

	function handleSubmit() {
		const newErrors: Record<string, string> = {};

		const keyError = validatePixKey(pixKey, pixKeyType);
		if (keyError) newErrors.pixKey = keyError;
		if (!holderName.trim()) newErrors.holderName = 'Nome do titular é obrigatório.';
		if (!holderDocument.trim()) newErrors.holderDocument = 'Documento é obrigatório.';

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		startTransition(async () => {
			const payload = {
				pixKeyType,
				pixKey: pixKey.trim(),
				holderName: holderName.trim(),
				holderDocument: holderDocument.trim(),
				bankName: bankName.trim() || null,
				bankIspb: bankIspb.trim() || null,
			};

			const response = isEditing
				? await adminUpdatePlatformPayoutAccount(account!.id, payload)
				: await adminCreatePlatformPayoutAccount(payload);

			if (response?.error) {
				toast('Erro ao salvar conta', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast(isEditing ? 'Conta atualizada' : 'Conta criada', {
				description: response?.message || (isEditing ? 'A conta foi atualizada com sucesso!' : 'A conta foi criada com sucesso!'),
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onSuccess();
		});
	}

	const selectedTypeParse = pixKeyTypeParse[pixKeyType];
	const phoneDigits = pixKey.replace(/\D/g, '').replace(/^55/, '');
	const phoneFormat = `+55 ${getPhoneFormat(phoneDigits)}`;
	const holderDigits = holderDocument.replace(/\D/g, '');
	const holderFormat = holderDigits.length > 11 ? cnpjFormat : cpfFormat;

	return (
		<>
			<Modal.Body>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Select
							variant="secondary"
							className="w-full"
							placeholder="Selecione o tipo de chave"
							value={pixKeyType}
							onChange={(key) => {
								if (key) {
									setPixKeyType(key as PixKeyType);
									setPixKey('');
									setErrors((prev) => {
										const next = { ...prev };
										delete next.pixKey;
										return next;
									});
								}
							}}
							isDisabled={isPending}
						>
							<Label>Tipo de Chave PIX</Label>
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
									{pixKeyTypeOptions.map((option) => (
										<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
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
					</div>

					<TextField variant="secondary"
						isRequired
						isInvalid={!!errors.pixKey}
						isDisabled={isPending}
					>
						<Label>Chave PIX</Label>
							{pixKeyType === PixKeyType.Cpf || pixKeyType === PixKeyType.Cnpj ? (
								<PatternFormat
									customInput={Input}
									format={pixKeyType === PixKeyType.Cpf ? cpfFormat : cnpjFormat}
									mask="_"
									placeholder={pixKeyType === PixKeyType.Cpf ? '000.000.000-00' : '00.000.000/0000-00'}
									value={pixKey}
									onValueChange={(values) => {
										setPixKey(values.value);
										setErrors((prev) => {
											const next = { ...prev };
											delete next.pixKey;
											return next;
										});
									}}
								/>
							) : pixKeyType === PixKeyType.Phone ? (
								<PatternFormat
									customInput={Input}
									format={phoneFormat}
									mask="_"
									placeholder={phoneFormat}
									value={phoneDigits}
									onValueChange={(values) => {
										setPixKey(values.value ? `+55${values.value}` : '');
										setErrors((prev) => {
											const next = { ...prev };
											delete next.pixKey;
											return next;
										});
									}}
								/>
							) : (
								<Input variant="secondary"
									placeholder={getPixKeyPlaceholder(pixKeyType)}
									value={pixKey}
									type={pixKeyType === PixKeyType.Email ? 'email' : 'text'}
									onChange={(e) => {
										setPixKey(e.target.value);
										setErrors((prev) => {
											const next = { ...prev };
											delete next.pixKey;
											return next;
										});
									}}
								/>
							)}
						{errors.pixKey && (
							<p className="text-xs text-danger">{errors.pixKey}</p>
						)}
					</TextField>

					<TextField variant="secondary"
						isRequired
						isInvalid={!!errors.holderName}
						isDisabled={isPending}
					>
						<Label>Nome do Titular</Label>
						<Input variant="secondary"
							placeholder="Nome completo ou razão social"
							value={holderName}
							onChange={(e) => {
								setHolderName(e.target.value);
								setErrors((prev) => {
									const next = { ...prev };
									delete next.holderName;
									return next;
								});
							}}
						/>
						{errors.holderName && (
							<p className="text-xs text-danger">{errors.holderName}</p>
						)}
					</TextField>

					<TextField variant="secondary"
						isRequired
						isInvalid={!!errors.holderDocument}
						isDisabled={isPending}
					>
						<Label>Documento do Titular</Label>
							<PatternFormat
								customInput={Input}
								format={holderFormat}
								mask="_"
								placeholder={holderDigits.length > 11 ? '00.000.000/0000-00' : '000.000.000-00'}
								value={holderDigits}
								onValueChange={(values) => {
									setHolderDocument(values.value);
									setErrors((prev) => {
										const next = { ...prev };
										delete next.holderDocument;
										return next;
									});
								}}
							/>
						{errors.holderDocument && (
							<p className="text-xs text-danger">{errors.holderDocument}</p>
						)}
					</TextField>

					<div className="grid grid-cols-2 gap-4">
						<TextField variant="secondary" isDisabled={isPending}>
							<Label>Nome do Banco</Label>
							<Input variant="secondary"
								placeholder="Banco do Brasil"
								value={bankName}
								onChange={(e) => setBankName(e.target.value)}
							/>
						</TextField>

						<TextField variant="secondary" isDisabled={isPending}>
							<Label>ISPB do Banco</Label>
							<Input variant="secondary"
								placeholder="00000000"
								value={bankIspb}
								onChange={(e) => setBankIspb(e.target.value)}
							/>
						</TextField>
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
					Cancelar
				</Button>
				<AsyncButton variant="primary" onPress={handleSubmit} isPending={isPending}>
					<Icon icon={isEditing ? PencilEdit01Icon : AddSquareIcon} className="icon-sm" />
					{isEditing ? 'Salvar Alterações' : 'Adicionar Conta'}
				</AsyncButton>
			</Modal.Footer>
		</>
	);
}

export function AdminUpsertPlatformPayoutAccountModal({ isOpen, account, onOpenChange, onSuccess }: UpsertModalProps) {
	const isEditing = !!account;

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={BankIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>{isEditing ? 'Editar Conta de Saque' : 'Nova Conta de Saque'}</Modal.Heading>
						<p className="text-sm text-muted">
							{isEditing
								? 'Altere os dados da conta PIX da plataforma.'
								: 'Cadastre uma nova chave PIX para saques da plataforma.'}
						</p>
					</Modal.Header>
					<FormContent
						key={account?.id ?? 'new'}
						account={account}
						onClose={handleClose}
						onSuccess={onSuccess}
					/>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

