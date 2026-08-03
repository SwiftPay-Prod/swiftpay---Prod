'use client';

import { useState, useMemo } from 'react';
import { Modal, Button, Chip, Skeleton, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AddCircleIcon, Delete02Icon, PencilEdit01Icon, Tag01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { listMerchantCategories, deleteMerchantCategory } from '@/app/actions/merchant/products';
import { categoryStatusParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { SearchFilter } from '@/components/ui/search-filter';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { InlineList } from '@/components/ui/inline-list';
import { CategoryModal } from './category-modal';
import { toast } from '@heroui/react';
import type { MinimalCategoryData } from '@/types/merchant/products';
import type { PaymentEnvironment } from '@/types/enums';

interface CategoriesModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	environment: PaymentEnvironment;
	initialCategories: MinimalCategoryData[];
	onCategoriesChange: () => void;
}

function CategoriesSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-60 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-14 rounded-lg" />
			))}
		</div>
	);
}

type CategoryModalMode = 'create' | 'edit';

export function CategoriesModal({
	isOpen,
	onOpenChange,
	merchantId,
	environment,
	initialCategories,
	onCategoriesChange,
}: CategoriesModalProps) {
	const [categories, setCategories] = useState<MinimalCategoryData[]>(initialCategories);
	const [isLoading, setIsLoading] = useState(false);
	const [searchValue, setSearchValue] = useState('');

	// Category Modal state (create/edit)
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
	const [categoryModalMode, setCategoryModalMode] = useState<CategoryModalMode>('create');
	const [editingCategory, setEditingCategory] = useState<MinimalCategoryData | null>(null);

	// Delete state
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deletingCategory, setDeletingCategory] = useState<MinimalCategoryData | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const filteredCategories = useMemo(
		() => categories.filter((c) => c.name.toLowerCase().includes(searchValue.toLowerCase())),
		[categories, searchValue]
	);

	async function refreshCategories() {
		setIsLoading(true);
		const res = await listMerchantCategories(merchantId, { environment, pageSize: 100 });
		if (res?.data) {
			setCategories(res.data.items);
		}
		setIsLoading(false);
		onCategoriesChange();
	}

	function handleOpenCreate() {
		setEditingCategory(null);
		setCategoryModalMode('create');
		setIsCategoryModalOpen(true);
	}

	function handleOpenEdit(category: MinimalCategoryData) {
		setEditingCategory(category);
		setCategoryModalMode('edit');
		setIsCategoryModalOpen(true);
	}

	function handleCategoryModalClose(open: boolean) {
		setIsCategoryModalOpen(open);
		if (!open) setEditingCategory(null);
	}

	function handleCategorySuccess() {
		setIsCategoryModalOpen(false);
		setEditingCategory(null);
		refreshCategories();
	}

	function handleOpenDelete(category: MinimalCategoryData) {
		setDeletingCategory(category);
		setIsDeleteOpen(true);
	}

	async function handleConfirmDelete() {
		if (!deletingCategory) return;

		setIsDeleting(true);
		const res = await deleteMerchantCategory(merchantId, deletingCategory.id);
		setIsDeleting(false);

		if (res?.error) {
			toast('Erro ao excluir categoria', {
				description: res.error.message ?? 'Não foi possível excluir a categoria.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
		} else {
			toast('Categoria excluída', {
				description: res?.message ?? 'A categoria foi excluída com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			setIsDeleteOpen(false);
			setDeletingCategory(null);
			await refreshCategories();
		}
	}

	return (
		<>
			<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-2xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={Tag01Icon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Categorias</Modal.Heading>
							<p className="text-sm text-muted">Gerencie as categorias dos seus produtos</p>
						</Modal.Header>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<div className="flex items-end justify-between gap-4">
									<SearchFilter
										defaultValue={searchValue}
										onChange={setSearchValue}
										placeholder="Buscar categoria..."
										className="flex-1"
									/>
									<Button variant="primary" onPress={handleOpenCreate}>
										<Icon icon={AddCircleIcon} className="icon-sm" />
										Nova Categoria
									</Button>
								</div>

								{isLoading ? (
									<CategoriesSkeleton />
								) : (
									<InlineList
										items={filteredCategories}
										getKey={(category) => category.id}
										getTitle={(category) => category.name}
										getSubtitle={(category) =>
											`${category.productCount} produtos • Criado em ${formatDate(category.createdAt)}`
										}
										renderLeading={() => <Icon icon={Tag01Icon} className="icon-sm text-accent" />}
										renderTrailing={(category) => {
											const statusParsed = categoryStatusParse[category.status];
											return (
												<Chip
													variant="soft"
													color={mapParseColorToChipColor(statusParsed.color)}
													size="sm"
													className="gap-1"
												>
													{statusParsed.icon}
													{statusParsed.label}
												</Chip>
											);
										}}
										renderActions={(category) => (
											<>
												<Tooltip>
													<Button isIconOnly size="sm" variant="tertiary" onPress={() => handleOpenEdit(category)}>
														<Icon icon={PencilEdit01Icon} className="icon-xs" />
														<Tooltip.Content>Editar</Tooltip.Content>
													</Button>
												</Tooltip>
												<Tooltip>
													<Button
														isIconOnly
														size="sm"
														variant="tertiary"
														className="text-danger"
														onPress={() => handleOpenDelete(category)}
													>
														<Icon icon={Delete02Icon} className="icon-xs" />
														<Tooltip.Content>Excluir</Tooltip.Content>
													</Button>
												</Tooltip>
											</>
										)}
										empty={
											<div className="flex flex-col items-center justify-center py-12 text-muted">
												<Icon icon={Tag01Icon} className="icon-lg mb-2" />
												<span>Nenhuma categoria cadastrada</span>
											</div>
										}
									/>
								)}
							</div>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			{/* Category Modal (Create/Edit) */}
			<CategoryModal
				isOpen={isCategoryModalOpen}
				onOpenChange={handleCategoryModalClose}
				merchantId={merchantId}
				environment={environment}
				mode={categoryModalMode}
				category={editingCategory}
				onSuccess={handleCategorySuccess}
			/>

			{/* Delete Confirmation Modal */}
			<ConfirmationModal
				isOpen={isDeleteOpen}
				onOpenChange={(open) => {
					setIsDeleteOpen(open);
					if (!open) setDeletingCategory(null);
				}}
				title="Excluir Categoria"
				description={`Tem certeza que deseja excluir a categoria "${deletingCategory?.name}"? Esta ação não pode ser desfeita.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={handleConfirmDelete}
				isPending={isDeleting}
			/>
		</>
	);
}

