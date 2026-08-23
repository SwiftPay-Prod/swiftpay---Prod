'use client';

import { useState, useActionState, useEffect, useTransition, type ReactNode } from 'react';
import {
	Card,
	Modal,
	Chip,
	Skeleton,
	Button,
	Tooltip,
	Avatar,
	TextField,
	Input,
	Label,
	Description,
	Select,
	ListBox,
	TextArea,
	FieldError,
	Form,
	Dropdown,
	Header,
	Switch,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Add01Icon,
	InformationCircleIcon,
	Key01Icon,
	Delete02Icon,
	Upload04Icon,
	Copy01Icon,
	ViewIcon,
	ViewOffIcon,
	DeliveryBox01Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	MoreVerticalIcon,
	CancelCircleIcon,
	Alert01Icon,
} from '@hugeicons/core-free-icons';
import {
	digitalItemTypeParse,
	digitalItemStatusParse,
	digitalItemTypeOptions,
	digitalItemStatusOptions,
	mapParseColorToChipColor,
} from '@/parse';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { AsyncButton } from '@/components/ui/async-button';
import {
	listProductDigitalItems,
	createProductDigitalItem,
	createBulkProductDigitalItems,
	deleteProductDigitalItem,
	updateProductDigitalItem,
} from '@/app/actions/merchant/digital-items';
import { toast } from '@heroui/react';
import { DigitalItemType, DigitalItemStatus } from '@/types/enums';
import type { MinimalDigitalItem, DigitalItemStats } from '@/types/merchant/digital-items';

interface ProductVariant {
	id: string;
	name: string;
}

export interface PendingDigitalItem {
	tempId: string;
	type: DigitalItemType;
	content: string;
	variantId?: string | null;
}

interface DigitalItemsSectionProps {
	merchantId: string;
	productId: string | null;
	variants?: ProductVariant[];
	pendingItems?: PendingDigitalItem[];
	onPendingItemsChange?: (items: PendingDigitalItem[]) => void;
	isUnlimitedStock?: boolean;
	onUnlimitedStockChange?: (value: boolean) => void;
	disabled?: boolean;
}

interface CreateDigitalItemModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	productId: string;
	variants?: ProductVariant[];
	isUnlimitedStock?: boolean;
	variantIdsWithItems?: string[];
	onSuccess: () => void;
}

interface BulkCreateModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	productId: string;
	variants?: ProductVariant[];
	isUnlimitedStock?: boolean;
	variantIdsWithItems?: string[];
	onSuccess: () => void;
}

interface FormState {
	error: string | null;
}

function SectionHeader({
	icon,
	title,
	description,
	action,
}: {
	icon: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-secondary">{icon}</div>
				<div>
					<h3 className="text-sm font-medium">{title}</h3>
					{description && <p className="text-xs text-muted">{description}</p>}
				</div>
			</div>
			{action}
		</div>
	);
}

function CreateDigitalItemModal({
	isOpen,
	onOpenChange,
	merchantId,
	productId,
	variants,
	isUnlimitedStock,
	variantIdsWithItems,
	onSuccess,
}: CreateDigitalItemModalProps) {
	const [selectedType, setSelectedType] = useState<DigitalItemType>(DigitalItemType.Key);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

	const availableVariants =
		isUnlimitedStock && variantIdsWithItems
			? variants?.filter((v) => !variantIdsWithItems.includes(v.id))
			: variants;

	const [state, formAction, isPending] = useActionState(
		async (_prev: FormState, formData: FormData): Promise<FormState> => {
			const content = formData.get('content') as string;

			if (!content?.trim()) {
				return { error: 'O conteúdo é obrigatório' };
			}

			const res = await createProductDigitalItem(merchantId, productId, {
				type: selectedType,
				content: content.trim(),
				variantId: selectedVariantId,
			});

			if (res?.error) {
				return { error: res.error.message };
			}

			toast('Item digital criado', {
				description: res?.message || 'O item foi adicionado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onSuccess();
			onOpenChange(false);
			return { error: null };
		},
		{ error: null }
	);

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Add01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Adicionar Item Digital</Modal.Heading>
						<p className="text-sm text-muted">Adicione uma chave, link ou código</p>
					</Modal.Header>
					<Form action={formAction} validationErrors={state.error ? { content: state.error } : undefined}>
						<Modal.Body className="flex flex-col gap-4">
							<Select
								variant="secondary"
								aria-label="Tipo"
								defaultValue={DigitalItemType.Key}
								onChange={(key) => setSelectedType(key as DigitalItemType)}
							>
								<Label>Tipo</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{digitalItemTypeOptions.map((option) => (
											<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(option.color)}>
													{option.icon}
													{option.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
							{availableVariants && availableVariants.length > 0 && (
								<Select
									variant="secondary"
									aria-label="Variante"
									defaultValue={selectedVariantId ?? 'all'}
									onChange={(key) => setSelectedVariantId(key === 'all' ? null : (key as string))}
								>
									<Label>Variante {isUnlimitedStock ? '(obrigatório)' : '(opcional)'}</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{!isUnlimitedStock && (
												<ListBox.Item id="all" textValue="Todas as variantes">
													<span className="text-muted">Todas as variantes</span>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											)}
											{availableVariants.map((variant) => (
												<ListBox.Item id={variant.id} key={variant.id} textValue={variant.name}>
													<span>{variant.name}</span>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							)}
							<TextField variant="secondary" name="content" isRequired>
								<Label>
									{selectedType === DigitalItemType.Key
										? 'Chave/Serial'
										: selectedType === DigitalItemType.DownloadLink || selectedType === DigitalItemType.ExternalLink
											? 'URL'
											: selectedType === DigitalItemType.AccessCode
												? 'Código de Acesso'
												: 'Valor'}
								</Label>
								<Input variant="secondary"
									placeholder={
										selectedType === DigitalItemType.Key
											? 'XXXX-XXXX-XXXX-XXXX'
											: selectedType === DigitalItemType.DownloadLink || selectedType === DigitalItemType.ExternalLink
												? 'https://...'
												: selectedType === DigitalItemType.AccessCode
													? 'ABC123'
													: 'Digite o valor...'
									}
								/>
								<FieldError />
							</TextField>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="primary" isPending={isPending}>
								Criar Item
							</AsyncButton>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

function BulkCreateModal({
	isOpen,
	onOpenChange,
	merchantId,
	productId,
	variants,
	isUnlimitedStock,
	variantIdsWithItems,
	onSuccess,
}: BulkCreateModalProps) {
	const [selectedType, setSelectedType] = useState<DigitalItemType>(DigitalItemType.Key);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

	const availableVariants =
		isUnlimitedStock && variantIdsWithItems
			? variants?.filter((v) => !variantIdsWithItems.includes(v.id))
			: variants;

	const [state, formAction, isPending] = useActionState(
		async (_prev: FormState, formData: FormData): Promise<FormState> => {
			const contents = formData.get('contents') as string;

			if (!contents?.trim()) {
				return { error: 'Os conteúdos são obrigatórios' };
			}

			const items = contents
				.split('\n')
				.map((v) => v.trim())
				.filter((v) => v.length > 0);

			if (items.length === 0) {
				return { error: 'Digite ao menos um conteúdo' };
			}

			const res = await createBulkProductDigitalItems(merchantId, productId, {
				type: selectedType,
				contents: items,
				variantId: selectedVariantId,
			});

			if (res?.error) {
				return { error: res.error.message };
			}

			const data = res?.data;
			if (data) {
				toast('Itens criados', {
					description: `${data.createdCount} itens criados com sucesso!`,
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				if (data.duplicateCount > 0) {
					toast('Atenção', {
						description: `${data.duplicateCount} itens duplicados foram ignorados.`,
						indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
						variant: 'warning',
					});
				}
			}
			onSuccess();
			onOpenChange(false);
			return { error: null };
		},
		{ error: null }
	);

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Upload04Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Importar em Massa</Modal.Heading>
						<p className="text-sm text-muted">Cole os valores separados por linha</p>
					</Modal.Header>
					<Form action={formAction} validationErrors={state.error ? { contents: state.error } : undefined}>
						<Modal.Body className="flex flex-col gap-4">
							<Select
								variant="secondary"
								aria-label="Tipo"
								defaultValue={DigitalItemType.Key}
								onChange={(key) => setSelectedType(key as DigitalItemType)}
							>
								<Label>Tipo</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{digitalItemTypeOptions.map((option) => (
											<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(option.color)}>
													{option.icon}
													{option.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

{availableVariants && availableVariants.length > 0 && (
							<Select
								variant="secondary"
								aria-label="Variante"
								value={selectedVariantId ?? 'all'}
								onChange={(key) => setSelectedVariantId(key === 'all' ? null : (key as string))}
							>
								<Label>Variante {isUnlimitedStock ? '(obrigatório)' : '(opcional)'}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{!isUnlimitedStock && (
											<ListBox.Item id="all" textValue="Todas as variantes">
												<span className="text-muted">Todas as variantes</span>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										)}
										{availableVariants.map((variant) => (
												<ListBox.Item id={variant.id} key={variant.id} textValue={variant.name}>
													<span>{variant.name}</span>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							)}

							<TextField variant="secondary" name="contents" isRequired>
								<Label>Conteúdos (um por linha)</Label>
								<TextArea variant="secondary"
									placeholder={
										selectedType === DigitalItemType.Key
											? 'XXXX-XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ-ZZZZ'
											: 'valor1\nvalor2\nvalor3'
									}
									className="min-h-32 resize-y"
								/>
								<FieldError />
							</TextField>

							<p className="text-xs text-muted">Valores duplicados serão automaticamente ignorados.</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="primary" isPending={isPending}>
								<Icon icon={Upload04Icon} className="icon-xs" />
								Importar Itens
							</AsyncButton>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

interface CreateDigitalItemPendingModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: (item: PendingDigitalItem) => void;
}

function CreateDigitalItemPendingModal({ isOpen, onOpenChange, onSuccess }: CreateDigitalItemPendingModalProps) {
	const [selectedType, setSelectedType] = useState<DigitalItemType>(DigitalItemType.Key);

	interface FormState {
		errors: Record<string, string> | null;
	}

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const content = (formData.get('content') as string)?.trim();

			if (!content) {
				return { errors: { content: 'Conteúdo é obrigatório' } };
			}

			const pendingItem: PendingDigitalItem = {
				tempId: crypto.randomUUID(),
				type: selectedType,
				content,
				variantId: null,
			};

			onSuccess(pendingItem);
			return { errors: null };
		},
		{ errors: null }
	);

	function handleClose() {
		onOpenChange(false);
	}

	const typeParse = digitalItemTypeParse[selectedType];

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Key01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Adicionar Item Digital</Modal.Heading>
						<p className="text-sm text-muted">O item será criado junto com o produto</p>
					</Modal.Header>
					<Form action={formAction} validationErrors={state.errors ?? undefined}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<Select
									variant="secondary"
									aria-label="Tipo"
									value={selectedType}
									onChange={(key) => setSelectedType(key as DigitalItemType)}
								>
									<Label>Tipo</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{digitalItemTypeOptions.map((option) => (
												<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(option.color)}>
														{option.icon}
														{option.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>

								<TextField variant="secondary" name="content" isRequired>
									<Label>Conteúdo</Label>
									<Input variant="secondary"
										placeholder={
											selectedType === DigitalItemType.Key
												? 'XXXX-XXXX-XXXX-XXXX'
												: selectedType === DigitalItemType.DownloadLink || selectedType === DigitalItemType.ExternalLink
													? 'https://...'
													: 'ABC123'
										}
									/>
									<p className="text-xs text-muted mt-1">{typeParse.description}</p>
									<FieldError />
								</TextField>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="primary" isPending={isPending}>
								<Icon icon={Add01Icon} className="icon-xs" />
								Adicionar
							</AsyncButton>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

interface BulkCreatePendingModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSuccess: (items: PendingDigitalItem[]) => void;
}

function BulkCreatePendingModal({ isOpen, onOpenChange, onSuccess }: BulkCreatePendingModalProps) {
	const [selectedType, setSelectedType] = useState<DigitalItemType>(DigitalItemType.Key);

	interface FormState {
		errors: Record<string, string> | null;
	}

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const contents = (formData.get('contents') as string)?.trim();

			if (!contents) {
				return { errors: { contents: 'Pelo menos um valor é obrigatório' } };
			}

			const lines = contents
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0);

			if (lines.length === 0) {
				return { errors: { contents: 'Pelo menos um valor é obrigatório' } };
			}

			const uniqueContents = [...new Set(lines)];

			const pendingItems: PendingDigitalItem[] = uniqueContents.map((content) => ({
				tempId: crypto.randomUUID(),
				type: selectedType,
				content,
				variantId: null,
			}));

			onSuccess(pendingItems);
			return { errors: null };
		},
		{ errors: null }
	);

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Upload04Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Importar Itens em Massa</Modal.Heading>
						<p className="text-sm text-muted">Os itens serão criados junto com o produto</p>
					</Modal.Header>
					<Form action={formAction} validationErrors={state.errors ?? undefined}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<Select
									variant="secondary"
									aria-label="Tipo"
									value={selectedType}
									onChange={(key) => setSelectedType(key as DigitalItemType)}
								>
									<Label>Tipo</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{digitalItemTypeOptions.map((option) => (
												<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(option.color)}>
														{option.icon}
														{option.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>

								<TextField variant="secondary" name="contents" isRequired>
									<Label>Conteúdos (um por linha)</Label>
									<TextArea variant="secondary"
										placeholder={
											selectedType === DigitalItemType.Key
												? 'XXXX-XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ-ZZZZ'
												: 'valor1\nvalor2\nvalor3'
										}
										className="min-h-32 resize-y"
									/>
									<FieldError />
								</TextField>

								<p className="text-xs text-muted">Valores duplicados serão automaticamente ignorados.</p>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="primary" isPending={isPending}>
								<Icon icon={Upload04Icon} className="icon-xs" />
								Importar Itens
							</AsyncButton>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

function DigitalItemsListSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 3 }).map((_, i) => (
				<Skeleton key={i} className="h-16 rounded-lg" />
			))}
		</div>
	);
}

interface DigitalItemsListContentProps {
	items: MinimalDigitalItem[];
	merchantId: string;
	productId: string;
	variants?: ProductVariant[];
	stats: DigitalItemStats | null;
	isUnlimitedStock: boolean;
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	filters: {
		status: DigitalItemStatus | null;
		type: DigitalItemType | null;
		variantId: string | null;
	};
	onFiltersChange: (filters: {
		status: DigitalItemStatus | null;
		type: DigitalItemType | null;
		variantId: string | null;
	}) => void;
	onPageChange: (page: number) => void;
	onItemDeleted: (itemId: string) => void;
	onDeleteError: (item: MinimalDigitalItem) => void;
	onItemUpdated: (updatedItem: MinimalDigitalItem) => void;
	onRefresh: () => void;
	isRefreshing: boolean;
}

function getPendingDigitalItemsColumns(
	visibleValues: Set<string>,
	toggleValueVisibility: (id: string) => void,
	handleRemove: (tempId: string) => void
): DataTableColumn<PendingDigitalItem>[] {
	return [
		{
			key: 'content',
			header: 'Conteúdo',
			render: (item) => {
				const typeParse = digitalItemTypeParse[item.type];
				const isVisible = visibleValues.has(item.tempId);
				return (
					<div className="flex items-center gap-3">
						<Avatar size="sm" className="shrink-0">
							<Avatar.Fallback className={`bg-${typeParse.color}/10 text-${typeParse.color}`}>
								{typeParse.icon}
							</Avatar.Fallback>
						</Avatar>
						<span className={`${isVisible ? '' : 'visual-blur'} font-mono text-sm break-all`}>
							{item.content}
						</span>
					</div>
				);
			},
		},
		{
			key: 'type',
			header: 'Tipo',
			width: '140px',
			render: (item) => {
				const typeParse = digitalItemTypeParse[item.type];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(typeParse.color)} size="sm" className="gap-1">
						{typeParse.icon}
						{typeParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			width: '130px',
			render: () => (
				<Chip variant="soft" color="warning" size="sm">
					Pendente
				</Chip>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			width: '140px',
			align: 'center',
			render: (item) => {
				const isVisible = visibleValues.has(item.tempId);
				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary" onPress={() => toggleValueVisibility(item.tempId)}>
								<Icon icon={isVisible ? ViewOffIcon : ViewIcon} className="icon-xs" />
								<Tooltip.Content>{isVisible ? 'Ocultar' : 'Mostrar'}</Tooltip.Content>
							</Button>
						</Tooltip>
						<Tooltip>
							<Button
								isIconOnly
								size="sm"
								variant="tertiary"
								onPress={() => {
									void navigator.clipboard.writeText(item.content).catch(() => undefined);
									toast('Copiado', {
										description: 'Valor copiado para a área de transferência.',
										indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
										variant: 'success',
									});
								}}
							>
								<Icon icon={Copy01Icon} className="icon-xs" />
								<Tooltip.Content>Copiar</Tooltip.Content>
							</Button>
						</Tooltip>
						<Tooltip>
							<Button
								isIconOnly
								size="sm"
								variant="tertiary"
								className="text-danger"
								onPress={() => handleRemove(item.tempId)}
							>
								<Icon icon={Delete02Icon} className="icon-xs" />
								<Tooltip.Content>Remover</Tooltip.Content>
							</Button>
						</Tooltip>
					</div>
				);
			},
		},
	];
}

function getDigitalItemsColumns(
	visibleValues: Set<string>,
	toggleValueVisibility: (id: string) => void,
	deletingIds: Set<string>,
	updatingIds: Set<string>,
	handleDelete: (item: MinimalDigitalItem) => void,
	handleChangeStatus: (item: MinimalDigitalItem, status: DigitalItemStatus) => void,
	isUnlimitedStock: boolean
): DataTableColumn<MinimalDigitalItem>[] {
	return [
		{
			key: 'content',
			header: 'Conteúdo',
			render: (item) => {
				const typeParse = digitalItemTypeParse[item.type];
				const isVisible = visibleValues.has(item.id);
				return (
					<div className="flex items-center gap-3">
						<Avatar size="sm" className="shrink-0">
							<Avatar.Fallback className={`bg-${typeParse.color}/10 text-${typeParse.color}`}>
								{typeParse.icon}
							</Avatar.Fallback>
						</Avatar>
						<div className="flex flex-col min-w-0">
							{digitalItemTypeParse[item.type].label}
							<span className={`${isVisible ? '' : 'visual-blur'} font-mono text-sm break-all`}>
								{item.content}
							</span>
							{item.label && <span className="text-xs text-muted truncate">{item.label}</span>}
						</div>
					</div>
				);
			},
		},
		{
			key: 'type',
			header: 'Tipo',
			width: '140px',
			render: (item) => {
				const typeParse = digitalItemTypeParse[item.type];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(typeParse.color)} size="sm" className="gap-1">
						{typeParse.icon}
						{typeParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			width: '130px',
			render: (item) => {
				const statusParse = digitalItemStatusParse[item.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'variant',
			header: 'Variante',
			width: '140px',
			render: (item) => <span className="text-sm text-muted">{item.variantName ?? '—'}</span>,
		},
		{
			key: 'delivery',
			header: 'Nº Pedido',
			width: '200px',
			render: (item) => {
				if (item.status !== DigitalItemStatus.Delivered || !item.deliveredToOrderNumber) {
					return <span className="text-sm text-muted">—</span>;
				}
				return (
					<span className="flex items-center gap-1 text-sm text-success">
						<span className="text-sm font-mono font-medium text-accent">{item.deliveredToOrderNumber}</span>
					</span>
				);
			},
		},
		{
			key: 'actions',
			header: 'Ações',
			width: '140px',
			align: 'center',
			render: (item) => {
				const isVisible = visibleValues.has(item.id);
				const isDeleting = deletingIds.has(item.id);
				const isUpdating = updatingIds.has(item.id);
				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary" onPress={() => toggleValueVisibility(item.id)}>
								<Icon icon={isVisible ? ViewOffIcon : ViewIcon} className="icon-xs" />
								<Tooltip.Content>{isVisible ? 'Ocultar' : 'Mostrar'}</Tooltip.Content>
							</Button>
						</Tooltip>
						<Tooltip>
							<Button
								isIconOnly
								size="sm"
								variant="tertiary"
								onPress={() => {
									void navigator.clipboard.writeText(item.content).catch(() => undefined);
									toast('Copiado', {
										description: 'Valor copiado para a área de transferência.',
										indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
										variant: 'success',
									});
								}}
							>
								<Icon icon={Copy01Icon} className="icon-xs" />
								<Tooltip.Content>Copiar</Tooltip.Content>
							</Button>
						</Tooltip>
						<Dropdown>
							<Tooltip>
								<Button size="sm" variant="tertiary" aria-label="Ações" isDisabled={isUpdating || isDeleting}>
									<Icon icon={MoreVerticalIcon} className="icon-xs" />
									Ações
									<Tooltip.Content>Ações</Tooltip.Content>
								</Button>
							</Tooltip>
							<Dropdown.Popover placement="bottom end">
								<Dropdown.Menu
									disabledKeys={[
										item.status === DigitalItemStatus.Available ? 'available' : '',
										item.status === DigitalItemStatus.Disabled ? 'disabled' : '',
										item.status === DigitalItemStatus.Delivered ? 'delivered' : '',
										item.status === DigitalItemStatus.Reserved ? 'available' : '',
										item.status === DigitalItemStatus.Reserved ? 'disabled' : '',
										item.status === DigitalItemStatus.Reserved ? 'delivered' : '',
										item.status !== DigitalItemStatus.Disabled ? 'delete' : '',
									].filter(Boolean)}
									onAction={(key) => {
										if (key === 'available') handleChangeStatus(item, DigitalItemStatus.Available);
										if (key === 'disabled') handleChangeStatus(item, DigitalItemStatus.Disabled);
										if (key === 'delivered') handleChangeStatus(item, DigitalItemStatus.Delivered);
										if (key === 'delete') handleDelete(item);
									}}
								>
									<Dropdown.Section>
										<Header>Alterar status</Header>
										<Dropdown.Item id="available" textValue="Disponível">
											<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
											<div className="flex flex-col">
												<Label className="text-success">Disponível</Label>
											</div>
										</Dropdown.Item>
										<Dropdown.Item id="disabled" textValue="Desabilitado">
											<Icon icon={Cancel01Icon} className="icon-xs text-warning" />
											<div className="flex flex-col">
												<Label className="text-warning">Desabilitado</Label>
											</div>
										</Dropdown.Item>
										{!isUnlimitedStock && (
											<Dropdown.Item id="delivered" textValue="Entregue">
												<Icon icon={DeliveryBox01Icon} className="icon-xs text-accent" />
												<div className="flex flex-col">
													<Label className="text-accent">Entregue</Label>
												</div>
											</Dropdown.Item>
										)}
									</Dropdown.Section>
									<Dropdown.Section>
										<Dropdown.Item id="delete" textValue="Deletar" variant="danger">
											<Icon icon={Delete02Icon} className="icon-xs text-danger" />
											<div className="flex flex-col">
												<Label className="text-danger">Deletar</Label>
												{item.status !== DigitalItemStatus.Disabled && (
													<Description>Desabilite o item primeiro</Description>
												)}
											</div>
										</Dropdown.Item>
									</Dropdown.Section>
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					</div>
				);
			},
		},
	];
}

function DigitalItemsListContent({
	items,
	merchantId,
	productId,
	variants,
	stats: _stats,
	isUnlimitedStock,
	pagination,
	filters,
	onFiltersChange,
	onPageChange,
	onItemDeleted,
	onDeleteError,
	onItemUpdated,
	onRefresh,
	isRefreshing,
}: DigitalItemsListContentProps) {
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
	const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
	const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());

	function toggleValueVisibility(itemId: string) {
		setVisibleValues((prev) => {
			const next = new Set(prev);
			if (next.has(itemId)) {
				next.delete(itemId);
			} else {
				next.add(itemId);
			}
			return next;
		});
	}

	async function handleDelete(item: MinimalDigitalItem) {
		setDeletingIds((prev) => new Set(prev).add(item.id));
		onItemDeleted(item.id);

		const res = await deleteProductDigitalItem(merchantId, productId, item.id);

		setDeletingIds((prev) => {
			const next = new Set(prev);
			next.delete(item.id);
			return next;
		});

		if (res?.error) {
			toast('Erro ao deletar', {
				description: res.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			onDeleteError(item);
			return;
		}

		toast('Item deletado', {
			description: res?.message || 'O item foi deletado com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
		onRefresh();
	}

	async function handleChangeStatus(item: MinimalDigitalItem, newStatus: DigitalItemStatus) {
		if (item.status === newStatus) return;

		setUpdatingIds((prev) => new Set(prev).add(item.id));

		const res = await updateProductDigitalItem(merchantId, productId, item.id, {
			merchantId,
			productId,
			itemId: item.id,
			status: newStatus,
		});

		setUpdatingIds((prev) => {
			const next = new Set(prev);
			next.delete(item.id);
			return next;
		});

		if (res?.error) {
			toast('Erro ao atualizar', {
				description: res.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		const updatedItem: MinimalDigitalItem = {
			...item,
			status: newStatus,
		};
		onItemUpdated(updatedItem);

		const statusMessages: Record<DigitalItemStatus, string> = {
			[DigitalItemStatus.Available]: 'Item marcado como disponível.',
			[DigitalItemStatus.Disabled]: 'Item desabilitado com sucesso.',
			[DigitalItemStatus.Delivered]: 'Item marcado como entregue.',
			[DigitalItemStatus.Reserved]: 'Item reservado.',
		};
		toast('Status atualizado', {
			description: statusMessages[newStatus],
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
		onRefresh();
	}

	function handleClearFilters() {
		onFiltersChange({ status: null, type: null, variantId: null });
	}

	function renderMobileDigitalItemCard(
		item: MinimalDigitalItem,
		_index: number,
		_openActions?: () => void
	): ReactNode {
		const typeParse = digitalItemTypeParse[item.type];
		const statusParse = digitalItemStatusParse[item.status];
		const isVisible = visibleValues.has(item.id);
		const isDeleting = deletingIds.has(item.id);
		const isUpdating = updatingIds.has(item.id);

		return (
			<div className="rounded-xl border border-border bg-surface p-3 overflow-hidden">
				<div className="flex items-center gap-3 mb-2">
					<Avatar size="sm">
						<Avatar.Fallback className={`bg-${typeParse.color}/10 text-${typeParse.color}`}>
							{typeParse.icon}
						</Avatar.Fallback>
					</Avatar>
					<div className="flex flex-col min-w-0 flex-1">
						<span className="text-xs text-muted">{typeParse.label}</span>
						<span className={`${isVisible ? '' : 'visual-blur'} font-mono text-sm break-all`}>
							{item.content}
						</span>
						{item.label && <span className="text-xs text-muted truncate">{item.label}</span>}
					</div>
				</div>

				<div className="flex items-center gap-2 mb-2">
					<Chip variant="soft" color={mapParseColorToChipColor(typeParse.color)} size="sm" className="gap-1">
						{typeParse.icon}
						{typeParse.label}
					</Chip>
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				</div>

				<div className="flex flex-col gap-1.5">
					{item.variantName && (
						<div className="flex items-center gap-1 text-xs text-muted">
							<span>Variante: {item.variantName}</span>
						</div>
					)}

					{item.status === DigitalItemStatus.Delivered && item.deliveredToOrderNumber && (
						<div className="flex items-center gap-1 text-xs">
							<Icon icon={DeliveryBox01Icon} className="icon-xs text-accent" />
							<span className="font-mono text-accent">#{item.deliveredToOrderNumber}</span>
						</div>
					)}

					<div className="flex items-center gap-2 text-xs text-muted pt-1">
						<Icon icon={isVisible ? ViewOffIcon : ViewIcon} className="icon-xs" />
						<span>{isVisible ? 'Visível' : 'Oculto'}</span>
						{(isDeleting || isUpdating) && (
							<>
								<span>•</span>
								<span>{isDeleting ? 'Deletando...' : 'Atualizando...'}</span>
							</>
						)}
					</div>
				</div>
			</div>
		);
	}

	const hasFilters = filters.status !== null || filters.type !== null || filters.variantId !== null;

	const columns = getDigitalItemsColumns(
		visibleValues,
		toggleValueVisibility,
		deletingIds,
		updatingIds,
		handleDelete,
		handleChangeStatus,
		isUnlimitedStock
	);

	const variantOptions = variants?.map((v) => ({ value: v.id, label: v.name })) ?? [];

	return (
		<DataTable
			className="pt-4"
			columns={columns}
			data={items}
			keyExtractor={(item) => item.id}
			renderMobileCard={renderMobileDigitalItemCard}
			isLoading={isRefreshing}
			skeletonRows={5}
			emptyMessage="Nenhum item digital encontrado"
			filters={{
				children: (
					<>
						<Select
							variant="secondary"
							aria-label="Status"
							value={filters.status ?? 'all'}
							onChange={(key) =>
								onFiltersChange({ ...filters, status: key === 'all' ? null : (key as DigitalItemStatus) })
							}
							className="w-full xl:w-44"
						>
							<Label>Status</Label>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									<ListBox.Item id="all" textValue="Todos">
										<span className="text-muted">Todos os status</span>
										<ListBox.ItemIndicator />
									</ListBox.Item>
									{digitalItemStatusOptions
										.filter((option) => !(isUnlimitedStock && option.value === DigitalItemStatus.Delivered))
										.map((option) => (
											<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(option.color)} size="sm">
													{option.icon}
													{option.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
								</ListBox>
							</Select.Popover>
						</Select>
						<Select
							variant="secondary"
							aria-label="Tipo"
							value={filters.type ?? 'all'}
							onChange={(key) => onFiltersChange({ ...filters, type: key === 'all' ? null : (key as DigitalItemType) })}
							className="w-full xl:w-44"
						>
							<Label>Tipo</Label>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									<ListBox.Item id="all" textValue="Todos">
										<span className="text-muted">Todos os tipos</span>
										<ListBox.ItemIndicator />
									</ListBox.Item>
									{digitalItemTypeOptions.map((option) => (
										<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
											<Chip variant="soft" color={mapParseColorToChipColor(option.color)} size="sm">
												{option.icon}
												{option.label}
											</Chip>
											<ListBox.ItemIndicator />
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
						{variantOptions.length > 0 && (
							<Select
								variant="secondary"
								aria-label="Variante"
								value={filters.variantId ?? 'all'}
								onChange={(key) => onFiltersChange({ ...filters, variantId: key === 'all' ? null : (key as string) })}
								className="w-full xl:w-44"
							>
								<Label>Variante</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id="all" textValue="Todas">
											<span className="text-muted">Todas as variantes</span>
											<ListBox.ItemIndicator />
										</ListBox.Item>
										{variantOptions.map((option) => (
											<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
												<span>{option.label}</span>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						)}
					</>
				),
				hasFilters,
				onClear: handleClearFilters,
				onRefresh,
				isRefreshing,
			}}
			pagination={{
				page: pagination.page,
				pageSize: pagination.pageSize,
				totalItems: pagination.totalItems,
				totalPages: pagination.totalPages,
				onPageChange,
				isNavigating: isRefreshing,
			}}
		/>
	);
}

export function DigitalItemsSection({
	merchantId,
	productId,
	variants,
	pendingItems,
	onPendingItemsChange,
	isUnlimitedStock,
	onUnlimitedStockChange,
	disabled,
}: DigitalItemsSectionProps) {
	const isCreateMode = productId === null;
	const [items, setItems] = useState<MinimalDigitalItem[] | null>(isCreateMode ? [] : null);
	const [stats, setStats] = useState<DigitalItemStats | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [visiblePendingValues, setVisiblePendingValues] = useState<Set<string>>(new Set());
	const [isPending, startTransition] = useTransition();

	const [filters, setFilters] = useState<{
		status: DigitalItemStatus | null;
		type: DigitalItemType | null;
		variantId: string | null;
	}>({ status: null, type: null, variantId: null });

	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalItems: 0,
		totalPages: 0,
	});

	const isLoading = !isCreateMode && productId !== null && items === null;

	function fetchData(page = pagination.page) {
		if (isCreateMode || !productId) return;

		startTransition(async () => {
			const res = await listProductDigitalItems(merchantId, productId, {
				page,
				pageSize: pagination.pageSize,
				status: filters.status,
				type: filters.type,
				variantId: filters.variantId,
			});

			if (res?.error) {
				setError(res.error.message);
				setItems([]);
				return;
			}

			const data = res?.data;
			setItems(data?.items?.items ?? []);
			setStats(data?.stats ?? null);
			setPagination({
				page: data?.items?.page ?? 1,
				pageSize: data?.items?.pageSize ?? 10,
				totalItems: data?.items?.totalItems ?? 0,
				totalPages: data?.items?.totalPages ?? 0,
			});
		});
	}

	useEffect(() => {
		fetchData(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [merchantId, productId, isCreateMode, filters]);

	function handleRefresh() {
		if (isCreateMode || !productId) return;
		fetchData(pagination.page);
	}

	function handlePageChange(page: number) {
		fetchData(page);
	}

	function handleFiltersChange(newFilters: typeof filters) {
		setFilters(newFilters);
	}

	function handleItemDeleted(itemId: string) {
		setItems((prev) => prev?.filter((item) => item.id !== itemId) ?? []);
	}

	function handleDeleteError(item: MinimalDigitalItem) {
		setItems((prev) => {
			if (!prev) return [item];
			if (prev.some((i) => i.id === item.id)) return prev;
			return [...prev, item];
		});
	}

	function handleItemUpdated(updatedItem: MinimalDigitalItem) {
		setItems((prev) => prev?.map((item) => (item.id === updatedItem.id ? updatedItem : item)) ?? []);
	}

	function handlePendingItemAdded(item: PendingDigitalItem) {
		onPendingItemsChange?.([...(pendingItems ?? []), item]);
		setIsCreateModalOpen(false);
		toast('Item adicionado', {
			description: 'Será criado junto com o produto.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handlePendingBulkAdded(newItems: PendingDigitalItem[]) {
		onPendingItemsChange?.([...(pendingItems ?? []), ...newItems]);
		setIsBulkModalOpen(false);
		toast('Itens adicionados', {
			description: `${newItems.length} itens serão criados junto com o produto.`,
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleRemovePendingItem(tempId: string) {
		onPendingItemsChange?.(pendingItems?.filter((item) => item.tempId !== tempId) ?? []);
	}

	function togglePendingValueVisibility(tempId: string) {
		setVisiblePendingValues((prev) => {
			const next = new Set(prev);
			if (next.has(tempId)) {
				next.delete(tempId);
			} else {
				next.add(tempId);
			}
			return next;
		});
	}

	function renderMobilePendingDigitalItemCard(
		item: PendingDigitalItem,
		_index: number,
		_openActions?: () => void
	): ReactNode {
		const typeParse = digitalItemTypeParse[item.type];
		const isVisible = visiblePendingValues.has(item.tempId);

		return (
			<div className="rounded-xl border border-border bg-surface p-3 overflow-hidden">
				<div className="flex items-center gap-3 mb-2">
					<Avatar size="sm">
						<Avatar.Fallback className={`bg-${typeParse.color}/10 text-${typeParse.color}`}>
							{typeParse.icon}
						</Avatar.Fallback>
					</Avatar>
					<div className="flex flex-col min-w-0 flex-1">
						<span className="text-xs text-muted">{typeParse.label}</span>
						<span className={`${isVisible ? '' : 'visual-blur'} font-mono text-sm break-all`}>
							{item.content}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 mb-2">
					<Chip variant="soft" color={mapParseColorToChipColor(typeParse.color)} size="sm" className="gap-1">
						{typeParse.icon}
						{typeParse.label}
					</Chip>
					<Chip variant="soft" color="warning" size="sm">
						Pendente
					</Chip>
				</div>

				<div className="flex items-center gap-2 text-xs text-muted pt-1">
					<Icon icon={isVisible ? ViewOffIcon : ViewIcon} className="icon-xs" />
					<span>{isVisible ? 'Visível' : 'Oculto'}</span>
				</div>
			</div>
		);
	}

	const availableCount = stats?.availableItems ?? 0;
	const pendingCount = pendingItems?.length ?? 0;
	const totalItemsCount = stats?.totalItems ?? 0;
	const totalItemCount = isCreateMode ? pendingCount : totalItemsCount;
	const variantsCount = variants?.length ?? 0;
	const maxItemsAllowed = variantsCount > 0 ? variantsCount : 1;
	const canAddItems = !isUnlimitedStock || totalItemCount < maxItemsAllowed;

	return (
		<>
			<Card>
				<div className="flex flex-col gap-4">
					<SectionHeader
						icon={<Icon icon={Key01Icon} className="icon-sm text-muted" />}
						title="Itens Digitais"
						description="Chaves, links ou códigos entregues após a compra"
						action={
							!disabled && (
								<div className="flex items-center gap-2">
									{!isCreateMode && stats && (
										<Chip variant="soft" color="accent" size="sm">
											{availableCount} disponível{availableCount !== 1 ? 'eis' : ''}
										</Chip>
									)}
									{isCreateMode && pendingCount > 0 && (
										<Chip variant="soft" color="warning" size="sm">
											{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
										</Chip>
									)}
									{!isUnlimitedStock && (
										<Button
											variant="secondary"
											size="sm"
											onPress={() => setIsBulkModalOpen(true)}
										>
											<Icon icon={Upload04Icon} className="icon-xs" />
											Importar
										</Button>
									)}
									<Button
										variant="primary"
										size="sm"
										onPress={() => setIsCreateModalOpen(true)}
										isDisabled={!canAddItems}
									>
										<Icon icon={Add01Icon} className="icon-xs" />
										Adicionar
									</Button>
								</div>
							)
						}
					/>

					{onUnlimitedStockChange && (
						<div className="pt-2 border-t border-border">
							<Switch
								isSelected={!isUnlimitedStock}
								onChange={(isSelected) => onUnlimitedStockChange(!isSelected)}
								isDisabled={disabled}
							>
								<div className="flex w-full items-center justify-between gap-3">
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
									<div className="flex flex-col gap-1">
										<Label className="text-sm">Controlar estoque de itens digitais</Label>
										<Description>Ative para consumir itens únicos a cada compra</Description>
									</div>
								</div>
							</Switch>
						</div>
					)}

					{isUnlimitedStock && (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 text-accent">
							<Icon icon={InformationCircleIcon} className="icon-sm mt-0.5 shrink-0" />
							<p className="text-xs">
								{variantsCount > 0
									? `Com estoque ilimitado e ${variantsCount} variante${variantsCount > 1 ? 's' : ''}, você pode cadastrar 1 item digital por variante. Cada item será entregue para todos os compradores da respectiva variante.`
									: 'Com estoque ilimitado, você pode cadastrar apenas 1 item digital. Este item será entregue para todos os compradores, ideal para links de acesso ou conteúdos reutilizáveis.'}
							</p>
						</div>
					)}
				</div>
			</Card>

			{isCreateMode ? (
				<DataTable
					columns={getPendingDigitalItemsColumns(
						visiblePendingValues,
						togglePendingValueVisibility,
						handleRemovePendingItem
					)}
					data={pendingItems ?? []}
					keyExtractor={(item) => item.tempId}
					renderMobileCard={renderMobilePendingDigitalItemCard}
					skeletonRows={3}
					emptyMessage="Nenhum item digital adicionado"
					className="pt-4"
				/>
			) : isLoading ? (
				<DigitalItemsListSkeleton />
			) : error ? (
				<div className="flex flex-col items-center justify-center py-8 gap-2">
					<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
					<p className="text-sm text-muted">{error}</p>
				</div>
			) : (
				<DigitalItemsListContent
					items={items ?? []}
					merchantId={merchantId}
					productId={productId!}
					variants={variants}
					stats={stats}
					isUnlimitedStock={isUnlimitedStock ?? false}
					pagination={pagination}
					filters={filters}
					onFiltersChange={handleFiltersChange}
					onPageChange={handlePageChange}
					onItemDeleted={handleItemDeleted}
					onDeleteError={handleDeleteError}
					onItemUpdated={handleItemUpdated}
					onRefresh={handleRefresh}
					isRefreshing={isPending}
				/>
			)}

			{isCreateMode ? (
				<>
					<CreateDigitalItemPendingModal
						isOpen={isCreateModalOpen}
						onOpenChange={setIsCreateModalOpen}
						onSuccess={handlePendingItemAdded}
					/>
					<BulkCreatePendingModal
						isOpen={isBulkModalOpen}
						onOpenChange={setIsBulkModalOpen}
						onSuccess={handlePendingBulkAdded}
					/>
				</>
			) : (
				<>
					<CreateDigitalItemModal
						isOpen={isCreateModalOpen}
						onOpenChange={setIsCreateModalOpen}
						merchantId={merchantId}
						productId={productId!}
						variants={variants}
						isUnlimitedStock={isUnlimitedStock}
						variantIdsWithItems={stats?.variantIdsWithItems}
						onSuccess={handleRefresh}
					/>
					<BulkCreateModal
						isOpen={isBulkModalOpen}
						onOpenChange={setIsBulkModalOpen}
						merchantId={merchantId}
						productId={productId!}
						variants={variants}
						isUnlimitedStock={isUnlimitedStock}
						variantIdsWithItems={stats?.variantIdsWithItems}
						onSuccess={handleRefresh}
					/>
				</>
			)}
		</>
	);
}
