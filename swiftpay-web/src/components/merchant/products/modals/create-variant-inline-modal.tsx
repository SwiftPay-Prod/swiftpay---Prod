'use client';

import { useState, useActionState } from 'react';
import { Modal, Button, TextField, Input, Label, Select, ListBox, Chip } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { Alert01Icon, CheckmarkCircle02Icon, PackageIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formattedCurrencyToCents } from '@/utils/currency';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { variantStatusOptions, variantStatusParse, mapParseColorToChipColor } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { VariantStatus, UploadFolder, ProductType } from '@/types/enums';
import type { CreateVariantRequest } from '@/types/merchant/products';

interface FormState {
	error: string | null;
}

interface CreateVariantInlineModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: (variant: CreateVariantRequest) => void;
	merchantId: string;
	productType?: ProductType | null;
	isUnlimitedStock?: boolean;
}

export function CreateVariantInlineModal({
	isOpen,
	onOpenChange,
	onSuccess,
	merchantId,
	productType,
	isUnlimitedStock,
}: CreateVariantInlineModalProps) {
	const [name, setName] = useState('');
	const [priceFormatted, setPriceFormatted] = useState('');
	const [sku, setSku] = useState('');
	const [externalId, setExternalId] = useState('');
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [stockQuantity, setStockQuantity] = useState<number | undefined>(undefined);
	const [selectedStatus, setSelectedStatus] = useState<VariantStatus>(VariantStatus.Active);

	const showStockField = productType === ProductType.Physical && !isUnlimitedStock;

	function resetForm() {
		setName('');
		setPriceFormatted('');
		setSku('');
		setExternalId('');
		setImageUrls([]);
		setStockQuantity(undefined);
		setSelectedStatus(VariantStatus.Active);
	}

	const [state, formAction, isPending] = useActionState(
		async (): Promise<FormState> => {
			if (!name.trim()) return { error: 'Informe o nome da variante' };
			const priceCents = formattedCurrencyToCents(priceFormatted);
			if (priceCents === null || priceCents < 0) return { error: 'Informe um preço válido' };

			const variant: CreateVariantRequest = {
				name: name.trim(),
				price: priceCents,
				sku: sku.trim() || null,
				externalId: externalId.trim() || null,
				imageUrl: imageUrls[0] ?? null,
				stockQuantity: showStockField ? stockQuantity ?? null : null,
				status: selectedStatus,
			};

			onSuccess(variant);
			resetForm();

			return { error: null };
		},
		{ error: null }
	);

	function handleClose() {
		resetForm();
		onOpenChange(false);
	}

	const isValid = name.trim() && priceFormatted !== '';

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={PackageIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Nova Variante</Modal.Heading>
						<p className="text-sm text-muted">Adicione uma variante para o produto</p>
					</Modal.Header>
					<form action={formAction}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<TextField variant="secondary" aria-label="Nome da variante" isRequired value={name} onChange={setName}>
									<Label>Nome da variante</Label>
									<Input variant="secondary" placeholder="Ex: Tamanho P, Cor Azul..." autoFocus />
								</TextField>

								<TextField variant="secondary" aria-label="Preço" isRequired>
									<Label>Preço</Label>
									<CurrencyCentsInput
										variant="secondary"
										placeholder="R$ 0,00"
										onValueChange={(v) => setPriceFormatted(v)}
									/>
								</TextField>

								<div className="grid grid-cols-2 gap-4">
									<TextField variant="secondary" aria-label="SKU" value={sku} onChange={setSku}>
										<Label>SKU (opcional)</Label>
										<Input variant="secondary" placeholder="SKU-001" />
									</TextField>

									{showStockField && (
										<TextField variant="secondary" aria-label="Quantidade em estoque">
											<Label>Estoque (opcional)</Label>
											<NumericFormat
												customInput={Input}
												allowNegative={false}
												decimalScale={0}
												thousandSeparator="."
												decimalSeparator="," 
												value={stockQuantity}
												placeholder="0"
												onValueChange={(values) => setStockQuantity(values.floatValue)}
											/>
										</TextField>
									)}
								</div>

								<TextField variant="secondary" aria-label="ID Externo" value={externalId} onChange={setExternalId}>
									<Label>ID Externo (opcional)</Label>
									<Input variant="secondary" placeholder="ID no seu sistema..." />
								</TextField>

								<ImageUploader
									merchantId={merchantId}
									folder={UploadFolder.Products}
									label="Imagem da variante"
									description="Envie 1 imagem para a variante."
									maxFiles={1}
									value={imageUrls}
									onChange={setImageUrls}
								/>

								<div className="flex flex-col gap-1.5">
									<Label>Status</Label>
									<Select
										variant="secondary"
										aria-label="Status"
										placeholder="Selecione o status"
										value={selectedStatus}
										onChange={(key) => setSelectedStatus(key as VariantStatus)}
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{variantStatusOptions.map((option) => {
													const statusParse = variantStatusParse[option.value];
													return (
														<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
															<div className="flex items-center gap-2">
																<Chip
																	size="sm"
																	variant="soft"
																	color={mapParseColorToChipColor(statusParse.color)}
																	className="gap-1"
																>
																	{statusParse.icon}
																	{option.label}
																</Chip>
															</div>
															<ListBox.ItemIndicator />
														</ListBox.Item>
													);
												})}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>

								{state.error && (
									<div className="flex items-center gap-2 text-sm text-danger">
										<Icon icon={Alert01Icon} className="icon-sm" />
										<span>{state.error}</span>
									</div>
								)}
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="primary" isPending={isPending} isDisabled={!isValid}>
								<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
								Adicionar Variante
							</AsyncButton>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

