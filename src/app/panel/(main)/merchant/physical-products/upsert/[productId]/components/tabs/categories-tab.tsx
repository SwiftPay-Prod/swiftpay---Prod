'use client';

import { useState } from 'react';
import { toast } from '@heroui/react';
import { TextField, Label, Input, Button, Chip, Modal } from '@heroui/react';
import { CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { CategorySearchCombobox } from '@/components/merchant/products/category-search-combobox';
import { createMerchantCategory } from '@/app/actions/merchant/products';
import type { MinimalCategoryData } from '@/types/merchant/products';
import type { PaymentEnvironment } from '@/types/enums';
import type { CategoriesTabProps } from './types';

function CreateCategoryModal({
	isOpen,
	onOpenChange,
	merchantId,
	environment,
	onSuccess,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	merchantId: string;
	environment: PaymentEnvironment;
	onSuccess: (category: MinimalCategoryData) => void;
}) {
	const [categoryName, setCategoryName] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	async function handleCreateCategory() {
		if (!categoryName.trim()) return;

		setIsCreating(true);
		const response = await createMerchantCategory(merchantId, {
			name: categoryName.trim(),
			environment,
		});
		setIsCreating(false);

		if (response?.error) {
			toast('Erro ao criar', {
				description: response.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		if (response?.data) {
			toast('Categoria criada', {
				description: 'A categoria foi criada com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onSuccess(response.data);
			setCategoryName('');
			onOpenChange(false);
		}
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="sm" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>Nova Categoria</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<TextField variant="secondary">
							<Label>Nome da categoria</Label>
							<Input variant="secondary"
								placeholder="Ex: Camisetas, Calças, etc."
								value={categoryName}
								onChange={(e) => setCategoryName(e.target.value)}
								autoFocus
							/>
						</TextField>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<AsyncButton
							variant="primary"
							onPress={handleCreateCategory}
							isPending={isCreating}
							isDisabled={!categoryName.trim()}
						>
							Criar Categoria
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

export function CategoriesTab({
	merchantId,
	environment,
	categories,
	selectedCategoryIds,
	onSelectCategory,
	onRemoveCategory,
	onCategoryCreated,
	disabled,
}: CategoriesTabProps) {
	const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<CreateCategoryModal
				isOpen={isCreateCategoryOpen}
				onOpenChange={setIsCreateCategoryOpen}
				merchantId={merchantId}
				environment={environment}
				onSuccess={onCategoryCreated}
			/>

			<CategorySearchCombobox
				merchantId={merchantId}
				environment={environment}
				selectedCategoryIds={selectedCategoryIds}
				onSelect={onSelectCategory}
				isDisabled={disabled}
			/>

			{selectedCategoryIds.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedCategoryIds.map((id) => {
						const category = categories.find((c) => c.id === id);
						if (!category) return null;
						return (
							<Chip key={id} variant="soft">
								{category.name}
								{!disabled && (
									<button type="button" className="ml-1" onClick={() => onRemoveCategory(id)}>
										<Icon icon={CancelCircleIcon} className="icon-xs" />
									</button>
								)}
							</Chip>
						);
					})}
				</div>
			)}
		</div>
	);
}
