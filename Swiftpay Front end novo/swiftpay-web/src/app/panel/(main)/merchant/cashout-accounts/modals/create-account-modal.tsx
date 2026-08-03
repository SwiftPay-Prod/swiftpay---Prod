'use client';

import { useState } from 'react';
import { Button, Modal, Input, Label, Select, ListBox, Switch, Chip } from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import { AddSquareIcon, BankIcon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PixKeyType } from '@/types/enums';
import { pixKeyTypeParse, pixKeyTypeOptions, mapParseColorToChipColor } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { createCashoutAccount } from '@/app/actions/merchant/cashout-accounts';
import type { CashoutAccountListData } from '@/types/merchant/cashout-accounts';
import { cpfFormat, cnpjFormat, getPhoneFormat } from '@/utils/input-masks';
import { toast } from '@heroui/react';

interface CreateAccountModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	onAccountCreated: (account: CashoutAccountListData) => void;
}

export function CreateAccountModal({ isOpen, onOpenChange, merchantId, onAccountCreated }: CreateAccountModalProps) {
	const [pixKeyType, setPixKeyType] = useState<PixKeyType>(PixKeyType.Cpf);
	const [pixKey, setPixKey] = useState('');
	const [holderName, setHolderName] = useState('');
	const [bankName, setBankName] = useState('');
	const [isDefault, setIsDefault] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validatePixKey = (key: string, type: PixKeyType): string | null => {
		if (!key.trim()) {
			return 'A chave PIX é obrigatória.';
		}

		const digits = key.replace(/\D/g, '');

		switch (type) {
			case PixKeyType.Cpf:
				if (digits.length !== 11) {
					return 'CPF deve conter 11 dígitos.';
				}
				break;
			case PixKeyType.Cnpj:
				if (digits.length !== 14) {
					return 'CNPJ deve conter 14 dígitos.';
				}
				break;
			case PixKeyType.Email:
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(key)) {
					return 'E-mail inválido.';
				}
				break;
			case PixKeyType.Phone:
				const phoneRegex = /^\+55\d{10,11}$/;
				if (!phoneRegex.test(key.replace(/\s/g, ''))) {
					return 'Telefone deve estar no formato +55XXXXXXXXXXX.';
				}
				break;
			case PixKeyType.Random:
				const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
				if (!uuidRegex.test(key)) {
					return 'Chave aleatória deve ser um UUID válido.';
				}
				break;
		}

		return null;
	};

	const handleSubmit = async () => {
		const newErrors: Record<string, string> = {};
		
		const pixKeyError = validatePixKey(pixKey, pixKeyType);
		if (pixKeyError) {
			newErrors.pixKey = pixKeyError;
		}
		
		if (!holderName.trim()) {
			newErrors.holderName = 'O nome do titular é obrigatório.';
		}
		
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setErrors({});
		setIsPending(true);

		try {
			let formattedPixKey = pixKey.trim();
			if (pixKeyType === PixKeyType.Cpf || pixKeyType === PixKeyType.Cnpj) {
				formattedPixKey = formattedPixKey.replace(/\D/g, '');
			}

			const response = await createCashoutAccount(merchantId, {
				pixKeyType,
				pixKey: formattedPixKey,
				holderName: holderName.trim(),
				bankName: bankName.trim() || undefined,
				isDefault,
			});

			if (response.error) {
				toast('Erro ao criar conta', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
			} else if (response.data) {
				toast('Conta criada!', {
					description: 'Verifique seu e-mail para confirmar a conta.',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
				onAccountCreated(response.data as CashoutAccountListData);
				resetForm();
			}
		} catch {
			toast('Erro ao criar conta', {
				description: 'Ocorreu um erro inesperado. Tente novamente.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleClose = () => {
		if (!isPending) {
			resetForm();
			onOpenChange(false);
		}
	};

	const resetForm = () => {
		setPixKeyType(PixKeyType.Cpf);
		setPixKey('');
		setHolderName('');
		setBankName('');
		setIsDefault(false);
		setErrors({});
	};

	const getPixKeyPlaceholder = (): string => {
		switch (pixKeyType) {
			case PixKeyType.Cpf:
				return 'Ex: 12345678901';
			case PixKeyType.Cnpj:
				return 'Ex: 12345678000190';
			case PixKeyType.Email:
				return 'Ex: email@exemplo.com';
			case PixKeyType.Phone:
				return 'Ex: +5511999887766';
			case PixKeyType.Random:
				return 'Ex: 123e4567-e89b-12d3-a456-426614174000';
			default:
				return 'Digite a chave PIX';
		}
	};

	const getPixKeyHelp = (): string => {
		switch (pixKeyType) {
			case PixKeyType.Cpf:
				return 'Digite apenas os 11 números do CPF.';
			case PixKeyType.Cnpj:
				return 'Digite apenas os 14 números do CNPJ.';
			case PixKeyType.Email:
				return 'Digite um e-mail válido.';
			case PixKeyType.Phone:
				return 'Digite o telefone no formato +55 seguido do DDD e número.';
			case PixKeyType.Random:
				return 'Digite a chave aleatória no formato UUID.';
			default:
				return '';
		}
	};

	const selectedTypeParse = pixKeyTypeParse[pixKeyType];
	const phoneDigits = pixKey.replace(/\D/g, '').replace(/^55/, '');
	const phoneFormat = `+55 ${getPhoneFormat(phoneDigits)}`;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={BankIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Nova Conta de Saque</Modal.Heading>
						<p className="text-sm text-muted">Adicione uma chave PIX para receber seus saques.</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Select
									variant="secondary"
									className="w-full"
									placeholder="Selecione o tipo de chave"
									value={pixKeyType}
									onChange={(key) => {
										setPixKeyType(key as PixKeyType);
										setPixKey('');
										setErrors({});
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

							<div className="flex flex-col gap-2">
								<Label htmlFor="pixKey">Chave PIX</Label>
								{pixKeyType === PixKeyType.Cpf || pixKeyType === PixKeyType.Cnpj ? (
									<PatternFormat
										customInput={Input}
										id="pixKey"
										format={pixKeyType === PixKeyType.Cpf ? cpfFormat : cnpjFormat}
										mask="_"
										placeholder={pixKeyType === PixKeyType.Cpf ? '000.000.000-00' : '00.000.000/0000-00'}
										value={pixKey}
										onValueChange={(values) => {
											setPixKey(values.value);
											if (errors.pixKey) setErrors({});
										}}
										disabled={isPending}
										className={errors.pixKey ? 'border-danger' : ''}
									/>
								) : pixKeyType === PixKeyType.Phone ? (
									<PatternFormat
										customInput={Input}
										id="pixKey"
										format={phoneFormat}
										mask="_"
										placeholder={phoneFormat}
										value={phoneDigits}
										onValueChange={(values) => {
											setPixKey(values.value ? `+55${values.value}` : '');
											if (errors.pixKey) setErrors({});
										}}
										disabled={isPending}
										className={errors.pixKey ? 'border-danger' : ''}
									/>
								) : (
									<Input variant="secondary"
										id="pixKey"
										type={pixKeyType === PixKeyType.Email ? 'email' : 'text'}
										placeholder={getPixKeyPlaceholder()}
										value={pixKey}
										onChange={(e) => {
											setPixKey(e.target.value);
											if (errors.pixKey) setErrors({});
										}}
										disabled={isPending}
										className={errors.pixKey ? 'border-danger' : ''}
									/>
								)}
								{errors.pixKey ? (
									<span className="text-xs text-danger">{errors.pixKey}</span>
								) : (
									<span className="text-xs text-muted">{getPixKeyHelp()}</span>
								)}
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="holderName">Nome do Titular</Label>
								<Input variant="secondary"
									id="holderName"
									placeholder="Ex: João da Silva"
									value={holderName}
									onChange={(e) => {
										setHolderName(e.target.value);
										if (errors.holderName) setErrors((prev) => ({ ...prev, holderName: '' }));
									}}
									disabled={isPending}
									className={errors.holderName ? 'border-danger' : ''}
								/>
								{errors.holderName ? (
									<span className="text-xs text-danger">{errors.holderName}</span>
								) : (
									<span className="text-xs text-muted">
										Nome do titular da conta como registrado no banco.
									</span>
								)}
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="bankName">Nome do Banco (opcional)</Label>
								<Input variant="secondary"
									id="bankName"
									placeholder="Ex: Nubank, Itaú, Bradesco..."
									value={bankName}
									onChange={(e) => setBankName(e.target.value)}
									disabled={isPending}
								/>
								<span className="text-xs text-muted">
									Informe o nome do banco para facilitar a identificação.
								</span>
							</div>

							<div className="flex items-center justify-between rounded-lg bg-surface-secondary p-4">
								<div className="flex flex-col gap-1">
									<span className="text-sm font-medium text-foreground">Definir como padrão</span>
									<span className="text-xs text-muted">
										Os saques serão realizados para esta conta automaticamente.
									</span>
								</div>
								<Switch isSelected={isDefault} onChange={setIsDefault} isDisabled={isPending}>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton variant="primary" onPress={handleSubmit} isPending={isPending}>
							<Icon icon={AddSquareIcon} className="icon-sm" />
							Adicionar Conta
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

