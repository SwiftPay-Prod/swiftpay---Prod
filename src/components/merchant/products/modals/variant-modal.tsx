'use client';

import { useState, useActionState } from 'react';
import { Modal, Button, TextField, Input, Label, Select, ListBox, Chip } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import {
	AddCircleIcon,
	Alert01Icon,
	CheckmarkCircle02Icon,
	PencilEdit01Icon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { createProductVariant, updateProductVariant } from '@/app/actions/merchant/products';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { variantStatusOptions, variantStatusParse, mapParseColorToChipColor } from '@/parse';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { AsyncButton } from '@/components/ui/async-button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { toast } from '@heroui/react';
import { VariantStatus, UploadFolder, ProductType } from '@/types/enums';
import type { ProductVariantData } from '@/types/merchant/products';

interface FormState {
	error: string | null;
}

type VariantModalMode = 'create' | 'edit' | 'view';

interface VariantModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	productId: string;
	mode: VariantModalMode;
	variant?: ProductVariantData | null;
	onSuccess: (updatedVariant?: ProductVariantData) => void;
	productType?: ProductType | null;
	isUnlimitedStock?: boolean;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-muted">{label}</span>
			<span className="text-sm font-medium">{value ?? '-'}</span>
		</div>
	);
}

export function VariantModal({
	isOpen,
	onOpenChange,
	merchantId,
	productId,
	mode,
	variant,
	onSuccess,
	productType,
	isUnlimitedStock,
}: VariantModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	const isEdit = mode === 'edit' && !!variant;
	const initialValues = {
		name: isEdit && variant ? variant.name : '',
		sku: isEdit && variant ? (variant.sku ?? '') : '',
		externalId: isEdit && variant ? (variant.externalId ?? '') : '',
		imageUrls: isEdit && variant?.imageUrl ? [variant.imageUrl] : [],
		priceInCents: isEdit && variant ? variant.price : undefined,
		stockValue: isEdit && variant ? (variant.stockQuantity ?? undefined) : undefined,
		status: isEdit && variant ? variant.status : VariantStatus.Active,
	};
	const formKey = isEdit && variant ? `edit-${variant.id}` : `create-${isOpen ? 'open' : 'closed'}`;

	if (mode === 'view') {
		const statusParse = variant ? variantStatusParse[variant.status] : null;

		return (
			<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
				<Modal.Container size="md" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={ViewIcon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Detalhes da Variante</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							{variant ? (
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-2 gap-4">
										<DetailRow label="Nome" value={variant.name} />
										<DetailRow label="Preço" value={formatCurrency(variant.price)} />
										<DetailRow label="SKU" value={variant.sku ?? '-'} />
										<DetailRow label="Estoque" value={isUnlimitedStock ? '∞' : variant.stockQuantity ?? '-'} />
										<DetailRow label="ID Externo" value={variant.externalId ?? '-'} />
										{statusParse && (
											<DetailRow
												label="Status"
												value={
													<Chip
														variant="soft"
														color={mapParseColorToChipColor(statusParse.color)}
														size="sm"
														className="gap-1"
													>
														{statusParse.icon}
														{statusParse.label}
													</Chip>
												}
											/>
										)}
									</div>
									<ImageUploader
										merchantId={merchantId}
										folder={UploadFolder.Products}
										label="Imagem da variante"
										description=""
										maxFiles={1}
										value={variant.imageUrl ? [variant.imageUrl] : []}
										onChange={() => undefined}
										onlyView
									/>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-muted">
									<span>Variante não encontrada</span>
								</div>
							)}
						</Modal.Body>
						<Modal.Footer>
							<Button variant="primary" onPress={handleClose}>
								Fechar
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		);
	}

	return (
		<VariantForm
			key={formKey}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			merchantId={merchantId}
			productId={productId}
			mode={mode}
			variantId={variant?.id}
			initialValues={initialValues}
			onSuccess={onSuccess}
			productType={productType}
			isUnlimitedStock={isUnlimitedStock}
		/>
	);
}

interface VariantFormProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	productId: string;
	mode: VariantModalMode;
	variantId?: string;
	initialValues: {
		name: string;
		sku: string;
		externalId: string;
		imageUrls: string[];
		priceInCents: number | undefined;
		stockValue: number | undefined;
		status: VariantStatus;
	};
	onSuccess: (updatedVariant?: ProductVariantData) => void;
	productType?: ProductType | null;
	isUnlimitedStock?: boolean;
}

function VariantForm({
	isOpen,
	onOpenChange,
	merchantId,
	productId,
	mode,
	variantId,
	initialValues,
	onSuccess,
	productType,
	isUnlimitedStock,
}: VariantFormProps) {
	const isEdit = mode === 'edit';
	const isCreate = mode === 'create';

	const [name, setName] = useState(initialValues.name);
	const [sku, setSku] = useState(initialValues.sku);
	const [externalId, setExternalId] = useState(initialValues.externalId);
	const [imageUrls, setImageUrls] = useState<string[]>(initialValues.imageUrls);
	const [priceFormatted, setPriceFormatted] = useState('');
	const [stockValue, setStockValue] = useState<number | undefined>(initialValues.stockValue);
	const [selectedStatus, setSelectedStatus] = useState<VariantStatus>(initialValues.status);

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const formName = formData.get('name') as string;
			const formSku = formData.get('sku') as string;
			const formExternalId = formData.get('externalId') as string;
			if (!formName.trim()) return { error: 'Informe o nome da variante' };
			const priceCents = formattedCurrencyToCents(priceFormatted);
			if (!priceCents || priceCents <= 0) return { error: 'Informe o preço da variante' };

			if (isEdit) {
				if (!variantId) return { error: 'Variante não encontrada' };
				const res = await updateProductVariant(merchantId, productId, variantId, {
					name: formName.trim(),
					price: priceCents,
					sku: formSku.trim() || null,
					externalId: formExternalId.trim() || null,
					stockQuantity: isUnlimitedStock ? null : stockValue ?? null,
					imageUrl: imageUrls[0] ?? null,
					status: selectedStatus,
				});

				if (res?.error) return { error: res.error.message };

				toast('Variante atualizada', {
					description: res?.message || 'As alterações foram salvas com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onSuccess(res?.data ?? undefined);
				onOpenChange(false);
			} else if (isCreate) {
				const res = await createProductVariant(merchantId, productId, {
					name: formName.trim(),
					price: priceCents,
					sku: formSku.trim() || null,
					externalId: formExternalId.trim() || null,
					stockQuantity: isUnlimitedStock ? null : stockValue ?? null,
					imageUrl: imageUrls[0] ?? null,
					status: selectedStatus,
				});

				if (res?.error) return { error: res.error.message };

				toast('Variante criada', {
					description: res?.message || 'A variante foi criada com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onSuccess(res?.data ?? undefined);
				onOpenChange(false);
			}

			return { error: null };
		},
		{ error: null }
	);

	function handleClose() {
		onOpenChange(false);
	}

	function getIcon() {
		if (isEdit) return <Icon icon={PencilEdit01Icon} className="icon-md" />;
		return <Icon icon={AddCircleIcon} className="icon-md" />;
	}

	function getTitle() {
		if (isEdit) return 'Editar Variante';
		return 'Nova Variante';
	}

	const isValid = name.trim() && priceFormatted !== '';

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">{getIcon()}</Modal.Icon>
						<Modal.Heading>{getTitle()}</Modal.Heading>
						{isCreate && <p className="text-sm text-muted">Adicione uma variante ao produto</p>}
					</Modal.Header>

					<form action={formAction}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<TextField variant="secondary" aria-label="Nome da variante" name="name" isRequired value={name} onChange={setName}>
									<Label>Nome da variante</Label>
									<Input variant="secondary" placeholder="Ex: Tamanho P, Cor Azul..." autoFocus />
								</TextField>

								<TextField variant="secondary" aria-label="Preço" isRequired>
									<Label>Preço</Label>
									<CurrencyCentsInput
										initialValueInCents={initialValues.priceInCents}
										variant="secondary"
										placeholder="R$ 0,00"
										onValueChange={(v) => setPriceFormatted(v)}
									/>
								</TextField>

								<TextField variant="secondary" aria-label="SKU" name="sku" value={sku} onChange={setSku}>
									<Label>SKU (opcional)</Label>
									<Input variant="secondary" placeholder="Código único do produto..." />
								</TextField>

								{productType === ProductType.Physical && !isUnlimitedStock && (
									<>
										{isEdit ? (
											<div className="flex flex-col gap-2">
												<Label>Quantidade em estoque</Label>
												<div className="flex items-center gap-3 rounded-lg border border-default bg-surface-deep p-3">
													<span className="text-lg font-semibold">{initialValues.stockValue ?? '∞'}</span>
													<span className="text-xs text-muted">Para alterar o estoque, utilize a aba &quot;Estoque&quot;</span>
												</div>
											</div>
										) : (
											<TextField variant="secondary" aria-label="Estoque">
												<Label>Quantidade em estoque (opcional)</Label>
												<NumericFormat
													customInput={Input}
													thousandSeparator="."
													decimalSeparator="," 
													decimalScale={0}
													allowNegative={false}
													value={stockValue}
													placeholder="0"
													onValueChange={(values) => setStockValue(values.floatValue)}
												/>
											</TextField>
										)}
									</>
								)}

								{productType === ProductType.Physical && isUnlimitedStock && (
									<div className="flex items-center justify-between rounded-lg border border-default bg-surface-deep p-3">
										<span className="text-sm">Estoque ilimitado</span>
										<span className="text-lg font-semibold">∞</span>
									</div>
								)}

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

								<TextField variant="secondary" aria-label="ID Externo" name="externalId" value={externalId} onChange={setExternalId}>
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
								{isEdit ? (
									<Icon icon={PencilEdit01Icon} className="icon-sm" />
								) : (
									<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
								)}
								{isEdit ? 'Salvar Alterações' : 'Criar Variante'}
							</AsyncButton>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

